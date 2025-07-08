// routes/routes.go
package routes

import (
	  "net/http"

	" my-news-app/controllers"

	"github.com/gorilla/mux"
)

func SetupRoutes() *mux.Router {
	r := mux.NewRouter()

	r.HandleFunc("/subscriber/email", controllers.HandleEmailSubscription).Methods("POST")
	r.HandleFunc("/verify", controllers.HandleEmailVerification).Methods("GET")

	return r
}

func RegisterRoutes() {
	http.HandleFunc("/auth/facebook", controllers.HandleOAuthLogin("facebook"))
    http.HandleFunc("/auth/facebook/callback", controllers.HandleOAuthCallback("facebook"))

    http.HandleFunc("/auth/google", controllers.HandleOAuthLogin("google"))
    http.HandleFunc("/auth/google/callback", controllers.HandleOAuthCallback("google"))

    http.HandleFunc("/auth/github", controllers.HandleOAuthLogin("github"))
    http.HandleFunc("/auth/github/callback", controllers.HandleOAuthCallback("github"))

	  // You can also move other handlers like /subscribe etc. here
	  
    }