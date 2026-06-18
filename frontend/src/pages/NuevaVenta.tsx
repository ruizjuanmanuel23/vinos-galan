import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/axios'
import type { Cliente, Vino } from '../types'

interface Item { vino: Vino; cantidad: number }

export default function NuevaVenta() {
  const [params] = useSearchParams()
  const cidPre = params.get('cliente')
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [vinos, setVinos] = useState<Vino[]>([])
  const [clienteId, setClienteId] = useState(cidPre ?? '')
  const [busqCliente, setBusqCliente] = useState('')
  const [items, setItems] = useState<Item[]>([])
  const [busqVino, setBusqVino] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get<Vino[]>('/vinos').then(r => setVinos(r.data.filter(v => v.stock > 0))).catch(() => {})
    if (cidPre) api.get<Cliente>(`/clientes/${cidPre}`).then(r => setClientes([r.data])).catch(() => {})
  }, [cidPre])

  useEffect(() => {
    if (cidPre) return
    const t = setTimeout(() => {
      if (busqCliente) api.get<Cliente[]>(`/clientes?q=${encodeURIComponent(busqCliente)}`).then(r => setClientes(r.data)).catch(() => {})
      else setClientes([])
    }, 300)
    return () => clearTimeout(t)
  }, [busqCliente, cidPre])

  const cantidadDe = (id: number) => items.find(i => i.vino.id === id)?.cantidad ?? 0

  const toggleVino = (v: Vino) => {
    const existe = items.find(i => i.vino.id === v.id)
    if (existe) setItems(items.filter(i => i.vino.id !== v.id))
    else setItems([...items, { vino: v, cantidad: 1 }])
  }

  const cambiarCant = (v: Vino, delta: number) => {
    const existe = items.find(i => i.vino.id === v.id)
    if (!existe) {
      if (delta > 0) setItems([...items, { vino: v, cantidad: 1 }])
      return
    }
    const nuevaCant = existe.cantidad + delta
    if (nuevaCant <= 0) {
      setItems(items.filter(i => i.vino.id !== v.id))
      return
    }
    if (nuevaCant > v.stock) return
    setItems(items.map(i => i.vino.id === v.id ? { ...i, cantidad: nuevaCant } : i))
  }

  const setCantManual = (v: Vino, valor: string) => {
    const n = parseInt(valor, 10)
    if (isNaN(n) || n <= 0) {
      setItems(items.filter(i => i.vino.id !== v.id))
      return
    }
    const cant = Math.min(n, v.stock)
    const existe = items.find(i => i.vino.id === v.id)
    if (existe) setItems(items.map(i => i.vino.id === v.id ? { ...i, cantidad: cant } : i))
    else setItems([...items, { vino: v, cantidad: cant }])
  }

  const total = items.reduce((acc, i) => acc + Number(i.vino.precioVenta) * i.cantidad, 0)
  const totalUnidades = items.reduce((acc, i) => acc + i.cantidad, 0)
  const seleccionado = clientes.find(c => c.id === Number(clienteId)) || null

  const vinosFiltrados = busqVino
    ? vinos.filter(v => v.nombre.toLowerCase().includes(busqVino.toLowerCase()) || (v.bodega ?? '').toLowerCase().includes(busqVino.toLowerCase()))
    : vinos

  // Vinos seleccionados primero (sticky arriba para que sean visibles)
  const vinosOrdenados = [...vinosFiltrados].sort((a, b) => {
    const aSel = items.some(i => i.vino.id === a.id) ? 0 : 1
    const bSel = items.some(i => i.vino.id === b.id) ? 0 : 1
    return aSel - bSel
  })

  const confirmar = async () => {
    if (!clienteId) { setError('Seleccioná un cliente'); return }
    if (items.length === 0) { setError('Agregá al menos un vino'); return }
    setError('')
    setGuardando(true)
    try {
      await api.post('/ventas', {
        clienteId: Number(clienteId), notas,
        detalles: items.map(i => ({ vinoId: i.vino.id, cantidad: i.cantidad })),
      })
      navigate(`/app/clientes/${clienteId}`)
    } catch (e: any) {
      setError(typeof e.response?.data === 'string' ? e.response.data : 'Error al registrar la venta')
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-28">
      <Link to="/app" className="text-botella-700 text-sm font-medium hover:underline">← Inicio</Link>
      <div>
        <h1 className="page-title">Nueva venta</h1>
        <p className="page-subtitle">Tildá los vinos y poné la cantidad. El stock se descuenta solo.</p>
      </div>

      {/* 1. Cliente */}
      <div className="card p-4 sm:p-5">
        <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">1. Cliente</h2>
        {seleccionado ? (
          <div className="flex items-center justify-between gap-2 bg-botella-50 border border-botella-200 rounded-lg p-3">
            <div className="min-w-0">
              <p className="font-bold text-botella-900 truncate">{seleccionado.nombre}</p>
              <p className="text-xs text-gray-500 truncate">{seleccionado.telefono} {seleccionado.direccion && `· ${seleccionado.direccion}`}</p>
            </div>
            {!cidPre && <button onClick={() => { setClienteId(''); setBusqCliente('') }} className="text-botella-700 text-sm font-semibold shrink-0">Cambiar</button>}
          </div>
        ) : (
          <div>
            <input className="input mb-2" placeholder="🔍 Buscar cliente..." value={busqCliente} onChange={e => setBusqCliente(e.target.value)} />
            {clientes.length > 0 && (
              <div className="border border-gray-200 rounded-lg overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
                {clientes.slice(0, 8).map(c => (
                  <button key={c.id} onClick={() => { setClienteId(String(c.id)); setBusqCliente('') }} className="w-full text-left px-3 py-2.5 hover:bg-botella-50 active:bg-botella-50 transition">
                    <p className="font-semibold text-gray-900 text-sm">{c.nombre}</p>
                    <p className="text-xs text-gray-500">{c.telefono}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. Vinos */}
      <div className="card p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3 gap-2">
          <h2 className="font-bold text-gray-900 text-sm sm:text-base">2. Vinos</h2>
          {items.length > 0 && (
            <span className="text-xs font-bold text-botella-700 bg-botella-50 border border-botella-200 px-2 py-1 rounded-full">
              {items.length} {items.length === 1 ? 'tildado' : 'tildados'} · {totalUnidades} u.
            </span>
          )}
        </div>
        <input className="input mb-3" placeholder="🔍 Buscar vino..." value={busqVino} onChange={e => setBusqVino(e.target.value)} />

        {vinosOrdenados.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Sin vinos con stock.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {vinosOrdenados.map(v => {
              const cant = cantidadDe(v.id)
              const seleccionado = cant > 0
              return (
                <div
                  key={v.id}
                  className={`relative border rounded-xl p-3 transition-all ${
                    seleccionado
                      ? 'border-botella-600 bg-botella-50 shadow-sm ring-1 ring-botella-300'
                      : 'border-gray-200 bg-white hover:border-botella-300'
                  }`}
                >
                  {/* Checkbox visual + click toggle */}
                  <button
                    onClick={() => toggleVino(v)}
                    className="w-full text-left flex items-center gap-3"
                  >
                    {/* Foto del vino */}
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center shrink-0">
                      {v.fotoUrl
                        ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                        : <span className="text-lg text-gray-300">🍷</span>}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-gray-900 truncate">{v.nombre}</p>
                      <p className="text-[11px] text-gray-500 truncate">{[v.bodega, v.varietal].filter(Boolean).join(' · ') || '—'}</p>
                      <div className="flex items-baseline gap-2 mt-0.5">
                        <span className="font-bold text-botella-700 text-sm">${Number(v.precioVenta).toLocaleString('es-AR')}</span>
                        <span className="text-[10px] text-gray-400">stock {v.stock}</span>
                      </div>
                    </div>
                    {/* Tilde */}
                    <div className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition ${
                      seleccionado
                        ? 'bg-botella-700 text-white'
                        : 'bg-white border-2 border-gray-300'
                    }`}>
                      {seleccionado && (
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                          <path d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </button>

                  {/* Cantidad inline (solo si está seleccionado) */}
                  {seleccionado && (
                    <div className="mt-2.5 pt-2.5 border-t border-botella-200 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => cambiarCant(v, -1)}
                          className="w-9 h-9 rounded-lg bg-white border border-botella-300 text-botella-700 font-black text-lg active:bg-botella-100 transition"
                        >−</button>
                        <input
                          type="number"
                          inputMode="numeric"
                          value={cant}
                          onChange={e => setCantManual(v, e.target.value)}
                          min={1}
                          max={v.stock}
                          className="w-14 h-9 text-center font-black text-sm border border-botella-300 rounded-lg bg-white text-botella-900 focus:outline-none focus:ring-2 focus:ring-botella-500"
                        />
                        <button
                          onClick={() => cambiarCant(v, 1)}
                          disabled={cant >= v.stock}
                          className="w-9 h-9 rounded-lg bg-white border border-botella-300 text-botella-700 font-black text-lg active:bg-botella-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >+</button>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Subtotal</p>
                        <p className="font-black text-botella-800 text-sm">${(Number(v.precioVenta) * cant).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 3. Notas */}
      <div className="card p-4 sm:p-5">
        <h2 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">3. Notas (opcional)</h2>
        <textarea className="input resize-none" rows={2} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
      </div>

      {error && (
        <div className="card p-3 bg-red-50 border-red-200">
          <p className="text-red-700 text-sm font-semibold">{error}</p>
        </div>
      )}

      {/* Botón confirmar — sticky abajo */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white border-t-2 border-botella-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Total</p>
            <p className="text-2xl sm:text-3xl font-black text-botella-900 leading-none">
              ${total.toLocaleString('es-AR')}
            </p>
            {items.length > 0 && (
              <p className="text-[10px] text-gray-400 mt-0.5">{items.length} producto{items.length !== 1 ? 's' : ''} · {totalUnidades} u.</p>
            )}
          </div>
          <button
            onClick={confirmar}
            disabled={items.length === 0 || !clienteId || guardando}
            className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black text-sm sm:text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition flex items-center gap-2"
          >
            {guardando ? 'Guardando...' : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 13l4 4L19 7" />
                </svg>
                Confirmar venta
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
