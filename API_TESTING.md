# Authentication API Testing

## Base URL

```
http://localhost:3000/api/auth
```

## Test Endpoints

### 1. Register New User

```bash
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "test@example.com",
  "password": "password123",
  "full_name": "Test User"
}
```

### 2. Login (Existing Admin)

```bash
POST http://localhost:3000/api/auth/login
Content-Type: application/json

{
  "email": "admin@apenews.com",
  "password": "admin123"
}
```

### 3. Get Current User

```bash
GET http://localhost:3000/api/auth/me
Authorization: Bearer {your_token_here}
```

### 4. Refresh Token

```bash
POST http://localhost:3000/api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "{your_refresh_token_here}"
}
```

## Test with PowerShell

### Register:

```powershell
$body = @{
    username = "testuser"
    email = "test@example.com"
    password = "password123"
    full_name = "Test User"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/register" -Method POST -Body $body -ContentType "application/json"
```

### Login (Admin):

```powershell
$body = @{
    email = "admin@apenews.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $body -ContentType "application/json"
```

### Get Current User:

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/auth/me" -Method GET -Headers $headers
```

## Expected Responses

### Successful Login:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@apenews.com",
      "full_name": "Super Admin",
      "role": "super_admin"
    }
  }
}
```

## Seeded Credentials

- **Super Admin**: admin@apenews.com / admin123
- **Editor**: editor@apenews.com / editor123
