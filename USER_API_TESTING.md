# User Management API Testing

## Base URL

```
http://localhost:3000/api/users
```

## Authentication Required

All endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer {your_token_here}
```

## Test Endpoints

### 1. User Profile Management

#### Get Current User Profile

```bash
GET http://localhost:3000/api/users/profile
Authorization: Bearer {token}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/profile" -Method GET -Headers $headers
```

#### Update Profile

```bash
PUT http://localhost:3000/api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newusername",
  "email": "newemail@example.com",
  "full_name": "New Full Name",
  "avatar": "https://example.com/avatar.jpg"
}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    username = "newusername"
    full_name = "New Full Name"
    avatar = "https://example.com/avatar.jpg"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/profile" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

#### Change Password

```bash
PUT http://localhost:3000/api/users/profile
Authorization: Bearer {token}
Content-Type: application/json

{
  "current_password": "oldpassword123",
  "password": "newpassword123"
}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    current_password = "admin123"
    password = "newpassword123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/profile" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

---

### 2. Bookmarks Management

#### Get User Bookmarks

```bash
GET http://localhost:3000/api/users/bookmarks?page=1&limit=20
Authorization: Bearer {token}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/bookmarks?page=1&limit=20" -Method GET -Headers $headers
```

#### Add Bookmark

```bash
POST http://localhost:3000/api/users/bookmarks
Authorization: Bearer {token}
Content-Type: application/json

{
  "news_id": 1
}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    news_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/bookmarks" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

#### Remove Bookmark

```bash
DELETE http://localhost:3000/api/users/bookmarks/1
Authorization: Bearer {token}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/bookmarks/1" -Method DELETE -Headers $headers
```

#### Check if Article is Bookmarked

```bash
GET http://localhost:3000/api/users/bookmarks/check/1
Authorization: Bearer {token}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/bookmarks/check/1" -Method GET -Headers $headers
```

---

### 3. Admin User Management (Super Admin Only)

#### Get All Users

```bash
GET http://localhost:3000/api/users/admin?page=1&limit=20&role=user&search=admin
Authorization: Bearer {super_admin_token}
```

**PowerShell:**

```powershell
$token = "SUPER_ADMIN_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/admin?page=1&limit=20" -Method GET -Headers $headers
```

#### Get User by ID

```bash
GET http://localhost:3000/api/users/admin/2
Authorization: Bearer {super_admin_token}
```

**PowerShell:**

```powershell
$token = "SUPER_ADMIN_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/admin/2" -Method GET -Headers $headers
```

#### Create New User

```bash
POST http://localhost:3000/api/users/admin
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "username": "newuser",
  "email": "newuser@example.com",
  "password": "password123",
  "full_name": "New User",
  "role": "user",
  "is_active": 1
}
```

**PowerShell:**

```powershell
$token = "SUPER_ADMIN_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    username = "newuser"
    email = "newuser@example.com"
    password = "password123"
    full_name = "New User"
    role = "user"
    is_active = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/admin" -Method POST -Headers $headers -Body $body -ContentType "application/json"
```

#### Update User

```bash
PUT http://localhost:3000/api/users/admin/2
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "username": "updateduser",
  "email": "updated@example.com",
  "full_name": "Updated Name",
  "role": "moderator",
  "is_active": 1
}
```

**PowerShell:**

```powershell
$token = "SUPER_ADMIN_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

$body = @{
    username = "updateduser"
    full_name = "Updated Name"
    role = "moderator"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/admin/2" -Method PUT -Headers $headers -Body $body -ContentType "application/json"
```

#### Delete User

```bash
DELETE http://localhost:3000/api/users/admin/3
Authorization: Bearer {super_admin_token}
```

**PowerShell:**

```powershell
$token = "SUPER_ADMIN_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/users/admin/3" -Method DELETE -Headers $headers
```

---

## Expected Responses

### Profile Response:

```json
{
  "success": true,
  "data": {
    "id": 1,
    "username": "admin",
    "email": "admin@apenews.com",
    "full_name": "Super Admin",
    "avatar": null,
    "role": "super_admin",
    "created_at": "2024-01-15T10:30:00.000Z",
    "bookmarks_count": "5",
    "comments_count": "12"
  }
}
```

### Bookmarks Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "bookmarked_at": "2024-01-20T15:30:00.000Z",
      "news_id": 1,
      "title": "Breaking News Article",
      "slug": "breaking-news-article",
      "featured_image": "/uploads/news-image.jpg",
      "excerpt": "This is a short excerpt...",
      "status": "published",
      "news_created_at": "2024-01-15T10:00:00.000Z",
      "category_name": "Technology",
      "category_slug": "technology",
      "author_username": "admin",
      "author_name": "Super Admin"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Users List Response (Admin):

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "username": "admin",
      "email": "admin@apenews.com",
      "full_name": "Super Admin",
      "avatar": null,
      "role": "super_admin",
      "is_active": 1,
      "created_at": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": 2,
      "username": "editor",
      "email": "editor@apenews.com",
      "full_name": "Editor User",
      "avatar": null,
      "role": "editor",
      "is_active": 1,
      "created_at": "2024-01-15T10:31:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 2,
    "totalPages": 1
  }
}
```

## Testing Workflow

1. **Login** with admin credentials to get token:

```powershell
$loginBody = @{
    email = "admin@apenews.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token
```

2. **Get Profile:**

```powershell
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/users/profile" -Method GET -Headers $headers
```

3. **Add Bookmark** (assuming news article with ID 1 exists):

```powershell
$bookmarkBody = @{ news_id = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/users/bookmarks" -Method POST -Headers $headers -Body $bookmarkBody -ContentType "application/json"
```

4. **Get Bookmarks:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/users/bookmarks" -Method GET -Headers $headers
```

5. **Admin: Create User:**

```powershell
$newUserBody = @{
    username = "testuser"
    email = "test@example.com"
    password = "test123"
    full_name = "Test User"
    role = "user"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/users/admin" -Method POST -Headers $headers -Body $newUserBody -ContentType "application/json"
```

## Role-Based Access

- **Profile & Bookmarks**: All authenticated users
- **Admin User Management**: Super Admin only

## Query Parameters

### Get All Users (Admin)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `role` - Filter by role (user, moderator, editor, super_admin)
- `is_active` - Filter by active status (0 or 1)
- `search` - Search in username, email, or full_name

### Get Bookmarks

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
