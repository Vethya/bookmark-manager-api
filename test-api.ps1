$baseUrl = "http://localhost:3000/api"

Write-Host "Testing Bookmark Manager API..." -ForegroundColor Green

# Test basic endpoint
try {
    $response = Invoke-RestMethod -Uri "$baseUrl" -Method GET
    Write-Host "✓ Basic endpoint working" -ForegroundColor Green
} catch {
    Write-Host "✗ Basic endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test user registration
try {
    $registerData = @{
        email = "test@example.com"
        username = "testuser"
        password = "password123"
    } | ConvertTo-Json

    $headers = @{
        "Content-Type" = "application/json"
    }

    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $registerData -Headers $headers
    Write-Host "✓ User registration working" -ForegroundColor Green
    $token = $registerResponse.access_token
    Write-Host "✓ JWT token received: $($token.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "✗ User registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test login
try {
    $loginData = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method POST -Body $loginData -Headers $headers
    Write-Host "✓ User login working" -ForegroundColor Green
    $token = $loginResponse.access_token
} catch {
    Write-Host "✗ User login failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test authenticated endpoints
$authHeaders = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $token"
}

# Test user profile
try {
    $profile = Invoke-RestMethod -Uri "$baseUrl/user/profile" -Method GET -Headers $authHeaders
    Write-Host "✓ User profile endpoint working" -ForegroundColor Green
} catch {
    Write-Host "✗ User profile failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test bookmark creation
try {
    $bookmarkData = @{
        title = "Test Bookmark"
        url = "https://example.com"
        description = "A test bookmark"
        tags = @("test", "example")
    } | ConvertTo-Json

    $bookmark = Invoke-RestMethod -Uri "$baseUrl/bookmarks" -Method POST -Body $bookmarkData -Headers $authHeaders
    Write-Host "✓ Bookmark creation working" -ForegroundColor Green
    $bookmarkId = $bookmark.id
} catch {
    Write-Host "✗ Bookmark creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test bookmark listing
try {
    $bookmarks = Invoke-RestMethod -Uri "$baseUrl/bookmarks" -Method GET -Headers $authHeaders
    Write-Host "✓ Bookmark listing working" -ForegroundColor Green
    Write-Host "  Found $($bookmarks.bookmarks.Count) bookmarks" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Bookmark listing failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test bookmark search
try {
    $searchResults = Invoke-RestMethod -Uri "$baseUrl/bookmarks?search=test" -Method GET -Headers $authHeaders
    Write-Host "✓ Bookmark search working" -ForegroundColor Green
} catch {
    Write-Host "✗ Bookmark search failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test tag listing
try {
    $tags = Invoke-RestMethod -Uri "$baseUrl/bookmarks/tags" -Method GET -Headers $authHeaders
    Write-Host "✓ Tag listing working" -ForegroundColor Green
    Write-Host "  Available tags: $($tags.tags -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Tag listing failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI testing completed!" -ForegroundColor Green
