import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

const LoginClientes = () => {
  const [credenciales, setCredenciales] = useState({ email: '', password: '' });
  const [cargando, setCargando] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setCargando(true);
    const ok = await loginConBackend();
    if (!ok) usarLoginLocal();
    setCargando(false);
  };

  // Intenta login con backend. Devuelve true si autenticó, false si no.
  const loginConBackend = async () => {
    try {
      const resp = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credenciales),
      });
      const data = await resp.json();
      if (data?.success && data?.user) {
        manejarLoginExitoso(data.user);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  };

  const manejarLoginExitoso = (userData) => {
    if (userData.rol === 'admin') {
      localStorage.setItem('adminLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      navigate('/admin/menu');
    } else if (userData.rol === 'tecnico') {
      localStorage.setItem('tecnicoLoggedIn', 'true');
      localStorage.setItem('userData', JSON.stringify(userData));
      navigate('/tecnico/panel');
    } else if (userData.rol === 'cliente') {
      localStorage.setItem('clienteActual', JSON.stringify(userData));
      localStorage.setItem('clienteLoggedIn', 'true');
      setCredenciales({ email: '', password: '' });
      navigate('/');
      alert(`Bienvenido ${userData.nombre}!`);
    }
  };

  // Respaldo local (sin carteles ni banners)
  const usarLoginLocal = () => {
    // Admin demo
    if (credenciales.email === 'admin@infoser.cl') {
      manejarLoginExitoso({
        id: 1,
        email: 'admin@infoser.cl',
        nombre: 'Administrador INFOSER',
        rol: 'admin',
      });
      return;
    }
    // Técnico demo
    if (credenciales.email === 'juan.alvarez@infoser.cl') {
      manejarLoginExitoso({
        id: 2,
        email: 'juan.alvarez@infoser.cl',
        nombre: 'Juan Alvarez',
        rol: 'tecnico',
      });
      return;
    }
    // Cliente registrado en localStorage
    const clientes = JSON.parse(localStorage.getItem('clientesRegistrados')) || [];
    const encontrado = clientes.find(
      (c) => c.email === credenciales.email && c.password === credenciales.password
    );
    if (encontrado) {
      manejarLoginExitoso({ ...encontrado, rol: 'cliente' });
    } else {
      alert('Email o contraseña incorrectos. Por favor regístrese primero.');
    }
  };

  return (
    <div className="login-client-container">
      <div className="login-client-card">
        <div className="login-client-header">
          <div className="login-client-icon">
            <i className="fas fa-user-circle"></i>
          </div>
          <h4>ACCESO AL SISTEMA</h4>
          <p>Sistema de Gestión de Solicitudes INFOSER</p>
        </div>

        <div className="login-client-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group-client">
              <label htmlFor="clientEmail" className="form-label-client">
                <i className="fas fa-envelope me-2"></i>Email
              </label>
              <input
                id="clientEmail"
                type="email"
                name="email"
                className="form-control-client"
                value={credenciales.email}
                onChange={handleChange}
                placeholder="Ingrese su email"
                required
                disabled={cargando}
              />
            </div>

            <div className="form-group-client">
              <label htmlFor="clientPassword" className="form-label-client">
                <i className="fas fa-lock me-2"></i>Contraseña
              </label>
              <input
                id="clientPassword"
                type="password"
                name="password"
                className="form-control-client"
                value={credenciales.password}
                onChange={handleChange}
                placeholder="Ingrese su contraseña"
                required
                disabled={cargando}
              />
              <div className="forgot-password-client">
                <a href="#recuperar">¿Olvidó su contraseña?</a>
              </div>
            </div>

            <button type="submit" className="btn-login-client" disabled={cargando}>
              {cargando ? (
                <>
                  <i className="fas fa-spinner fa-spin me-2"></i>
                  PROCESANDO...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  INICIAR SESIÓN
                </>
              )}
            </button>

            <div className="register-link-client">
              ¿No tiene una cuenta? <a href="/registro">Regístrese aquí</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LoginClientes;
