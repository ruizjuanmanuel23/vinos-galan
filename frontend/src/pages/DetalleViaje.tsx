import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import * as db from '../services/api'
import Modal from '../components/Modal'
import Icon from '../components/Icon'
import {
  cargaDeCamion, totalProductosViaje, cantidadDeParada,
  type Viaje, type Parada, type Vino,
} from '../types'

const fmtFecha = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function DetalleViaje() {
  const { id } = useParams()
  const viajeId = Number(id)
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [bodega, setBodega] = useState<Vino[]>([])
  const [paradaVenta, setParadaVenta] = useState<Parada | null>(null)
  const navigate = useNavigate()

  const cargar = async () => {
    const v = await db.getViaje(viajeId)
    if (!v) { navigate('/app/viajes'); return }
    setViaje(v)
    const vinos = await db.listVinos()
    setBodega(vinos.filter(v => v.activo))
  }

  useEffect(() => { cargar() }, [viajeId])

  if (!viaje) return <p className="text-center text-gray-400 py-12">Cargando...</p>

  const paradasReales = viaje.paradas.filter(p => p.cliente.id !== -1)
  const visitadas = paradasReales.filter(p => p.estado === 'VISITADA').length
  const total = paradasReales.length
  const progreso = total > 0 ? (visitadas / total) * 100 : 0
  const bloqueado = viaje.estado === 'FINALIZADO'
  const totalProductos = totalProductosViaje(viaje)
  const carga = cargaDeCamion(viaje)

  const actualizar = async (viajeActualizado: Viaje) => {
    await db.updateViaje(viajeId, viajeActualizado)
    await cargar()
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link to="/app/viajes" className="text-botella-700 text-sm font-medium hover:underline">← Viajes</Link>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title">{viaje.titulo ?? 'Viaje'}</h1>
          <p className="page-subtitle capitalize">{fmtFecha(viaje.fecha)}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {!bloqueado && <button onClick={() => actualizar({ ...viaje, estado: 'FINALIZADO' })} className="btn-primary text-xs sm:text-sm">Finalizar</button>}
          <button onClick={() => navigate('/app/viajes')} className="btn-secondary !text-red-600 text-xs sm:text-sm">Volver</button>
        </div>
      </div>

      {/* PROGRESO */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        <div className="card p-4 sm:p-5 bg-gradient-to-br from-botella-500 to-botella-600 text-white shadow-lg rounded-xl border-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/80">Paradas</p>
          <p className="text-3xl sm:text-4xl font-black text-white mt-2 drop-shadow">{visitadas}/{total}</p>
        </div>
        <div className="card p-4 sm:p-5 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-lg rounded-xl border-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/80">Visitadas</p>
          <p className="text-3xl sm:text-4xl font-black text-white mt-2 drop-shadow">{visitadas}</p>
        </div>
        <div className="card p-4 sm:p-5 bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg rounded-xl border-0">
          <p className="text-[10px] uppercase tracking-widest font-bold text-white/80">Avance</p>
          <p className="text-3xl sm:text-4xl font-black text-white mt-2 drop-shadow">{Math.round(progreso)}%</p>
        </div>
      </div>

      <div className="card p-4 bg-gradient-to-r from-gray-100 to-gray-50 rounded-xl shadow-md">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-botella-600 via-dorado-400 to-emerald-500 transition-all shadow-lg" style={{ width: `${progreso}%` }} />
        </div>
        <p className="text-xs text-gray-500 text-center mt-2 font-bold">{Math.round(progreso)}% completado</p>
      </div>

      {/* CARGA */}
      <div className="card p-6 sm:p-7 bg-gradient-to-br from-botella-600 via-botella-500 to-botella-400 text-white shadow-xl rounded-xl border-0">
        <p className="text-[11px] uppercase tracking-widest font-bold text-white/90 mb-3">🚛 Carga del camión</p>
        <p className="text-4xl sm:text-5xl font-black drop-shadow">{totalProductos} <span className="text-2xl text-white/80">unidades</span></p>
        {carga.length > 0 && (
          <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {carga.map(c => (
              <div key={c.vinoId} className="text-xs bg-white/20 backdrop-blur rounded-lg px-3 py-2.5 border border-white/30">
                <p className="font-bold text-white truncate">{c.vinoNombre}</p>
                <p className="text-white/80 font-bold text-lg">×{c.cantidad}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* PARADAS */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Paradas ({total})</h2>
        {total === 0 ? (
          <p className="text-center text-gray-400 py-8">Sin paradas.</p>
        ) : (
          <div className="space-y-3">
            {paradasReales.map((p, idx) => (
              <div key={p.id} className="card p-4 sm:p-5 border-l-4 border-dorado-500 hover:shadow-lg transition-all rounded-lg bg-white">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-botella-100 text-botella-800 font-black text-sm flex items-center justify-center shrink-0">{idx + 1}</div>
                      <div>
                        <p className="font-bold text-gray-900">{p.cliente.nombre}</p>
                        {p.cliente.telefono && <p className="text-xs text-gray-500 flex items-center gap-1"><Icon name="phone" className="w-3 h-3" />{p.cliente.telefono}</p>}
                        {p.cliente.direccion && <p className="text-xs text-gray-500 flex items-center gap-1"><Icon name="map-pin" className="w-3 h-3" />{p.cliente.direccion}</p>}
                      </div>
                    </div>
                  </div>
                  {p.estado === 'VISITADA' && (
                    <span className="chip bg-emerald-100 text-emerald-700 shrink-0 text-xs">✓ Visitado</span>
                  )}
                </div>

                {/* VENTA RÁPIDA AQUÍ */}
                {!bloqueado && p.estado !== 'VISITADA' && (
                  <button
                    onClick={() => setParadaVenta(p)}
                    className="mt-4 w-full py-3 text-sm font-black text-white bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 rounded-lg transition-all shadow-lg hover:shadow-xl active:scale-95"
                  >
                    💰 + REGISTRAR VENTA
                  </button>
                )}

                {/* Ver productos vendidos */}
                {(p.items ?? []).length > 0 && (
                  <div className="mt-3 bg-botella-50/60 border border-botella-200 rounded-lg p-2.5">
                    <p className="text-[10px] uppercase tracking-wide font-bold text-botella-700 mb-1.5">Productos vendidos</p>
                    <div className="space-y-0.5">
                      {p.items.map(it => (
                        <div key={it.id} className="flex justify-between text-xs text-gray-700">
                          <span className="truncate">{it.vinoNombre}</span>
                          <span className="font-bold ml-2 shrink-0">×{it.cantidad}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {!bloqueado && (
                  <div className="mt-3 grid grid-cols-3 gap-1.5">
                    <button
                      onClick={() => {
                        const updated = viaje.paradas.map(pp => pp.id === p.id ? { ...p, estado: 'VISITADA' as const, horaVisita: new Date().toISOString() } : pp)
                        actualizar({ ...viaje, paradas: updated })
                      }}
                      className={`py-2 rounded text-xs font-bold transition ${p.estado === 'VISITADA' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                      ✓ Visitada
                    </button>
                    <button onClick={() => {}} className="py-2 rounded text-xs font-bold bg-gray-100 text-gray-700">⏭ Omitir</button>
                    <button onClick={() => {}} className="py-2 rounded text-xs font-bold bg-dorado-50 text-dorado-800">↻ Pendiente</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL VENTA RÁPIDA */}
      {paradaVenta && (
        <PanelVentaRapida
          parada={paradaVenta}
          bodega={bodega}
          onClose={() => setParadaVenta(null)}
          onGuardar={async (items) => {
            const updated = viaje.paradas.map(p => p.id === paradaVenta.id ? { ...p, items } : p)
            await actualizar({ ...viaje, paradas: updated })
            setParadaVenta(null)
          }}
        />
      )}
    </div>
  )
}

function PanelVentaRapida({
  parada, bodega, onClose, onGuardar,
}: {
  parada: Parada
  bodega: Vino[]
  onClose: () => void
  onGuardar: (items: any[]) => Promise<void>
}) {
  const [local, setLocal] = useState<Record<number, number>>({})
  const [busq, setBusq] = useState('')
  const [guardando, setGuardando] = useState(false)

  const q = busq.toLowerCase()
  const filtrados = busq ? bodega.filter(v => v.nombre.toLowerCase().includes(q)) : bodega
  const total = Object.values(local).reduce((a, b) => a + b, 0)

  const guardar = async () => {
    setGuardando(true)
    const items = Object.entries(local)
      .map(([vId, c]) => ({ vinoId: Number(vId), cantidad: c }))
      .filter(it => it.cantidad > 0)
    await onGuardar(items)
    setGuardando(false)
  }

  return (
    <Modal open size="lg" title={`📍 ${parada.cliente.nombre} - REGISTRAR VENTA`} onClose={onClose}>
      <div className="space-y-3">
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between">
          <span className="font-bold text-emerald-900">TOTAL</span>
          <span className="text-3xl font-black text-emerald-700">{total} u.</span>
        </div>

        <input
          autoFocus
          className="input"
          placeholder="Buscar vino..."
          value={busq}
          onChange={e => setBusq(e.target.value)}
        />

        <div className="border border-gray-100 rounded-lg max-h-[50vh] overflow-y-auto divide-y">
          {filtrados.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Sin productos</p>
          ) : (
            filtrados.map(v => {
              const cant = local[v.id] ?? 0
              return (
                <div key={v.id} className="flex items-center gap-2 p-3">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {v.fotoUrl ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" /> : <Icon name="wine-bottle" className="w-5 h-5 text-gray-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900">{v.nombre}</p>
                    <p className="text-xs text-gray-500">{v.bodega} · Stock: {v.stock}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => setLocal(m => ({ ...m, [v.id]: Math.max(0, (m[v.id] ?? 0) - 1) }))} className="w-9 h-9 rounded bg-gray-100 text-lg font-black">−</button>
                    <input type="number" inputMode="numeric" min="0" value={cant || ''} placeholder="0" onChange={e => setLocal(m => ({ ...m, [v.id]: Math.max(0, Number(e.target.value) || 0) }))} className="w-12 h-9 text-center text-sm font-black border border-gray-300 rounded" />
                    <button onClick={() => setLocal(m => ({ ...m, [v.id]: (m[v.id] ?? 0) + 1 }))} className="w-9 h-9 rounded bg-emerald-600 text-white text-lg font-black">+</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={guardar} disabled={guardando || total === 0} className="btn-primary">
            {guardando ? 'Guardando...' : `Guardar (${total} u.)`}
          </button>
        </div>
      </div>
    </Modal>
  )
}
