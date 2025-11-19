// frontend/src/pages/adminSolicitudes.js
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../utils/api.js';

const ESTADOS = ['pendiente', 'en_proceso', 'completada', 'cancelada'];

export default function AdminSolicitudes() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [solicitudes, setSolicitudes] = useState([]);
  const [tecnicos, setTecnicos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState('');

  // Guard de ruta (solo admin)
  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('userData') || 'null');
    const token = localStorage.getItem('authToken');
    if (!u || !token || (u.rol !== 'administrador' && u.rol !== 'admin')) {
      navigate('/login');
      return;
    }
    setUser(u);
  }, [navigate]);

  // Cargar datos iniciales
  const cargarTodo = async () => {
    try {
      setCargando(true);
      const [sol, tec] = await Promise.all([
        api.get('/api/solicitudes'),
        api.get('/api/tecnicos'),
      ]);
      setSolicitudes(sol.solicitudes || []);
      setTecnicos(tec.tecnicos || []);
      setError('');
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los datos');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargarTodo(); }, []);

  const solicitudesFiltradas = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return solicitudes;
    return solicitudes.filter((s) =>
      [
        s.titulo, s.descripcion, s.comuna, s.region, s.tipo_servicio, s.estado_actual,
        s?.cliente_nombre, s?.cliente_email, s?.tecnico_nombre,
      ].filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  }, [filtro, solicitudes]);

  const actualizarSolicitud = async (id, payload) => {
    try {
      if (!id || Number.isNaN(Number(id))) {
        alert('ID de solicitud inválido');
        return;
      }
      const body = {
        ...payload,
        tecnico_id: payload.tecnico_id === '' || payload.tecnico_id === undefined
          ? null
          : Number(payload.tecnico_id),
      };

      setGuardando(id);
      const res = await api.put(`/api/solicitudes/${id}`, body);
      setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, ...res.solicitud } : s)));
    } catch (err) {
      console.error('Error PUT /api/solicitudes/:id', err);
      alert(err.message || 'Error al actualizar la solicitud');
    } finally {
      setGuardando(null);
    }
  };

  const handleCambioEstado = (sol, nuevoEstado) => {
    if (nuevoEstado === sol.estado_actual) return;
    actualizarSolicitud(sol.id, {
      estado_actual: nuevoEstado,
      tecnico_id: sol.tecnico_id ?? null,
    });
  };

  // Enviar/Asignar a técnico (ruta nueva PATCH)
  const enviarATecnico = async (solicitudId, tecnicoId) => {
    try {
      setGuardando(solicitudId);
      const res = await api.patch(`/api/solicitudes/${solicitudId}/enviar-a-tecnico`, {
        tecnico_id: Number(tecnicoId)
      });
      setSolicitudes(prev => prev.map(s => s.id === solicitudId ? { ...s, ...res.solicitud } : s));
    } catch (e) {
      console.error('Error PATCH enviar-a-tecnico', e);
      alert(e.message || 'Error al enviar al técnico');
    } finally {
      setGuardando(null);
    }
  };

  const handleAsignarTecnico = (sol, tecnicoId) => {
    // al cambiar el select, también disparo el envío
    if (!tecnicoId) return actualizarSolicitud(sol.id, { tecnico_id: null });
    enviarATecnico(sol.id, tecnicoId);
  };

  const fmtFecha = (iso) => {
    try { return new Date(iso).toLocaleString('es-CL'); } catch { return iso || ''; }
  };

  if (!user) return null;

  return (
    <div className="container py-4">
      <nav className="navbar navbar-expand-lg navbar-dark bg-dark mb-4">
        <div className="container">
          <Link className="navbar-brand" to="/">
            <i className="fas fa-shield-alt me-2"></i><strong>INFOSER</strong> & EP SPA
          </Link>
          <div className="navbar-nav ms-auto">
            <span className="nav-link text-light">
              <i className="fas fa-user-shield me-1"></i> Admin: {user?.nombre || user?.email}
            </span>
            <Link className="nav-link" to="/admin/menu">Menú</Link>
          </div>
        </div>
      </nav>

      <h3 className="mb-3"><i className="fas fa-list-check me-2"></i>Gestión de Solicitudes</h3>

      <div className="d-flex align-items-center gap-2 mb-3">
        <input className="form-control" placeholder="Buscar por título, cliente, comuna, estado..."
               value={filtro} onChange={(e) => setFiltro(e.target.value)} style={{ maxWidth: 420 }} />
        <button className="btn btn-outline-secondary" onClick={cargarTodo} disabled={cargando}>
          <i className="fas fa-sync-alt"></i>
        </button>
        <span className="text-muted">{solicitudesFiltradas.length} de {solicitudes.length}</span>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}
      {cargando ? (
        <div className="text-muted">Cargando...</div>
      ) : solicitudesFiltradas.length === 0 ? (
        <div className="alert alert-info">No hay solicitudes.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped align-middle">
            <thead>
              <tr>
                <th>#</th><th>Fecha</th><th>Título</th><th>Cliente</th>
                <th>Ubicación</th><th>Tipo</th><th>Prioridad</th>
                <th>Estado</th><th>Técnico</th><th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {solicitudesFiltradas.map((s) => (
                <tr key={s.id}>
                  <td>{s.id}</td>
                  <td><div className="small">{fmtFecha(s.fecha_solicitud)}</div></td>
                  <td>
                    <div className="fw-semibold">{s.titulo}</div>
                    <div className="text-muted small text-truncate" style={{ maxWidth: 320 }}>{s.descripcion}</div>
                  </td>
                  <td>
                    <div>{s.cliente_nombre || '-'}</div>
                    <div className="small text-muted">{s.cliente_email || ''}</div>
                  </td>
                  <td><div>{s.comuna}</div><div className="small text-muted">{s.region}</div></td>
                  <td>{s.tipo_servicio}</td>
                  <td>
                    <span className={
                      'badge ' + (s.prioridad === 'alta' ? 'bg-danger'
                               : s.prioridad === 'media' ? 'bg-warning text-dark' : 'bg-info')
                    }>{s.prioridad}</span>
                  </td>
                  <td style={{ minWidth: 160 }}>
                    <select className="form-select form-select-sm"
                            value={s.estado_actual || 'pendiente'}
                            onChange={(e) => handleCambioEstado(s, e.target.value)}
                            disabled={guardando === s.id}>
                      {ESTADOS.map((st) => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </td>
                  <td style={{ minWidth: 260 }}>
                    <div className="d-flex gap-2">
                      <select className="form-select form-select-sm"
                              value={s.tecnico_id || ''}
                              onChange={(e) => handleAsignarTecnico(s, e.target.value)}
                              disabled={guardando === s.id}>
                        <option value="">— Sin asignar —</option>
                        {tecnicos.map((t) => (
                          <option key={t.id} value={t.id}>{t.nombre} ({t.email})</option>
                        ))}
                      </select>
                      <button className="btn btn-sm btn-primary"
                              onClick={() => s.tecnico_id && enviarATecnico(s.id, s.tecnico_id)}
                              disabled={!s.tecnico_id || guardando === s.id}>
                        <i className="fas fa-paper-plane me-1"></i> Enviar
                      </button>
                    </div>
                    {s.tecnico_nombre && (
                      <div className="small text-muted mt-1">Asignado: {s.tecnico_nombre}</div>
                    )}
                  </td>
                  <td style={{ minWidth: 120 }}>
                    <button className="btn btn-sm btn-outline-secondary" disabled title="(Futuro) Ver detalle">
                      <i className="fas fa-eye"></i>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
