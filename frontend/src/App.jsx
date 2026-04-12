import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import AuthPage from './pages/AuthPage'
import ProfilePage from './pages/ProfilePage'
import LandingPage from './pages/LandingPage'
import HomePage from './pages/HomePage'
import ChatPage from './pages/ChatPage'
import ChatModePage from './pages/ChatModePage'
import DuoPage from './pages/DuoPage'
import GuessPage from './pages/GuessPage'
import MissionPage from './pages/MissionPage'
import SwipePage from './pages/SwipePage'
import DilemmaPage from './pages/DilemmaPage'
import InterrogationPage from './pages/InterrogationPage'
import ModeSelectorPage from './pages/ModeSelectorPage'
import BattlePage from './pages/BattlePage'
import FightPage from './pages/FightPage'
import ConfesionarioPage from './pages/ConfesionarioPage'
import EsteOEsePage from './pages/EsteOEsePage'
import StoryPage from './pages/StoryPage'
import CriticalPage from './pages/CriticalPage'
import OperacionPage from './pages/OperacionPage'
import UltimaCenaPage from './pages/UltimaCenaPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import ParecidoPage from './pages/ParecidoPage'
import './App.css'

export default function App() {
  return (
    <AuthProvider>
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/" element={<LandingPage />} />
        <Route path="/home-v1" element={<HomePage />} />
        <Route path="/chat" element={<ChatModePage />} />
        <Route path="/chat/:characterId" element={<ChatPage />} />
        <Route path="/duo" element={<DuoPage />} />
        <Route path="/guess" element={<GuessPage />} />
        <Route path="/mission" element={<MissionPage />} />
        <Route path="/swipe" element={<SwipePage />} />
        <Route path="/dilema"   element={<DilemmaPage />} />
        <Route path="/interrogation" element={<InterrogationPage />} />
        <Route path="/modos" element={<ModeSelectorPage />} />
        <Route path="/battle" element={<BattlePage />} />
        <Route path="/fight" element={<FightPage />} />
        <Route path="/confesionario" element={<ConfesionarioPage />} />
        <Route path="/este-o-ese" element={<EsteOEsePage />} />
        <Route path="/story" element={<StoryPage />} />
        <Route path="/critical" element={<CriticalPage />} />
        <Route path="/operacion" element={<OperacionPage />} />
        <Route path="/ultima-cena" element={<UltimaCenaPage />} />
        <Route path="/parecido" element={<ParecidoPage />} />
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  )
}
