'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport, UIMessage } from 'ai'
import { useState, useRef, useEffect } from 'react'

const INITIAL_MESSAGES: UIMessage[] = [
  {
    id: 'welcome',
    role: 'assistant',
    parts: [{ type: 'text', text: 'Bonjour ! Quel trajet souhaitez-vous organiser ?' }],
  },
]

const QUICK_REPLIES = ['Aller simple', 'Aller-retour', 'Circuit multi-étapes']

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  )
}

function TypingDots() {
  return (
    <div className="flex justify-start">
      <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
        <div className="flex gap-1 items-center h-4">
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const [input, setInput] = useState('')
  const [quickRepliesUsed, setQuickRepliesUsed] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({ api: '/api/agent' }),
    messages: INITIAL_MESSAGES,
  })

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, status])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || status !== 'ready') return
    setQuickRepliesUsed(true)
    sendMessage({ text: input })
    setInput('')
  }

  const handleQuickReply = (text: string) => {
    if (status !== 'ready') return
    setQuickRepliesUsed(true)
    sendMessage({ text })
  }

  const isLoading = status === 'submitted' || status === 'streaming'
  const showQuickReplies = !quickRepliesUsed && !isLoading && messages.length <= 1

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Navbar */}
      <nav className="bg-zinc-900 px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
            <span className="w-3 h-3 rounded-full bg-green-200" />
          </span>
          <span className="text-white font-semibold text-lg">Neotravel</span>
        </div>
        <div className="flex items-center gap-8">
          <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Accueil</a>
          <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Services</a>
          <a href="#" className="text-gray-300 hover:text-white text-sm transition-colors">Contact</a>
        </div>
        <button className="bg-green-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-green-700 transition-colors">
          Connexion
        </button>
      </nav>

      {/* Main layout */}
      <div className="flex-1 flex items-center max-w-7xl mx-auto w-full px-8 py-12 gap-16">

        {/* Left: Hero */}
        <div className="flex-1 min-w-0">
          <h1 className="text-5xl font-black text-zinc-900 leading-tight mb-6">
            Ou partez-vous ?
          </h1>
          <p className="text-lg text-zinc-500 mb-8 leading-relaxed">
            Décrivez votre trajet, notre assistant<br />
            s'occupe du reste — devis en moins d'une heure.
          </p>
          <div className="flex gap-5 mb-12">
            <span className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              Réponse &lt; 24 h
            </span>
            <span className="flex items-center gap-2 text-sm text-zinc-700 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
              Devis gratuit
            </span>
          </div>
          {/* Bus illustration */}
          <div className="w-80 h-48 border-2 border-dashed border-gray-300 rounded-xl flex items-center justify-center bg-white">
            <span className="text-7xl select-none">🚌</span>
          </div>
        </div>

        {/* Right: Chat widget */}
        <div className="w-[460px] shrink-0 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col" style={{ height: '560px' }}>
          {/* Chat header */}
          <div className="bg-green-700 px-5 py-4 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-white font-semibold text-sm">Assistant Neotravel</span>
            </div>
            <span className="text-green-200 text-xs">en ligne</span>
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-3">
            {messages.map((message) => {
              const text = message.parts.find(p => p.type === 'text')?.text ?? ''
              const isUser = message.role === 'user'
              return (
                <div key={message.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isUser
                      ? 'bg-green-700 text-white rounded-br-sm'
                      : 'bg-gray-50 text-zinc-800 rounded-bl-sm shadow-sm'
                  }`}>
                    {text}
                  </div>
                </div>
              )
            })}

            {isLoading && <TypingDots />}

            {error && (
              <div className="text-xs text-red-500 text-center py-1">
                Une erreur est survenue. Veuillez réessayer.
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          {showQuickReplies && (
            <div className="px-5 pb-3 flex gap-2 flex-wrap shrink-0">
              {QUICK_REPLIES.map((option) => (
                <button
                  key={option}
                  onClick={() => handleQuickReply(option)}
                  className="text-xs bg-green-50 text-green-700 border border-green-200 px-3 py-1.5 rounded-full hover:bg-green-100 transition-colors"
                >
                  {option}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="px-5 py-4 border-t border-gray-100 shrink-0">
            <form onSubmit={handleSubmit} className="flex items-center gap-3">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Écrivez votre message..."
                disabled={isLoading}
                className="flex-1 text-sm text-zinc-700 placeholder:text-gray-400 bg-transparent outline-none disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="w-10 h-10 shrink-0 rounded-full bg-green-700 text-white flex items-center justify-center hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <SendIcon />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
