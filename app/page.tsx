'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import Image from 'next/image'

function scrollTo(href: string) {
  const id = href.replace('#', '')
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function SmoothLink({ href, className, children, onClick }: {
  href: string; className?: string; children: React.ReactNode; onClick?: () => void
}) {
  return (
    <a href={href} className={className}
      onClick={e => { e.preventDefault(); scrollTo(href); onClick?.() }}>
      {children}
    </a>
  )
}

// ─────────────────────────────────────────────────────────
// SVG Icons
// ─────────────────────────────────────────────────────────

const IconGlobe = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
)
const IconCalendar = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)
const IconUsers = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
)
const IconSearch = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)
const IconSend = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)
const IconArrow = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
)
const IconMenu = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconX = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconChat = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconStar = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="#f59e0b">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)

// ─────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────

const DESTINATIONS = [
  {
    id: 1, name: 'Bali, Indonésie', country: 'Indonésie', price: '890',
    badge: 'Populaire', badgeColor: '#ef4444', rating: '4.9', reviews: 248,
    category: 'Asie', duration: '10 jours',
    img: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=900&q=85&auto=format&fit=crop',
  },
  {
    id: 2, name: 'Kyoto, Japon', country: 'Japon', price: '1 240',
    badge: 'Coup de cœur', badgeColor: '#8b5cf6', rating: '4.9', reviews: 312,
    category: 'Asie', duration: '8 jours',
    img: 'https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=900&q=85&auto=format&fit=crop',
  },
  {
    id: 3, name: 'Santorini, Grèce', country: 'Grèce', price: '750',
    badge: 'Tendance', badgeColor: '#0ea5e9', rating: '4.9', reviews: 189,
    category: 'Europe', duration: '7 jours',
    img: 'https://images.unsplash.com/photo-1613395877344-13d4a8e0d49e?w=900&q=85&auto=format&fit=crop',
  },
  {
    id: 4, name: 'Marrakech, Maroc', country: 'Maroc', price: '490',
    badge: 'Promo', badgeColor: '#f97316', rating: '4.8', reviews: 156,
    category: 'Afrique', duration: '5 jours',
    img: 'https://images.unsplash.com/photo-1597212618440-806262de4f6b?w=900&q=85&auto=format&fit=crop',
  },
  {
    id: 5, name: 'New York, USA', country: 'États-Unis', price: '1 090',
    badge: 'Nouveau', badgeColor: '#10b981', rating: '4.8', reviews: 421,
    category: 'Amériques', duration: '8 jours',
    img: 'https://images.unsplash.com/photo-1534430480872-3498386e7856?w=900&q=85&auto=format&fit=crop',
  },
  {
    id: 6, name: 'Sydney, Australie', country: 'Australie', price: '1 580',
    badge: 'Premium', badgeColor: '#6366f1', rating: '4.9', reviews: 97,
    category: 'Océanie', duration: '12 jours',
    img: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=900&q=85&auto=format&fit=crop',
  },
]

const CATEGORIES = ['Tous', 'Asie', 'Europe', 'Amériques', 'Afrique', 'Océanie']

// ─────────────────────────────────────────────────────────
// Chat hook — branché sur /api/chat (outils complets + Supabase)
// ─────────────────────────────────────────────────────────

interface ChatMsg { role: 'user' | 'assistant'; content: string }

function useChatHook() {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis votre assistant NeoTravel. Pour vous établir un devis, pouvez-vous me donner votre ville de départ et votre destination ?' },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  // demande_id retourné par enregistrer_lead, transmis à chaque appel suivant
  const demandeIdRef = useRef<string | undefined>(undefined)

  const send = useCallback(async (text?: string) => {
    const content = (text ?? input).trim()
    if (!content || loading) return
    const next: ChatMsg[] = [...msgs, { role: 'user', content }]
    setMsgs(next)
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages:   next.map(m => ({ role: m.role, content: m.content })),
          demande_id: demandeIdRef.current,
        }),
      })
      const reader = res.body?.getReader()
      const dec = new TextDecoder()
      let buf = ''
      setMsgs(prev => [...prev, { role: 'assistant', content: '' }])
      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = dec.decode(value, { stream: true })

          // Capturer demande_id injecté en fin de stream
          const idMatch = chunk.match(/\sDEMANDE_ID:([a-f0-9-]{36})\s/)
          if (idMatch) demandeIdRef.current = idMatch[1]

          buf += chunk.replace(/\sDEMANDE_ID:[a-f0-9-]{36}\s/g, '')
          setMsgs(prev => {
            const u = [...prev]
            u[u.length - 1] = { role: 'assistant', content: buf }
            return u
          })
        }
      }
    } catch {
      setMsgs(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur s'est produite. Réessayez." }])
    } finally {
      setLoading(false)
    }
  }, [msgs, input, loading])

  // Permet de pré-injecter un message (depuis la search bar)
  const sendPrefilled = useCallback((text: string) => {
    send(text)
  }, [send])

  return { msgs, input, setInput, loading, send, sendPrefilled }
}

