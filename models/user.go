// models/user.go
package models

type User struct {
	ID                int
	Name              string
	Email             string
	Password          string
	IsConfirmed       bool
	ConfirmationToken string
}
