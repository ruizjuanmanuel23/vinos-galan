import { useEffect, useRef, useState } from 'react'
import { login } from '../services/auth'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  title?: string
  subtitle?: string
}

export default function PasswordModal({
  open, onClose, onSuccess,
  title = 'Acceso restringido',
  subtitle = 'Ingresá la clave para continuar',
}: Props) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      setValue('')
      setError(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  if (!open) return null

  const submit = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (login(value)) {
      onSuccess()
      onClose()
    } else {
      setError(true)
      setTimeout(() => setError(false), 600)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className={`w-full max-w-sm bg-botella-900 border border-botella-700 rounded-2xl shadow-2xl overflow-hidden ${error ? 'animate-shake' : ''}`}
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 sm:p-7 text-center">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-dorado-500/20 border border-dorado-500/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-dorado-300" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white mb-1" style={{ fontFamily: 'Georgia, serif' }}>{title}</h2>
          <p className="text-sm text-botella-300 mb-5">{subtitle}</p>

          <form onSubmit={submit} className="space-y-3">
            <input
              ref={inputRef}
              type="password"
              autoComplete="off"
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Clave"
              className={`w-full bg-botella-950/60 border-2 rounded-xl px-4 py-3 text-center text-white placeholder-botella-500 font-bold tracking-widest text-lg focus:outline-none transition ${
                error ? 'border-red-500 ring-2 ring-red-500/30' : 'border-botella-700 focus:border-dorado-400'
              }`}
            />
            {error && (
              <p className="text-xs text-red-400 font-semibold">Clave incorrecta</p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold text-botella-200 hover:bg-botella-800/50 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold bg-dorado-500 text-botella-950 hover:bg-dorado-400 transition"
              >
                Entrar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
