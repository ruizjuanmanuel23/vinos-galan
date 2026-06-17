import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import { totalProductosViaje, type EstadoParada, type Viaje, type Parada } from '../types'

const fmtFecha = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function DetalleViaje() {
  const { id } = useParams()
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [editandoTotal, setEditandoTotal] = useState(false)
  const [totalManualTmp, setTotalManualTmp] = useState('')
  const navigate = useNavigate()

  const cargar = () => { api.get<Viaje>(`/viajes/${id}`).then(r => setViaje(r.data)).catch(() => {}) }
  useEffect(() => { cargar() }, [id])

  const actualizarEstado = async (paradaId: number, estado: EstadoParada) => {
    await api.put(`/viajes/paradas/${paradaId}`, { estado }); cargar()
  }
  const actualizarCantidadParada = async (paradaId: number, cantidad: number) => {
    await api.put(`/viajes/paradas/${paradaId}`, { cantidadProductos: cantidad }); cargar()
  }
  const eliminarParada = async (paradaId: number) => {
    if (!confirm('¿Quitar esta parada?')) return
    await api.delete(`/viajes/paradas/${paradaId}`); cargar()
  }
  const finalizar = async () => {
    if (!confirm('¿Finalizar el viaje?')) return
    await api.put(`/viajes/${id}/finalizar`); cargar()
  }
  const eliminar = async () => {
    if (!confirm('¿Eliminar este viaje?')) return
    await api.delete(`/viajes/${id}`); navigate('/app/viajes')
  }
  const guardarTotalManual = async () => {
    const n = Number(totalManualTmp) || 0
    await api.put(`/viajes/${id}`, { cantidadTotalManual: n > 0 ? n : null })
    setEditandoTotal(false); cargar()
  }
  const quitarTotalManual = async () => {
    if (!confirm('¿Quitar el total manual y volver a calcular por suma de paradas?')) return
    await api.put(`/viajes/${id}`, { cantidadTotalManual: null }); cargar()
  }

  if (!viaje) return <p className="text-center text-gray-400 py-12">Cargando...</p>

  const visitadas = viaje.paradas.filter(p => p.estado === 'VISITADA').length
  const omitidas = viaje.paradas.filter(p => p.estado === 'OMITIDA').length
  const pendientes = viaje.paradas.filter(p => p.estado === 'PENDIENTE').length
  const total = viaje.paradas.length
  const progreso = total > 0 ? ((visitadas + omitidas) / total) * 100 : 0
  const bloqueado = viaje.estado === 'FINALIZADO'

  const totalProductos = totalProductosViaje(viaje)
  const sumaParadas = viaje.paradas.reduce((acc, p) => acc + (p.cantidadProductos || 0), 0)
  const esManual = !!(viaje.cantidadTotalManual && viaje.cantidadTotalManual > 0)
  const totalEntregados = viaje.paradas
    .filter(p => p.estado === 'VISITADA')
    .reduce((acc, p) => acc + (p.cantidadProductos || 0), 0)

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link to="/app/viajes" className="text-botella-700 text-sm font-medium hover:underline">← Viajes</Link>

      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{viaje.titulo ?? 'Viaje'}</h1>
            <span className={`chip ${!bloqueado ? 'bg-dorado-100 text-dorado-800' : 'bg-gray-100 text-gray-600'}`}>
              {!bloqueado ? '🚚 En curso' : '✓ Finalizado'}
            </span>
          </div>
          <p className="page-subtitle capitalize">{fmtFecha(viaje.fecha)}</p>
        </div>
        <div className="flex gap-2">
          {!bloqueado && <button onClick={finalizar} className="btn-primary text-xs sm:text-sm">Finalizar</button>}
          <button onClick={eliminar} className="btn-secondary !text-red-600 !border-red-300 text-xs sm:text-sm">Eliminar</button>
        </div>
      </div>

      {/* CANTIDAD DE PRODUCTOS — banner destacado */}
      <div className="card overflow-hidden border-l-4 border-dorado-500">
        <div className="bg-gradient-to-r from-botella-50 via-white to-dorado-50 p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-botella-700 mb-1">📦 Productos a llevar</p>
              {editandoTotal ? (
                <div className="flex items-center gap-2 mt-1">
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    autoFocus
                    placeholder="0"
                    className="w-24 text-3xl font-black bg-white border-2 border-botella-500 rounded-lg px-2 py-1 text-center focus:outline-none focus:ring-2 focus:ring-botella-200"
                    value={totalManualTmp}
                    onChange={e => setTotalManualTmp(e.target.value)}
                  />
                  <button onClick={guardarTotalManual} className="btn-primary !py-2 text-xs">Guardar</button>
                  <button onClick={() => setEditandoTotal(false)} className="text-gray-500 text-xs hover:underline">Cancelar</button>
                </div>
              ) : (
                <div className="flex items-end gap-3 flex-wrap">
                  <p className="text-4xl sm:text-5xl font-black text-botella-900 leading-none">{totalProductos}</p>
                  <p className="text-xs text-gray-500 pb-1">
                    unidades · {esManual ? 'cargado manual' : `${sumaParadas} desglosadas en paradas`}
                  </p>
                </div>
              )}
              {!bloqueado && !editandoTotal && (
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => { setTotalManualTmp(String(viaje.cantidadTotalManual || '')); setEditandoTotal(true) }}
                    className="text-xs text-botella-700 font-semibold hover:underline"
                  >
                    {esManual ? '✎ Editar total manual' : '✎ Sobrescribir con total manual'}
                  </button>
                  {esManual && (
                    <button onClick={quitarTotalManual} className="text-xs text-red-500 hover:underline">
                      Volver a suma automática
                    </button>
                  )}
                </div>
              )}
            </div>
            {totalProductos > 0 && (
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-700 mb-1">Entregadas</p>
                <p className="text-3xl font-black text-emerald-700 leading-none">{totalEntregados}</p>
                <p className="text-xs text-gray-500 mt-1">{totalProductos - totalEntregados} pendientes</p>
              </div>
            )}
          </div>
          {!esManual && totalProductos > 0 && (
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide mb-1">
                <span className="text-gray-500">Entrega de productos</span>
                <span className="text-emerald-700">{totalProductos > 0 ? Math.round((totalEntregados / totalProductos) * 100) : 0}%</span>
              </div>
              <div className="h-1.5 bg-white rounded-full overflow-hidden border border-gray-100">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${totalProductos > 0 ? (totalEntregados / totalProductos) * 100 : 0}%` }} />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats paradas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Total paradas</p>
          <p className="text-xl sm:text-2xl font-black text-botella-900 mt-1">{total}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-emerald-50 border-emerald-200">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-700">Visitadas</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{visitadas}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-gray-50">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600">Omitidas</p>
          <p className="text-xl sm:text-2xl font-black text-gray-600 mt-1">{omitidas}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-dorado-50 border-dorado-200">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-dorado-700">Pendientes</p>
          <p className="text-xl sm:text-2xl font-black text-dorado-700 mt-1">{pendientes}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-gray-600">Avance del recorrido</span>
          <span className="text-botella-700">{Math.round(progreso)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-botella-600 transition-all" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {viaje.notas && (
        <div className="card p-4 bg-dorado-50/50 border-dorado-200">
          <p className="text-xs font-semibold text-dorado-800 mb-1">Notas</p>
          <p className="text-sm text-gray-700 italic">{viaje.notas}</p>
        </div>
      )}

      {/* Paradas */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Paradas ({total})</h2>
        {total === 0 ? (
          <p className="text-center text-gray-400 py-8">Sin paradas.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {viaje.paradas.map((p, idx) => (
              <ParadaCard
                key={p.id}
                parada={p}
                numero={idx + 1}
                onEstado={actualizarEstado}
                onCantidad={actualizarCantidadParada}
                onEliminar={eliminarParada}
                bloqueado={bloqueado}
                modoManual={esManual}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ParadaCard({ parada, numero, onEstado, onCantidad, onEliminar, bloqueado, modoManual }: {
  parada: Parada; numero: number;
  onEstado: (id: number, e: EstadoParada) => void;
  onCantidad: (id: number, n: number) => void;
  onEliminar: (id: number) => void;
  bloqueado: boolean;
  modoManual: boolean;
}) {
  const [editCant, setEditCant] = useState(false)
  const [cantTmp, setCantTmp] = useState(String(parada.cantidadProductos || ''))

  const c = parada.cliente
  const dirGoogle = c.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}` : null
  const borde =
    parada.estado === 'VISITADA' ? 'border-l-emerald-500' :
    parada.estado === 'OMITIDA'  ? 'border-l-gray-400'   : 'border-l-dorado-500'

  const guardarCant = () => {
    onCantidad(parada.id, Math.max(0, Number(cantTmp) || 0))
    setEditCant(false)
  }

  return (
    <div className={`card p-3 sm:p-4 border-l-4 ${borde} ${parada.estado !== 'PENDIENTE' ? 'opacity-90' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-botella-100 text-botella-800 font-black text-sm flex items-center justify-center shrink-0">{numero}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/app/clientes/${c.id}`} className="font-bold text-gray-900 hover:text-botella-700 truncate">{c.nombre}</Link>
            {parada.estado === 'VISITADA' && parada.horaVisita && (
              <span className="chip bg-emerald-100 text-emerald-700 shrink-0">✓ {fmtHora(parada.horaVisita)}</span>
            )}
          </div>
          {c.telefono && <a href={`tel:${c.telefono}`} className="block text-xs text-botella-600 mt-0.5 active:underline">📞 {c.telefono}</a>}
          {c.direccion && (
            <div className="text-xs text-gray-500 mt-0.5">
              {dirGoogle ? <a href={dirGoogle} target="_blank" rel="noreferrer" className="active:underline hover:underline">📍 {c.direccion}</a> : <>📍 {c.direccion}</>}
            </div>
          )}
        </div>
      </div>

      {/* Cantidad de productos */}
      {!modoManual && (
        <div className="mt-3 bg-botella-50 border border-botella-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-botella-700 font-bold">📦 Productos</span>
          </div>
          {editCant ? (
            <div className="flex items-center gap-1.5">
              <input
                type="number"
                inputMode="numeric"
                min={0}
                autoFocus
                className="w-16 text-center text-base font-bold bg-white border border-botella-500 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-botella-200"
                value={cantTmp}
                onChange={e => setCantTmp(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && guardarCant()}
              />
              <button onClick={guardarCant} className="text-emerald-600 font-bold text-sm px-2">✓</button>
              <button onClick={() => setEditCant(false)} className="text-gray-400 text-sm px-2">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xl font-black text-botella-900">{parada.cantidadProductos || 0}</span>
              <span className="text-xs text-gray-500">u.</span>
              {!bloqueado && (
                <button
                  onClick={() => { setCantTmp(String(parada.cantidadProductos || '')); setEditCant(true) }}
                  className="text-xs text-botella-700 hover:underline ml-1"
                >
                  ✎ editar
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!bloqueado && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button onClick={() => onEstado(parada.id, 'VISITADA')} className={`py-2 rounded-lg text-xs font-bold transition ${parada.estado === 'VISITADA' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'}`}>✓ Visitada</button>
            <button onClick={() => onEstado(parada.id, 'OMITIDA')} className={`py-2 rounded-lg text-xs font-bold transition ${parada.estado === 'OMITIDA' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 active:bg-gray-200'}`}>⏭ Omitir</button>
            <button onClick={() => onEstado(parada.id, 'PENDIENTE')} className={`py-2 rounded-lg text-xs font-bold transition ${parada.estado === 'PENDIENTE' ? 'bg-dorado-500 text-white' : 'bg-dorado-50 text-dorado-800 active:bg-dorado-100'}`}>↻ Pendiente</button>
          </div>
          <button onClick={() => onEliminar(parada.id)} className="mt-2 text-xs text-red-500 active:text-red-700 hover:underline">Quitar del viaje</button>
        </>
      )}
    </div>
  )
}
