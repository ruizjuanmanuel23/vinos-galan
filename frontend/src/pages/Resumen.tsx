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
          <h1 className="page-title">📊 Resumen</h1>
          <p className="page-subtitle">Dashboard de hoy</p>
        </div>
        <Link to="/app/viajes" className="btn-primary text-xs sm:text-sm">
          {viajesEnCurso > 0 ? `${viajesEnCurso} Viaje${viajesEnCurso !== 1 ? 's' : ''} en curso →` : 'Ir a Viajes'}
        </Link>
      </div>

      {/* STATS HOY - GRANDES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
          <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Ventas</p>
          <p className="text-3xl sm:text-4xl font-black text-emerald-900 mt-2">{ventasHoy}</p>
          <p className="text-[11px] text-emerald-600 mt-1">operaciones</p>
        </div>

        <div className="card p-4 sm:p-5 bg-gradient-to-br from-dorado-50 to-white border-dorado-200">
          <p className="text-[10px] font-bold uppercase tracking-wide text-dorado-700">Productos</p>
          <p className="text-3xl sm:text-4xl font-black text-dorado-800 mt-2">{productosHoy}</p>
          <p className="text-[11px] text-dorado-600 mt-1">unidades</p>
        </div>

        <div className="card p-4 sm:p-5 bg-gradient-to-br from-botella-50 to-white border-botella-200">
          <p className="text-[10px] font-bold uppercase tracking-wide text-botella-700">Paradas</p>
          <p className="text-3xl sm:text-4xl font-black text-botella-900 mt-2">{paradasHoy}</p>
          <p className="text-[11px] text-botella-600 mt-1">visitadas</p>
        </div>

        <div className="card p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-white border-blue-200">
          <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Stock bajo</p>
          <p className="text-3xl sm:text-4xl font-black text-blue-900 mt-2">{stockBajo.length}</p>
          <p className="text-[11px] text-blue-600 mt-1">productos críticos</p>
        </div>
      </div>

      {/* VIAJE HOY */}
      {viajeHoy && (
        <div className="card p-4 sm:p-5 border-l-4 border-dorado-500 bg-gradient-to-r from-dorado-50 to-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
              <Icon name="truck" className="w-5 h-5 text-dorado-700" />
              Viaje de hoy
            </h2>
            <Link to={`/app/viajes/${viajeHoy.id}`} className="text-xs font-bold text-dorado-700 hover:underline">
              Ver detalles →
            </Link>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Progreso</p>
              <p className="text-2xl font-black text-botella-900">{paradasHoy}/{viajeHoy.paradas.length}</p>
            </div>
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-botella-400 to-botella-600 flex items-center justify-center text-white font-black text-xl">
              {viajeHoy.paradas.length > 0 ? Math.round((paradasHoy / viajeHoy.paradas.length) * 100) : 0}%
            </div>
          </div>
        </div>
      )}

      {/* STOCK BAJO */}
      {stockBajo.length > 0 && (
        <div className="card p-4 border-l-4 border-red-500 bg-red-50">
          <h2 className="text-base font-bold text-red-900 mb-3 flex items-center gap-2">
            <Icon name="alert-circle" className="w-5 h-5 text-red-600" />
            ⚠️ Stock crítico
          </h2>
          <div className="space-y-2">
            {stockBajo.slice(0, 5).map(v => (
              <div key={v.id} className="flex items-center justify-between bg-white rounded-lg p-2.5">
                <div>
                  <p className="font-bold text-sm text-gray-900">{v.nombre}</p>
                  <p className="text-xs text-gray-500">{v.bodega}</p>
                </div>
                <div className="text-right">
                  <p className="font-black text-red-600 text-lg">{v.stock}</p>
                  <p className="text-[10px] text-gray-500">unidades</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIAJES RECIENTES */}
      <div>
        <h2 className="text-base font-bold text-gray-900 mb-3">Viajes recientes</h2>
        <div className="space-y-2">
          {viajes.slice(0, 5).map(v => {
            const visitadas = v.paradas.filter(p => p.estado === 'VISITADA').length
            const total = v.paradas.length
            return (
              <Link
                key={v.id}
                to={`/app/viajes/${v.id}`}
                className="card p-3 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-sm text-gray-900 truncate">{v.titulo ?? 'Viaje'}</p>
                  <p className="text-xs text-gray-500">{v.fecha} · {visitadas}/{total} paradas</p>
                </div>
                <span className={`chip text-xs ${v.estado === 'FINALIZADO' ? 'bg-gray-100 text-gray-600' : 'bg-dorado-100 text-dorado-800'}`}>
                  {v.estado === 'FINALIZADO' ? '✓ Finalizado' : '🚛 En curso'}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
