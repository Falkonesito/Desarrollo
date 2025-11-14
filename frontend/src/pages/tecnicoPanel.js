import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/tecnicoPanel.css';

const TecnicoPanel = () => {
  const navigate = useNavigate();
  
  // Datos del técnico
  const [tecnico] = useState({
    nombre: 'Juan Pablo Álvarez Avalos',
    email: 'juan.alvarez@infoser.cl',
    telefono: '+56 9 7654 3210',
    especialidad: 'Instalación y Mantenimiento de Cámaras',
    estado: 'Disponible',
    solicitudesAsignadas: 3,
    enProceso: 1,
    completadas: 12
  });

  // Lista de solicitudes asignadas
  const [solicitudes, setSolicitudes] = useState([
    {
      id: 1,
      titulo: 'Instalación de Cámaras HD',
      cliente: 'Juan Pérez',
      telefono: '+56 9 1234 5678',
      direccion: 'Av. Principal 123, Melipilla',
      descripcion: 'Instalación de 4 cámaras exteriores en residencia de 2 pisos.',
      fechaAsignacion: '2024-01-20',
      estado: 'pendiente',
      prioridad: 'alta',
      tipo: 'instalacion',
      equipos: '4 cámaras IP, DVR, cables'
    },
    {
      id: 2,
      titulo: 'Mantenimiento Sistema Alarmas',
      cliente: 'María González',
      telefono: '+56 9 8765 4321',
      direccion: 'Calle Secundaria 456, Melipilla',
      descripcion: 'Mantenimiento preventivo del sistema de alarmas existente.',
      fechaAsignacion: '2024-01-19',
      estado: 'en_proceso',
      prioridad: 'media',
      tipo: 'mantenimiento',
      equipos: 'Herramientas de diagnóstico'
    },
    {
      id: 3,
      titulo: 'Reparación Control Accesos',
      cliente: 'Empresa SegurTotal',
      telefono: '+56 2 2345 6789',
      direccion: 'Edificio Corporativo, Melipilla',
      descripcion: 'Reparación del sistema de control de accesos del edificio.',
      fechaAsignacion: '2024-01-18',
      estado: 'completada',
      prioridad: 'alta',
      tipo: 'reparacion',
      equipos: 'Sensores, panel control'
    }
  ]);

  const actualizarEstado = (id, nuevoEstado) => {
    setSolicitudes(solicitudes.map(sol => 
      sol.id === id ? { ...sol, estado: nuevoEstado } : sol
    ));
  };

  const verDetalles = (solicitud) => {
    alert(`Detalles de la solicitud #${solicitud.id}\n\nCliente: ${solicitud.cliente}\nDirección: ${solicitud.direccion}\nDescripción: ${solicitud.descripcion}\nEquipos: ${solicitud.equipos}`);
  };

  return (
    <div className="tecnico-container">
      {/* Header */}
      <header className="tecnico-header">
        <div className="header-content">
          <div className="header-left">
            <button 
              className="btn-volver"
              onClick={() => navigate('/')}
            >
              <i className="fas fa-arrow-left me-2"></i>
              Volver al Inicio
            </button>
            <h1>
              <i className="fas fa-user-cog"></i>
              Panel Técnico - INFOSER
            </h1>
          </div>
          <div className="header-info">
            <span className="user-info">
              <i className="fas fa-user me-2"></i>
              {tecnico.nombre}
            </span>
            <button className="logout-btn" onClick={() => navigate('/')}>
              <i className="fas fa-sign-out-alt me-2"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="tecnico-layout">
        {/* Sidebar */}
        <nav className="tecnico-sidebar">
          <div className="perfil-card">
            <div className="tecnico-avatar">
              <i className="fas fa-user-cog"></i>
            </div>
            <div className="tecnico-info">
              <h4>{tecnico.nombre}</h4>
              <p className="especialidad">{tecnico.especialidad}</p>
              <div className={`estado-badge ${tecnico.estado.toLowerCase()}`}>
                {tecnico.estado}
              </div>
            </div>
            
            <div className="estadisticas">
              <div className="stat-item">
                <div className="stat-number">{tecnico.solicitudesAsignadas}</div>
                <div className="stat-label">Asignadas</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{tecnico.enProceso}</div>
                <div className="stat-label">En Proceso</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{tecnico.completadas}</div>
                <div className="stat-label">Completadas</div>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="filtros-card">
            <h5>Filtros</h5>
            <div className="filtros-list">
              <button className="filtro-btn active">
                <i className="fas fa-list me-2"></i>
                Todas las Solicitudes
              </button>
              <button className="filtro-btn">
                <i className="fas fa-clock me-2"></i>
                Pendientes
              </button>
              <button className="filtro-btn">
                <i className="fas fa-tools me-2"></i>
                En Proceso
              </button>
              <button className="filtro-btn">
                <i className="fas fa-check-circle me-2"></i>
                Completadas
              </button>
            </div>
          </div>
        </nav>

        {/* Contenido Principal */}
        <main className="tecnico-content">
          <div className="content-header">
            <div className="header-text">
              <h2>Mis Solicitudes Asignadas</h2>
              <p>Gestiona tus servicios asignados</p>
            </div>
            <div className="header-actions">
              <button className="btn-primary">
                <i className="fas fa-sync-alt me-2"></i>
                Actualizar
              </button>
              <button className="btn-secondary">
                <i className="fas fa-filter me-2"></i>
                Filtrar
              </button>
            </div>
          </div>

          {/* Lista de Solicitudes */}
          <div className="solicitudes-grid">
            {solicitudes.map(solicitud => (
              <div key={solicitud.id} className="solicitud-card">
                <div className="solicitud-header">
                  <div className="solicitud-estado">
                    <span className={`estado-badge ${solicitud.estado}`}>
                      {solicitud.estado === 'pendiente' ? 'Pendiente' : 
                       solicitud.estado === 'en_proceso' ? 'En Proceso' : 'Completada'}
                    </span>
                    <span className="solicitud-id">#{solicitud.id}</span>
                  </div>
                  <div className="solicitud-prioridad">
                    <span className={`prioridad-badge ${solicitud.prioridad}`}>
                      {solicitud.prioridad}
                    </span>
                  </div>
                </div>

                <div className="solicitud-body">
                  <h4 className="solicitud-titulo">{solicitud.titulo}</h4>
                  
                  <div className="cliente-info">
                    <div className="info-item">
                      <i className="fas fa-user"></i>
                      <strong>{solicitud.cliente}</strong>
                    </div>
                    <div className="info-item">
                      <i className="fas fa-phone"></i>
                      {solicitud.telefono}
                    </div>
                    <div className="info-item">
                      <i className="fas fa-map-marker-alt"></i>
                      {solicitud.direccion}
                    </div>
                  </div>

                  <p className="solicitud-descripcion">{solicitud.descripcion}</p>

                  <div className="solicitud-meta">
                    <div className="meta-item">
                      <i className="fas fa-calendar"></i>
                      <span>
                        {solicitud.estado === 'pendiente' ? 'Asignada' : 
                         solicitud.estado === 'en_proceso' ? 'Iniciada' : 'Completada'}: {solicitud.fechaAsignacion}
                      </span>
                    </div>
                    <div className="meta-item">
                      <i className="fas fa-tools"></i>
                      <span>{solicitud.tipo}</span>
                    </div>
                  </div>

                  <div className="solicitud-actions">
                    {solicitud.estado === 'pendiente' && (
                      <button 
                        className="btn-success"
                        onClick={() => actualizarEstado(solicitud.id, 'en_proceso')}
                      >
                        <i className="fas fa-play me-2"></i>
                        Iniciar Trabajo
                      </button>
                    )}
                    {solicitud.estado === 'en_proceso' && (
                      <>
                        <button 
                          className="btn-primary"
                          onClick={() => actualizarEstado(solicitud.id, 'completada')}
                        >
                          <i className="fas fa-check me-2"></i>
                          Completar
                        </button>
                        <button 
                          className="btn-warning"
                          onClick={() => actualizarEstado(solicitud.id, 'pendiente')}
                        >
                          <i className="fas fa-pause me-2"></i>
                          Pausar
                        </button>
                      </>
                    )}
                    {solicitud.estado === 'completada' && (
                      <button className="btn-info">
                        <i className="fas fa-file-alt me-2"></i>
                        Ver Reporte
                      </button>
                    )}
                    <button 
                      className="btn-secondary"
                      onClick={() => verDetalles(solicitud)}
                    >
                      <i className="fas fa-eye me-2"></i>
                      Detalles
                    </button>
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

export default TecnicoPanel;