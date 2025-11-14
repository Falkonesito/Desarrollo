// backend/src/server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

// ✅ usa los módulos centralizados que ya creaste
const { emitirToken } = require('./utils/jwt');
const { verifyJWT, requireRole } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// Middlewares
app.use(cors());
app.use(express.json());

// PostgreSQL
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'infoser_ep_spa',
  password: process.env.DB_PASSWORD || 'Falcon', // ← tu clave
  port: process.env.DB_PORT || 5432,
});
pool.on('connect', () => console.log('Conectado a PostgreSQL'));
pool.on('error', (err) => console.error('Error de conexión PostgreSQL:', err));

// Utils
const normEmail = (e) => (typeof e === 'string' ? e.trim().toLowerCase() : '');

// -------------------------------------------------------------------
// HEALTH
// -------------------------------------------------------------------
app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      success: true,
      message: 'Backend INFOSER funcionando',
      timestamp: new Date().toISOString(),
      database: 'PostgreSQL conectado',
    });
  } catch {
    res.status(500).json({ success: false, message: 'DB no disponible' });
  }
});

// -------------------------------------------------------------------
// AUTENTICACIÓN
// -------------------------------------------------------------------

// LOGIN (usuarios: administrador/técnico y clientes)
app.post('/api/auth/login', async (req, res) => {
  const email = normEmail(req.body?.email);
  const password = req.body?.password;

  if (!email || typeof password !== 'string' || password.length === 0) {
    return res
      .status(400)
      .json({ success: false, message: 'Email y contraseña son obligatorios' });
  }

  try {
    // 1) Usuarios internos (administrador / técnico)
    const u = await pool.query(
      `SELECT id, email, password_hash, nombre, rol, telefono, especialidad, activo
       FROM usuarios
       WHERE email = $1 AND activo = true`,
      [email]
    );

    if (u.rows.length) {
      const usuario = u.rows[0];
      const ok = await bcrypt.compare(password, usuario.password_hash);
      if (!ok) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

      return res.json({
        success: true,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,                 // 'administrador' | 'tecnico'
          telefono: usuario.telefono,
          especialidad: usuario.especialidad,
        },
        token: emitirToken({
          id: usuario.id,
          email: usuario.email,
          rol: usuario.rol,
          tipo: 'usuario',
          nombre: usuario.nombre,
        }),
        message: `Login ${usuario.rol} exitoso`,
      });
    }

    // 2) Clientes
    const c = await pool.query(
      `SELECT id, email, password_hash, nombre, telefono, activo
       FROM clientes
       WHERE email = $1 AND activo = true`,
      [email]
    );

    if (c.rows.length) {
      const cliente = c.rows[0];
      const ok = await bcrypt.compare(password, cliente.password_hash);
      if (!ok) return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });

      return res.json({
        success: true,
        user: {
          id: cliente.id,
          email: cliente.email,
          nombre: cliente.nombre,
          rol: 'cliente',
          telefono: cliente.telefono,
        },
        token: emitirToken({
          id: cliente.id,
          email: cliente.email,
          rol: 'cliente',
          tipo: 'cliente',
          nombre: cliente.nombre,
        }),
        message: 'Login cliente exitoso',
      });
    }

    return res.status(401).json({ success: false, message: 'Credenciales incorrectas' });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// PERFIL del usuario autenticado
