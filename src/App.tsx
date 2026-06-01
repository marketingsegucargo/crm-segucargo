import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import ProtectedRoute from './routes/ProtectedRoute'
import AppLayout from './components/layout/AppLayout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Pipeline from './pages/Pipeline'
import Contacts from './pages/Contacts'
import Quotes from './pages/Quotes'
import Activities from './pages/Activities'
import Reports from './pages/Reports'
import Users from './pages/Users'
import Operations from './pages/Operations'
import Correo from './pages/Correo'
import Formularios from './pages/Formularios'
import Empresas from './pages/Empresas'
import Proveedores from './pages/Proveedores'
import ClientesSegucargo from './pages/ClientesSegucargo'
import Negocios from './pages/Negocios'
import NegocioDetail from './pages/NegocioDetail'
import Tareas from './pages/Tareas'
import Reuniones from './pages/Reuniones'
import Llamadas from './pages/Llamadas'
import Fragmentos from './pages/Fragmentos'
import Secuencias from './pages/Secuencias'
import Workflows from './pages/Workflows'
import Paneles from './pages/Paneles'
import UsuariosAdmin from './pages/admin/Usuarios'
import Configuracion from './pages/admin/Configuracion'
import BookingPage from './pages/BookingPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/booking/:slug" element={<BookingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<Dashboard />} />
            {/* CRM */}
            <Route path="/leads" element={<Leads />} />
            <Route path="/leads/:id" element={<LeadDetail />} />
            <Route path="/pipeline" element={<Pipeline />} />
            <Route path="/contactos" element={<Contacts />} />
            <Route path="/clientes" element={<ClientesSegucargo />} />
            <Route path="/negocios" element={<Negocios />} />
            <Route path="/negocios/:id" element={<NegocioDetail />} />
            <Route path="/proveedores" element={<Proveedores />} />
            <Route path="/empresas" element={<Empresas />} />
            {/* Comunicaciones */}
            <Route path="/reuniones" element={<Reuniones />} />
            <Route path="/secuencias" element={<Secuencias />} />
            <Route path="/tareas" element={<Tareas />} />
            <Route path="/llamadas" element={<Llamadas />} />
            <Route path="/fragmentos" element={<Fragmentos />} />
            <Route path="/correo" element={<Correo />} />
            <Route path="/formularios" element={<Formularios />} />
            {/* Ventas */}
            <Route path="/cotizaciones" element={<Quotes />} />
            <Route path="/operaciones" element={<Operations />} />
            {/* Automatización */}
            <Route path="/workflows" element={<Workflows />} />
            {/* Reportes */}
            <Route path="/reportes" element={<Reports />} />
            <Route path="/reportes/paneles" element={<Paneles />} />
            <Route path="/reportes/informes" element={<Reports />} />
            {/* Admin */}
            <Route path="/administracion/usuarios" element={<UsuariosAdmin />} />
            <Route path="/administracion/configuracion" element={<Configuracion />} />
            <Route path="/usuarios" element={<Users />} />
            <Route path="/actividades" element={<Activities />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
