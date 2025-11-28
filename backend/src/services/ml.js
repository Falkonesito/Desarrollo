// backend/src/services/ml.js
const ML_BASE = process.env.ML_URL || 'http://localhost:8000';

// Normaliza historia con llaves en español → inglés
function normalizeHistory(history = []) {
  return history.map((h) => {
    // soporta {fecha, cantidad} o {date, count}
    const date =
      h.date ??
      h.fecha ??
      h.dia ??
      h.fecha_solicitud ??
      h.fecha_servicio;

    const count =
      h.count ??
      h.cantidad ??
      h.total ??
      h.numero ??
      h.n;

    return {
      date: typeof date === 'string' ? date : new Date(date).toISOString().slice(0, 10),
      comuna: (h.comuna ?? '').toString().trim().toLowerCase(),
      tipo_servicio: (h.tipo_servicio ?? h.tipo ?? '').toString().trim().toLowerCase(),
      count: Number(count ?? 0),
    };
  });
}

async function forecastML(payload) {
  const body = {
    horizon_days: Number(payload?.horizon_days ?? 14),
    history: normalizeHistory(payload?.history ?? []),
  };

  // Validación mínima
  if (!Array.isArray(body.history) || body.history.length === 0) {
    const err = new Error('history vacío o inválido');
    err.status = 400;
    throw err;
  }

  const url = `${ML_BASE}/forecast`;

  // Node >=18 tiene fetch nativo
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    const err = new Error(`ML ${res.status} - ${text || res.statusText}`);
    err.status = 502; // Bad Gateway hacia el microservicio
    throw err;
  }

  const data = await res.json();
  return data;
}

module.exports = { forecastML };
