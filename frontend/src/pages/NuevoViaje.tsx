import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import {
  DIAS_SEMANA, DIA_LABEL, DIA_CORTO, diaSemanaHoy,
  type Cliente, type DiaSemana, type Vino,
} from '../types'

/** Pedido: clienteId → vinoId → cantidad */
type Pedido = Record<number, Record<number, number>>

export default function NuevoViaje() {
  const [diaSel, setDiaSel] = useState<DiaSemana | 'TODOS'>(diaSemanaHoy())
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [bodega, setBodega] = useState<Vino[]>([])
  const [pedido, setPedido] = useState<Pedido>({})
  const [clienteActivoId, setClienteActivoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [busqCli, setBusqCli] = useState('')
  const [busqVino, setBusqVino] = useState('')
  const [loading, setLoading] = useState(false)
  const [mostrarDatos, setMostrarDatos] = useState(false)

  const navigate = useNavigate()

  useEffect(() => {
    const url = diaSel === 'TODOS' ? '/clientes' : `/clientes/dia/${diaSel}`
    api.get<Cliente[]>(url).then(r => setClientes(r.data)).catch(() => {})
  }, [diaSel])

  useEffect(() => {
    api.get<Vino[]>('/vinos/admin').then(r => setBodega(r.data.filter(v => v.activo))).catch(() => {})
  }, [])

  const clientesFiltrados = busqCli
    ? clientes.filter(c => c.nombre.toLowerCase().includes(busqCli.toLowerCase()) || (c.direccion ?? '').toLowerCase().includes(busqCli.toLowerCase()))
    : clientes

  const vinosFiltrados = busqVino
    ? bodega.filter(v => v.nombre.toLowerCase().includes(busqVino.toLowerCase()) || (v.bodega ?? '').toLowerCase().includes(busqVino.toLowerCase()))
    : bodega

  const cantidadCliente = (cId: number) =>
    Object.values(pedido[cId] ?? {}).reduce((acc, n) => acc + n, 0)

  /** Clientes con al menos 1 producto asignado (estos serán las paradas del viaje) */
  const clientesEnViaje = useMemo(() =>
    Object.keys(pedido)
      .map(Number)
      .filter(cId => cantidadCliente(cId) > 0)
      .map(cId => {
        // Buscar primero en clientes actuales; si filtró por día y el cliente quedó fuera,
        // igual debe seguir en el viaje, así que mantenemos el último conocido.
        const c = clientes.find(c => c.id === cId)
        return c
      })
      .filter((c): c is Cliente => Boolean(c)),
  [pedido, clientes])

  /** Carga agregada para mostrar el camión */
  const cargaAgregada = useMemo(() => {
    const map = new Map<number, number>()
    for (const cId of Object.keys(pedido).map(Number)) {
      const items = pedido[cId] ?? {}
      for (const [vId, n] of Object.entries(items)) {
        if (n > 0) map.set(Number(vId), (map.get(Number(vId)) ?? 0) + n)
      }
    }
    return Array.from(map.entries())
      .map(([vinoId, cantidad]) => {
        const v = bodega.find(b => b.id === vinoId)
        return { vinoId, nombre: v?.nombre ?? '—', fotoUrl: v?.fotoUrl, cantidad, stock: v?.stock ?? 0 }
      })
      .sort((a, b) => b.cantidad - a.cantidad)
  }, [pedido, bodega])

  const totalGeneral = cargaAgregada.reduce((acc, c) => acc + c.cantidad, 0)

  const clienteActivo = clientesFiltrados.find(c => c.id === clienteActivoId)
    ?? clientes.find(c => c.id === clienteActivoId)
    ?? null

  const pedidoActivo = clienteActivoId ? pedido[clienteActivoId] ?? {} : {}

  const cantidadParaActivo = (vinoId: number) => pedidoActivo[vinoId] ?? 0

  const setItem = (vinoId: number, cantidad: number) => {
    if (!clienteActivoId) return
    setPedido(p => {
      const map = { ...(p[clienteActivoId] ?? {}) }
      if (cantidad <= 0) delete map[vinoId]
      else map[vinoId] = cantidad
      return { ...p, [clienteActivoId]: map }
    })
  }

  const sumar = (v: Vino, delta: number) => {
    if (!clienteActivoId) return
    const actual = cantidadParaActivo(v.id)
    const nueva = Math.max(0, Math.min(v.stock, actual + delta))
    setItem(v.id, nueva)
  }

  const toggleCliente = (c: Cliente) => {
    if (clienteActivoId === c.id) {
      setClienteActivoId(null)
      return
    }
    setClienteActivoId(c.id)
  }

  const quitarClienteDelViaje = (cId: number) => {
    setPedido(p => {
      const { [cId]: _, ...resto } = p
      return resto
    })
    if (clienteActivoId === cId) setClienteActivoId(null)
  }

  const crear = async () => {
    if (clientesEnViaje.length === 0) return
    setLoading(true)
    try {
      const paradas = clientesEnViaje.map(c => ({
        clienteId: c.id,
        items: Object.entries(pedido[c.id] ?? {})
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
    <div className="space-y-4 pb-32">
      <Link to="/app/viajes" className="text-botella-700 text-sm font-medium hover:underline">← Viajes</Link>

      {/* Header con día seleccionado */}
      <div className="card overflow-hidden border-2 border-botella-200">
        <div className="bg-gradient-to-r from-botella-700 via-botella-800 to-botella-900 px-5 py-4 text-white">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-dorado-300 font-bold">Armando viaje</p>
              <h1 className="text-2xl sm:text-3xl font-black mt-0.5" style={{ fontFamily: 'Georgia, serif' }}>
                {diaSel === 'TODOS' ? 'Todos los clientes' : DIA_LABEL[diaSel]}
              </h1>
              <p className="text-sm text-botella-200 mt-1">
                {clientesFiltrados.length} cliente{clientesFiltrados.length !== 1 ? 's' : ''} disponible{clientesFiltrados.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => setMostrarDatos(v => !v)}
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-sm font-bold transition flex items-center gap-2"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              Datos del viaje
            </button>
          </div>

          {/* Selector de día */}
          <div className="mt-4 scroll-h -mx-5 px-5">
            <div className="flex gap-1.5 w-max">
              <button
                onClick={() => setDiaSel('TODOS')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                  diaSel === 'TODOS'
                    ? 'bg-dorado-500 text-botella-950 shadow-lg'
                    : 'bg-white/10 border border-white/20 text-botella-100 hover:bg-white/20'
                }`}
              >Todos</button>
              {DIAS_SEMANA.map(d => (
                <button
                  key={d}
                  onClick={() => setDiaSel(d)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    diaSel === d
                      ? 'bg-dorado-500 text-botella-950 shadow-lg'
                      : 'bg-white/10 border border-white/20 text-botella-100 hover:bg-white/20'
                  }`}
                >
                  <span className="sm:hidden">{DIA_CORTO[d]}</span>
                  <span className="hidden sm:inline">{DIA_LABEL[d]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Datos del viaje (colapsable) */}
        {mostrarDatos && (
          <div className="p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50 border-t border-gray-200">
            <div>
              <label className="label">Fecha</label>
              <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="label">Título (opcional)</label>
              <input className="input" placeholder="Viaje X" value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <input className="input" placeholder="..." value={notas} onChange={e => setNotas(e.target.value)} />
            </div>
          </div>
        )}
      </div>

      {/* PANEL PRINCIPAL: 2 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* IZQUIERDA: Clientes */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-botella-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-black text-botella-900 text-sm sm:text-base flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-botella-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Clientes
              </h2>
              {clientesEnViaje.length > 0 && (
                <span className="text-[10px] font-black text-white bg-botella-700 px-2 py-1 rounded-full">
                  {clientesEnViaje.length} en viaje
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-500 mt-0.5">Tocá uno para asignarle vinos →</p>
          </div>

          <div className="p-3">
            <input className="input mb-2" placeholder="🔍 Buscar cliente..." value={busqCli} onChange={e => setBusqCli(e.target.value)} />
          </div>

          <div className="max-h-[480px] lg:max-h-[560px] overflow-y-auto divide-y divide-gray-100">
            {clientesFiltrados.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">Sin clientes para este filtro.</p>
            ) : clientesFiltrados.map(c => {
              const cant = cantidadCliente(c.id)
              const enViaje = cant > 0
              const activo = clienteActivoId === c.id
              const inicial = c.nombre.charAt(0).toUpperCase()
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCliente(c)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition relative ${
                    activo
                      ? 'bg-dorado-50 border-l-4 border-dorado-500'
                      : enViaje
                        ? 'bg-botella-50/50 hover:bg-botella-50 border-l-4 border-botella-400'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                  }`}
                >
                  {/* Avatar con inicial */}
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-black text-base shrink-0 transition ${
                    activo
                      ? 'bg-dorado-500 text-botella-950 shadow-md ring-2 ring-dorado-300'
                      : enViaje
                        ? 'bg-botella-700 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>
                    {inicial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm truncate ${activo ? 'text-botella-900' : 'text-gray-900'}`}>
                      {c.nombre}
                    </p>
                    {c.direccion && (
                      <p className="text-[11px] text-gray-500 truncate">📍 {c.direccion}</p>
                    )}
                  </div>
                  {enViaje && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-black text-white bg-botella-700 px-2 py-1 rounded-full">
                        {cant} u.
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); quitarClienteDelViaje(c.id) }}
                        className="w-7 h-7 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 text-base font-bold transition"
                        title="Sacar del viaje"
                      >✕</button>
                    </div>
                  )}
                  {activo && (
                    <svg viewBox="0 0 24 24" className="w-5 h-5 text-dorado-700 shrink-0" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 18l6-6-6-6" />
                    </svg>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* DERECHA: Vinos para el cliente activo */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 bg-gradient-to-r from-dorado-50 to-white border-b border-gray-100">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-black text-botella-900 text-sm sm:text-base flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-dorado-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 2h8v6a4 4 0 0 1-8 0V2z" />
                  <path d="M12 12v8M9 22h6" />
                </svg>
                {clienteActivo ? `Vinos para ${clienteActivo.nombre.split(' ')[0]}` : 'Vinos'}
              </h2>
              {clienteActivoId && cantidadCliente(clienteActivoId) > 0 && (
                <span className="text-[10px] font-black text-botella-950 bg-dorado-500 px-2 py-1 rounded-full">
                  {cantidadCliente(clienteActivoId)} u.
                </span>
              )}
            </div>
            {clienteActivo
              ? <p className="text-[11px] text-gray-600 mt-0.5">Tocá un vino para sumar, +/− para ajustar</p>
              : <p className="text-[11px] text-gray-500 mt-0.5">← Elegí un cliente a la izquierda</p>}
          </div>

          {!clienteActivo ? (
            <div className="p-8 text-center">
              <div className="mx-auto w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg viewBox="0 0 24 24" className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <p className="text-sm font-bold text-gray-500">Elegí un cliente</p>
              <p className="text-xs text-gray-400 mt-1">Para asignarle los vinos que se le llevan</p>
            </div>
          ) : (
            <>
              <div className="p-3">
                <input className="input" placeholder="🔍 Buscar vino..." value={busqVino} onChange={e => setBusqVino(e.target.value)} />
              </div>
              <div className="max-h-[480px] lg:max-h-[560px] overflow-y-auto px-3 pb-3 space-y-2">
                {vinosFiltrados.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-400">Sin vinos. Cargá en Bodega.</p>
                ) : vinosFiltrados.map(v => {
                  const cant = cantidadParaActivo(v.id)
                  const seleccionado = cant > 0
                  return (
                    <div
                      key={v.id}
                      className={`border rounded-xl transition ${
                        seleccionado
                          ? 'border-dorado-500 bg-dorado-50 shadow-sm ring-1 ring-dorado-300'
                          : 'border-gray-200 hover:border-dorado-300 bg-white'
                      }`}
                    >
                      <button
                        onClick={() => sumar(v, 1)}
                        disabled={v.stock === 0 || cant >= v.stock}
                        className="w-full flex items-center gap-3 p-2.5 text-left disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {/* Foto del vino */}
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center shrink-0">
                          {v.fotoUrl
                            ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                            : <span className="text-2xl text-gray-300">🍷</span>}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm text-gray-900 truncate">{v.nombre}</p>
                          <p className="text-[11px] text-gray-500 truncate">{[v.bodega, v.varietal].filter(Boolean).join(' · ') || '—'}</p>
                          <div className="flex items-baseline gap-2 mt-0.5">
                            <span className="font-bold text-botella-700 text-xs">${Number(v.precioVenta).toLocaleString('es-AR')}</span>
                            <span className={`text-[10px] ${v.stock <= 5 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                              stock {v.stock}
                            </span>
                          </div>
                        </div>
                        {/* Tilde / cantidad */}
                        <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-base transition ${
                          seleccionado
                            ? 'bg-dorado-500 text-botella-950'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          {seleccionado ? cant : (
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 5v14M5 12h14" />
                            </svg>
                          )}
                        </div>
                      </button>

                      {/* Controles cantidad (solo si seleccionado) */}
                      {seleccionado && (
                        <div className="px-2.5 pb-2.5 pt-1 flex items-center gap-1.5 border-t border-dorado-200 mt-1">
                          <button
                            onClick={() => sumar(v, -1)}
                            className="w-9 h-9 rounded-lg bg-white border border-dorado-300 text-dorado-800 font-black text-lg active:bg-dorado-100 transition"
                          >−</button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={v.stock}
                            value={cant}
                            onChange={e => {
                              const n = parseInt(e.target.value, 10)
                              setItem(v.id, isNaN(n) || n < 0 ? 0 : Math.min(n, v.stock))
                            }}
                            className="flex-1 h-9 text-center font-black text-sm border border-dorado-300 rounded-lg bg-white text-botella-900 focus:outline-none focus:ring-2 focus:ring-dorado-500"
                          />
                          <button
                            onClick={() => sumar(v, 1)}
                            disabled={cant >= v.stock}
                            className="w-9 h-9 rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black text-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                          >+</button>
                          <span className="text-[10px] text-gray-500 ml-1 shrink-0">
                            ${(Number(v.precioVenta) * cant).toLocaleString('es-AR')}
                          </span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Carga del camión (resumen visual) */}
      {cargaAgregada.length > 0 && (
        <div className="card overflow-hidden border-l-4 border-dorado-500">
          <div className="bg-gradient-to-r from-botella-50 to-dorado-50 px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black text-botella-900 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-5 h-5 text-botella-700" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Camión cargado
              </h2>
              <p className="text-[11px] text-gray-500 mt-0.5">Total a llevar de cada producto</p>
            </div>
            <span className="text-2xl font-black text-botella-900">{totalGeneral} u.</span>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
            {cargaAgregada.map(c => {
              const insuficiente = c.cantidad > c.stock
              return (
                <div key={c.vinoId} className={`flex items-center gap-2 rounded-lg p-2 border ${insuficiente ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'}`}>
                  <div className="w-9 h-9 rounded overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                    {c.fotoUrl
                      ? <img src={c.fotoUrl} alt={c.nombre} className="w-full h-full object-cover" />
                      : <span className="text-base text-gray-300">🍷</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-900 truncate">{c.nombre}</p>
                    <p className={`text-[10px] ${insuficiente ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                      Stock: {c.stock}
                    </p>
                  </div>
                  <span className={`font-black text-base ${insuficiente ? 'text-red-600' : 'text-botella-800'}`}>
                    {c.cantidad}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Sticky bottom: crear viaje */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-64 z-30 bg-white border-t-2 border-botella-200 shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide font-bold">Viaje del {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}</p>
            <p className="text-lg sm:text-2xl font-black text-botella-900 leading-none">
              {clientesEnViaje.length} cliente{clientesEnViaje.length !== 1 ? 's' : ''} · {totalGeneral} u.
            </p>
          </div>
          <button
            onClick={crear}
            disabled={clientesEnViaje.length === 0 || loading}
            className="px-5 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black text-sm sm:text-base shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition flex items-center gap-2"
          >
            {loading ? 'Creando...' : (
              <>
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <rect x="1" y="3" width="15" height="13" />
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                  <circle cx="5.5" cy="18.5" r="2.5" />
                  <circle cx="18.5" cy="18.5" r="2.5" />
                </svg>
                Crear viaje
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
