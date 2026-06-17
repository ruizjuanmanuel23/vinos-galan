import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'
import {
  DIAS_SEMANA, DIA_LABEL, DIA_CORTO, diaSemanaHoy,
  type Cliente, type DiaSemana, type Vino,
} from '../types'

/** Detalle de productos por cliente. clienteId → vinoId → cantidad */
type Pedido = Record<number, Record<number, number>>

export default function NuevoViaje() {
  const [diaSel, setDiaSel] = useState<DiaSemana | 'TODOS'>(diaSemanaHoy())
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [bodega, setBodega] = useState<Vino[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [pedido, setPedido] = useState<Pedido>({})
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [busq, setBusq] = useState('')
  const [loading, setLoading] = useState(false)
  const [modalCliente, setModalCliente] = useState<Cliente | null>(null)

  const navigate = useNavigate()

  useEffect(() => {
    const url = diaSel === 'TODOS' ? '/clientes' : `/clientes/dia/${diaSel}`
    api.get<Cliente[]>(url).then(r => setClientes(r.data)).catch(() => {})
  }, [diaSel])

  useEffect(() => {
    api.get<Vino[]>('/vinos/admin').then(r => setBodega(r.data.filter(v => v.activo))).catch(() => {})
  }, [])

  const filtrados = busq
    ? clientes.filter(c => c.nombre.toLowerCase().includes(busq.toLowerCase()) || (c.direccion ?? '').toLowerCase().includes(busq.toLowerCase()))
    : clientes

  const toggle = (id: number) => setSeleccionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const seleccionadosObj = clientes.filter(c => seleccionados.includes(c.id))

  const cantidadCliente = (clienteId: number) =>
    Object.values(pedido[clienteId] ?? {}).reduce((acc, n) => acc + n, 0)

  const itemsCliente = (clienteId: number) => {
    const map = pedido[clienteId] ?? {}
    return Object.entries(map)
      .map(([vinoId, cant]) => {
        const v = bodega.find(b => b.id === Number(vinoId))
        return { vinoId: Number(vinoId), nombre: v?.nombre ?? '—', cantidad: cant }
      })
      .filter(it => it.cantidad > 0)
  }

  const setItem = (clienteId: number, vinoId: number, cantidad: number) => {
    setPedido(p => {
      const map = { ...(p[clienteId] ?? {}) }
      if (cantidad <= 0) delete map[vinoId]
      else map[vinoId] = cantidad
      return { ...p, [clienteId]: map }
    })
  }

  // Carga agregada del camión: por producto, suma de todos los clientes
  const cargaAgregada = useMemo(() => {
    const map = new Map<number, number>()
    for (const cId of seleccionados) {
      const items = pedido[cId] ?? {}
      for (const [vId, n] of Object.entries(items)) {
        if (n > 0) map.set(Number(vId), (map.get(Number(vId)) ?? 0) + n)
      }
    }
    return Array.from(map.entries())
      .map(([vinoId, cantidad]) => {
        const v = bodega.find(b => b.id === vinoId)
        return { vinoId, nombre: v?.nombre ?? '—', cantidad, stock: v?.stock ?? 0 }
      })
      .sort((a, b) => b.cantidad - a.cantidad)
  }, [pedido, seleccionados, bodega])

  const totalGeneral = cargaAgregada.reduce((acc, c) => acc + c.cantidad, 0)

  const mover = (idx: number, dir: -1 | 1) => {
    const nuevo = [...seleccionados]
    const target = idx + dir
    if (target < 0 || target >= nuevo.length) return
    ;[nuevo[idx], nuevo[target]] = [nuevo[target], nuevo[idx]]
    setSeleccionados(nuevo)
  }

  const crear = async () => {
    if (seleccionados.length === 0) return
    setLoading(true)
    try {
      const paradas = seleccionados.map(cId => ({
        clienteId: cId,
        items: Object.entries(pedido[cId] ?? {})
          .map(([vId, n]) => ({ vinoId: Number(vId), cantidad: n }))
          .filter(it => it.cantidad > 0),
      }))
      const r = await api.post('/viajes', {
        fecha,
        titulo: titulo || `Viaje ${new Date(fecha+'T00:00:00').toLocaleDateString('es-AR')}`,
        notas,
        paradas,
      })
      navigate(`/app/viajes/${r.data.id}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-32 lg:pb-0">
      <Link to="/app/viajes" className="text-botella-700 text-sm font-medium hover:underline">← Viajes</Link>
      <div>
        <h1 className="page-title">Nuevo viaje</h1>
        <p className="page-subtitle">Asigná productos a cada cliente y armá la carga del camión</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Datos + carga + paradas seleccionadas */}
        <div className="space-y-4 lg:order-1 order-2">
          {/* Datos */}
          <div className="card p-4 sm:p-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">Datos del viaje</h2>
            <div>
              <label className="label">Fecha</label>
              <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="label">Título (opcional)</label>
              <input className="input" placeholder={`Viaje ${new Date().toLocaleDateString('es-AR')}`} value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
            </div>
          </div>

          {/* Carga del camión */}
          <div className="card overflow-hidden border-l-4 border-dorado-500">
            <div className="bg-gradient-to-r from-botella-50 to-dorado-50 px-4 py-3 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-sm sm:text-base font-black text-botella-900">🚛 Carga del camión</h2>
                <span className="text-2xl font-black text-botella-900">{totalGeneral} u.</span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Suma de productos pedidos por todos los clientes</p>
            </div>
            <div className="p-4 space-y-1.5">
              {cargaAgregada.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Asigná productos a los clientes para ver la carga.</p>
              ) : (
                cargaAgregada.map(c => {
                  const insuficiente = c.cantidad > c.stock
                  return (
                    <div key={c.vinoId} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">{c.nombre}</p>
                        <p className="text-[10px] text-gray-500">Stock bodega: {c.stock} u.</p>
                      </div>
                      <span className={`font-black text-base shrink-0 ${insuficiente ? 'text-red-600' : 'text-botella-800'}`}>
                        {c.cantidad}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Paradas elegidas */}
          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Paradas ({seleccionados.length})</h2>
            </div>
            {seleccionadosObj.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Tildá clientes a la derecha para agregar paradas.</p>
            ) : (
              <div className="space-y-2">
                {seleccionadosObj.map((c, idx) => {
                  const cant = cantidadCliente(c.id)
                  const items = itemsCliente(c.id)
                  return (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-2.5 space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-botella-700 text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                        <span className="text-sm font-medium text-gray-800 flex-1 truncate">{c.nombre}</span>
                        <div className="flex gap-0.5 shrink-0">
                          <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="w-7 h-7 text-gray-400 hover:text-botella-700 disabled:opacity-30 text-sm">▲</button>
                          <button onClick={() => mover(idx, 1)} disabled={idx === seleccionadosObj.length - 1} className="w-7 h-7 text-gray-400 hover:text-botella-700 disabled:opacity-30 text-sm">▼</button>
                          <button onClick={() => toggle(c.id)} className="w-7 h-7 text-red-400 hover:text-red-600 text-sm">✕</button>
                        </div>
                      </div>
                      {items.length === 0 ? (
                        <button
                          onClick={() => setModalCliente(c)}
                          className="w-full py-2 text-xs font-bold text-botella-700 bg-white border border-dashed border-botella-300 hover:border-botella-500 rounded-lg transition"
                        >
                          + Asignar productos
                        </button>
                      ) : (
                        <div>
                          <div className="text-[11px] text-gray-700 space-y-0.5">
                            {items.map(it => (
                              <div key={it.vinoId} className="flex justify-between">
                                <span className="truncate">{it.nombre}</span>
                                <span className="font-bold ml-2 shrink-0">×{it.cantidad}</span>
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => setModalCliente(c)}
                            className="mt-1.5 w-full py-1.5 text-[11px] font-bold text-botella-700 bg-white border border-botella-200 hover:bg-botella-50 rounded transition"
                          >
                            ✎ Editar ({cant} u.)
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
            {seleccionados.length > 0 && (
              <button onClick={crear} disabled={loading} className="w-full btn-dorado mt-4">
                {loading
                  ? 'Creando...'
                  : `🚚 Crear viaje${totalGeneral > 0 ? ` · ${totalGeneral} u.` : ''}`}
              </button>
            )}
          </div>
        </div>

        {/* Selector clientes */}
        <div className="lg:col-span-2 card p-4 sm:p-5 lg:order-2 order-1">
          <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Elegir clientes</h2>

          <div className="scroll-h mb-3">
            <div className="flex gap-1.5 w-max">
              <button onClick={() => setDiaSel('TODOS')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${diaSel === 'TODOS' ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>Todos</button>
              {DIAS_SEMANA.map(d => (
                <button key={d} onClick={() => setDiaSel(d)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${diaSel === d ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                  <span className="sm:hidden">{DIA_CORTO[d]}</span>
                  <span className="hidden sm:inline">{DIA_LABEL[d]}</span>
                </button>
              ))}
            </div>
          </div>

          <input className="input mb-3" placeholder="🔍 Buscar..." value={busq} onChange={e => setBusq(e.target.value)} />

          <div className="border border-gray-100 rounded-lg max-h-[400px] lg:max-h-[500px] overflow-y-auto divide-y divide-gray-100">
            {filtrados.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">Sin clientes para este filtro.</p>
            )}
            {filtrados.map(c => {
              const sel = seleccionados.includes(c.id)
              const cant = cantidadCliente(c.id)
              return (
                <div key={c.id} className={`flex items-stretch transition ${sel ? 'bg-botella-50' : ''}`}>
                  <button
                    onClick={() => toggle(c.id)}
                    className="flex-1 flex items-center gap-3 p-3 text-left hover:bg-gray-50 active:bg-gray-50 transition"
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-botella-700 border-botella-700' : 'border-gray-300'}`}>
                      {sel && <span className="text-white text-xs leading-none">✓</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 truncate">{c.nombre}</p>
                      <div className="flex gap-2 text-xs text-gray-500">
                        {c.direccion && <span className="truncate">📍 {c.direccion}</span>}
                      </div>
                    </div>
                  </button>
                  {sel && (
                    <div className="flex items-center gap-1.5 pr-2 shrink-0">
                      {cant > 0 && (
                        <span className="text-[10px] font-black text-botella-800 bg-botella-100 px-2 py-0.5 rounded-full">
                          {cant} u.
                        </span>
                      )}
                      <button
                        onClick={() => setModalCliente(c)}
                        className="px-2 py-1 text-xs font-bold text-botella-700 bg-white border border-botella-300 hover:bg-botella-50 rounded transition"
                      >
                        🛒
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* MODAL: Asignar productos a un cliente */}
      <ModalProductos
        cliente={modalCliente}
        bodega={bodega}
        pedido={pedido[modalCliente?.id ?? -1] ?? {}}
        onClose={() => setModalCliente(null)}
        onCambiar={(vinoId, cant) => modalCliente && setItem(modalCliente.id, vinoId, cant)}
      />
    </div>
  )
}

function ModalProductos({
  cliente, bodega, pedido, onClose, onCambiar,
}: {
  cliente: Cliente | null
  bodega: Vino[]
  pedido: Record<number, number>
  onClose: () => void
  onCambiar: (vinoId: number, cant: number) => void
}) {
  const [busq, setBusq] = useState('')
  if (!cliente) return null

  const q = busq.toLowerCase()
  const filtrados = busq
    ? bodega.filter(v => v.nombre.toLowerCase().includes(q) || (v.bodega ?? '').toLowerCase().includes(q))
    : bodega

  const totalCliente = Object.values(pedido).reduce((acc, n) => acc + n, 0)

  return (
    <Modal open size="xl" title={`Productos para ${cliente.nombre}`} onClose={onClose}>
      <div className="space-y-3">
        <div className="flex items-center justify-between bg-botella-50 border border-botella-200 rounded-lg p-3">
          <span className="text-sm font-semibold text-botella-900">Total para este cliente</span>
          <span className="text-2xl font-black text-botella-900">{totalCliente} u.</span>
        </div>

        <input
          className="input"
          placeholder="🔍 Buscar producto..."
          value={busq}
          onChange={e => setBusq(e.target.value)}
        />

        <div className="border border-gray-100 rounded-lg max-h-[55vh] overflow-y-auto divide-y divide-gray-100">
          {filtrados.length === 0 ? (
            <p className="p-6 text-center text-sm text-gray-400">
              Sin productos. Cargá en la sección Bodega.
            </p>
          ) : (
            filtrados.map(v => {
              const cant = pedido[v.id] ?? 0
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
                    <button
                      onClick={() => onCambiar(v.id, Math.max(0, cant - 1))}
                      disabled={cant === 0}
                      className="w-9 h-9 rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-xl font-black text-gray-700"
                    >−</button>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      value={cant || ''}
                      placeholder="0"
                      onChange={e => onCambiar(v.id, Math.max(0, Number(e.target.value) || 0))}
                      className="w-14 h-9 text-center text-base font-black bg-white border border-gray-300 rounded-lg focus:outline-none focus:border-botella-500"
                    />
                    <button
                      onClick={() => onCambiar(v.id, cant + 1)}
                      className="w-9 h-9 rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 text-xl font-black"
                    >+</button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="btn-primary">Listo</button>
        </div>
      </div>
    </Modal>
  )
}
