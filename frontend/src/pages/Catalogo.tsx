import { useEffect, useMemo, useState } from 'react'
import { CATALOGO_DESTACADO, IMG } from '../data/catalogoDestacado'
import { vinosAPI } from '../services/storage'
import { whatsappLink } from '../data/config'
import type { Vino } from '../types'

interface ItemCatalogo {
  id: string
  nombre: string
  bodega: string
  varietal: string
  precioVenta: number
  fotoUrl: string
  descripcion: string
  stock: number | null
}

interface CarritoItem extends ItemCatalogo {
  cantidad: number
}

const STORAGE_CARRITO = 'vg.carrito-publico'

export default function Catalogo() {
  const [busq, setBusq] = useState('')
  const [varietal, setVarietal] = useState<string>('TODOS')
  const [carrito, setCarrito] = useState<CarritoItem[]>([])
  const [showCarrito, setShowCarrito] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [nombreCliente, setNombreCliente] = useState('')
  const [telefonoCliente, setTelefonoCliente] = useState('')
  const [direccionCliente, setDireccionCliente] = useState('')
  const [notasCliente, setNotasCliente] = useState('')

  // Cargar carrito del localStorage al montar
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CARRITO)
      if (saved) setCarrito(JSON.parse(saved))
    } catch {}
  }, [])

  // Guardar carrito en localStorage cuando cambia
  useEffect(() => {
    try { localStorage.setItem(STORAGE_CARRITO, JSON.stringify(carrito)) } catch {}
  }, [carrito])

  const items: ItemCatalogo[] = useMemo(() => {
    const cargados = vinosAPI.listActivos().filter(v => v.mostrarEnCatalogo !== false)
    if (cargados.length === 0) {
      return CATALOGO_DESTACADO.map((v, i) => ({
        id: `dest-${i}`,
        nombre: v.nombre,
        bodega: v.bodega,
        varietal: v.varietal,
        precioVenta: v.precioVenta,
        fotoUrl: v.fotoUrl,
        descripcion: v.descripcion,
        stock: null,
      }))
    }
    return cargados.map((v: Vino, i) => {
      const fallback = CATALOGO_DESTACADO[i % CATALOGO_DESTACADO.length]
      return {
        id: String(v.id),
        nombre: v.nombre,
        bodega: v.bodega || '—',
        varietal: v.varietal || '—',
        precioVenta: v.precioVenta,
        fotoUrl: v.fotoUrl || fallback.fotoUrl,
        descripcion: v.descripcion || fallback.descripcion,
        stock: v.stock,
      }
    })
  }, [])

  const varietales = useMemo(() => {
    const s = new Set(items.map(i => i.varietal).filter(Boolean))
    return ['TODOS', ...Array.from(s).sort()]
  }, [items])

  const filtrados = items.filter(v => {
    if (varietal !== 'TODOS' && v.varietal !== varietal) return false
    if (busq) {
      const q = busq.toLowerCase()
      if (!v.nombre.toLowerCase().includes(q) &&
          !v.bodega.toLowerCase().includes(q) &&
          !v.varietal.toLowerCase().includes(q)) return false
    }
    return true
  })

  // Carrito helpers
  const cantidadEnCarrito = (id: string) => carrito.find(c => c.id === id)?.cantidad ?? 0
  const totalItems = carrito.reduce((acc, c) => acc + c.cantidad, 0)
  const totalPesos = carrito.reduce((acc, c) => acc + c.precioVenta * c.cantidad, 0)

  const agregar = (item: ItemCatalogo) => {
    setCarrito(prev => {
      const ex = prev.find(c => c.id === item.id)
      if (ex) return prev.map(c => c.id === item.id ? { ...c, cantidad: c.cantidad + 1 } : c)
      return [...prev, { ...item, cantidad: 1 }]
    })
  }
  const cambiarCant = (id: string, delta: number) => {
    setCarrito(prev => {
      const ex = prev.find(c => c.id === id)
      if (!ex) return prev
      const nuevaCant = ex.cantidad + delta
      if (nuevaCant <= 0) return prev.filter(c => c.id !== id)
      return prev.map(c => c.id === id ? { ...c, cantidad: nuevaCant } : c)
    })
  }
  const vaciar = () => setCarrito([])

  // Armar mensaje WhatsApp
  const armarMensaje = (): string => {
    const lineas: string[] = []
    lineas.push('🍷 *Pedido a Vinos Galán La Plata*')
    lineas.push('')
    lineas.push('*Vinos:*')
    carrito.forEach(c => {
      lineas.push(`• ${c.nombre} (${c.varietal}) — ${c.cantidad} u. × $${c.precioVenta.toLocaleString('es-AR')} = $${(c.precioVenta * c.cantidad).toLocaleString('es-AR')}`)
    })
    lineas.push('')
    lineas.push(`*Total: $${totalPesos.toLocaleString('es-AR')}*`)
    lineas.push('')
    lineas.push('*Datos del cliente:*')
    if (nombreCliente)    lineas.push(`👤 ${nombreCliente}`)
    if (telefonoCliente)  lineas.push(`📞 ${telefonoCliente}`)
    if (direccionCliente) lineas.push(`📍 ${direccionCliente}`)
    if (notasCliente)     lineas.push(`📝 ${notasCliente}`)
    lineas.push('')
    lineas.push('Aguardo confirmación. ¡Gracias!')
    return lineas.join('\n')
  }

  const enviarPedido = () => {
    if (!nombreCliente.trim() || !direccionCliente.trim()) {
      alert('Por favor completá tu nombre y dirección')
      return
    }
    const url = whatsappLink(armarMensaje())
    window.open(url, '_blank')
    // No vaciamos el carrito automáticamente para que el cliente pueda volver a verlo
  }

  return (
    <div className="text-white">
      {/* HEADER + FILTROS — compactos y sticky, sin hero grande */}
      <section className="pt-20 sm:pt-24 bg-botella-950">
        {/* Banda fina con título */}
        <div className="border-b border-botella-800/60 bg-gradient-to-r from-botella-950 via-botella-900 to-botella-950">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 flex items-end justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[10px] tracking-[0.3em] uppercase text-dorado-400 font-bold mb-1">Catálogo</p>
              <h1 className="text-2xl sm:text-3xl font-black leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                Nuestros vinos
              </h1>
              <p className="text-xs text-botella-300 mt-1">Armá tu pedido y enviánoslo por WhatsApp</p>
            </div>
            <p className="text-xs text-botella-400 uppercase tracking-widest font-semibold">
              <span className="text-dorado-300 font-black text-base">{filtrados.length}</span> {filtrados.length === 1 ? 'etiqueta' : 'etiquetas'}
            </p>
          </div>
        </div>

        {/* Filtros sticky */}
        <div className="bg-botella-950/95 backdrop-blur-md border-b border-botella-800 sticky top-16 sm:top-20 z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center">
            <div className="flex-1">
              <input
                type="text"
                placeholder="🔍 Buscar vino, varietal o bodega..."
                value={busq}
                onChange={e => setBusq(e.target.value)}
                className="w-full bg-botella-800/50 border border-botella-700 rounded-lg px-4 py-2 text-sm text-white placeholder-botella-400 focus:outline-none focus:border-dorado-400 transition"
              />
            </div>
            <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
              {varietales.map(v => (
                <button
                  key={v}
                  onClick={() => setVarietal(v)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                    varietal === v
                      ? 'bg-dorado-500 text-botella-950'
                      : 'bg-botella-800/60 border border-botella-700 text-botella-200 hover:border-dorado-400'
                  }`}
                >
                  {v === 'TODOS' ? 'Todos' : v}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Grid — más denso y compacto */}
      <section className="py-5 sm:py-6 bg-botella-950 pb-32 lg:pb-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtrados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-3">🍷</p>
              <p className="text-botella-300">No encontramos vinos con esos filtros.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
              {filtrados.map(v => {
                const enCarrito = cantidadEnCarrito(v.id)
                return (
                  <article
                    key={v.id}
                    className="group bg-botella-900/40 backdrop-blur-sm rounded-xl overflow-hidden border border-botella-700/40 hover:border-dorado-500/50 transition-all duration-200 hover:shadow-xl hover:shadow-dorado-500/10 flex flex-col"
                  >
                    <div className="aspect-[4/5] overflow-hidden bg-botella-950 relative">
                      <img
                        src={v.fotoUrl}
                        alt={v.nombre}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-botella-950/80 via-transparent to-transparent" />
                      {enCarrito > 0 && (
                        <span className="absolute top-2 right-2 bg-dorado-500 text-botella-950 text-[10px] font-black px-2 py-0.5 rounded-full shadow">
                          ×{enCarrito}
                        </span>
                      )}
                      <div className="absolute bottom-0 inset-x-0 p-2.5">
                        <p className="text-[9px] text-dorado-400 tracking-widest uppercase font-bold">{v.varietal}</p>
                        <h3 className="font-black text-sm sm:text-base leading-tight line-clamp-2 text-white" style={{ fontFamily: 'Georgia, serif' }}>{v.nombre}</h3>
                      </div>
                    </div>
                    <div className="p-2.5 flex flex-col gap-2">
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg sm:text-xl font-black text-dorado-300 leading-none">${v.precioVenta.toLocaleString('es-AR')}</span>
                        <span className="text-[10px] text-botella-400 truncate ml-1">{v.bodega}</span>
                      </div>
                      {enCarrito === 0 ? (
                        <button
                          onClick={() => agregar(v)}
                          className="w-full px-2 py-2 rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-bold text-xs sm:text-sm transition active:scale-[0.97]"
                        >
                          + Agregar
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => cambiarCant(v.id, -1)}
                            className="w-8 h-8 rounded-lg bg-botella-800 hover:bg-botella-700 border border-botella-600 text-white font-black text-base transition active:scale-[0.92]"
                          >−</button>
                          <span className="flex-1 text-center text-base font-black text-dorado-300">{enCarrito}</span>
                          <button
                            onClick={() => cambiarCant(v.id, 1)}
                            className="w-8 h-8 rounded-lg bg-dorado-500 hover:bg-dorado-400 text-botella-950 font-black text-base transition active:scale-[0.92]"
                          >+</button>
                        </div>
                      )}
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </div>
      </section>

      {/* Botón flotante del carrito */}
      {carrito.length > 0 && !showCarrito && !showCheckout && (
        <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-40">
          <button
            onClick={() => setShowCarrito(true)}
            className="flex items-center gap-3 bg-dorado-500 hover:bg-dorado-400 text-botella-950 px-5 py-4 rounded-2xl shadow-2xl hover:shadow-dorado-500/40 font-bold transition active:scale-[0.97]"
          >
            <div className="relative">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              <span className="absolute -top-2 -right-2 bg-botella-950 text-dorado-300 text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center">
                {totalItems}
              </span>
            </div>
            <div className="text-left leading-tight">
              <div className="text-xs uppercase tracking-wider opacity-80">Tu pedido</div>
              <div className="font-black">${totalPesos.toLocaleString('es-AR')}</div>
            </div>
          </button>
        </div>
      )}

      {/* Modal del carrito */}
      {showCarrito && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCarrito(false)}
        >
          <div
            className="w-full sm:max-w-md bg-botella-900 border border-botella-700 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[85vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-botella-800">
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>Tu pedido</h3>
              <button onClick={() => setShowCarrito(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-botella-300 hover:bg-botella-800 transition text-lg">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-3">
              {carrito.length === 0 ? (
                <p className="text-center text-botella-400 py-10">Tu pedido está vacío</p>
              ) : carrito.map(c => (
                <div key={c.id} className="flex items-center gap-3 bg-botella-950/60 rounded-xl p-3">
                  <img src={c.fotoUrl} alt={c.nombre} className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-dorado-400 uppercase tracking-widest font-bold">{c.varietal}</p>
                    <p className="font-bold text-white text-sm truncate">{c.nombre}</p>
                    <p className="text-xs text-dorado-300 font-bold">${(c.precioVenta * c.cantidad).toLocaleString('es-AR')}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button onClick={() => cambiarCant(c.id, -1)} className="w-8 h-8 rounded-lg bg-botella-800 hover:bg-botella-700 text-white font-black">−</button>
                    <span className="w-7 text-center font-black text-dorado-300">{c.cantidad}</span>
                    <button onClick={() => cambiarCant(c.id, 1)} className="w-8 h-8 rounded-lg bg-dorado-500 text-botella-950 font-black">+</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-5 border-t border-botella-800 bg-botella-950/50">
              <div className="flex items-baseline justify-between mb-4">
                <span className="text-xs text-botella-300 uppercase tracking-widest">Total</span>
                <span className="text-3xl font-black text-dorado-300">${totalPesos.toLocaleString('es-AR')}</span>
              </div>
              <button
                onClick={() => { setShowCarrito(false); setShowCheckout(true) }}
                disabled={carrito.length === 0}
                className="w-full px-4 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
              >
                💬 Continuar pedido
              </button>
              <button onClick={vaciar} className="w-full mt-2 text-xs text-botella-400 hover:text-red-400 transition py-2">
                Vaciar pedido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de checkout (datos del cliente) */}
      {showCheckout && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowCheckout(false)}
        >
          <div
            className="w-full sm:max-w-md bg-botella-900 border border-botella-700 rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-5 border-b border-botella-800">
              <h3 className="text-xl font-black text-white" style={{ fontFamily: 'Georgia, serif' }}>Tus datos</h3>
              <button onClick={() => setShowCheckout(false)} className="w-9 h-9 rounded-full flex items-center justify-center text-botella-300 hover:bg-botella-800 transition text-lg">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <p className="text-sm text-botella-300">
                Completá tus datos y te llevamos a WhatsApp con el pedido listo para enviar.
              </p>

              <div>
                <label className="block text-xs font-bold text-dorado-300 uppercase tracking-widest mb-1.5">Nombre *</label>
                <input
                  type="text"
                  value={nombreCliente}
                  onChange={e => setNombreCliente(e.target.value)}
                  placeholder="Tu nombre"
                  className="w-full bg-botella-950/60 border border-botella-700 rounded-lg px-4 py-3 text-white placeholder-botella-500 focus:outline-none focus:border-dorado-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dorado-300 uppercase tracking-widest mb-1.5">Teléfono</label>
                <input
                  type="tel"
                  inputMode="tel"
                  value={telefonoCliente}
                  onChange={e => setTelefonoCliente(e.target.value)}
                  placeholder="(opcional)"
                  className="w-full bg-botella-950/60 border border-botella-700 rounded-lg px-4 py-3 text-white placeholder-botella-500 focus:outline-none focus:border-dorado-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dorado-300 uppercase tracking-widest mb-1.5">Dirección de entrega *</label>
                <input
                  type="text"
                  value={direccionCliente}
                  onChange={e => setDireccionCliente(e.target.value)}
                  placeholder="Calle, número, piso/dpto"
                  className="w-full bg-botella-950/60 border border-botella-700 rounded-lg px-4 py-3 text-white placeholder-botella-500 focus:outline-none focus:border-dorado-400"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-dorado-300 uppercase tracking-widest mb-1.5">Notas</label>
                <textarea
                  value={notasCliente}
                  onChange={e => setNotasCliente(e.target.value)}
                  rows={2}
                  placeholder="Horarios preferidos, referencias..."
                  className="w-full bg-botella-950/60 border border-botella-700 rounded-lg px-4 py-3 text-white placeholder-botella-500 focus:outline-none focus:border-dorado-400 resize-none"
                />
              </div>

              {/* Resumen */}
              <div className="bg-botella-950/60 border border-botella-700 rounded-xl p-4">
                <p className="text-xs text-botella-400 uppercase tracking-widest font-bold mb-2">Resumen</p>
                <div className="space-y-1 text-sm">
                  {carrito.map(c => (
                    <div key={c.id} className="flex justify-between gap-2">
                      <span className="text-botella-200 truncate">{c.nombre} × {c.cantidad}</span>
                      <span className="text-dorado-300 font-bold shrink-0">${(c.precioVenta * c.cantidad).toLocaleString('es-AR')}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-botella-700/50 mt-3 pt-3 flex justify-between items-baseline">
                  <span className="text-sm text-botella-300 uppercase tracking-widest">Total</span>
                  <span className="text-2xl font-black text-dorado-300">${totalPesos.toLocaleString('es-AR')}</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-botella-800 bg-botella-950/50 space-y-2">
              <button
                onClick={enviarPedido}
                className="w-full px-4 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black transition active:scale-[0.98] flex items-center justify-center gap-2 shadow-2xl"
              >
                <svg viewBox="0 0 24 24" className="w-6 h-6" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413"/>
                </svg>
                Enviar pedido por WhatsApp
              </button>
              <p className="text-xs text-botella-400 text-center">
                Te abrimos WhatsApp con el mensaje listo. Solo tenés que tocar enviar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
