# OmniGuide — AI Brand Governance That Explains, Not Just Rejects

**Team:** NovaForge  
**Tagline:** AI brand governance that explains, not just rejects.  
**Built for:** National Hackathon 2026

---

## 1. Product Vision

OmniGuide helps organisations audit and govern marketing content before publication. It reviews submitted draft copy against uploaded brand guidelines, identifies potential violations, explains **why** each issue matters, cites exact supporting guideline clauses with source document names and page numbers, and suggests intent-preserving corrections.

### Core Philosophy: Human-in-the-Loop Governance
- **AI assists, humans decide:** OmniGuide never silently publishes content or modifies copy without human approval.
- **Evidence-backed, no hallucinations:** Every guideline citation is validated against stored database records. If an external AI proposes an ungrounded or invented clause ID, OmniGuide flags it as unverified rather than presenting it as fact.
- **Distinguishing unverified from false:** Claims lacking registered approved sources are clearly labelled as `missing_approved_source`, never mischaracterised as verified false.
- **Resilient fallback:** Operates in Hybrid AI mode (Gemini Flash + Deterministic rules) or pure Deterministic mode when offline or without an API key.

---

## 2. Architecture & Technology Stack

```
┌────────────────────────────────────────────────────────┐
│                   OmniGuide Frontend                   │
│   React 19 + TypeScript + Vite + Tailwind CSS + Lucide │
└──────────────────────────┬─────────────────────────────┘
                           │ HTTP / JSON REST API
┌──────────────────────────▼─────────────────────────────┐
│                   FastAPI Backend                      │
│                                                        │
│  ┌────────────────────┐      ┌──────────────────────┐  │
│  │ Deterministic Rules│      │  Guideline Retriever │  │
│  │ (Regex, Banned, %) │      │  (BM25 Lexical / PGs)│  │
│  └─────────┬──────────┘      └───────────┬──────────┘  │
│            │                             │             │
│            ▼                             ▼             │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Gemini Flash Analysis (Google GenAI Python SDK) │  │
│  │   Structured Pydantic JSON Output Schema         │  │
│  └──────────────────────────┬───────────────────────┘  │
│                             │                          │
│                             ▼                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │   Evidence Validator & Anti-Hallucination Engine │  │
│  └──────────────────────────┬───────────────────────┘  │
└─────────────────────────────┼──────────────────────────┘
                              │ SQLAlchemy 2.x ORM
┌─────────────────────────────▼──────────────────────────┐
│              PostgreSQL Database (Neon)                │
│    Guidelines • Clauses • Approved Facts • Reviews     │
└────────────────────────────────────────────────────────┘
```

- **Frontend:** React, Vite, TypeScript, Tailwind CSS, Lucide React, React Router.
- **Backend:** Python 3.13, FastAPI, Pydantic v2, SQLAlchemy 2.x, Psycopg 3.
- **AI Engine:** Google Gemini Flash (`gemini-2.5-flash`) via official Google GenAI Python SDK (`google-genai`).
- **Document Processing:** PyMuPDF (`pymupdf`) for page-by-page text and clause extraction.
- **Deterministic Rule Engine:** Python regular expressions, banned term detection, superlative pattern matching, approved-facts metric grounding.
- **Database:** PostgreSQL on Neon (with automatic SQLite fallback for local developer testing).

---

## 3. Core Workflow

1. **Step 1 — Add Guidelines & Approved Facts:**
   - Upload text-based PDF guidelines (parsed page-by-page via PyMuPDF).
   - Or paste guidelines manually.
   - Intelligent clause splitter assigns stable identifiers (`SEC-1.1`, `RULE-02`) and preserves page numbers.
   - Detects scanned/image-only PDFs and provides a clear notice that OCR is not supported.
   - Register corporate Approved Facts (e.g., benchmark latency, uptime SLA, customer counts).

2. **Step 2 — Submit Marketing Content:**
   - Review title, content type, marketing draft copy, optional campaign context.
   - Choice between Hybrid Mode (Gemini Flash + Deterministic rules) and Deterministic Mode.
   - Pre-loaded hackathon evaluation scenarios with one-click buttons.

3. **Step 3 — 5-Stage Hybrid Governance Pipeline:**
   - **Stage A:** Deterministic regex scans for absolute superlatives, banned words, and metric claims.
   - **Stage B:** Lexical BM25 retrieval pulls relevant clauses with document names and page numbers.
   - **Stage C:** Gemini Flash analyzes copy, explains violations, and proposes intent-preserving rewrites.
   - **Stage D:** Evidence validation verifies cited clause IDs against stored records.
   - **Stage E:** Synthesizes clean revised draft and creates audit log.

