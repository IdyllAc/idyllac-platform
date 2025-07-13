package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
	"github.com/markbates/goth"
	"github.com/markbates/goth/gothic"
	"github.com/markbates/goth/providers/facebook"
	"github.com/markbates/goth/providers/github"
	"github.com/markbates/goth/providers/google"
	"gopkg.in/gomail.v2"
	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

var db *gorm.DB

type Subscriber struct {
	ID        uint      `gorm:"primaryKey"`
	Email     string    `gorm:"uniqueIndex;not null"`
	Confirmed bool      `gorm:"default:false"`
	Token     string    `gorm:"size:255"`
	CreatedAt time.Time
}

type Message struct {
	ID           uint      `gorm:"primaryKey"`
	SubscriberID uint      `gorm:"index;not null"`
	Content      string    `gorm:"type:text;not null"`
	CreatedAt    time.Time
}

// type SocialUser struct {
// 	ID         uint   `gorm:"primaryKey"`
// 	Provider   string
// 	ProviderID string `gorm:"index"`
// 	Name       string
// 	Email      string
// 	AvatarURL  string
// }

func main() {
	// Load environment variables
	_ = godotenv.Load() // Safe in prod if .env missing

	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL not set")
	}

	// Connect to PostgreSQL using GORM
	var err error
	db, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		log.Fatalf("Failed to connect to PostgreSQL: %v", err)
	}

	// Auto-migrate tables
	if err := db.AutoMigrate(&Subscriber{}, &Message{}); err != nil {
		log.Fatalf("Migration error: %v", err)
	}

	// OAuth setup
	setupOAuth()

	// Router setup
	r := mux.NewRouter()
	r.HandleFunc("/", serveIndex).Methods("GET")
	r.HandleFunc("/subscribe/email", handleEmailSubscription).Methods("POST")
	r.HandleFunc("/verify", handleEmailVerification).Methods("GET")
	r.HandleFunc("/submit", handleMessageSubmit).Methods("POST")
	r.HandleFunc("/auth/{provider}", gothic.BeginAuthHandler).Methods("GET")
	r.HandleFunc("/auth/{provider}/callback", handleOAuthCallback).Methods("GET")

	// Static files
	fs := http.FileServer(http.Dir("static"))
	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	addr := fmt.Sprintf(":%s", port)
	log.Printf("Server running on http://localhost:%s", addr)
	// Use the router with the specified port
	
	 err = http.ListenAndServe(addr, nil) 
	 if err != nil {
		log.Fatalf("Failed to start server: %v", err)
	 }
	
}


func setupOAuth() {
	baseURL := os.Getenv("BASE_URL")
	goth.UseProviders(
		google.New(os.Getenv("GOOGLE_CLIENT_ID"), os.Getenv("GOOGLE_CLIENT_SECRET"), baseURL+"/auth/google/callback"),
		facebook.New(os.Getenv("FACEBOOK_KEY"), os.Getenv("FACEBOOK_SECRET"), baseURL+"/auth/facebook/callback"),
		github.New(os.Getenv("GITHUB_KEY"), os.Getenv("GITHUB_SECRET"), baseURL+"/auth/github/callback"),
	)
}

func serveIndex(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "static/index.html")
}

func handleEmailSubscription(w http.ResponseWriter, r *http.Request) {
	email := strings.TrimSpace(r.FormValue("email"))
	if email == "" || !strings.Contains(email, "@") {
		http.Error(w, "Invalid email", http.StatusBadRequest)
		return
	}

	var existing Subscriber
	if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
		http.Error(w, "Already subscribed", http.StatusConflict)
		return
	}

	token := generateToken()
	subscriber := Subscriber{Email: email, Token: token}

	if err := db.Create(&subscriber).Error; err != nil {
		http.Error(w, "Subscription error", http.StatusInternalServerError)
		return
	}

	go sendVerificationEmail(email, token)
	fmt.Fprint(w, "Please check your email to verify your address.")
}

