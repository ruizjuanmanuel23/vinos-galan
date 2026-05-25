import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import { diaSemanaHoy, DIA_LABEL, type Cliente, type Viaje } from '../types'

export default function Inicio() {
  const [clientesHoy, setClientesHoy] = useState<Cliente[]>([])
  const [viajeActivo, setViajeActivo] = useState<Viaje | null>(null)
  const [stats, setStats] = useState({ clientes: 0, vinos: 0, stockBajo: 0, viajes: 0 })
  const dia = diaSemanaHoy()
  const hoy = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

  useEffect(() => {
    api.get<Cliente[]>(`/clientes/dia/${dia}`).then(r => setClientesHoy(r.data)).catch(() => {})
    api.get<Viaje[]>('/viajes').then(r => {
      const enCurso = r.data.find(v => v.estado === 'EN_CURSO')
      if (enCurso) setViajeActivo(enCurso)
      setStats(s => ({ ...s, viajes: r.data.length }))
    }).catch(() => {})
    Promise.all([api.get('/clientes'), api.get('/vinos/admin')]).then(([c, v]) => {
      const activos = v.data.filter((x: any) => x.activo)
      setStats(s => ({ ...s, clientes: c.data.length, vinos: activos.length, stockBajo: activos.filter((x: any) => x.stock <= 5).length }))
    }).catch(() => {})
  }, [dia])

  const cards = [
    { label: 'Clientes',         value: stats.clientes,  color: 'text-blue-600',     bg: 'bg-blue-50',     to: '/clientes' },
    { label: 'Vinos en stock',   value: stats.vinos,     color: 'text-botella-700',  bg: 'bg-botella-50',  to: '/vinos' },
    { label: 'Stock bajo',       value: stats.stockBajo, color: stats.stockBajo > 0 ? 'text-red-600' : 'text-emerald-600', bg: stats.stockBajo > 0 ? 'bg-red-50' : 'bg-emerald-50', to: '/vinos' },
    { label: 'Viajes hechos',    value: stats.viajes,    color: 'text-dorado-700',   bg: 'bg-dorado-50',   to: '/viajes' },
  ]

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title">Buen día 🍇</h1>
          <p className="page-subtitle capitalize">{hoy}</p>
        </div>
        <Link to="/viajes/nuevo" className="btn-dorado">🚚 Armar viaje</Link>
      </div>

      {viajeActivo && (
        <Link to={`/viajes/${viajeActivo.id}`} className="block card p-4 sm:p-5 border-l-4 border-dorado-500 hover:shadow-md transition">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <span className="chip bg-dorado-100 text-dorado-800">🚚 En curso</span>
              <p className="font-black text-botella-900 text-base sm:text-lg mt-2 truncate">{viajeActivo.titulo ?? 'Viaje del día'}</p>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {viajeActivo.paradas.filter(p => p.estado === 'VISITADA').length} de {viajeActivo.paradas.length} paradas
              </p>
            </div>
            <span className="text-2xl sm:text-3xl text-botella-300 shrink-0">→</span>
          </div>
        </Link>
      )}

      {/* Stats: 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {cards.map(c => (
          <Link key={c.label} to={c.to} className={`card p-4 sm:p-5 hover:shadow-md transition ${c.bg}`}>
            <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">{c.label}</p>
            <p className={`text-2xl sm:text-3xl font-black mt-1 ${c.color}`}>{c.value}</p>
          </Link>
        ))}
      </div>

      {/* Recorrido + accesos */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 card p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900">📍 Recorrido de hoy</h2>
              <p className="text-xs text-gray-500 truncate">Clientes asignados a {DIA_LABEL[dia].toLowerCase()}</p>
            </div>
            <Link to="/viajes" className="text-xs sm:text-sm text-botella-700 font-semibold hover:underline shrink-0">Ver todos →</Link>
          </div>
          {clientesHoy.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Sin clientes para {DIA_LABEL[dia].toLowerCase()}.</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {clientesHoy.slice(0, 5).map(c => (
                <Link key={c.id} to={`/clientes/${c.id}`} className="flex items-center justify-between py-2.5 sm:py-3 hover:bg-gray-50 -mx-2 px-2 rounded transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm sm:text-base text-gray-900 truncate">{c.nombre}</p>
                    {c.direccion && <p className="text-xs text-gray-500 truncate">📍 {c.direccion}</p>}
                  </div>
                  {c.zona && <span className="chip bg-dorado-100 text-dorado-800 shrink-0">{c.zona}</span>}
                </Link>
              ))}
              {clientesHoy.length > 5 && (
                <Link to="/viajes" className="block text-center text-xs text-botella-700 font-semibold pt-3 hover:underline">+ {clientesHoy.length - 5} más</Link>
              )}
            </div>
          )}
        </div>

        <div className="card p-4 sm:p-5">
          <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Accesos rápidos</h2>
          <div className="grid grid-cols-3 lg:grid-cols-1 gap-2">
            <Link to="/ventas/nueva" className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-center lg:text-left">
              <span className="text-2xl">🛒</span>
              <div>
                <p className="font-bold text-xs sm:text-sm text-gray-900">Nueva venta</p>
                <p className="text-[10px] text-gray-500 hidden lg:block">Descontar stock</p>
              </div>
            </Link>
            <Link to="/clientes" className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-center lg:text-left">
              <span className="text-2xl">👥</span>
              <div>
                <p className="font-bold text-xs sm:text-sm text-gray-900">Clientes</p>
                <p className="text-[10px] text-gray-500 hidden lg:block">Alta y edición</p>
              </div>
            </Link>
            <Link to="/vinos" className="flex flex-col lg:flex-row items-center gap-2 lg:gap-3 p-3 rounded-lg hover:bg-gray-50 transition text-center lg:text-left">
              <span className="text-2xl">🍷</span>
              <div>
                <p className="font-bold text-xs sm:text-sm text-gray-900">Stock</p>
                <p className="text-[10px] text-gray-500 hidden lg:block">Vinos y precios</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
