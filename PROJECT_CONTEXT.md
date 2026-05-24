# CareerDraft AI — Project Context Document

> Last updated: April 2026  
> Purpose: Complete reference for any AI assistant or new developer to understand the project without reading every file.

---

## 🔥 Current Focus (IMPORTANT — Read This First)

**Working on:** Fixing Groq AI integration after API key rotation

**Current Problem:**
- All AI features (Generate Resume, Enhance Resume, ATS AI feedback) are broken
- Groq dashboard shows 0 API calls — requests never reach Groq
- Frontend shows "Summary improved!" toast but nothing actually changes
- Backend logs show `401 UNAUTHORIZED` from Groq API
- Root cause: `.env` file is not being loaded correctly — only 1 of 10 variables is being injected into Spring context

**Goal:**
- `.env` loads all 10 variables (not just 1)
- Groq API calls succeed (200 OK, not 401)
- AI features work end-to-end
- Groq dashboard shows API usage

**Next Steps:**
1. Fix `ResumeAiBackendApplication.loadDotEnvIntoSystemProperties()` — remove `System.getenv()` guard so `.env` always overrides stale OS env vars
2. Run `mvn clean spring-boot:run` to force recompile
3. Verify startup log shows `.env loaded: 10 variables` (not 1)
4. Test AI Improve button in the resume builder

---

## 1. What This Project Is

**CareerDraft AI** is a full-stack SaaS resume builder and ATS (Applicant Tracking System) analyzer. Users can:

- Generate a professional resume from a plain-text description using Groq AI
- Edit the resume in a 3-column interactive builder (sidebar + form + live preview)
- Choose from 15+ dynamic templates (3 layouts × 5 color themes × 3 fonts)
- Upload an existing PDF/DOCX resume and get a 6-dimensional ATS score
- Get AI-powered feedback, rewritten bullet examples, and an improvement plan
- Upgrade to Pro (₹49 one-time) via Razorpay for unlimited ATS scans

---

## 2. Tech Stack

### Backend — `resume-ai-backend/`
| Layer | Technology |
|---|---|
| Framework | Spring Boot 3.4.3, Java 21 |
| Database | PostgreSQL (Supabase) via JPA/Hibernate |
| AI | Groq API (`llama-3.1-8b-instant`) via WebClient |
| Auth | JWT (httpOnly cookie) + Spring Security |
| File parsing | Apache PDFBox (PDF) + Apache POI (DOCX) |
| Rate limiting | Bucket4j (`IpRateLimitingFilter`) |
| Payment | Razorpay Java SDK |
| Env loading | dotenv-java 3.0.0 (loaded in `main()` via `System.setProperty()`) |
| Build | Maven |

### Frontend — `resume_frontend/`
| Layer | Technology |
|---|---|
| Framework | React 18 + Vite |
| Styling | TailwindCSS + DaisyUI (`saas` custom light theme) |
| State | React Context (`AuthContext`, `ResumeContext`) |
| HTTP | Axios (`axiosInstance` with `withCredentials: true`) |
| Forms | React Hook Form |
| PDF export | react-to-print |
| Routing | React Router v6 |
| Notifications | react-hot-toast |

### Python Microservice — `ats-python-service/`
| Layer | Technology |
|---|---|
| Framework | FastAPI + Uvicorn |
| Embeddings | sentence-transformers (`all-MiniLM-L6-v2`) |
| Scoring | Deterministic rule-based engine (no LLM) |
| File parsing | pdfplumber + python-docx |

---

## 3. Project Structure

```
/
├── resume-ai-backend/          Spring Boot backend (port 8081)
│   ├── src/main/java/com/resume/backend/
│   │   ├── ResumeAiBackendApplication.java   Entry point + .env loader
│   │   ├── ai/                               Groq AI service + mock
│   │   ├── ats/                              ATS scoring, controller, mapper
│   │   │   └── upload/                       File parsing (PDF/DOCX)
│   │   ├── auth/                             Register/login/logout/me
│   │   ├── controller/                       ResumeController (generate/enhance)
│   │   ├── payment/                          Razorpay integration
│   │   ├── security/                         JWT filter, SecurityConfig
│   │   ├── services/                         ResumeServiceImpl
│   │   └── user/                             User entity, UsageLimitService
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   ├── resume_prompt.txt                 AI prompt for generation
│   │   ├── enhancement_prompt.txt            AI prompt for enhancement
│   │   ├── ats_feedback_prompt.txt           AI prompt for ATS feedback
│   │   └── comprehensive_ats_prompt.txt      Single-call ATS prompt
│   └── .env                                  Local secrets (never commit)
│
├── resume_frontend/            React frontend (port 5173)
│   ├── src/
│   │   ├── api/ResumeService.js              All axios API calls
│   │   ├── context/
│   │   │   ├── AuthContext.jsx               Login/logout/session state
│   │   │   └── ResumeContext.jsx             Resume data + template state
│   │   ├── pages/
│   │   │   ├── GenerateResume.jsx            3-column resume builder
│   │   │   ├── ATSAnalysis.jsx               ATS upload + results
│   │   │   ├── TemplateGallery.jsx           Template picker (15+ variants)
│   │   │   └── ResumeView.jsx                Full-screen preview
│   │   ├── templates/
│   │   │   ├── templateConfig.js             Layout × theme × font config
│   │   │   └── DynamicTemplate.jsx           Renders any template combination
│   │   └── components/
│   │       ├── Navbar.jsx                    Auth modal + nav
│   │       └── Templates/                   Legacy DefaultTemplate, ModernTemplate, MinimalistTemplate
│   └── tailwind.config.js                   Custom `saas` DaisyUI theme
│
└── ats-python-service/         Python scoring microservice (port 8000)
    ├── main.py                 FastAPI app + lifespan warmup
    ├── scorer.py               Deterministic 6-dimension ATS engine
    ├── embedder.py             sentence-transformers singleton + cache
    └── parser.py               PDF/DOCX text extraction
```

---

## 4. API Endpoints

### Auth — `/api/auth/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account, sets httpOnly cookie |
| POST | `/api/auth/login` | Public | Login, sets httpOnly cookie |
| POST | `/api/auth/logout` | Public | Clears cookie |
| GET | `/api/auth/me` | Cookie | Returns current user info |

### Resume — `/api/v1/resume/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/resume/generate` | Public | Generate resume from text description |
| POST | `/api/v1/resume/enhance` | Public | Enhance full resume with AI |
| POST | `/api/v1/resume/enhance-bullet` | Public | Improve a single bullet point |

### ATS — `/api/v1/ats/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/v1/ats/upload` | Public | Upload PDF/DOCX → ATS score |
| POST | `/api/v1/ats/analyze` | Public | Score structured JSON resume |

### Payment — `/api/payment/`
| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/payment/create-order` | JWT required | Create Razorpay order |
| POST | `/api/payment/verify` | JWT required | Verify payment + upgrade to Pro |

### Python Microservice — `http://localhost:8000`
| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/warmup` | Trigger model warmup |
| POST | `/match-score` | Full deterministic ATS score |
| POST | `/parse-resume` | Extract text from PDF/DOCX |

---

## 5. Environment Variables (`.env`)

```env
SERVER_PORT=8081
DB_URL=jdbc:postgresql://...supabase.co:5432/postgres
DB_USERNAME=postgres
DB_PASSWORD=...
AI_MODE=groq                    # "groq" or "mock"
GROQ_API_KEY=gsk_...            # From console.groq.com/keys
GROQ_MODEL=llama-3.1-8b-instant # Optional, this is the default
JWT_SECRET=...                  # Min 32 chars
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

**How `.env` is loaded:** `ResumeAiBackendApplication.main()` calls `loadDotEnvIntoSystemProperties()` which uses `dotenv-java` to read `.env` and call `System.setProperty()` for each variable **before** Spring starts. This ensures `${VAR}` placeholders in `application.properties` resolve correctly. On production servers (no `.env` file), `ignoreIfMissing()` silently skips it and real OS env vars are used.

---

## 6. Authentication Flow

1. User registers/logs in → backend generates JWT → sets `auth_token` httpOnly cookie
2. Every subsequent request sends the cookie automatically (`withCredentials: true`)
3. `JwtAuthenticationFilter` reads cookie (or `Authorization: Bearer` header as fallback)
4. `AuthContext.jsx` calls `/api/auth/me` on mount to restore session
5. User info stored in React state only (no localStorage for tokens)

