// models/db.go
package models

import (
	"database/sql"
	"log"
	"os"

	_ "github.com/lib/pq" // PostgreSQL driver
)

var DB *sql.DB

// InitDB initializes the Postgres // Database/sql + lib/pq (sql.Open)
func InitDB() {
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("❌ DATABASE_URL is required for Postgres")
	}

	var err error
	db, err := sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("❌ DB connection failed:", err)
	}

	if err := db.Ping(); err != nil {
		log.Fatal("❌ DB ping failed:", err)
	}

	log.Println("✅ Connected to PostgreSQL")
	DB = db
}


// package models

// import (
// 	"database/sql"
// 	"fmt"
// 	"os"

// 	_ "github.com/go-sql-driver/mysql"
// )

// var DB *sql.DB

// func InitDB() (*sql.DB, error) {
// 	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true",
// 		os.Getenv("DB_USER"),
// 		os.Getenv("DB_PASSWORD"),
// 		os.Getenv("DB_HOST"),
// 		os.Getenv("DB_PORT"),
// 		os.Getenv("DB_NAME"),
// 	)

// 	db, err := sql.Open("mysql", dsn)
// 	if err != nil {
// 		return nil, err
// 	}

// 	err = db.Ping()
// 	return db, err
// }
