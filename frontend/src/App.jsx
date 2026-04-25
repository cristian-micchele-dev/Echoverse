import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'
import { useAuth } from './context/AuthContext'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import PageLoader from './components/PageLoader/PageLoader'
import { ROUTES } from './utils/constants'
import './App.css'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const ChatPage = lazy(() => import('./pages/ChatPage'))
const ChatModePage = lazy(() => import('./pages/ChatModePage'))
const DuoPage = lazy(() => import('./pages/DuoPage'))
const GuessPage = lazy(() => import('./pages/GuessPage'))
const MissionPage = lazy(() => import('./pages/MissionPage'))
const SwipePage = lazy(() => import('./pages/SwipePage'))
const DilemmaPage = lazy(() => import('./pages/DilemmaPage'))
const InterrogationPage = lazy(() => import('./pages/InterrogationPage'))
const ModeSelectorPage = lazy(() => import('./pages/ModeSelectorPage'))
const ImpostorPage = lazy(() => import('./pages/ImpostorPage/ImpostorPage'))
const UltimaCenaPage = lazy(() => import('./pages/UltimaCenaPage'))
const ParecidoPage = lazy(() => import('./pages/ParecidoPage'))
const RoomsPage = lazy(() => import('./pages/RoomsPage'))
const RoomChatPage = lazy(() => import('./pages/RoomChatPage'))
const AdminPage = lazy(() => import('./pages/AdminPage'))
const CreateCharacterPage = lazy(() => import('./pages/CreateCharacterPage'))
const EditCharacterPage = lazy(() => import('./pages/EditCharacterPage'))
const ComunidadPage = lazy(() => import('./pages/ComunidadPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage/NotFoundPage'))

function AnimatedRoutes() {
  const location = useLocation()
  const { loading } = useAuth()

  if (loading) return <PageLoader />

  return (
    <div key={location.pathname} className="page-transition-wrapper">
      <Routes location={location}>
        <Route path={ROUTES.AUTH} element={<AuthPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.PERFIL} element={<ProfilePage />} />
        <Route path={ROUTES.HOME} element={<LandingPage />} />
        <Route path={ROUTES.CHAT} element={<ChatModePage />} />
        <Route path="/chat/:characterId" element={<ChatPage />} />
        <Route path={ROUTES.DUO} element={<DuoPage />} />
        <Route path={ROUTES.GUESS} element={<GuessPage />} />
        <Route path={ROUTES.MISSION} element={<MissionPage />} />
        <Route path={ROUTES.SWIPE} element={<SwipePage />} />
        <Route path={ROUTES.DILEMA} element={<DilemmaPage />} />
        <Route path={ROUTES.INTERROGATION} element={<InterrogationPage />} />
        <Route path={ROUTES.MODOS} element={<ModeSelectorPage />} />

        <Route path={ROUTES.ULTIMA_CENA} element={<UltimaCenaPage />} />
        <Route path={ROUTES.PARECIDO} element={<ParecidoPage />} />
        <Route path={ROUTES.SALAS} element={<RoomsPage />} />
        <Route path="/salas/:roomId" element={<RoomChatPage />} />
        <Route path={ROUTES.ADMIN} element={<AdminPage />} />
        <Route path={ROUTES.CREAR_PERSONAJE} element={<CreateCharacterPage />} />
        <Route path="/editar-personaje/:id" element={<EditCharacterPage />} />
        <Route path={ROUTES.COMUNIDAD} element={<ComunidadPage />} />
        <Route path={ROUTES.IMPOSTOR} element={<ImpostorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <AnimatedRoutes />
            </Suspense>
          </ErrorBoundary>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  )
}
