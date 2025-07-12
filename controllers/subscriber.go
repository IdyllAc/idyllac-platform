// controllers/subscriber.go
package controllers

import (
	"fmt"
	"net/http"
	"net/smtp"
	"net/url"
	"os"

	"idyllac-platform/models"
)

// HandleEmailSubscription handles POST /subscribe/email
func HandleEmailSubscription(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	// Check if subscriber exists already
	existing, _ := models.GetSubscriberByEmail(email)
	if existing != nil {
		http.Error(w, "Email already subscribed", http.StatusConflict)
		return
	}

	// Create new subscriber
	err := models.CreateSubscriber(email)
	if err != nil {
		http.Error(w, "Could not subscribe: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Send verification email
	link := "https://anypay.cards/verify?email=" + url.QueryEscape(email)
	go sendEmail(email, link) // non-blocking

	w.Write([]byte("✅ Please check your email to verify your subscription."))
}

// HandleEmailVerification handles GET /verify?email=...
func HandleEmailVerification(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Missing email", http.StatusBadRequest)
		return
	}

	err := models.MarkSubscriberVerified(email)
	if err != nil {
		http.Error(w, "Verification failed: "+err.Error(), http.StatusInternalServerError)
		return
	}

	fmt.Fprintf(w, "✅ Email verified: %s", email)
}

// sendEmail sends a verification email using SMTP
func sendEmail(to, link string) {
	from := os.Getenv("EMAIL_ADDRESS")
	pass := os.Getenv("EMAIL_PASSWORD")

	subject := "Verify your email"
	body := fmt.Sprintf("Please verify your email by clicking the link: %s", link)

	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n\r\n" +
		body + "\r\n")

	_ = smtp.SendMail("smtp.gmail.com:587",
		smtp.PlainAuth("", from, pass, "smtp.gmail.com"),
		from, []string{to}, msg)
}
