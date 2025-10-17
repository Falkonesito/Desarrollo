import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // ✅ AGREGAR
import '../../styles/register.css';

const RegisterClientes = () => {
  const [datosRegistro, setDatosRegistro] = useState({
    nombre: '',
    email: '',
    password: '',
    telefono: ''
  });

  const navigate = useNavigate(); // ✅ AGREGAR

  const handleChange = (e) => {
    setDatosRegistro({
      ...datosRegistro,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Datos de registro:', datosRegistro);
    
    // ✅ LÓGICA MEJORADA DE REGISTRO
    // Obtener clientes existentes o crear array vacío
    const clientesExistentes = JSON.parse(localStorage.getItem('clientesRegistrados')) || [];
    
    // Verificar si el email ya existe
    if (clientesExistentes.some(cliente => cliente.email === datosRegistro.email)) {
      alert('⚠️ Este email ya está registrado. Use otro email o inicie sesión.');
      return;
    }
    
    // Crear nuevo cliente
    const nuevoCliente = {
      id: Date.now(),
      nombre: datosRegistro.nombre,
      email: datosRegistro.email,
      password: datosRegistro.password,
      telefono: datosRegistro.telefono,
      fechaRegistro: new Date().toISOString(),
      rol: 'cliente'
    };

    // Guardar en la lista de clientes
    clientesExistentes.push(nuevoCliente);
    localStorage.setItem('clientesRegistrados', JSON.stringify(clientesExistentes));
    
    // ✅ REDIRIGIR A LOGIN EN LUGAR DE HOME
    alert(`✅ ¡Registro exitoso ${datosRegistro.nombre}! Ahora puedes iniciar sesión.`);
    
    // Limpiar formulario
    setDatosRegistro({
      nombre: '',
      email: '',
      password: '',
      telefono: ''
    });
    
    // Redirigir a login después de 1 segundo
    setTimeout(() => {
      navigate('/login');
    }, 1000);
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
                placeholder="Juan Pérez"
                required 
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
                placeholder="Mínimo 6 caracteres"
                minLength="6"
                required 
              />
            </div>

            <div className="form-group-client">
              <label className="form-label-client">
                <i className="fas fa-phone me-2"></i>Teléfono
              </label>
              <input 
                type="tel" 
                className="form-control-client"
                name="telefono"
                value={datosRegistro.telefono}
                onChange={handleChange}
                placeholder="+56 9 1234 5678"
                required 
              />
            </div>

            <button type="submit" className="btn-register-client">
              <i className="fas fa-user-plus me-2"></i>
              CREAR CUENTA
            </button>

            <div className="login-link-client">
              ¿Ya tiene una cuenta? <a href="/login">Inicie sesión aquí</a>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegisterClientes;