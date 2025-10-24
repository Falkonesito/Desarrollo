const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Configuración de PostgreSQL
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'infoser_db',
  password: process.env.DB_PASSWORD || 'tu_password',
  port: process.env.DB_PORT || 5432,
});

// Verificar conexión a la base de datos
pool.on('connect', () => {
  console.log('✅ Conectado a PostgreSQL');
});

pool.on('error', (err) => {
  console.error('❌ Error de conexión PostgreSQL:', err);
});

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Backend INFOSER funcionando!',
    timestamp: new Date().toISOString(),
    database: 'PostgreSQL conectado'
  });
});

// Ruta de login - MEJORADA con PostgreSQL
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  
  console.log('Intento de login:', email);
  
  try {
    // Buscar en la tabla de usuarios (admin y técnicos)
    const usuarioResult = await pool.query(
      'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
      [email]
    );
    
    if (usuarioResult.rows.length > 0) {
      const usuario = usuarioResult.rows[0];
      // En producción, deberías comparar con bcrypt
      if (password === 'password123') { // Contraseña temporal
        return res.json({
          success: true,
          user: {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol,
            telefono: usuario.telefono,
            especialidad: usuario.especialidad
          },
          message: `Login ${usuario.rol} exitoso`
        });
      }
    }
    
    // Buscar en la tabla de clientes
    const clienteResult = await pool.query(
      'SELECT * FROM clientes WHERE email = $1 AND activo = true',
      [email]
    );
    
    if (clienteResult.rows.length > 0) {
      const cliente = clienteResult.rows[0];
      if (password === 'password123') { // Contraseña temporal
        return res.json({
          success: true,
          user: {
            id: cliente.id,
            email: cliente.email,
            nombre: cliente.nombre,
            rol: 'cliente',
            telefono: cliente.telefono
          },
          message: 'Login cliente exitoso'
        });
      }
    }
    
    res.status(401).json({
      success: false,
      message: 'Credenciales incorrectas'
    });
    
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta de registro REAL con PostgreSQL
app.post('/api/auth/register', async (req, res) => {
  const { nombre, email, password, telefono } = req.body;
  
  console.log('Datos de registro recibidos:', { nombre, email, telefono });
  
  if (!nombre || !email || !password || !telefono) {
    return res.status(400).json({
      success: false,
      message: 'Todos los campos son obligatorios'
    });
  }
  
  try {
    const emailCheck = await pool.query(
      'SELECT id FROM clientes WHERE email = $1',
      [email]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Este email ya está registrado'
      });
    }
    
    const result = await pool.query(
      `INSERT INTO clientes (email, password_hash, nombre, telefono) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, email, nombre, telefono, fecha_registro`,
      [email, password, nombre, telefono]
    );
    
    const nuevoCliente = result.rows[0];
    
    res.json({
      success: true,
      message: 'Registro exitoso',
      user: {
        id: nuevoCliente.id,
        nombre: nuevoCliente.nombre,
        email: nuevoCliente.email,
        telefono: nuevoCliente.telefono,
        rol: 'cliente',
        fechaRegistro: nuevoCliente.fecha_registro
      }
    });
    
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para crear solicitud REAL con PostgreSQL
app.post('/api/solicitudes', async (req, res) => {
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
    cliente_id,
    cliente_nombre,
    cliente_email
  } = req.body;

  console.log('Nueva solicitud recibida:', { titulo, cliente_nombre });

  if (!titulo || !descripcion || !direccion_servicio || !comuna || !region || !tipo_servicio) {
    return res.status(400).json({
      success: false,
      message: 'Faltan campos obligatorios'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO solicitudes 
       (cliente_id, direccion_servicio, comuna, region, titulo, descripcion, 
        tipo_servicio, prioridad, equipos_solicitados, comentarios_finales) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) 
       RETURNING *`,
      [cliente_id, direccion_servicio, comuna, region, titulo, descripcion,
       tipo_servicio, prioridad, equipos_solicitados, comentarios_finales]
    );

    const nuevaSolicitud = result.rows[0];

    res.json({
      success: true,
      message: 'Solicitud creada exitosamente',
      solicitud: nuevaSolicitud
    });
    
  } catch (error) {
    console.error('Error creando solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener solicitudes por cliente REAL
app.get('/api/solicitudes/cliente/:clienteId', async (req, res) => {
  const { clienteId } = req.params;
  
  console.log('Solicitando solicitudes del cliente:', clienteId);
  
  try {
    const result = await pool.query(
      'SELECT * FROM solicitudes WHERE cliente_id = $1 ORDER BY fecha_solicitud DESC',
      [clienteId]
    );

    res.json({
      success: true,
      solicitudes: result.rows
    });
    
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener todas las solicitudes (admin)
app.get('/api/solicitudes', async (req, res) => {
  console.log('Solicitando todas las solicitudes');
  
  try {
    const result = await pool.query(
      `SELECT s.*, c.nombre as cliente_nombre, c.email as cliente_email, 
              u.nombre as tecnico_nombre
       FROM solicitudes s
       LEFT JOIN clientes c ON s.cliente_id = c.id
       LEFT JOIN usuarios u ON s.tecnico_id = u.id
       ORDER BY s.fecha_solicitud DESC`
    );

    res.json({
      success: true,
      solicitudes: result.rows
    });
    
  } catch (error) {
    console.error('Error obteniendo solicitudes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener clientes (admin)
app.get('/api/clientes', async (req, res) => {
  console.log('Solicitando lista de clientes');
  
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, fecha_registro FROM clientes ORDER BY fecha_registro DESC'
    );

    res.json({
      success: true,
      clientes: result.rows
    });
    
  } catch (error) {
    console.error('Error obteniendo clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener técnicos
app.get('/api/tecnicos', async (req, res) => {
  console.log('Solicitando lista de técnicos');
  
  try {
    const result = await pool.query(
      'SELECT id, nombre, email, telefono, especialidad FROM usuarios WHERE rol = $1 AND activo = true',
      ['tecnico']
    );

    res.json({
      success: true,
      tecnicos: result.rows
    });
    
  } catch (error) {
    console.error('Error obteniendo técnicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para actualizar estado de solicitud
app.put('/api/solicitudes/:id', async (req, res) => {
  const { id } = req.params;
  const { estado_actual, tecnico_id } = req.body;
  
  console.log('Actualizando solicitud:', id, 'Estado:', estado_actual);
  
  try {
    const result = await pool.query(
      `UPDATE solicitudes 
       SET estado_actual = $1, tecnico_id = $2, fecha_actualizacion = CURRENT_TIMESTAMP
       WHERE id = $3 
       RETURNING *`,
      [estado_actual, tecnico_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Solicitud no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Solicitud actualizada exitosamente',
      solicitud: result.rows[0]
    });
    
  } catch (error) {
    console.error('Error actualizando solicitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ✅ Manejo de rutas no encontradas (versión corregida)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Manejo de errores global
app.use((err, req, res, next) => {
  console.error('Error en el servidor:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor'
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor INFOSER ejecutándose en: http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🗄️  Base de datos: PostgreSQL conectado`);
});
