# WITSML Real-Time Visualization Dashboard

A FastAPI + React dashboard for real-time broomstick and surge/swab visualization from WITSML data files.

## Features

- **Real-Time Dashboard** — Live depth, hookload, torque, RPM, flow, pressure charts with rig-state indicators
- **Broomstick Chart** — Depth-binned pickup / slack-off / rotation curves
- **Surge/Swab Detection** — Movement-rate and pressure-deviation analysis with event detection
- **Rig-State Timeline** — Threshold-based classification (Drilling, Sliding, RIH, POOH, etc.)
- **Data Quality View** — Per-feature confidence scores and missing-channel indicators
- **Depth-Based Heatmaps** — Torque vs depth, hookload vs depth, time spent at depth
- **Rig-State Distribution Widget** — Donut chart with configurable time windows (10 min / 30 min / 1 hr / full)
- **Replay Engine** — Simulates real-time streaming from static WITSML files with configurable playback speed

## Architecture

```
backend/
  app/
    main.py              # FastAPI app entry-point
    models/schemas.py    # Pydantic models
    parsers/             # WITSML XML parser + channel mapper
    detectors/           # Rig-state, surge/swab, event, broomstick, data-quality
    engines/             # Replay engine + data store
    routers/             # REST + WebSocket endpoints
  data/                  # Sample WITSML XML files
frontend/
  src/
    App.tsx              # Main app with tabbed views
    views/               # Dashboard, Broomstick, SurgeSwab, RigState, Quality, Heatmaps
    components/          # ReplayControls, RigStateWidget, ConfidenceBadge
    hooks/               # WebSocket hook
    utils/               # API helpers + TypeScript types
```

## Quick Start

### Backend

```bash
cd backend
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:3000 — the Vite dev server proxies API and WebSocket requests to the backend.

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/wells` | GET | List available datasets |
| `/wells/{id}/channels` | GET | Available WITSML curves |
| `/replay/start?well_id=` | POST | Start playback |
| `/replay/pause?well_id=` | POST | Pause playback |
| `/replay/reset?well_id=` | POST | Reset playback |
| `/stream/{well_id}` | WS | Real-time data stream |
| `/broomstick/{well_id}` | GET | Broomstick data |
| `/surge-swab/{well_id}` | GET | Surge/swab events |
| `/states/{well_id}` | GET | Rig-state timeline |
| `/events/{well_id}` | GET | Detected events |
| `/settings/detection` | POST | Update detection thresholds |

## Adding WITSML Data

Place `.xml` files in `backend/data/`. The parser supports WITSML 1.3.1/1.4.1 log format with common curve mnemonics (DMEA, HKLD, TQA, RPM, MFOP, SPPA, etc.).

## Detection Thresholds

All rig-state and surge/swab detection thresholds are configurable via `POST /settings/detection`:

```json
{
  "rpm_threshold": 5.0,
  "depth_delta_threshold": 0.05,
  "flow_threshold": 10.0,
  "pressure_baseline_window": 20,
  "pressure_deviation_threshold": 50.0,
  "hookload_tag_threshold": 5.0,
  "playback_speed": 1.0
}
```
