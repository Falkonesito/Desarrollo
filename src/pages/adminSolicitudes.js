import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminSolicitudes.css';

const AdminSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([
    {
      id: 1,
      cliente: 'María González',
      email: 'cliente@ejemplo.com',
      telefono: '+56911223344',
      direccion: 'Av. Principal 123, Melipilla',
      tipo: 'instalacion',
      descripcion: 'Instalación de 4 cámaras de seguridad en vivienda',
      estado: 'pendiente',
      prioridad: 'alta',
      fecha: '2024-01-20',
      tecnico: null
    },
    {
      id: 2,
      cliente: 'Carlos López',
      email: 'carlos@empresa.com', 
      telefono: '+56955667788',
      direccion: 'Calle Secundaria 456, Melipilla',
      tipo: 'mantenimiento',
      descripcion: 'Mantenimiento preventivo sistema existente',
      estado: 'asignada',
      prioridad: 'media',
      fecha: '2024-01-18',
      tecnico: 'Juan Pérez'
    },
    {
      id: 3,
      cliente: 'Ana Contreras',
      email: 'ana@tienda.com',
      telefono: '+56999887766',
      direccion: 'Local Comercial 789, Melipilla',
      tipo: 'reparacion',
      descripcion: 'Reparación de cámara dañada por tormenta',
      estado: 'en_progreso',
      prioridad: 'alta',
      fecha: '2024-01-15',
      tecnico: 'Pedro Sánchez'
    }
  ]);

  const [filtroEstado, setFiltroEstado] = useState('todos');

  const solicitudesFiltradas = filtroEstado === 'todos' 
    ? solicitudes 
    : solicitudes.filter(s => s.estado === filtroEstado);

  return (
    <div className="admin-solicitudes-container">
      <header className="admin-solicitudes-header">
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
              <i className="fas fa-tools"></i>
              Gestión de Solicitudes - INFOSER & EP SPA
            </h1>
          </div>
          <div className="admin-info">
            <span>Administrador</span>
            <button className="logout-btn" onClick={() => window.location.href = '/'}>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-solicitudes-layout">
        <nav className="admin-solicitudes-sidebar">
          <button className="sidebar-btn" onClick={() => navigate('/admin/menu')}>
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button className="sidebar-btn active">
            <i className="fas fa-tools"></i>
            📋 Solicitudes
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/clientes')}>
            <i className="fas fa-users"></i>
            👥 Clientes
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/tecnicos')}>
            <i className="fas fa-user-cog"></i>
            👨‍💻 Técnicos
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/metricas')}>
            <i className="fas fa-chart-line"></i>
            📈 Métricas
          </button>
        </nav>

        <main className="admin-solicitudes-content">
          <div className="content-header">
            <h2>Solicitudes de Servicio</h2>
            <div className="header-actions">
              <div className="filtros">
                <select 
                  value={filtroEstado} 
                  onChange={(e) => setFiltroEstado(e.target.value)}
                  className="filtro-select"
                >
                  <option value="todos">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="asignada">Asignadas</option>
                  <option value="en_progreso">En Progreso</option>
                  <option value="completada">Completadas</option>
                </select>
              </div>
              <button className="btn-primary">
                <i className="fas fa-plus me-2"></i>
                Nueva Solicitud
              </button>
            </div>
          </div>

          <div className="solicitudes-stats">
            <div className="stat-card">
              <h3>Total Solicitudes</h3>
              <p className="stat-number">{solicitudes.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pendientes</h3>
              <p className="stat-number warning">
                {solicitudes.filter(s => s.estado === 'pendiente').length}
              </p>
            </div>
            <div className="stat-card">
              <h3>En Progreso</h3>
              <p className="stat-number info">
                {solicitudes.filter(s => s.estado === 'en_progreso').length}
              </p>
            </div>
            <div className="stat-card">
              <h3>Completadas</h3>
              <p className="stat-number success">
                {solicitudes.filter(s => s.estado === 'completada').length}
              </p>
            </div>
          </div>

          <div className="solicitudes-list">
            {solicitudesFiltradas.map(solicitud => (
              <div key={solicitud.id} className="solicitud-card">
                <div className="solicitud-header">
                  <div className="solicitud-info">
                    <h4>Solicitud #{solicitud.id} - {solicitud.cliente}</h4>
                    <p className="solicitud-desc">{solicitud.descripcion}</p>
                    <div className="solicitud-meta">
                      <span><i className="fas fa-map-marker-alt"></i> {solicitud.direccion}</span>
                      <span><i className="fas fa-phone"></i> {solicitud.telefono}</span>
                      <span><i className="fas fa-calendar"></i> {solicitud.fecha}</span>
                    </div>
                  </div>
                  <div className="solicitud-estado">
                    <span className={`estado-badge ${solicitud.estado}`}>
                      {solicitud.estado.replace('_', ' ')}
                    </span>
                    <span className={`prioridad-badge ${solicitud.prioridad}`}>
                      {solicitud.prioridad}
                    </span>
                  </div>
                </div>
                
                <div className="solicitud-footer">
                  <div className="solicitud-actions">
                    <button className="btn-action" title="Ver detalles">
                      <i className="fas fa-eye"></i>
                    </button>
                    <button className="btn-action" title="Asignar técnico">
                      <i className="fas fa-user-cog"></i>
                    </button>
                    <button className="btn-action" title="Editar">
                      <i className="fas fa-edit"></i>
                    </button>
                  </div>
                  <div className="solicitud-tecnico">
                    {solicitud.tecnico ? (
                      <span>Técnico: {solicitud.tecnico}</span>
                    ) : (
                      <span className="sin-tecnico">Sin técnico asignado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSolicitudes;