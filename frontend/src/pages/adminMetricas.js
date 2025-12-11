// frontend/src/pages/adminMetricas.js
import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/adminMetricas.css';
import { api } from '../utils/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler,
} from 'chart.js';
import { Line, Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

const AdminMetricas = () => {
    const navigate = useNavigate();

    // Estados
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filtroTiempo, setFiltroTiempo] = useState('30-dias');

    // Datos
    const [kpis, setKpis] = useState({ totalSolicitudes: 0, completadas: 0, pendientes: 0, enProgreso: 0 });
    const [porDia, setPorDia] = useState([]);
    const [rendimiento, setRendimiento] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [recientes, setRecientes] = useState([]);

    // Carga de datos
    useEffect(() => {
        (async () => {
            try {
                setLoading(true);
                const data = await api.get('/metricas/dashboard', {
                    auth: true,
                    query: { rango: filtroTiempo },
                });
                const d = data.dashboard || {};
                setKpis({
                    totalSolicitudes: d.total_solicitudes || 0,
                    completadas: d.completadas || 0,
                    pendientes: d.pendientes || 0,
                    enProgreso: d.en_progreso || 0,
                });
                setPorDia(d.solicitudes_por_dia || []);
                setRendimiento(d.rendimiento_tecnicos || []);
                setEquipos(d.equipos_mas_solicitados || []);
                setRecientes(d.solicitudes_recientes || []);
            } catch (err) {
                console.error(err);
                setError('Error cargando métricas');
            } finally {
                setLoading(false);
            }
        })();
    }, [filtroTiempo]);

    // Procesamiento Gráficos
    const lineData = useMemo(() => ({
        labels: porDia.map(d => d.fecha),
        datasets: [{
            label: 'Solicitudes',
            data: porDia.map(d => d.total_solicitudes),
            borderColor: '#3182ce',
            backgroundColor: 'rgba(49, 130, 206, 0.1)',
            fill: true,
            tension: 0.3
        }]
    }), [porDia]);

    const barData = useMemo(() => ({
        labels: rendimiento.map(t => t.tecnico_nombre),
        datasets: [{
            label: 'Completadas',
            data: rendimiento.map(t => t.completadas),
            backgroundColor: '#38a169',
            borderRadius: 4
        }]
    }), [rendimiento]);

    const pieData = useMemo(() => ({
        labels: equipos.map(e => e.equipo),
        datasets: [{
            data: equipos.map(e => e.cantidad),
            backgroundColor: ['#3182ce', '#38a169', '#dd6b20', '#e53e3e', '#805ad5', '#d69e2e'],
        }]
    }), [equipos]);

    // Opciones limpias
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { position: 'bottom' } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, grid: { color: '#f7fafc' } } }
    };
    const pieOptions = { ...commonOptions, scales: {} }; // Pie no usa escalas XY

    return (
        <div className="admin-metricas-container">
            {/* Header idéntico */}
            <header className="admin-metricas-header">
                <div className="header-content">
                    <div className="header-left">
                        <button className="btn-volver" onClick={() => navigate('/admin/menu')}>
                            <i className="fas fa-arrow-left"></i> Volver
                        </button>
                        <h1><i className="fas fa-chart-line"></i> Métricas</h1>
                    </div>
                    <div className="admin-info">
                        <span className="admin-badge">Administrador</span>
                    </div>
                </div>
            </header>

            <div className="admin-metricas-layout">
                {/* Sidebar idéntico */}
                <nav className="admin-metricas-sidebar">
                    <button className="sidebar-btn" onClick={() => navigate('/admin/menu')}><i className="fas fa-home"></i> Menú</button>
                    <button className="sidebar-btn" onClick={() => navigate('/admin/solicitudes')}><i className="fas fa-tools"></i> Solicitudes</button>
                    <button className="sidebar-btn" onClick={() => navigate('/admin/clientes')}><i className="fas fa-users"></i> Clientes</button>
                    <button className="sidebar-btn" onClick={() => navigate('/admin/tecnicos')}><i className="fas fa-user-cog"></i> Técnicos</button>
                    <button className="sidebar-btn active"><i className="fas fa-chart-line"></i> Métricas</button>
                    <button className="sidebar-btn" onClick={() => navigate('/admin/modelo-predictivo')}><i className="fas fa-brain"></i> IA Predictiva</button>
                </nav>

                <main className="admin-metricas-content">
                    {/* Header contenido */}
                    <div className="content-header">
                        <h2>Resumen General</h2>
                        <div className="time-filter">
                            <select value={filtroTiempo} onChange={e => setFiltroTiempo(e.target.value)} className="clean-select">
                                <option value="7-dias">Últimos 7 días</option>
                                <option value="30-dias">Últimos 30 días</option>
                                <option value="90-dias">Últimos 3 meses</option>
                            </select>
                        </div>
                    </div>

                    {/* KPIs Grid: Estricto 4 columnas */}
                    <div className="kpis-grid-strict">
                        <div className="kpi-card-minimal">
                            <div className="kpi-value">{kpis.totalSolicitudes}</div>
                            <div className="kpi-label">Totales</div>
                        </div>
                        <div className="kpi-card-minimal success">
                            <div className="kpi-value">{kpis.completadas}</div>
                            <div className="kpi-label">Completadas</div>
                        </div>
                        <div className="kpi-card-minimal warning">
                            <div className="kpi-value">{kpis.enProgreso}</div>
                            <div className="kpi-label">En Progreso</div>
                        </div>
                        <div className="kpi-card-minimal danger">
                            <div className="kpi-value">{kpis.pendientes}</div>
                            <div className="kpi-label">Pendientes</div>
                        </div>
                    </div>

                    {/* Charts Layout: 1 Arriba (Full), 2 Abajo (Mitad) */}
                    <div className="charts-structure">
                        <div className="chart-box full-width">
                            <h3>Evolución Temporal</h3>
                            <div className="chart-canvas">
                                <Line data={lineData} options={commonOptions} />
                            </div>
                        </div>

                        <div className="lower-charts-row">
                            <div className="chart-box half-width">
                                <h3>Rendimiento Técnico</h3>
                                <div className="chart-canvas">
                                    <Bar data={barData} options={commonOptions} />
                                </div>
                            </div>
                            <div className="chart-box half-width">
                                <h3>Equipos Demandados</h3>
                                <div className="chart-canvas">
                                    <Pie data={pieData} options={pieOptions} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabla Reciente */}
                    <div className="recent-table-minimal">
                        <h3>Actividad Reciente</h3>
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Título</th>
                                    <th>Estado</th>
                                    <th>Fecha</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recientes.map(r => (
                                    <tr key={r.id}>
                                        <td>#{r.id}</td>
                                        <td>{r.titulo}</td>
                                        <td>
                                            <span className={`badge-dot ${r.estado_actual}`}></span>
                                            {r.estado_actual.replace('_', ' ')}
                                        </td>
                                        <td>{new Date(r.fecha_solicitud).toLocaleDateString()}</td>
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

export default AdminMetricas;