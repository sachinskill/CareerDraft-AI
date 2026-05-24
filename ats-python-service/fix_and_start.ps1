# ── Step 1: Upgrade typing_extensions first (this is the root cause) ──────────
Write-Host "Step 1: Upgrading typing_extensions..." -ForegroundColor Yellow
pip install "typing_extensions>=4.10.0" --upgrade

# ── Step 2: Install compatible torch (CPU only, much smaller download) ─────────
Write-Host "Step 2: Installing torch (CPU version, ~200MB)..." -ForegroundColor Yellow
pip install torch --index-url https://download.pytorch.org/whl/cpu

# ── Step 3: Install/upgrade sentence-transformers ─────────────────────────────
Write-Host "Step 3: Installing sentence-transformers..." -ForegroundColor Yellow
pip install sentence-transformers --upgrade

# ── Step 4: Install remaining dependencies ────────────────────────────────────
Write-Host "Step 4: Installing other dependencies..." -ForegroundColor Yellow
pip install scikit-learn numpy pdfplumber python-docx fastapi "uvicorn[standard]" python-multipart

Write-Host ""
Write-Host "All done! Starting ATS service..." -ForegroundColor Green
Write-Host ""

uvicorn main:app --host 0.0.0.0 --port 8000 --reload