func handleEmailVerification(w http.ResponseWriter, r *http.Request) {
	token := r.URL.Query().Get("token")
	if token == "" {
		http.Error(w, "Token is required", http.StatusBadRequest)
		return
	}

	var sub Subscriber
	if err := db.Where("token = ?", token).First(&sub).Error; err != nil {
		http.Error(w, "Invalid token", http.StatusNotFound)
		return
	}

	sub.Confirmed = true
	sub.Token = ""
	db.Save(&sub)

	fmt.Fprint(w, "Email verified successfully!")
}

func handleMessageSubmit(w http.ResponseWriter, r *http.Request) {
	email := strings.TrimSpace(r.FormValue("email"))
	message := strings.TrimSpace(r.FormValue("message"))

	if email == "" || message == "" {
		http.Error(w, "Email and message required", http.StatusBadRequest)
		return
	}

	var sub Subscriber
	if err := db.Where("email = ? AND confirmed = true", email).First(&sub).Error; err != nil {
		http.Error(w, "Unverified email", http.StatusUnauthorized)
		return
	}

	msg := Message{SubscriberID: sub.ID, Content: message}
	if err := db.Create(&msg).Error; err != nil {
		http.Error(w, "Message save failed", http.StatusInternalServerError)
		return
	}

	fmt.Fprint(w, "Thank you for your message!")
}

func handleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	user, err := gothic.CompleteUserAuth(w, r)
	if err != nil {
		log.Printf("OAuth error: %v", err)
		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
		return
	}

	var sub Subscriber
	if err := db.Where("email = ?", user.Email).First(&sub).Error; err != nil {
		sub = Subscriber{Email: user.Email, Confirmed: true}
		db.Create(&sub)
	}

	fmt.Fprintf(w, "OAuth login successful: %s (%s)", user.Name, user.Email)
}

func sendVerificationEmail(to, token string) {
	baseURL := os.Getenv("BASE_URL")
	link := fmt.Sprintf("%s/verify?token=%s", baseURL, token)
	body := fmt.Sprintf("Click the link to verify your email:\n\n%s", link)

	m := gomail.NewMessage()
	m.SetHeader("From", os.Getenv("EMAIL_FROM"))
	m.SetHeader("To", to)
	m.SetHeader("Subject", "Verify your email")
	m.SetBody("text/plain", body)

	d := gomail.NewDialer(
		os.Getenv("SMTP_HOST"),
		587,
		os.Getenv("SMTP_USER"),
		os.Getenv("SMTP_PASS"),
	)

	if err := d.DialAndSend(m); err != nil {
		log.Printf("Email send error to %s: %v", to, err)
	}
}

func generateToken() string {
	b := make([]byte, 16)
	if _, err := rand.Read(b); err != nil {
		return fmt.Sprintf("%d", time.Now().UnixNano())
	}
	return hex.EncodeToString(b)
}











// package main

// import (
// 	"fmt"
// 	"log"
// 	"net/http"
// 	"os"
// 	"time"

// 	"github.com/gorilla/mux"
// 	"github.com/joho/godotenv"

// 	"github.com/markbates/goth"
// 	"github.com/markbates/goth/gothic"
// 	"github.com/markbates/goth/providers/facebook"
// 	"github.com/markbates/goth/providers/github"
// 	"github.com/markbates/goth/providers/google"

// 	"gopkg.in/gomail.v2"

// 	"gorm.io/driver/postgres"
// 	"gorm.io/gorm"
// )

// type Subscriber struct {
// 	ID        uint      `gorm:"primaryKey"`
// 	Email     string    `gorm:"uniqueIndex;not null"`
// 	Confirmed bool      `gorm:"default:false"`
// 	Token     string    `gorm:"size:255"`
// 	CreatedAt time.Time
// }

// type Message struct {
// 	ID           uint      `gorm:"primaryKey"`
// 	SubscriberID uint      `gorm:"not null"`
// 	Content      string    `gorm:"type:text"`
// 	CreatedAt    time.Time
// }

