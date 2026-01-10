# Authentication System API

A complete **backend authentication system** built using **Node.js**, **Express**, and **MongoDB**, implementing secure user authentication with **JWT**, email verification, and password recovery workflows.

This project was built as a **learning-focused but feature-complete backend system**, following common industry authentication patterns.

---

## Features
- User registration and login
- JWT-based authentication with access and refresh tokens
- Secure password hashing using bcrypt
- Email verification using token-based links
- Forgot password and password reset functionality
- Token refresh mechanism
- Protected routes using authentication middleware
- Input validation using express-validator

---

## Tech Stack
- **Node.js**
- **Express**
- **MongoDB**
- **Mongoose**
- **JWT (jsonwebtoken)**
- **bcrypt**
- **Nodemailer(Mailtrap for email testing)**
- **express-validator**

---

## API Endpoints

### Authentication Routes (`/api/v1/auth`)
- `POST /register` – Register a new user
- `POST /login` – Authenticate user
- `POST /logout` – Logout user
- `GET /current-user` – Get current authenticated user
- `POST /change-password` – Change user password
- `POST /refresh-token` – Refresh access token
- `GET /verify-email/:verificationToken` – Verify email address
- `POST /forgot-password` – Request password reset
- `POST /reset-password/:resetToken` – Reset forgotten password
- `POST /resend-email-verification` – Resend verification email

### **Health Check** (`/api/v1/healthcheck/`)
- `GET /` - System health status

---

## Authentication Flow

1. **User Registration**
   - User registers with email and password
   - Password is hashed using bcrypt
   - A verification token is generated and stored in hashed form
   - Verification email is sent using Nodemailer (Mailtrap for testing)

2. **Email Verification**
   - User verifies email via tokenized link
   - Verification token is validated and marked as used

3. **Login**
   - User logs in with verified credentials
   - Access token and refresh token are generated using JWT
   - Refresh token is stored in the database and sent to the client via cookies

4. **Protected Routes**
   - Access token is validated using authentication middleware
   - Only authenticated users can access secured endpoints

5. **Token Refresh**
   - When access token expires, a new one is issued using a valid refresh token

6. **Logout**
   - User logout invalidates the stored refresh token
   - Prevents further token refresh attempts

7. **Password Reset**
   - User requests password reset
   - A reset token is emailed and validated before allowing password change


---

## Environment Variables

Create a `.env` file and configure the following:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string

ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY = access_token_expiry

REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY = refresh_token_expiry

CORS_ORIGIN = *

MAILTRAP_SMTP_HOST = sandbox.smtp.mailtrap.io
MAILTRAP_SMTP_PORT = 2525
MAILTRAP_SMTP_USER = your_mailtrap_smtp_username
MAILTRAP_SMTP_PASS = your_mailtrap_smtp_password

FORGOT_PASSWORD_REDIRECT_URL = your_reset_password_url
```

---

## Getting Started

### Prerequisites

- Node.js installed
- MongoDB instance running

### Installation
```bash
git clone https://github.com/your-username/auth-system.git
cd auth-system
npm install
npm run dev
```
---

## What I Learned

- Implementing secure authentication using JWT
- Managing access and refresh token workflows
- Handling email-based verification and password recovery
- Structuring scalable Express APIs
- Applying middleware for route protection and validation
- Using environment variables for secure configuration

---

## Project Status

- Built as a learning project
- Feature-complete backend authentication system
- Currently backend-only (no frontend)

---

## Notes
- Email functionality is configured using Mailtrap for development and testing purposes.
- Rate limiting is not currently implemented and would be required to protect authentication routes from brute-force and abuse in a production environment.
- Includes a health check endpoint for monitoring API availability.
- The system is currently intended for learning and development purposes
