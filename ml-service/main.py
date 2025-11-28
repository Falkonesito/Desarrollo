from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List
import datetime as dt
import numpy as np

# --------- Esquemas ---------
class HistoryItem(BaseModel):
    # Acepta "YYYY-MM-DD" y lo convierte a date
    date: dt.date
    comuna: str
    tipo_servicio: str
    count: float = Field(ge=0)

class ForecastRequest(BaseModel):
    horizon_days: int = Field(ge=1, le=30)
    history: List[HistoryItem]

class PairForecast(BaseModel):
    comuna: str
    tipo_servicio: str
    next_days: List[float]

class ForecastResponse(BaseModel):
    daily_forecast: List[dict]
    pair_forecast: List[PairForecast]

# --------- App ---------
app = FastAPI(title="INFOSER ML Forecast", version="1")

origins = ["http://localhost:3000", "http://127.0.0.1:3000"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health():
    return {"status": "ok", "service": "forecast", "version": 1}

@app.post("/forecast", response_model=ForecastResponse)
def forecast(req: ForecastRequest):
    # Normalizamos claves a minúsculas y pasamos a tupla sencilla
    hist = [
        (h.date, h.comuna.strip().lower(), h.tipo_servicio.strip().lower(), float(h.count))
        for h in req.history
    ]

    if not hist:
        return ForecastResponse(daily_forecast=[], pair_forecast=[])

    # Agrupar por (comuna, tipo_servicio)
    pairs = {}
    for d, c, t, cnt in hist:
        pairs.setdefault((c, t), []).append((d, cnt))

    pair_out: List[PairForecast] = []
    horizon = int(req.horizon_days)
    all_days_sum = np.zeros(horizon, dtype=float)

    for (c, t), series in pairs.items():
        # Ordenar por fecha
        series.sort(key=lambda x: x[0])
        y = np.array([cnt for _, cnt in series], dtype=float)

        # Baseline: media
        base = float(np.mean(y)) if y.size > 0 else 0.0

        # Tendencia lineal muy suave si hay >= 2 puntos
        if y.size >= 2:
            x = np.arange(y.size, dtype=float)
            a, b = np.polyfit(x, y, 1)  # y ≈ a*x + b
            trend_next = [max(0.0, a * (y.size + k) + b) for k in range(horizon)]
        else:
            trend_next = [base] * horizon

        # Mezcla 70% media + 30% tendencia, y evitamos negativos
        next_vals = [max(0.0, 0.7 * base + 0.3 * v) for v in trend_next]

        # Acumular totales diarios globales
        all_days_sum += np.array(next_vals, dtype=float)

        # Guardar por par (comuna, tipo)
        pair_out.append(
            PairForecast(
                comuna=c,
                tipo_servicio=t,
                next_days=[float(round(v, 4)) for v in next_vals],
            )
        )

    # Fechas futuras: desde el día siguiente al último observado
    last_date = max(d for d, _, _, _ in hist)
    future_dates = [last_date + dt.timedelta(days=i + 1) for i in range(horizon)]
    daily = [
        {"date": d.isoformat(), "total": float(round(v, 4))}
        for d, v in zip(future_dates, all_days_sum)
    ]

    return ForecastResponse(daily_forecast=daily, pair_forecast=pair_out)