// var db *gorm.DB

// func init() {
// 	_ = godotenv.Load()
// }

// func main() {
// 	var err error

// 	// PostgreSQL DSN from .env
// 	dsn := fmt.Sprintf(
// 		"host=%s user=%s password=%s dbname=%s port=%s sslmode=disable",
// 		os.Getenv("DB_HOST"),
// 		os.Getenv("DB_USER"),
// 		os.Getenv("DB_PASSWORD"),
// 		os.Getenv("DB_NAME"),
// 		os.Getenv("DB_PORT"),
// 	)

// 	db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{})
// 	if err != nil {
// 		log.Fatalf("Database connection failed: %v", err)
// 	}

// 	if err := db.AutoMigrate(&Subscriber{}, &Message{}); err != nil {
// 		log.Fatalf("Migration failed: %v", err)
// 	}

// 	setupGoth()

// 	r := mux.NewRouter()
// 	r.HandleFunc("/", indexHandler).Methods("GET")
// 	r.HandleFunc("/subscribe/email", emailSubscribeHandler).Methods("POST")
// 	r.HandleFunc("/verify", emailVerifyHandler).Methods("GET")
// 	r.HandleFunc("/submit", messageSubmitHandler).Methods("POST")
// 	r.HandleFunc("/auth/{provider}", gothic.BeginAuthHandler).Methods("GET")
// 	r.HandleFunc("/auth/{provider}/callback", authCallbackHandler).Methods("GET")

// 	fs := http.FileServer(http.Dir("static"))
// 	r.PathPrefix("/static/").Handler(http.StripPrefix("/static/", fs))

// 	port := os.Getenv("PORT")
// 	if port == "" {
// 		port = "8080"
// 	}

// 	log.Printf("Server started on http://localhost:%s", port)
// 	log.Fatal(http.ListenAndServe(":"+port, r))
// }

// func setupGoth() {
// 	goth.UseProviders(
// 		google.New(
// 			os.Getenv("GOOGLE_CLIENT_ID"),
// 			os.Getenv("GOOGLE_CLIENT_SECRET"),
// 			"http://localhost:8080/auth/google/callback",
// 		),
// 		facebook.New(
// 			os.Getenv("FACEBOOK_KEY"),
// 			os.Getenv("FACEBOOK_SECRET"),
// 			"http://localhost:8080/auth/facebook/callback",
// 		),
// 		github.New(
// 			os.Getenv("GITHUB_KEY"),
// 			os.Getenv("GITHUB_SECRET"),
// 			"http://localhost:8080/auth/github/callback",
// 		),
// 	)
// }

// func indexHandler(w http.ResponseWriter, r *http.Request) {
// 	http.ServeFile(w, r, "static/index.html")
// }

// func emailSubscribeHandler(w http.ResponseWriter, r *http.Request) {
// 	email := r.FormValue("email")
// 	if email == "" {
// 		http.Error(w, "Email is required", http.StatusBadRequest)
// 		return
// 	}

// 	var existing Subscriber
// 	if err := db.Where("email = ?", email).First(&existing).Error; err == nil {
// 		http.Error(w, "Email already subscribed", http.StatusConflict)
// 		return
// 	}

// 	token := generateToken()
// 	newSubscriber := Subscriber{
// 		Email: email,
// 		Token: token,
// 	}

// 	if err := db.Create(&newSubscriber).Error; err != nil {
// 		http.Error(w, "Failed to create subscription", http.StatusInternalServerError)
// 		return
// 	}

// 	sendVerificationEmail(email, token)
// 	fmt.Fprint(w, "Subscription received. Please check your email to confirm.")
// }

// func emailVerifyHandler(w http.ResponseWriter, r *http.Request) {
// 	token := r.URL.Query().Get("token")
// 	if token == "" {
// 		http.Error(w, "Token missing", http.StatusBadRequest)
// 		return
// 	}

// 	var subscriber Subscriber
// 	if err := db.Where("token = ?", token).First(&subscriber).Error; err != nil {
// 		http.Error(w, "Invalid or expired token", http.StatusNotFound)
// 		return
// 	}

