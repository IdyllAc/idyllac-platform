package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"net/smtp"
	"net/url"
	"os"

	_ "github.com/lib/pq"

	"github.com/gorilla/sessions"
	// "github.com/joho/godotenv"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/facebook"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"

	"github.com/idyllac/my-news-app/models"// Adjust this import path to your actual models package

	
)

var db *sql.DB

func main() {
	// Load env
	env := os.Getenv("ENV")
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	baseURL := os.Getenv("BASE_URL")
	if baseURL == "" {
		log.Fatal("❌ BASE_URL is required")
	}
	fmt.Println("Running in:", env)
	fmt.Println("Base URL:", baseURL)

	// Sessions
	secret := os.Getenv("SESSION_SECRET")
	if secret == "" {
		log.Fatal("❌ SESSION_SECRET is missing")
	}
	store := sessions.NewCookieStore([]byte(secret))
	store.MaxAge(86400 * 30)
	store.Options.Path = "/"
	store.Options.HttpOnly = true
	store.Options.Secure = true
	gothic.Store = store

	// OAuth
	goth.UseProviders(
		facebook.New(os.Getenv("FACEBOOK_KEY"), os.Getenv("FACEBOOK_SECRET"), baseURL+"/auth/facebook/callback"),
		google.New(os.Getenv("GOOGLE_KEY"), os.Getenv("GOOGLE_SECRET"), baseURL+"/auth/google/callback", "email", "profile"),
		github.New(os.Getenv("GITHUB_KEY"), os.Getenv("GITHUB_SECRET"), baseURL+"/auth/github/callback"),
	)

	// Connect DB
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("❌ DATABASE_URL is required")
	}
	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ Failed to connect to DB:", err)
	}
	models.DB = db
	createTables()

	// Static and routes
	fs := http.FileServer(http.Dir("./static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))
	http.HandleFunc("/", serveIndex)
	http.HandleFunc("/subscribe", serveSubscribe)
	http.HandleFunc("/subscriber/email", handleEmailSubscription)
	http.HandleFunc("/verify", handleEmailVerification)
	http.HandleFunc("/subscribers", handleListSubscribers)
	http.HandleFunc("/view-emails", handleViewEmails)
	http.HandleFunc("/submit", handleFormSubmission)
	// OAuth
	http.HandleFunc("/auth/facebook", handleOAuthLogin("facebook"))
	http.HandleFunc("/auth/facebook/callback", handleOAuthCallback("facebook"))
	http.HandleFunc("/auth/google", handleOAuthLogin("google"))
	http.HandleFunc("/auth/google/callback", handleOAuthCallback("google"))
	http.HandleFunc("/auth/github", handleOAuthLogin("github"))
	http.HandleFunc("/auth/github/callback", handleOAuthCallback("github"))

	log.Println("🌐 Server running at", baseURL, "on port", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

func createTables() {
	if db == nil {
		log.Fatal("❌ DB not initialized")
	}
	subscriberTable := `
	CREATE TABLE IF NOT EXISTS subscribers (
		id INTEGER PRIMARY KEY,
		email TEXT NOT NULL UNIQUE,
		verified BOOLEAN DEFAULT FALSE
	);`
	messageTable := `
	CREATE TABLE IF NOT EXISTS messages (
		id INTEGER PRIMARY KEY,
		subscriber_id INTEGER REFERENCES subscribers(id),
		message TEXT,
		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
	);`
	if _, err := db.Exec(subscriberTable); err != nil {
		log.Fatal("❌ Failed to create subscribers table:", err)
	}
	if _, err := db.Exec(messageTable); err != nil {
		log.Fatal("❌ Failed to create messages table:", err)
	}
}

// -------- Handlers Below ----------

func serveIndex(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Query().Get("lang") {
	case "ar":
		http.ServeFile(w, r, "./static/indexAr.html")
	case "fr":
		http.ServeFile(w, r, "./static/indexFr.html")
	case "en":
		http.ServeFile(w, r, "./static/indexEn.html")
	default:
		http.ServeFile(w, r, "./index.html")
	}
}

func serveSubscribe(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}
	switch r.URL.Query().Get("lang") {
	case "ar":
		http.ServeFile(w, r, "./static/subscribeAr.html")
	case "fr":
		http.ServeFile(w, r, "./static/subscribeFr.html")
	case "en":
		http.ServeFile(w, r, "./static/subscribeEn.html")
	default:
		http.ServeFile(w, r, "./static/subscribe.html")
	}
}

func handleEmailSubscription(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}
	email := r.FormValue("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	_, err := db.Exec(`INSERT INTO subscribers(email) VALUES($1) ON CONFLICT DO NOTHING`, email)
	if err != nil {
		http.Error(w, "❌ DB insert error: "+err.Error(), http.StatusInternalServerError)
		return
	}

	link := os.Getenv("BASE_URL") + "/verify?email=" + url.QueryEscape(email)
	sendConfirmationEmail(email, link)

	var id int
	err = db.QueryRow("SELECT id FROM subscribers WHERE email = $1", email).Scan(&id)
	if err != nil {
		http.Error(w, "❌ Could not retrieve subscriber ID", http.StatusInternalServerError)
		return
	}

	// Save to file
	if f, err := os.OpenFile("subscriber_emails.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644); err == nil {
		defer f.Close()
		f.WriteString(email + "\n")
	} else {
		log.Println("⚠️ File write failed:", err)
	}

	fmt.Fprint(w, "✅ Message received! Thank you.")
	log.Println("📥 New subscriber:", email)
	log.Println("🔗 Verification link:", link)
}

func sendConfirmationEmail(to, link string) {
	from := os.Getenv("EMAIL_ADDRESS")
	pass := os.Getenv("EMAIL_PASSWORD")
	if from == "" || pass == "" {
		log.Println("❌ EMAIL_ADDRESS or EMAIL_PASSWORD not set")
		return
	}

	msg := []byte("From: " + from + "\r\n" +
		"To: " + to + "\r\n" +
		"Subject: Please verify your email\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
		"Hello,\n\nPlease click the link below to confirm your subscription:\n\n" + link + "\n\nThanks!")

	err := smtp.SendMail("smtp.gmail.com:587", smtp.PlainAuth("", from, pass, "smtp.gmail.com"), from, []string{to}, msg)
	if err != nil {
		log.Println("❌ Email send failed:", err)
	} else {
		log.Println("✅ Email sent to:", to)
	}
}

func handleEmailVerification(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Missing email", http.StatusBadRequest)
		return
	}
	_, err := db.Exec("UPDATE subscribers SET verified = TRUE WHERE email = $1", email)
	if err != nil {
		http.Error(w, "❌ Verification failed: "+err.Error(), http.StatusInternalServerError)
		return
	}
	fmt.Fprintf(w, "✅ Thank you %s, your email is now verified!", email)
}

func handleListSubscribers(w http.ResponseWriter, r *http.Request) {
	rows, err := db.Query("SELECT email FROM subscribers WHERE verified = TRUE")
	if err != nil {
		http.Error(w, "Failed to fetch subscribers", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	for rows.Next() {
		var email string
		rows.Scan(&email)
		fmt.Fprintln(w, email)
	}
}

func handleViewEmails(w http.ResponseWriter, r *http.Request) {
	data, err := os.ReadFile("subscriber_emails.txt")
	if err != nil {
		http.Error(w, "❌ Cannot read file", http.StatusInternalServerError)
		return
	}
	w.Write(data)
}

func handleFormSubmission(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
		return
	}
	r.ParseForm()
	email := r.FormValue("email")
	message := r.FormValue("message")
	if email == "" || message == "" {
		http.Error(w, "Email and message required", http.StatusBadRequest)
		return
	}

	var id int
	err := db.QueryRow("SELECT id FROM subscribers WHERE email = $1", email).Scan(&id)
	if err != nil {
		http.Error(w, "Email not found", http.StatusBadRequest)
		return
	}

	_, err = db.Exec("INSERT INTO messages(subscriber_id, message) VALUES($1, $2)", id, message)
	if err != nil {
		http.Error(w, "Failed to save message", http.StatusInternalServerError)
		return
	}

	log.Printf("📩 New message from %s: %s\n", email, message)
	w.Write([]byte("✅ Message received!"))
}

// GET /auth/{provider}
func handleOAuthLogin(provider string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Inject provider into context so gothic can use it
		ctx := context.WithValue(r.Context(), gothic.ProviderParamKey, provider)
		r = r.WithContext(ctx)

		gothic.BeginAuthHandler(w, r)
	}
}

// GET /auth/{provider}/callback
func handleOAuthCallback(provider string) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// Inject provider into context so gothic can use it
		ctx := context.WithValue(r.Context(), gothic.ProviderParamKey, provider)
		r = r.WithContext(ctx)

		user, err := gothic.CompleteUserAuth(w, r)
		if err != nil {
			http.Error(w, fmt.Sprintf("❌ %s login failed: %v", provider, err), http.StatusInternalServerError)
			log.Printf("❌ %s login error: %v\n", provider, err)
			return
		}

		// Success
		log.Printf("✅ %s login successful for: %s (%s)\n", provider, user.Name, user.Email)
		fmt.Fprintf(w, "✅ Welcome %s! (%s)", user.Name, user.Email)
	}
}


