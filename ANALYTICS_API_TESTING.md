# Analytics API Testing

## Base URL

```
http://localhost:3000/api/analytics
```

## Test Endpoints

### 1. Public Endpoints (No Authentication Required)

#### Get Popular Articles

```bash
GET http://localhost:3000/api/analytics/popular?limit=10&days=30&category_id=1
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/popular?limit=10&days=30" -Method GET
```

**Query Parameters:**

- `limit` - Number of articles to return (default: 10)
- `days` - Time period in days (default: 30, use 0 for all time)
- `category_id` - Filter by category (optional)

#### Get Trending Articles

```bash
GET http://localhost:3000/api/analytics/trending?limit=10
```

**PowerShell:**

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/trending?limit=10" -Method GET
```

**Query Parameters:**

- `limit` - Number of articles to return (default: 10)

---

### 2. Track View (No Auth Required)

#### Track Article View

```bash
POST http://localhost:3000/api/analytics/track
Content-Type: application/json

{
  "news_id": 1
}
```

**PowerShell:**

```powershell
$body = @{
    news_id = 1
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/track" -Method POST -Body $body -ContentType "application/json"
```

**Note:** This endpoint can be called by authenticated or anonymous users. If authenticated, it will track the user ID.

---

### 3. User Activity (Authenticated Users)

#### Get User's Reading Activity

```bash
GET http://localhost:3000/api/analytics/user/activity?days=30
Authorization: Bearer {token}
```

**PowerShell:**

```powershell
$token = "YOUR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/user/activity?days=30" -Method GET -Headers $headers
```

**Query Parameters:**

- `days` - Time period in days (default: 30)

---

### 4. Admin/Editor Analytics Endpoints

#### Get Dashboard Statistics

```bash
GET http://localhost:3000/api/analytics/dashboard?days=30
Authorization: Bearer {editor_token}
```

**PowerShell:**

```powershell
$token = "EDITOR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/dashboard?days=30" -Method GET -Headers $headers
```

**Query Parameters:**

- `days` - Time period in days (default: 30)

#### Get Article Analytics

```bash
GET http://localhost:3000/api/analytics/article/1?days=30
Authorization: Bearer {editor_token}
```

**PowerShell:**

```powershell
$token = "EDITOR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/article/1?days=30" -Method GET -Headers $headers
```

**Query Parameters:**

- `days` - Time period in days (default: 30)

#### Get Views by Category

```bash
GET http://localhost:3000/api/analytics/categories?days=30
Authorization: Bearer {editor_token}
```

**PowerShell:**

```powershell
$token = "EDITOR_TOKEN_HERE"
$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/categories?days=30" -Method GET -Headers $headers
```

**Query Parameters:**

- `days` - Time period in days (default: 30)

---

## Expected Responses

### Popular Articles Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "Breaking News Article",
      "slug": "breaking-news-article",
      "featured_image": "/uploads/news-image.jpg",
      "excerpt": "This is a short excerpt...",
      "view_count": "1523",
      "category_name": "Technology",
      "category_slug": "technology",
      "author_username": "admin",
      "author_name": "Super Admin"
    }
  ]
}
```

### Trending Articles Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 2,
      "title": "Trending Article Title",
      "slug": "trending-article",
      "featured_image": "/uploads/trending.jpg",
      "excerpt": "Article gaining popularity...",
      "recent_views": "450",
      "previous_views": "200",
      "category_name": "Business",
      "category_slug": "business"
    }
  ]
}
```

### Dashboard Statistics Response:

```json
{
  "success": true,
  "data": {
    "total_views": 15234,
    "unique_visitors": 8456,
    "views_by_date": [
      {
        "date": "2024-01-15",
        "views": 523
      },
      {
        "date": "2024-01-16",
        "views": 612
      }
    ],
    "top_categories": [
      {
        "id": 1,
        "name": "Technology",
        "slug": "technology",
        "view_count": "4523"
      },
      {
        "id": 2,
        "name": "Business",
        "slug": "business",
        "view_count": "3241"
      }
    ],
    "recent_views": [
      {
        "viewed_at": "2024-01-20T15:30:25.000Z",
        "news_id": 1,
        "title": "Article Title",
        "slug": "article-slug",
        "username": "user123",
        "full_name": "John Doe"
      }
    ]
  }
}
```

### Article Analytics Response:

```json
{
  "success": true,
  "data": {
    "total_views": 1523,
    "unique_visitors": 987,
    "views_by_date": [
      {
        "date": "2024-01-15",
        "views": 156
      }
    ],
    "registered_views": 543,
    "anonymous_views": 980
  }
}
```

### Views by Category Response:

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Technology",
      "slug": "technology",
      "view_count": "4523"
    },
    {
      "id": 2,
      "name": "Business",
      "slug": "business",
      "view_count": "3241"
    }
  ]
}
```

