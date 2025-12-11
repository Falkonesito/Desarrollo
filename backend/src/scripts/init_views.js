const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
    // Fallback local
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'infoser_ep_spa',
    password: process.env.DB_PASSWORD || 'Falcon',
    port: process.env.DB_PORT || 5432,
});

async function createViews() {
    try {
        console.log('🔄 Reparando Vistas SQL del Dashboard...');

        // 1. vista_dashboard
        await pool.query(`DROP VIEW IF EXISTS vista_dashboard CASCADE;`);
        await pool.query(`
            CREATE VIEW vista_dashboard AS
            SELECT 
                (SELECT COUNT(*) FROM solicitudes) AS total_solicitudes,
                (SELECT COUNT(*) FROM solicitudes WHERE estado_actual = 'completada') AS completadas,
                (SELECT COUNT(*) FROM solicitudes WHERE estado_actual = 'pendiente') AS pendientes,
                (SELECT COUNT(*) FROM solicitudes WHERE estado_actual IN ('en_progreso','en_proceso','asignada')) AS en_progreso;
        `);
        console.log('✅ vista_dashboard creada.');

        // 2. vista_solicitudes_por_dia
        await pool.query(`DROP VIEW IF EXISTS vista_solicitudes_por_dia CASCADE;`);
        await pool.query(`
            CREATE VIEW vista_solicitudes_por_dia AS
            SELECT 
                fecha_solicitud::date AS fecha,
                COUNT(*) AS total_solicitudes,
                SUM(CASE WHEN estado_actual = 'completada' THEN 1 ELSE 0 END) AS completadas
            FROM solicitudes
            WHERE fecha_solicitud IS NOT NULL
            GROUP BY fecha_solicitud::date;
        `);
        console.log('✅ vista_solicitudes_por_dia creada.');

        // 3. vista_rendimiento_tecnicos
        await pool.query(`DROP VIEW IF EXISTS vista_rendimiento_tecnicos CASCADE;`);
        await pool.query(`
            CREATE VIEW vista_rendimiento_tecnicos AS
            SELECT 
                u.id AS tecnico_id,
                u.nombre AS tecnico_nombre,
                COUNT(s.id) AS total_solicitudes,
                SUM(CASE WHEN s.estado_actual = 'completada' THEN 1 ELSE 0 END) AS completadas
            FROM usuarios u
            JOIN solicitudes s ON s.tecnico_id = u.id
            WHERE u.rol = 'tecnico'
            GROUP BY u.id, u.nombre;
        `);
        console.log('✅ vista_rendimiento_tecnicos creada.');

        // 4. vista_solicitudes_recientes
        await pool.query(`DROP VIEW IF EXISTS vista_solicitudes_recientes CASCADE;`);
        await pool.query(`
            CREATE VIEW vista_solicitudes_recientes AS
            SELECT 
                s.id,
                s.titulo,
                c.nombre AS cliente_nombre,
                c.email AS cliente_email,
                s.estado_actual,
                s.prioridad,
                s.fecha_solicitud,
                s.direccion_servicio
            FROM solicitudes s
            LEFT JOIN clientes c ON s.cliente_id = c.id;
        `);
        console.log('✅ vista_solicitudes_recientes creada.');

        console.log('✨ Todo listo. Las vistas han sido reparadas.');
        return true;
    } catch (err) {
        console.error('❌ Error creando vistas:', err);
        throw err;
    }
    // No cerramos pool aquí porque si se importa en server.js, usaremos el pool del server o uno nuevo que se cierre controladamente
    // Pero este script crea su propio pool. Lo ideal es separar la lógica. 
    // Para simplificar: cerraremos el pool local si se ejecuta como script.
    finally {
        if (require.main === module) {
            await pool.end();
        }
    }
}

if (require.main === module) {
    createViews();
}

module.exports = { createViews };
