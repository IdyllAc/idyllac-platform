// models/subscriber.go
package models

import (
	"errors"

)

// Subscriber model
type Subscriber struct {
	ID       uint   `gorm:"primaryKey"`
	Email    string `gorm:"unique;not null"`
	Verified bool
}


// CreateSubscriber adds a new subscriber
func CreateSubscriber(email string) error {
	if DB == nil {
		return errors.New("DB not initialized")
	}
	return DB.Create(&Subscriber{Email: email}).Error
}

// GetSubscriberByEmail checks if a subscriber exists by email
func GetSubscriberByEmail(email string) (*Subscriber, error) {
	if DB == nil {
		return nil, errors.New("DB not initialized")
	}
	var s Subscriber
	result := DB.First(&s, "email = ?", email)
	if result.Error != nil {
		return nil, result.Error
	}
	return &s, nil
}

// MarkSubscriberVerified sets Verified = true for a given email
func MarkSubscriberVerified(email string) error {
	if DB == nil {
		return errors.New("DB not initialized")
	}
	return DB.Model(&Subscriber{}).
		Where("email = ?", email).
		Update("verified", true).Error
}