// 	subscriber.Confirmed = true
// 	subscriber.Token = ""
// 	db.Save(&subscriber)

// 	fmt.Fprint(w, "Email successfully verified!")
// }

// func messageSubmitHandler(w http.ResponseWriter, r *http.Request) {
// 	email := r.FormValue("email")
// 	content := r.FormValue("message")

// 	if email == "" || content == "" {
// 		http.Error(w, "Email and message are required", http.StatusBadRequest)
// 		return
// 	}

// 	var subscriber Subscriber
// 	if err := db.Where("email = ? AND confirmed = true", email).First(&subscriber).Error; err != nil {
// 		http.Error(w, "Email not verified", http.StatusUnauthorized)
// 		return
// 	}

// 	msg := Message{
// 		SubscriberID: subscriber.ID,
// 		Content:      content,
// 	}

// 	if err := db.Create(&msg).Error; err != nil {
// 		http.Error(w, "Could not save message", http.StatusInternalServerError)
// 		return
// 	}

// 	fmt.Fprint(w, "Message received. Thank you!")
// }

// func authCallbackHandler(w http.ResponseWriter, r *http.Request) {
// 	user, err := gothic.CompleteUserAuth(w, r)
// 	if err != nil {
// 		http.Redirect(w, r, "/", http.StatusTemporaryRedirect)
// 		return
// 	}

// 	email := user.Email
// 	var subscriber Subscriber
// 	if err := db.Where("email = ?", email).First(&subscriber).Error; err != nil {
// 		subscriber = Subscriber{
// 			Email:     email,
// 			Confirmed: true,
// 		}
// 		db.Create(&subscriber)
// 	}

// 	fmt.Fprintf(w, "Welcome %s! Email %s authenticated.", user.Name, email)
// }

// func sendVerificationEmail(to, token string) {
// 	link := fmt.Sprintf("http://localhost:8080/verify?token=%s", token)
// 	body := fmt.Sprintf("Click the following link to verify your email: %s", link)
	
// 	m := gomail.NewMessage()
// 	m.SetHeader("From", os.Getenv("EMAIL_FROM"))
// 	m.SetHeader("To", to)
// 	m.SetHeader("Subject", "Verify Your Email")
// 	m.SetBody("text/plain", body)

// 	d := gomail.NewDialer(
// 		os.Getenv("SMTP_HOST"),
// 		587,
// 		os.Getenv("SMTP_USER"),
// 		os.Getenv("SMTP_PASS"),
// 	)

// 	if err := d.DialAndSend(m); err != nil {
// 		log.Printf("Email send error: %v", err)
// 	}
// }

// func generateToken() string {
// 	return fmt.Sprintf("%d", time.Now().UnixNano())
// }









// package main

// import (
// 	"context"
// 	"fmt"
// 	"log"
// 	"net/http"
// 	"net/smtp"
// 	"net/url"
// 	"os"

// 	_ "github.com/lib/pq"

// 	"github.com/gorilla/sessions"
// 	"github.com/markbates/goth"
// 	"github.com/markbates/goth/gothic"
// 	"github.com/markbates/goth/providers/facebook"
// 	"github.com/markbates/goth/providers/github"
// 	"github.com/markbates/goth/providers/google"


//      "gorm.io/driver/postgres"
// 	 "gorm.io/gorm"
// 	 "idyllac-platform/models" // Adjust this import path to your actual models package
	
	
// )

// var DB *gorm.DB

// func main() {
// 	// Load env
// 	env := os.Getenv("ENV")
// 	port := os.Getenv("PORT")
// 	if port == "" {
// 		port = "8080"
// 	}
// 	baseURL := os.Getenv("BASE_URL")
// 	if baseURL == "" {
// 		log.Fatal("❌ BASE_URL is required")
// 	}
// 	fmt.Println("Running in:", env)
// 	fmt.Println("Base URL:", baseURL)

