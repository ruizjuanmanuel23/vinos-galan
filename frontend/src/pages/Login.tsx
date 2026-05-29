import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../services/auth'
import { IMG } from '../data/catalogoDestacado'

export default function Login() {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const navigate = useNavigate()
  const location = useLocation() as any
  const from = location.state?.from || '/app'

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (login(value)) {
      navigate(from, { replace: true })
    } else {
      setError(true)
      setTimeout(() => setError(false), 600)
    }
  }

  return (
    <div className="min-h-screen bg-botella-950 relative overflow-hidden flex items-center justify-center px-4">
      {/* Fondo */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25"
        style={{ backgroundImage: `url(${IMG.cellar})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-botella-950 via-botella-900/85 to-botella-950" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex flex-col items-center gap-3 group">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-botella-600 to-botella-800 ring-2 ring-dorado-400/50 flex items-center justify-center shadow-2xl group-hover:scale-105 transition-transform">
              <span className="text-dorado-300 font-black text-2xl leading-none" style={{ fontFamily: 'Georgia, serif' }}>VG</span>
            </div>
            <div className="leading-tight">
              <div className="font-black tracking-wide text-white text-lg">VINOS GALAN</div>
              <div className="text-[10px] text-dorado-300 tracking-[0.25em] uppercase">La Plata · 1942</div>
            </div>
          </Link>
        </div>

        {/* Card */}
        <div className={`bg-botella-900/60 backdrop-blur-md border border-botella-700/60 rounded-2xl shadow-2xl p-7 ${error ? 'animate-shake' : ''}`}>
          <h1 className="text-2xl font-black text-white mb-1 text-center" style={{ fontFamily: 'Georgia, serif' }}>
            Acceso interno
          </h1>
          <p className="text-sm text-botella-300 text-center mb-6">
            Ingresá la clave del sistema
          </p>

          <form onSubmit={submit} className="space-y-4">
            <input
              type="password"
              autoComplete="off"
              autoFocus
              value={value}
              onChange={e => setValue(e.target.value)}
              placeholder="Clave de acceso"
              className={`w-full bg-botella-950/60 border-2 rounded-xl px-4 py-3.5 text-center text-white placeholder-botella-500 font-bold tracking-widest text-lg focus:outline-none transition ${
                error ? 'border-red-500 ring-2 ring-red-500/30' : 'border-botella-700 focus:border-dorado-400'
              }`}
            />
            {error && (
              <p className="text-sm text-red-400 font-semibold text-center">Clave incorrecta</p>
            )}
            <button
              type="submit"
              className="w-full px-4 py-3.5 rounded-xl text-base font-black bg-dorado-500 text-botella-950 hover:bg-dorado-400 transition shadow-xl active:scale-[0.98]"
            >
              Entrar al sistema
            </button>
          </form>
        </div>

        <div className="text-center mt-6">
          <Link to="/" className="text-sm text-botella-400 hover:text-dorado-300 transition">
            ← Volver al sitio
          </Link>
        </div>
      </div>
    </div>
  )
}
