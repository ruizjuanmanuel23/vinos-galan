import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as db from '../services/api'
import Icon from '../components/Icon'
import type { Viaje, Vino } from '../types'

const fmtPlata = (n: number) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export default function Resumen() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [vinos, setVinos] = useState<Vino[]>([])
  const hoy = new Date().toISOString().slice(0, 10)

  useEffect(() => {
    const cargar = async () => {
      const v = await db.listViajes()
      const w = await db.listVinos()
      setViajes(v)
      setVinos(w)
    }
    cargar()
  }, [])

  const viajeHoy = viajes.find(v => v.fecha === hoy)
  const viajesEnCurso = viajes.filter(v => v.estado === 'EN_CURSO').length
  const stockBajo = vinos.filter(v => v.stock <= 5)

  // Stats del día
  const ventasHoy = viajeHoy?.paradas.reduce((acc, p) => acc + (p.items ?? []).length, 0) ?? 0
  const productosHoy = viajeHoy?.paradas.reduce((acc, p) => acc + (p.items ?? []).reduce((a, it) => a + it.cantidad, 0), 0) ?? 0
  const paradasHoy = viajeHoy?.paradas.filter(p => p.estado === 'VISITADA').length ?? 0

  return (
    <div className="space-y-5">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title text-4xl sm:text-5xl font-black bg-gradient-to-r from-botella-900 to-dorado-600 bg-clip-text text-transparent">📊 Resumen</h1>
          <p className="page-subtitle text-gray-600 font-semibold">Dashboard de hoy · {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long' })}</p>
        </div>
        <Link to="/app/viajes" className="btn-primary text-xs sm:text-sm bg-gradient-to-r from-botella-700 to-botella-600 hover:from-botella-800 hover:to-botella-700 shadow-lg transition-all">
          {viajesEnCurso > 0 ? `${viajesEnCurso} Viaje${viajesEnCurso !== 1 ? 's' : ''} en curso →` : 'Ir a Viajes'}
        </Link>
      </div>

      {/* STATS HOY - GRANDES Y LLAMATIVOS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="card p-5 sm:p-6 bg-gradient-to-br from-emerald-500 via-emerald-400 to-emerald-300 text-white shadow-lg hover:shadow-xl transition-shadow rounded-xl border-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-emerald-50 opacity-90">Ventas</p>
          <p className="text-4xl sm:text-5xl font-black mt-3 drop-shadow">{ventasHoy}</p>
          <p className="text-[10px] text-emerald-50 mt-2 opacity-80">operaciones hoy</p>
        </div>

        <div className="card p-5 sm:p-6 bg-gradient-to-br from-amber-500 via-amber-400 to-amber-300 text-white shadow-lg hover:shadow-xl transition-shadow rounded-xl border-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-amber-50 opacity-90">Productos</p>
          <p className="text-4xl sm:text-5xl font-black mt-3 drop-shadow">{productosHoy}</p>
          <p className="text-[10px] text-amber-50 mt-2 opacity-80">unidades</p>
        </div>

        <div className="card p-5 sm:p-6 bg-gradient-to-br from-botella-600 via-botella-500 to-botella-400 text-white shadow-lg hover:shadow-xl transition-shadow rounded-xl border-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white opacity-90">Paradas</p>
          <p className="text-4xl sm:text-5xl font-black mt-3 drop-shadow">{paradasHoy}</p>
          <p className="text-[10px] text-white mt-2 opacity-80">visitadas</p>
        </div>

        <div className="card p-5 sm:p-6 bg-gradient-to-br from-red-500 via-red-400 to-red-300 text-white shadow-lg hover:shadow-xl transition-shadow rounded-xl border-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-red-50 opacity-90">Stock bajo</p>
          <p className="text-4xl sm:text-5xl font-black mt-3 drop-shadow">{stockBajo.length}</p>
          <p className="text-[10px] text-red-50 mt-2 opacity-80">críticos</p>
        </div>
      </div>

      {/* VIAJE HOY */}
      {viajeHoy && (
        <div className="card p-6 sm:p-7 bg-gradient-to-r from-dorado-500 via-amber-400 to-dorado-400 text-white shadow-xl rounded-xl border-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-black flex items-center gap-2">
              <Icon name="truck" className="w-6 h-6" />
              Viaje de hoy
            </h2>
            <Link to={`/app/viajes/${viajeHoy.id}`} className="text-xs font-bold bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition">
              Ver detalles →
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-white/80 uppercase tracking-wide">Progreso</p>
              <p className="text-3xl font-black mt-1 drop-shadow">{paradasHoy}/{viajeHoy.paradas.length}</p>
            </div>
            <div className="h-20 w-20 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-white font-black text-2xl shadow-lg border-2 border-white/30">
              {viajeHoy.paradas.length > 0 ? Math.round((paradasHoy / viajeHoy.paradas.length) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* STOCK BAJO */}
      {stockBajo.length > 0 && (
        <div className="card p-5 sm:p-6 border-l-4 border-red-600 bg-gradient-to-r from-red-50 to-red-25 rounded-xl shadow-md">
          <h2 className="text-lg font-bold text-red-900 mb-4 flex items-center gap-2">
            <Icon name="alert-circle" className="w-6 h-6 text-red-600" />
            ⚠️ Stock crítico
          </h2>
          <div className="space-y-2">
            {stockBajo.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-center justify-between bg-white rounded-lg p-3.5 shadow hover:shadow-md transition border-l-3 border-red-500">
                <div>
                  <p className="font-bold text-sm text-gray-900">{v.nombre}</p>
                  <p className="text-xs text-gray-500">{v.bodega}</p>
                </div>
                <div className="text-right bg-red-100 rounded-lg px-3 py-2">
                  <p className="font-black text-red-700 text-xl">{v.stock}</p>
                  <p className="text-[9px] text-red-600 font-bold">unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIAJES RECIENTES */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Viajes recientes</h2>
        <div className="space-y-3">
          {viajes.slice(0, 5).map(v => {
            const visitadas = v.paradas.filter(p => p.estado === 'VISITADA').length
            const total = v.paradas.length
            const progreso = total > 0 ? (visitadas / total) * 100 : 0
            return (
              <Link
                key={v.id}
                to={`/app/viajes/${v.id}`}
                className="card p-4 flex items-center justify-between hover:shadow-lg transition-all border-l-3 border-dorado-500 bg-white rounded-lg"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate">{v.titulo ?? 'Viaje'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-gray-500">{v.fecha}</p>
                    <div className="flex-1 max-w-xs bg-gray-200 h-1.5 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-botella-500 to-dorado-400 transition-all" style={{ width: `${progreso}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 font-bold">{visitadas}/{total}</p>
                  </div>
                </div>
                <span className={`chip text-xs font-bold rounded-full px-3 py-1.5 ${v.estado === 'FINALIZADO' ? 'bg-gray-100 text-gray-700' : 'bg-dorado-100 text-dorado-800'}`}>
                  {v.estado === 'FINALIZADO' ? '✓' : '🚛'}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
