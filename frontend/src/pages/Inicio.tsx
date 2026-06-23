import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as db from '../services/api'
import Icon from '../components/Icon'
import { type Cliente, type Viaje, type Vino } from '../types'

const fmtPlata = (n: number) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export default function Inicio() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [viajeActivo, setViajeActivo] = useState<Viaje | null>(null)
  const [stats, setStats] = useState({ clientes: 0, vinos: 0, stockBajo: 0 })

  const hoy = new Date()
  const fechaTexto = hoy.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })
  const horaActual = hoy.getHours()
  const saludo =
    horaActual < 12 ? 'Buen día' :
    horaActual < 19 ? 'Buenas tardes' : 'Buenas noches'

  useEffect(() => {
    const cargar = async () => {
      const clientes = await db.listClientes()
      const viajes = await db.listViajes()
      const vinos = await db.listVinos()

      setClientes(clientes)

      const enCurso = viajes.find(v => v.estado === 'EN_CURSO')
      if (enCurso) setViajeActivo(enCurso)

      const activos = vinos.filter(v => v.activo)
      setStats({
        clientes: clientes.length,
        vinos: activos.length,
        stockBajo: activos.filter(v => v.stock <= 5).length,
      })
    }
    cargar()
  }, [])

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* HEADER */}
      <header className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <p className="text-xs sm:text-sm text-gray-500 capitalize tracking-wide">{fechaTexto}</p>
          <h1 className="text-3xl sm:text-4xl font-black text-botella-900 mt-0.5 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
            {saludo}
          </h1>
        </div>
        <Link to="/app/viajes/nuevo" className="btn-dorado">+ Nuevo viaje</Link>
      </header>

      {/* VIAJE EN CURSO */}
      {viajeActivo && (
        <Link to={`/app/viajes/${viajeActivo.id}`} className="block card p-4 sm:p-5 border-l-4 border-dorado-500 hover:shadow-md transition group">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-dorado-500 animate-pulse" />
                <p className="font-bold text-sm sm:text-base text-gray-900">{viajeActivo.titulo}</p>
              </div>
              <p className="text-xs text-gray-500 mt-1">En curso</p>
            </div>
            <Icon name="arrow-right" className="w-5 h-5 text-botella-700 group-hover:translate-x-1 transition" />
          </div>
        </Link>
      )}

      {/* STATS */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-gray-500">Resumen</h2>
          <Link to="/app/resumen" className="text-xs text-botella-700 font-bold hover:underline">Ver detalles →</Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="card p-4 bg-gradient-to-br from-botella-50 to-white border-botella-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-botella-700">Clientes</p>
            <p className="text-2xl sm:text-3xl font-black text-botella-900 mt-1">{stats.clientes}</p>
            <p className="text-[10px] text-gray-500 mt-1">cargados en la app</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-dorado-50 to-white border-dorado-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-dorado-700">Productos</p>
            <p className="text-2xl sm:text-3xl font-black text-dorado-900 mt-1">{stats.vinos}</p>
            <p className="text-[10px] text-gray-500 mt-1">activos</p>
          </div>
          <div className="card p-4 bg-gradient-to-br from-red-50 to-white border-red-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-red-700">Stock Bajo</p>
            <p className="text-2xl sm:text-3xl font-black text-red-900 mt-1">{stats.stockBajo}</p>
            <p className="text-[10px] text-gray-500 mt-1">≤ 5 unidades</p>
          </div>
        </div>
      </section>

      {/* GRID PRINCIPAL */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Clientes recientes */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-gray-100 flex items-center justify-between gap-2">
            <h2 className="font-black text-gray-900 text-sm sm:text-base">Clientes</h2>
            <Link to="/app/clientes" className="text-xs text-botella-700 font-bold hover:underline">Ver todos →</Link>
          </div>
          {clientes.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-10">Sin clientes cargados. <Link to="/app/clientes" className="text-botella-700 font-bold hover:underline">Crear primero</Link></p>
          ) : (
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
              {clientes.slice(0, 8).map(c => (
                <Link key={c.id} to={`/app/clientes/${c.id}`} className="flex items-center justify-between gap-2 px-4 sm:px-5 py-3 hover:bg-gray-50 transition">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">{c.nombre}</p>
                    {c.direccion && <p className="text-[11px] text-gray-500 truncate">{c.direccion}</p>}
                  </div>
                  {c.zonaId && <span className="chip bg-dorado-100 text-dorado-800 shrink-0 text-xs">📍 Barrio</span>}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Atajos */}
        <div className="space-y-3">
          <div className="card p-4">
            <h2 className="font-black text-gray-900 text-sm mb-3">Acciones rápidas</h2>
            <div className="grid grid-cols-1 gap-2">
              <Link to="/app/viajes/nuevo" className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-dorado-50 transition group">
                <div className="w-8 h-8 rounded-lg bg-dorado-100 flex items-center justify-center text-dorado-800 group-hover:scale-110 transition">🚗</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Nuevo viaje</p>
                  <p className="text-[10px] text-gray-500">Crear recorrido</p>
                </div>
              </Link>
              <Link to="/app/clientes" className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-botella-50 transition group">
                <div className="w-8 h-8 rounded-lg bg-botella-100 flex items-center justify-center group-hover:scale-110 transition">👥</div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Clientes</p>
                  <p className="text-[10px] text-gray-500">Gestionar</p>
                </div>
              </Link>
              <Link to="/app/vinos" className="flex items-center gap-2 px-3 py-2.5 rounded-lg hover:bg-emerald-50 transition group">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 group-hover:scale-110 transition"><Icon name="wine-bottle" className="w-4 h-4" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-gray-900">Bodega</p>
                  <p className="text-[10px] text-gray-500">Stock</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