### User Activity Response:

```json
{
  "success": true,
  "data": [
    {
      "viewed_at": "2024-01-20T15:30:25.000Z",
      "news_id": 1,
      "title": "Article Title",
      "slug": "article-slug",
      "category_name": "Technology"
    }
  ]
}
```

---

## Testing Workflow

### 1. Track Views (Anonymous)

```powershell
# Track a view for article ID 1
$trackBody = @{ news_id = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/track" -Method POST -Body $trackBody -ContentType "application/json"

# Track a view for article ID 2
$trackBody = @{ news_id = 2 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/track" -Method POST -Body $trackBody -ContentType "application/json"
```

### 2. Get Popular Articles

```powershell
# Get top 10 popular articles from last 30 days
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/popular?limit=10&days=30" -Method GET

# Get all-time popular articles
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/popular?limit=10&days=0" -Method GET

# Get popular articles from specific category
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/popular?category_id=1" -Method GET
```

### 3. Get Trending Articles

```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/trending?limit=5" -Method GET
```

### 4. Admin: Get Dashboard Stats

```powershell
# Login as editor/admin first
$loginBody = @{
    email = "admin@apenews.com"
    password = "admin123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token

# Get dashboard statistics
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/dashboard?days=30" -Method GET -Headers $headers

# Get views by category
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/categories?days=30" -Method GET -Headers $headers

# Get specific article analytics
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/article/1?days=30" -Method GET -Headers $headers
```

### 5. User: Get Personal Activity

```powershell
# Login as regular user
$loginBody = @{
    email = "user@example.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $response.data.token

# Get personal reading activity
$headers = @{ "Authorization" = "Bearer $token" }
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/user/activity?days=30" -Method GET -Headers $headers
```

---

## Integration with News Endpoints

When users view an article via `GET /api/news/:id`, you can automatically track the view by calling the analytics endpoint:

```powershell
# 1. Get article
$article = Invoke-RestMethod -Uri "http://localhost:3000/api/news/1" -Method GET

# 2. Track the view
$trackBody = @{ news_id = 1 } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/track" -Method POST -Body $trackBody -ContentType "application/json"
```

Or implement this automatically in the frontend when article pages are loaded.

---

## Role-Based Access

- **Public**:

  - Get popular articles
  - Get trending articles
  - Track views (anyone can track)

- **Authenticated Users**:

  - All public endpoints
  - Get personal reading activity

- **Editor & Super Admin**:
  - All public and user endpoints
  - Dashboard statistics
  - Article-specific analytics
  - Category analytics

---

## Use Cases

### 1. Homepage Popular Articles Widget

```powershell
# Get top 5 most popular articles from last 7 days
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/popular?limit=5&days=7" -Method GET
```

### 2. Trending Section

```powershell
# Get top 10 trending articles
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/trending?limit=10" -Method GET
```

### 3. Admin Dashboard Overview

```powershell
$headers = @{ "Authorization" = "Bearer $adminToken" }

# Get 7-day statistics
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/dashboard?days=7" -Method GET -Headers $headers
```

### 4. Article Performance Report

```powershell
$headers = @{ "Authorization" = "Bearer $editorToken" }

# Get detailed analytics for article ID 5
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/article/5?days=30" -Method GET -Headers $headers
```

### 5. User Reading History

```powershell
$headers = @{ "Authorization" = "Bearer $userToken" }

# Get user's last 30 days of reading activity
Invoke-RestMethod -Uri "http://localhost:3000/api/analytics/user/activity?days=30" -Method GET -Headers $headers
```

---

## Notes

- **IP Address Tracking**: The system tracks IP addresses for anonymous users to estimate unique visitors
- **User Agent**: Browser and device information is stored for analytics
- **Privacy**: User IDs are optional and only stored for authenticated users
- **Performance**: All analytics queries are optimized with proper indexes
- **Time Periods**: Use `days=0` for all-time statistics, or specify specific periods (7, 30, 90, etc.)
