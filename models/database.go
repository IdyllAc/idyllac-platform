package models

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

// Global GORM DB instance
var DB *gorm.DB

func InitDB() {
	databaseURL := os.Getenv("DATABASE_URL") // e.g. "postgres://user:pass@host:port/dbname?sslmode=require"

	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), &gorm.Config{})
	if err != nil {
		log.Fatal("❌ Failed to connect to DB:", err)
	}

	// Auto-migrate Go models only (Node.js/Sequelize models are separate)
	err = DB.AutoMigrate(&Subscriber{}) // Add more Go models here if needed
	if err != nil {
		log.Fatal("❌ Failed to run migrations:", err)
	}
}
