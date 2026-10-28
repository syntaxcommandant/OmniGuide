# OmniGuide: Complete End-to-End Setup & Deployment Walkthrough

This document outlines every step executed from cloning the repository to setting up the local development environment, running tests, launching services, and deploying both the backend (Render) and frontend (Vercel) to production.

---

## Architecture Overview

OmniGuide utilizes a hybrid full-stack deployment model:

```
┌───────────────────────────────────────┐          ┌──────────────────────────────────────┐
│           Frontend (Vercel)           │          │           Backend (Render)           │
│   https://frontend-liard-phi-33...    │  ──────► │    https://omniguide-api.onrender... │
│   React 19 + TypeScript + Vite + CDN  │   REST   │    FastAPI + PyMuPDF + SQLAlchemy    │
└───────────────────────────────────────┘          └──────────────────────────────────────┘
```

---

## Phase 1: Repository Synchronization & Cloning

1. **Repository Discovery & Checkout**:
   - Workspace directory: `c:\Users\Sumit Yadav\OneDrive\Documents\Desktop\OmniGuide`
   - Remote origin: `https://github.com/syntaxcommandant/OmniGuide.git`
2. **Fetch and Branch Tracking**:
   ```powershell
   git fetch origin
   git reset --hard origin/main
   git branch --set-upstream-to=origin/main main
   ```
   - Confirmed checkout at commit `62add4e`: *"fix(prod): prepare PostgreSQL dialect compatibility, secret protection, and deployment configurations"*.

---

## Phase 2: Local Environment Setup

### 1. Environment Configuration
Copied the environment template:
```powershell
Copy-Item .env.example .env
```
Default local configuration uses SQLite (`DATABASE_URL=sqlite:///./omniguide.db`) and deterministic rule evaluation fallback when an AI API key is omitted.

### 2. Backend Virtual Environment & Dependencies
1. Created Python 3.14 virtual environment:
   ```powershell
   python -m venv .venv
   ```
2. Installed backend requirements:
   ```powershell
   .\.venv\Scripts\pip install -r backend/requirements.txt
   ```
   - Core libraries installed: `fastapi`, `uvicorn`, `pydantic`, `sqlalchemy`, `psycopg-binary`, `pymupdf`, `google-genai`, `pytest`, `pytest-asyncio`.

### 3. Frontend Node Packages
Installed dependencies in `frontend/`:
```powershell
cd frontend
npm install
```
   - Core libraries installed: `react`, `react-dom`, `react-router-dom`, `tailwindcss`, `vite`, `lucide-react`.

---

## Phase 3: Automated Test Verification

Executed the automated Pytest test suite:
```powershell
& .\.venv\Scripts\pytest.exe -v
```
**Results:** **48 / 48 tests passed** (100% success rate), verifying:
- API health and system diagnostics
- Clause splitting (`SEC-1.1`, bullet points)
- Unsupported superlative & banned term detection
- Approved facts quantitative grounding
- Evidence validation and anti-hallucination guards
- Scanned/invalid PDF rejection handling
- Campaign launch gates and cross-channel consistency

---

## Phase 4: Local Services Execution

### 1. Launch Backend Server
Started FastAPI on port 8000:
```powershell
$env:PYTHONPATH="backend"
& .\.venv\Scripts\uvicorn.exe app.main:app --port 8000
```
- Automatically initialized database tables.
- Seeded default brand compliance guidelines and approved corporate metrics.

### 2. Launch Frontend Dev Server
Started Vite development server on port 5173:
```powershell
cd frontend
npm run dev
```
- Configured with proxy passing `/api` calls directly to `http://127.0.0.1:8000`.

### 3. Local Endpoint Verification
- **Backend Health**: `http://127.0.0.1:8000/api/health` -> `{"status": "healthy", "app": "OmniGuide"}`
- **Interactive Swagger Docs**: `http://127.0.0.1:8000/docs`
- **Frontend App**: `http://localhost:5173` -> HTTP 200 OK
- **Sanity Review Check**: Tested `"India's #1 fastest tool for Indian teams."` -> Correctly flagged violations with citation suggestions.