// 	// Sessions
// 	secret := os.Getenv("SESSION_SECRET")
// 	if secret == "" {
// 		log.Fatal("❌ SESSION_SECRET is missing")
// 	}
// 	store := sessions.NewCookieStore([]byte(secret))
// 	store.MaxAge(86400 * 30)
// 	store.Options.Path = "/"
// 	store.Options.HttpOnly = true
// 	store.Options.Secure = true
// 	gothic.Store = store

// 	// CALL InitDB!
// 	InitDB()

// 	// OAuth
// 	goth.UseProviders(
// 		facebook.New(os.Getenv("FACEBOOK_KEY"), os.Getenv("FACEBOOK_SECRET"), baseURL+"/auth/facebook/callback"),
// 		google.New(os.Getenv("GOOGLE_KEY"), os.Getenv("GOOGLE_SECRET"), baseURL+"/auth/google/callback", "email", "profile"),
// 		github.New(os.Getenv("GITHUB_KEY"), os.Getenv("GITHUB_SECRET"), baseURL+"/auth/github/callback"),
// 	)

// 	// Connect DB
// 	func InitDB() {
// 		databaseURL := os.Getenv("DATABASE_URL") // e.g. "postgres://user:pass@host:port/dbname?sslmode=require"
	
// 		var err error
// 		DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
// 		if err != nil {
// 			log.Fatal("❌ Failed to connect to DB:", err)
// 		}
	
// 		err = DB.AutoMigrate(&models.Subscriber{}, &models.Message{}, &models.SocialUser{}) // capital M in Message!
// 		if err != nil {
// 			log.Fatal("❌ Failed to run migrations:", err)
// 		}
	
// 	createTables()

// 	// Static and routes
// 	fs := http.FileServer(http.Dir("./static"))
// 	http.Handle("/static/", http.StripPrefix("/static/", fs))
// 	http.HandleFunc("/", serveIndex)
// 	http.HandleFunc("/subscribe", serveSubscribe)
// 	http.HandleFunc("/subscriber/email", handleEmailSubscription)
// 	http.HandleFunc("/verify", handleEmailVerification)
// 	http.HandleFunc("/subscribers", handleListSubscribers)
// 	http.HandleFunc("/view-emails", handleViewEmails)
// 	http.HandleFunc("/submit", handleFormSubmission)
// 	// OAuth
// 	http.HandleFunc("/auth/facebook", handleOAuthLogin("facebook"))
// 	http.HandleFunc("/auth/facebook/callback", handleOAuthCallback("facebook"))
// 	http.HandleFunc("/auth/google", handleOAuthLogin("google"))
// 	http.HandleFunc("/auth/google/callback", handleOAuthCallback("google"))
// 	http.HandleFunc("/auth/github", handleOAuthLogin("github"))
// 	http.HandleFunc("/auth/github/callback", handleOAuthCallback("github"))

// 	log.Println("🌐 Server running at", baseURL, "on port", port)
// 	log.Fatal(http.ListenAndServe(":"+port, nil))
// }

// func createTables() {
// 	if DB == nil {
// 		log.Fatal("❌ DB not initialized")
// 	}
// 	subscriberTable := `
// 	CREATE TABLE IF NOT EXISTS subscribers (
// 		id INTEGER PRIMARY KEY,
// 		email TEXT NOT NULL UNIQUE,
// 		verified BOOLEAN DEFAULT FALSE
// 	);`
// 	messageTable := `
// 	CREATE TABLE IF NOT EXISTS messages (
// 		id INTEGER PRIMARY KEY,
// 		subscriber_id INTEGER REFERENCES subscribers(id),
// 		message TEXT,
// 		created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
// 	);`
// 	if _, err := DB.Exec(subscriberTable); err != nil {
// 		log.Fatal("❌ Failed to create subscribers table:", err)
// 	}
// 	if _, err := DB.Exec(messageTable); err != nil {
// 		log.Fatal("❌ Failed to create messages table:", err)
// 	}
// }

