import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminTecnicos.css';

const AdminTecnicos = () => {
  const navigate = useNavigate();
  const [tecnicos, setTecnicos] = useState([
    {
      id: 1,
      nombre: 'Juan Pérez',
      email: 'tecnico@infoser.cl',
      telefono: '+56987654321',
      especialidad: 'Instalación de cámaras',
      estado: 'activo',
      solicitudesAsignadas: 3
    },
    {
      id: 2,
      nombre: 'Pedro Sánchez',
      email: 'pedro@infoser.cl',
      telefono: '+56911223344',
      especialidad: 'Mantenimiento y reparación',
      estado: 'activo',
      solicitudesAsignadas: 2
    }
  ]);

  return (
    <div className="admin-tecnicos-container">
      <header className="admin-tecnicos-header">
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
              <i className="fas fa-user-cog"></i>
              Gestión de Técnicos - INFOSER & EP SPA
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

      <div className="admin-tecnicos-layout">
        <nav className="admin-tecnicos-sidebar">
          <button className="sidebar-btn" onClick={() => navigate('/admin/menu')}>
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/solicitudes')}>
            <i className="fas fa-tools"></i>
            📋 Solicitudes
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/clientes')}>
            <i className="fas fa-users"></i>
            👥 Clientes
          </button>
          <button className="sidebar-btn active">
            <i className="fas fa-user-cog"></i>
            👨‍💻 Técnicos
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/metricas')}>
            <i className="fas fa-chart-line"></i>
            📈 Métricas
          </button>
        </nav>

        <main className="admin-tecnicos-content">
          <div className="content-header">
            <h2>Equipo de Técnicos</h2>
            <div className="header-actions">
              <input 
                type="text" 
                placeholder="Buscar técnico..." 
                className="search-input"
              />
              <button className="btn-primary">
                <i className="fas fa-plus me-2"></i>
                Nuevo Técnico
              </button>
            </div>
          </div>

          <div className="tecnicos-stats">
            <div className="stat-card">
              <h3>Total Técnicos</h3>
              <p className="stat-number">{tecnicos.length}</p>
            </div>
            <div className="stat-card">
              <h3>Técnicos Activos</h3>
              <p className="stat-number">
                {tecnicos.filter(t => t.estado === 'activo').length}
              </p>
            </div>
            <div className="stat-card">
              <h3>Solicitudes Asignadas</h3>
              <p className="stat-number">
                {tecnicos.reduce((total, tecnico) => total + tecnico.solicitudesAsignadas, 0)}
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="tecnicos-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Especialidad</th>
                  <th>Estado</th>
                  <th>Solicitudes Asignadas</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tecnicos.map(tecnico => (
                  <tr key={tecnico.id}>
                    <td>
                      <div className="tecnico-info">
                        <strong>{tecnico.nombre}</strong>
                        <small>ID: {tecnico.id}</small>
                      </div>
                    </td>
                    <td>
                      <div className="contacto-info">
                        <div>{tecnico.email}</div>
                        <div>{tecnico.telefono}</div>
                      </div>
                    </td>
                    <td>{tecnico.especialidad}</td>
                    <td>
                      <span className={`badge ${tecnico.estado}`}>
                        {tecnico.estado}
                      </span>
                    </td>
                    <td>
                      <span className="solicitud-count">
                        {tecnico.solicitudesAsignadas}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-small btn-info">
                          Ver
                        </button>
                        <button className="btn-small btn-warning">
                          Editar
                        </button>
                        <button className="btn-small btn-danger">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminTecnicos;