import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'
import Icon from '../components/Icon'
import { ClienteForm } from './Clientes'
import {
  DIA_LABEL, aplicarVariables, whatsappCliente,
  type Cliente, type DiaSemana, type Venta, type DeudaAnotacion, type PlantillaWhatsApp, type Zona,
} from '../types'

export default function ClienteFicha() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [plantillas, setPlantillas] = useState<PlantillaWhatsApp[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [menuPlantillas, setMenuPlantillas] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [deudas, setDeudas] = useState<DeudaAnotacion[]>([])
  const [tab, setTab] = useState<'ventas' | 'deudas'>('ventas')
  const [showEditar, setShowEditar] = useState(false)
  const [showDeuda, setShowDeuda] = useState(false)
  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '', direccion: '', zona: '', zonaId: null as number | null, diasReparto: [] as DiaSemana[], notas: '' })
  const [formDeuda, setFormDeuda] = useState({ descripcion: '', monto: '', fecha: '' })
  const [editDeuda, setEditDeuda] = useState<DeudaAnotacion | null>(null)

  const cargar = () => {
    api.get<Cliente>(`/clientes/${id}`).then(r => {
      setCliente(r.data)
      setFormCliente({
        nombre: r.data.nombre, telefono: r.data.telefono ?? '',
        direccion: r.data.direccion ?? '', zona: r.data.zona ?? '',
        zonaId: r.data.zonaId ?? null,
        diasReparto: r.data.diasReparto ?? [], notas: r.data.notas ?? ''
      })
    })
    api.get<Venta[]>(`/ventas/cliente/${id}`).then(r => setVentas(r.data)).catch(() => {})
    api.get<DeudaAnotacion[]>(`/deudas/cliente/${id}`).then(r => setDeudas(r.data)).catch(() => {})
    api.get<Zona[]>('/zonas').then(r => setZonas(r.data)).catch(() => {})
  }

  useEffect(() => { cargar() }, [id])
  useEffect(() => {
    api.get<PlantillaWhatsApp[]>('/plantillas').then(r => setPlantillas(r.data)).catch(() => {})
  }, [])

  // Cerrar dropdown al click afuera
  useEffect(() => {
    if (!menuPlantillas) return
    const h = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuPlantillas(false)
    }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuPlantillas])

  const abrirWhatsApp = (plantilla?: PlantillaWhatsApp) => {
    if (!cliente?.telefono) return
    const msg = plantilla ? aplicarVariables(plantilla.texto, cliente) : undefined
    window.open(whatsappCliente(cliente.telefono, msg), '_blank')
    setMenuPlantillas(false)
  }

  const guardarCliente = async () => {
    await api.put(`/clientes/${id}`, {
      ...formCliente,
      diasReparto: formCliente.diasReparto ?? [],
      zona: formCliente.zona || null,
      zonaId: formCliente.zonaId,
    })
    setShowEditar(false); cargar()
  }
  const guardarDeuda = async () => {
    const payload = {
      descripcion: formDeuda.descripcion, monto: Number(formDeuda.monto),
      clienteId: Number(id), fecha: formDeuda.fecha || new Date().toISOString().split('T')[0],
    }
    if (editDeuda) await api.put(`/deudas/${editDeuda.id}`, payload)
    else await api.post('/deudas', payload)
    setShowDeuda(false); setEditDeuda(null); setFormDeuda({ descripcion: '', monto: '', fecha: '' })
    cargar()
  }
  const eliminarDeuda = async (deuId: number) => {
    if (confirm('¿Eliminar?')) { await api.delete(`/deudas/${deuId}`); cargar() }
  }
  const eliminarCliente = async () => {
    if (confirm('¿Eliminar cliente?')) { await api.delete(`/clientes/${id}`); navigate('/app/clientes') }
  }

  if (!cliente) return <p className="text-center text-gray-400 py-12">Cargando...</p>

  const totalDeuda = deudas.reduce((acc, d) => acc + Number(d.monto), 0)
  const totalComprado = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  const dirGoogle = cliente.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}` : null

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link to="/app/clientes" className="text-botella-700 text-sm font-medium hover:underline">← Clientes</Link>

      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h1 className="page-title truncate">{cliente.nombre}</h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            {(cliente.diasReparto ?? []).map(d => (
              <span key={d} className="chip bg-botella-100 text-botella-800 inline-flex items-center gap-1">
                <Icon name="calendar" className="w-3 h-3" />{DIA_LABEL[d]}
              </span>
            ))}
            {(() => {
              const zonaCliente = cliente.zonaId ? zonas.find(z => z.id === cliente.zonaId) : null
              const nombre = zonaCliente?.nombre || cliente.zona
              if (!nombre) return null
              return (
                <span className="chip bg-dorado-100 text-dorado-800 inline-flex items-center gap-1">
                  <Icon name="map-pin" className="w-3 h-3" />{nombre}
                  {zonaCliente && zonaCliente.ajustePorcentaje !== 0 && (
                    <span className="text-[10px] font-bold ml-1">
                      ({zonaCliente.ajustePorcentaje > 0 ? '+' : ''}{zonaCliente.ajustePorcentaje}%)
                    </span>
                  )}
                </span>
              )
            })()}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/app/ventas/nueva?cliente=${cliente.id}`} className="btn-primary text-xs sm:text-sm">+ Venta</Link>
          <button onClick={() => setShowEditar(true)} className="btn-secondary text-xs sm:text-sm">Editar</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Datos + resumen */}
        <div className="space-y-4">
          <div className="card p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Datos de contacto</h2>
            <div className="space-y-2.5 text-sm">
              {cliente.telefono && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase mb-1.5">Teléfono</p>
                  <p className="font-semibold text-gray-900 mb-2">{cliente.telefono}</p>
                  {/* Botones de contacto */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp con dropdown de plantillas */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => {
                          if (plantillas.length === 0) abrirWhatsApp()
                          else if (plantillas.length === 1) abrirWhatsApp(plantillas[0])
                          else setMenuPlantillas(o => !o)
                        }}
                        className="w-full flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold rounded-lg px-3 py-2.5 text-sm transition shadow"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.7 2.5 4 3.5.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.1-.6-.2zm-5.4 7.2h0c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1 0 5.5-4.5 9.8-10.2 9.8zM20.5 3.5C18.2 1.3 15.2 0 12.1 0 5.5 0 .1 5.4.1 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4h0c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.4-8.3z" />
                        </svg>
                        WhatsApp
                      </button>

                      {/* Dropdown plantillas */}
                      {menuPlantillas && plantillas.length > 1 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-2xl z-20 overflow-hidden">
                          <div className="px-3 py-2 text-[10px] uppercase tracking-wide font-bold text-gray-500 bg-gray-50 border-b border-gray-100">
                            Elegí mensaje
                          </div>
                          <button
                            onClick={() => abrirWhatsApp()}
                            className="w-full text-left px-3 py-2 hover:bg-gray-50 transition border-b border-gray-100 text-xs"
                          >
                            <span className="text-gray-500">Sin mensaje (chat vacío)</span>
                          </button>
                          {plantillas.map(p => (
                            <button
                              key={p.id}
                              onClick={() => abrirWhatsApp(p)}
                              className="w-full text-left px-3 py-2 hover:bg-emerald-50 transition border-b border-gray-100 last:border-0"
                            >
                              <div className="flex items-center gap-1.5">
                                {p.esDefault && <span className="text-dorado-500 text-xs">⭐</span>}
                                <span className="font-bold text-sm text-gray-900">{p.nombre}</span>
                              </div>
                              <p className="text-[11px] text-gray-500 truncate mt-0.5">{p.texto}</p>
                            </button>
                          ))}
                          <Link
                            to="/app/configuracion"
                            className="block px-3 py-2 text-center text-[11px] text-botella-700 hover:bg-botella-50 font-semibold border-t border-gray-100"
                          >
                            ⚙ Editar plantillas
                          </Link>
                        </div>
                      )}
                    </div>

                    {/* Llamar */}
                    <a
                      href={`tel:${cliente.telefono}`}
                      className="flex items-center justify-center gap-1.5 bg-botella-700 hover:bg-botella-800 active:bg-botella-800 text-white font-bold rounded-lg px-3 py-2.5 text-sm transition shadow"
                    >
                      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                      </svg>
                      Llamar
                    </a>
                  </div>
                  {plantillas.length === 0 && (
                    <Link to="/app/configuracion" className="block mt-2 text-[11px] text-botella-700 hover:underline text-center">
                      ⚙ Configurá plantillas de mensaje
                    </Link>
                  )}
                </div>
              )}
              {cliente.direccion && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase">Dirección</p>
                  <p className="font-semibold text-gray-900">
                    {dirGoogle ? (
                      <a href={dirGoogle} target="_blank" rel="noreferrer" className="text-botella-700 hover:underline inline-flex items-center gap-1"><Icon name="map-pin" className="w-3 h-3" />{cliente.direccion}</a>
                    ) : <span className="inline-flex items-center gap-1"><Icon name="map-pin" className="w-3 h-3" />{cliente.direccion}</span>}
                  </p>
                </div>
              )}
              {cliente.notas && (
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-[10px] text-gray-500 uppercase">Notas</p>
                  <p className="text-gray-700 italic text-sm">{cliente.notas}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h2 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3">Resumen</h2>
            <div className="grid grid-cols-2 lg:grid-cols-1 gap-3">
              <div>
                <p className="text-xs text-gray-500">Total comprado</p>
                <p className="text-xl sm:text-2xl font-black text-botella-900">${totalComprado.toLocaleString('es-AR')}</p>
                <p className="text-[10px] text-gray-400">{ventas.length} venta{ventas.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="lg:pt-3 lg:border-t lg:border-gray-100">
                <p className="text-xs text-gray-500">Deuda pendiente</p>
                <p className={`text-xl sm:text-2xl font-black ${totalDeuda > 0 ? 'text-red-700' : 'text-emerald-600'}`}>
                  ${totalDeuda.toLocaleString('es-AR')}
                </p>
                <p className="text-[10px] text-gray-400">{deudas.length} anotación{deudas.length !== 1 ? 'es' : ''}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="lg:col-span-2 card">
          <div className="border-b border-gray-100 px-3 sm:px-5 pt-3 sm:pt-4 flex gap-1 overflow-x-auto">
            <button onClick={() => setTab('ventas')} className={`px-3 sm:px-4 py-2 rounded-t-lg font-semibold text-sm transition whitespace-nowrap ${tab === 'ventas' ? 'bg-botella-50 text-botella-800 border-b-2 border-botella-700 -mb-px' : 'text-gray-600'}`}>
              Compras ({ventas.length})
            </button>
            <button onClick={() => setTab('deudas')} className={`px-3 sm:px-4 py-2 rounded-t-lg font-semibold text-sm transition whitespace-nowrap ${tab === 'deudas' ? 'bg-red-50 text-red-700 border-b-2 border-red-600 -mb-px' : 'text-gray-600'}`}>
              Deudas{totalDeuda > 0 && ` ($${totalDeuda.toLocaleString('es-AR')})`}
            </button>
          </div>

          <div className="p-4 sm:p-5">
            {tab === 'ventas' && (
              <div className="space-y-3">
                {ventas.length === 0 && <p className="text-center text-sm text-gray-400 py-8">No hay compras.</p>}
                {ventas.map(v => (
                  <div key={v.id} className="border border-gray-100 rounded-lg p-3 sm:p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs text-gray-500">{new Date(v.fecha).toLocaleString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="font-black text-botella-800">${Number(v.total).toLocaleString('es-AR')}</span>
                    </div>
                    <div className="space-y-0.5">
                      {v.detalles?.map(d => (
                        <div key={d.id} className="text-sm text-gray-700 flex justify-between gap-2">
                          <span className="truncate">{d.vino.nombre} ×{d.cantidad}</span>
                          <span className="text-gray-500 shrink-0">${(Number(d.precioUnitario) * d.cantidad).toLocaleString('es-AR')}</span>
                        </div>
                      ))}
                    </div>
                    {v.notas && <p className="text-xs text-gray-400 mt-2 italic">{v.notas}</p>}
                  </div>
                ))}
              </div>
            )}

            {tab === 'deudas' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  {totalDeuda > 0 ? (
                    <span className="text-red-700 font-bold text-sm">Total: ${totalDeuda.toLocaleString('es-AR')}</span>
                  ) : (
                    <span className="text-emerald-600 font-medium text-sm">Sin deudas</span>
                  )}
                  <button onClick={() => { setEditDeuda(null); setFormDeuda({ descripcion: '', monto: '', fecha: '' }); setShowDeuda(true) }} className="btn-danger text-xs sm:text-sm">+ Anotar</button>
                </div>
                {deudas.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Sin deudas.</p>}
                {deudas.map(d => (
                  <div key={d.id} className="border border-gray-100 rounded-lg p-3 sm:p-4 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-800 text-sm">{d.descripcion}</p>
                      <p className="text-xs text-gray-400">{new Date(d.fecha + 'T00:00:00').toLocaleDateString('es-AR')}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-black text-red-700 text-sm">${Number(d.monto).toLocaleString('es-AR')}</span>
                      <button onClick={() => { setEditDeuda(d); setFormDeuda({ descripcion: d.descripcion, monto: String(d.monto), fecha: d.fecha }); setShowDeuda(true) }} className="text-gray-400 text-xs px-1.5">✎</button>
                      <button onClick={() => eliminarDeuda(d.id)} className="text-red-400 text-xs px-1.5">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <button onClick={eliminarCliente} className="w-full text-sm text-red-500 hover:text-red-700 py-2">Eliminar cliente</button>

      <Modal open={showEditar} onClose={() => setShowEditar(false)} title="Editar cliente" size="lg">
        <ClienteForm form={formCliente} setForm={setFormCliente} zonas={zonas} onSubmit={guardarCliente} onCancel={() => setShowEditar(false)} />
      </Modal>

      <Modal open={showDeuda} onClose={() => setShowDeuda(false)} title={editDeuda ? 'Editar deuda' : 'Anotar deuda'}>
        <div className="space-y-3">
          <div>
            <label className="label">Descripción</label>
            <textarea className="input resize-none" rows={2} placeholder="Ej: 6 botellas Malbec" value={formDeuda.descripcion} onChange={e => setFormDeuda(f => ({ ...f, descripcion: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Monto $</label>
              <input className="input" type="number" inputMode="decimal" value={formDeuda.monto} onChange={e => setFormDeuda(f => ({ ...f, monto: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fecha</label>
              <input className="input" type="date" value={formDeuda.fecha} onChange={e => setFormDeuda(f => ({ ...f, fecha: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowDeuda(false)} className="btn-ghost">Cancelar</button>
            <button onClick={guardarDeuda} className="btn-danger">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