// // -------- Handlers Below ----------

// func serveIndex(w http.ResponseWriter, r *http.Request) {
// 	switch r.URL.Query().Get("lang") {
// 	case "ar":
// 		http.ServeFile(w, r, "./static/indexAr.html")
// 	case "fr":
// 		http.ServeFile(w, r, "./static/indexFr.html")
// 	case "en":
// 		http.ServeFile(w, r, "./static/indexEn.html")
// 	default:
// 		http.ServeFile(w, r, "./index.html")
// 	}
// }

// func serveSubscribe(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodGet {
// 		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
// 		return
// 	}
// 	switch r.URL.Query().Get("lang") {
// 	case "ar":
// 		http.ServeFile(w, r, "./static/subscribeAr.html")
// 	case "fr":
// 		http.ServeFile(w, r, "./static/subscribeFr.html")
// 	case "en":
// 		http.ServeFile(w, r, "./static/subscribeEn.html")
// 	default:
// 		http.ServeFile(w, r, "./static/subscribe.html")
// 	}
// }

// func handleEmailSubscription(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
// 		return
// 	}
// 	email := r.FormValue("email")
// 	if email == "" {
// 		http.Error(w, "Email is required", http.StatusBadRequest)
// 		return
// 	}

// 	_, err := DB.Exec(`INSERT INTO subscribers(email) VALUES($1) ON CONFLICT DO NOTHING`, email)
// 	if err != nil {
// 		http.Error(w, "❌ DB insert error: "+err.Error(), http.StatusInternalServerError)
// 		return
// 	}

// 	link := os.Getenv("BASE_URL") + "/verify?email=" + url.QueryEscape(email)
// 	sendConfirmationEmail(email, link)

// 	var id int
// 	err = DB.QueryRow("SELECT id FROM subscribers WHERE email = $1", email).Scan(&id)
// 	if err != nil {
// 		http.Error(w, "❌ Could not retrieve subscriber ID", http.StatusInternalServerError)
// 		return
// 	}

// 	// Save to file
// 	if f, err := os.OpenFile("subscriber_emails.txt", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644); err == nil {
// 		defer f.Close()
// 		f.WriteString(email + "\n")
// 	} else {
// 		log.Println("⚠️ File write failed:", err)
// 	}

// 	fmt.Fprint(w, "✅ Message received! Thank you.")
// 	log.Println("📥 New subscriber:", email)
// 	log.Println("🔗 Verification link:", link)
// }

// func sendConfirmationEmail(to, link string) {
// 	from := os.Getenv("EMAIL_ADDRESS")
// 	pass := os.Getenv("EMAIL_PASSWORD")
// 	if from == "" || pass == "" {
// 		log.Println("❌ EMAIL_ADDRESS or EMAIL_PASSWORD not set")
// 		return
// 	}

// 	msg := []byte("From: " + from + "\r\n" +
// 		"To: " + to + "\r\n" +
// 		"Subject: Please verify your email\r\n" +
// 		"MIME-Version: 1.0\r\n" +
// 		"Content-Type: text/plain; charset=UTF-8\r\n\r\n" +
// 		"Hello,\n\nPlease click the link below to confirm your subscription:\n\n" + link + "\n\nThanks!")

// 	err := smtp.SendMail("smtp.gmail.com:587", smtp.PlainAuth("", from, pass, "smtp.gmail.com"), from, []string{to}, msg)
// 	if err != nil {
// 		log.Println("❌ Email send failed:", err)
// 	} else {
// 		log.Println("✅ Email sent to:", to)
// 	}
// }

// func handleEmailVerification(w http.ResponseWriter, r *http.Request) {
// 	email := r.URL.Query().Get("email")
// 	if email == "" {
// 		http.Error(w, "Missing email", http.StatusBadRequest)
// 		return
// 	}
// 	_, err := DB.Exec("UPDATE subscribers SET verified = TRUE WHERE email = $1", email)
// 	if err != nil {
// 		http.Error(w, "❌ Verification failed: "+err.Error(), http.StatusInternalServerError)
// 		return
// 	}
// 	fmt.Fprintf(w, "✅ Thank you %s, your email is now verified!", email)
// }

