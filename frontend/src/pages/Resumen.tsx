import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  resumenAPI,
  type ResumenDia, type RankingCliente, type RankingProducto,
} from '../services/storage'
import type { Vino } from '../types'

const fmtPlata = (n: number) =>
  '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 0 })

export default function Resumen() {
  const [diaSel, setDiaSel] = useState(new Date().toISOString().slice(0, 10))
  const [periodo, setPeriodo] = useState<7 | 30 | 90>(30)
  const [dia, setDia] = useState<ResumenDia | null>(null)
  const [mes, setMes] = useState<{ ventas: number; recaudado: number; paradas: number } | null>(null)
  const [topClientes, setTopClientes] = useState<RankingCliente[]>([])
  const [topProductos, setTopProductos] = useState<RankingProducto[]>([])
  const [stockBajo, setStockBajo] = useState<Vino[]>([])

  useEffect(() => {
    setDia(resumenAPI.delDia(diaSel))
  }, [diaSel])

  useEffect(() => {
    setMes(resumenAPI.delMes())
    setTopClientes(resumenAPI.topClientes(periodo, 5))
    setTopProductos(resumenAPI.topProductos(periodo, 5))
    setStockBajo(resumenAPI.stockCritico(5))
  }, [periodo])

  const irHoy = () => setDiaSel(new Date().toISOString().slice(0, 10))
  const esHoy = diaSel === new Date().toISOString().slice(0, 10)

  return (
    <div className="space-y-5">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title">Resumen</h1>
          <p className="page-subtitle">Vista general del negocio</p>
        </div>
        <div className="flex gap-2">
          <input
            type="date"
            value={diaSel}
            onChange={e => setDiaSel(e.target.value)}
            className="input !py-1.5 text-sm"
          />
          {!esHoy && (
            <button onClick={irHoy} className="btn-secondary !py-1.5 text-xs">Hoy</button>
          )}
        </div>
      </div>

      {/* RESUMEN DEL DÍA */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base sm:text-lg font-black text-botella-900">
            {esHoy ? 'Hoy' : new Date(diaSel + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h2>
          {dia && dia.viajesEnCurso > 0 && (
            <Link to="/app/viajes" className="text-xs text-dorado-700 font-bold hover:underline">
              🚚 {dia.viajesEnCurso} viaje{dia.viajesEnCurso !== 1 ? 's' : ''} en curso →
            </Link>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700">Ventas</p>
            <p className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">{dia?.ventas ?? 0}</p>
            <p className="text-[11px] text-emerald-600 mt-1">{(dia?.ventas ?? 0) === 1 ? 'venta hecha' : 'ventas hechas'}</p>
          </div>
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-dorado-50 to-white border-dorado-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-dorado-700">Recaudado</p>
            <p className="text-2xl sm:text-3xl font-black text-dorado-800 mt-1">{fmtPlata(dia?.recaudado ?? 0)}</p>
            <p className="text-[11px] text-dorado-600 mt-1">en el día</p>
          </div>
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-botella-50 to-white border-botella-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-botella-700">Paradas</p>
            <p className="text-2xl sm:text-3xl font-black text-botella-900 mt-1">{dia?.paradas ?? 0}</p>
            <p className="text-[11px] text-botella-600 mt-1">visitadas</p>
          </div>
          <div className="card p-4 sm:p-5 bg-gradient-to-br from-blue-50 to-white border-blue-200">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-700">Productos</p>
            <p className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">{dia?.productosEntregados ?? 0}</p>
            <p className="text-[11px] text-blue-600 mt-1">entregadas</p>
          </div>
        </div>
      </section>

      {/* RESUMEN DEL MES */}
      <section>
        <h2 className="text-base sm:text-lg font-black text-botella-900 mb-3 capitalize">
          {new Date().toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
        </h2>
        <div className="card p-5 grid grid-cols-3 gap-4 divide-x divide-gray-100">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Ventas del mes</p>
            <p className="text-2xl sm:text-3xl font-black text-botella-900 mt-1">{mes?.ventas ?? 0}</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Recaudado</p>
            <p className="text-2xl sm:text-3xl font-black text-dorado-700 mt-1">{fmtPlata(mes?.recaudado ?? 0)}</p>
          </div>
          <div className="pl-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-gray-500">Paradas</p>
            <p className="text-2xl sm:text-3xl font-black text-botella-700 mt-1">{mes?.paradas ?? 0}</p>
          </div>
        </div>
      </section>

      {/* PERÍODO */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Top de los últimos</span>
        <div className="flex gap-1">
          {([7, 30, 90] as const).map(d => (
            <button
              key={d}
              onClick={() => setPeriodo(d)}
              className={`px-3 py-1 rounded-full text-xs font-bold transition ${
                periodo === d ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* TOP CLIENTES */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-botella-50 to-white border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm sm:text-base">🏆 Mejores clientes</h3>
            <p className="text-xs text-gray-500">Más gastaron en los últimos {periodo} días</p>
          </div>
          <div className="divide-y divide-gray-100">
            {topClientes.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin ventas en el período.</p>
            ) : topClientes.map((tc, i) => (
              <Link key={tc.cliente.id} to={`/app/clientes/${tc.cliente.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  i === 0 ? 'bg-dorado-400 text-dorado-950' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{tc.cliente.nombre}</p>
                  <p className="text-[11px] text-gray-500">{tc.cantidadCompras} compra{tc.cantidadCompras !== 1 ? 's' : ''}</p>
                </div>
                <span className="font-black text-botella-800 text-sm shrink-0">{fmtPlata(tc.totalGastado)}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* TOP PRODUCTOS */}
        <div className="card overflow-hidden">
          <div className="px-5 py-4 bg-gradient-to-r from-dorado-50 to-white border-b border-gray-100">
            <h3 className="font-black text-gray-900 text-sm sm:text-base">🍷 Productos más vendidos</h3>
            <p className="text-xs text-gray-500">Por unidades en los últimos {periodo} días</p>
          </div>
          <div className="divide-y divide-gray-100">
            {topProductos.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-8">Sin ventas en el período.</p>
            ) : topProductos.map((tp, i) => (
              <div key={tp.vino.id} className="flex items-center gap-3 px-5 py-3">
                <span className={`w-7 h-7 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                  i === 0 ? 'bg-dorado-400 text-dorado-950' :
                  i === 1 ? 'bg-gray-300 text-gray-700' :
                  i === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-gray-100 text-gray-500'
                }`}>{i + 1}</span>
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                  {tp.vino.fotoUrl
                    ? <img src={tp.vino.fotoUrl} alt={tp.vino.nombre} className="w-full h-full object-cover" />
                    : <span className="text-base text-gray-300">🍷</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-gray-900 truncate">{tp.vino.nombre}</p>
                  <p className="text-[11px] text-gray-500 truncate">{tp.vino.bodega || '—'}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-black text-botella-800 text-sm">{tp.cantidadVendida} u.</p>
                  <p className="text-[10px] text-gray-400">{fmtPlata(tp.totalRecaudado)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* STOCK CRÍTICO */}
      {stockBajo.length > 0 && (
        <section>
          <h2 className="text-base sm:text-lg font-black text-botella-900 mb-3">⚠ Stock crítico</h2>
          <div className="card overflow-hidden">
            <div className="divide-y divide-gray-100">
              {stockBajo.map(v => (
                <div key={v.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                    {v.fotoUrl
                      ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                      : <span className="text-base text-gray-300">🍷</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{v.nombre}</p>
                    <p className="text-[11px] text-gray-500 truncate">{v.bodega || '—'}</p>
                  </div>
                  <span className={`chip ${v.stock === 0 ? 'bg-red-100 text-red-700' : 'bg-dorado-100 text-dorado-800'}`}>
                    {v.stock === 0 ? 'SIN STOCK' : `${v.stock} u.`}
                  </span>
                </div>
              ))}
            </div>
            <Link to="/app/vinos" className="block text-center text-xs font-bold text-botella-700 hover:underline py-3 bg-gray-50">
              → Ir a la Bodega para reponer
            </Link>
          </div>
        </section>
      )}
    </div>
  )
}
