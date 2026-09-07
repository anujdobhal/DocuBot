$ErrorActionPreference = "Stop"

Write-Host "=== RAG Admin Portal setup ===" -ForegroundColor Cyan

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Python 3.11+ is required. Install it from https://www.python.org/downloads/" -ForegroundColor Red
    exit 1
}

python -m venv .venv
& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -r requirements.txt

New-Item -ItemType Directory -Force data | Out-Null
New-Item -ItemType Directory -Force uploads | Out-Null

Write-Host ""
Write-Host "Setup complete." -ForegroundColor Green
Write-Host "Run .\run.ps1 to start the server."
