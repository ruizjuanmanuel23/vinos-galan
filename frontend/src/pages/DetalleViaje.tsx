import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'
import {
  cargaDeCamion, totalProductosViaje, cantidadDeParada,
  type EstadoParada, type Viaje, type Parada, type Vino,
} from '../types'

const fmtFecha = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function DetalleViaje() {
  const { id } = useParams()
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const [bodega, setBodega] = useState<Vino[]>([])
  const [paradaEdit, setParadaEdit] = useState<Parada | null>(null)
  const [cargando, setCargando] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const navigate = useNavigate()

  const cargar = () => { api.get<Viaje>(`/viajes/${id}`).then(r => setViaje(r.data)).catch(() => {}) }
  useEffect(() => {
    cargar()
    api.get<Vino[]>('/vinos/admin').then(r => setBodega(r.data.filter(v => v.activo))).catch(() => {})
  }, [id])

  const actualizarEstado = async (paradaId: number, estado: EstadoParada) => {
    await api.put(`/viajes/paradas/${paradaId}`, { estado }); cargar()
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
  const cargarCamion = async () => {
    setCargando(true); setErrorCarga(null)
    try {
      await api.post(`/viajes/${id}/cargar`)
      cargar()
    } catch (e: any) {
      const msg = typeof e?.response?.data === 'string' ? e.response.data : 'No se pudo cargar el camión'
      setErrorCarga(msg)
    } finally { setCargando(false) }
  }
  const descargarCamion = async () => {
    if (!confirm('¿Descargar el camión? Los productos vuelven a la bodega.')) return
    await api.post(`/viajes/${id}/descargar`); cargar()
  }
  const guardarItems = async (paradaId: number, items: { vinoId: number; cantidad: number }[]) => {
    await api.put(`/viajes/paradas/${paradaId}/items`, { items })
    cargar()
  }

  if (!viaje) return <p className="text-center text-gray-400 py-12">Cargando...</p>

  const visitadas = viaje.paradas.filter(p => p.estado === 'VISITADA').length
  const total = viaje.paradas.length
  const progreso = total > 0 ? (visitadas / total) * 100 : 0
  const bloqueado = viaje.estado === 'FINALIZADO'
  const totalProductos = totalProductosViaje(viaje)
  const carga = cargaDeCamion(viaje)
  const esManual = !!(viaje.cantidadTotalManual && viaje.cantidadTotalManual > 0)

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
            {viaje.cargado && (
              <span className="chip bg-emerald-100 text-emerald-700">📦 Camión cargado</span>
            )}
          </div>
          <p className="page-subtitle capitalize">{fmtFecha(viaje.fecha)}</p>
        </div>
        <div className="flex gap-2">
          {!bloqueado && <button onClick={finalizar} className="btn-primary text-xs sm:text-sm">Finalizar</button>}
          <button onClick={eliminar} className="btn-secondary !text-red-600 !border-red-300 text-xs sm:text-sm">Eliminar</button>
        </div>
      </div>

      {/* CARGA DEL CAMIÓN */}
      <section className="card overflow-hidden border-l-4 border-dorado-500">
        <div className="bg-gradient-to-r from-botella-50 via-white to-dorado-50 px-4 sm:px-5 py-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-botella-700 mb-1">🚛 Carga del camión</p>
              <div className="flex items-end gap-3 flex-wrap">
                <p className="text-3xl sm:text-4xl font-black text-botella-900 leading-none">{totalProductos} u.</p>
                <p className="text-xs text-gray-500 pb-1">
                  {carga.length > 0 ? `${carga.length} producto${carga.length !== 1 ? 's' : ''} distintos` : esManual ? 'Total manual' : 'Sin desglose'}
                </p>
              </div>
            </div>
            {!bloqueado && carga.length > 0 && (
              viaje.cargado ? (
                <button onClick={descargarCamion} className="btn-secondary text-xs">↩ Descargar camión</button>
              ) : (
                <button onClick={cargarCamion} disabled={cargando} className="btn-dorado text-xs sm:text-sm">
                  {cargando ? 'Cargando...' : '🚛 Cargar camión'}
                </button>
              )
            )}
          </div>
          {errorCarga && (
            <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-2.5">
              <p className="text-xs font-bold text-red-800 mb-1">No se pudo cargar:</p>
              <pre className="text-[11px] text-red-700 whitespace-pre-wrap font-sans">{errorCarga}</pre>
            </div>
          )}
        </div>
        {carga.length > 0 && (
          <div className="p-4 sm:p-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {carga.map(c => {
                const enBodega = bodega.find(b => b.id === c.vinoId)
                const stockOk = !enBodega || enBodega.stock >= c.cantidad || viaje.cargado
                return (
                  <div key={c.vinoId} className={`flex items-center justify-between px-3 py-2 rounded-lg ${stockOk ? 'bg-gray-50' : 'bg-red-50 border border-red-200'}`}>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{c.vinoNombre}</p>
                      {enBodega && !viaje.cargado && (
                        <p className="text-[10px] text-gray-500">Stock bodega: {enBodega.stock}</p>
                      )}
                    </div>
                    <span className={`font-black text-lg shrink-0 ml-2 ${stockOk ? 'text-botella-800' : 'text-red-700'}`}>×{c.cantidad}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </section>

      {viaje.notas && (
        <div className="card p-4 bg-dorado-50/50 border-dorado-200">
          <p className="text-xs font-semibold text-dorado-800 mb-1">Notas</p>
          <p className="text-sm text-gray-700 italic">{viaje.notas}</p>
        </div>
      )}

      {/* Stats paradas */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Paradas</p>
          <p className="text-xl sm:text-2xl font-black text-botella-900 mt-1">{visitadas}/{total}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-emerald-50 border-emerald-200">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-700">Visitadas</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{visitadas}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-dorado-50 border-dorado-200">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-dorado-700">Avance</p>
          <p className="text-xl sm:text-2xl font-black text-dorado-700 mt-1">{Math.round(progreso)}%</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-botella-600 transition-all" style={{ width: `${progreso}%` }} />
        </div>
      </div>

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
                onEditItems={() => setParadaEdit(p)}
                onEliminar={eliminarParada}
                bloqueado={bloqueado}
              />
            ))}
          </div>
        )}
      </div>

      {/* MODAL editar items de una parada */}
      <ModalEditarItems
        parada={paradaEdit}
        bodega={bodega}
        onClose={() => setParadaEdit(null)}
        onGuardar={items => paradaEdit && guardarItems(paradaEdit.id, items)}
      />
    </div>
  )
}

