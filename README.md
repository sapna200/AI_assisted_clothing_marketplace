# ShopKart — AI-Assisted Clothing Marketplace

An AI-assisted clothing marketplace where the owner uploads a **product video** and an AI pipeline drafts the listing — title, description, category, color, detected size and price tag, and display images — for **human review and approval** before it goes live on a full storefront with cart, wishlist, and checkout.

---

## Live Demo

| What | URL |
|---|---|
| Storefront (Next.js) | https://your-app.vercel.app |
| API docs (Swagger) | https://your-api.onrender.com/docs |

> ⚠️ The backend runs on Render's **free tier**: after ~15 minutes of inactivity it spins down and takes **30–60 seconds to wake up** on the next request. If the first page load is slow, that's a cold start — give it a moment (or ping `/products` once before demoing).

---

## Key Features

- **Storefront** — responsive product grid, detail pages with image gallery, cart, wishlist, and a mock checkout flow with address validation, delivery estimates, and order confirmation.
- **AI product ingestion** — upload a video of a garment; OpenCV extracts evenly-spaced frames, Gemini vision generates a structured draft (`title`, `description`, `category`, `color`), reads the **printed size label** and **price tag** directly from the frames, and picks the clearest frames as display images.
- **Human-in-the-loop review** — every AI draft lands as `pending_review`. Nothing is auto-published. The owner edits any field in an admin dashboard, sees the AI's tag-price/suggested-range side-by-side with their own selling price input, then approves or rejects.
- **Approve-time pricing** — on approval, `base_price` resolves from owner override → detected tag price → AI suggestion; a draft with no price source can't be approved.
- **Multi-image selection** — Gemini chooses up to 3 clearest garment shots from the frame pool (avoiding tag close-ups), uploaded to Supabase Storage; the admin can reorder/remove/add images.
- **Category-aware catalog** — Indian ethnic categories included (Kurta, Kurti, Saree, Ethnic Wear, Co-ord Sets) alongside western wear and jewellery/accessories.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 16 (App Router), TypeScript, Tailwind CSS, Zustand |
| Backend | FastAPI, SQLAlchemy, Alembic, Pydantic v2 |
| Database | PostgreSQL (Supabase) |
| File storage | Supabase Storage (public buckets: `product-videos`, `product-images`) |
| AI | Google Gemini 2.5 Flash via `google-genai` SDK (structured JSON output, multi-image input) |
| Video frames | OpenCV (`opencv-python-headless`) — no FFmpeg binary needed |
| Hosting | Render (backend), Vercel (frontend) |

## Architecture Overview

```
Owner (admin UI)
   │  uploads video
   ▼
FastAPI (Render) ── saves temp copy, returns immediately
   │  BackgroundTask
   ├─► OpenCV: extract 8 evenly-spaced frames
   ├─► Gemini 2.5 Flash: one multi-image call → structured JSON draft
   │     (title, description, category, color, suggested price,
   │      detected_size, detected_tag_price, best_image_frame_names)
   ├─► Supabase Storage: video + 3 selected frames uploaded
   └─► Postgres: INSERT products (status = 'pending_review')

Owner reviews draft in /admin
   │  edit fields / reorder images / set selling price
   ├─► PATCH /admin/products/{id}        (save edits)
   └─► PATCH /admin/products/{id}/approve
         base_price resolves: owner override > tag price > AI suggestion
         status → 'approved'
               │
               ▼
   Public storefront (Vercel) shows it instantly
```

## Deliberate Scope Decisions

These tradeoffs are intentional — each was weighed against build time:

- **Pricing is human-controlled even when a tag is visible.** OCR of a printed tag can misread digits, and pricing is ultimately a business decision (margins, discounts). So `detected_tag_price` is stored as a *suggestion* shown prominently in review UI, while `base_price` stays null until the owner approves. A misread ₹1,999→₹199 must never silently go live.
- **Payments are mocked.** Checkout validates an address, shows delivery estimates, and simulates a payment step with an order ID. No real gateway integration.
- **Delivery estimates are simplified.** Pincode-prefix heuristic (metro vs. standard days), not a logistics API.
- **Frame selection ≠ photo editing.** Product images are raw video frames chosen by AI for clarity — no background removal, cropping, or enhancement. A dedicated image-editing pass is a natural Phase-2 extension.
- **No authentication yet.** The `/admin` routes are structurally owner-only but not gated. Known limitation; Supabase Auth + RLS is the planned fix.
- **Render free tier cold starts.** Expected behavior, documented above rather than hidden.
- **Single physical size detection.** A video shows *one* item with *one* size; the AI reports what's on the tag, and offering multiple sizes is a manual stock decision made at review — never invented by the model.

## Running Locally

### Prerequisites
Python 3.11+, Node 18+, a Supabase project (Postgres + Storage buckets `product-videos` & `product-images`, both public), and a Gemini API key from [aistudio.google.com](https://aistudio.google.com).

### Backend
```powershell
cd backend
python -m venv .venv && .\.venv\Scripts\Activate.ps1   # optional
pip install -r requirements.txt
```
Create `backend/.env`:
```
DATABASE_URL=postgresql://...supabase.co:5432/postgres
GEMINI_API_KEY=...
SUPABASE_URL=https://<ref>.supabase.co
SUPABASE_SERVICE_KEY=...
ALLOWED_ORIGINS=http://localhost:3000
```
Apply migrations and run:
```powershell
alembic upgrade head
uvicorn app.main:app --reload
```

### Frontend
```powershell
cd frontend
npm install
```
Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Run:
```powershell
npm run dev
```
Visit http://localhost:3000 · Admin dashboard at http://localhost:3000/admin

## Deployment

Monorepo layout (`backend/` + `frontend/` in one repo).

- **Backend on Render:** Web Service, Root Directory `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`. Set all env vars incl. `ALLOWED_ORIGINS=<vercel-url>,http://localhost:3000`.
- **Frontend on Vercel:** Root Directory `frontend`, env var `NEXT_PUBLIC_API_URL=<render-url>`.

## What I'd Improve With More Time

1. Real authentication (owner login) with route protection and RLS-backed storage policies
2. A real payment gateway (Razorpay/Stripe test mode minimum)
3. Actual image post-processing — background removal and cropping to the garment, so product photos look catalog-ready instead of raw video frames
4. Proper logistics API for accurate delivery estimates
5. Automated tests (pytest for the ingestion pipeline with a mocked Gemini client; Playwright for storefront flows)
6. Streaming/progress feedback during AI processing instead of polling the list
7. Multi-size inventory as first-class data (size ↔ stock mapping) instead of a comma-separated string