import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { useRealtimeRefresh } from '../services/realtime'
import Icon from '../components/Icon'
import {
  DIAS_SEMANA, DIA_LABEL, DIA_CORTO, diaSemanaHoy,
  totalProductosViaje,
  type Cliente, type DiaSemana, type Viaje, type Vino,
} from '../types'

const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
const fmtCorto = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

const DIA_POR_INDEX: DiaSemana[] = ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO']
/** Devuelve la próxima fecha (incluido hoy) que cae en el día de la semana indicado. */
function proximaFechaDelDia(dia: DiaSemana, desde = new Date()): string {
  const objetivoIdx = DIA_POR_INDEX.indexOf(dia)
  const hoyIdx = desde.getDay()
  const diff = (objetivoIdx - hoyIdx + 7) % 7  // 0 = hoy, 1 = mañana, ..., 6 = en 6 días
  const target = new Date(desde)
  target.setDate(desde.getDate() + diff)
  return target.toISOString().slice(0, 10)
}
/** Devuelve el DiaSemana correspondiente a una fecha YYYY-MM-DD. */
function diaSemanaDeFecha(iso: string): DiaSemana {
  const idx = new Date(iso + 'T00:00:00').getDay()
  return DIA_POR_INDEX[idx]
}

/** Pedido: clienteId → vinoId → cantidad */
type Pedido = Record<number, Record<number, number>>
/** Extras del viaje: vinoId → cantidad (productos sueltos sin cliente) */
type Extras = Record<number, number>