4. **Step 4 — Display Findings & Citations:**
   - Severity badges (High, Medium, Low).
   - Category tags (`unsupported_superlative`, `banned_term`, `missing_approved_source`).
   - Exact highlighted excerpt from submitted copy.
   - Explanation of why this violates brand and legal standards.
   - Exact guideline clause citation, supporting quote, source document, and page number.
   - Evidence integrity badge (`Ground Truth Cited`, `Missing Approved Fact`, `Deterministic Rule`).

5. **Step 5 — Human Decisions & Interactive Editor:**
   - **Accept Suggestion:** Applies replacement to revised copy.
   - **Custom Edit:** Opens modal for bespoke marketer rewrite.
   - **Dismiss:** Marks finding as dismissed with reason.
   - **Side-by-Side Comparison:** Immutable original vs. live interactive revised editor.
   - **Audit Trail:** Chronological log of every action taken on the review.

6. **Step 6 — Review History & Auditability:**
   - Full search, filter, inspect, and delete capabilities persisted in PostgreSQL.

---

## 4. Local Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Clone & Set Up Backend
```bash
git clone https://github.com/syntaxcommandant/OmniGuide.git
cd OmniGuide

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r backend/requirements.txt

# Create .env from template
cp .env.example .env
```

Set your `GEMINI_API_KEY` in `.env` (optional; deterministic mode operates if omitted).

### 2. Run Backend Server
```bash
# Windows PowerShell:
$env:PYTHONPATH="backend"; uvicorn app.main:app --reload --port 8000

# macOS / Linux:
PYTHONPATH=backend uvicorn app.main:app --reload --port 8000
```
- API Documentation: [http://localhost:8000/docs](http://localhost:8000/docs)
- Health Check: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- System Status: [http://localhost:8000/api/status](http://localhost:8000/api/status)

### 3. Run Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

---

## 5. Automated Tests

The repository includes a comprehensive Pytest test suite covering all core requirements:

```bash
# Run pytest from root
pytest -v
```

### Test Results Summary
- `test_health_check` — Verified API health endpoint response.
- `test_system_status` — Verified DB connection, guideline counts, and status output.
- `test_canonical_superlative_review_workflow` — End-to-end test with `"India's #1 fastest tool for Indian teams."`
- `test_manual_guideline_creation` — Verified text parsing and clause persistence.
- `test_invalid_pdf_handling` — Verified rejection of non-PDF or empty files.
- `test_split_numbered_sections` — Tested section regex extraction (`SEC-1.1`, `SEC-1.2`).
- `test_split_bullet_points` — Tested bullet item clause extraction with stable IDs.
- `test_valid_clause_citation_verified` — Verified real guideline clause citation matching.
- `test_hallucinated_clause_flagged` — Verified hallucinated IDs flagged as `insufficient_evidence`.
- `test_detect_unsupported_superlative_number_one` — Tested `#1` and `fastest` pattern matching.
- `test_detect_banned_terms` — Tested detection of `cheap` and `silver bullet`.
- `test_approved_facts_matching` — Verified approved `42ms` vs unverified `99.9%` metric check.

---

## 6. Judge Demo Scenario Checklist

Use this step-by-step checklist to test the product during evaluation:

### Scenario 1: The Canonical Test Case (Unsupported Superlatives)
1. Navigate to **New Review** in the sidebar (or click **Run Demo: "#1 Fastest" Case** in the header).
2. Click the pre-load button: **Canonical Superlative (#1 Fastest)**.
   - Text loaded: `"India's #1 fastest tool for Indian teams."`
3. Click **Run Brand Compliance Review**.
4. **Expected Results:**
   - Two high-severity findings detected:
     1. Excerpt: `"#1"` — Cites `SEC-1.1` (Page 1) prohibiting unsupported ranking superlatives.
     2. Excerpt: `"fastest"` — Cites `SEC-1.2` (Page 1) requiring benchmark data for absolute speed claims.
   - Actionable intent-preserving replacement suggested.
   - Click **Accept Suggestion** on finding 1: watch the Revised Compliant Copy update live!
   - Click **Custom Edit** on finding 2: enter `"high-performance"` and click apply.
   - Review overall status updates to **Resolved**.
   - Review is saved to PostgreSQL and appears in **Review History**.

### Scenario 2: Compliant Copy with Approved Fact
1. Go to **New Review** and select **Compliant Enterprise Launch Copy**.
   - Text: `"A high-performance governance platform built for teams across India, delivering 42ms benchmark latency for enterprise workflows."`
2. Run Review:
   - Evaluated as **Compliant**.
   - The quantitative claim `42ms` is validated against the registered TechAudit Labs report in Approved Facts.

### Scenario 3: Unverifiable Claim & Guarantee
1. Go to **New Review** and select **Unverifiable Metric & Guarantee**.
   - Text: `"Used by 98% of all Fortune 500 CEOs daily to eliminate 100% of their operational errors."`
2. Run Review:
   - Flagged with `missing_approved_source` for `98%` (citing `SEC-2.2`).
   - Flagged with `unsupported_superlative` for `eliminate 100%` (citing `SEC-2.1`).

### Scenario 4: Uploading PDF Guidelines
1. Click **Download Sample Test PDF** on the Dashboard or Guidelines page.
2. Go to **Guidelines & Facts** → **Upload PDF Guidelines**.
3. Enter title: `"NovaForge Field Standard"` and select the downloaded `novaforge_governance_v2.4.pdf`.
4. Click **Upload & Extract Clauses**:
   - PyMuPDF extracts clauses page-by-page.
   - View extracted clauses in the table with exact page references.

---

## 7. Production Deployment Instructions

### Database (Neon PostgreSQL)
1. Create a free PostgreSQL instance on [Neon](https://neon.tech).
2. Copy the connection string.
3. Replace `postgres://` with `postgresql+psycopg://` if needed (the app auto-handles this prefix).

### Backend (Render)
1. Connect this GitHub repository to [Render](https://render.com).
2. Create a new **Web Service** using `render.yaml` or manual configuration:
   - **Environment:** Python 3
   - **Build Command:** `pip install -r backend/requirements.txt`
   - **Start Command:** `PYTHONPATH=backend uvicorn app.main:app --host 0.0.0.0 --port $PORT`
3. Add Environment Variables:
   - `DATABASE_URL`: Your Neon PostgreSQL connection string.
   - `GEMINI_API_KEY`: Your Google Gemini Flash API key.
   - `GEMINI_MODEL`: `gemini-2.5-flash`
   - `CORS_ORIGINS`: `https://your-frontend.vercel.app,*`

### Frontend (Vercel)
1. Import repository to [Vercel](https://vercel.com).
2. Set Root Directory to `frontend`.
3. Set Framework to `Vite`.
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-render-app.onrender.com/api`
5. Deploy.

---

## 8. Environment Variables Reference

| Variable | Scope | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Backend | `sqlite:///./omniguide.db` | PostgreSQL connection string (Neon/Render). |
| `GEMINI_API_KEY` | Backend | `""` | Google Gemini API key. Enables AI analysis. |
| `GEMINI_MODEL` | Backend | `gemini-2.5-flash` | Gemini model name. |
| `DEFAULT_ANALYSIS_MODE` | Backend | `hybrid` | `hybrid` or `deterministic`. |
| `CORS_ORIGINS` | Backend | `*` | Allowed origins for CORS. |
| `UPLOAD_MAX_SIZE_MB` | Backend | `15` | Maximum PDF upload size in megabytes. |
| `VITE_API_BASE_URL` | Frontend | `http://localhost:8000/api` | API backend URL for frontend requests. |

---

## 9. Implemented Features & Known Limitations

### Implemented Features
- [x] PyMuPDF PDF clause extraction with source page preservation.
- [x] Scanned PDF detection with explicit OCR notification.
- [x] Deterministic regex governance engine for superlatives, banned words, warranties.
- [x] Approved Facts library with quantitative metric grounding.
- [x] Lexical BM25 guideline clause retrieval.
- [x] Structured Google Gemini Flash audit with Pydantic JSON validation.
- [x] Anti-hallucination citation cross-check against database records.
- [x] Interactive human-in-the-loop decisions (Accept, Custom Edit, Dismiss).
- [x] Side-by-side original vs. revised live copy workbench.
- [x] Audit trail recording all marketer actions.
- [x] Review history with search, filtering, and PostgreSQL persistence.
- [x] Deep navy & teal enterprise dashboard UI with responsive mobile navigation.
- [x] 12 automated unit and integration tests passing.

### Known Limitations
- **Optical Character Recognition (OCR):** Scanned/rasterized PDFs without searchable digital text are detected and rejected with a clear user prompt, as pure raster OCR requires large external binary dependencies (e.g. Tesseract).
- **Secondary Provider (Groq):** Architected in configuration schema; Gemini Flash serves as primary.