---

## 7. ATS Scoring Architecture

Two scoring engines, Python-first with Java fallback:

**Python engine (deterministic, preferred):**
- 6 dimensions: Skill Match (40pts) + Experience (20pts) + Education (10pts) + Semantic Similarity (10pts) + Section Completeness (10pts) + Readability (10pts)
- No LLM involved — fully reproducible
- `sentence-transformers` for semantic similarity
- Model loaded at startup, cached in memory

**Java engine (fallback when Python is unavailable):**
- Same 6 dimensions, rule-based
- Uses Groq AI only for keyword extraction (plain text mode, not JSON)
- Activates automatically when Python service is unreachable

**Response includes:**
- `overallScore` (0-100)
- `breakdown` — per-dimension score + human-readable reason
- `potentialScore` + `improvements` — ordered action list with point impact
- `categorizedMissingSkills` — CRITICAL / IMPORTANT / NICE_TO_HAVE
- `semanticSimilarity` — cosine similarity percentage
- `engineUsed` + `fallbackUsed` + `processingTimeMs` — observability

---

## 8. AI Service Architecture

```
AIService (interface)
├── GroqAIService    — active when AI_MODE=groq
│   ├── generateResume()     → callGroqAPI() with json_object mode
│   ├── enhanceResume()      → callGroqAPI() with json_object mode
│   ├── analyzeStructure()   → callGroqAPI() with json_object mode
│   ├── generateFeedback()   → callGroqAPIPlainText() — plain text, no JSON constraint
│   └── extractKeywords()    → callGroqAPIPlainText() — comma-separated list
└── MockAIService    — active when AI_MODE=mock (default if not set)
    └── Returns static sample data, no API calls
```

**Key detail:** `generateFeedback` and `extractKeywords` use plain-text mode (no `response_format: json_object`) because Groq returns 400 errors when forced JSON mode is used for non-JSON responses.

---

## 9. Template System

```
templateConfig.js
├── LAYOUTS: modern | minimal | professional
├── THEMES: blue | purple | emerald | slate | rose
└── FONTS: inter | poppins | lato

TEMPLATES = 15 curated combinations (layout × theme × font)
```

`DynamicTemplate.jsx` renders any combination from a single `config` prop. Google Fonts are loaded lazily via a `useFontLoader` hook. The `TemplateGallery` page shows live scaled-down previews (36% scale) using real sample data — no static images.

---

## 12. End-to-End Data Flows

### Flow A — Generate Resume from Text

```
User types description → clicks "Generate with AI"
  │
  ▼
GenerateResume.jsx → handleAiGenerate()
  │  POST /api/v1/resume/generate
  │  Body: { "userDescription": "I am a Java developer..." }
  ▼
ResumeController.generateResume()
  │  → ResumeServiceImpl.generateResumeResponse()
  │  → loads resume_prompt.txt, injects {{userDescription}}
  │  → GroqAIService.generateResume(prompt)
  │  → Groq API (llama-3.1-8b-instant) → JSON resume
  │  → JsonParserUtil.parseAiResponse() → { data: {...} }
  ▼
Frontend receives { data: { personalInformation, summary, skills, ... } }
  │  → updateResumeData(data)
  │  → ResumeContext stores it
  ▼
Live preview updates instantly in right panel
```

### Flow B — ATS Analysis (File Upload)

```
User uploads PDF + pastes job description → clicks "Analyse Resume"
  │
  ▼
ATSAnalysis.jsx → handleAnalyze()
  │  POST /api/v1/ats/upload (multipart/form-data)
  │  Fields: resumeFile, jobDescription, includeAiFeedback=true
  ▼
AtsController.uploadAndScore()
  │
  ├─ Step 1: Extract text
  │    PythonScoringClient.parseFile() → Python /parse-resume
  │    (fallback: ResumeFileParserService — PDFBox/POI)
  │
  ├─ Step 2: Score
  │    PythonScoringClient.matchScore() → Python /match-score
  │    (fallback: AtsAnalyzerService — Java rule-based)
  │
  ├─ Step 3: AI Feedback (if includeAiFeedback=true)
  │    AtsAiFeedbackService.generateFeedback()
  │    → GroqAIService.generateFeedback() (plain text mode)
  │
  └─ Step 4: Build response
       ResumeFileUploadResponse { atsAnalysis, engineUsed, processingTimeMs, ... }
  ▼
Frontend receives response
  │  → setAtsResult(result)
  │  → renders score breakdown, missing skills, improvement plan
```

### Flow C — Auth (Login)

```
User enters email + password → clicks "Sign In"
  │
  ▼
Navbar.jsx → AuthModal → handleSubmit()
  │  POST /api/auth/login
  │  Body: { "email": "...", "password": "..." }
  ▼
AuthController.login()
  │  → validates credentials
  │  → JwtService.generateToken(user)
  │  → sets httpOnly cookie: auth_token=<JWT>; SameSite=Strict
  ▼
AuthContext.login() receives response
  │  → setUser({ email, scanCount, isPro })
  │  → user stored in React state only (no localStorage)
  ▼
Every subsequent request sends cookie automatically (withCredentials: true)
  │
  ▼
JwtAuthenticationFilter reads cookie → validates JWT → sets SecurityContext
```

### Flow D — Bullet Point AI Improvement

```
User clicks "AI Improve" on a bullet in the resume builder
  │
  ▼
GenerateResume.jsx → StepSummary/StepExperience → improve()
  │  POST /api/v1/resume/enhance-bullet
  │  Body: { "text": "worked on APIs", "context": "Senior Developer at Acme" }
  ▼
ResumeController.enhanceBullet()
  │  → builds rewrite prompt
  │  → ResumeServiceImpl.generateBulletImprovement(prompt)
  │  → GroqAIService.generateFeedback() (plain text, no JSON mode)
  │  → strips any accidental JSON wrapping
  ▼
Returns: { "improved": "Built 5 REST APIs reducing response time by 40%" }
  │
  ▼
Frontend updates the textarea with improved text
```

---

## 13. Request / Response Examples

### POST `/api/auth/register`
```json
// Request
{ "email": "user@example.com", "password": "mypassword123" }

// Response 201
{ "token": "eyJhbGci...", "email": "user@example.com", "scanCount": 0, "isPro": false }
// Also sets: Set-Cookie: auth_token=eyJhbGci...; HttpOnly; SameSite=Strict
```

### POST `/api/v1/resume/generate`
```json
// Request
{ "userDescription": "I am a Java developer with 2 years experience in Spring Boot and React..." }

// Response 200
{
  "data": {
    "personalInformation": {
      "fullName": "Sachin Gupta",
      "email": "sachin@example.com",
      "phoneNumber": "+91 9876543210",
      "location": "Pune, India",
      "linkedIn": null,
      "gitHub": null
    },
    "summary": "Full-stack developer with 2 years experience in Spring Boot and React.",
    "skills": [
      { "title": "Java", "level": "Advanced" },
      { "title": "Spring Boot", "level": "Advanced" },
      { "title": "React", "level": "Intermediate" }
    ],
    "experience": [
      {
        "jobTitle": "Software Developer",
        "company": "Imaxxty",
        "duration": "2022 - Present",
        "responsibility": "Built web applications using Spring Boot and React"
      }
    ],
    "education": [
      { "degree": "B.E. Computer Science", "university": "VIT", "graduationYear": "2022" }
    ],
    "certifications": [],
    "projects": [],
    "languages": [{ "name": "English" }],
    "interests": []
  }
}
```

