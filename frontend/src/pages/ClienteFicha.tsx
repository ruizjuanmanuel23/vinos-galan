import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'
import { ClienteForm } from './Clientes'
import { DIA_LABEL, type Cliente, type DiaSemana, type Venta, type DeudaAnotacion } from '../types'

export default function ClienteFicha() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [cliente, setCliente] = useState<Cliente | null>(null)
  const [ventas, setVentas] = useState<Venta[]>([])
  const [deudas, setDeudas] = useState<DeudaAnotacion[]>([])
  const [tab, setTab] = useState<'ventas' | 'deudas'>('ventas')
  const [showEditar, setShowEditar] = useState(false)
  const [showDeuda, setShowDeuda] = useState(false)
  const [formCliente, setFormCliente] = useState({ nombre: '', telefono: '', direccion: '', zona: '', diaReparto: '' as '' | DiaSemana, notas: '' })
  const [formDeuda, setFormDeuda] = useState({ descripcion: '', monto: '', fecha: '' })
  const [editDeuda, setEditDeuda] = useState<DeudaAnotacion | null>(null)

  const cargar = () => {
    api.get<Cliente>(`/clientes/${id}`).then(r => {
      setCliente(r.data)
      setFormCliente({
        nombre: r.data.nombre, telefono: r.data.telefono ?? '',
        direccion: r.data.direccion ?? '', zona: r.data.zona ?? '',
        diaReparto: r.data.diaReparto ?? '', notas: r.data.notas ?? ''
      })
    })
    api.get<Venta[]>(`/ventas/cliente/${id}`).then(r => setVentas(r.data)).catch(() => {})
    api.get<DeudaAnotacion[]>(`/deudas/cliente/${id}`).then(r => setDeudas(r.data)).catch(() => {})
  }

  useEffect(() => { cargar() }, [id])

  const guardarCliente = async () => {
    await api.put(`/clientes/${id}`, { ...formCliente, diaReparto: formCliente.diaReparto || null, zona: formCliente.zona || null })
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
    if (confirm('¿Eliminar cliente?')) { await api.delete(`/clientes/${id}`); navigate('/clientes') }
  }

  if (!cliente) return <p className="text-center text-gray-400 py-12">Cargando...</p>

  const totalDeuda = deudas.reduce((acc, d) => acc + Number(d.monto), 0)
  const totalComprado = ventas.reduce((acc, v) => acc + Number(v.total), 0)
  const dirGoogle = cliente.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion)}` : null

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link to="/clientes" className="text-botella-700 text-sm font-medium hover:underline">← Clientes</Link>

      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h1 className="page-title truncate">{cliente.nombre}</h1>
          <div className="flex gap-2 mt-2 flex-wrap">
            {cliente.diaReparto && <span className="chip bg-botella-100 text-botella-800">📅 {DIA_LABEL[cliente.diaReparto]}</span>}
            {cliente.zona && <span className="chip bg-dorado-100 text-dorado-800">📍 {cliente.zona}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link to={`/ventas/nueva?cliente=${cliente.id}`} className="btn-primary text-xs sm:text-sm">+ Venta</Link>
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
                <a href={`tel:${cliente.telefono}`} className="block">
                  <p className="text-[10px] text-gray-500 uppercase">Teléfono</p>
                  <p className="font-semibold text-botella-700">📞 {cliente.telefono}</p>
                </a>
              )}
              {cliente.direccion && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase">Dirección</p>
                  <p className="font-semibold text-gray-900">
                    {dirGoogle ? (
                      <a href={dirGoogle} target="_blank" rel="noreferrer" className="text-botella-700 hover:underline">📍 {cliente.direccion}</a>
                    ) : <>📍 {cliente.direccion}</>}
                  </p>
                </div>
              )}
              {cliente.notas && (
                <div>
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
        <ClienteForm form={formCliente} setForm={setFormCliente} onSubmit={guardarCliente} onCancel={() => setShowEditar(false)} />
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
