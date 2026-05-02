import { Routes, Route, Navigate } from 'react-router-dom'
import PrivateRoute from './components/layout/PrivateRoute'
import DashboardLayout from './components/layout/DashboardLayout'
import MiEquipoLayout from './components/layout/MiEquipoLayout'
import ThemeToggle from './components/ui/ThemeToggle'

import LandingPage from './pages/public/LandingPage'
import LoginPage from './pages/LoginPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import PerfilPublico from './pages/public/PerfilPublico'
import TorneoPublico from './pages/public/TorneoPublico'
import EquipoPublico from './pages/public/EquipoPublico'
import ArbitroPage from './pages/public/ArbitroPage'
import InscripcionPage from './pages/public/InscripcionPage'
import InscripcionesPage from './pages/InscripcionesPage'

import DashboardPage from './pages/DashboardPage'
import LigasPage from './pages/LigasPage'
import EquiposPage from './pages/EquiposPage'
import JugadoresPage from './pages/JugadoresPage'
import JornadasPage from './pages/JornadasPage'
import CobrosPage from './pages/CobrosPage'
import EstadisticasPage from './pages/EstadisticasPage'
import LiguillaPage from './pages/LiguillaPage'
import ChatbotPage from './pages/ChatbotPage'
import AdminPanel from './pages/AdminPanel'
import MiEquipoPage from './pages/equipo/MiEquipoPage'
import MiJugadoresPage from './pages/equipo/MiJugadoresPage'
import MiPagosPage from './pages/equipo/MiPagosPage'
import FeedPage from './pages/FeedPage'
import MarketplacePage from './pages/MarketplacePage'
import VendedoresLigaPage from './pages/VendedoresLigaPage'
import MensajesPage from './pages/MensajesPage'
import VendedorLayout from './components/layout/VendedorLayout'
import MisProductosPage from './pages/vendedor/MisProductosPage'
import VendedorHomePage from './pages/vendedor/VendedorHomePage'

export default function App() {
  return (
    <>
      <ThemeToggle />
      <Routes>
      {/* Públicas */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
      <Route path="/:username" element={<PerfilPublico />} />
      <Route path="/:username/:ligaSlug" element={<TorneoPublico />} />
      <Route path="/:username/:ligaSlug/equipo/:equipoSlug" element={<EquipoPublico />} />
      <Route path="/arbitro/:token" element={<ArbitroPage />} />
      <Route path="/inscripcion/:token" element={<InscripcionPage />} />

      {/* Privadas */}
      <Route
        path="/dashboard"
        element={
          <PrivateRoute>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="ligas" element={<LigasPage />} />
        <Route path="equipos/:liga_id" element={<EquiposPage />} />
        <Route path="jugadores/:equipo_id" element={<JugadoresPage />} />
        <Route path="jornadas/:liga_id" element={<JornadasPage />} />
        <Route path="cobros/:liga_id" element={<CobrosPage />} />
        <Route path="estadisticas/:liga_id" element={<EstadisticasPage />} />
        <Route path="liguilla/:liga_id" element={<LiguillaPage />} />
        <Route path="inscripciones/:liga_id" element={<InscripcionesPage />} />
        <Route path="chatbot" element={<ChatbotPage />} />
        <Route path="feed/:liga_id" element={<FeedPage />} />
        <Route path="vendedores/:liga_id" element={<VendedoresLigaPage />} />
        <Route path="marketplace/:liga_id" element={<MarketplacePage />} />
      </Route>

      {/* Admin */}
      <Route
        path="/admin"
        element={
          <PrivateRoute roles={['superadmin']}>
            <DashboardLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<AdminPanel />} />
      </Route>

      {/* Dueño de equipo */}
      <Route
        path="/mi-equipo"
        element={
          <PrivateRoute roles={['dueno_equipo']}>
            <MiEquipoLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<MiEquipoPage />} />
        <Route path="feed" element={<FeedPage />} />
        <Route path="marketplace" element={<MarketplacePage />} />
        <Route path="mensajes" element={<MensajesPage />} />
        <Route path="jugadores" element={<MiJugadoresPage />} />
        <Route path="pagos" element={<MiPagosPage />} />
      </Route>

      {/* Vendedor */}
      <Route
        path="/mi-negocio"
        element={
          <PrivateRoute roles={['vendedor']}>
            <VendedorLayout />
          </PrivateRoute>
        }
      >
        <Route index element={<VendedorHomePage />} />
        <Route path="productos" element={<MisProductosPage />} />
        <Route path="mensajes" element={<MensajesPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
