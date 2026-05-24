# Development startup script for Windows PowerShell
# Loads environment variables from .env file and starts Spring Boot

Write-Host "Loading environment variables from .env..." -ForegroundColor Cyan

# Read .env file and set environment variables
Get-Content .env | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]+)=(.*)$') {
        $name = $matches[1].Trim()
        $value = $matches[2].Trim()
        [Environment]::SetEnvironmentVariable($name, $value, "Process")
        Write-Host "  Set $name" -ForegroundColor Green
    }
}

Write-Host "`nStarting Spring Boot application..." -ForegroundColor Cyan
mvn spring-boot:run
