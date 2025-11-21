// src/pages/adminModeloPredictivo.js
import React, { useMemo, useState } from 'react';
import '../styles/admin.css';
import { postForecast } from '../api/ml';

// Paleta simple alineada al look INFOSER (azules/grises)
const theme = {
  primary: '#0d6efd',
  primaryDark: '#0b5ed7',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#0f172a',
  muted: '#64748b',
};

// Util para generar ids estables para filas
const uid = () => Math.random().toString(36).slice(2, 9);

const today = new Date();
const iso = (d) => d.toISOString().slice(0, 10);

// Datos iniciales (los que usaste en Swagger)
const initialRows = [
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4)), comuna: 'santiago', tipo_servicio: 'instalacion', count: 12 },
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3)), comuna: 'santiago', tipo_servicio: 'instalacion', count: 9 },
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2)), comuna: 'maipu',    tipo_servicio: 'reparacion',  count: 5 },
  { id: uid(), date: iso(new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1)), comuna: 'maipu',    tipo_servicio: 'reparacion',  count: 7 },
];

export default function AdminModeloPredictivo() {
  const [horizon, setHorizon] = useState(14);
  const [rows, setRows] = useState(initialRows);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [daily, setDaily] = useState([]);        // [{date,total}]
  const [pairs, setPairs] = useState([]);        // [{comuna,tipo_servicio,next_days:[]}]
  const [touched, setTouched] = useState(false); // para validar al predecir

  const addRow = () => {
    setRows((r) => [
      ...r,
      { id: uid(), date: iso(today), comuna: '', tipo_servicio: '', count: 0 },
    ]);
  };

  const removeRow = (id) => {
    setRows((r) => r.filter((x) => x.id !== id));
  };

  const clearAll = () => {
    setRows([{ id: uid(), date: iso(today), comuna: '', tipo_servicio: '', count: 0 }]);
    setDaily([]);
    setPairs([]);
    setError('');
    setTouched(false);
  };

  const updateRow = (id, field, value) => {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, [field]: field === 'count' ? Number(value) || 0 : value } : r
      )
    );
  };

  // Validaciones simples
  const validation = useMemo(() => {
    const v = { ok: true, msg: '' };
    if (!Number.isInteger(Number(horizon)) || horizon < 1 || horizon > 30) {
      v.ok = false; v.msg = 'El horizonte debe estar entre 1 y 30 días.';
      return v;
    }
    if (!rows.length) {
      v.ok = false; v.msg = 'Debes ingresar al menos una fila de historial.';
      return v;
    }
    for (const [i, r] of rows.entries()) {
      if (!r.date) { v.ok = false; v.msg = `Fila ${i + 1}: fecha requerida.`; break; }
      if (!r.comuna?.trim()) { v.ok = false; v.msg = `Fila ${i + 1}: comuna requerida.`; break; }
      if (!r.tipo_servicio?.trim()) { v.ok = false; v.msg = `Fila ${i + 1}: tipo de servicio requerido.`; break; }
      if (!(Number(r.count) >= 0)) { v.ok = false; v.msg = `Fila ${i + 1}: count debe ser ≥ 0.`; break; }
    }
    return v;
  }, [horizon, rows]);

  const predict = async () => {
    setTouched(true);
    setError('');
    setDaily([]);
    setPairs([]);
    if (!validation.ok) {
      setError(validation.msg);
      return;
    }

    const payload = {
      horizon_days: Number(horizon),
      history: rows.map((r) => ({
        date: r.date, // ya en YYYY-MM-DD
        comuna: r.comuna.trim().toLowerCase(),
        tipo_servicio: r.tipo_servicio.trim().toLowerCase(),
        count: Number(r.count),
      })),
    };

    try {
      setLoading(true);
      const data = await postForecast(payload);

      console.log('Respuesta ML:', data);

      const dailyData = Array.isArray(data?.daily_forecast)
        ? data.daily_forecast
        : [];

      const pairData = Array.isArray(data?.pair_forecast)
        ? data.pair_forecast.map((p) => ({
            comuna: p?.comuna ?? '',
            tipo_servicio: p?.tipo_servicio ?? '',
            next_days: Array.isArray(p?.next_days) ? p.next_days : [],
          }))
        : [];

      setDaily(dailyData);
      setPairs(pairData);
    } catch (e) {
      console.error('Error en postForecast:', e);
      setError(e?.message || 'No se pudo obtener el pronóstico.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-menu-container" style={{ color: theme.text }}>
      <header className="admin-menu-header" style={{ borderBottom: `1px solid ${theme.border}` }}>
        <div className="header-content">
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="fas fa-chart-line" />
            Pronóstico de demanda de servicios
          </h1>
          <p style={{ color: theme.muted, marginTop: 8 }}>
            Ingresa el <strong>historial</strong> por <em>comuna</em> y <em>tipo de servicio</em>,
            y define el <strong>horizonte</strong>. El modelo devolverá el total diario y la predicción por par.
          </p>
        </div>
      </header>

      <main className="admin-menu-main" style={{ gap: 24 }}>
        {/* Card del formulario */}
        <div
          className="menu-card"
          style={{
            background: theme.surface,
            border: `1px solid ${theme.border}`,
            boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <label htmlFor="horizon"><strong>Horizonte (días)</strong></label>
            <input
              id="horizon"
              type="number"
              min={1}
              max={30}
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              style={{ width: 120 }}
              onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
            />
            <div style={{ flex: 1 }} />
            <button
              type="button"
              onClick={addRow}
              className="logout-btn"
              style={{ background: theme.primary }}
            >
              + Agregar fila
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="logout-btn"
              style={{ background: '#adb5bd' }}
            >
              Limpiar
            </button>
            <button
              type="button"
              onClick={predict}
              className="logout-btn"
              style={{ background: theme.primaryDark }}
              disabled={loading}
            >
              {loading ? 'Calculando…' : 'Predecir'}
            </button>
          </div>

          {/* Tabla editable */}
          <div style={{
            overflowX: 'auto',
            border: `1px solid ${theme.border}`,
            borderRadius: 12,
          }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#f8fafc', color: '#0f172a' }}>
                  <th className="pxy">Fecha (YYYY-MM-DD)</th>
                  <th className="pxy">Comuna</th>
                  <th className="pxy">Tipo de servicio</th>
                  <th className="pxy">Count</th>
                  <th className="pxy" style={{ width: 120, textAlign: 'center' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={r.id} style={{ borderTop: `1px solid ${theme.border}` }}>
                    <td className="pxy">
                      <input
                        type="date"
                        value={r.date}
                        onChange={(e) => updateRow(r.id, 'date', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                    </td>
                    <td className="pxy">
                      <input
                        type="text"
                        placeholder="santiago"
                        value={r.comuna}
                        onChange={(e) => updateRow(r.id, 'comuna', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                    </td>
                    <td className="pxy">
                      <input
                        type="text"
                        placeholder="instalacion / reparacion…"
                        value={r.tipo_servicio}
                        onChange={(e) => updateRow(r.id, 'tipo_servicio', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                    </td>
                    <td className="pxy">
                      <input
                        type="number"
                        min={0}
                        value={r.count}
                        onChange={(e) => updateRow(r.id, 'count', e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
                      />
                    </td>
                    <td className="pxy" style={{ textAlign: 'center' }}>
                      <button
                        type="button"
                        onClick={() => removeRow(r.id)}
                        className="logout-btn"
                        style={{ background: '#ef4444' }}
                        disabled={rows.length === 1}
                        title={rows.length === 1 ? 'Debe quedar al menos una fila' : 'Eliminar fila'}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {/* Pie con indicación */}
                <tr>
                  <td colSpan={5} style={{ padding: '10px 14px', color: theme.muted }}>
                    Tip: usa valores en minúsculas para <em>comuna</em> y <em>tipo_servicio</em>, p. ej. “santiago”, “instalacion”.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {touched && !validation.ok && (
            <div style={{ color: '#b91c1c', marginTop: 12 }}>
              {validation.msg}
            </div>
          )}
          {error && (
            <div style={{ color: '#b91c1c', marginTop: 12 }}>
              {error}
            </div>
          )}
        </div>

        {/* Resultados */}
        {(daily.length > 0 || pairs.length > 0) && (
          <div
            className="menu-card"
            style={{
              background: theme.surface,
              border: `1px solid ${theme.border}`,
              boxShadow: '0 8px 24px rgba(2,6,23,0.06)',
            }}
          >
            <h3 style={{ marginBottom: 12 }}>Resultados</h3>

            {/* Daily forecast */}
            {daily.length > 0 && (
              <>
                <h4 style={{ color: theme.muted, marginBottom: 8 }}>Pronóstico diario (total)</h4>
                <div style={{ overflowX: 'auto', border: `1px solid ${theme.border}`, borderRadius: 12 }}>
                  <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                    <thead>
                      <tr style={{ background: '#f8fafc' }}>
                        <th className="pxy">Fecha</th>
                        <th className="pxy">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {daily.map((d) => (
                        <tr key={d.date} style={{ borderTop: `1px solid ${theme.border}` }}>
                          <td className="pxy">{d.date}</td>
                          <td className="pxy">{Number(d.total).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {/* Pair forecast */}
            {pairs.length > 0 && (
              <>
                <h4 style={{ color: theme.muted, margin: '18px 0 8px' }}>
                  Pronóstico por par (comuna / tipo_servicio)
                </h4>
                <div style={{ display: 'grid', gap: 16 }}>
                  {pairs.map((p, i) => {
                    const nextDays = Array.isArray(p.next_days) ? p.next_days : [];
                    return (
                      <div
                        key={`${p.comuna || 'nocom'}-${p.tipo_servicio || 'noserv'}-${i}`}
                        style={{
                          border: `1px solid ${theme.border}`,
                          borderRadius: 12,
                          padding: 12,
                          background: '#fbfdff',
                        }}
                      >
                        <div style={{ marginBottom: 8 }}>
                          <strong>{p.comuna || '(sin comuna)'}</strong> — <em>{p.tipo_servicio || '(sin tipo)'}</em>
                        </div>
                        <div style={{ overflowX: 'auto' }}>
                          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                            <thead>
                              <tr style={{ background: '#f8fafc' }}>
                                {nextDays.map((_, idx2) => (
                                  <th key={idx2} className="pxy">D+{idx2 + 1}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {nextDays.map((v, idx2) => (
                                  <td key={idx2} className="pxy">{Number(v).toFixed(2)}</td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </main>

      {/* Estilos mínimos locales para padding de celdas */}
      <style>{`
        .pxy { padding: 10px 14px; text-align: left; }
        input[type="text"], input[type="number"], input[type="date"], select {
          width: 100%;
          padding: 8px 10px;
          border: 1px solid ${theme.border};
          border-radius: 8px;
          outline: none;
        }
        input:focus, select:focus {
          border-color: ${theme.primary};
          box-shadow: 0 0 0 3px rgba(13,110,253,0.12);
        }
        .logout-btn {
          border: none;
          color: #fff;
          padding: 10px 14px;
          border-radius: 10px;
          cursor: pointer;
          transition: transform .05s ease;
        }
        .logout-btn:active { transform: translateY(1px); }
        .menu-card { border-radius: 16px; padding: 18px; }
        .admin-menu-main { display: flex; flex-direction: column; }
      `}</style>
    </div>
  );
}
