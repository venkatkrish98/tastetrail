# TasteTrail 🧭✨
### Cultural Outing Generator powered by Qloo Cultural Intelligence & Agentic AI

Built for the **Qloo Agentic Hackathon 2026**.

TasteTrail transforms how people explore cities by turning personal cultural anchors (films, musicians, books, and culinary crafts) into practical, beautifully paced micro-itineraries. Rather than relying on generic, foot-traffic-heavy tourist traps, TasteTrail connects cross-domain cultural tastes to real-world venues using the **Qloo Cultural AI Graph**, then applies deterministic constraints for time, budget, and mobility needs.

---

## 📌 Problem & Target Audience

### The Problem
When visiting or exploring a city with limited time (2 to 5 hours), travelers and locals are flooded with generic recommendation engines (TripAdvisor, Google Maps top results) that prioritize mass commercial popularity. These default recommendations steer people toward crowded chain cafes, souvenir shops, and tourist traps that lack cultural character.

### The Audience
- **Cultural Flâneurs & Travelers** seeking places aligned with their creative interests (e.g., Haruki Murakami readers, Wes Anderson film lovers, modal jazz listeners, independent cinema enthusiasts).
- **Urban Planners & Weekend Explorers** who have strict time budgets (e.g., 2–4 hours) and need realistic transit pacing.
- **Mobility-Conscious Individuals** requiring verified step-free access, lower walking radii, or sensory-moderate environments.

---

## 🚀 Key Features

1. **Cross-Domain Cultural Anchors (Official Qloo Integration)**
   - Enter 2–3 cultural anchors from diverse creative disciplines (e.g., *Miles Davis*, *Haruki Murakami*, *Wes Anderson*, *Studio Ghibli*, *Patti Smith*, *Blade Runner*, *Oaxacan cuisine*).
   - Resolves entities through Qloo’s taste graph using the official `/search` endpoint with documented `types` parameter and discovers physical venues (*places*) with high cultural affinity.

2. **Autonomous 5-Stage Agentic Workflow**
   - **Stage 1: Validation & Constraint Normalization:** Enforces coordinate bounds (`-90 <= lat <= 90`, `-180 <= lng <= 180`), duration limits (1.5h to 6h), payload size bounds (32KB max), and rate limits.
   - **Stage 2: Entity Resolution:** Queries Qloo `/search?types=...&query=...` and parses official `response.entities` format.
   - **Stage 3: Cultural Intelligence Retrieval:** Queries Qloo `GET /v2/insights` with `filter.type=urn:entity:place`, `signal.interests.entities`, and spatial coordinates `filter.location=POINT(lng lat)`.
   - **Stage 4: Deterministic Constraint Filtering:** App-side pruning for budget tiers ($, $$, $$$), transit radius, and dwell allocations.
   - **Stage 5: Synthesis & Provenance Attribution:** Allocates arrival offsets and dwell times, constructs the narrative sequence, and generates transparent provenance logs.

3. **Dual-Layer Provenance Panel**
   - Completely separates **Layer 1 (Qloo Cultural Intelligence Signals)** from **Layer 2 (TasteTrail App-Side Constraint Filtering)** so users and judges can trace exactly why each venue was chosen.

4. **Transparent Comparative Evaluation (With vs. Baseline)**
   - Built-in comparative evaluation contrasting TasteTrail's Qloo cultural trail against a generic mass-market tourist baseline.
   - *Methodology Notice:* Fully disclosed as a reference benchmark demonstrating standard high-foot-traffic / commercial recommendations, not an alternate live query.

5. **Two Execution Modes (Seamless Judge Access)**
   - **Live Qloo API Mode:** When a valid `QLOO_API_KEY` is configured in `.env.local`, requests query `https://hackathon.api.qloo.com`.
   - **Sample Fixture Mode (Offline Fallback):** When no key is configured or when the toggle is enabled, TasteTrail operates with labeled sample reference fixtures, ensuring judges can test every feature immediately without barriers.

---

## 🏛️ Architecture & Qloo Endpoints

```
[ User Request: City + Anchors + Constraints ]
                      │
                      ▼
        [ Next.js API Route Handler ]
         (/api/itinerary/plan - Server)
                      │
      ┌───────────────┴───────────────┐
      ▼                               ▼
[ Qloo Client (Server-Only) ]  [ Deterministic Rules Engine ]
• /search?types=...&query=...  • Budget Tier ($ / $$ / $$$)
• GET /v2/insights             • Pacing & Walking Radius Bounds
  filter.type=urn:entity:place • Dwell Allocation & Offsets
  signal.interests.entities    • Truthful Accessibility Notice
  filter.location=POINT()      
      │                               │
      └───────────────┬───────────────┘
                      ▼
     [ Synthesized Cultural Trail Output ]
      • Ordered Stops & Rationale
      • Dual-Layer Provenance Panel
      • With vs. Baseline Comparison
```

### Documented Qloo Endpoints Used:
- **Base URL:** `https://hackathon.api.qloo.com`
- **Authentication:** `X-Api-Key` header passed exclusively from server-side handlers.
- **Entity Resolution:** `GET /search?query={anchor}&types={entityType}` (supports `response.entities`, `entities`, `results`).
- **Cultural Place Insights:** `GET /v2/insights?filter.type=urn:entity:place&signal.interests.entities={id}&filter.location=POINT(lng lat)&filter.location.radius=20000`

