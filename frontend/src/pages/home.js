// src/pages/home.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/home.css';
import { api } from '../components/utils/api.js';

const Home = () => {
  const [cliente, setCliente] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [nuevaSolicitud, setNuevaSolicitud] = useState({
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
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const comunasRM = [
    'Melipilla', 'Santiago', 'Providencia', 'Las Condes', 'Ñuñoa', 'La Reina',
    'Macul', 'Peñalolén', 'La Florida', 'Puente Alto', 'San Bernardo',
    'Maipú', 'Cerrillos', 'Quilicura', 'Recoleta', 'Independencia', 'Conchalí',
    'Renca', 'Quinta Normal', 'Lo Prado', 'Pudahuel', 'Cerro Navia', 'Lo Espejo',
    'Pedro Aguirre Cerda', 'San Miguel', 'San Joaquín', 'La Granja', 'La Pintana',
    'El Bosque', 'San Ramón', 'Lo Barnechea', 'Vitacura', 'Huechuraba', 'Colina',
    'Lampa', 'Til Til', 'San José de Maipo', 'Pirque', 'Talagante'
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

  // Cargar cliente y sus solicitudes al montar
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData') || 'null');
    const clienteActual = JSON.parse(localStorage.getItem('clienteActual') || 'null');
    const isCliente = (userData?.rol === 'cliente') || !!clienteActual;

    const c = clienteActual || (isCliente ? userData : null);
    if (!c) return;

    setCliente(c);
    cargarSolicitudes(c.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cargarSolicitudes = async (clienteId) => {
    setError('');
    try {
      const data = await api.get(`/api/solicitudes/cliente/${clienteId}`);
      setSolicitudes(data.solicitudes || []);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las solicitudes');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('clienteActual');
    localStorage.removeItem('clienteLoggedIn');
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
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
    setNuevaSolicitud((prev) => ({ ...prev, [name]: value }));
  };

  const crearSolicitud = async (e) => {
    e.preventDefault();
    setCargando(true);
    setError('');

    if (!nuevaSolicitud.titulo || !nuevaSolicitud.descripcion || !nuevaSolicitud.direccion_servicio || !nuevaSolicitud.comuna) {
      alert('Por favor complete todos los campos obligatorios (*)');
      setCargando(false);
      return;
    }

    const datosSolicitud = {
      ...nuevaSolicitud,
      cliente_id: cliente.id,
      cliente_nombre: cliente.nombre,
      cliente_email: cliente.email
    };

    try {
      const data = await api.post('/api/solicitudes', datosSolicitud);
      if (data?.success) {
        alert('¡Solicitud creada exitosamente! Será revisada por nuestro equipo.');
        resetearFormulario();
        await cargarSolicitudes(cliente.id);
      } else {
        alert(`Error al crear solicitud: ${data?.message || 'Desconocido'}`);
      }
    } catch (err) {
      alert(err.message || 'Error al conectar con el servidor');
    } finally {
      setCargando(false);
    }
  };

  const resetearFormulario = () => {
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
  };

  // ======= VISTA FORMULARIO (cuando el cliente decide crear una solicitud) =======
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
                disabled={cargando}
              >
                <i className="fas fa-arrow-left me-1"></i>Volver al Inicio
              </button>
            </div>
          </div>
        </nav>

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
                          disabled={cargando}
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
                          disabled={cargando}
                        >
                          {tiposServicio.map(tipo => (
                            <option key={tipo.value} value={tipo.value}>{tipo.label}</option>
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
                        placeholder="Describa en detalle el servicio requerido..."
                        rows="4"
                        required
                        disabled={cargando}
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
                          placeholder="Calle, número, depto, etc."
                          required
                          disabled={cargando}
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
                          disabled={cargando}
                        >
                          <option value="">Seleccione comuna</option>
                          {comunasRM.map(comuna => (
                            <option key={comuna} value={comuna}>{comuna}</option>
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
                          disabled={cargando}
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
                          disabled={cargando}
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
                          disabled={cargando}
                        >
                          {prioridades.map(prioridad => (
                            <option key={prioridad.value} value={prioridad.value}>{prioridad.label}</option>
                          ))}
                        </select>
                        <div className="form-text">
                          {nuevaSolicitud.prioridad === 'alta' && '⚠️ Servicio urgente - Respuesta inmediata'}
                          {nuevaSolicitud.prioridad === 'media' && '⏱️ Servicio estándar - Respuesta en 24-48 horas'}
                          {nuevaSolicitud.prioridad === 'baja' && '📅 Servicio programado - Respuesta en 3-5 días'}
                        </div>
                      </div>
                    </div>

                    {/* Comentarios */}
                    <div className="mb-4">
                      <label className="form-label">Comentarios o Información Adicional</label>
                      <textarea
                        className="form-control"
                        name="comentarios_finales"
                        value={nuevaSolicitud.comentarios_finales}
                        onChange={handleSolicitudChange}
                        placeholder="Horarios preferidos, acceso, restricciones, etc."
                        rows="3"
                        disabled={cargando}
                      ></textarea>
                    </div>

                    {/* Acciones */}
                    <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                      <button
                        type="button"
                        className="btn btn-secondary me-md-2"
                        onClick={() => setMostrarFormulario(false)}
                        disabled={cargando}
                      >
                        <i className="fas fa-times me-2"></i>Cancelar
                      </button>
                      <button type="submit" className="btn btn-primary" disabled={cargando}>
                        {cargando ? (
                          <>
                            <i className="fas fa-spinner fa-spin me-2"></i>
                            ENVIANDO...
                          </>
                        ) : (
                          <>
                            <i className="fas fa-paper-plane me-2"></i>
                            Enviar Solicitud
                          </>
                        )}
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

  // ======= VISTA HOME NORMAL =======
  return (
    <div className="home-page">
      <nav id="inicio" className="navbar navbar-expand-lg navbar-dark bg-dark">
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
              <li className="nav-item"><a className="nav-link" href="#inicio">Inicio</a></li>
              <li className="nav-item"><a className="nav-link" href="#servicios">Servicios</a></li>
              <li className="nav-item"><a className="nav-link" href="#proceso">Proceso</a></li>
              <li className="nav-item"><a className="nav-link" href="#contacto">Contacto</a></li>

              {!cliente ? (
                <>
                  <li className="nav-item"><Link className="nav-link" to="/login">Iniciar Sesión</Link></li>
                  <li className="nav-item"><Link className="nav-link" to="/registro">Registrarse</Link></li>
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <span className="nav-link text-success">
                      <i className="fas fa-user me-1"></i>{cliente.nombre}
                    </span>
                  </li>
                  <li className="nav-item">
                    <button className="btn btn-outline-light btn-sm ms-2" onClick={handleLogout}>
                      Cerrar Sesión
                    </button>
                  </li>
                </>
              )}

              <li className="nav-item">
                <button className="btn btn-primary btn-sm ms-2" onClick={handleSolicitarServicio}>
                  <i className="fas fa-paper-plane me-1"></i>
                  {cliente ? 'Nueva Solicitud' : 'Solicitar Servicio'}
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-section py-5" style={{background:'linear-gradient(135deg,#0d47a1 0%, #1565c0 100%)'}}>
        <div className="container">
          <div className="row align-items-center" style={{minHeight: '60vh'}}>
            <div className="col-lg-6 text-white">
              <h1 className="mb-3">Protección Profesional para lo que más Importa</h1>
              <p className="lead opacity-75">
                Sistemas de seguridad confiables para hogares y empresas. Instalación experta y mantenimiento.
              </p>
              <div className="mt-4">
                <button className="btn btn-light btn-lg me-3" onClick={handleSolicitarServicio}>
                  <i className="fas fa-tools me-2"></i>
                  {cliente ? 'Nueva Solicitud' : 'Solicitar Servicio'}
                </button>
                <a href="#servicios" className="btn btn-outline-light btn-lg">
                  <i className="fas fa-info-circle me-2"></i>Más Información
                </a>
              </div>
            </div>
            <div className="col-lg-6 text-center text-white">
              <i className="fas fa-shield-alt" style={{fontSize: 140, opacity: .85}}></i>
            </div>
          </div>
        </div>
      </section>

      {/* SERVICIOS */}
<section id="servicios" className="py-5 bg-light">
  <div className="container">
    <div className="text-center mb-5">
      <h2 className="section-title">Nuestros Servicios</h2>
      <p className="section-subtitle">Soluciones de seguridad adaptadas a tus necesidades</p>
    </div>

    <div className="row">
      {/* Instalación de Cámaras */}
      <div className="col-md-6 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-body">
            <h4 className="mb-3">
              <i className="fas fa-camera me-2"></i>
              Instalación de Cámaras de Seguridad
            </h4>
            <p className="text-muted">
              Diseño e implementación completa del sistema, desde el levantamiento en terreno hasta la
              puesta en marcha y capacitación básica.
            </p>
            <ul className="mb-3">
              <li>Planificación de cobertura y ángulos ciegos (croquis + recomendaciones).</li>
              <li>Cámaras <strong>ColorVu</strong> 24/7 a color y <strong>PTZ</strong> con zoom óptico hasta 25×.</li>
              <li>Canalizado, cableado estructurado y rotulación de puntos.</li>
              <li>Grabadores <strong>DVR/NVR</strong>, discos de vigilancia y dimensionamiento de almacenamiento.</li>
              <li>Configuración de red, acceso remoto seguro (P2P/VPN), app móvil y perfiles de usuario.</li>
              <li>Entrega de documentación: claves iniciales, mapa de cámaras y ficha técnica.</li>
            </ul>
            <div className="small text-muted">
              Opcionales: analítica de video (detección de personas/vehículos), audio disuasivo,
              integración con alarmas y control de acceso.
            </div>
          </div>
        </div>
      </div>

      {/* Mantenimiento (preventivo y correctivo) */}
      <div className="col-md-6 mb-4">
        <div className="card h-100 shadow-sm">
          <div className="card-body">
            <h4 className="mb-3">
              <i className="fas fa-tools me-2"></i>
              Mantenimiento de Cámaras (Preventivo y Correctivo)
            </h4>
            <p className="text-muted">
              Mantén tu sistema operando al 100% con planes programados y soporte cuando algo falla.
            </p>

            <h6 className="mt-3">Preventivo (programado)</h6>
            <ul className="mb-3">
              <li>Limpieza de lentes y carcasas; revisión de sellos IP y soportes.</li>
              <li>Verificación de fuentes, POE, voltajes y conectores.</li>
              <li>Chequeo de ángulos, enfoque y perfil de imagen (día/noche).</li>
              <li>Actualización de firmware (cámaras/NVR) y respaldo de configuración.</li>
              <li>Pruebas de grabación, retención de video y salud de discos (S.M.A.R.T.).</li>
              <li>Informe técnico con hallazgos, evidencias y recomendaciones.</li>
            </ul>

            <h6>Correctivo (bajo demanda)</h6>
            <ul className="mb-3">
              <li>Diagnóstico en sitio y reemplazo de componentes defectuosos.</li>
              <li>Reconfiguración de red, puertos y usuarios; recuperación de acceso.</li>
              <li>Reubicación de cámaras y recalibración de detecciones.</li>
            </ul>

            <div className="small text-muted">
              Planes con <strong>SLA</strong> (tiempos de respuesta) y frecuencia: mensual, bimestral o trimestral.
              Atención 24/7 para clientes con plan activo.
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* FOOTER */}
      <footer id="contacto" className="py-4 bg-dark text-white">
        <div className="container d-flex justify-content-between">
          <div>
            <h5><i className="fas fa-shield-alt me-2"></i>INFOSER & EP SPA</h5>
            <small>© 2024 Todos los derechos reservados</small>
          </div>
          <div className="text-end">
            <div><i className="fas fa-envelope me-2"></i>infoserepspa@gmail.com</div>
            <div><i className="fas fa-phone me-2"></i>+56 9 7719 6032</div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
