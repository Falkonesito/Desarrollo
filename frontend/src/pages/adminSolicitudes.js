import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/adminSolicitudes.css";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000";

const AdminSolicitudes = () => {
  const navigate = useNavigate();
  const [solicitudes, setSolicitudes] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [backendDisponible, setBackendDisponible] = useState(false);

  // ===============================
  // 🔹 Verificar conexión al backend
  // ===============================
  const verificarBackend = async () => {
    try {
      const res = await fetch(`${API_URL}/api/health`);
      const data = await res.json();
      setBackendDisponible(data.success);
    } catch {
      setBackendDisponible(false);
    }
  };

  // ===============================
  // 🔹 Cargar solicitudes (API o local)
  // ===============================
  const cargarSolicitudes = async () => {
    if (backendDisponible) {
      try {
        const res = await fetch(`${API_URL}/api/solicitudes`);
        const data = await res.json();
        if (data.success && Array.isArray(data.solicitudes)) {
          setSolicitudes(data.solicitudes);
        } else {
          setSolicitudes([]);
        }
      } catch (error) {
        console.error("Error cargando solicitudes desde backend:", error);
        setSolicitudes(obtenerSolicitudesLocales());
      }
    } else {
      setSolicitudes(obtenerSolicitudesLocales());
    }
  };

  // 🔹 Cargar datos locales si no hay backend
  const obtenerSolicitudesLocales = () => {
    return JSON.parse(localStorage.getItem("solicitudesCliente")) || [];
  };

  useEffect(() => {
    verificarBackend().then(() => cargarSolicitudes());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendDisponible]);

  const solicitudesFiltradas =
    filtroEstado === "todos"
      ? solicitudes
      : solicitudes.filter(
          (s) =>
            s.estado_actual === filtroEstado || s.estado === filtroEstado
        );

  return (
    <div className="admin-solicitudes-container">
      <header className="admin-solicitudes-header">
        <div className="header-content">
          <div className="header-left">
            <button
              className="btn-volver"
              onClick={() => navigate("/admin/menu")}
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
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem("adminLoggedIn");
                navigate("/");
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      <div className="admin-solicitudes-layout">
        {/* Sidebar */}
        <nav className="admin-solicitudes-sidebar">
          <button
            className="sidebar-btn"
            onClick={() => navigate("/admin/menu")}
          >
            <i className="fas fa-home"></i>
            Menú Principal
          </button>
          <button className="sidebar-btn active">
            <i className="fas fa-tools"></i> 📋 Solicitudes
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate("/admin/clientes")}
          >
            <i className="fas fa-users"></i> 👥 Clientes
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate("/admin/tecnicos")}
          >
            <i className="fas fa-user-cog"></i> 👨‍💻 Técnicos
          </button>
          <button
            className="sidebar-btn"
            onClick={() => navigate("/admin/metricas")}
          >
            <i className="fas fa-chart-line"></i> 📈 Métricas
          </button>
        </nav>

        {/* Contenido principal */}
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

              <button
                className="btn-primary"
                onClick={() => navigate("/admin/nueva-solicitud")}
              >
                <i className="fas fa-plus me-2"></i>
                Nueva Solicitud
              </button>
            </div>
          </div>

          {/* Estadísticas */}
          <div className="solicitudes-stats">
            <div className="stat-card">
              <h3>Total Solicitudes</h3>
              <p className="stat-number">{solicitudes.length}</p>
            </div>
            <div className="stat-card">
              <h3>Pendientes</h3>
              <p className="stat-number warning">
                {
                  solicitudes.filter(
                    (s) =>
                      s.estado === "pendiente" ||
                      s.estado_actual === "pendiente"
                  ).length
                }
              </p>
            </div>
            <div className="stat-card">
              <h3>En Progreso</h3>
              <p className="stat-number info">
                {
                  solicitudes.filter(
                    (s) =>
                      s.estado === "en_progreso" ||
                      s.estado_actual === "en_progreso"
                  ).length
                }
              </p>
            </div>
            <div className="stat-card">
              <h3>Completadas</h3>
              <p className="stat-number success">
                {
                  solicitudes.filter(
                    (s) =>
                      s.estado === "completada" ||
                      s.estado_actual === "completada"
                  ).length
                }
              </p>
            </div>
          </div>

          {/* Lista de Solicitudes */}
          <div className="solicitudes-list">
            {solicitudesFiltradas.length > 0 ? (
              solicitudesFiltradas.map((s) => (
                <div key={s.id} className="solicitud-card">
                  <div className="solicitud-header">
                    <div className="solicitud-info">
                      <h4>
                        Solicitud #{s.id || "---"} -{" "}
                        {s.cliente_nombre || s.cliente || "Desconocido"}
                      </h4>
                      <p className="solicitud-desc">
                        {s.descripcion || "Sin descripción"}
                      </p>
                      <div className="solicitud-meta">
                        <span>
                          <i className="fas fa-map-marker-alt"></i>{" "}
                          {s.direccion_servicio || s.direccion || "Sin dirección"}
                        </span>
                        <span>
                          <i className="fas fa-calendar"></i>{" "}
                          {new Date(
                            s.fecha_solicitud || s.fecha || Date.now()
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="solicitud-estado">
                      <span
                        className={`estado-badge ${
                          s.estado || s.estado_actual || "pendiente"
                        }`}
                      >
                        {(s.estado || s.estado_actual || "pendiente").replace(
                          "_",
                          " "
                        )}
                      </span>
                      <span
                        className={`prioridad-badge ${s.prioridad || "media"}`}
                      >
                        {s.prioridad || "media"}
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
                      {s.tecnico ? (
                        <span>Técnico: {s.tecnico}</span>
                      ) : (
                        <span className="sin-tecnico">
                          Sin técnico asignado
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted mt-5">
                No hay solicitudes registradas.
              </p>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminSolicitudes;