function ParadaCard({ parada, numero, onEstado, onEditItems, onEliminar, bloqueado }: {
  parada: Parada; numero: number;
  onEstado: (id: number, e: EstadoParada) => void;
  onEditItems: () => void;
  onEliminar: (id: number) => void;
  bloqueado: boolean;
}) {
  const c = parada.cliente
  const dirGoogle = c.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}` : null
  const borde =
    parada.estado === 'VISITADA' ? 'border-l-emerald-500' :
    parada.estado === 'OMITIDA'  ? 'border-l-gray-400'   : 'border-l-dorado-500'

  const cantTotal = cantidadDeParada(parada)
  const items = parada.items ?? []

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

      {/* Productos para este cliente */}
      <div className="mt-3 bg-botella-50/60 border border-botella-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wide font-bold text-botella-700">📦 Productos</span>
          <span className="text-lg font-black text-botella-900">{cantTotal} u.</span>
        </div>
        {items.length === 0 ? (
          <p className="text-[11px] text-gray-500 italic">Sin productos asignados</p>
        ) : (
          <div className="space-y-0.5">
            {items.map(it => (
              <div key={it.id} className="flex justify-between text-[12px] text-gray-700">
                <span className="truncate">{it.vinoNombre}</span>
                <span className="font-bold ml-2 shrink-0">×{it.cantidad}</span>
              </div>
            ))}
          </div>
        )}
        {!bloqueado && (
          <button onClick={onEditItems} className="mt-2 w-full py-1.5 text-[11px] font-bold text-botella-700 bg-white border border-botella-200 hover:bg-botella-50 rounded transition">
            ✎ {items.length === 0 ? 'Asignar productos' : 'Editar productos'}
          </button>
        )}
      </div>

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

function ModalEditarItems({
  parada, bodega, onClose, onGuardar,
}: {
  parada: Parada | null
  bodega: Vino[]
  onClose: () => void
  onGuardar: (items: { vinoId: number; cantidad: number }[]) => void
}) {
  const [local, setLocal] = useState<Record<number, number>>({})
  const [busq, setBusq] = useState('')

  useEffect(() => {
    if (parada) {
      const map: Record<number, number> = {}
      for (const it of (parada.items ?? [])) map[it.vinoId] = it.cantidad
      setLocal(map)
      setBusq('')
    }
  }, [parada])

  if (!parada) return null

  const q = busq.toLowerCase()
  const filtrados = busq
    ? bodega.filter(v => v.nombre.toLowerCase().includes(q) || (v.bodega ?? '').toLowerCase().includes(q))
    : bodega

  const total = Object.values(local).reduce((acc, n) => acc + n, 0)

  const setCant = (vinoId: number, cant: number) => {
    setLocal(m => {
      const next = { ...m }
      if (cant <= 0) delete next[vinoId]
      else next[vinoId] = cant
      return next
    })
  }

  const guardar = () => {
    const items = Object.entries(local)
      .map(([vId, c]) => ({ vinoId: Number(vId), cantidad: c }))
      .filter(it => it.cantidad > 0)
    onGuardar(items)
    onClose()
  }

  return (
    <Modal open size="xl" title={`Productos para ${parada.cliente.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-botella-50 border border-botella-200 rounded-lg p-3">
          <span className="text-sm font-semibold text-botella-900">Total</span>
          <span className="text-2xl font-black text-botella-900">{total} u.</span>
        </div>

        <input
          className="input"
          placeholder="🔍 Buscar producto..."
          value={busq}
          onChange={e => setBusq(e.target.value)}
        />

        <div className="border border-gray-100 rounded-lg max-h-[55vh] overflow-y-auto divide-y divide-gray-100">
          {filtrados.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">Sin productos. Cargá en Bodega.</p>
          ) : (
            filtrados.map(v => {
              const cant = local[v.id] ?? 0
              return (
                <div key={v.id} className={`flex items-center gap-2 p-3 ${cant > 0 ? 'bg-botella-50/40' : ''}`}>
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                    {v.fotoUrl
                      ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                      : <span className="text-xl text-gray-300">🍷</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-gray-900 truncate">{v.nombre}</p>
                    <div className="flex gap-2 text-[11px] text-gray-500">
                      {v.bodega && <span className="truncate">{v.bodega}</span>}
                      <span>· Stock: <span className={v.stock <= 5 ? 'text-red-600 font-bold' : ''}>{v.stock}</span></span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => setCant(v.id, Math.max(0, cant - 1))} disabled={cant === 0} className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xl font-black text-gray-700">−</button>
                    <input
                      type="number" inputMode="numeric" min={0} value={cant || ''} placeholder="0"
                      onChange={e => setCant(v.id, Math.max(0, Number(e.target.value) || 0))}
                      className="w-14 h-9 text-center text-base font-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-botella-500"
                    />
                    <button onClick={() => setCant(v.id, cant + 1)} className="w-9 h-9 rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 text-xl font-black">+</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-ghost">Cancelar</button>
          <button onClick={guardar} className="btn-primary">Guardar</button>
        </div>
      </div>
    </Modal>
  )
}
