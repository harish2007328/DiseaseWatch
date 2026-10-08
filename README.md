# DiseaseWatch 🚨
### Post-Disaster Public Health Incident Monitoring, Syndromic Surveillance & Rapid Response System

> **Hackathon Prototype Notice:** DiseaseWatch is an early-warning syndromic surveillance aid designed for post-disaster camp coordinators and district health authorities. It **does NOT** provide individual clinical diagnoses or medical prescriptions. All outputs represent epidemiological risk scores and public-health preventive action directives (water safety, sanitation, vector control, awareness).

---

## 📌 Executive Summary
Following disasters like floods, cyclones, and earthquakes, displaced populations in temporary relief camps face elevated risks of infectious disease outbreaks (acute diarrheal illness, cholera, dengue, malaria, leptospirosis, respiratory infections). Delayed detection and uncoordinated responses cause preventable morbidity.

**DiseaseWatch** bridges field coordinators and district administrators:
1. **Field Incident Telemetry:** Rapid logging of symptom clusters and environmental hazards (stagnant water, contaminated tankers, sewage overflow).
2. **Dual-Layer ML Risk Inference:** Real-time machine learning (Random Forest + heuristic rule weighting) estimates syndromic risk levels and identifies primary syndrome candidates.
3. **Geospatial Outbreak Clustering:** Identifies spatial clusters across neighboring camps sharing common environmental risks.
4. **AI-Driven Action Directives:** Formulates targeted public-health interventions (chlorination teams, ORS distribution, larvicide spraying, community advisories).
5. **Administrative Endorsement Desk:** Verification queue to prevent false panic and coordinate official field actions.

---

## 🏗️ Architecture & Tech Stack

```
   ┌────────────────────────────────────────────────────────────┐
   │                    DiseaseWatch Frontend                    │
   │      React + TypeScript + Vite + Tailwind CSS + Leaflet     │
   │  - District Surveillance Command  - Live ML Sandbox        │
   │  - Camp Incident Reporting Desk   - Spatial Cluster Radar  │
   └─────────────────────────────▲──────────────────────────────┘
                                 │ REST API / Axios
   ┌─────────────────────────────▼──────────────────────────────┐
   │                    FastAPI Backend Core                    │
   │  - Auth & Role Switching (Admin / Camp Coordinators)        │
   │  - Syndromic ML Classification Engine (Scikit-Learn)       │
   │  - Geospatial Spatial-Temporal Clustering (DBSCAN)         │
   │  - Public-Health Action Synthesis Engine                   │
   │  - In-Memory Demo Store + Supabase Schema Ready            │
   └────────────────────────────────────────────────────────────┘
```

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Lucide React, Recharts, Leaflet, React-Leaflet
- **Backend:** Python 3.10+, FastAPI, Scikit-learn, Pandas, NumPy, Pydantic, Uvicorn
- **Database:** Supabase PostgreSQL migrations provided in `/supabase/migrations/` (includes active demo in-memory persistence layer for instant zero-config evaluation)

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- Python 3.10+
- Node.js 18+ & npm

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```
Backend API will run at `http://localhost:8000`.
Interactive Swagger API docs available at `http://localhost:8000/docs`.

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## 👥 Personas & Live Demo Workflows

### 1. District Health Officer (Admin)
- **District Command Center:** High-level epidemiological curve, live syndromic breakdown, KPI metrics.
- **Geospatial Surveillance Map:** Interactive Leaflet GIS showing camp risk levels (Critical, High, Moderate, Controlled) and outbreak clusters.
- **Verification Queue:** Endorse or reject incoming incident reports from camps before alerts trigger mass response.
- **Action Plan Generator:** Generate AI public-health response directives from active alerts and dispatch to specific camps.
- **Spatial Outbreak Clusters:** Inspect DBSCAN clusters detecting cross-camp transmission vectors.
- **ML Sandbox:** Live playground to test the feature vectors and evaluate model performance.

### 2. Camp Coordinator (Camp 1 / Camp 2 / Camp 3)
- **Camp Incident Desk:** View camp population, active cases, assigned directives.
- **Live Health Incident Report:** Submit symptom checklist with **real-time ML risk feedback preview**.
- **Environmental Hazard Logging:** Log contaminated water sources, overflowing latrines, stagnant pools, or high mosquito density.
- **Operational Directives:** Update status of assigned tasks (e.g. "Distribute ORS packets", "Boil water notice") from Pending to In-Progress to Completed.

---

## 🔒 Safety & Ethical Boundaries
- No clinical diagnosis is claimed or provided.
- No medication prescriptions are suggested.
- All algorithms focus exclusively on **syndromic surveillance** and **environmental public-health countermeasures**.
