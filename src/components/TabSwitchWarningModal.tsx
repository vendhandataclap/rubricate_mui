/**
 * TabSwitchWarningModal.tsx — Warning modal for tab switching
 * 
 * Shows blocking warning when user switches tabs.
 */
import { useEffect } from 'react'
import { AlertCircle, X } from 'lucide-react'

interface TabSwitchWarningModalProps {
  isOpen: boolean
  onDismiss: () => void
}

export default function TabSwitchWarningModal({
  isOpen,
  onDismiss,
}: TabSwitchWarningModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onDismiss()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onDismiss])

  if (!isOpen) return null

  return (
    <>
      {/* Overlay */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(2px)',
        }}
        onClick={onDismiss}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'var(--color-surface)',
          borderRadius: 'var(--radius-lg)',
          border: '2px solid var(--color-primary)',
          padding: '32px 28px',
          maxWidth: 420,
          width: '90%',
          zIndex: 1001,
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onDismiss}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: '4px',
            color: 'var(--color-text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={20} />
        </button>

        {/* Icon */}
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'var(--color-primary-light)',
              color: 'var(--color-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto',
            }}
          >
            <AlertCircle size={32} />
          </div>
        </div>

        {/* Title */}
        <h2
          style={{
            fontSize: 18,
            fontWeight: 700,
            color: 'var(--color-primary)',
            textAlign: 'center',
          }}
        >
          Tab Switch Warning
        </h2>

        {/* Message */}
        <p
          style={{
            fontSize: 14,
            color: 'var(--color-text-secondary)',
            marginBottom: 20,
            lineHeight: 1.6,
            textAlign: 'center',
          }}
        >
          Warning: Tab switching detected. Do not switch tabs again.
        </p>

        {/* Action button */}
        <button
          onClick={onDismiss}
          style={{
            width: '100%',
            padding: '12px 16px',
            fontSize: 14,
            fontWeight: 600,
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => {
            (e.target as HTMLButtonElement).style.background = 'var(--color-primary-hover)'
          }}
          onMouseLeave={e => {
            (e.target as HTMLButtonElement).style.background = 'var(--color-primary)'
          }}
        >
          Continue Assessment
        </button>
      </div>
    </>
  )
}
