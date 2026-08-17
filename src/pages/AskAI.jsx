import React, { useState } from 'react'
import { useLang } from '../context/LangContext'

export default function AskAI() {
  const { t } = useLang()

  const [inputQuery, setInputQuery] = useState('')
  const [chatHistory, setChatHistory] = useState([
    {
      sender: 'ai',
      text: 'Hello! I am the Feras Health Navigator AI assistant. How can I assist you with portal navigation, intake guidelines, or administrative questions today?'
    }
  ])
  const [thinking, setThinking] = useState(false)

  const samplePrompts = [
    t('aiSamplePrompt1'),
    t('aiSamplePrompt2'),
    t('aiSamplePrompt3')
  ]

  const handleSend = (textToSend = null) => {
    const query = textToSend || inputQuery
    if (!query.trim()) return

    const newHistory = [...chatHistory, { sender: 'user', text: query }]
    setChatHistory(newHistory)
    if (!textToSend) setInputQuery('')
    setThinking(true)

    setTimeout(() => {
      let reply = 'Thank you for your question. As an administrative health assistant, I recommend keeping your 8-digit patient key handy during hospital check-in. For specialized clinical diagnosis or urgent prescriptions, please consult your physician or book a consultation via the portal.'
      
      const q = query.toLowerCase()
      if (q.includes('document') || q.includes('bring') || q.includes('مستندات')) {
        reply = 'For your hospital visit, please present your 8-digit Patient Access Key card (with barcode) on your phone or printed card, your national ID / Iqama, and your insurance card if applicable.'
      } else if (q.includes('barcode') || q.includes('key') || q.includes('رمز') || q.includes('باركود')) {
        reply = 'Your unique 8-character patient key and CODE128 barcode are accessible at any time from your Patient Dashboard. You can copy the code or click "Print Card" for a physical copy.'
      } else if (q.includes('allergy') || q.includes('penicillin') || q.includes('حساسية')) {
        reply = 'Please make sure all known allergies (especially severe drug allergies like Penicillin) are clearly recorded in your Patient Intake Form. When hospital staff look up your key, allergies are automatically highlighted in a high-priority red alert banner.'
      }

      setChatHistory([...newHistory, { sender: 'ai', text: reply }])
      setThinking(false)
    }, 600)
  }

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header */}
      <div className="glass-card" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.6rem',
              color: '#FFFFFF'
            }}
          >
            🤖
          </div>
          <div>
            <h2 style={{ fontSize: '1.6rem', fontWeight: 800 }}>{t('aiPageTitle')}</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{t('aiPageSubtitle')}</p>
          </div>
        </div>

        {/* Medical Disclaimer Alert */}
        <div
          style={{
            background: 'var(--warning-soft)',
            border: '1.5px solid var(--warning)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.25rem',
            marginTop: '1rem'
          }}
        >
          <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#B45309', marginBottom: '0.25rem' }}>
            ⚠️ {t('aiDisclaimerTitle')}
          </div>
          <div style={{ fontSize: '0.825rem', color: 'var(--text-primary)', lineHeight: 1.5 }}>
            {t('aiDisclaimerText')}
          </div>
        </div>
      </div>

      {/* Interactive Chat Window */}
      <div
        className="glass-card"
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: '520px',
          overflow: 'hidden'
        }}
      >
        {/* Messages Feed */}
        <div
          style={{
            flex: 1,
            padding: '1.5rem',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {chatHistory.map((msg, index) => {
            const isUser = msg.sender === 'user'
            return (
              <div
                key={index}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  display: 'flex',
                  gap: '0.75rem',
                  flexDirection: isUser ? 'row-reverse' : 'row'
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: isUser ? 'var(--primary)' : 'var(--accent)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.85rem',
                    flexShrink: 0
                  }}
                >
                  {isUser ? '👤' : '🤖'}
                </div>

                <div
                  style={{
                    padding: '0.85rem 1.15rem',
                    borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                    background: isUser ? 'var(--primary)' : 'var(--bg-subtle)',
                    color: isUser ? '#FFFFFF' : 'var(--text-primary)',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    border: isUser ? 'none' : '1px solid var(--border-subtle)'
                  }}
                >
                  {msg.text}
                </div>
              </div>
            )
          })}

          {thinking && (
            <div style={{ display: 'flex', gap: '0.75rem', alignSelf: 'flex-start' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'var(--accent)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.85rem'
                }}
              >
                🤖
              </div>
              <div style={{ padding: '0.75rem 1rem', borderRadius: '16px', background: 'var(--bg-subtle)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {t('processing')}
              </div>
            </div>
          )}
        </div>

        {/* Sample Prompt Chips */}
        <div
          style={{
            padding: '0.75rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '0.5rem',
            overflowX: 'auto'
          }}
        >
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSend(p)}
              className="btn btn-sm btn-secondary"
              style={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}
            >
              💡 {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          style={{
            padding: '1rem 1.5rem',
            borderTop: '1px solid var(--border-subtle)',
            background: 'var(--bg-card)',
            display: 'flex',
            gap: '0.75rem'
          }}
        >
          <input
            type="text"
            className="form-input"
            placeholder={t('aiChatPlaceholder')}
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0 1.5rem' }}>
            {t('aiSend')}
          </button>
        </form>
      </div>
    </div>
  )
}
