from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Tuple
import datetime as dt
import numpy as np
from collections import defaultdict

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
    next_days: List[int]  # Cambiado a int

class ForecastResponse(BaseModel):
    daily_forecast: List[dict]
    pair_forecast: List[PairForecast]

# --------- App ---------
app = FastAPI(title="INFOSER ML Forecast", version="2")

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
    return {"status": "ok", "service": "forecast", "version": 2}

@app.get("/")
def root():
    return {"message": "ML Service is running", "docs": "/docs"}

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
    pairs = defaultdict(list)
    for d, c, t, cnt in hist:
        pairs[(c, t)].append((d, cnt))

    pair_out: List[PairForecast] = []
    horizon = int(req.horizon_days)
    
    # Para acumular totales diarios globales (usaremos float para sumar, luego int al final)
    all_days_sum = np.zeros(horizon, dtype=float)

    for (c, t), series in pairs.items():
        # Ordenar por fecha
        series.sort(key=lambda x: x[0])
        
        # Extraer fechas y valores
        dates = [x[0] for x in series]
        values = [x[1] for x in series]
        n = len(values)
        
        next_vals = []
        
        if n == 0:
            next_vals = [0] * horizon
        
        # Estrategia: Estacionalidad Semanal si hay suficientes datos (>= 14 días para tener al menos 2 semanas de referencia es ideal, pero con >=7 intentamos)
        elif n >= 7:
            # Calcular promedio por día de la semana (0=Lunes, 6=Domingo)
            weekday_sums = defaultdict(float)
            weekday_counts = defaultdict(int)
            
            for d, v in zip(dates, values):
                wd = d.weekday()
                weekday_sums[wd] += v
                weekday_counts[wd] += 1
            
            weekday_avgs = {}
            for wd in range(7):
                if weekday_counts[wd] > 0:
                    weekday_avgs[wd] = weekday_sums[wd] / weekday_counts[wd]
                else:
                    # Si falta un día específico, usar el promedio global
                    weekday_avgs[wd] = sum(values) / n
            
            # Proyectar futuro
            last_date = dates[-1]
            for i in range(horizon):
                future_date = last_date + dt.timedelta(days=i + 1)
                wd = future_date.weekday()
                # Predicción base es el promedio de ese día de la semana
                pred = weekday_avgs[wd]
                next_vals.append(pred)
                
        else:
            # Pocos datos: usar promedio con tendencia y variabilidad
            # Establecer un mínimo razonable (al menos 2 solicitudes)
            avg = max(2.0, sum(values) / n)
            
            # Detectar tendencia (comparar últimos datos vs primeros)
            if n >= 6:
                recent_avg = sum(values[-3:]) / 3
                old_avg = sum(values[:3]) / 3
                trend = (recent_avg - old_avg) / 3  # Cambio promedio por día
            elif n >= 3:
                # Con menos datos, usar tendencia más conservadora
                recent_avg = sum(values[-2:]) / 2
                old_avg = sum(values[:2]) / 2
                trend = (recent_avg - old_avg) / 2
            else:
                # Muy pocos datos: asumir crecimiento leve
                trend = 0.15
            
            # Patrón semanal realista (factores por día: Lun-Dom)
            # Más solicitudes al inicio de semana, menos en fin de semana
            weekly_pattern = [1.3, 1.2, 1.0, 1.0, 1.1, 0.8, 0.6]
            
            # Generar predicciones con tendencia y patrón semanal
            last_date = dates[-1]
            for i in range(horizon):
                # Base con tendencia
                base = avg + (trend * i)
                
                # Aplicar patrón semanal
                future_date = last_date + dt.timedelta(days=i + 1)
                weekday = future_date.weekday()
                pred = base * weekly_pattern[weekday]
                
                # Asegurar mínimo de 1 solicitud
                next_vals.append(max(1.0, pred))

        # Redondear a enteros y asegurar no negativos
        final_vals = [int(round(max(0.0, v))) for v in next_vals]
        
        # Acumular al total global
        all_days_sum += np.array(final_vals, dtype=float)

        # Guardar por par (comuna, tipo)
        pair_out.append(
            PairForecast(
                comuna=c,
                tipo_servicio=t,
                next_days=final_vals,
            )
        )

    # Fechas futuras: desde el día siguiente al último observado globalmente
    last_date_global = max(d for d, _, _, _ in hist)
    future_dates = [last_date_global + dt.timedelta(days=i + 1) for i in range(horizon)]
    
    daily = [
        {"date": d.isoformat(), "total": int(round(v))}
        for d, v in zip(future_dates, all_days_sum)
    ]

    return ForecastResponse(daily_forecast=daily, pair_forecast=pair_out)