// ─────────────────────────────────────────────────────────
// Chat Panel — style moderne
// ─────────────────────────────────────────────────────────

const QUICK = ['Aller simple', 'Aller-retour', 'Multi-étapes', 'Demande de devis']

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-1 py-1">
      {[0, 150, 300].map(d => (
        <span key={d} className="w-2 h-2 rounded-full bg-[#bbb] animate-bounce"
          style={{ animationDelay: `${d}ms`, animationDuration: '1s' }} />
      ))}
    </div>
  )
}

function ChatPanel({
  msgs, input, setInput, loading, send, onClose,
}: {
  msgs: ChatMsg[]; input: string; setInput: (v: string) => void;
  loading: boolean; send: (t?: string) => void; onClose?: () => void;
}) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)
  const showQuick = msgs.length <= 2

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs, loading])
  useEffect(() => { if (!loading) inputRef.current?.focus() }, [loading])

  return (
    <div className="flex flex-col h-full bg-white">

      {/* ── Header ── */}
      <div className="flex-shrink-0 bg-[#0f1923] px-5 py-4 flex items-center gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-10 h-10 rounded-2xl bg-[#4caf50] flex items-center justify-center shadow-lg">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a9 9 0 1 0 0 18A9 9 0 0 0 12 2z"/>
              <path d="M9 9h.01M15 9h.01M9.5 13.5c.8 1 2.1 1.5 2.5 1.5s1.7-.5 2.5-1.5"/>
            </svg>
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#22c55e] rounded-full border-2 border-[#0f1923]" />
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-white font-bold text-[14px] leading-none">NeoTravel IA</p>
          <p className="text-[#22c55e] text-[11px] font-medium mt-0.5">En ligne</p>
        </div>

        {onClose && (
          <button onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center text-white/60 hover:text-white transition-all cursor-pointer">
            <IconX />
          </button>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-4"
        style={{ background: 'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)' }}>

        {msgs.map((m, i) => {
          const isUser = m.role === 'user'
          const isLast = i === msgs.length - 1
          const showTyping = loading && isLast && !m.content

          return (
            <div key={i} className={`flex items-end gap-2.5 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
              {/* Avatar assistant */}
              {!isUser && (
                <div className="w-7 h-7 rounded-xl bg-[#0f1923] flex items-center justify-center flex-shrink-0 mb-0.5 shadow">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2a9 9 0 1 0 0 18A9 9 0 0 0 12 2z"/>
                    <path d="M9 9h.01M15 9h.01M9.5 13.5c.8 1 2.1 1.5 2.5 1.5s1.7-.5 2.5-1.5"/>
                  </svg>
                </div>
              )}

              <div className={`max-w-[76%] px-4 py-3 text-[13px] leading-relaxed shadow-sm ${
                isUser
                  ? 'bg-[#0f1923] text-white rounded-2xl rounded-br-sm'
                  : 'bg-white text-[#1a1a1a] rounded-2xl rounded-bl-sm border border-[#e8ecf0]'
              }`}>
                {showTyping ? <TypingDots /> : m.content}
              </div>
            </div>
          )
        })}

        {/* Typing quand user vient d'envoyer */}
        {loading && msgs[msgs.length - 1]?.role === 'user' && (
          <div className="flex items-end gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-[#0f1923] flex items-center justify-center flex-shrink-0 shadow">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a9 9 0 1 0 0 18A9 9 0 0 0 12 2z"/>
                <path d="M9 9h.01M15 9h.01M9.5 13.5c.8 1 2.1 1.5 2.5 1.5s1.7-.5 2.5-1.5"/>
              </svg>
            </div>
            <div className="bg-white rounded-2xl rounded-bl-sm border border-[#e8ecf0] px-4 py-3 shadow-sm">
              <TypingDots />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Quick replies ── */}
      {showQuick && (
        <div className="flex-shrink-0 px-4 py-2.5 bg-white border-t border-[#f0f0f0] flex flex-wrap gap-1.5">
          {QUICK.map(r => (
            <button key={r} onClick={() => send(r)} disabled={loading}
              className="text-[11px] font-medium text-[#374151] bg-[#f3f4f6] hover:bg-[#4caf50] hover:text-white border border-[#e5e7eb] hover:border-[#4caf50] rounded-full px-3 py-1.5 transition-all cursor-pointer disabled:opacity-40">
              {r}
            </button>
          ))}
        </div>
      )}

      {/* ── Input ── */}
      <div className="flex-shrink-0 bg-white border-t border-[#f0f0f0] px-4 py-3 flex items-center gap-2">
        <div className="flex-1 flex items-center bg-[#f8fafc] border border-[#e5e7eb] rounded-2xl px-4 py-2.5 gap-2 focus-within:border-[#4caf50] focus-within:ring-2 focus-within:ring-[#4caf50]/10 transition-all">
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Votre message…"
            disabled={loading}
            className="flex-1 text-[13px] text-[#1a1a1a] outline-none bg-transparent placeholder:text-[#9ca3af] disabled:opacity-50"
          />
        </div>
        <button onClick={() => send()} disabled={loading || !input.trim()}
          className="w-10 h-10 flex-shrink-0 rounded-2xl bg-[#4caf50] hover:bg-[#3d9944] disabled:bg-[#d1fae5] disabled:text-[#6ee7b7] flex items-center justify-center text-white transition-all cursor-pointer shadow-sm active:scale-95">
          <IconSend />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Floating Chat Button
// ─────────────────────────────────────────────────────────

function FloatingChat({ chatState }: { chatState: ReturnType<typeof useChatHook> }) {
  const [open, setOpen] = useState(false)
  const unread = !open && chatState.msgs.length > 1

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Panel */}
      {open && (
        <div className="w-[380px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] overflow-hidden border border-[#e0e0e0]"
          style={{ height: 520 }}>
          <ChatPanel {...chatState} onClose={() => setOpen(false)} />
        </div>
      )}

      {/* Bubble */}
      <button onClick={() => setOpen(v => !v)}
        className="relative w-14 h-14 bg-[#2e7d32] hover:bg-[#1b5e20] rounded-full shadow-[0_8px_30px_rgba(46,125,50,0.5)] flex items-center justify-center text-white transition-all cursor-pointer hover:scale-110 active:scale-95">
        <div className={`transition-all duration-200 ${open ? 'opacity-0 scale-75 absolute' : 'opacity-100 scale-100'}`}>
          <IconChat />
        </div>
        <div className={`transition-all duration-200 ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-75 absolute'}`}>
          <IconX />
        </div>
        {unread && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#ef4444] rounded-full border-2 border-white animate-pulse" />
        )}
      </button>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Navbar
// ─────────────────────────────────────────────────────────

function Navbar({ onChatOpen }: { onChatOpen: () => void }) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', fn, { passive: true })
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const links = [
    { label: 'Destinations', href: '#destinations' },
    { label: 'Expériences', href: '#experiences' },
    { label: 'Offres', href: '#offres' },
    { label: 'À propos', href: '#apropos' },
  ]

  return (
    <header className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
      scrolled
        ? 'bg-[#0d0d0d]/96 backdrop-blur-xl shadow-[0_1px_0_rgba(255,255,255,0.06)]'
        : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10 h-[72px] flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#2e7d32] flex items-center justify-center flex-shrink-0">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
              <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
              <circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
            </svg>
          </div>
          <span className="text-white font-extrabold text-[18px] tracking-tight">NEOTRAVEL</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {links.map(l => (
            <SmoothLink key={l.label} href={l.href}
              className="text-white/65 hover:text-white text-[14px] font-medium transition-colors">
              {l.label}
            </SmoothLink>
          ))}
        </nav>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <button
            onClick={onChatOpen}
            className="hidden sm:inline-flex items-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white text-[13px] font-bold px-5 py-2.5 rounded-full transition-colors shadow-[0_4px_12px_rgba(76,175,80,0.4)]">
            <IconChat />
            Réserver
          </button>
          <button onClick={() => setMobileOpen(v => !v)} className="md:hidden text-white cursor-pointer p-1">
            {mobileOpen ? <IconX /> : <IconMenu />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-[#0d0d0d]/98 backdrop-blur-xl border-t border-white/8 px-6 py-6 space-y-4">
          {links.map(l => (
            <SmoothLink key={l.label} href={l.href} onClick={() => setMobileOpen(false)}
              className="block text-white/70 hover:text-white text-[16px] py-1.5 transition-colors">
              {l.label}
            </SmoothLink>
          ))}
          <button onClick={() => { onChatOpen(); setMobileOpen(false) }}
            className="w-full bg-[#4caf50] text-white font-bold px-5 py-3.5 rounded-full flex items-center justify-center gap-2 mt-2">
            <IconChat /> Réserver
          </button>
        </div>
      )}
    </header>
  )
}

// ─────────────────────────────────────────────────────────
// Hero
// ─────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────
// Illustration autocar + stats (côté droit du hero)
// ─────────────────────────────────────────────────────────

function HeroIllustration({ onOpen }: { onOpen: () => void }) {
  return (
    <div className="relative w-full flex flex-col items-center gap-6">
      {/* Carte principale avec le bus SVG */}
      <div className="relative w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-6 overflow-hidden">
        {/* Fond dégradé décoratif */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1b5e20]/30 to-transparent rounded-3xl" />

        {/* SVG Autocar */}
        <svg viewBox="0 0 480 200" className="w-full relative z-10" style={{ filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.4))' }}>
          {/* Route */}
          <rect x="0" y="168" width="480" height="32" rx="4" fill="#1a2332"/>
          <rect x="0" y="168" width="480" height="4" fill="#243044"/>
          {/* Marquages route */}
          <rect x="40" y="179" width="40" height="4" rx="2" fill="#4a5568" opacity="0.5"/>
          <rect x="140" y="179" width="40" height="4" rx="2" fill="#4a5568" opacity="0.5"/>
          <rect x="240" y="179" width="40" height="4" rx="2" fill="#4a5568" opacity="0.5"/>
          <rect x="340" y="179" width="40" height="4" rx="2" fill="#4a5568" opacity="0.5"/>
          <rect x="420" y="179" width="40" height="4" rx="2" fill="#4a5568" opacity="0.5"/>

          {/* Carrosserie principale */}
          <rect x="30" y="80" width="420" height="88" rx="14" fill="#1e293b"/>
          {/* Flanc blanc/gris */}
          <rect x="30" y="108" width="420" height="36" fill="#f8fafc" opacity="0.06"/>

          {/* Bande verte décorative */}
          <rect x="30" y="104" width="420" height="6" fill="#4caf50"/>
          <rect x="30" y="148" width="420" height="4" rx="2" fill="#4caf50" opacity="0.4"/>

          {/* Avant arrondi */}
          <path d="M30 80 Q18 80 18 94 L18 155 Q18 168 30 168 L30 80Z" fill="#1e293b"/>
          <path d="M18 94 Q18 80 30 80" fill="none" stroke="#4caf50" strokeWidth="2"/>

          {/* Arrière arrondi */}
          <path d="M450 80 Q462 80 462 94 L462 155 Q462 168 450 168 L450 80Z" fill="#1e293b"/>

          {/* Pare-brise avant */}
          <path d="M18 118 L18 148 Q18 155 28 155 L52 155 L52 108 L28 108 Q18 108 18 118Z" fill="#0ea5e9" opacity="0.6"/>
          <path d="M18 118 L18 148 Q18 155 28 155 L52 155 L52 108 L28 108 Q18 108 18 118Z" fill="none" stroke="white" strokeWidth="1.5" opacity="0.3"/>
          {/* Reflet pare-brise */}
          <path d="M24 114 L32 108" stroke="white" strokeWidth="1" opacity="0.3"/>

          {/* Fenêtres voyageurs */}
          {[70, 120, 170, 220, 270, 320, 370].map((x, i) => (
            <g key={i}>
              <rect x={x} y="88" width="38" height="28" rx="5" fill="#0ea5e9" opacity="0.55"/>
              <rect x={x} y="88" width="38" height="28" rx="5" fill="none" stroke="white" strokeWidth="1" opacity="0.2"/>
              {/* Reflet fenêtre */}
              <rect x={x + 4} y="92" width="8" height="3" rx="1.5" fill="white" opacity="0.25"/>
            </g>
          ))}

          {/* Logo NEOTRAVEL sur le flanc */}
          <text x="165" y="140" fontFamily="Arial" fontWeight="bold" fontSize="18" fill="#4caf50" opacity="0.9">NEOTRAVEL</text>

          {/* Roues */}
          {/* Roue avant */}
          <circle cx="90" cy="168" r="20" fill="#0f172a"/>
          <circle cx="90" cy="168" r="14" fill="#1e293b"/>
          <circle cx="90" cy="168" r="7" fill="#374151"/>
          <circle cx="90" cy="168" r="3" fill="#4caf50"/>
          {/* Rayons */}
          {[0,60,120,180,240,300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            return <line key={i} x1={90 + 7 * Math.cos(rad)} y1={168 + 7 * Math.sin(rad)}
              x2={90 + 14 * Math.cos(rad)} y2={168 + 14 * Math.sin(rad)}
              stroke="#4b5563" strokeWidth="1.5"/>
          })}

          {/* Roue arrière */}
          <circle cx="390" cy="168" r="20" fill="#0f172a"/>
          <circle cx="390" cy="168" r="14" fill="#1e293b"/>
          <circle cx="390" cy="168" r="7" fill="#374151"/>
          <circle cx="390" cy="168" r="3" fill="#4caf50"/>
          {[0,60,120,180,240,300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180
            return <line key={i} x1={390 + 7 * Math.cos(rad)} y1={168 + 7 * Math.sin(rad)}
              x2={390 + 14 * Math.cos(rad)} y2={168 + 14 * Math.sin(rad)}
              stroke="#4b5563" strokeWidth="1.5"/>
          })}

          {/* Feux avant */}
          <rect x="18" y="100" width="10" height="8" rx="3" fill="#fbbf24" opacity="0.9"/>
          <rect x="18" y="112" width="10" height="5" rx="2.5" fill="#f97316" opacity="0.7"/>
          {/* Feux arrière */}
          <rect x="452" y="100" width="10" height="8" rx="3" fill="#ef4444" opacity="0.9"/>
          <rect x="452" y="112" width="10" height="5" rx="2.5" fill="#ef4444" opacity="0.6"/>

          {/* Porte */}
          <rect x="56" y="110" width="22" height="45" rx="4" fill="#1a2e3b" stroke="white" strokeWidth="0.5" opacity="0.5"/>
          <circle cx="75" cy="133" r="2" fill="#4caf50" opacity="0.7"/>

          {/* Faisceau lumineux (phares) */}
          <path d="M18 102 L0 90 L0 115 Z" fill="#fbbf24" opacity="0.08"/>
        </svg>

        {/* Badge "En service" */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-[#4caf50]/20 border border-[#4caf50]/30 rounded-full px-3 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#4caf50] animate-pulse" />
          <span className="text-[#4caf50] text-[11px] font-semibold">En service</span>
        </div>
      </div>

      {/* Cartes info */}
      <div className="grid grid-cols-3 gap-3 w-full">
        {[
          { label: 'Confort', value: '5★', color: '#f59e0b' },
          { label: 'Capacité', value: '50–90', color: '#4caf50' },
          { label: 'Ponctualité', value: '98%', color: '#0ea5e9' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-3 py-3 text-center">
            <p className="text-white font-extrabold text-[18px]" style={{ color }}>{value}</p>
            <p className="text-white/50 text-[11px] mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* CTA discret */}
      <button onClick={onOpen}
        className="w-full flex items-center justify-center gap-2 bg-[#4caf50] hover:bg-[#43a047] text-white font-bold text-[14px] py-3.5 rounded-2xl transition-all shadow-[0_8px_20px_rgba(76,175,80,0.35)] hover:-translate-y-0.5 cursor-pointer">
        <IconChat /> Obtenir mon devis gratuitement
      </button>
    </div>
  )
}

function Hero({ onChatOpen }: { onChatOpen: () => void }) {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden bg-[#0d0d0d]">
      {/* Background image — visible uniquement sur tablette/desktop */}
      <div className="absolute inset-0">
        <Image
          src="https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1800&q=85&auto=format&fit=crop"
          alt="Voyageurs sur la route"
          fill
          className="object-cover object-center"
          priority
          unoptimized
        />
        {/* Mobile: dark overlay fort */}
        <div className="absolute inset-0 bg-[#0d0d0d]/85 md:bg-transparent" />
        {/* Desktop: gradient gauche fort, droite léger */}
        <div className="absolute inset-0 hidden md:block bg-gradient-to-r from-[#0d0d0d] via-[#0d0d0d]/75 to-[#0d0d0d]/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0d0d0d] via-transparent to-[#0d0d0d]/40" />
      </div>

      {/* Content grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 pt-24 pb-16 sm:pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: texte ── */}
          <div>
            <div className="inline-flex items-center gap-2 bg-[#2e7d32]/90 backdrop-blur-sm text-white text-[11px] sm:text-[12px] font-semibold px-4 py-2 rounded-full mb-6 border border-white/10">
              <span className="w-1.5 h-1.5 rounded-full bg-[#69f0ae] animate-pulse flex-shrink-0" />
              Transport de groupes — Depuis 2019
            </div>

            <h1 className="text-[44px] sm:text-[58px] lg:text-[70px] xl:text-[80px] font-extrabold text-white leading-[1.0] tracking-tight mb-5 sm:mb-7">
              Explorez le<br />
              <span className="text-[#4caf50]">monde</span><br />
              sans limites.
            </h1>

            <p className="text-white/65 text-[15px] sm:text-[17px] leading-relaxed mb-8 max-w-md">
              Des expériences de voyage uniques pour groupes, pensées pour les aventuriers modernes.
              Obtenez votre devis en quelques minutes.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-3 mb-10 sm:mb-12">
              <button onClick={onChatOpen}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 bg-[#4caf50] hover:bg-[#43a047] text-white text-[15px] font-bold px-7 py-4 rounded-full transition-all shadow-[0_8px_30px_rgba(76,175,80,0.4)] hover:shadow-[0_12px_40px_rgba(76,175,80,0.5)] hover:-translate-y-0.5 active:translate-y-0">
                Obtenir un devis <IconArrow />
              </button>
              <SmoothLink href="#destinations"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-white/25 hover:border-white/50 text-white text-[14px] font-medium px-7 py-4 rounded-full transition-all hover:bg-white/5">
                Voir les destinations
              </SmoothLink>
            </div>

            {/* Stats — 2 cols mobile, 4 cols desktop */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
              {[
                { value: '120+', label: 'Destinations' },
                { value: '50K+', label: 'Voyageurs' },
                { value: '4.9 / 5', label: 'Note client' },
                { value: '< 1h', label: 'Délai de devis' },
              ].map(({ value, label }) => (
                <div key={label} className="border-l-2 border-[#4caf50] pl-3">
                  <p className="text-white text-[18px] sm:text-[20px] font-extrabold leading-none">{value}</p>
                  <p className="text-white/40 text-[11px] mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Right: illustration autocar — caché sur mobile, visible iPad+ ── */}
          <div className="hidden md:flex items-center justify-center lg:justify-end">
            <div className="w-full max-w-[420px]">
              <HeroIllustration onOpen={onChatOpen} />
            </div>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center text-white/25 animate-bounce pointer-events-none">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Search Bar
// ─────────────────────────────────────────────────────────

function SearchBar({ onSearch }: { onSearch: (msg: string) => void }) {
  const [destination, setDestination] = useState('')
  const [date, setDate] = useState('')
  const [travelers, setTravelers] = useState('2')

  function handleSearch() {
    const parts: string[] = []
    if (destination.trim()) parts.push(`destination : ${destination.trim()}`)
    if (date) {
      const d = new Date(date)
      parts.push(`date de départ : ${d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`)
    }
    if (travelers) parts.push(`${travelers} voyageurs`)

    const msg = parts.length
      ? `Bonjour, je souhaite organiser un trajet en autocar — ${parts.join(', ')}. Pouvez-vous m'établir un devis ?`
      : "Bonjour, je souhaite organiser un trajet en autocar. Pouvez-vous m'aider ?"

    onSearch(msg)
  }

  return (
    <section className="bg-[#e8f5e9] py-5 sm:py-6 border-b border-[#c8e6c9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10">
        <div className="bg-white rounded-2xl shadow-[0_4px_30px_rgba(0,0,0,0.08)] p-2 flex flex-col sm:flex-row gap-1 sm:gap-2">
          {/* Destination */}
          <div className="flex items-center gap-3 px-4 py-3 flex-1 rounded-xl hover:bg-[#f5f5f5] transition-colors">
            <span className="text-[#4caf50] flex-shrink-0"><IconGlobe /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest mb-0.5 hidden sm:block">Destination</p>
              <input value={destination} onChange={e => setDestination(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Où allez-vous ?"
                className="w-full text-[14px] text-[#1a1a1a] font-medium outline-none bg-transparent placeholder:text-[#bbb] placeholder:font-normal" />
            </div>
          </div>

          <div className="h-px sm:h-auto sm:w-px bg-[#e8e8e8] mx-3 sm:mx-0 sm:my-2" />

          {/* Date */}
          <div className="flex items-center gap-3 px-4 py-3 flex-1 rounded-xl hover:bg-[#f5f5f5] transition-colors">
            <span className="text-[#4caf50] flex-shrink-0"><IconCalendar /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest mb-0.5 hidden sm:block">Date de départ</p>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full text-[14px] text-[#1a1a1a] font-medium outline-none bg-transparent cursor-pointer"
                style={{ colorScheme: 'light' }} />
            </div>
          </div>

          <div className="h-px sm:h-auto sm:w-px bg-[#e8e8e8] mx-3 sm:mx-0 sm:my-2" />

          {/* Voyageurs */}
          <div className="flex items-center gap-3 px-4 py-3 flex-1 rounded-xl hover:bg-[#f5f5f5] transition-colors">
            <span className="text-[#4caf50] flex-shrink-0"><IconUsers /></span>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-[#9e9e9e] uppercase tracking-widest mb-0.5 hidden sm:block">Voyageurs</p>
              <input type="number" min="1" max="500" value={travelers} onChange={e => setTravelers(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="Nb de personnes"
                className="w-full text-[14px] text-[#1a1a1a] font-medium outline-none bg-transparent placeholder:text-[#bbb] placeholder:font-normal" />
            </div>
          </div>

          {/* Button */}
          <button onClick={handleSearch}
            className="bg-[#4caf50] hover:bg-[#43a047] text-white font-bold px-6 py-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-[14px] shadow-[0_4px_12px_rgba(76,175,80,0.35)] hover:shadow-[0_6px_20px_rgba(76,175,80,0.45)] whitespace-nowrap">
            <IconSearch /> <span className="hidden xs:inline">Rechercher</span>
          </button>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Destination Card
// ─────────────────────────────────────────────────────────

function DestCard({ dest, onBook }: { dest: typeof DESTINATIONS[0]; onBook: () => void }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.07)] hover:shadow-[0_8px_36px_rgba(0,0,0,0.14)] transition-all duration-300 group hover:-translate-y-1 border border-[#f0f0f0]">
      {/* Image */}
      <div className="relative h-52 overflow-hidden">
        <Image src={dest.img} alt={dest.name} fill className="object-cover group-hover:scale-108 transition-transform duration-700"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />

        {/* Badge */}
        <span className="absolute top-3 left-3 text-[11px] font-bold text-white px-3 py-1 rounded-full"
          style={{ backgroundColor: dest.badgeColor }}>
          {dest.badge}
        </span>

        {/* Duration */}
        <span className="absolute top-3 right-3 text-[11px] font-medium text-white bg-black/40 backdrop-blur-sm px-2.5 py-1 rounded-full">
          {dest.duration}
        </span>
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <h3 className="text-[17px] font-extrabold text-[#1a1a1a] leading-tight">{dest.name}</h3>
            <div className="flex items-center gap-1 text-[#9e9e9e] text-[12px] mt-0.5">
              <IconMapPin /> {dest.country}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-[11px] text-[#9e9e9e]">à partir de</p>
            <p className="text-[#2e7d32] font-extrabold text-[19px] leading-tight">{dest.price} €</p>
          </div>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1.5 mb-4">
          <div className="flex items-center gap-0.5">
            {[...Array(5)].map((_, i) => <IconStar key={i} />)}
          </div>
          <span className="text-[13px] font-bold text-[#f59e0b]">{dest.rating}</span>
          <span className="text-[12px] text-[#9e9e9e]">({dest.reviews} avis)</span>
        </div>

        {/* CTA */}
        <button onClick={onBook}
          className="w-full bg-[#4caf50] hover:bg-[#43a047] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer text-[13px] shadow-sm hover:shadow-md">
          Découvrir et réserver <IconArrow />
        </button>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────
// Destinations Section
// ─────────────────────────────────────────────────────────

function DestinationsSection({ onBook }: { onBook: () => void }) {
  const [filter, setFilter] = useState('Tous')
  const filtered = filter === 'Tous' ? DESTINATIONS : DESTINATIONS.filter(d => d.category === filter)

  return (
    <section id="destinations" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] text-[12px] font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
              Coups de coeur
            </span>
            <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#1a1a1a] leading-tight">
              Destinations populaires
            </h2>
            <p className="text-[#6b7280] text-[16px] mt-2 max-w-lg">
              Partez à la découverte de nos destinations les plus prisées, soigneusement sélectionnées pour les groupes.
            </p>
          </div>
          <a href="#" className="hidden md:flex items-center gap-2 text-[#4caf50] hover:text-[#2e7d32] font-semibold text-[14px] transition-colors whitespace-nowrap">
            Toutes les destinations <IconArrow />
          </a>
        </div>

        {/* Filter tabs */}
        <div className="flex flex-wrap gap-2 mb-8 p-1 bg-[#f5f5f5] rounded-2xl w-fit">
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-5 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 cursor-pointer ${
                filter === cat
                  ? 'bg-white text-[#1a1a1a] shadow-sm'
                  : 'text-[#6b7280] hover:text-[#1a1a1a]'
              }`}>
              {cat}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {filtered.length > 0 ? filtered.map(d => (
            <DestCard key={d.id} dest={d} onBook={onBook} />
          )) : (
            <div className="col-span-full text-center py-20">
              <p className="text-[#9e9e9e] text-[16px]">Aucune destination dans cette région pour le moment.</p>
              <button onClick={() => setFilter('Tous')} className="mt-4 text-[#4caf50] font-semibold hover:underline cursor-pointer">
                Voir toutes les destinations
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Why section
// ─────────────────────────────────────────────────────────

function WhySection() {
  const items = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
        </svg>
      ),
      title: 'Devis en moins d\'une heure',
      desc: 'Notre IA collecte vos besoins et génère un devis personnalisé en quelques minutes.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      title: 'Spécialiste des groupes',
      desc: 'De 10 à 500 personnes, nous gérons tous les types de voyages collectifs.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Sécurité et fiabilité',
      desc: 'Chauffeurs certifiés, véhicules assurés, suivi en temps réel de votre trajet.',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      ),
      title: 'Accompagnement 24/7',
      desc: 'Une équipe dédiée vous accompagne avant, pendant et après votre voyage.',
    },
  ]

  return (
    <section id="experiences" className="py-16 sm:py-24 px-4 sm:px-6 lg:px-10 bg-[#f9fafb]">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <span className="inline-block bg-[#e8f5e9] text-[#2e7d32] text-[12px] font-bold px-4 py-1.5 rounded-full mb-4 uppercase tracking-wider">
            Pourquoi NeoTravel
          </span>
          <h2 className="text-[36px] md:text-[44px] font-extrabold text-[#1a1a1a]">
            Le voyage de groupe réinventé
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map(({ icon, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl p-6 border border-[#eee] hover:border-[#4caf50]/30 hover:shadow-md transition-all">
              <div className="w-12 h-12 bg-[#e8f5e9] text-[#2e7d32] rounded-xl flex items-center justify-center mb-4">
                {icon}
              </div>
              <h3 className="font-bold text-[16px] text-[#1a1a1a] mb-2">{title}</h3>
              <p className="text-[#6b7280] text-[13px] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// CTA Banner
// ─────────────────────────────────────────────────────────

function CTABanner({ onBook }: { onBook: () => void }) {
  return (
    <section className="px-4 sm:px-6 lg:px-10 py-14 sm:py-20 bg-white" id="offres">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-gradient-to-br from-[#1b5e20] to-[#388e3c] rounded-3xl overflow-hidden px-8 md:px-16 py-16">
          {/* Decorative blobs */}
          <div className="absolute -right-20 -top-20 w-72 h-72 rounded-full bg-white/5" />
          <div className="absolute right-40 -bottom-16 w-48 h-48 rounded-full bg-white/5" />
          <div className="absolute right-10 top-10 w-32 h-32 rounded-full bg-[#4caf50]/20" />

          <div className="relative z-10 max-w-xl">
            <p className="text-[#a5d6a7] font-semibold text-[13px] uppercase tracking-widest mb-4">
              Prêt à partir ?
            </p>
            <h2 className="text-white text-[32px] md:text-[42px] font-extrabold leading-tight mb-4">
              Votre prochaine aventure commence ici
            </h2>
            <p className="text-white/65 text-[16px] mb-8 leading-relaxed">
              Rejoignez 50 000 voyageurs qui ont choisi NEOTRAVEL pour leurs déplacements de groupe.
            </p>
            <div className="flex flex-wrap gap-4">
              <button onClick={onBook}
                className="inline-flex items-center gap-2 bg-white text-[#1b5e20] font-bold text-[15px] px-7 py-4 rounded-full hover:bg-[#f1f8e9] transition-all shadow-lg cursor-pointer">
                Obtenir un devis gratuit <IconArrow />
              </button>
              <SmoothLink href="#destinations"
                className="inline-flex items-center gap-2 border border-white/30 text-white font-medium text-[14px] px-7 py-4 rounded-full hover:bg-white/10 transition-all">
                Voir les offres
              </SmoothLink>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="bg-[#0d0d0d] py-14 px-6 lg:px-10" id="apropos">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-white/8">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#2e7d32] flex items-center justify-center">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/>
                  <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
                  <circle cx="7" cy="18" r="2"/><circle cx="15" cy="18" r="2"/>
                </svg>
              </div>
              <span className="text-white font-extrabold text-[18px]">NEOTRAVEL</span>
            </div>
            <p className="text-white/40 text-[13px] leading-relaxed max-w-xs">
              Transport de groupes premium. Voyages sur mesure pour entreprises, associations et particuliers.
            </p>
          </div>
          <div>
            <p className="text-white font-semibold text-[13px] mb-4">Navigation</p>
            <div className="space-y-2.5">
              {['Destinations', 'Expériences', 'Offres', 'À propos'].map(l => (
                <a key={l} href="#" className="block text-white/40 hover:text-white text-[13px] transition-colors">{l}</a>
              ))}
            </div>
          </div>
          <div>
            <p className="text-white font-semibold text-[13px] mb-4">Légal</p>
            <div className="space-y-2.5">
              {['Mentions légales', 'Confidentialité', 'CGV', 'Contact'].map(l => (
                <a key={l} href="#" className="block text-white/40 hover:text-white text-[13px] transition-colors">{l}</a>
              ))}
            </div>
          </div>
        </div>
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-white/25 text-[12px]">© 2026 NEOTRAVEL — Tous droits réservés.</p>
          <p className="text-white/25 text-[12px]">Fait avec soin pour les voyageurs modernes.</p>
        </div>
      </div>
    </footer>
  )
}

// ─────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────

export default function HomePage() {
  const chatState = useChatHook()
  const [chatOpen, setChatOpen] = useState(false)

  const openChat = useCallback(() => setChatOpen(true), [])

  const handleSearch = useCallback((msg: string) => {
    setChatOpen(true)
    // Petit délai pour que le panel soit monté avant d'envoyer
    setTimeout(() => chatState.sendPrefilled(msg), 80)
  }, [chatState])

  return (
    <div className="bg-white min-h-screen">
      <Navbar onChatOpen={openChat} />
      <Hero onChatOpen={openChat} />
      <SearchBar onSearch={handleSearch} />
      <DestinationsSection onBook={openChat} />
      <WhySection />
      <CTABanner onBook={openChat} />
      <Footer />

      {/* Chat panel — mobile: plein écran / tablet+: panneau flottant */}
      {chatOpen && (
        <>
          {/* Backdrop mobile seulement */}
          <div className="fixed inset-0 bg-black/40 z-40 sm:hidden" onClick={() => setChatOpen(false)} />

          {/* Mobile: sheet du bas */}
          <div className="fixed sm:hidden inset-x-0 bottom-0 z-50 bg-white rounded-t-3xl shadow-[0_-8px_40px_rgba(0,0,0,0.2)] overflow-hidden"
            style={{ height: '88dvh' }}>
            <div className="w-10 h-1 bg-[#ddd] rounded-full mx-auto mt-3 mb-1" />
            <div className="h-full pb-6">
              <ChatPanel {...chatState} onClose={() => setChatOpen(false)} />
            </div>
          </div>

          {/* Tablet / Desktop: panneau flottant */}
          <div className="hidden sm:block fixed bottom-24 right-4 sm:right-6 z-50 w-[90vw] max-w-[400px] bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.22)] overflow-hidden border border-[#e5e5e5]"
            style={{ height: 560 }}>
            <ChatPanel {...chatState} onClose={() => setChatOpen(false)} />
          </div>
        </>
      )}

      {/* Floating bubble */}
      <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50">
        <button onClick={() => setChatOpen(v => !v)}
          className="relative w-14 h-14 sm:w-[60px] sm:h-[60px] bg-[#2e7d32] hover:bg-[#1b5e20] rounded-full shadow-[0_8px_30px_rgba(46,125,50,0.55)] flex items-center justify-center text-white transition-all cursor-pointer hover:scale-110 active:scale-95">
          <span className={`absolute transition-all duration-200 ${chatOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`}>
            <IconChat />
          </span>
          <span className={`absolute transition-all duration-200 ${chatOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`}>
            <IconX />
          </span>
          {!chatOpen && (
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-[#69f0ae] rounded-full border-2 border-white animate-pulse" />
          )}
        </button>
      </div>
    </div>
  )
}
