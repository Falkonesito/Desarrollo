// backend/src/services/ml.js
// Proxy al servicio de ML en Python (FastAPI)

// URL del servicio Python (por defecto localhost:8000)
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

/**
 * Reenvía la solicitud de pronóstico al microservicio de Python.
 * body: { history: [...], horizon_days: N }
 */
async function forecastML(body) {
  console.log(`[ML Proxy] Enviando solicitud a ${ML_SERVICE_URL}/forecast`);

  try {
    const response = await fetch(`${ML_SERVICE_URL}/forecast`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`ML Service Error (${response.status}): ${text}`);
    }

    const data = await response.json();
    return data; // { daily_forecast, pair_forecast }
  } catch (error) {
    console.error('[ML Proxy] Error conectando con servicio Python:', error.message);

    // Si falla la conexión (ECONNREFUSED), lanzamos error claro
    if (error.cause && error.cause.code === 'ECONNREFUSED') {
      throw new Error('El servicio de ML (Python) no está disponible. Asegúrate de ejecutarlo en el puerto 8000.');
    }
    throw error;
  }
}

module.exports = { forecastML };