app.get('/api/auth/me', verifyJWT, async (req, res) => {
  try {
    const { id, tipo } = req.user;

    if (tipo === 'usuario') {
      const r = await pool.query(
        'SELECT id, email, nombre, rol, telefono, especialidad, activo FROM usuarios WHERE id = $1',
        [id]
      );
      if (!r.rows.length) return res.status(404).json({ success: false, message: 'No encontrado' });
      return res.json({ success: true, user: { ...r.rows[0] } });
    }

    // tipo === 'cliente'
    const r = await pool.query(
      'SELECT id, email, nombre, telefono, activo, fecha_registro FROM clientes WHERE id = $1',
      [id]
    );
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'No encontrado' });
    return res.json({ success: true, user: { ...r.rows[0], rol: 'cliente' } });
  } catch (e) {
    console.error('Error /me:', e);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// REGISTRO CLIENTE
app.post('/api/auth/register', async (req, res) => {
  const nombre = (req.body?.nombre || '').trim();
  const email = normEmail(req.body?.email);
  const password = req.body?.password;
  const telefono = (req.body?.telefono || '').trim();

  if (!nombre || !email || !password || !telefono) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }

  try {
    const existsCliente = await pool.query('SELECT 1 FROM clientes WHERE email = $1', [email]);
    if (existsCliente.rows.length) {
      return res.status(400).json({ success: false, message: 'Este email ya está registrado como cliente' });
    }

    const existsUsuario = await pool.query('SELECT 1 FROM usuarios WHERE email = $1', [email]);
    if (existsUsuario.rows.length) {
      return res.status(400).json({ success: false, message: 'Este email pertenece a un usuario interno del sistema' });
    }

    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    const result = await pool.query(
      `INSERT INTO clientes (email, password_hash, nombre, telefono, activo)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, nombre, telefono, fecha_registro`,
      [email, hash, nombre, telefono]
    );

    const cli = result.rows[0];

    res.json({
      success: true,
      message: 'Registro exitoso',
      user: {
        id: cli.id,
        nombre: cli.nombre,
        email: cli.email,
        telefono: cli.telefono,
        rol: 'cliente',
        fechaRegistro: cli.fecha_registro,
      },
      token: emitirToken({
        id: cli.id,
        email: cli.email,
        rol: 'cliente',
        tipo: 'cliente',
        nombre: cli.nombre,
      }),
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// -------------------------------------------------------------------
// SOLICITUDES (protegidas)
// -------------------------------------------------------------------

// Crear solicitud (autenticado). Si es cliente, se fuerza su propio id.
app.post('/api/solicitudes', verifyJWT, async (req, res) => {
  const {
    titulo,
    descripcion,
    direccion_servicio,
    comuna,
    region,
    tipo_servicio,
    prioridad,
    equipos_solicitados,
    comentarios_finales,
    cliente_id: clienteIdBody,
  } = req.body;

  if (!titulo || !descripcion || !direccion_servicio || !comuna || !region || !tipo_servicio) {
    return res.status(400).json({ success: false, message: 'Faltan campos obligatorios' });
  }

  // si es cliente, no permitimos suplantar
  const cliente_id = req.user.rol === 'cliente' ? req.user.id : (clienteIdBody || null);

  try {
    const result = await pool.query(
      `INSERT INTO solicitudes
       (cliente_id, direccion_servicio, comuna, region, titulo, descripcion,
        tipo_servicio, prioridad, equipos_solicitados, comentarios_finales)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [
        cliente_id,
        direccion_servicio,
        comuna,
        region,
        titulo,
        descripcion,
        tipo_servicio,
        prioridad,
        equipos_solicitados,
        comentarios_finales,
      ]
    );
    res.json({ success: true, message: 'Solicitud creada exitosamente', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Listar solicitudes del cliente autenticado
app.get('/api/solicitudes/cliente/:clienteId', verifyJWT, async (req, res) => {
  const { clienteId } = req.params;

  // Un cliente solo puede ver las suyas
  if (req.user.rol === 'cliente' && String(req.user.id) !== String(clienteId)) {
    return res.status(403).json({ success: false, message: 'Sin permisos' });
  }

  try {
    const result = await pool.query(
      'SELECT * FROM solicitudes WHERE cliente_id = $1 ORDER BY fecha_solicitud DESC',
      [clienteId]
    );
    res.json({ success: true, solicitudes: result.rows });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Todas las solicitudes (solo administrador)
app.get('/api/solicitudes', verifyJWT, requireRole('administrador'), async (_req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, c.nombre AS cliente_nombre, c.email AS cliente_email,
              u.nombre AS tecnico_nombre
       FROM solicitudes s
       LEFT JOIN clientes c ON s.cliente_id = c.id
       LEFT JOIN usuarios u ON s.tecnico_id = u.id
       ORDER BY s.fecha_solicitud DESC`
    );
    res.json({ success: true, solicitudes: result.rows });
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Listar técnicos (solo administrador)
app.get('/api/tecnicos', verifyJWT, requireRole('administrador'), async (_req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, especialidad FROM usuarios WHERE rol = $1 AND activo = true',
      ['tecnico']
    );
    res.json({ success: true, tecnicos: result.rows });
  } catch (error) {
    console.error('Error obteniendo técnicos:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Actualizar estado/tecnico (admin o técnico)
app.put('/api/solicitudes/:id', verifyJWT, requireRole('administrador', 'tecnico'), async (req, res) => {
  const { id } = req.params;
  const { estado_actual, tecnico_id } = req.body;

  try {
    const result = await pool.query(
      `UPDATE solicitudes
       SET estado_actual = $1, tecnico_id = $2, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [estado_actual, tecnico_id, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });
    }
    res.json({ success: true, message: 'Solicitud actualizada exitosamente', solicitud: result.rows[0] });
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// -------------------------------------------------------------------
// 404 + ERROR
// -------------------------------------------------------------------
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

app.use((err, _req, res, _next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({ success: false, message: 'Error interno del servidor' });
});

// -------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor INFOSER ejecutándose en: http://localhost:${PORT}`);
});