### POST `/api/v1/ats/upload`
```json
// Request: multipart/form-data
// resumeFile: <PDF or DOCX binary>
// jobDescription: "We are looking for a Java developer with Spring Boot, Docker, AWS..."
// includeAiFeedback: true

// Response 200
{
  "extractedText": "Sachin Gupta\nJava Developer...",
  "atsAnalysis": {
    "atsScore": 72,
    "atsVerdict": "Good",
    "verdictExplanation": "Strong match with room for targeted improvements",
    "confidence": 0.87,
    "keywordMatchPercentage": 68.5,
    "semanticSimilarity": 0.74,
    "potentialScore": 85,
    "potentialImprovement": 13,
    "breakdown": {
      "skills": { "score": 28, "maxScore": 40, "reason": "Matched: Java, Spring Boot. Missing critical: Docker, AWS" },
      "experience": { "score": 15, "maxScore": 20, "reason": "3 years meets the 2+ year requirement" },
      "sections": { "score": 8, "maxScore": 10, "reason": "Present: summary, skills, experience, education. Missing: projects" },
      "impact": { "score": 6, "maxScore": 10, "reason": "Only 40% of bullets contain numbers/metrics" },
      "readability": { "score": 8, "maxScore": 10, "reason": "Clean writing — no major readability issues" },
      "education": { "score": 7, "maxScore": 10, "reason": "Bachelor's degree meets requirement" }
    },
    "categorizedMissingSkills": [
      { "name": "Docker", "severity": "CRITICAL" },
      { "name": "AWS", "severity": "CRITICAL" },
      { "name": "Kubernetes", "severity": "IMPORTANT" }
    ],
    "matchedKeywords": ["Java", "Spring Boot", "REST API", "PostgreSQL"],
    "strongSkills": ["Java", "Spring Boot", "REST API"],
    "improvements": [
      { "action": "Add \"Docker\" to your Skills section (required by job description)", "impact": 6, "category": "SKILL" },
      { "action": "Add \"AWS\" to your Skills section (required by job description)", "impact": 6, "category": "SKILL" },
      { "action": "Add quantified achievements to your bullet points", "impact": 5, "category": "IMPACT" }
    ],
    "tailoringTips": [
      "Add these required skills immediately: Docker, AWS — they appear in the 'Required' section",
      "Quantify your bullets: 'Built 5 REST APIs reducing response time by 40%'"
    ],
    "aiFeedback": {
      "overallSummary": "Your resume shows strong Java fundamentals but lacks cloud and containerization skills that are explicitly required.",
      "skillsFeedback": "Strengths: Java, Spring Boot, REST API. Missing: Docker, AWS, Kubernetes",
      "rewrittenBullets": [
        "worked on APIs → Built 12 REST APIs serving 50,000 daily users, reducing response time by 35%"
      ]
    },
    "totalBullets": 5,
    "quantifiedBullets": 2,
    "weaknessFlags": [],
    "warnings": [],
    "isEntryLevel": false
  },
  "filename": "sachin_resume.pdf",
  "fileSize": 245760,
  "fileType": ".pdf",
  "remainingScans": 1,
  "engineUsed": "python",
  "fallbackUsed": false,
  "processingTimeMs": 1847
}
```

### POST `/api/v1/resume/enhance-bullet`
```json
// Request
{ "text": "worked on APIs", "context": "Senior Developer at Acme Corp" }

// Response 200
{ "improved": "Built 5 REST APIs reducing response time by 40%, serving 20,000 daily requests" }
```

### POST `/api/payment/create-order`
```json
// Request (requires auth cookie)
{}

// Response 200
{ "orderId": "order_abc123", "keyId": "rzp_test_SIi...", "amount": 4900, "currency": "INR" }
```

---

## 10. Known Issues & Important Notes

1. **`.env` must be in `resume-ai-backend/` directory** (not project root) — dotenv-java looks in the working directory where Maven runs.

2. **`mvn clean spring-boot:run` required after code changes** — `mvn spring-boot:run` alone skips recompilation if Maven thinks classes are up to date.

3. **Python service is optional** — if not running, Java fallback activates automatically. Start with: `cd ats-python-service && .\fix_and_start.ps1`

4. **Razorpay CDN** (`checkout-static-next.razorpay.com`) may be blocked by some ISPs in India. Change DNS to `8.8.8.8` if payment modal fails to load.

5. **Free tier limit** — 2 ATS scans for unauthenticated users, enforced in `UsageLimitService`. Pro users get unlimited scans.

6. **JWT secret** must be at least 32 characters — enforced in `JwtService.init()`.

---

## 11. How to Start Locally

```powershell
# Terminal 1 — Python ATS service (optional but recommended)
cd ats-python-service
.\fix_and_start.ps1

# Terminal 2 — Spring Boot backend
cd resume-ai-backend
mvn clean spring-boot:run

# Terminal 3 — React frontend
cd resume_frontend
npm run dev
```

URLs:
- Frontend: http://localhost:5173
- Backend: http://localhost:8081
- Python service: http://localhost:8000
- Python health check: http://localhost:8000/health
