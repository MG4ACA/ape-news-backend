# Category API Testing

## Base URL
```
http://localhost:3000/api/categories
```

## Public Endpoints (No Authentication)

### 1. Get All Categories
```bash
GET http://localhost:3000/api/categories
```

Query Parameters:
- `parent_id` - Filter by parent (use 'null' for root categories)
- `is_active` - Filter by active status (true/false)
- `tree` - Get hierarchical tree structure (true/false)

Examples:
```bash
# Get all categories
GET http://localhost:3000/api/categories

# Get root categories only
GET http://localhost:3000/api/categories?parent_id=null

# Get active categories
GET http://localhost:3000/api/categories?is_active=true

# Get category tree
GET http://localhost:3000/api/categories?tree=true
```

### 2. Get Single Category
```bash
GET http://localhost:3000/api/categories/:id
# Or by slug
GET http://localhost:3000/api/categories/politics
```

### 3. Get Category Children
```bash
GET http://localhost:3000/api/categories/:id/children
```

## Protected Endpoints (Require Editor Role)

### 4. Create Category
```bash
POST http://localhost:3000/api/categories
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Science",
  "slug": "science",
  "description": "Scientific news and discoveries",
  "parent_id": null,
  "display_order": 10,
  "is_active": 1
}
```

### 5. Update Category
```bash
PUT http://localhost:3000/api/categories/:id
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### 6. Deactivate Category
```bash
PATCH http://localhost:3000/api/categories/:id/deactivate
Authorization: Bearer {token}
```

### 7. Reorder Categories
```bash
POST http://localhost:3000/api/categories/reorder
Authorization: Bearer {token}
Content-Type: application/json

{
  "categories": [
    { "id": 1, "display_order": 0 },
    { "id": 2, "display_order": 1 },
    { "id": 3, "display_order": 2 }
  ]
}
```

### 8. Delete Category
```bash
DELETE http://localhost:3000/api/categories/:id
Authorization: Bearer {token}
```

## PowerShell Examples

### Get All Categories:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/categories" -Method GET
```

### Get Category Tree:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/categories?tree=true" -Method GET
```

### Create Category (with Editor token):
```powershell
# First login as editor
$loginBody = @{
    email = "editor@apenews.com"
    password = "editor123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
$token = $loginResponse.data.token

# Create category
$categoryBody = @{
    name = "Science"
    slug = "science"
    description = "Scientific news and discoveries"
    parent_id = $null
    display_order = 10
    is_active = 1
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $token"
}

Invoke-RestMethod -Uri "http://localhost:3000/api/categories" -Method POST -Body $categoryBody -ContentType "application/json" -Headers $headers
```

### Get Category by ID:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/categories/1" -Method GET
```

### Get Category by Slug:
```powershell
Invoke-RestMethod -Uri "http://localhost:3000/api/categories/politics" -Method GET
```

## Expected Responses

### Category Tree:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Politics",
      "slug": "politics",
      "description": "Political news and updates",
      "parent_id": null,
      "news_count": 0,
      "children": []
    },
    {
      "id": 2,
      "name": "Technology",
      "slug": "technology",
      "description": "Tech news and innovations",
      "parent_id": null,
      "news_count": 0,
      "children": [
        {
          "id": 7,
          "name": "AI & Machine Learning",
          "slug": "ai-ml",
          "parent_id": 2,
          "children": []
        }
      ]
    }
  ]
}
```

### Single Category:
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "Politics",
    "slug": "politics",
    "description": "Political news and updates",
    "parent_id": null,
    "parent_name": null,
    "display_order": 0,
    "is_active": 1,
    "news_count": 0,
    "created_at": "2025-12-25T...",
    "updated_at": "2025-12-25T...",
    "children": []
  }
}
```

## Features

✅ **Hierarchical Structure**: Support for parent-child relationships
✅ **Circular Reference Prevention**: Cannot set a category as its own ancestor
✅ **Automatic Slug Generation**: Creates URL-friendly slugs from names
✅ **News Count**: Shows number of articles in each category
✅ **Ordering**: Custom display order with reordering endpoint
✅ **Soft Delete**: Deactivate instead of hard delete
✅ **Validation**: Cannot delete categories with children or associated news
✅ **Role-Based Access**: Public read, Editor+ for modifications
