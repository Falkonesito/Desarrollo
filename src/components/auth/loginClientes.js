import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const LoginClientes = () => {
  const [credenciales, setCredenciales] = useState({
    email: '',
    password: ''
  });
  const navigate = useNavigate();

  const handleChange = (e) => {
    setCredenciales({
      ...credenciales,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    console.log('Credenciales ingresadas:', credenciales);
    
    // Detectar si es administrador
    if (credenciales.email === 'admin@infoser.cl') {
      console.log('Redirigiendo a panel admin...');
      localStorage.setItem('adminLoggedIn', 'true');
      navigate('/admin/menu');
      return;
    }
    
    // Detectar si es técnico
    if (credenciales.email === 'juan.alvarez@infoser.cl') {
      console.log('Redirigiendo a panel técnico...');
      localStorage.setItem('tecnicoLoggedIn', 'true');
      navigate('/tecnico/panel');
      return;
    }
    
    // ✅ LÓGICA MEJORADA PARA CLIENTES NORMALES
    if (credenciales.email && credenciales.password) {
      console.log('Buscando cliente registrado...');
      
      // Buscar en la lista de clientes registrados
      const clientesRegistrados = JSON.parse(localStorage.getItem('clientesRegistrados')) || [];
      const clienteEncontrado = clientesRegistrados.find(
        cliente => cliente.email === credenciales.email && cliente.password === credenciales.password
      );
      
      if (clienteEncontrado) {
        console.log('Cliente encontrado:', clienteEncontrado.nombre);
        
        // Guardar sesión del cliente
        localStorage.setItem('clienteActual', JSON.stringify(clienteEncontrado));
        localStorage.setItem('clienteLoggedIn', 'true');
        
        // Limpiar formulario
        setCredenciales({ email: '', password: '' });
        
        // Redirigir al home
        navigate('/');
        
        // Mensaje de bienvenida
        alert(`¡Bienvenido ${clienteEncontrado.nombre}!`);
      } else {
        alert('❌ Email o contraseña incorrectos. Por favor regístrese primero.');
      }
    } else {
      alert('Por favor completa todos los campos');
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
                type="email" 
                className="form-control-client" 
                id="clientEmail"
                name="email"
                value={credenciales.email}
                onChange={handleChange}
                placeholder="Ingrese su email" 
                required 
              />
            </div>

            <div className="form-group-client">
              <label htmlFor="clientPassword" className="form-label-client">
                <i className="fas fa-lock me-2"></i>Contraseña
              </label>
              <input 
                type="password" 
                className="form-control-client" 
                id="clientPassword"
                name="password"
                value={credenciales.password}
                onChange={handleChange}
                placeholder="Ingrese su contraseña" 
                required 
              />
              <div className="forgot-password-client">
                <a href="#recuperar">¿Olvidó su contraseña?</a>
              </div>
            </div>

            <button type="submit" className="btn-login-client">
              <i className="fas fa-sign-in-alt me-2"></i>
              INICIAR SESIÓN
            </button>

            <div className="register-link-client">
              ¿No tiene una cuenta? <a href="/registro">Regístrese aquí</a>
            </div>
          </form>
        </div>
      </div>

      {/* Sección de Credenciales Demo - ACTUALIZADA */}
      <div className="demo-credentials-client">
        <div className="alert-info-client">
          <small>
            <i className="fas fa-info-circle me-1"></i>
            <strong>Credenciales de Prueba</strong>
          </small>
        </div>
        <div className="account-list-client">
          <div className="account-item-client">
            <strong>Admin:</strong> admin@infoser.cl (cualquier contraseña)
          </div>
          <div className="account-item-client">
            <strong>Técnico:</strong> juan.alvarez@infoser.cl (cualquier contraseña)
          </div>
          <div className="account-item-client">
            <strong>Cliente:</strong> Regístrese primero y luego inicie sesión
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginClientes;