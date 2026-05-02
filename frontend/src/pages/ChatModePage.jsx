import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ROUTES, chatHistoryKey } from '../utils/constants'
import { getUserRankName } from '../utils/affinity'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { supabase } from '../lib/supabase'
import { getRecentChats } from './chatMode/utils.js'
import ChatModeHeader from './chatMode/ChatModeHeader.jsx'
import ChatInbox from './chatMode/ChatInbox.jsx'
import ChatCustomChars from './chatMode/ChatCustomChars.jsx'
import ChatAllChars from './chatMode/ChatAllChars.jsx'
import './ChatModePage.css'

export default function ChatModePage() {
  const navigate = useNavigate()
  const { session } = useAuth()
  const { showConfirm } = useToast()
  const userRank = getUserRankName()

  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [recentChats, setRecentChats] = useState(() => getRecentChats())
  const [activeTab, setActiveTab] = useState(recentChats.length > 0 ? 'recent' : 'all')
  const [customChars, setCustomChars] = useState([])
  const [communityChars, setCommunityChars] = useState([])
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  useEffect(() => {
    if (!session) return
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, welcome_message, created_at')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCustomChars(data ?? []))
  }, [session])

  useEffect(() => {
    if (!session) return
    supabase
      .from('custom_characters')
      .select('id, name, emoji, color, avatar_url, welcome_message, created_at')
      .eq('is_public', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => setCommunityChars(data ?? []))
  }, [session])

  function handleSelect(characterId) {
    setSelectedId(characterId)
    setExiting(true)
    setTimeout(() => navigate(ROUTES.CHAT_CHARACTER(characterId)), 260)
  }

  function handleDeleteChat(charId, e) {
    e.stopPropagation()
    localStorage.removeItem(chatHistoryKey(charId))
    const updated = recentChats.filter(r => r.char.id !== charId)
    setRecentChats(updated)
    if (updated.length === 0) setActiveTab('all')
  }

  function goToDuo() {
    setExiting(true)
    setTimeout(() => navigate(ROUTES.DUO), 260)
  }

  function handleDeleteCustomChar(id, e) {
    e.stopPropagation()
    showConfirm('¿Eliminar este personaje?', async () => {
      setDeletingId(id)
      await supabase
        .from('custom_characters')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)
      setCustomChars(prev => prev.filter(c => c.id !== id))
      setDeletingId(null)
    })
  }

  return (
    <div className={`chat-mode ${visible ? 'chat-mode--visible' : ''} ${exiting ? 'chat-mode--exiting' : ''}`}>
      <ChatModeHeader
        navigate={navigate}
        recentChats={recentChats}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onGoDuo={goToDuo}
        session={session}
      />

      {activeTab === 'recent' && (
        <ChatInbox
          recentChats={recentChats}
          onSelect={handleSelect}
          onDeleteChat={handleDeleteChat}
        />
      )}

      {activeTab === 'custom' && (
        <ChatCustomChars
          customChars={customChars}
          deletingId={deletingId}
          onSelect={handleSelect}
          onDelete={handleDeleteCustomChar}
          navigate={navigate}
        />
      )}

      {activeTab === 'all' && (
        <ChatAllChars
          search={search}
          selectedCategory={selectedCategory}
          selectedId={selectedId}
          onSearch={setSearch}
          onSelectCategory={setSelectedCategory}
          onSelect={handleSelect}
          session={session}
          userRank={userRank}
          communityChars={communityChars}
        />
      )}
    </div>
  )
}
