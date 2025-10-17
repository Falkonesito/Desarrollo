import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminMetricas.css';

const AdminMetricas = () => {
  const navigate = useNavigate();
  const [filtroTiempo, setFiltroTiempo] = useState('30-dias');
  const [filtroComuna, setFiltroComuna] = useState('todas');

  const metricasData = {
    serviciosTotales: 142,
    ingresosMensuales: 8200000,
    satisfaccion: 4.7,
    eficiencia: 92,
    crecimiento: 15,
    tiempoPromedio: 2.3,
    serviciosTiempo: 92,
    ratingTecnicos: 4.1,
    reclamos: 2
  };

  const serviciosData = [
    { nombre: 'Instalación Cámaras', porcentaje: 45, color: '#3182CE' },
    { nombre: 'Sistema Alarmas', porcentaje: 30, color: '#38A169' },
    { nombre: 'Mantenimiento', porcentaje: 15, color: '#D69E2E' },
    { nombre: 'Control Accesos', porcentaje: 7, color: '#805AD5' },
    { nombre: 'Reparaciones', porcentaje: 3, color: '#E53E3E' }
  ];

  const tecnologiasData = [
    { nombre: 'Cámaras IP HD', cantidad: 65 },
    { nombre: 'Alarmas Inalámbricas', cantidad: 45 },
    { nombre: 'Sistemas Cableados', cantidad: 30 },
    { nombre: 'Control Biométrico', cantidad: 20 },
    { nombre: 'DVR/NVR', cantidad: 25 }
  ];

  const comunasData = [
    { nombre: 'Providencia', servicios: 28 },
    { nombre: 'Las Condes', servicios: 25 },
    { nombre: 'Santiago Centro', servicios: 22 },
    { nombre: 'Ñuñoa', servicios: 15 },
    { nombre: 'La Reina', servicios: 12 },
    { nombre: 'Vitacura', servicios: 10 },
    { nombre: 'Maipú', servicios: 18 },
    { nombre: 'Peñalolén', servicios: 12 }
  ];

  const clientesData = [
    { tipo: 'Residencial', porcentaje: 55, color: '#3182CE' },
    { tipo: 'Comercial', porcentaje: 25, color: '#38A169' },
    { tipo: 'Empresarial', porcentaje: 15, color: '#D69E2E' },
    { tipo: 'Industrial', porcentaje: 5, color: '#805AD5' }
  ];

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
              <button className="logout-btn" onClick={() => window.location.href = '/'}>
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
              <h6>Resumen del Mes</h6>
              <div className="summary-stats">
                <div className="summary-item">
                  <span>Ingresos:</span>
                  <span className="text-success">${(metricasData.ingresosMensuales / 1000000).toFixed(1)}M</span>
                </div>
                <div className="summary-item">
                  <span>Crecimiento:</span>
                  <span className="text-success">+{metricasData.crecimiento}%</span>
                </div>
                <div className="summary-item">
                  <span>Eficiencia:</span>
                  <span className="text-warning">{metricasData.eficiencia}%</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <main className="admin-metricas-content">
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
                  <select className="filter-select">
                    <option>Todos los servicios</option>
                    <option>Instalación</option>
                    <option>Mantenimiento</option>
                    <option>Reparación</option>
                  </select>
                </div>
                <div className="filter-group">
                  <button className="btn-refresh">
                    <i className="fas fa-sync-alt me-2"></i>
                    Actualizar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="kpis-grid">
            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <h6 className="kpi-title">Servicios Totales</h6>
                  <h3 className="kpi-value text-primary">{metricasData.serviciosTotales}</h3>
                </div>
                <div className="kpi-icon">
                  <i className="fas fa-tools text-primary"></i>
                </div>
              </div>
              <p className="kpi-trend text-success">
                <i className="fas fa-arrow-up me-1"></i>
                +12% vs mes anterior
              </p>
            </div>

            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <h6 className="kpi-title">Ingresos Mensuales</h6>
                  <h3 className="kpi-value text-success">${(metricasData.ingresosMensuales / 1000000).toFixed(1)}M</h3>
                </div>
                <div className="kpi-icon">
                  <i className="fas fa-dollar-sign text-success"></i>
                </div>
              </div>
              <p className="kpi-trend text-success">
                <i className="fas fa-arrow-up me-1"></i>
                +{metricasData.crecimiento}% crecimiento
              </p>
            </div>

            <div className="kpi-card">
              <div className="kpi-content">
                <div className="kpi-info">
                  <h6 className="kpi-title">Satisfacción</h6>
                  <h3 className="kpi-value text-warning">{metricasData.satisfaccion}/5</h3>
                </div>
                <div className="kpi-icon">
                  <i className="fas fa-star text-warning"></i>
                </div>
              </div>
              <p className="kpi-trend">
                94% de clientes satisfechos
              </p>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header bg-primary">
                <h5>
                  <i className="fas fa-chart-pie me-2"></i>
                  Tipos de Servicios Más Solicitados
                </h5>
              </div>
              <div className="chart-body">
                <div className="services-chart">
                  {serviciosData.map((servicio, index) => (
                    <div key={index} className="service-item">
                      <div className="service-bar">
                        <div 
                          className="service-fill" 
                          style={{ 
                            width: `${servicio.porcentaje}%`,
                            backgroundColor: servicio.color
                          }}
                        ></div>
                      </div>
                      <div className="service-info">
                        <span className="service-name">{servicio.nombre}</span>
                        <span className="service-percentage">{servicio.porcentaje}%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="chart-legend">
                  <div className="legend-grid">
                    {serviciosData.map((servicio, index) => (
                      <div key={index} className="legend-item">
                        <span 
                          className="legend-color" 
                          style={{ backgroundColor: servicio.color }}
                        ></span>
                        <small>{servicio.nombre}</small>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header bg-success">
                <h5>
                  <i className="fas fa-microchip me-2"></i>
                  Tecnologías Más Utilizadas
                </h5>
              </div>
              <div className="chart-body">
                <div className="tech-chart">
                  {tecnologiasData.map((tech, index) => (
                    <div key={index} className="tech-item">
                      <div className="tech-info">
                        <span className="tech-name">{tech.nombre}</span>
                        <span className="tech-count">{tech.cantidad}</span>
                      </div>
                      <div className="tech-bar">
                        <div 
                          className="tech-fill"
                          style={{ width: `${(tech.cantidad / 65) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card wide">
              <div className="chart-header bg-info">
                <h5>
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Distribución por Comunas - Región Metropolitana
                </h5>
              </div>
              <div className="chart-body">
                <div className="location-chart">
                  {comunasData.map((comuna, index) => (
                    <div key={index} className="location-item">
                      <div className="location-info">
                        <span className="location-name">{comuna.nombre}</span>
                        <span className="location-count">{comuna.servicios}</span>
                      </div>
                      <div className="location-bar">
                        <div 
                          className="location-fill"
                          style={{ width: `${(comuna.servicios / 28) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header bg-warning">
                <h5>
                  <i className="fas fa-chart-line me-2"></i>
                  Eficiencia Operacional
                </h5>
              </div>
              <div className="chart-body">
                <div className="efficiency-grid">
                  <div className="efficiency-item">
                    <h3 className="text-primary">{metricasData.tiempoPromedio}h</h3>
                    <small>Tiempo Promedio</small>
                  </div>
                  <div className="efficiency-item">
                    <h3 className="text-success">{metricasData.serviciosTiempo}%</h3>
                    <small>Servicios a Tiempo</small>
                  </div>
                  <div className="efficiency-item">
                    <h3 className="text-info">{metricasData.ratingTecnicos}/5</h3>
                    <small>Rating Técnicos</small>
                  </div>
                  <div className="efficiency-item">
                    <h3 className="text-danger">{metricasData.reclamos}%</h3>
                    <small>Reclamos</small>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="charts-row">
            <div className="chart-card">
              <div className="chart-header bg-secondary">
                <h5>
                  <i className="fas fa-chart-line me-2"></i>
                  Tendencia Mensual
                </h5>
              </div>
              <div className="chart-body">
                <div className="trend-chart">
                  <div className="trend-line">
                    {[85, 92, 78, 105, 120, 135, 142, 155, 148, 165, 158, 142].map((value, index) => (
                      <div 
                        key={index}
                        className="trend-point"
                        style={{ height: `${(value / 165) * 100}%` }}
                        title={`${value} servicios`}
                      ></div>
                    ))}
                  </div>
                  <div className="trend-labels">
                    {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map((mes, index) => (
                      <span key={index} className="trend-label">{mes}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="chart-card">
              <div className="chart-header bg-dark">
                <h5>
                  <i className="fas fa-building me-2"></i>
                  Segmentación por Tipo de Cliente
                </h5>
              </div>
              <div className="chart-body">
                <div className="clients-chart">
                  {clientesData.map((cliente, index) => (
                    <div key={index} className="client-item">
                      <div 
                        className="client-slice"
                        style={{ 
                          background: `conic-gradient(${cliente.color} 0% ${cliente.porcentaje}%, #e2e8f0 ${cliente.porcentaje}% 100%)`
                        }}
                      ></div>
                      <div className="client-info">
                        <span 
                          className="client-color"
                          style={{ backgroundColor: cliente.color }}
                        ></span>
                        <span className="client-type">{cliente.tipo}</span>
                        <span className="client-percentage">{cliente.porcentaje}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminMetricas;