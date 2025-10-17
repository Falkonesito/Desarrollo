import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';

const Home = () => {
  const [cliente, setCliente] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
    // Campos según estructura de BD
    titulo: '',
    descripcion: '',
    direccion_servicio: '',
    comuna: '',
    region: 'Región Metropolitana',
    tipo_servicio: 'instalacion',
    prioridad: 'media',
    equipos_solicitados: '',
    comentarios_finales: ''
  });
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const navigate = useNavigate();

  // Comunas de la Región Metropolitana
  const comunasRM = [
    'Melipilla', 'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Reina',
    'Macul', 'Peñalolén', 'La Florida', 'Puente Alto', 'San Bernardo',
    'Maipú', 'Cerrillos', 'Quilicura', 'Recoleta', 'Independencia', 'Conchalí',
    'Renca', 'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Lo Espejo',
    'Pedro Aguirre Cerda', 'San Miguel', 'San Joaquín', 'La Granja', 'La Pintana',
    'El Bosque', 'San Ramón', 'Lo Barnechea', 'Vitacura', 'Huechuraba', 'Colina',
    'Lampa', 'Til Til', 'San José de Maipo', 'Pirque', 'Puente Alto', 'Talagante'
  ];

  const tiposServicio = [
    { value: 'instalacion', label: 'Instalación' },
    { value: 'mantenimiento', label: 'Mantenimiento' },
    { value: 'reparacion', label: 'Reparación' },
    { value: 'asesoria', label: 'Asesoría' }
  ];

  const prioridades = [
    { value: 'baja', label: 'Baja' },
    { value: 'media', label: 'Media' },
    { value: 'alta', label: 'Alta' }
  ];

  useEffect(() => {
    // Verificar si hay cliente logueado
    const clienteActual = JSON.parse(localStorage.getItem('clienteActual'));
    const clienteLoggedIn = localStorage.getItem('clienteLoggedIn');
    
    if (clienteActual && clienteLoggedIn) {
      setCliente(clienteActual);
      // Cargar solicitudes del localStorage
      const solicitudesGuardadas = JSON.parse(localStorage.getItem('solicitudesCliente')) || [];
      setSolicitudes(solicitudesGuardadas);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('clienteActual');
    localStorage.removeItem('clienteLoggedIn');
    setCliente(null);
    setSolicitudes([]);
    setMostrarFormulario(false);
    window.location.reload();
  };

  const handleSolicitarServicio = () => {
    if (!cliente) {
      navigate('/login');
    } else {
      setMostrarFormulario(true);
    }
  };

  const handleSolicitudChange = (e) => {
    const { name, value } = e.target;
    setNuevaSolicitud({
      ...nuevaSolicitud,
      [name]: value
    });
  };

  const crearSolicitud = (e) => {
    e.preventDefault();
    
    // Validar campos obligatorios
    if (!nuevaSolicitud.titulo || !nuevaSolicitud.descripcion || !nuevaSolicitud.direccion_servicio || !nuevaSolicitud.comuna) {
      alert('Por favor complete todos los campos obligatorios (*)');
      return;
    }

    const solicitud = {
      id: Date.now(),
      ...nuevaSolicitud,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      cliente_email: cliente.email,
      cliente_telefono: cliente.telefono,
      estado_actual: 'pendiente',
      fecha_solicitud: new Date().toISOString(),
      fecha_actualizacion: new Date().toISOString(),
      numeroSolicitud: `SOL-${Date.now().toString().slice(-6)}`
    };

    const nuevasSolicitudes = [...solicitudes, solicitud];
    setSolicitudes(nuevasSolicitudes);
    localStorage.setItem('solicitudesCliente', JSON.stringify(nuevasSolicitudes));
    
    // Resetear formulario
    setNuevaSolicitud({
      titulo: '',
      descripcion: '',
      direccion_servicio: '',
      comuna: '',
      region: 'Región Metropolitana',
      tipo_servicio: 'instalacion',
      prioridad: 'media',
      equipos_solicitados: '',
      comentarios_finales: ''
    });
    
    setMostrarFormulario(false);
    alert('¡Solicitud creada exitosamente! Será revisada por nuestro equipo.');
  };

  // SI EL CLIENTE ESTÁ LOGUEADO Y QUIERE VER FORMULARIO, MOSTRAR SOLO ESO
  if (cliente && mostrarFormulario) {
    return (
      <div className="home-page">
        <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
          <div className="container">
            <Link className="navbar-brand" to="/">
              <i className="fas fa-shield-alt me-2"></i>
              <strong>INFOSER</strong> & EP SPA
            </Link>
            <div className="navbar-nav ms-auto">
              <span className="nav-link text-light">
                <i className="fas fa-user me-1"></i>Hola, {cliente.nombre}
              </span>
              <button 
                className="btn btn-outline-light btn-sm ms-2"
                onClick={() => setMostrarFormulario(false)}
              >
                <i className="fas fa-arrow-left me-1"></i>Volver al Inicio
              </button>
            </div>
          </div>
        </nav>

        {/* Formulario de Nueva Solicitud MEJORADO */}
        <section className="container my-5">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="card shadow">
                <div className="card-header bg-primary text-white">
                  <h4 className="mb-0">
                    <i className="fas fa-file-alt me-2"></i>Nueva Solicitud de Servicio
                  </h4>
                  <small className="opacity-75">Complete todos los campos obligatorios (*)</small>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={crearSolicitud}>
                    {/* Información Básica */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">
                          <i className="fas fa-info-circle me-2"></i>Información del Servicio
                        </h5>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Título de la Solicitud *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="titulo"
                          value={nuevaSolicitud.titulo}
                          onChange={handleSolicitudChange}
                          placeholder="Ej: Instalación de cámaras de seguridad en residencia"
                          required
                        />
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo de Servicio *</label>
                        <select
                          className="form-select"
                          name="tipo_servicio"
                          value={nuevaSolicitud.tipo_servicio}
                          onChange={handleSolicitudChange}
                          required
                        >
                          {tiposServicio.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>
                              {tipo.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="mb-4">
                      <label className="form-label">Descripción Detallada *</label>
                      <textarea
                        className="form-control"
                        name="descripcion"
                        value={nuevaSolicitud.descripcion}
                        onChange={handleSolicitudChange}
                        placeholder="Describa en detalle el servicio requerido, problemas específicos o necesidades particulares..."
                        rows="4"
                        required
                      ></textarea>
                    </div>

                    {/* Ubicación */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">
                          <i className="fas fa-map-marker-alt me-2"></i>Ubicación del Servicio
                        </h5>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Dirección Completa *</label>
                        <input
                          type="text"
                          className="form-control"
                          name="direccion_servicio"
                          value={nuevaSolicitud.direccion_servicio}
                          onChange={handleSolicitudChange}
                          placeholder="Calle, número, departamento, block, etc."
                          required
                        />
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Comuna *</label>
                        <select
                          className="form-select"
                          name="comuna"
                          value={nuevaSolicitud.comuna}
                          onChange={handleSolicitudChange}
                          required
                        >
                          <option value="">Seleccione comuna</option>
                          {comunasRM.map(comuna => (
                            <option key={comuna} value={comuna}>
                              {comuna}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="col-md-3 mb-3">
                        <label className="form-label">Región</label>
                        <input
                          type="text"
                          className="form-control"
                          name="region"
                          value={nuevaSolicitud.region}
                          onChange={handleSolicitudChange}
                          readOnly
                        />
                      </div>
                    </div>

                    {/* Detalles Adicionales */}
                    <div className="row mb-4">
                      <div className="col-12">
                        <h5 className="text-primary mb-3">
                          <i className="fas fa-cogs me-2"></i>Detalles Adicionales
                        </h5>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Equipos Solicitados</label>
                        <select
                          className="form-select"
                          name="equipos_solicitados"
                          value={nuevaSolicitud.equipos_solicitados}
                          onChange={handleSolicitudChange}
                        >
                          <option value="">Seleccione equipos requeridos</option>
                          <option value="camaras_colorvu">Cámaras ColorVu (24/7 color)</option>
                          <option value="camaras_ptz">Cámaras PTZ (Zoom 25x)</option>
                          <option value="sistema_completo">Sistema completo de seguridad</option>
                          <option value="dvr_nvr">DVR/NVR y almacenamiento</option>
                          <option value="accesorios">Accesorios y cableado</option>
                          <option value="otro">Otro equipo</option>
                        </select>
                      </div>
                      
                      <div className="col-md-6 mb-3">
                        <label className="form-label">Prioridad del Servicio</label>
                        <select
                          className="form-select"
                          name="prioridad"
                          value={nuevaSolicitud.prioridad}
                          onChange={handleSolicitudChange}
                        >
                          {prioridades.map(prioridad => (
                            <option key={prioridad.value} value={prioridad.value}>
                              {prioridad.label}
                            </option>
                          ))}
                        </select>
                        <div className="form-text">
                          {nuevaSolicitud.prioridad === 'alta' && '⚠️ Servicio urgente - Respuesta inmediata'}
                          {nuevaSolicitud.prioridad === 'media' && '⏱️ Servicio estándar - Respuesta en 24-48 horas'}
                          {nuevaSolicitud.prioridad === 'baja' && '📅 Servicio programado - Respuesta en 3-5 días'}
                        </div>
                      </div>
                    </div>

                    {/* Comentarios Adicionales */}
                    <div className="mb-4">
                      <label className="form-label">Comentarios o Información Adicional</label>
                      <textarea
                        className="form-control"
                        name="comentarios_finales"
                        value={nuevaSolicitud.comentarios_finales}
                        onChange={handleSolicitudChange}
                        placeholder="Horarios preferidos, acceso al lugar, restricciones, información adicional que debamos conocer..."
                        rows="3"
                      ></textarea>
                    </div>

                    {/* Resumen de la Solicitud */}
                    <div className="card bg-light mb-4">
                      <div className="card-body">
                        <h6 className="card-title">
                          <i className="fas fa-clipboard-check me-2"></i>Resumen de su Solicitud
                        </h6>
                        <div className="row small">
                          <div className="col-md-6">
                            <strong>Tipo:</strong> {tiposServicio.find(t => t.value === nuevaSolicitud.tipo_servicio)?.label}<br/>
                            <strong>Prioridad:</strong> {prioridades.find(p => p.value === nuevaSolicitud.prioridad)?.label}<br/>
                            <strong>Equipos:</strong> {nuevaSolicitud.equipos_solicitados ? nuevaSolicitud.equipos_solicitados.replace(/_/g, ' ') : 'No especificado'}
                          </div>
                          <div className="col-md-6">
                            <strong>Comuna:</strong> {nuevaSolicitud.comuna || 'No especificada'}<br/>
                            <strong>Región:</strong> {nuevaSolicitud.region}<br/>
                            <strong>Dirección:</strong> {nuevaSolicitud.direccion_servicio ? `${nuevaSolicitud.direccion_servicio.substring(0, 30)}...` : 'No especificada'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Botones de Acción */}
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      <button 
                        type="button" 
                        className="btn btn-secondary me-md-2"
                        onClick={() => setMostrarFormulario(false)}
                      >
                        <i className="fas fa-times me-2"></i>Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary">
                        <i className="fas fa-paper-plane me-2"></i>Enviar Solicitud
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ... (el resto del código del home se mantiene igual)
  // Solo cambiamos el formulario, el resto del home permanece igual

  return (
    <div className="home-page">
      {/* Navigation - Se mantiene igual */}
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-shield-alt me-2"></i>
            <strong>INFOSER</strong> & EP SPA
          </Link>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
            <span className="navbar-toggler-icon"></span>
          </button>
          <div className="collapse navbar-collapse" id="navbarNav">
            <ul className="navbar-nav ms-auto">
              <li className="nav-item">
                <a className="nav-link" href="#inicio">Inicio</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#servicios">Servicios</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#proceso">Proceso</a>
              </li>
              <li className="nav-item">
                <a className="nav-link" href="#contacto">Contacto</a>
              </li>
              
              {/* Botones de Login/Registro o Info Cliente */}
              {!cliente ? (
                <>
                  <li className="nav-item">
                    <Link className="nav-link" to="/login">Iniciar Sesión</Link>
                  </li>
                  <li className="nav-item">
                    <Link className="nav-link" to="/registro">Registrarse</Link>
                  </li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <span className="nav-link text-success">
                      <i className="fas fa-user me-1"></i>{cliente.nombre}
                    </span>
                  </li>
                  <li className="nav-item">
                    <button 
                      className="btn btn-outline-light btn-sm ms-2"
                      onClick={handleLogout}
                    >
                      Cerrar Sesión
                    </button>
                  </li>
                </>
              )}
              
              <li className="nav-item">
                <button 
                  className="btn btn-primary btn-sm ms-2" 
                  onClick={handleSolicitarServicio}
                >
                  <i className="fas fa-paper-plane me-1"></i>
                  {cliente ? 'Nueva Solicitud' : 'Solicitar Servicio'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Hero Section - Se mantiene igual */}
      <section id="inicio" className="hero-section">
        <div className="container">
          <div className="row align-items-center min-vh-80">
            <div className="col-lg-6">
              <h1 className="hero-title">Protección Profesional para lo que más Importa</h1>
              <p className="hero-subtitle">Sistemas de seguridad confiables para hogares y empresas. Instalación experta y mantenimiento preventivo.</p>
              <div className="hero-features">
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Instalación profesional</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Mantenimiento especializado</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-check-circle"></i>
                  <span>Soporte 24/7</span>
                </div>
              </div>
              <div className="hero-buttons mt-4">
                <button 
                  className="btn btn-primary btn-lg me-3"
                  onClick={handleSolicitarServicio}
                >
                  <i className="fas fa-tools me-2"></i>
                  {cliente ? 'Nueva Solicitud' : 'Solicitar Servicio'}
                </button>
                <a href="#servicios" className="btn btn-outline-primary btn-lg">
                  <i className="fas fa-info-circle me-2"></i>Más Información
                </a>
              </div>

              {/* Mostrar solicitudes recientes si el cliente está logueado */}
              {cliente && solicitudes.length > 0 && (
                <div className="mt-5">
                  <h5>Tus Solicitudes Recientes</h5>
                  <div className="solicitudes-recientes">
                    {solicitudes.slice(0, 3).map((solicitud) => (
                      <div key={solicitud.id} className="card mb-2">
                        <div className="card-body py-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <div>
                              <h6 className="mb-1">{solicitud.titulo}</h6>
                              <small className="text-muted">
                                {new Date(solicitud.fecha_solicitud).toLocaleDateString('es-CL')} • 
                                <span className={`badge ms-2 estado-${solicitud.estado_actual}`}>
                                  {solicitud.estado_actual}
                                </span>
                              </small>
                            </div>
                            <span className={`badge bg-${solicitud.prioridad === 'alta' ? 'danger' : solicitud.prioridad === 'media' ? 'warning' : 'info'}`}>
                              {solicitud.prioridad}
                            </span>
                          </div>
                          <small className="text-muted">
                            <i className="fas fa-map-marker-alt me-1"></i>
                            {solicitud.comuna} • {solicitud.tipo_servicio}
                          </small>
                        </div>
                      </div>
                    ))}
                    {solicitudes.length > 3 && (
                      <small className="text-muted">
                        Y {solicitudes.length - 3} solicitudes más...
                      </small>
                    )}
                  </div>
                </div>
              )}
            </div>
            <div className="col-lg-6 text-center">
              <div className="hero-image">
                <i className="fas fa-shield-alt"></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Servicios Section - Se mantiene igual */}
      <section id="servicios" className="services-section py-5 bg-light">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">Nuestros Servicios</h2>
            <p className="section-subtitle">Soluciones de seguridad adaptadas a sus necesidades</p>
          </div>
          <div className="row">
            <div className="col-md-6 mb-4">
              <div className="service-card">
                <div className="service-icon">
                  <i className="fas fa-camera"></i>
                </div>
                <h4>Instalación de Cámaras de Seguridad</h4>
                <p>Instalación profesional de sistemas de cámaras de seguridad para proteger su propiedad las 24 horas.</p>
                <ul className="service-features">
                  <li>Cámaras ColorVu - 24/7 a color</li>
                  <li>Cámaras PTZ - Zoom 25x (100m distancia)</li>
                  <li>Vigilancia en alta oscuridad</li>
                  <li>Seguimiento de personas y vehículos</li>
                </ul>
              </div>
            </div>
            <div className="col-md-6 mb-4">
              <div className="service-card">
                <div className="service-icon">
                  <i className="fas fa-tools"></i>
                </div>
                <h4>Mantenimiento Preventivo</h4>
                <p>Mantenimiento especializado para garantizar el funcionamiento óptimo de sus sistemas.</p>
                <ul className="service-features">
                  <li>Revisiones periódicas</li>
                  <li>Actualizaciones de software</li>
                  <li>Reparación de componentes</li>
                  <li>Optimización del sistema</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Proceso Section - Se mantiene igual */}
      <section id="proceso" className="process-section py-5">
        <div className="container">
          <div className="text-center mb-5">
            <h2 className="section-title">Cómo Trabajamos</h2>
            <p className="section-subtitle">Proceso simple y eficiente para su tranquilidad</p>
          </div>
          <div className="row">
            <div className="col-md-3 text-center mb-4">
              <div className="process-step">
                <div className="step-number">1</div>
                <h5>Solicitud</h5>
                <p>Complete nuestro formulario con los detalles de su necesidad</p>
              </div>
            </div>
            <div className="col-md-3 text-center mb-4">
              <div className="process-step">
                <div className="step-number">2</div>
                <h5>Evaluación</h5>
                <p>Analizamos sus requerimientos y le contactamos</p>
              </div>
            </div>
            <div className="col-md-3 text-center mb-4">
              <div className="process-step">
                <div className="step-number">3</div>
                <h5>Ejecución</h5>
                <p>Realizamos el servicio con profesionales certificados</p>
              </div>
            </div>
            <div className="col-md-3 text-center mb-4">
              <div className="process-step">
                <div className="step-number">4</div>
                <h5>Seguimiento</h5>
                <p>Garantizamos su satisfacción con soporte continuo</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section - Se mantiene igual */}
      <section id="solicitar" className="cta-section py-5 bg-primary text-white">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-8">
              <h3 className="cta-title">¿Listo para Proteger su Propiedad?</h3>
              <p className="cta-subtitle">Solicite su servicio ahora y reciba asesoría especializada sin compromiso</p>
            </div>
            <div className="col-lg-4 text-lg-end">
              <button 
                className="btn btn-light btn-lg"
                onClick={handleSolicitarServicio}
              >
                <i className="fas fa-paper-plane me-2"></i>
                {cliente ? 'Nueva Solicitud' : 'Solicitar Ahora'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer - Se mantiene igual */}
      <footer id="contacto" className="footer-section py-4 bg-dark text-white">
        <div className="container">
          <div className="row">
            <div className="col-md-6">
              <h5><i className="fas fa-shield-alt me-2"></i>INFOSER & EP SPA</h5>
              <p className="mb-2">RUT: 77.196.032-4</p>
              <p className="mb-2">Consultoría informática y gestión de instalaciones informáticas</p>
              <p className="small text-light">© 2024 Todos los derechos reservados</p>
              <div className="social-links mt-3">
                <a href="https://instagram.com/infoserepspa" className="text-light me-3">
                  <i className="fab fa-instagram fa-lg"></i> @infoserepspa
                </a>
              </div>
            </div>
            <div className="col-md-6 text-md-end">
              <h6>Contacto</h6>
              <p className="mb-1">
                <i className="fas fa-map-marker-alt me-2"></i>Avenida Circunvalación 1982, Melipilla
              </p>
              <p className="mb-1">
                <i className="fas fa-phone me-2"></i>+56 9 7719 6032
              </p>
              <p className="mb-1">
                <i className="fas fa-envelope me-2"></i>infoserepspa@gmail.com
              </p>
              <p className="mb-0">
                <i className="fas fa-clock me-2"></i>Lun-Vie: 8:00 - 18:00
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;