# Healio — AI-Powered Healthcare Triage (Hackathon)

Premium-feeling triage web app: React + Tailwind + Framer Motion + shadcn-style UI on the frontend; FastAPI + SQLite or PostgreSQL + LangChain (Google Gemini) + scikit-learn on the backend.

## Prerequisites

- Node.js 20+
- Python 3.9+ (3.10+ recommended)
- Docker (optional, only if you want PostgreSQL instead of the default SQLite file)

## 1. Database

**Default (simplest):** do nothing. The API uses **SQLite** at `backend/healio.db` when `DATABASE_URL` is not set, so you do not need Docker or Postgres for local development.

**PostgreSQL (optional):** from the repo root:

```bash
docker compose up -d
```

Then in `backend/.env` set:

`DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/healio`  
(plain `postgresql://…` is also accepted and normalized.)

## 2. Backend (FastAPI)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
```

Edit `.env`:

- **Leave `DATABASE_URL` unset** for SQLite, or set it for Postgres as above.
- `GEMINI_API_KEY=...` or `GOOGLE_API_KEY=...` (same key from [Google AI Studio](https://aistudio.google.com/apikey); required for live chat)
- Optional: `GEMINI_MODEL=gemini-2.0-flash` (default) — use another allowed model id if you prefer

On first request the API creates tables and trains/persists a `RandomForestClassifier` risk model under `backend/models/risk_forest.joblib` (synthetic training data is generated at `backend/data/symptoms_training.csv` if missing).

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

Health check: `http://127.0.0.1:8000/health`

## One-command dev

From the repo root:

```bash
chmod +x dev.sh
./dev.sh
```

This will create the backend virtualenv (if missing), install dependencies, ensure `backend/.env` exists, then start both backend and frontend.

## 3. Frontend (Vite + React)

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The dev server proxies `/api` to `http://127.0.0.1:8000`.

If your backend is deployed on a different origin, create `frontend/.env` and set:

```bash
VITE_API_BASE_URL=https://your-backend.example.com
```

When this variable is unset, the frontend keeps using the current origin and Vite's local `/api` proxy.

Build for production:

```bash
npm run build
npm run preview
```

## Product flow

1. **Landing** — hero, motion, theme toggle, “Start triage”.
2. **Onboarding** — name, age, gender, conditions, medications → creates a PostgreSQL-backed session.
3. **Chat** — multi-turn Gemini triage conversation with typing indicator; symptom toggles auto-hint from transcript.
4. **Assessment** — RandomForest-derived risk score (0–100) with green / amber / red care bands.
5. **Dashboard** — animated gauge, conditions, first aid, next steps, Recharts severity breakdown, session transcript, PDF export (jsPDF), emergency overlay for high risk / red-flag phrases.

## Ethics

The UI always surfaces: *This is not a replacement for professional medical diagnosis. Consult a licensed doctor for final decisions.*

## Troubleshooting

- **Application startup failed / connection refused on port 5432**: Postgres is not running, but your `.env` still points at Postgres. Either start Docker (`docker compose up -d`) or **remove `DATABASE_URL`** from `.env` to use the default SQLite file.
- **`cp: … Not a directory`**: use `cp .env.example .env` (copy the file), not `cp SOME_VAR_NAME ...` as a path.
- **Chat returns offline message**: verify `GEMINI_API_KEY` or `GOOGLE_API_KEY` in `backend/.env` and restart `uvicorn`.
- **DB connection errors**: ensure Postgres is up and `DATABASE_URL` matches your instance.
- **CORS in production**: add your deployed origin to `allow_origins` in `backend/app/main.py`.