// func handleListSubscribers(w http.ResponseWriter, r *http.Request) {
// 	rows, err :=DB.Query("SELECT email FROM subscribers WHERE verified = TRUE")
// 	if err != nil {
// 		http.Error(w, "Failed to fetch subscribers", http.StatusInternalServerError)
// 		return
// 	}
// 	defer rows.Close()

// 	for rows.Next() {
// 		var email string
// 		rows.Scan(&email)
// 		fmt.Fprintln(w, email)
// 	}
// }

// func handleViewEmails(w http.ResponseWriter, r *http.Request) {
// 	data, err := os.ReadFile("subscriber_emails.txt")

// 	if err != nil {
// 		http.Error(w, "❌ Cannot read file", http.StatusInternalServerError)
// 		return
// 	}
// 	w.Write(data)
// }

// func handleFormSubmission(w http.ResponseWriter, r *http.Request) {
// 	if r.Method != http.MethodPost {
// 		http.Error(w, "Invalid method", http.StatusMethodNotAllowed)
// 		return
// 	}
// 	r.ParseForm()
// 	email := r.FormValue("email")
// 	message := r.FormValue("message")
// 	if email == "" || message == "" {
// 		http.Error(w, "Email and message required", http.StatusBadRequest)
// 		return
// 	}

// 	var id int
// 	err := DB.QueryRow("SELECT id FROM subscribers WHERE email = $1", email).Scan(&id)
// 	if err != nil {
// 		http.Error(w, "Email not found", http.StatusBadRequest)
// 		return
// 	}

// 	_, err = DB.Exec("INSERT INTO messages(subscriber_id, message) VALUES($1, $2)", id, message)
// 	if err != nil {
// 		http.Error(w, "Failed to save message", http.StatusInternalServerError)
// 		return
// 	}

// 	log.Printf("📩 New message from %s: %s\n", email, message)
// 	w.Write([]byte("✅ Message received!"))
// }

// // GET /auth/{provider}
// func handleOAuthLogin(provider string) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// Inject provider into context so gothic can use it
// 		ctx := context.WithValue(r.Context(), gothic.ProviderParamKey, provider)
// 		r = r.WithContext(ctx)

// 		gothic.BeginAuthHandler(w, r)
// 	}
// }

// // GET /auth/{provider}/callback
// func handleOAuthCallback(provider string) http.HandlerFunc {
// 	return func(w http.ResponseWriter, r *http.Request) {
// 		// Inject provider into context so gothic can use it
// 		ctx := context.WithValue(r.Context(), gothic.ProviderParamKey, provider)
// 		r = r.WithContext(ctx)

// 		user, err := gothic.CompleteUserAuth(w, r)
// 		if err != nil {
// 			http.Error(w, fmt.Sprintf("❌ %s login failed: %v", provider, err), http.StatusInternalServerError)
// 			log.Printf("❌ %s login error: %v\n", provider, err)
// 			return
// 		}

// 		// Success
// 		log.Printf("✅ %s login successful for: %s (%s)\n", provider, user.Name, user.Email)

// 		// Save to DB
// 		socialUser := models.SocialUser{
// 			Provider:   provider,
// 			ProviderID: user.UserID,
// 			Name:       user.Name,
// 			Email:      user.Email,
// 			AvatarURL:  user.AvatarURL,
// 		}

// 		var existing models.SocialUser
// 		result := models.DB.Where("provider_id = ?", user.UserID).First(&existing)
// 		if result.Error != nil {
// 			// Not found, create new
// 			models.DB.Create(&socialUser)
// 		}

// 		// Show user response
// 		fmt.Fprintf(w, "✅ Welcome %s!\n\nProvider: %s\nEmail: %s\nAvatar: %s",
// 			user.Name, provider, user.Email, user.AvatarURL)}
// }

