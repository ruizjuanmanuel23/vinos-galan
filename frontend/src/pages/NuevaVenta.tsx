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

  const agregarVino = (v: Vino) => {
    const existe = items.find(i => i.vino.id === v.id)
    if (existe) {
      if (existe.cantidad >= v.stock) return
      setItems(items.map(i => i.vino.id === v.id ? { ...i, cantidad: i.cantidad + 1 } : i))
    } else {
      setItems([...items, { vino: v, cantidad: 1 }])
    }
  }
  const cambiarCant = (id: number, cant: number) => {
    if (cant <= 0) { setItems(items.filter(i => i.vino.id !== id)); return }
    setItems(items.map(i => i.vino.id === id ? { ...i, cantidad: cant } : i))
  }
  const quitar = (id: number) => setItems(items.filter(i => i.vino.id !== id))

  const total = items.reduce((acc, i) => acc + Number(i.vino.precioVenta) * i.cantidad, 0)
  const seleccionado = clientes.find(c => c.id === Number(clienteId)) || null

  const vinosFiltrados = busqVino
    ? vinos.filter(v => v.nombre.toLowerCase().includes(busqVino.toLowerCase()) || (v.bodega ?? '').toLowerCase().includes(busqVino.toLowerCase()))
    : vinos

  const confirmar = async () => {
    if (!clienteId) { setError('Seleccioná un cliente'); return }
    if (items.length === 0) { setError('Agregá al menos un vino'); return }
    setError('')
    try {
      await api.post('/ventas', {
        clienteId: Number(clienteId), notas,
        detalles: items.map(i => ({ vinoId: i.vino.id, cantidad: i.cantidad })),
      })
      navigate(`/clientes/${clienteId}`)
    } catch (e: any) {
      setError(typeof e.response?.data === 'string' ? e.response.data : 'Error al registrar la venta')
    }
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-32 lg:pb-0">
      <Link to="/" className="text-botella-700 text-sm font-medium hover:underline">← Inicio</Link>
      <div>
        <h1 className="page-title">Nueva venta</h1>
        <p className="page-subtitle">Cliente + vinos. El stock se descuenta solo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Cliente + Catálogo */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cliente */}
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

          {/* Catálogo */}
          <div className="card p-4 sm:p-5">
            <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">2. Vinos disponibles</h2>
            <input className="input mb-3" placeholder="🔍 Buscar vino..." value={busqVino} onChange={e => setBusqVino(e.target.value)} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
              {vinosFiltrados.length === 0 && <p className="sm:col-span-2 text-center text-sm text-gray-400 py-6">Sin vinos con stock.</p>}
              {vinosFiltrados.map(v => (
                <button key={v.id} onClick={() => agregarVino(v)} className="text-left p-3 border border-gray-200 rounded-lg hover:border-botella-500 hover:bg-botella-50 active:bg-botella-50 transition">
                  <p className="font-semibold text-sm text-gray-900">{v.nombre}</p>
                  <p className="text-xs text-gray-500 truncate">{[v.bodega, v.varietal].filter(Boolean).join(' · ')}</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="font-bold text-botella-700 text-sm">${Number(v.precioVenta).toLocaleString('es-AR')}</span>
                    <span className="text-[10px] text-gray-400">stock {v.stock}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <h2 className="font-bold text-gray-900 mb-2 text-sm sm:text-base">3. Notas (opcional)</h2>
            <textarea className="input resize-none" rows={2} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
          </div>
        </div>

        {/* Carrito */}
        <div className="space-y-4">
          <div className="card lg:sticky lg:top-6">
            <div className="p-4 sm:p-5 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">Resumen</h2>
            </div>
            <div className="p-4 sm:p-5 max-h-[400px] lg:max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <p className="text-center text-sm text-gray-400 py-6">Elegí vinos del catálogo</p>
              ) : (
                <div className="space-y-2">
                  {items.map(i => (
                    <div key={i.vino.id} className="border border-gray-100 rounded-lg p-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-900 flex-1 truncate">{i.vino.nombre}</p>
                        <button onClick={() => quitar(i.vino.id)} className="text-red-400 hover:text-red-600 text-sm shrink-0">✕</button>
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-1">
                          <button onClick={() => cambiarCant(i.vino.id, i.cantidad - 1)} className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-base font-bold">−</button>
                          <span className="w-8 text-center font-bold text-sm">{i.cantidad}</span>
                          <button onClick={() => cambiarCant(i.vino.id, Math.min(i.cantidad + 1, i.vino.stock))} className="w-8 h-8 rounded border border-gray-300 hover:bg-gray-50 active:bg-gray-100 text-base font-bold">+</button>
                        </div>
                        <span className="text-sm font-bold text-botella-800">
                          ${(Number(i.vino.precioVenta) * i.cantidad).toLocaleString('es-AR')}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 border-t border-gray-100 bg-botella-50">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-gray-600">Total</span>
                <span className="text-xl sm:text-2xl font-black text-botella-900">${total.toLocaleString('es-AR')}</span>
              </div>
              {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
              <button onClick={confirmar} disabled={items.length === 0 || !clienteId} className="w-full btn-dorado">
                Confirmar venta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
