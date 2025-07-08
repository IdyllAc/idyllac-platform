// controllers/subscriber.go
package controllers

import (
	"fmt"
	"net/http"
	"net/smtp"
	"net/url"
	"os"

	 "idyllac-platform/models" // Adjust this import path to your actual models package
	"idyllac-platform/subscriber" // Adjust this import path to your actual models package
	
)

func HandleEmailSubscription(w http.ResponseWriter, r *http.Request) {
	email := r.FormValue("email")
	if email == "" {
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	err := models.CreateSubscriber(email)
	if err != nil {
		http.Error(w, "Could not subscribe: "+err.Error(), 500)
		return
	}

	link := "https://anypay.cards/verify?email=" + url.QueryEscape(email)
	sendEmail(email, link)

	w.Write([]byte("✅ Message received!"))
}

func HandleEmailVerification(w http.ResponseWriter, r *http.Request) {
	email := r.URL.Query().Get("email")
	if email == "" {
		http.Error(w, "Missing email", 400)
		return
	}

	err := models.VerifySubscriber(email)
	if err != nil {
		http.Error(w, "Verification failed: "+err.Error(), 500)
		return
	}

	fmt.Fprintf(w, "✅ Email verified: %s", email)
}

func sendEmail(to, link string) {
	from := os.Getenv("EMAIL_ADDRESS")
	pass := os.Getenv("EMAIL_PASSWORD")

	subject := "Verify your email"
	body := fmt.Sprintf("Please verify here: %s", link)

	msg := []byte("To: " + to + "\r\n" +
		"Subject: " + subject + "\r\n\r\n" +
		body + "\r\n")

	_ = smtp.SendMail("smtp.gmail.com:587",
		smtp.PlainAuth("", from, pass, "smtp.gmail.com"),
		from, []string{to}, msg)
}
