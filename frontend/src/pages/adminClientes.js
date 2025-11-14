import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminClientes.css';

const AdminClientes = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState([
    {
      id: 1,
      nombre: 'María González',
      email: 'cliente@ejemplo.com',
      telefono: '+56911223344',
      fechaRegistro: '2024-01-15',
      solicitudesActivas: 2,
      ultimaSolicitud: '2024-01-20'
    },
    {
      id: 2,
      nombre: 'Carlos López',
      email: 'carlos@empresa.com',
      telefono: '+56955667788',
      fechaRegistro: '2024-01-10',
      solicitudesActivas: 1,
      ultimaSolicitud: '2024-01-18'
    }
  ]);

  return (
    <div className="admin-clientes-container">
      <header className="admin-clientes-header">
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
              <i className="fas fa-users"></i>
              Gestión de Clientes - INFOSER & EP SPA
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

      <div className="admin-clientes-layout">
        <nav className="admin-clientes-sidebar">
          <button className="sidebar-btn" onClick={() => navigate('/admin/menu')}>
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button className="sidebar-btn" onClick={() => navigate('/admin/solicitudes')}>
            <i className="fas fa-tools"></i>
            📋 Solicitudes
          </button>
          <button className="sidebar-btn active">
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

        <main className="admin-clientes-content">
          <div className="content-header">
            <h2>Lista de Clientes Registrados</h2>
            <div className="header-actions">
              <input 
                type="text" 
                placeholder="Buscar cliente..." 
                className="search-input"
              />
              <button className="btn-primary">
                Exportar Lista
              </button>
            </div>
          </div>

          <div className="clientes-stats">
            <div className="stat-card">
              <h3>Total Clientes</h3>
              <p className="stat-number">{clientes.length}</p>
            </div>
            <div className="stat-card">
              <h3>Clientes Activos</h3>
              <p className="stat-number">
                {clientes.filter(c => c.solicitudesActivas > 0).length}
              </p>
            </div>
          </div>

          <div className="table-container">
            <table className="clientes-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Contacto</th>
                  <th>Fecha Registro</th>
                  <th>Solicitudes Activas</th>
                  <th>Última Solicitud</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map(cliente => (
                  <tr key={cliente.id}>
                    <td>
                      <div className="cliente-info">
                        <strong>{cliente.nombre}</strong>
                        <small>ID: {cliente.id}</small>
                      </div>
                    </td>
                    <td>
                      <div className="contacto-info">
                        <div>{cliente.email}</div>
                        <div>{cliente.telefono}</div>
                      </div>
                    </td>
                    <td>{cliente.fechaRegistro}</td>
                    <td>
                      <span className={`badge ${cliente.solicitudesActivas > 0 ? 'active' : 'inactive'}`}>
                        {cliente.solicitudesActivas}
                      </span>
                    </td>
                    <td>{cliente.ultimaSolicitud}</td>
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

export default AdminClientes;