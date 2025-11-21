// backend/src/services/ml.js
// "Modelo" interno simple para pronosticar demanda sin llamar a otro servidor.
// Usa los datos de history y genera daily_forecast y pair_forecast.

function parseDate(str) {
  const d = new Date(str);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function formatDate(d) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// body: { history: [{ date, comuna, tipo_servicio, count }], horizon_days }
async function forecastML(body) {
  const history = Array.isArray(body?.history) ? body.history : [];
  const horizon = Math.min(Math.max(Number(body?.horizon_days) || 7, 1), 30);

  if (!history.length) {
    // sin histórico, devolvemos algo plano
    const today = new Date();
    const daily_forecast = [];
    for (let i = 1; i <= horizon; i++) {
      const d = addDays(today, i);
      daily_forecast.push({
        date: formatDate(d),
        total: 0,
      });
    }
    return {
      daily_forecast,
      pair_forecast: [],
    };
  }

  // ----------------------------
  // 1) Agregamos por fecha total de solicitudes
  // ----------------------------
  const byDate = new Map(); // dateStr -> total count
  const byPair = new Map(); // "comuna|tipo_servicio" -> total count

  for (const item of history) {
    const d = parseDate(item.date);
    if (!d) continue;
    const dateStr = formatDate(d);
    const c = Number(item.count) || 0;
    const comuna = (item.comuna || '').toLowerCase();
    const tipo = (item.tipo_servicio || '').toLowerCase();

    byDate.set(dateStr, (byDate.get(dateStr) || 0) + c);

    const key = `${comuna}|${tipo}`;
    byPair.set(key, (byPair.get(key) || 0) + c);
  }

  // promedio diario global
  const totalSum = Array.from(byDate.values()).reduce((a, b) => a + b, 0);
  const avgDaily = totalSum / Math.max(byDate.size, 1);

  // ----------------------------
  // 2) Forecast diario simple:
  //    tendencia lineal suave +5% en el último día del horizonte
  // ----------------------------
  const today = new Date();
  const daily_forecast = [];
  for (let i = 1; i <= horizon; i++) {
    const d = addDays(today, i);
    const factor = 1 + 0.05 * (i / horizon); // sube hasta +5% al final
    const total = avgDaily * factor;

    daily_forecast.push({
      date: formatDate(d),
      total: Number(total.toFixed(2)),
    });
  }

  // ----------------------------
  // 3) Forecast por par (comuna, tipo_servicio)
  //    Repartimos la demanda diaria según proporciones históricas
  // ----------------------------
  const pairTotal = Array.from(byPair.values()).reduce((a, b) => a + b, 0);
  const pair_forecast = [];

  if (pairTotal > 0) {
    const pairList = Array.from(byPair.entries()).map(([key, sum]) => {
      const [comuna, tipo_servicio] = key.split('|');
      const weight = sum / pairTotal;
      return { comuna, tipo_servicio, weight };
    });

    for (const day of daily_forecast) {
      for (const p of pairList) {
        const count = day.total * p.weight;
        pair_forecast.push({
          date: day.date,
          comuna: p.comuna,
          tipo_servicio: p.tipo_servicio,
          count: Number(count.toFixed(2)),
        });
      }
    }
  }

  return {
    daily_forecast,
    pair_forecast,
  };
}

module.exports = { forecastML };
