import { useMemo, useState } from 'react'
import { CATALOGO_DESTACADO, IMG } from '../data/catalogoDestacado'
import { vinosAPI } from '../services/storage'
import type { Vino } from '../types'

/** Unifica vinos cargados (con su foto opcional) + catálogo de respaldo. */
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

export default function Catalogo() {
  const [busq, setBusq] = useState('')
  const [varietal, setVarietal] = useState<string>('TODOS')

  const items: ItemCatalogo[] = useMemo(() => {
    const cargados = vinosAPI.listActivos()
      .filter(v => v.mostrarEnCatalogo !== false)
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
    // Si hay vinos cargados, los uso (con fotos del usuario o placeholder de destacados)
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

  return (
    <div className="text-white">
      {/* HERO chico */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-25"
          style={{ backgroundImage: `url(${IMG.bottles})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-botella-950 via-botella-950/80 to-botella-950" />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Catálogo</p>
          <h1 className="text-5xl sm:text-7xl font-black mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Nuestros vinos
          </h1>
          <p className="text-botella-200 max-w-2xl mx-auto text-lg">
            Una selección curada de los vinos que llevamos a tu mesa.
            Bodegas argentinas, varietales clásicos y nuestra propia etiqueta.
          </p>
        </div>
      </section>

      {/* Filtros */}
      <section className="bg-botella-900/40 backdrop-blur-sm border-y border-botella-800 sticky top-16 sm:top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              placeholder="🔍 Buscar vino, varietal o bodega..."
              value={busq}
              onChange={e => setBusq(e.target.value)}
              className="w-full bg-botella-800/50 border border-botella-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-botella-400 focus:outline-none focus:border-dorado-400 transition"
            />
          </div>
          <div className="flex gap-1.5 overflow-x-auto scrollbar-none -mx-1 px-1">
            {varietales.map(v => (
              <button
                key={v}
                onClick={() => setVarietal(v)}
                className={`shrink-0 px-3 py-2 rounded-full text-xs font-bold whitespace-nowrap transition ${
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
      </section>

      {/* Grid */}
      <section className="py-12 sm:py-16 bg-botella-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {filtrados.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-3">🍷</p>
              <p className="text-botella-300">No encontramos vinos con esos filtros.</p>
            </div>
          ) : (
            <>
              <p className="text-xs text-botella-400 uppercase tracking-widest font-semibold mb-6">
                {filtrados.length} {filtrados.length === 1 ? 'etiqueta' : 'etiquetas'}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filtrados.map(v => (
                  <article
                    key={v.id}
                    className="group bg-botella-900/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-botella-700/40 hover:border-dorado-500/50 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-dorado-500/10"
                  >
                    <div className="aspect-square overflow-hidden bg-botella-950 relative">
                      <img
                        src={v.fotoUrl}
                        alt={v.nombre}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-botella-950 via-transparent to-transparent opacity-50" />
                      {v.stock !== null && v.stock > 0 && (
                        <span className="absolute top-3 right-3 chip bg-emerald-500/90 text-white text-[10px]">
                          ✓ Disponible
                        </span>
                      )}
                      {v.stock === 0 && (
                        <span className="absolute top-3 right-3 chip bg-red-500/90 text-white text-[10px]">
                          Sin stock
                        </span>
                      )}
                    </div>
                    <div className="p-5">
                      <p className="text-[10px] text-dorado-400 tracking-widest uppercase font-bold mb-1">
                        {v.varietal}
                      </p>
                      <h3 className="font-black text-lg leading-tight mb-1" style={{ fontFamily: 'Georgia, serif' }}>
                        {v.nombre}
                      </h3>
                      <p className="text-xs text-botella-300 mb-3">{v.bodega}</p>
                      {v.descripcion && (
                        <p className="text-xs text-botella-200 leading-relaxed mb-3 line-clamp-3">
                          {v.descripcion}
                        </p>
                      )}
                      <div className="flex items-end justify-between pt-3 border-t border-botella-800/60">
                        <div>
                          <div className="text-[10px] text-botella-400 uppercase tracking-widest">Precio</div>
                          <div className="text-2xl font-black text-dorado-300">
                            ${v.precioVenta.toLocaleString('es-AR')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gradient-to-br from-botella-900 to-botella-950 border-t border-botella-800">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h3 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: 'Georgia, serif' }}>
            ¿Querés hacer un pedido?
          </h3>
          <p className="text-botella-300 mb-6">
            Llamanos, escribinos o pasá por la sucursal. Reparto a domicilio en La Plata.
          </p>
          <a
            href="https://wa.me/5492214567890?text=Hola%2C%20quer%C3%ADa%20consultar%20por%20los%20vinos%20de%20Vinos%20Gal%C3%A1n"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition"
          >
            💬 Pedir por WhatsApp
          </a>
        </div>
      </section>
    </div>
  )
}
