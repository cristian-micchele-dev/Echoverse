import { BrowserRouter, Routes, Route } from 'react-router-dom'
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
import './App.css'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
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
      </Routes>
    </BrowserRouter>
  )
}
