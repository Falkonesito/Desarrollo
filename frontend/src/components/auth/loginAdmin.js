import { useNavigate } from 'react-router-dom';

function loginAdmin({ setIsAuthenticated }) {
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Tu lógica de autenticación aquí
    const success = await verificarCredenciales(); // Tu función
    
    if (success) {
      setIsAuthenticated(true);
      navigate('/admin-menu'); // ← Esto te redirige al menú de admin
    }
  };

  return (
    // Tu formulario de login
    <form onSubmit={handleLogin}>
      {/* inputs y botón */}
    </form>
  );
}