// frontend/src/pages/adminMetricas.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminMetricas.css';
import { api } from '../utils/api';

const AdminMetricas = () => {
  const navigate = useNavigate();

  // Filtros
  const [filtroTiempo, setFiltroTiempo] = useState('30-dias');
  const [filtroComuna, setFiltroComuna] = useState('todas');
  const [filtroServicio, setFiltroServicio] = useState('todos');

  // Estado de carga / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Datos que vienen del backend
  const [kpis, setKpis] = useState({
    totalSolicitudes: 0,
    completadas: 0,
    pendientes: 0,
    enProgreso: 0,
  });

  const [porDia, setPorDia] = useState([]); // vista_solicitudes_por_dia
  const [rendimiento, setRendimiento] = useState([]); // vista_rendimiento_tecnicos
  const [recientes, setRecientes] = useState([]); // vista_solicitudes_recientes

  // NUEVO: datos crudos para filtrar en cliente (sin PII)
  const [raw, setRaw] = useState([]);

  // Cargar métricas desde el backend
  const cargarMetricas = async () => {
    try {
      setLoading(true);
      setError(null);

      // Pedimos dashboard (global) + crudo (para filtrar en front)
      const [dataDash, dataRaw] = await Promise.all([
        api.get('/metricas/dashboard', {
          auth: true,
          query: {
            rango: filtroTiempo,
            comuna: filtroComuna === 'todas' ? '' : filtroComuna,
            tipo_servicio: filtroServicio === 'todos' ? '' : filtroServicio,
          },
        }),
        api.get('/metricas/raw-solicitudes', {
          auth: true,
          query: { rango: filtroTiempo },
        }),
      ]);

      const dashboard = dataDash.dashboard || {};

      setKpis({
        totalSolicitudes: dashboard.total_solicitudes || 0,
        completadas: dashboard.completadas || 0,
        pendientes: dashboard.pendientes || 0,
        enProgreso: dashboard.en_progreso || 0,
      });

      setPorDia(dataDash.solicitudes_por_dia || []);
      setRendimiento(dataDash.rendimiento_tecnicos || []);
      setRecientes(dataDash.solicitudes_recientes || []);

      // Guardamos el crudo
      setRaw(dataRaw.rows || []);
    } catch (err) {
      console.error('Error cargando métricas:', err);
      setError(err.message || 'Error obteniendo métricas del dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMetricas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtrado local (client-side) sobre "raw"
  const filtradas = React.useMemo(() => {
    const c = filtroComuna === 'todas' ? '' : (filtroComuna || '').toLowerCase();
    const s = filtroServicio === 'todos' ? '' : (filtroServicio || '');
    return (raw || []).filter(r => (c ? r.comuna === c : true) && (s ? r.tipo_servicio === s : true));
  }, [raw, filtroComuna, filtroServicio]);

  // KPIs basados en filtros (si quieres usarlos en las cards)
  const kpisFiltrados = React.useMemo(() => {
    const acc = { total: 0, pendientes: 0, en_revision: 0, asignadas: 0, en_progreso: 0, completadas: 0, canceladas: 0 };
    for (const r of filtradas) {
      acc.total++;
      if (Object.prototype.hasOwnProperty.call(acc, r.estado)) acc[r.estado]++;
    }
    return acc;
  }, [filtradas]);

  // Serie por día filtrada (para el gráfico de evolución)
  const porDiaFiltrado = React.useMemo(() => {
    const map = new Map();
    for (const r of filtradas) {
      if (!map.has(r.fecha)) map.set(r.fecha, { fecha: r.fecha, total_solicitudes: 0, completadas: 0 });
      const o = map.get(r.fecha);
      o.total_solicitudes++;
      if (r.estado === 'completada') o.completadas++;
    }
    return Array.from(map.values()).sort((a, b) => a.fecha.localeCompare(b.fecha));
  }, [filtradas]);

  // ⚠️ Decide: cards globales (kpis) o filtradas (kpisFiltrados)
  // Mantengo las cards con KPIs globales como pediste:
  const solicitudesAbiertas = kpis.pendientes + kpis.enProgreso;

  return (
    <div className="admin-metricas-container">
      <header className="admin-metricas-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="btn-volver"
              onClick={() => navigate('/admin/menu')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Volver al Menú
            </button>
            <h1>
              <i className="fas fa-chart-line"></i>
              Analytics & Métricas - INFOSER
            </h1>
          </div>
          <div className="header-actions">
            <button className="btn-export">
              <i className="fas fa-download me-2"></i>
              Exportar
            </button>
            <div className="admin-info">
              <span>Administrador</span>
              <button
                className="logout-btn"
                onClick={() => (window.location.href = '/')}
              >
                <i className="fas fa-sign-out-alt me-2"></i>
                Salir
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="admin-metricas-layout">
        <nav className="admin-metricas-sidebar">
          <div className="sidebar-sticky">
            <ul className="sidebar-nav">
              <li className="nav-item active">
                <a className="nav-link">
                  <i className="fas fa-tachometer-alt me-2"></i>
                  Dashboard
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link">
                  <i className="fas fa-map-marked-alt me-2"></i>
                  Análisis Geográfico
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link">
                  <i className="fas fa-cogs me-2"></i>
                  Análisis de Servicios
                </a>
              </li>
              <li className="nav-item">
                <a className="nav-link">
                  <i className="fas fa-calendar-alt me-2"></i>
                  Tendencia Temporal
                </a>
              </li>
            </ul>

            <div className="sidebar-summary">
              <h6>Resumen del Sistema</h6>
              <div className="summary-stats">
                <div className="summary-item">
                  <span>Totales:</span>
                  <span className="text-success">{kpis.totalSolicitudes}</span>
                </div>
                <div className="summary-item">
                  <span>Completadas:</span>
                  <span className="text-success">{kpis.completadas}</span>
                </div>
                <div className="summary-item">
                  <span>Abiertas:</span>
                  <span className="text-warning">{solicitudesAbiertas}</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="admin-metricas-content">
          {error && (
            <div
              className="alert alert-danger"
              style={{ marginBottom: '1rem', padding: '0.75rem 1rem' }}
            >
              <strong>Error: </strong>
              {error}
            </div>
          )}

          {/* Filtros */}
          <div className="filters-section">
            <div className="filters-card">
              <div className="filters-content">
                <div className="filter-group">
                  <strong>Filtros:</strong>
                </div>
                <div className="filter-group">
                  <select
                    value={filtroTiempo}
                    onChange={(e) => setFiltroTiempo(e.target.value)}
                    className="filter-select"
                  >
                    <option value="7-dias">Últimos 7 días</option>
                    <option value="30-dias">Últimos 30 días</option>
                    <option value="90-dias">Últimos 90 días</option>
                    <option value="este-año">Este año</option>
                  </select>
                </div>
                <div className="filter-group">
                  <select
                    value={filtroComuna}
                    onChange={(e) => setFiltroComuna(e.target.value)}
                    className="filter-select"
                  >
                    <option value="todas">Todas las comunas</option>
                    <option value="melipilla">Melipilla</option>
                    <option value="santiago">Santiago Centro</option>
                    <option value="providencia">Providencia</option>
                  </select>
                </div>
                <div className="filter-group">
                  <select
                    value={filtroServicio}
                    onChange={(e) => setFiltroServicio(e.target.value)}
                    className="filter-select"
                  >
                    <option value="todos">Todos los servicios</option>
                    <option value="instalacion">Instalación</option>
                    <option value="mantenimiento">Mantenimiento</option>
                    <option value="reparacion">Reparación</option>
                    <option value="asesoria">Asesoría</option>
                  </select>
                </div>
                <div className="filter-group">
                  <button
                    className="btn-refresh"
                    onClick={cargarMetricas}
                    disabled={loading}
                  >
                    <i className="fas fa-sync-alt me-2"></i>
                    {loading ? 'Cargando...' : 'Actualizar'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* KPIs principales */}
          <div className="kpis-grid">
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <h6 className="kpi-title">Servicios Totales</h6>
                  <h3 className="kpi-value text-primary">
                    {kpis.totalSolicitudes}
                  </h3>
                </div>
                <div className="kpi-icon">
                  <i className="fas fa-tools text-primary"></i>
                </div>
              </div>
              <p className="kpi-trend">
                Total histórico de solicitudes registradas
              </p>
            </div>

            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <h6 className="kpi-title">Completadas</h6>
                  <h3 className="kpi-value text-success">
                    {kpis.completadas}
                  </h3>
                </div>
                <div className="kpi-icon">
                  <i className="fas fa-check-circle text-success"></i>
                </div>
              </div>
              <p className="kpi-trend">Servicios cerrados correctamente</p>
            </div>

            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <h6 className="kpi-title">Abiertas (Pend. + En Progreso)</h6>
                  <h3 className="kpi-value text-warning">
                    {solicitudesAbiertas}
                  </h3>
                </div>
                <div className="kpi-icon">
                  <i className="fas fa-hourglass-half text-warning"></i>
                </div>
              </div>
              <p className="kpi-trend">Casos que aún requieren gestión</p>
            </div>
          </div>

          {/* Fila 1: Evolución temporal + rendimiento técnicos */}
          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header bg-info">
                <h5>
                  <i className="fas fa-chart-line me-2"></i>
                  Evolución de Solicitudes por Día
                </h5>
              </div>
              <div className="chart-body">
                {(porDiaFiltrado.length === 0) ? (
                  <p>No hay datos suficientes aún.</p>
                ) : (
                  <div className="trend-chart">
                    <div className="trend-line">
                      {porDiaFiltrado.map((d, idx) => (
                        <div
                          key={idx}
                          className="trend-point"
                          style={{
                            height: `${
                              (d.total_solicitudes /
                                Math.max(
                                  ...porDiaFiltrado.map(
                                    (x) => x.total_solicitudes || 1
                                  )
                                )) * 100
                            }%`,
                          }}
                          title={`${d.total_solicitudes} solicitudes el ${d.fecha}`}
                        ></div>
                      ))}
                    </div>
                    <div className="trend-labels">
                      {porDiaFiltrado.map((d, idx) => (
                        <span key={idx} className="trend-label">
                          {d.fecha}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header bg-success">
                <h5>
                  <i className="fas fa-user-cog me-2"></i>
                  Rendimiento de Técnicos
                </h5>
              </div>
              <div className="chart-body">
                {rendimiento.length === 0 ? (
                  <p>No hay técnicos con solicitudes aún.</p>
                ) : (
                  <div className="tech-chart">
                    {rendimiento.map((t) => (
                      <div key={t.tecnico_id} className="tech-item">
                        <div className="tech-info">
                          <span className="tech-name">
                            {t.tecnico_nombre}
                          </span>
                          <span className="tech-count">
                            {t.completadas}/{t.total_solicitudes}
                          </span>
                        </div>
                        <div className="tech-bar">
                          <div
                            className="tech-fill"
                            style={{
                              width: `${
                                t.total_solicitudes > 0
                                  ? (t.completadas / t.total_solicitudes) * 100
                                  : 0
                              }%`,
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Fila 2: Últimas solicitudes */}
          <div className="charts-row">
            <div className="chart-card wide">
              <div className="chart-header bg-secondary">
                <h5>
                  <i className="fas fa-list me-2"></i>
                  Últimas Solicitudes Registradas
                </h5>
              </div>
              <div className="chart-body">
                {recientes.length === 0 ? (
                  <p>No hay solicitudes registradas aún.</p>
                ) : (
                  <div className="location-chart">
                    {recientes.map((s) => (
                      <div key={s.id} className="location-item">
                        <div className="location-info">
                          <span className="location-name">
                            #{s.id} - {s.titulo}
                          </span>
                          <span className="location-count">
                            {s.estado_actual}
                          </span>
                        </div>
                        <div className="location-bar">
                          <div
                            className="location-fill"
                            style={{
                              width:
                                s.estado_actual === 'completada'
                                  ? '100%'
                                  : s.estado_actual === 'en_proceso'
                                  ? '70%'
                                  : s.estado_actual === 'asignada'
                                  ? '50%'
                                  : '30%',
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMetricas;