---

## 🛡️ Security, Privacy & Ethical AI

- **Session Integrity & Anti-Spoofing:** Cryptographically HMAC-signed session cookies (`tt_session`) prevent client-side cookie forgery and rotation attacks.
  - In production, `SESSION_SECRET` strictly requires a private, high-entropy secret (at least 32 random characters/bytes; e.g. `openssl rand -hex 32`). Missing, weak, or known placeholder secrets are rejected at startup.
  - In development, an ephemeral in-memory secret is generated per process (sessions invalidate upon restart).
- **Rate Limiting & Scope Notice:** Max 20 requests/minute per client. Request body size bounded to 32KB (HTTP 413 Payload Too Large). Strict geographic coordinate bounds checking.
  - *Per-Instance Scope:* In-memory sliding window rate limits and singleflight Qloo probe caching operate per serverless instance / process on Vercel. They provide protection per instance, but are not globally synchronized across multiple independent serverless isolates unless backed by a shared external store (e.g., Upstash Redis).
- **Aggregate Cultural Affinities:** Qloo recommendations are presented as collective cultural affinities across creative communities, **never as proof of an individual's personal identity, private preferences, or predictive surveillance.**
- **Session Cookie & Client Privacy:** TasteTrail uses an anonymous, HTTP-only, cryptographically HMAC-signed session cookie (`tt_session`) exclusively for request rate limiting and client bucket isolation in untrusted proxy environments.
  - *Storage & Persistence:* The `tt_session` cookie is stored solely in the user's browser storage. TasteTrail does **not** persist any session records, user accounts, or personal identifiers in any server-side database or disk storage. On the server, only volatile in-memory sliding-window request timestamps (within a 60-second window) are kept in process memory for rate-limiting calculation and are pruned periodically.
  - *No Tracking or Profiling:* The cookie contains only a random UUID and its HMAC signature; it is never used for behavioral profiling, advertising, or cross-site tracking.
- **Truthful Operational Boundaries:** Qloo maps cultural taste affinities, not physical venue operations. Physical accessibility (wheelchair ramps), live opening hours, and real-time ticket prices are explicitly marked as unverified by Qloo and require direct venue confirmation.
- **Content Security Policy:** Strict CSP headers configured in `next.config.js` with `'unsafe-eval'` removed.

---

## 🏁 Quickstart & Run Instructions

### Prerequisites
- Node.js `v18+`, `v20+`, or `v24+`
- npm or yarn

### 1. Clone the repository
```bash
git clone https://github.com/venkatkrish98/tastetrail.git
cd tastetrail
```

### 2. Install dependencies
```bash
npm install
```

### 3. Check dependency integrity & lint
```bash
npm ls --depth=0
npm run lint
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Edit `.env.local` to provide your configuration:
```env
# Base URL for Qloo Hackathon endpoint (must be https://hackathon.api.qloo.com or https://api.qloo.com)
QLOO_BASE_URL=https://hackathon.api.qloo.com

# Optional: Add your official Qloo API key to activate live mode
QLOO_API_KEY=your_official_hackathon_key_here

# Mandatory in production: Private 32+ character random secret for HMAC session signing (e.g. openssl rand -hex 32)
SESSION_SECRET=your_32_byte_random_secret_here
```
*(Note: If `QLOO_API_KEY` is omitted, TasteTrail automatically runs in transparent **Sample Data Demo Mode** with labeled fixtures so judges can test immediately without credentials).*

### 5. Run the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 6. Run automated test suite
```bash
npm test
```
*Validates status reporting, coordinate validation, 32KB body size defense, truthful sample stamping, accessibility disclaimers, and search endpoint responses.*

### 7. Build for production
```bash
npm run build
npm start -- -p 3000
```

---

## 🧪 Hackathon Demo Walkthrough (For Judges)

1. **Open TasteTrail** at `http://localhost:3000`.
2. Inspect the **Header Status Badge**: It displays `Live Qloo API` (if your key is set) or `Sample Fixture Mode` (offline reference fallback).
3. Click the **"Judge Guide"** button in the header for an immediate breakdown of architecture, endpoint usage, and criteria alignment.
4. In the **Target City** dropdown, select **New York** (or Tokyo, London, Paris, San Francisco).
5. Select a **3 Hours** time window and **$$ Moderate** budget.
6. Under **Cultural Anchors**, select **Miles Davis** (Music) and **Haruki Murakami** (Literature) or click any suggestion chips like **Wes Anderson** or **Studio Ghibli**.
7. Keep the **"Compare With vs. Baseline"** box checked.
8. Click **"Generate Cultural Trail"**.
9. Watch the **5-Stage Agentic Pipeline Trace** execute in real time.
10. Explore the resulting:
    - **Paced Itinerary:** Ordered stops with dwell times, arrival offsets, and Qloo affinity badges.
    - **Dual-Layer Provenance Panel:** Verifying Layer 1 (Qloo Signals) vs. Layer 2 (App Rules).
    - **Side-by-Side Comparison:** Contrasting the Qloo-curated cultural trail against the reference tourist baseline.

---

## ⚖️ License & Open Source

TasteTrail is released under the **[MIT License](LICENSE)**. Open source, transparent, and built for cultural discovery.