---

## Phase 5: Cloud Architecture Assessment

Evaluated cloud hosting compatibility:
- **Why Render for Backend?**
  - OmniGuide utilizes `pymupdf` (PyMuPDF) with native C/C++ compilation and ONNX runtime (virtual environment size: **~341 MB**).
  - Vercel Serverless Functions enforce a **250 MB** uncompressed limit and a **15-second timeout** on free tiers.
  - The repository's `render.yaml` blueprint provides a pre-configured, persistent Python web service.
- **Why Vercel for Frontend?**
  - Static Vite/React distribution with global edge CDN caching and sub-second load times.

---

## Phase 6: Frontend Deployment to Vercel

1. **Vercel CLI Authentication**:
   - Initiated device login:
     ```powershell
     npx vercel login
     ```
   - Authorized via device code in browser: `https://vercel.com/oauth/device?user_code=VWSD-JXDF`.
   - Verified logged-in account: `sumityadav6967-3979`.

2. **Frontend Production Build**:
   ```powershell
   cd frontend
   npm run build
   ```
   - Compiled TypeScript and Vite assets to `dist/` with zero errors.

3. **Deploy to Vercel**:
   ```powershell
   cd frontend
   npx vercel --yes
   ```
   - Generated initial deployment URL: `https://frontend-4sulqxs8f-novaforge6.vercel.app`
   - Generated production alias: `https://frontend-liard-phi-33.vercel.app`

---

## Phase 7: Backend Deployment to Render

1. Created Render Blueprint via [render.com](https://render.com) using [render.yaml](file:///c:/Users/Sumit%20Yadav/OneDrive/Documents/Desktop/OmniGuide/render.yaml).
2. Render automated the build and startup:
   - **Build Command**: `pip install -r backend/requirements.txt`
   - **Start Command**: `PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Health Check Path**: `/api/health`
3. **Live Verification**:
   - Backend URL: [https://omniguide-api.onrender.com](https://omniguide-api.onrender.com)
   - Tested `/api/health`: Status `healthy`
   - Tested `/api/status`: Status `operational`, 1 guideline loaded, 7 clauses active, 3 approved facts registered.

---

## Phase 8: Linking Frontend & Backend

1. **Configured Vercel Environment Variables**:
   ```powershell
   cd frontend
   npx vercel env add VITE_API_BASE_URL --environment production,preview,development --value "https://omniguide-api.onrender.com/api" --yes
   ```
2. **Created Production Config**:
   Generated `frontend/.env.production` containing:
   ```env
   VITE_API_BASE_URL=https://omniguide-api.onrender.com/api
   ```
3. **Production Redeployment**:
   Rebuilt and promoted the production deployment on Vercel:
   ```powershell
   cd frontend
   npm run build
   npx vercel --prod --yes
   ```
4. **CORS Handshake Verification**:
   - Sent preflight `OPTIONS` request to Render backend with `Origin: https://frontend-liard-phi-33.vercel.app`.
   - Returned `Status: 200` with `Access-Control-Allow-Origin: https://frontend-liard-phi-33.vercel.app`.

---

## Final Production Endpoints

| Resource | URL | Status |
| :--- | :--- | :--- |
| **Frontend Application** | [https://frontend-liard-phi-33.vercel.app](https://frontend-liard-phi-33.vercel.app) | **Live & Connected** |
| **Backend REST API** | [https://omniguide-api.onrender.com](https://omniguide-api.onrender.com) | **Live & Healthy** |
| **Interactive API Documentation** | [https://omniguide-api.onrender.com/docs](https://omniguide-api.onrender.com/docs) | **Live Swagger UI** |
| **Backend Health Check** | [https://omniguide-api.onrender.com/api/health](https://omniguide-api.onrender.com/api/health) | **HTTP 200 OK** |
