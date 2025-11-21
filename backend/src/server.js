// backend/src/server.js

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
require('dotenv').config();

const { emitirToken } = require('./utils/jwt');
const { verifyJWT, requireRole } = require('./middleware/auth');
const {
  validarLogin,
  validarRegisterCliente,
  validarCrearSolicitud,
  validarActualizarSolicitud,
  validarCrearUsuario,
} = require('./middleware/validacion');

// ➕ IMPORTA EL SERVICE DE ML (proxy a FastAPI)
const { forecastML } = require('./services/ml');

const app = express();
const PORT = process.env.PORT || 5000;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);

// -------------------------------------------------------------------
// CORS + JSON
// -------------------------------------------------------------------
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'https://infoser-frontend.onrender.com',
    ],
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);
// ❗ OJO: NO hay ninguna ruta tipo app.options('*', ...) ni app.all('*', ...)
app.use(express.json());

// -------------------------------------------------------------------
// PostgreSQL
// -------------------------------------------------------------------
const { Pool } = require('pg');
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'infoser_ep_spa',
  password: process.env.DB_PASSWORD || 'Falcon',
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
app.post('/api/auth/login', validarLogin, async (req, res) => {
  const email = req.body.email; // normalizado por validarLogin
  const password = req.body.password;

  try {
    // 1) Usuarios internos
    const u = await pool.query(
      `SELECT id, email, password_hash, nombre, rol, telefono, especialidad, activo
       FROM usuarios
       WHERE email = $1 AND activo = true`,
      [email]
    );

    if (u.rows.length) {
      const usuario = u.rows[0];
      const ok = await bcrypt.compare(password, usuario.password_hash);
      if (!ok)
        return res
          .status(401)
          .json({ success: false, message: 'Credenciales incorrectas' });

      return res.json({
        success: true,
        user: {
          id: usuario.id,
          email: usuario.email,
          nombre: usuario.nombre,
          rol: usuario.rol,
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
      if (!ok)
        return res
          .status(401)
          .json({ success: false, message: 'Credenciales incorrectas' });

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

    return res
      .status(401)
      .json({ success: false, message: 'Credenciales incorrectas' });
  } catch (error) {
    console.error('Error en login:', error);
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
});

app.get('/api/auth/me', verifyJWT, async (req, res) => {
  try {
    const { id, tipo } = req.user;

    if (tipo === 'usuario') {
      const r = await pool.query(
        'SELECT id, email, nombre, rol, telefono, especialidad, activo FROM usuarios WHERE id = $1',
        [id]
      );
      if (!r.rows.length)
        return res
          .status(404)
          .json({ success: false, message: 'No encontrado' });
      return res.json({ success: true, user: { ...r.rows[0] } });
    }

    const r = await pool.query(
      'SELECT id, email, nombre, telefono, activo, fecha_registro FROM clientes WHERE id = $1',
      [id]
    );
    if (!r.rows.length)
      return res
        .status(404)
        .json({ success: false, message: 'No encontrado' });
    return res.json({ success: true, user: { ...r.rows[0], rol: 'cliente' } });
  } catch (e) {
    console.error('Error /me:', e);
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/auth/register', validarRegisterCliente, async (req, res) => {
  const { nombre, email, password, telefono } = req.body; // normalizados

  try {
    const existsCliente = await pool.query(
      'SELECT 1 FROM clientes WHERE email = $1',
      [email]
    );
    if (existsCliente.rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado como cliente',
      });
    }

    const existsUsuario = await pool.query(
      'SELECT 1 FROM usuarios WHERE email = $1',
      [email]
    );
    if (existsUsuario.rows.length) {
      return res.status(400).json({
        success: false,
        message: 'Este email pertenece a un usuario interno del sistema',
      });
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
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
});

// -------------------------------------------------------------------
// SOLICITUDES
// -------------------------------------------------------------------

// Helper: nombre real de la columna de estado
async function getEstadoColName(poolConn) {
  const q = `
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'solicitudes'
      AND column_name IN ('estado_actual','estado')
    ORDER BY CASE column_name WHEN 'estado_actual' THEN 0 ELSE 1 END
    LIMIT 1;
  `;
  const r = await poolConn.query(q);
  return r.rows.length ? r.rows[0].column_name : 'estado_actual';
}

// Helpers de historial
async function getSolicitudById(id) {
  const { rows } = await pool.query(
    `SELECT * FROM solicitudes WHERE id = $1`,
    [id]
  );
  return rows[0] || null;
}
async function addHistorial({ solicitud_id, estado, comentario, usuario_id }) {
  await pool.query(
    `INSERT INTO historial_estados (solicitud_id, estado, comentario, usuario_id)
     VALUES ($1,$2,$3,$4)`,
    [solicitud_id, estado, comentario || null, usuario_id || null]
  );
}

// Crear solicitud
app.post(
  '/api/solicitudes',
  verifyJWT,
  validarCrearSolicitud,
  async (req, res) => {
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

    const cliente_id =
      req.user.rol === 'cliente' ? req.user.id : clienteIdBody || null;

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
          equipos_solicitados || null,
          comentarios_finales || null,
        ]
      );
      res.json({
        success: true,
        message: 'Solicitud creada exitosamente',
        solicitud: result.rows[0],
      });
    } catch (error) {
      console.error('Error creando solicitud:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// Solicitudes por cliente
app.get('/api/solicitudes/cliente/:clienteId', verifyJWT, async (req, res) => {
  const { clienteId } = req.params;

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
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
});

// Listado admin — mapea en_progreso → en_proceso para UI
app.get(
  '/api/solicitudes',
  verifyJWT,
  requireRole('administrador'),
  async (_req, res) => {
    try {
      const ESTADO_COL = await getEstadoColName(pool);
      const sql = `
        SELECT
          s.*,
          CASE
            WHEN s.${ESTADO_COL} = 'en_progreso' THEN 'en_proceso'
            ELSE s.${ESTADO_COL}
          END AS estado_actual,
          c.nombre AS cliente_nombre,
          c.email  AS cliente_email,
          u.nombre AS tecnico_nombre
        FROM solicitudes s
        LEFT JOIN clientes c ON s.cliente_id = c.id
        LEFT JOIN usuarios u ON s.tecnico_id = u.id
        ORDER BY s.fecha_solicitud DESC
      `;
      const result = await pool.query(sql);
      res.json({ success: true, solicitudes: result.rows });
    } catch (error) {
      console.error('Error obteniendo solicitudes:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// Solicitudes asignadas al técnico autenticado
app.get(
  '/api/solicitudes/asignadas',
  verifyJWT,
  requireRole('tecnico'),
  async (req, res) => {
    try {
      const tecnicoId = req.user.id;
      const ESTADO_COL = await getEstadoColName(pool);
      const { rows } = await pool.query(
        `SELECT s.*,
                CASE WHEN s.${ESTADO_COL}='en_progreso' THEN 'en_proceso' ELSE s.${ESTADO_COL} END AS estado_actual,
                c.nombre AS cliente_nombre, c.email AS cliente_email
         FROM solicitudes s
         LEFT JOIN clientes c ON c.id = s.cliente_id
         WHERE s.tecnico_id = $1
         ORDER BY s.fecha_solicitud DESC`,
        [tecnicoId]
      );
      res.json({ success: true, solicitudes: rows });
    } catch (e) {
      console.error('GET /api/solicitudes/asignadas', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// Alias de compatibilidad: /api/solicitudes/mias
app.get(
  '/api/solicitudes/mias',
  verifyJWT,
  requireRole('tecnico'),
  async (req, res) => {
    try {
      const tecnicoId = req.user.id;
      const ESTADO_COL = await getEstadoColName(pool);
      const { rows } = await pool.query(
        `SELECT s.*,
                CASE WHEN s.${ESTADO_COL}='en_progreso' THEN 'en_proceso' ELSE s.${ESTADO_COL} END AS estado_actual,
                c.nombre AS cliente_nombre, c.email AS cliente_email
         FROM solicitudes s
         LEFT JOIN clientes c ON c.id = s.cliente_id
         WHERE s.tecnico_id = $1
         ORDER BY s.fecha_solicitud DESC`,
        [tecnicoId]
      );
      res.json({ success: true, solicitudes: rows });
    } catch (e) {
      console.error('GET /api/solicitudes/mias', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// ---- Asignar / reasignar técnico (admin) ----
async function enviarATecnicoHandler(req, res) {
  try {
    const id = parseInt(req.params.id, 10);
    const tecnicoId = parseInt(req.body?.tecnico_id, 10);
    if (!Number.isInteger(id) || !Number.isInteger(tecnicoId) || tecnicoId <= 0) {
      return res.status(400).json({ success: false, message: 'Datos inválidos' });
    }

    const ESTADO_COL = await getEstadoColName(pool);
    await pool.query(
      `UPDATE solicitudes
       SET tecnico_id = $1,
           ${ESTADO_COL} = CASE WHEN ${ESTADO_COL} IN ('pendiente','en_revision') THEN 'asignada' ELSE ${ESTADO_COL} END,
           fecha_asignacion = CURRENT_TIMESTAMP,
           fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [tecnicoId, id]
    );

    await addHistorial({
      solicitud_id: id,
      estado: 'asignada',
      comentario: 'Asignada por administrador',
      usuario_id: req.user.id,
    });

    const { rows } = await pool.query(
      `SELECT s.*,
              CASE WHEN s.${ESTADO_COL}='en_progreso' THEN 'en_proceso' ELSE s.${ESTADO_COL} END AS estado_actual
       FROM solicitudes s WHERE s.id = $1`,
      [id]
    );
    res.json({
      success: true,
      message: 'Solicitud enviada al técnico',
      solicitud: rows[0],
    });
  } catch (e) {
    console.error('ENVIAR A TÉCNICO', e);
    res
      .status(500)
      .json({ success: false, message: 'Error interno del servidor' });
  }
}
app.patch(
  '/api/solicitudes/:id/enviar-a-tecnico',
  verifyJWT,
  requireRole('administrador'),
  enviarATecnicoHandler
);
app.put(
  '/api/solicitudes/:id/enviar-a-tecnico',
  verifyJWT,
  requireRole('administrador'),
  enviarATecnicoHandler
);

// ---- PUT estado/técnico con historial + reglas (ciclo de vida) ----
app.put(
  '/api/solicitudes/:id',
  verifyJWT,
  requireRole('administrador', 'tecnico'),
  validarActualizarSolicitud,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ success: false, message: 'ID inválido' });
      }

      const usuarioId = req.user?.id || null;
      const rolUsuario = req.user?.rol;

      const ESTADO_COL = await getEstadoColName(pool);
      const ALIAS = { en_proceso: 'en_progreso' };

      let nuevoEstado = req.body.estado_actual ?? req.body.estado;
      let comentario = (req.body.comentario || '').toString().trim();
      let tecnicoId = undefined;

      if (Object.prototype.hasOwnProperty.call(req.body, 'tecnico_id')) {
        const raw = req.body.tecnico_id;
        if (raw === null || raw === '' || raw === undefined) tecnicoId = null;
        else {
          const parsed = parseInt(raw, 10);
          if (!Number.isInteger(parsed) || parsed <= 0) {
            return res
              .status(400)
              .json({ success: false, message: 'tecnico_id inválido' });
          }
          tecnicoId = parsed;
        }
      }

      if (typeof nuevoEstado === 'string') {
        nuevoEstado = nuevoEstado.toLowerCase().replace(/\s+|-+/g, '_').trim();
        nuevoEstado = ALIAS[nuevoEstado] || nuevoEstado;
      } else {
        nuevoEstado = undefined;
      }

      const actual = await getSolicitudById(id);
      if (!actual)
        return res
          .status(404)
          .json({ success: false, message: 'Solicitud no encontrada' });

      const estadoActualBD = actual[ESTADO_COL];
      const tecnicoActual = actual.tecnico_id;

      const quiereCambiarEstado =
        nuevoEstado !== undefined && nuevoEstado !== estadoActualBD;
      const quiereCambiarTecnico =
        tecnicoId !== undefined && tecnicoId !== tecnicoActual;

      const esReapertura =
        estadoActualBD === 'completada' &&
        nuevoEstado &&
        nuevoEstado !== 'completada';
      if (esReapertura && rolUsuario !== 'administrador') {
        return res.status(403).json({
          success: false,
          message: 'Solo administradores pueden reabrir una solicitud completada',
        });
      }
      if (
        rolUsuario === 'tecnico' &&
        estadoActualBD === 'completada' &&
        quiereCambiarEstado
      ) {
        return res.status(403).json({
          success: false,
          message: 'No puedes modificar una solicitud completada',
        });
      }
      if (quiereCambiarEstado && nuevoEstado === 'cancelada' && !comentario) {
        comentario = 'Cancelada con técnico asignado';
      }

      const sets = [];
      const vals = [];
      let i = 1;

      if (nuevoEstado !== undefined) {
        sets.push(`${ESTADO_COL} = $${i++}`);
        vals.push(nuevoEstado);
        if (nuevoEstado === 'completada') {
          sets.push(`fecha_cierre = CURRENT_TIMESTAMP`);
        } else if (estadoActualBD === 'completada') {
          sets.push(`fecha_cierre = NULL`);
        }
      }

      if (tecnicoId !== undefined) {
        sets.push(`tecnico_id = $${i++}`);
        vals.push(tecnicoId);
        if (!tecnicoActual && tecnicoId) {
          sets.push(`fecha_asignacion = CURRENT_TIMESTAMP`);
        }
      }

      if (sets.length === 0) {
        const keep = await pool.query(
          `SELECT s.*,
                  CASE WHEN s.${ESTADO_COL}='en_progreso' THEN 'en_proceso' ELSE s.${ESTADO_COL} END AS estado_actual,
                  c.nombre AS cliente_nombre, c.email AS cliente_email,
                  u.nombre AS tecnico_nombre
           FROM solicitudes s
           LEFT JOIN clientes c ON s.cliente_id = c.id
           LEFT JOIN usuarios u ON s.tecnico_id = u.id
           WHERE s.id = $1`,
          [id]
        );
        return res.json({
          success: true,
          message: 'Sin cambios',
          solicitud: keep.rows[0],
        });
      }

      sets.push(`fecha_actualizacion = CURRENT_TIMESTAMP`);
      const sqlUpd = `UPDATE solicitudes SET ${sets.join(
        ', '
      )} WHERE id = $${i} RETURNING id`;
      vals.push(id);

      await pool.query(sqlUpd, vals);

      if (quiereCambiarEstado) {
        await addHistorial({
          solicitud_id: id,
          estado: nuevoEstado,
          comentario,
          usuario_id: usuarioId,
        });
      }

      const joined = await pool.query(
        `SELECT s.*,
                CASE WHEN s.${ESTADO_COL}='en_progreso' THEN 'en_proceso' ELSE s.${ESTADO_COL} END AS estado_actual,
                c.nombre AS cliente_nombre, c.email AS cliente_email,
                u.nombre AS tecnico_nombre
         FROM solicitudes s
         LEFT JOIN clientes c ON s.cliente_id = c.id
         LEFT JOIN usuarios u ON s.tecnico_id = u.id
         WHERE s.id = $1`,
        [id]
      );

      res.json({
        success: true,
        message: 'Solicitud actualizada',
        solicitud: joined.rows[0],
      });
    } catch (error) {
      console.error('PUT /api/solicitudes/:id Error:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// Reabrir completada (solo admin)
app.post(
  '/api/solicitudes/:id/reabrir',
  verifyJWT,
  requireRole('administrador'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const destino = (req.body?.estado_destino || 'en_proceso')
        .toString()
        .trim()
        .toLowerCase();
      const comentario = (
        req.body?.comentario || 'Reapertura por administrador'
      )
        .toString()
        .trim();
      const usuarioId = req.user?.id || null;

      const ESTADO_COL = await getEstadoColName(pool);
      const estadoBD = destino === 'en_proceso' ? 'en_progreso' : destino;

      if (!['pendiente', 'en_proceso', 'en_progreso'].includes(destino)) {
        return res
          .status(400)
          .json({ success: false, message: 'estado_destino inválido' });
      }

      const actual = await getSolicitudById(id);
      if (!actual)
        return res
          .status(404)
          .json({ success: false, message: 'Solicitud no encontrada' });
      if (actual[ESTADO_COL] !== 'completada') {
        return res.status(409).json({
          success: false,
          message: 'La solicitud no está completada',
        });
      }

      await pool.query(
        `UPDATE solicitudes
         SET ${ESTADO_COL} = $1, fecha_cierre = NULL, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [estadoBD, id]
      );

      await addHistorial({
        solicitud_id: id,
        estado: estadoBD,
        comentario,
        usuario_id: usuarioId,
      });

      const { rows } = await pool.query(
        `SELECT s.*,
                CASE WHEN s.${ESTADO_COL}='en_progreso' THEN 'en_proceso' ELSE s.${ESTADO_COL} END AS estado_actual
         FROM solicitudes s WHERE s.id=$1`,
        [id]
      );

      res.json({
        success: true,
        message: 'Solicitud reabierta',
        solicitud: rows[0],
      });
    } catch (e) {
      console.error('POST /api/solicitudes/:id/reabrir', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// Historial por solicitud
app.get(
  '/api/solicitudes/:id/historial',
  verifyJWT,
  requireRole('administrador', 'tecnico'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      const { rows } = await pool.query(
        `SELECT h.id, h.estado, h.comentario, h.usuario_id, h.fecha_cambio,
                u.nombre AS usuario_nombre
         FROM historial_estados h
         LEFT JOIN usuarios u ON u.id = h.usuario_id
         WHERE h.solicitud_id = $1
         ORDER BY h.fecha_cambio DESC`,
        [id]
      );
      res.json({ success: true, historial: rows });
    } catch (e) {
      console.error('GET /api/solicitudes/:id/historial', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// -------------------------------------------------------------------
// CLIENTES (ADMIN)
// -------------------------------------------------------------------
app.get(
  '/api/clientes',
  verifyJWT,
  requireRole('administrador'),
  async (_req, res) => {
    try {
      const { rows } = await pool.query(
        `SELECT 
           id,
           nombre,
           email,
           telefono,
           fecha_registro
         FROM clientes
         ORDER BY fecha_registro DESC`
      );

      res.json({
        success: true,
        clientes: rows,
      });
    } catch (error) {
      console.error('Error obteniendo clientes:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo clientes',
      });
    }
  }
);

// -------------------------------------------------------------------
// TÉCNICOS (ADMIN)
// -------------------------------------------------------------------
app.get(
  '/api/tecnicos',
  verifyJWT,
  requireRole('administrador'),
  async (_req, res) => {
    try {
      const result = await pool.query(
        'SELECT id, nombre, email, telefono, especialidad FROM usuarios WHERE rol = $1 AND activo = true',
        ['tecnico']
      );
      res.json({ success: true, tecnicos: result.rows });
    } catch (error) {
      console.error('Error obteniendo técnicos:', error);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// -------------------------------------------------------------------
// USUARIOS INTERNOS (ADMIN)
// -------------------------------------------------------------------
app.get(
  '/api/usuarios',
  verifyJWT,
  requireRole('administrador'),
  async (_req, res) => {
    try {
      const r = await pool.query(
        `SELECT id, email, nombre, rol, telefono, especialidad, activo, fecha_creacion, fecha_actualizacion
         FROM usuarios
         ORDER BY fecha_creacion DESC`
      );
      res.json({ success: true, usuarios: r.rows });
    } catch (e) {
      console.error('Error listando usuarios:', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

app.post(
  '/api/usuarios',
  verifyJWT,
  requireRole('administrador'),
  validarCrearUsuario,
  async (req, res) => {
    try {
      const { email, nombre, password, telefono, especialidad, rol } = req.body;

      const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      const hash = await bcrypt.hash(password, rounds);

      const sql = `
      INSERT INTO usuarios (email, password_hash, nombre, rol, telefono, especialidad, activo)
      VALUES ($1,$2,$3,$4,$5,$6,true)
      ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash,
            nombre = EXCLUDED.nombre,
            rol = EXCLUDED.rol,
            telefono = EXCLUDED.telefono,
            especialidad = EXCLUDED.especialidad,
            activo = true,
            fecha_actualizacion = CURRENT_TIMESTAMP
      RETURNING id, email, nombre, rol, telefono, especialidad, activo, fecha_creacion, fecha_actualizacion;
    `;

      const { rows } = await pool.query(sql, [
        normEmail(email),
        hash,
        (nombre || '').trim(),
        rol,
        (telefono || '').trim(),
        (especialidad || '').trim(),
      ]);

      res.json({
        success: true,
        user: rows[0],
        message: 'Usuario creado/actualizado',
      });
    } catch (e) {
      console.error('Error creando usuario:', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

app.patch(
  '/api/usuarios/:id/estado',
  verifyJWT,
  requireRole('administrador'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { activo } = req.body;

      if (typeof activo !== 'boolean') {
        return res.status(400).json({
          success: false,
          message: 'Campo "activo" debe ser booleano',
        });
      }

      const { rows } = await pool.query(
        `UPDATE usuarios SET activo = $1, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, nombre, rol, activo;`,
        [activo, id]
      );

      if (!rows.length)
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });

      res.json({ success: true, user: rows[0] });
    } catch (e) {
      console.error('Error cambiando estado usuario:', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

app.patch(
  '/api/usuarios/:id/password',
  verifyJWT,
  requireRole('administrador'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Nueva contraseña inválida (mínimo 6 caracteres)',
        });
      }

      const rounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10);
      const hash = await bcrypt.hash(newPassword, rounds);

      const { rows } = await pool.query(
        `UPDATE usuarios SET password_hash = $1, fecha_actualizacion = CURRENT_TIMESTAMP
         WHERE id = $2
         RETURNING id, email, nombre, rol, activo;`,
        [hash, id]
      );

      if (!rows.length)
        return res
          .status(404)
          .json({ success: false, message: 'Usuario no encontrado' });

      res.json({
        success: true,
        user: rows[0],
        message: 'Contraseña actualizada',
      });
    } catch (e) {
      console.error('Error reseteando contraseña:', e);
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    }
  }
);

// -------------------------------------------------------------------
// MÉTRICAS / DASHBOARD ADMIN
// -------------------------------------------------------------------
async function obtenerMetricasAdmin(req, res) {
  try {
    const [
      rDashboard,
      rPorDia,
      rRendimiento,
      rRecientes,
    ] = await Promise.all([
      pool.query('SELECT * FROM vista_dashboard'),
      pool.query('SELECT * FROM vista_solicitudes_por_dia ORDER BY fecha'),
      pool.query('SELECT * FROM vista_rendimiento_tecnicos'),
      pool.query(`
        SELECT 
          id,
          titulo,
          cliente_nombre,
          cliente_email,
          estado_actual,
          prioridad,
          fecha_solicitud,
          direccion_servicio
        FROM vista_solicitudes_recientes
        ORDER BY fecha_solicitud DESC
        LIMIT 15
      `),
    ]);

    const dashboard = rDashboard.rows[0] || {
      total_solicitudes: 0,
      completadas: 0,
      pendientes: 0,
      en_progreso: 0,
    };

    res.json({
      success: true,
      dashboard,
      solicitudes_por_dia: rPorDia.rows,
      rendimiento_tecnicos: rRendimiento.rows,
      solicitudes_recientes: rRecientes.rows,
    });
  } catch (error) {
    console.error('Error en métricas admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas del dashboard',
    });
  }
}
app.get(
  '/api/metricas/admin/dashboard',
  verifyJWT,
  requireRole('administrador'),
  obtenerMetricasAdmin
);
app.get(
  '/api/metricas/dashboard',
  verifyJWT,
  requireRole('administrador'),
  obtenerMetricasAdmin
);
app.get(
  '/api/metricas/raw-solicitudes',
  verifyJWT,
  requireRole('administrador'),
  async (req, res) => {
    try {
      const { rango = '30-dias' } = req.query;
      const days =
        rango === '7-dias' ? 7 :
        rango === '90-dias' ? 90 :
        rango === 'este-año' ? 365 : 30;

      const sql = `
        SELECT
          id,
          fecha_solicitud::date              AS fecha,
          LOWER(COALESCE(comuna,''))         AS comuna,
          COALESCE(tipo_servicio,'')         AS tipo_servicio,
          estado_actual                      AS estado,
          tecnico_id
        FROM solicitudes
        WHERE fecha_solicitud >= NOW() - INTERVAL '${days} days'
        ORDER BY fecha_solicitud DESC
        LIMIT 50000;
      `;
      const { rows } = await pool.query(sql);
      res.json({ rows });
    } catch (error) {
      console.error('raw-solicitudes:', error);
      res.status(500).json({ success: false, message: 'Error obteniendo datos crudos' });
    }
  }
);

// -------------------------------------------------------------------
// ➕ RUTA ML (ADMIN). PROXY A FASTAPI PARA USAR DESDE EL FRONTEND
// -------------------------------------------------------------------
app.post(
  '/api/ml/forecast',
  verifyJWT,
  requireRole('administrador'),
  async (req, res) => {
    try {
      const data = await forecastML(req.body);
      res.json({ success: true, ...data });
    } catch (e) {
      console.error('ML /forecast error:', e?.message || e);
      const status = Number.isInteger(e?.status) ? e.status : 500;
      res.status(status).json({
        success: false,
        message: e?.message || 'Error llamando al servicio ML',
      });
    }
  }
);

// -------------------------------------------------------------------
// 404 (colocar ANTES del manejador de errores)
// -------------------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Ruta no encontrada' });
});

// -------------------------------------------------------------------
// Manejador de errores robusto (4 parámetros)
// -------------------------------------------------------------------
app.use((err, req, res, next) => {
  try {
    const status = Number.isInteger(err?.status) ? err.status : 500;
    const msg = err?.message || 'Error no controlado';
    const stack = err?.stack || '';

    console.error('[ERROR]', msg);
    if (stack) console.error(stack);

    if (res.headersSent) return next(err);

    const payload = { success: false, message: msg };
    if (process.env.NODE_ENV !== 'production' && stack) {
      payload.trace = stack.split('\n').slice(0, 3);
    }

    res.status(status).json(payload);
  } catch (e) {
    console.error('[Fallo manejador de errores]', e?.message || e);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: 'Error interno del servidor' });
    } else {
      next(e);
    }
  }
});

// Handlers globales por seguridad
process.on('unhandledRejection', (reason) => {
  console.error(
    '[unhandledRejection]',
    reason?.message || reason,
    reason?.stack || ''
  );
});
process.on('uncaughtException', (error) => {
  console.error(
    '[uncaughtException]',
    error?.message || error,
    error?.stack || ''
  );
});

// -------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor INFOSER ejecutándose en: http://localhost:${PORT}`);
});
