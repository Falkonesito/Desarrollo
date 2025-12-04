const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'infoser_ep_spa',
    password: process.env.DB_PASSWORD || 'Falcon',
    port: process.env.DB_PORT || 5432,
});

const COMUNAS = [
    'Santiago', 'Providencia', 'Las Condes', 'Maipú', 'La Florida',
    'Puente Alto', 'Ñuñoa', 'Vitacura', 'San Miguel', 'La Reina'
];

const TIPOS = ['instalacion', 'mantenimiento', 'reparacion', 'asesoria'];
const PRIORIDADES = ['baja', 'media', 'alta'];

async function seed() {
    try {
        console.log('🌱 Iniciando sembrado de datos...');
        console.log(`🔌 Conectando a DB: ${process.env.DB_HOST || 'localhost'} como ${process.env.DB_USER || 'postgres'}`);

        // 1. Crear o buscar cliente de prueba
        const email = 'cliente_test_ml@infoser.cl';
        let clienteId;

        const resCliente = await pool.query('SELECT id FROM clientes WHERE email = $1', [email]);

        if (resCliente.rows.length > 0) {
            clienteId = resCliente.rows[0].id;
            console.log(`✅ Cliente de prueba encontrado (ID: ${clienteId})`);
        } else {
            const hash = await bcrypt.hash('123456', 10);
            const insertCliente = await pool.query(
                `INSERT INTO clientes (nombre, email, password_hash, telefono, activo)
         VALUES ($1, $2, $3, $4, true)
         RETURNING id`,
                ['Cliente Test ML', email, hash, '+56900000000']
            );
            clienteId = insertCliente.rows[0].id;
            console.log(`✅ Cliente de prueba creado (ID: ${clienteId})`);
        }

        // 2. Generar 500 solicitudes
        console.log('🚀 Generando 500 solicitudes históricas...');

        const total = 500;
        const batchSize = 50; // Insertar en lotes para no saturar
        let count = 0;

        for (let i = 0; i < total; i++) {
            const diasAtras = Math.floor(Math.random() * 180); // Últimos 6 meses
            const fecha = new Date();
            fecha.setDate(fecha.getDate() - diasAtras);

            // Simular estacionalidad: más reparaciones en invierno (Jun-Ago)
            // Mes 0-11. Invierno aprox 5,6,7.
            const mes = fecha.getMonth();
            let tipo = TIPOS[Math.floor(Math.random() * TIPOS.length)];

            if ((mes >= 5 && mes <= 7) && Math.random() > 0.6) {
                tipo = 'reparacion';
            }

            const comuna = COMUNAS[Math.floor(Math.random() * COMUNAS.length)];
            const prioridad = PRIORIDADES[Math.floor(Math.random() * PRIORIDADES.length)];

            await pool.query(
                `INSERT INTO solicitudes 
            (cliente_id, titulo, descripcion, direccion_servicio, comuna, region, tipo_servicio, prioridad, fecha_solicitud, estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'completada')`,
                [
                    clienteId,
                    `Solicitud de prueba ${i + 1}`,
                    'Generada automáticamente para pruebas de ML',
                    'Calle Falsa 123',
                    comuna,
                    'Metropolitana',
                    tipo,
                    prioridad,
                    fecha
                ]
            );

            count++;
            if (count % batchSize === 0) {
                process.stdout.write(`.`);
            }
        }

        console.log(`\n✨ ¡Listo! Se insertaron ${count} solicitudes.`);

    } catch (err) {
        console.error('❌ Error:', err);
    } finally {
        await pool.end();
    }
}

// Exportar la función para usarla en server.js
module.exports = { seed };

// Si se ejecuta directamente desde la terminal: node seed_data.js
if (require.main === module) {
    seed();
}