export default function Viajes() {
  // ====== DATOS ======
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [bodega, setBodega] = useState<Vino[]>([])
  const [clientesPorDia, setClientesPorDia] = useState<Record<DiaSemana, Cliente[]>>({} as Record<DiaSemana, Cliente[]>)

  // ====== ESTADO DEL ARMADO DE VIAJE ======
  const [diaSel, setDiaSel] = useState<DiaSemana>(diaSemanaHoy())
  const [pedido, setPedido] = useState<Pedido>({})
  const [extras, setExtras] = useState<Extras>({})
  const [clienteActivoId, setClienteActivoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10))

  // Sincronización día↔fecha
  const elegirDia = (d: DiaSemana) => {
    setDiaSel(d)
    setFecha(proximaFechaDelDia(d))
    setClienteActivoId(null)
  }
  const elegirFecha = (nuevaFecha: string) => {
    if (!nuevaFecha) return
    setFecha(nuevaFecha)
    setDiaSel(diaSemanaDeFecha(nuevaFecha))
    setClienteActivoId(null)
  }
  const [busqCli, setBusqCli] = useState('')
  const [busqVino, setBusqVino] = useState('')
  const [busqExtra, setBusqExtra] = useState('')
  const [mostrarExtras, setMostrarExtras] = useState(false)
  const [loading, setLoading] = useState(false)

  // ====== HISTORIAL ======
  const [filtroHist, setFiltroHist] = useState<'TODOS' | 'EN_CURSO' | 'FINALIZADO'>('TODOS')

  const navigate = useNavigate()

  // ====== CARGA INICIAL ======
  const cargarViajes = () => api.get<Viaje[]>('/viajes').then(r => setViajes(r.data)).catch(() => {})
  useEffect(() => { cargarViajes() }, [])
  useRealtimeRefresh(tabla => {
    if (tabla === 'viajes') cargarViajes()
    if (tabla === 'clientes') cargarClientesTodos()
    if (tabla === 'vinos') cargarBodega()
  })

  // Carga todos los clientes una sola vez y los agrupa por día
  const cargarClientesTodos = () => {
    api.get<Cliente[]>('/clientes').then(r => {
      const map = {} as Record<DiaSemana, Cliente[]>
      for (const d of DIAS_SEMANA) map[d] = []
      for (const c of r.data) if (c.diaReparto) map[c.diaReparto].push(c)
      setClientesPorDia(map)
    }).catch(() => {})
  }
  useEffect(() => { cargarClientesTodos() }, [])

  const cargarBodega = () => api.get<Vino[]>('/vinos/admin').then(r => setBodega(r.data.filter(v => v.activo))).catch(() => {})
  useEffect(() => { cargarBodega() }, [])

  // ====== HELPERS ======
  const clientesDia = clientesPorDia[diaSel] ?? []

  const clientesFiltrados = useMemo(() => {
    if (!busqCli.trim()) return clientesDia
    const q = busqCli.toLowerCase()
    return clientesDia.filter(c =>
      c.nombre.toLowerCase().includes(q) ||
      (c.direccion ?? '').toLowerCase().includes(q)
    )
  }, [clientesDia, busqCli])

  const cantidadCliente = (cId: number) =>
    Object.values(pedido[cId] ?? {}).reduce((acc, n) => acc + n, 0)

  const clientesEnViaje = useMemo(() => {
    const ids = Object.keys(pedido).map(Number).filter(cId => cantidadCliente(cId) > 0)
    return ids
      .map(cId => clientesDia.find(c => c.id === cId)
        || Object.values(clientesPorDia).flat().find(c => c.id === cId))
      .filter((c): c is Cliente => Boolean(c))
  }, [pedido, clientesDia, clientesPorDia])

  const clienteActivo = clienteActivoId
    ? clientesDia.find(c => c.id === clienteActivoId)
        ?? Object.values(clientesPorDia).flat().find(c => c.id === clienteActivoId)
        ?? null
    : null

  const pedidoActivo = clienteActivoId ? (pedido[clienteActivoId] ?? {}) : {}
  const cantParaActivo = (vinoId: number) => pedidoActivo[vinoId] ?? 0

  // Vinos filtrados para el panel derecho
  const vinosFiltrados = useMemo(() => {
    if (!busqVino.trim()) return bodega
    const q = busqVino.toLowerCase()
    return bodega.filter(v => v.nombre.toLowerCase().includes(q) || (v.bodega ?? '').toLowerCase().includes(q))
  }, [bodega, busqVino])
  const vinosExtrasFiltrados = useMemo(() => {
    if (!busqExtra.trim()) return bodega
    const q = busqExtra.toLowerCase()
    return bodega.filter(v => v.nombre.toLowerCase().includes(q) || (v.bodega ?? '').toLowerCase().includes(q))
  }, [bodega, busqExtra])

  // Carga agregada del camión: paradas + extras
  const cargaAgregada = useMemo(() => {
    const map = new Map<number, number>()
    for (const cId of Object.keys(pedido).map(Number)) {
      for (const [vId, n] of Object.entries(pedido[cId] ?? {})) {
        if (n > 0) map.set(Number(vId), (map.get(Number(vId)) ?? 0) + n)
      }
    }
    for (const [vId, n] of Object.entries(extras)) {
      if (n > 0) map.set(Number(vId), (map.get(Number(vId)) ?? 0) + n)
    }
    return Array.from(map.entries())
      .map(([vinoId, cantidad]) => {
        const v = bodega.find(b => b.id === vinoId)
        return { vinoId, nombre: v?.nombre ?? '—', fotoUrl: v?.fotoUrl, cantidad, stock: v?.stock ?? 0 }
      })
      .sort((a, b) => b.cantidad - a.cantidad)
  }, [pedido, extras, bodega])

  const totalUnidades = cargaAgregada.reduce((acc, c) => acc + c.cantidad, 0)
  const totalExtras = Object.values(extras).reduce((acc, n) => acc + n, 0)
  const hayAlgoEnViaje = clientesEnViaje.length > 0 || totalExtras > 0

  // ====== HANDLERS ======
  const toggleCliente = (c: Cliente) => {
    if (clienteActivoId === c.id) {
      setClienteActivoId(null)
    } else {
      setClienteActivoId(c.id)
    }
  }

  const quitarClienteDelViaje = (cId: number) => {
    setPedido(p => {
      const { [cId]: _, ...resto } = p
      return resto
    })
    if (clienteActivoId === cId) setClienteActivoId(null)
  }

  const cambiarItemActivo = (vinoId: number, nuevaCantidad: number) => {
    if (!clienteActivoId) return
    setPedido(p => {
      const map = { ...(p[clienteActivoId] ?? {}) }
      if (nuevaCantidad <= 0) delete map[vinoId]
      else map[vinoId] = nuevaCantidad
      return { ...p, [clienteActivoId]: map }
    })
  }

  const sumarActivo = (v: Vino, delta: number) => {
    const actual = cantParaActivo(v.id)
    const nueva = Math.max(0, Math.min(v.stock, actual + delta))
    cambiarItemActivo(v.id, nueva)
  }

  const cambiarExtra = (vinoId: number, nuevaCantidad: number) => {
    setExtras(e => {
      const next = { ...e }
      if (nuevaCantidad <= 0) delete next[vinoId]
      else next[vinoId] = nuevaCantidad
      return next
    })
  }
  const sumarExtra = (v: Vino, delta: number) => {
    const actual = extras[v.id] ?? 0
    cambiarExtra(v.id, Math.max(0, Math.min(v.stock, actual + delta)))
  }

  const limpiarViaje = () => {
    if (!hayAlgoEnViaje) return
    if (!confirm('¿Vaciar lo que llevás armado del viaje?')) return
    setPedido({}); setExtras({}); setClienteActivoId(null)
  }

  const crearViaje = async () => {
    if (!hayAlgoEnViaje) return
    setLoading(true)
    try {
      const paradas = clientesEnViaje.map(c => ({
        clienteId: c.id,
        items: Object.entries(pedido[c.id] ?? {})
          .map(([vId, n]) => ({ vinoId: Number(vId), cantidad: n }))
          .filter(it => it.cantidad > 0),
      }))
      const extrasInput = Object.entries(extras)
        .map(([vId, n]) => ({ vinoId: Number(vId), cantidad: n }))
        .filter(it => it.cantidad > 0)
      const r = await api.post<{ id: number }>('/viajes', {
        fecha,
        titulo: `Recorrido ${DIA_LABEL[diaSel]} · ${fmtCorto(fecha)}`,
        paradas,
        extras: extrasInput,
      })
      navigate(`/app/viajes/${r.data.id}`)
    } finally { setLoading(false) }
  }

  const visibles = filtroHist === 'TODOS' ? viajes : viajes.filter(v => v.estado === filtroHist)

  // ====== RENDER ======
  return (
    <div className="space-y-4 pb-48 lg:pb-32">
      {/* HEADER + Fecha */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="page-title">Viajes</h1>
          <p className="page-subtitle">Armá el reparto del día y revisá los anteriores</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-wide font-bold text-gray-500">Fecha</label>
          <input
            type="date"
            value={fecha}
            onChange={e => elegirFecha(e.target.value)}
            className="input !py-1.5 text-sm w-auto"
          />
        </div>
      </div>

      {/* SELECTOR DE DÍA */}
      <div className="scroll-h">
        <div className="flex gap-1.5 w-max">
          {DIAS_SEMANA.map(d => {
            const activo = diaSel === d
            const cant = (clientesPorDia[d] ?? []).length
            return (
              <button
                key={d}
                onClick={() => elegirDia(d)}
                className={`px-4 py-2.5 rounded-xl text-sm font-bold whitespace-nowrap transition flex items-center gap-2 border-2 ${
                  activo
                    ? 'bg-botella-700 text-white border-botella-700 shadow-md'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-botella-300 active:bg-botella-50'
                }`}
              >
                <span className="sm:hidden">{DIA_CORTO[d]}</span>
                <span className="hidden sm:inline">{DIA_LABEL[d]}</span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                  activo ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
                }`}>{cant}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* PANEL PRINCIPAL: clientes + vinos */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* IZQUIERDA: Clientes del día */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-botella-50 to-white">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-botella-900 text-sm sm:text-base flex items-center gap-2">
                <Icon name="users" className="w-5 h-5 text-botella-700" />
                Clientes · {DIA_LABEL[diaSel]}
              </h2>
              {clientesEnViaje.length > 0 && (
                <span className="text-[10px] font-black text-white bg-botella-700 px-2 py-1 rounded-full">
                  {clientesEnViaje.length} en viaje
                </span>
              )}
            </div>
            <div className="relative mt-2.5">
              <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                className="input !pl-8"
                placeholder="Buscar cliente..."
                value={busqCli}
                onChange={e => setBusqCli(e.target.value)}
              />
            </div>
          </div>
          <div className="max-h-[460px] lg:max-h-[600px] overflow-y-auto divide-y divide-gray-100">
            {clientesFiltrados.length === 0 ? (
              <div className="p-8 text-center">
                <Icon name="inbox" className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-semibold text-gray-500">
                  {clientesDia.length === 0
                    ? `Sin clientes para ${DIA_LABEL[diaSel].toLowerCase()}`
                    : 'Sin resultados'}
                </p>
                {clientesDia.length === 0 && (
                  <p className="text-xs text-gray-400 mt-1">Asigná el día desde la ficha del cliente</p>
                )}
              </div>
            ) : clientesFiltrados.map(c => {
              const cant = cantidadCliente(c.id)
              const enViaje = cant > 0
              const activo = clienteActivoId === c.id
              const inicial = c.nombre.charAt(0).toUpperCase()
              return (
                <button
                  key={c.id}
                  onClick={() => toggleCliente(c)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition border-l-4 ${
                    activo
                      ? 'bg-dorado-50 border-dorado-500'
                      : enViaje
                        ? 'bg-botella-50/50 hover:bg-botella-50 border-botella-400'
                        : 'hover:bg-gray-50 border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm shrink-0 transition ${
                    activo
                      ? 'bg-dorado-500 text-botella-950 shadow ring-2 ring-dorado-300'
                      : enViaje
                        ? 'bg-botella-700 text-white'
                        : 'bg-gray-200 text-gray-600'
                  }`}>{inicial}</div>
                  <div className="min-w-0 flex-1">
                    <p className={`font-bold text-sm truncate ${activo ? 'text-botella-900' : 'text-gray-900'}`}>{c.nombre}</p>
                    {c.direccion && (
                      <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
                        <Icon name="map-pin" className="w-3 h-3 shrink-0" />
                        {c.direccion}
                      </p>
                    )}
                  </div>
                  {enViaje && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-[10px] font-black text-white bg-botella-700 px-2 py-0.5 rounded-full">{cant} u.</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); quitarClienteDelViaje(c.id) }}
                        className="w-6 h-6 rounded-full text-red-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition"
                        title="Sacar del viaje"
                      >
                        <Icon name="x" className="w-3.5 h-3.5" strokeWidth={2.5} />
                      </button>
                    </div>
                  )}
                  {activo && <Icon name="chevron-right" className="w-4 h-4 text-dorado-700 shrink-0" strokeWidth={3} />}
                </button>
              )
            })}
          </div>
        </div>

        {/* DERECHA: Vinos para el cliente activo */}
        <div className="lg:col-span-3 card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-dorado-50 to-white">
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-black text-botella-900 text-sm sm:text-base flex items-center gap-2">
                <Icon name="wine-bottle" className="w-5 h-5 text-dorado-700" />
                {clienteActivo ? `Vinos para ${clienteActivo.nombre}` : 'Vinos del cliente'}
              </h2>
              {clienteActivoId && cantidadCliente(clienteActivoId) > 0 && (
                <span className="text-[10px] font-black text-botella-950 bg-dorado-500 px-2 py-1 rounded-full">
                  {cantidadCliente(clienteActivoId)} u.
                </span>
              )}
            </div>
            {clienteActivo && (
              <div className="relative mt-2.5">
                <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  className="input !pl-8"
                  placeholder="Buscar vino..."
                  value={busqVino}
                  onChange={e => setBusqVino(e.target.value)}
                />
              </div>
            )}
          </div>

          {!clienteActivo ? (
            <div className="p-10 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                <Icon name="arrow-left" className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-bold text-gray-500">Elegí un cliente</p>
              <p className="text-xs text-gray-400 mt-1">Tocalo a la izquierda para asignarle los vinos</p>
            </div>
          ) : vinosFiltrados.length === 0 ? (
            <div className="p-10 text-center">
              <Icon name="inbox" className="w-10 h-10 text-gray-200 mx-auto mb-2" />
              <p className="text-sm font-semibold text-gray-500">Sin vinos en bodega</p>
            </div>
          ) : (
            <div className="max-h-[460px] lg:max-h-[600px] overflow-y-auto p-3 space-y-2">
              {vinosFiltrados.map(v => {
                const cant = cantParaActivo(v.id)
                const seleccionado = cant > 0
                const sinStock = v.stock === 0
                return (
                  <div
                    key={v.id}
                    className={`border rounded-xl transition ${
                      seleccionado
                        ? 'border-dorado-500 bg-dorado-50 shadow-sm ring-1 ring-dorado-300'
                        : sinStock
                          ? 'border-gray-200 bg-gray-50 opacity-60'
                          : 'border-gray-200 bg-white hover:border-dorado-300'
                    }`}
                  >
                    <button
                      onClick={() => sumarActivo(v, 1)}
                      disabled={sinStock || cant >= v.stock}
                      className="w-full flex items-center gap-3 p-2.5 text-left disabled:cursor-not-allowed"
                    >
                      <div className="w-14 h-14 rounded-lg overflow-hidden bg-white border border-gray-200 flex items-center justify-center shrink-0">
                        {v.fotoUrl
                          ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                          : <Icon name="wine-bottle" className="w-6 h-6 text-gray-300" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-gray-900 truncate">{v.nombre}</p>
                        <p className="text-[11px] text-gray-500 truncate">{[v.bodega, v.varietal].filter(Boolean).join(' · ') || '—'}</p>
                        <div className="flex items-baseline gap-2 mt-0.5">
                          <span className="font-bold text-botella-700 text-xs">${Number(v.precioVenta).toLocaleString('es-AR')}</span>
                          <span className={`text-[10px] ${v.stock <= 5 ? 'text-red-600 font-bold' : 'text-gray-400'}`}>
                            {sinStock ? 'sin stock' : `stock ${v.stock}`}
                          </span>
                        </div>
                      </div>
                      <div className={`shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-black text-base transition ${
                        seleccionado
                          ? 'bg-dorado-500 text-botella-950'
                          : 'bg-gray-100 text-gray-400'
                      }`}>
                        {seleccionado ? cant : <Icon name="plus" className="w-5 h-5" strokeWidth={3} />}
                      </div>
                    </button>

                    {seleccionado && (
                      <div className="px-2.5 pb-2.5 pt-1 flex items-center gap-1.5 border-t border-dorado-200 mt-1">
                        <button
                          onClick={() => sumarActivo(v, -1)}
                          className="w-9 h-9 rounded-lg bg-white border border-dorado-300 text-dorado-800 active:bg-dorado-100 transition flex items-center justify-center"
                        ><Icon name="minus" className="w-4 h-4" strokeWidth={3} /></button>
                        <input
                          type="number"
                          inputMode="numeric"
                          min={0}
                          max={v.stock}
                          value={cant}
                          onChange={e => {
                            const n = parseInt(e.target.value, 10)
                            cambiarItemActivo(v.id, isNaN(n) || n < 0 ? 0 : Math.min(n, v.stock))
                          }}
                          className="flex-1 h-9 text-center font-black text-sm border border-dorado-300 rounded-lg bg-white text-botella-900 focus:outline-none focus:ring-2 focus:ring-dorado-500"
                        />
                        <button
                          onClick={() => sumarActivo(v, 1)}
                          disabled={cant >= v.stock}
                          className="w-9 h-9 rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center justify-center"
                        ><Icon name="plus" className="w-4 h-4" strokeWidth={3} /></button>
                        <span className="text-[10px] text-gray-500 ml-1 shrink-0">
                          ${(Number(v.precioVenta) * cant).toLocaleString('es-AR')}
                        </span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* CARGA DEL CAMIÓN — destacado visual */}
      {cargaAgregada.length > 0 && (
        <div className="card overflow-hidden ring-2 ring-dorado-500/50 shadow-xl shadow-dorado-500/20">
          <div className="bg-gradient-to-br from-botella-700 via-botella-800 to-botella-900 px-5 py-4 text-white relative overflow-hidden">
            {/* Decoración de fondo: ícono gigante semi-transparente */}
            <div className="absolute -right-4 -bottom-4 opacity-10 pointer-events-none">
              <Icon name="truck" className="w-32 h-32 text-dorado-300" strokeWidth={1.5} />
            </div>
            <div className="relative flex items-start justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-dorado-500 text-botella-950 flex items-center justify-center shadow-lg">
                  <Icon name="truck" className="w-7 h-7" strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[10px] tracking-[0.25em] uppercase text-dorado-300 font-bold">Camión cargado</p>
                  <h2 className="text-2xl font-black text-white leading-none mt-0.5">
                    {totalUnidades} <span className="text-base font-bold text-dorado-200">unidades</span>
                  </h2>
                  <p className="text-xs text-botella-200 mt-1">{cargaAgregada.length} producto{cargaAgregada.length !== 1 ? 's' : ''} distinto{cargaAgregada.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button
                onClick={limpiarViaje}
                className="text-xs text-dorado-300 hover:text-white bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg font-bold transition"
              >Limpiar</button>
            </div>
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 bg-gradient-to-b from-dorado-50/40 to-white">
            {cargaAgregada.map(c => {
              const insuficiente = c.cantidad > c.stock
              return (
                <div key={c.vinoId} className={`flex items-center gap-2 rounded-lg p-2 border ${insuficiente ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} shadow-sm`}>
                  <div className="w-10 h-10 rounded overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                    {c.fotoUrl
                      ? <img src={c.fotoUrl} alt={c.nombre} className="w-full h-full object-cover" />
                      : <Icon name="wine-bottle" className="w-5 h-5 text-gray-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs text-gray-900 truncate">{c.nombre}</p>
                    <p className={`text-[10px] ${insuficiente ? 'text-red-600 font-bold' : 'text-gray-500'}`}>Stock: {c.stock}</p>
                  </div>
                  <span className={`font-black text-lg ${insuficiente ? 'text-red-600' : 'text-botella-800'}`}>{c.cantidad}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* EXTRAS DEL VIAJE — productos sueltos por las dudas */}
      <div className="card overflow-hidden border-l-4 border-gray-300">
        <button
          onClick={() => setMostrarExtras(v => !v)}
          className="w-full px-4 py-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 flex items-center justify-between text-left hover:bg-gray-100 transition"
        >
          <div>
            <h2 className="text-sm font-black text-botella-900 flex items-center gap-2">
              <Icon name="box" className="w-5 h-5 text-gray-600" />
              Extras del camión
              {totalExtras > 0 && (
                <span className="text-[10px] font-black text-white bg-botella-700 px-2 py-0.5 rounded-full">
                  +{totalExtras} u.
                </span>
              )}
            </h2>
            <p className="text-[11px] text-gray-500 mt-0.5">Productos sueltos por las dudas, sin cliente asignado</p>
          </div>
          <Icon name={mostrarExtras ? 'chevron-down' : 'chevron-right'} className="w-5 h-5 text-gray-400" strokeWidth={2.5} />
        </button>

        {mostrarExtras && (
          <div className="p-3">
            <div className="relative mb-3">
              <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                className="input !pl-8"
                placeholder="Buscar vino..."
                value={busqExtra}
                onChange={e => setBusqExtra(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
              {vinosExtrasFiltrados.map(v => {
                const cant = extras[v.id] ?? 0
                const seleccionado = cant > 0
                return (
                  <div
                    key={v.id}
                    className={`border rounded-lg p-2 flex items-center gap-2 transition ${
                      seleccionado ? 'border-botella-400 bg-botella-50' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded overflow-hidden bg-white border border-gray-200 shrink-0 flex items-center justify-center">
                      {v.fotoUrl
                        ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                        : <Icon name="wine-bottle" className="w-5 h-5 text-gray-300" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-xs text-gray-900 truncate">{v.nombre}</p>
                      <p className="text-[10px] text-gray-500">stock {v.stock}</p>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => sumarExtra(v, -1)}
                        disabled={cant === 0}
                        className="w-7 h-7 rounded bg-white border border-gray-300 text-gray-700 disabled:opacity-30 active:bg-gray-100 flex items-center justify-center"
                      ><Icon name="minus" className="w-3.5 h-3.5" strokeWidth={3} /></button>
                      <span className="w-7 text-center font-black text-sm text-botella-800">{cant}</span>
                      <button
                        onClick={() => sumarExtra(v, 1)}
                        disabled={cant >= v.stock}
                        className="w-7 h-7 rounded bg-botella-700 hover:bg-botella-800 text-white disabled:opacity-40 active:bg-botella-900 flex items-center justify-center"
                      ><Icon name="plus" className="w-3.5 h-3.5" strokeWidth={3} /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* HISTORIAL */}
      <section className="pt-2">
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <h2 className="text-base font-black text-botella-900 flex items-center gap-2">
            <Icon name="calendar" className="w-5 h-5 text-botella-700" />
            Historial
          </h2>
          <div className="flex gap-1.5">
            {([['TODOS','Todos'], ['EN_CURSO','En curso'], ['FINALIZADO','Hechos']] as const).map(([k, l]) => (
              <button
                key={k}
                onClick={() => setFiltroHist(k)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${
                  filtroHist === k ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >{l}</button>
            ))}
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="card p-8 text-center">
            <Icon name="truck" className="w-10 h-10 text-gray-200 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-500">Aún no hay viajes</p>
          </div>
        ) : (
          <>
            {/* MOBILE */}
            <div className="lg:hidden space-y-2">
              {visibles.map(v => {
                const visitadas = v.paradas.filter(p => p.estado === 'VISITADA' && p.cliente.id !== -1).length
                const total = v.paradas.filter(p => p.cliente.id !== -1).length
                const enCurso = v.estado === 'EN_CURSO'
                const productos = totalProductosViaje(v)
                return (
                  <Link key={v.id} to={`/app/viajes/${v.id}`} className="block card p-3 active:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-botella-900 text-sm truncate">{v.titulo ?? 'Viaje'}</span>
                          <span className={`chip text-[10px] ${enCurso ? 'bg-dorado-100 text-dorado-800' : 'bg-gray-100 text-gray-600'}`}>
                            {enCurso ? 'En curso' : 'Hecho'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{fmtCorto(v.fecha)}</p>
                      </div>
                      <div className="text-right shrink-0 flex gap-3">
                        <div>
                          <p className="font-black text-botella-900 text-sm">{visitadas}/{total}</p>
                          <p className="text-[10px] uppercase text-gray-400">paradas</p>
                        </div>
                        {productos > 0 && (
                          <div>
                            <p className="font-black text-dorado-700 text-sm">{productos}</p>
                            <p className="text-[10px] uppercase text-gray-400">u.</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-botella-600" style={{ width: total > 0 ? `${(visitadas/total)*100}%` : '0%' }} />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* DESKTOP */}
            <div className="hidden lg:block card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-botella-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Título</th>
                    <th className="px-4 py-3 text-center font-semibold">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold">Paradas</th>
                    <th className="px-4 py-3 text-center font-semibold">Productos</th>
                    <th className="px-4 py-3 text-left font-semibold">Progreso</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((v, i) => {
                    const visitadas = v.paradas.filter(p => p.estado === 'VISITADA' && p.cliente.id !== -1).length
                    const total = v.paradas.filter(p => p.cliente.id !== -1).length
                    const enCurso = v.estado === 'EN_CURSO'
                    const productos = totalProductosViaje(v)
                    return (
                      <tr key={v.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 text-gray-700 capitalize whitespace-nowrap">{fmt(v.fecha)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{v.titulo ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`chip ${enCurso ? 'bg-dorado-100 text-dorado-800' : 'bg-gray-100 text-gray-600'}`}>
                            {enCurso ? 'En curso' : 'Finalizado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          <span className="font-bold text-botella-900">{visitadas}</span>/{total}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {productos > 0 ? (
                            <span className="chip bg-dorado-100 text-dorado-800">{productos} u.</span>
                          ) : (
                            <span className="text-gray-300 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 w-48">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-botella-600" style={{ width: total > 0 ? `${(visitadas/total)*100}%` : '0%' }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/app/viajes/${v.id}`} className="text-botella-700 font-semibold hover:underline">Ver →</Link>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      {/* STICKY BOTTOM: crear viaje
          ↳ En mobile va arriba del bottom nav del Layout (que mide ~64px + safe area).
          ↳ En desktop va al borde con left-64 (alto del sidebar). */}
      {hayAlgoEnViaje && (
        <div
          className="fixed left-0 right-0 lg:left-64 z-40 bg-gradient-to-r from-white via-dorado-50 to-white border-t-4 border-dorado-500 shadow-[0_-8px_30px_rgba(0,0,0,0.18)]"
          style={{ bottom: 'calc(64px + env(safe-area-inset-bottom))' }}
        >
          {/* En desktop, override del bottom para que vaya al fondo */}
          <style>{`@media (min-width: 1024px) { .viaje-sticky-cta { bottom: 0 !important; } }`}</style>
          <div className="viaje-sticky-cta max-w-7xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] text-gray-600 uppercase tracking-wide font-black">
                Viaje del {new Date(fecha + 'T00:00:00').toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
              </p>
              <p className="text-lg sm:text-2xl font-black text-botella-900 leading-none">
                {clientesEnViaje.length} cli · {totalUnidades} u.
              </p>
              {totalExtras > 0 && (
                <p className="text-[10px] text-gray-500 mt-0.5">+{totalExtras} extra{totalExtras !== 1 ? 's' : ''}</p>
              )}
            </div>
            <button
              onClick={crearViaje}
              disabled={loading}
              className="px-5 sm:px-10 py-4 sm:py-5 rounded-2xl bg-gradient-to-br from-dorado-400 to-dorado-600 hover:from-dorado-300 hover:to-dorado-500 text-botella-950 font-black text-base sm:text-lg shadow-xl shadow-dorado-500/40 disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition flex items-center gap-2 ring-2 ring-dorado-300/50 animate-pulse-soft"
              style={{ animation: loading ? 'none' : 'pulse-glow 2s ease-in-out infinite' }}
            >
              {loading ? 'Creando...' : (
                <>
                  <Icon name="check" className="w-6 h-6" strokeWidth={3} />
                  CREAR VIAJE
                </>
              )}
            </button>
            <style>{`
              @keyframes pulse-glow {
                0%, 100% { box-shadow: 0 8px 24px rgba(217, 167, 51, 0.4); }
                50% { box-shadow: 0 8px 32px rgba(217, 167, 51, 0.7); }
              }
            `}</style>
          </div>
        </div>
      )}
    </div>
  )
}
