import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/home';
import LoginClientes from './components/auth/loginClientes';
import RegisterClientes from './components/auth/registerClientes';
import AdminMenu from './pages/adminMenu';
import AdminClientes from './pages/adminClientes';
import AdminSolicitudes from './pages/adminSolicitudes';
import AdminTecnicos from './pages/adminTecnicos';
import AdminMetricas from './pages/adminMetricas';
import TecnicoPanel from './pages/tecnicoPanel';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginClientes />} />
          <Route path="/registro" element={<RegisterClientes />} />
          <Route path="/admin/menu" element={<AdminMenu />} />
          <Route path="/admin/clientes" element={<AdminClientes />} />
          <Route path="/admin/solicitudes" element={<AdminSolicitudes />} />
          <Route path="/admin/tecnicos" element={<AdminTecnicos />} />
          <Route path="/admin/metricas" element={<AdminMetricas />} />
          <Route path="/tecnico/panel" element={<TecnicoPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;