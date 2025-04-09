# PowerShell script to start all services for FASTxSQL
Write-Host "Starting all services for FASTxSQL..." -ForegroundColor Green

# Store the current directory
$rootDir = $PSScriptRoot

# Function to start a process in a new window
function Start-ServiceWindow {
    param (
        [string]$Title,
        [string]$WorkingDirectory,
        [string]$Command
    )
    
    Write-Host "Starting $Title..." -ForegroundColor Cyan
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$WorkingDirectory'; $Command" -WindowStyle Normal
    Write-Host "$Title started in new window" -ForegroundColor Green
}

# Try to find and activate virtual environment
$venvActivated = $false
$venvPaths = @("$rootDir\venv", "$rootDir\env", "$rootDir\.venv", "$rootDir\.env")

foreach ($venvPath in $venvPaths) {
    if (Test-Path "$venvPath\Scripts\Activate.ps1") {
        Write-Host "Found virtual environment at $venvPath" -ForegroundColor Cyan
        $venvActivated = $true
        $fastApiCommand = "& '$venvPath\Scripts\Activate.ps1'; python -m uvicorn main:app --reload"
        break
    }
}

if (-not $venvActivated) {
    Write-Host "Warning: No virtual environment found. Using system Python." -ForegroundColor Yellow
    $fastApiCommand = "python -m uvicorn main:app --reload"
}

# Start FastAPI server in new window
Start-ServiceWindow -Title "FastAPI Server" -WorkingDirectory $rootDir -Command $fastApiCommand

# Start Node.js server in new window
Start-ServiceWindow -Title "Node.js Server" -WorkingDirectory "$rootDir\server" -Command "node server.js"

# Start React frontend in new window
Start-ServiceWindow -Title "React Frontend" -WorkingDirectory "$rootDir\frontend" -Command "npm start"

# Display service URLs
Write-Host "`nServices running at:" -ForegroundColor Green
Write-Host "FastAPI: http://localhost:8000" -ForegroundColor Yellow
Write-Host "Node.js: http://localhost:5000" -ForegroundColor Yellow
Write-Host "React:   http://localhost:3000" -ForegroundColor Yellow

Write-Host "`nPress any key to stop all services..." -ForegroundColor Magenta
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Clean up processes when user presses a key
Write-Host "`nStopping all services..." -ForegroundColor Cyan

# Helper function to stop processes by window title
function Stop-ServiceWindows {
    param (
        [string[]]$Titles
    )
    
    foreach ($title in $Titles) {
        $processes = Get-Process | Where-Object { $_.MainWindowTitle -like "*$title*" }
        foreach ($process in $processes) {
            Write-Host "Stopping $title (PID: $($process.Id))..." -ForegroundColor Yellow
            Stop-Process -Id $process.Id -Force -ErrorAction SilentlyContinue
            Write-Host "$title stopped" -ForegroundColor Green
        }
    }
}

# Stop all service windows
Stop-ServiceWindows -Titles @("FastAPI Server", "Node.js Server", "React Frontend")

Write-Host "All services stopped." -ForegroundColor Green 