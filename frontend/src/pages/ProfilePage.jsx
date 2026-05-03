import { useEffect, useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { characterMap } from '../data/characters'
import { getAffinityLevel } from '../utils/affinity'
import { getMissionProgress, resetProgress } from '../utils/missionProgress'
import { useAchievements } from '../hooks/useAchievements'
import { useStreak } from '../hooks/useStreak'
import AchievementToast from '../components/AchievementToast/AchievementToast'
import { ROUTES } from '../utils/constants'
import { API_URL } from '../config/api.js'
import { Helmet } from 'react-helmet-async'
import { ACHIEVEMENTS } from '../data/achievements'
import { getRank, MODE_META, getActivityGrid, useCountUp } from './profile/utils.js'
import ProfileHero from './profile/ProfileHero.jsx'
import ProfileInsights from './profile/ProfileInsights.jsx'
import ProfileSkeleton from './profile/ProfileSkeleton.jsx'
import ProfileCampaign from './profile/ProfileCampaign.jsx'
import ProfileAffinities from './profile/ProfileAffinities.jsx'
import ProfileInterrogations from './profile/ProfileInterrogations.jsx'
import ProfileLogros from './profile/ProfileLogros.jsx'
import './ProfilePage.css'

export default function ProfilePage() {
  const { user, session, loading: authLoading, logout } = useAuth()
  const { showToast, showConfirm } = useToast()
  const navigate = useNavigate()

  const [affinities, setAffinities] = useState([])
  const [mission, setMission] = useState(null)
  const [dilemasCount, setDilemasCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)
  const [dailyCount, setDailyCount] = useState(0)
  const [modeCompletions, setModeCompletions] = useState({})
  const [customCharsCount, setCustomCharsCount] = useState(0)
  const [interrogationResults, setInterrogationResults] = useState([])
  const [guessScore] = useState(() => { try { return parseInt(localStorage.getItem('guess-best-score') || '0') } catch { return 0 } })
  const { unlockedIds, checkAndUnlock, newlyUnlocked, dismissToast } = useAchievements()
  const { streak } = useStreak()

  const nextAchievement = useMemo(() => {
    return ACHIEVEMENTS.find(a => !unlockedIds.has(a.id)) ?? null
  }, [unlockedIds])

  useEffect(() => {
    if (authLoading) return
    if (!session) { navigate(ROUTES.AUTH, { state: { message: 'Iniciá sesión para ver tu perfil y progreso.' } }); return }
    const headers = { Authorization: `Bearer ${session.access_token}` }
    Promise.all([
      fetch(`${API_URL}/db/affinity`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/mission-progress`, { headers }).then(r => r.json()),
      fetch(`${API_URL}/db/dilema-seen`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/db/daily-challenge`, { headers }).then(r => r.json()).catch(() => ({ completed: false })),
      fetch(`${API_URL}/db/mode-completions`, { headers }).then(r => r.json()).catch(() => ({})),
      fetch(`${API_URL}/db/custom-characters`, { headers }).then(r => r.json()).catch(() => []),
      fetch(`${API_URL}/db/interrogation-results`, { headers }).then(r => r.json()).catch(() => []),
    ]).then(([aff, mis, seen, dailyStatus, modeComp, customChars, intrResults]) => {
      setCustomCharsCount(Array.isArray(customChars) ? customChars.length : 0)
      setInterrogationResults(Array.isArray(intrResults) ? intrResults : [])
      setDilemasCount(Array.isArray(seen) ? seen.length : 0)
      setDailyCount(dailyStatus?.completed ? 1 : 0)
      setModeCompletions(typeof modeComp === 'object' && modeComp !== null ? modeComp : {})

      if (!Array.isArray(aff) || aff.length === 0) {
        try {
          const meta = JSON.parse(localStorage.getItem('chat-history-meta') || '{}')
          const entries = Object.entries(meta)
          if (entries.length > 0) {
            entries.forEach(([characterId, data]) => {
              fetch(`${API_URL}/db/affinity`, {
                method: 'POST',
                headers: { ...headers, 'Content-Type': 'application/json' },
                body: JSON.stringify({ characterId, messageCount: data.messageCount })
              }).catch(() => {})
            })
            localStorage.removeItem('chat-history-meta')
            setAffinities(entries.map(([character_id, data]) => ({
              character_id,
              message_count: data.messageCount
            })))
          } else {
            setAffinities([])
          }
        } catch { setAffinities([]) }
      } else {
        setAffinities(aff)
      }

      if (!mis || !mis.highestUnlocked || mis.highestUnlocked <= 1) {
        const local = getMissionProgress()
        if (local.highestUnlocked > 1) {
          fetch(`${API_URL}/db/mission-progress`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({ highestUnlocked: local.highestUnlocked, completedLevels: local.completedLevels })
          }).catch(() => {})
          resetProgress()
          setMission(local)
          return
        }
      }
      setMission(mis)
    }).catch(() => {
      setFetchError(true)
      setMission(getMissionProgress())
      setAffinities([])
    }).finally(() => setLoading(false))
  }, [session, navigate, authLoading])

  useEffect(() => {
    if (loading) return
    const totalMessages = affinities.reduce((sum, a) => sum + (a.message_count || 0), 0)
    const completedLevels = mission ? Object.keys(mission.completedLevels || {}).length : 0
    const charactersCount = affinities.length
    const gs = (() => { try { return parseInt(localStorage.getItem('guess-best-score') || '0') } catch { return 0 } })()
    checkAndUnlock({ totalMessages, completedLevels, charactersCount, dilemasCount, guessScore: gs, dailyCompleted: dailyCount, modeCompletions, streakCurrent: streak.current, customCharCreated: customCharsCount })
  }, [loading, modeCompletions, affinities, mission, dilemasCount, dailyCount, checkAndUnlock, streak, customCharsCount])

  async function handleLogout() {
    try { await logout() } catch { /* limpia sesión local de todas formas */ }
    navigate(ROUTES.HOME)
  }

  function handleDeleteAccount() {
    showConfirm(
      '¿Estás seguro de que querés eliminar tu cuenta? Esta acción es permanente e irreversible.',
      async () => {
        try {
          const res = await fetch(`${API_URL}/auth/account`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${session.access_token}` }
          })
          if (!res.ok) {
            const data = await res.json()
            showToast(data.error || 'No se pudo eliminar la cuenta.')
            return
          }
          await logout().catch(() => {})
          navigate(ROUTES.HOME, { replace: true })
        } catch {
          showToast('Error al eliminar la cuenta. Intentá de nuevo.')
        }
      },
      { confirmText: 'Eliminar cuenta' }
    )
  }

  const activeAffinities = affinities
    .map(a => {
      const char = characterMap[a.character_id]
      if (!char) return null
      const level = getAffinityLevel(a.message_count)
      return { ...a, char, level }
    })
    .filter(Boolean)
    .filter(a => a.level > 0)
    .sort((a, b) => b.message_count - a.message_count)

  const totalMessages  = affinities.reduce((sum, a) => sum + (a.message_count || 0), 0)
  const highestLevel   = mission?.highestUnlocked ?? 1
  const progressPct    = Math.min(((highestLevel - 1) / 30) * 100, 100)
  const displayName    = user?.user_metadata?.username || user?.email
  const initial        = displayName?.[0]?.toUpperCase()
  const rank           = getRank(totalMessages)

  const animChars   = useCountUp(loading ? 0 : affinities.filter(a => a.message_count > 0).length)
  const animMsgs    = useCountUp(loading ? 0 : totalMessages)
  const animLevels  = useCountUp(loading ? 0 : (mission ? Object.keys(mission.completedLevels || {}).length : 0))
  const animStreak  = useCountUp(loading ? 0 : streak.current)
  const animGuess   = useCountUp(loading ? 0 : guessScore)
  const animDilemas = useCountUp(loading ? 0 : dilemasCount)
  const animCustom  = useCountUp(loading ? 0 : customCharsCount)

  const favMode = useMemo(() => {
    const entries = Object.entries(modeCompletions).filter(([, v]) => v > 0)
    if (!entries.length) return null
    const [key, count] = entries.sort((a, b) => b[1] - a[1])[0]
    return { key, count, ...MODE_META[key] }
  }, [modeCompletions])

  const activityGrid = useMemo(() => getActivityGrid(28), [])

  if (authLoading || !user) return null

  return (
    <div className="pp">
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>

      {newlyUnlocked.length > 0 && (
        <AchievementToast
          achievement={newlyUnlocked[0]}
          onDismiss={() => dismissToast(newlyUnlocked[0].id)}
        />
      )}

      <div className="pp-grain" aria-hidden="true" />

      <ProfileHero
        initial={initial}
        displayName={displayName}
        rank={rank}
        animChars={animChars}
        animMsgs={animMsgs}
        animLevels={animLevels}
        animStreak={animStreak}
        user={user}
        navigate={navigate}
        onLogout={handleLogout}
        onDeleteAccount={handleDeleteAccount}
      />

      {!loading && (
        <ProfileInsights
          activityGrid={activityGrid}
          favMode={favMode}
          guessScore={guessScore}
          dilemasCount={dilemasCount}
          customCharsCount={customCharsCount}
          animGuess={animGuess}
          animDilemas={animDilemas}
          animCustom={animCustom}
        />
      )}

      <div className="pp-body">
        {loading ? (
          <ProfileSkeleton
            fetchError={fetchError}
            onRetry={() => { setFetchError(false); setLoading(true); window.location.reload() }}
          />
        ) : (
          <>
            <ProfileCampaign
              highestLevel={highestLevel}
              progressPct={progressPct}
              navigate={navigate}
            />
            <ProfileAffinities
              activeAffinities={activeAffinities}
              navigate={navigate}
            />
            <ProfileInterrogations
              interrogationResults={interrogationResults}
              navigate={navigate}
            />
            <ProfileLogros
              unlockedIds={unlockedIds}
              nextAchievement={nextAchievement}
            />
          </>
        )}
      </div>

      <footer className="pp-legal-footer">
        <a href="/terms" className="pp-legal-footer__link">Términos</a>
        <span className="pp-legal-footer__sep">·</span>
        <a href="/privacy" className="pp-legal-footer__link">Privacidad</a>
        <span className="pp-legal-footer__sep">·</span>
        <span className="pp-legal-footer__copy">© 2026 EchoVerse</span>
      </footer>
    </div>
  )
}
