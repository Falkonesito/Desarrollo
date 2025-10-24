import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/register.css';

const RegisterClientes = () => {
  const [datosRegistro, setDatosRegistro] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: ''
  });
  const [cargando, setCargando] = useState(false);
  const [backendDisponible, setBackendDisponible] = useState(false);
  const navigate = useNavigate();

  // Verificar si el backend esta disponible al cargar la pagina
  useEffect(() => {
    verificarBackend();
  }, []);

  const verificarBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/health');
      const data = await response.json();
      if (data.success) {
        setBackendDisponible(true);
      }
    } catch (error) {
      setBackendDisponible(false);
    }
  };

  const handleChange = (e) => {
    setDatosRegistro({
      ...datosRegistro,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    
    if (backendDisponible) {
      await registrarConBackend();
    } else {
      registrarEnLocalStorage();
    }
    
    setCargando(false);
  };

  const registrarConBackend = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(datosRegistro)
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert(`Registro exitoso ${datosRegistro.nombre}! Ahora puedes iniciar sesion.`);
        setDatosRegistro({ nombre: '', email: '', password: '', telefono: '' });
        setTimeout(() => navigate('/login'), 1000);
      } else {
        alert(`Error en registro: ${data.message}`);
      }
    } catch (error) {
      alert('Error al conectar con el servidor. Usando modo local...');
      registrarEnLocalStorage();
    }
  };

  const registrarEnLocalStorage = () => {
    const clientesExistentes = JSON.parse(localStorage.getItem('clientesRegistrados')) || [];
    
    if (clientesExistentes.some(cliente => cliente.email === datosRegistro.email)) {
      alert('Este email ya esta registrado. Use otro email o inicie sesion.');
      return;
    }
    
    const nuevoCliente = {
      id: Date.now(),
      nombre: datosRegistro.nombre,
      email: datosRegistro.email,
      password: datosRegistro.password,
      telefono: datosRegistro.telefono,
      fechaRegistro: new Date().toISOString(),
      rol: 'cliente'
    };

    clientesExistentes.push(nuevoCliente);
    localStorage.setItem('clientesRegistrados', JSON.stringify(clientesExistentes));
    
    alert(`Registro exitoso ${datosRegistro.nombre}! Ahora puedes iniciar sesion.`);
    setDatosRegistro({ nombre: '', email: '', password: '', telefono: '' });
    setTimeout(() => navigate('/login'), 1000);
  };

  return (
    <div className="register-client-container">
      <div className="register-client-card">
        <div className="register-client-header">
          <div className="register-client-icon">
            <i className="fas fa-user-plus"></i>
          </div>
          <h4>REGISTRO CLIENTE</h4>
          <p>Crear nueva cuenta</p>
        </div>

        <div className="register-client-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-user me-2"></i>Nombre Completo
              </label>
              <input 
                type="text" 
                className="form-control-client"
                name="nombre"
                value={datosRegistro.nombre}
                onChange={handleChange}
                placeholder="Juan Perez"
                required 
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-envelope me-2"></i>Email
              </label>
              <input 
                type="email" 
                className="form-control-client"
                name="email"
                value={datosRegistro.email}
                onChange={handleChange}
                placeholder="cliente@ejemplo.com"
                required 
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-lock me-2"></i>Contraseña
              </label>
              <input 
                type="password" 
                className="form-control-client"
                name="password"
                value={datosRegistro.password}
                onChange={handleChange}
                placeholder="Minimo 6 caracteres"
                minLength="6"
                required 
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-phone me-2"></i>Telefono
              </label>
              <input 
                type="tel" 
                className="form-control-client"
                name="telefono"
                value={datosRegistro.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                required 
                disabled={cargando}
              />
            </div>

            <button 
              type="submit" 
              className="btn-register-client"
              disabled={cargando}
            >
              {cargando ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  REGISTRANDO...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  CREAR CUENTA
                </>
              )}
            </button>

            <div className="login-link-client">
              Ya tiene una cuenta? <a href="/login">Inicie sesion aqui</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterClientes;