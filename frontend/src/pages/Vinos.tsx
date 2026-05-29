import { useEffect, useRef, useState } from 'react'
import api from '../api/axios'
import Modal from '../components/Modal'
import { comprimirImagen, tamañoKb } from '../utils/imagen'
import type { Vino } from '../types'

const EMPTY = {
  nombre: '', bodega: '', varietal: '',
  precioVenta: '', precioCosto: '', stock: '0',
  fotoUrl: null as string | null,
  descripcion: '',
  mostrarEnCatalogo: true,
}

export default function Vinos() {
  const [vinos, setVinos] = useState<Vino[]>([])
  const [show, setShow] = useState(false)
  const [editando, setEditando] = useState<Vino | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [filtro, setFiltro] = useState<'activos' | 'todos'>('activos')
  const [busq, setBusq] = useState('')
  const [subiendoFoto, setSubiendoFoto] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const cargar = () => api.get<Vino[]>('/vinos/admin').then(r => setVinos(r.data)).catch(() => {})
  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => { setEditando(null); setForm(EMPTY); setShow(true) }
  const abrirEditar = (v: Vino) => {
    setEditando(v)
    setForm({
      nombre: v.nombre, bodega: v.bodega ?? '', varietal: v.varietal ?? '',
      precioVenta: String(v.precioVenta ?? ''), precioCosto: String(v.precioCosto ?? ''),
      stock: String(v.stock ?? 0),
      fotoUrl: v.fotoUrl ?? null,
      descripcion: v.descripcion ?? '',
      mostrarEnCatalogo: v.mostrarEnCatalogo !== false,
    })
    setShow(true)
  }

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { alert('El archivo debe ser una imagen'); return }
    setSubiendoFoto(true)
    try {
      const dataUrl = await comprimirImagen(file, { maxWidth: 800, maxHeight: 800, quality: 0.8 })
      setForm(f => ({ ...f, fotoUrl: dataUrl }))
    } catch {
      alert('No se pudo procesar la imagen')
    } finally {
      setSubiendoFoto(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const quitarFoto = () => setForm(f => ({ ...f, fotoUrl: null }))

  const guardar = async () => {
    if (!form.nombre.trim()) return
    const payload = {
      ...form,
      precioVenta: Number(form.precioVenta) || 0,
      precioCosto: Number(form.precioCosto) || 0,
      stock: Number(form.stock) || 0,
      descripcion: form.descripcion || null,
    }
    if (editando) await api.put(`/vinos/${editando.id}`, payload)
    else await api.post('/vinos', payload)
    setShow(false); cargar()
  }

  const desactivar = async (id: number) => {
    if (confirm('¿Quitar este vino del stock?')) { await api.delete(`/vinos/${id}`); cargar() }
  }

  let visibles = filtro === 'activos' ? vinos.filter(v => v.activo) : vinos
  if (busq) {
    const q = busq.toLowerCase()
    visibles = visibles.filter(v =>
      v.nombre.toLowerCase().includes(q) ||
      (v.bodega ?? '').toLowerCase().includes(q) ||
      (v.varietal ?? '').toLowerCase().includes(q))
  }

  const totalStock = visibles.reduce((acc, v) => acc + v.stock, 0)

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title">Stock de vinos</h1>
          <p className="page-subtitle">{visibles.length} vino{visibles.length !== 1 ? 's' : ''} · {totalStock} unidades</p>
        </div>
        <button onClick={abrirNuevo} className="btn-primary">+ Nuevo vino</button>
      </div>

      <div className="space-y-3">
        <input className="input" placeholder="🔍 Buscar nombre, bodega o varietal..." value={busq} onChange={e => setBusq(e.target.value)} />
        <div className="flex gap-1.5">
          {(['activos', 'todos'] as const).map(f => (
            <button key={f} onClick={() => setFiltro(f)} className={`px-3 py-1.5 rounded-full text-xs font-bold ${filtro === f ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
              {f === 'activos' ? 'Solo activos' : 'Todos'}
            </button>
          ))}
        </div>
      </div>

      {/* MOBILE: cards */}
      <div className="lg:hidden space-y-2">
        {visibles.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Sin vinos.</p>}
        {visibles.map(v => (
          <div key={v.id} className={`card p-3 ${!v.activo ? 'opacity-50' : ''}`}>
            <div className="flex items-start gap-3">
              {/* Foto */}
              <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0 flex items-center justify-center">
                {v.fotoUrl ? (
                  <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl text-gray-300">🍷</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{v.nombre}</p>
                <p className="text-xs text-gray-500 truncate">{[v.bodega, v.varietal].filter(Boolean).join(' · ')}</p>
                <div className="flex gap-3 mt-1.5 items-baseline">
                  <span className="font-bold text-botella-800">${Number(v.precioVenta).toLocaleString('es-AR')}</span>
                  <span className="text-[10px] text-gray-400">costo ${Number(v.precioCosto).toLocaleString('es-AR')}</span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className={`chip ${v.stock === 0 ? 'bg-red-100 text-red-700' : v.stock <= 5 ? 'bg-dorado-100 text-dorado-800' : 'bg-emerald-100 text-emerald-700'}`}>{v.stock} u.</span>
                {v.mostrarEnCatalogo !== false && (
                  <span className="chip bg-blue-100 text-blue-700 text-[10px]">🌐 Web</span>
                )}
                <div className="flex gap-1 mt-1">
                  <button onClick={() => abrirEditar(v)} className="text-xs text-botella-700 px-2 py-1 active:underline">Editar</button>
                  {v.activo && <button onClick={() => desactivar(v.id)} className="text-xs text-red-500 px-2 py-1 active:underline">✕</button>}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* DESKTOP: tabla */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-botella-900 text-white">
            <tr>
              <th className="px-3 py-3 text-center font-semibold w-16">Foto</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Bodega</th>
              <th className="px-4 py-3 text-left font-semibold">Varietal</th>
              <th className="px-4 py-3 text-right font-semibold">P. Venta</th>
              <th className="px-4 py-3 text-right font-semibold">P. Costo</th>
              <th className="px-4 py-3 text-right font-semibold">Margen</th>
              <th className="px-4 py-3 text-center font-semibold">Stock</th>
              <th className="px-4 py-3 text-center font-semibold">Web</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {visibles.length === 0 && (
              <tr><td colSpan={10} className="px-4 py-12 text-center text-gray-400">Sin vinos.</td></tr>
            )}
            {visibles.map((v, i) => {
              const venta = Number(v.precioVenta)
              const costo = Number(v.precioCosto)
              const margen = costo > 0 ? Math.round(((venta - costo) / costo) * 100) : 0
              return (
                <tr key={v.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${!v.activo ? 'opacity-50' : ''}`}>
                  <td className="px-3 py-2 text-center">
                    <div className="w-12 h-12 mx-auto rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center">
                      {v.fotoUrl
                        ? <img src={v.fotoUrl} alt={v.nombre} className="w-full h-full object-cover" />
                        : <span className="text-lg text-gray-300">🍷</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-900">{v.nombre}</td>
                  <td className="px-4 py-3 text-gray-700">{v.bodega ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-700">{v.varietal ?? '—'}</td>
                  <td className="px-4 py-3 text-right font-bold text-botella-800">${venta.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right text-gray-500">${costo.toLocaleString('es-AR')}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`chip ${margen >= 50 ? 'bg-emerald-100 text-emerald-700' : margen >= 25 ? 'bg-dorado-100 text-dorado-700' : 'bg-red-100 text-red-700'}`}>{margen}%</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`chip ${v.stock === 0 ? 'bg-red-100 text-red-700' : v.stock <= 5 ? 'bg-dorado-100 text-dorado-800' : 'bg-emerald-100 text-emerald-700'}`}>{v.stock} u.</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {v.mostrarEnCatalogo !== false ? (
                      <span className="chip bg-blue-100 text-blue-700">🌐</span>
                    ) : (
                      <span className="text-gray-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => abrirEditar(v)} className="text-botella-700 font-semibold hover:underline text-xs">Editar</button>
                      {v.activo && <button onClick={() => desactivar(v.id)} className="text-red-500 hover:underline text-xs">Quitar</button>}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Modal open={show} onClose={() => setShow(false)} title={editando ? 'Editar vino' : 'Nuevo vino'} size="lg">
        <div className="space-y-4">
          {/* Foto */}
          <div>
            <label className="label">Foto del vino</label>
            <div className="flex items-start gap-3">
              <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center border border-gray-200 shrink-0">
                {form.fotoUrl ? (
                  <img src={form.fotoUrl} alt="Vista previa" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-3xl text-gray-300">🍷</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={onFile}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={subiendoFoto}
                  className="btn-secondary w-full sm:w-auto"
                >
                  {subiendoFoto ? 'Procesando...' : form.fotoUrl ? '📷 Cambiar foto' : '📷 Subir foto'}
                </button>
                {form.fotoUrl && (
                  <button type="button" onClick={quitarFoto} className="btn-ghost text-red-500 text-xs">
                    Quitar foto
                  </button>
                )}
                {form.fotoUrl && (
                  <p className="text-[10px] text-gray-400">
                    ~{tamañoKb(form.fotoUrl)} KB comprimida
                  </p>
                )}
                <p className="text-xs text-gray-500">
                  La foto se va a ver en el catálogo público de la web.
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="label">Nombre *</label>
            <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="label">Bodega</label>
              <input className="input" value={form.bodega} onChange={e => setForm(f => ({ ...f, bodega: e.target.value }))} />
            </div>
            <div>
              <label className="label">Varietal</label>
              <input className="input" placeholder="Malbec, Cabernet..." value={form.varietal} onChange={e => setForm(f => ({ ...f, varietal: e.target.value }))} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Venta $</label>
              <input className="input" type="number" inputMode="decimal" value={form.precioVenta} onChange={e => setForm(f => ({ ...f, precioVenta: e.target.value }))} />
            </div>
            <div>
              <label className="label">Costo $</label>
              <input className="input" type="number" inputMode="decimal" value={form.precioCosto} onChange={e => setForm(f => ({ ...f, precioCosto: e.target.value }))} />
            </div>
            <div>
              <label className="label">Stock</label>
              <input className="input" type="number" inputMode="numeric" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="label">Descripción para el catálogo público</label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Notas de cata, maridajes sugeridos, características..."
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
            />
            <p className="text-[10px] text-gray-400 mt-1">
              Aparece debajo del vino en la página /catalogo
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-3">
            <input
              type="checkbox"
              id="mostrarEnCatalogo"
              checked={form.mostrarEnCatalogo}
              onChange={e => setForm(f => ({ ...f, mostrarEnCatalogo: e.target.checked }))}
              className="mt-0.5 w-4 h-4"
            />
            <label htmlFor="mostrarEnCatalogo" className="cursor-pointer flex-1">
              <p className="font-bold text-sm text-blue-900">🌐 Mostrar en el catálogo de la web</p>
              <p className="text-xs text-blue-700 mt-0.5">
                Si está marcado, este vino aparece en /catalogo público.
                Desmarcalo para vinos internos o sin stock.
              </p>
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShow(false)} className="btn-ghost">Cancelar</button>
            <button onClick={guardar} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
