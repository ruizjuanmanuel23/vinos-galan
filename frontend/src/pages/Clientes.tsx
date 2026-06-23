import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import * as db from '../services/api'
import { useRealtimeRefresh } from '../services/realtime'
import Modal from '../components/Modal'
import Icon from '../components/Icon'
import {
  DIAS_SEMANA, DIA_LABEL, aplicarVariables, whatsappCliente,
  type Cliente, type DiaSemana, type PlantillaWhatsApp, type Zona,
} from '../types'

const EMPTY = {
  nombre: '', telefono: '', direccion: '', zona: '',
  zonaId: null as number | null,
  diasReparto: [] as DiaSemana[],
  notas: '',
}

type OrdenClientes = 'direccion' | 'nombre'

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [zonas, setZonas] = useState<Zona[]>([])
  const [plantillaDefault, setPlantillaDefault] = useState<PlantillaWhatsApp | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [filtroZona, setFiltroZona] = useState<'TODAS' | number>('TODAS')
  const [orden, setOrden] = useState<OrdenClientes>('direccion')
  const [show, setShow] = useState(false)
  const [showBarrios, setShowBarrios] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [formBarrio, setFormBarrio] = useState({ nombre: '', ajustePorcentaje: 0 })

  const cargar = async () => { const c = await db.listClientes(); setClientes(c) }
  const cargarZonas = async () => { const z = await db.listZonas(); setZonas(z) }
  useEffect(() => { cargar(); cargarZonas() }, [])
  useRealtimeRefresh(tabla => {
    if (tabla === 'clientes') cargar()
    if (tabla === 'zonas') cargarZonas()
  })
  useEffect(() => {
    db.listPlantillas().then(plantillas => {
      const def = plantillas.find(p => p.esDefault) ?? plantillas[0] ?? null
      setPlantillaDefault(def)
    })
  }, [])

  const zonaPorId = (id: number | null) => id ? zonas.find(z => z.id === id) ?? null : null

  const abrirWhatsApp = (c: Cliente, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!c.telefono) return
    const msg = plantillaDefault ? aplicarVariables(plantillaDefault.texto, c) : undefined
    window.open(whatsappCliente(c.telefono, msg), '_blank')
  }

  const filtrados = useMemo(() => {
    let list = clientes
    if (filtroZona !== 'TODAS') list = list.filter(c => c.zonaId === filtroZona)
    if (busqueda) {
      const q = busqueda.toLowerCase()
      list = list.filter(c =>
        c.nombre.toLowerCase().includes(q) ||
        (c.telefono ?? '').includes(q) ||
        (c.direccion ?? '').toLowerCase().includes(q),
      )
    }
    const sorted = [...list]
    if (orden === 'direccion') {
      sorted.sort((a, b) => (a.direccion ?? '').localeCompare(b.direccion ?? '', 'es', { numeric: true }))
    } else {
      sorted.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
    }
    return sorted
  }, [clientes, busqueda, filtroZona, orden])

  const guardar = async () => {
    if (!form.nombre.trim()) return
    const payload = {
      ...form,
      diasReparto: form.diasReparto ?? [],
      zona: form.zona || null,
      zonaId: form.zonaId,
    }
    await db.createCliente(payload)
    setShow(false); setForm(EMPTY); cargar()
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowBarrios(true)} className="btn-secondary flex items-center gap-1.5">
            <Icon name="map-pin" className="w-4 h-4" />Barrios
          </button>
          <button onClick={() => setShow(true)} className="btn-primary">+ Nuevo</button>
        </div>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Icon name="search" className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input className="input !pl-9" placeholder="Buscar por nombre, tel. o dirección..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        </div>

        {/* Filtro por zona + toggle de orden */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="scroll-h flex-1">
            <div className="flex gap-1.5 w-max items-center">
              <span className="text-[10px] uppercase tracking-wide font-bold text-gray-500 mr-1">Zona</span>
              <button
                onClick={() => setFiltroZona('TODAS')}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${
                  filtroZona === 'TODAS' ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'
                }`}
              >Todas</button>
              {zonas.map(z => (
                <button
                  key={z.id}
                  onClick={() => setFiltroZona(z.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap inline-flex items-center gap-1 ${
                    filtroZona === z.id ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'
                  }`}
                >
                  <Icon name="map-pin" className="w-3 h-3" />{z.nombre}
                </button>
              ))}
            </div>
          </div>
          <div className="inline-flex bg-gray-100 rounded-lg p-0.5 shrink-0">
            <button
              onClick={() => setOrden('direccion')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition ${
                orden === 'direccion' ? 'bg-white text-botella-900 shadow-sm' : 'text-gray-500'
              }`}
            >Por calle</button>
            <button
              onClick={() => setOrden('nombre')}
              className={`px-2.5 py-1 text-[11px] font-bold rounded transition ${
                orden === 'nombre' ? 'bg-white text-botella-900 shadow-sm' : 'text-gray-500'
              }`}
            >A-Z</button>
          </div>
        </div>
      </div>

      {/* MOBILE: cards */}
      <div className="lg:hidden space-y-2">
        {filtrados.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Sin clientes para mostrar.</p>}
        {filtrados.map(c => (
          <div key={c.id} className="card p-3 flex items-center gap-2">
            <Link to={`/app/clientes/${c.id}`} className="flex items-start justify-between gap-2 flex-1 min-w-0 active:opacity-70">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{c.nombre}</p>
                {c.telefono && <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1"><Icon name="phone" className="w-3 h-3 shrink-0" />{c.telefono}</p>}
                {c.direccion && <p className="text-xs text-gray-500 truncate flex items-center gap-1"><Icon name="map-pin" className="w-3 h-3 shrink-0" />{c.direccion}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {(zonaPorId(c.zonaId)?.nombre || c.zona) && (
                  <span className="chip bg-dorado-100 text-dorado-800 inline-flex items-center gap-1">
                    <Icon name="map-pin" className="w-3 h-3" />{zonaPorId(c.zonaId)?.nombre || c.zona}
                  </span>
                )}
              </div>
            </Link>
            {c.telefono && (
              <button
                onClick={e => abrirWhatsApp(c, e)}
                title="Mandar mensaje por WhatsApp"
                className="w-10 h-10 rounded-lg bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white flex items-center justify-center shrink-0 transition shadow"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.7 2.5 4 3.5.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.1-.6-.2zm-5.4 7.2h0c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1 0 5.5-4.5 9.8-10.2 9.8zM20.5 3.5C18.2 1.3 15.2 0 12.1 0 5.5 0 .1 5.4.1 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4h0c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.4-8.3z" />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {/* DESKTOP: tabla */}
      <div className="hidden lg:block card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-botella-900 text-white">
            <tr>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Teléfono</th>
              <th className="px-4 py-3 text-left font-semibold">Dirección</th>
              <th className="px-4 py-3 text-center font-semibold">Zona</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-gray-400">No hay clientes para mostrar.</td></tr>
            )}
            {filtrados.map((c, i) => (
              <tr key={c.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-3 font-semibold text-gray-900">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-700">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.direccion ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  {(zonaPorId(c.zonaId)?.nombre || c.zona)
                    ? <span className="chip bg-dorado-100 text-dorado-800">{zonaPorId(c.zonaId)?.nombre || c.zona}</span>
                    : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {c.telefono && (
                      <button
                        onClick={e => abrirWhatsApp(c, e)}
                        title="Mensaje por WhatsApp"
                        className="w-8 h-8 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center transition"
                      >
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
                          <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.7 2.5 4 3.5.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.1-.6-.2zm-5.4 7.2h0c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1 0 5.5-4.5 9.8-10.2 9.8zM20.5 3.5C18.2 1.3 15.2 0 12.1 0 5.5 0 .1 5.4.1 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4h0c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.4-8.3z" />
                        </svg>
                      </button>
                    )}
                    <Link to={`/app/clientes/${c.id}`} className="text-botella-700 font-semibold hover:underline">Ficha →</Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={show} onClose={() => setShow(false)} title="Nuevo cliente" size="lg">
        <ClienteForm form={form} setForm={setForm} zonas={zonas} onSubmit={guardar} onCancel={() => setShow(false)} />
      </Modal>

      <Modal open={showBarrios} onClose={() => setShowBarrios(false)} title="Barrios" size="md">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre del barrio</label>
            <input
              type="text"
              className="input"
              placeholder="ej. La Plata Centro, Berisso, Magdalena..."
              value={formBarrio.nombre}
              onChange={e => setFormBarrio(f => ({ ...f, nombre: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Ajuste de precio (%)</label>
            <input
              type="number"
              className="input"
              placeholder="0"
              value={formBarrio.ajustePorcentaje}
              onChange={e => setFormBarrio(f => ({ ...f, ajustePorcentaje: parseFloat(e.target.value) || 0 }))}
              step="0.1"
            />
            <p className="text-[11px] text-gray-500 mt-1">Porcentaje de ajuste de precio para este barrio (ej. +5 o -3)</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-bold text-sm">Barrios existentes</h3>
            {zonas.length === 0 ? (
              <p className="text-sm text-gray-500">Sin barrios creados aún.</p>
            ) : (
              <div className="space-y-1">
                {zonas.map(z => (
                  <div key={z.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg border border-gray-100">
                    <div>
                      <p className="font-semibold text-sm">{z.nombre}</p>
                      {z.ajustePorcentaje !== 0 && (
                        <p className="text-[11px] text-gray-500">Ajuste: {z.ajustePorcentaje > 0 ? '+' : ''}{z.ajustePorcentaje}%</p>
                      )}
                    </div>
                    <button
                      onClick={async () => {
                        if (confirm(`¿Eliminar barrio "${z.nombre}"?`)) {
                          await db.deleteZona(z.id)
                          cargarZonas()
                        }
                      }}
                      className="text-xs text-red-600 hover:text-red-700 font-bold"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShowBarrios(false)} className="btn-ghost">Cerrar</button>
            <button
              onClick={async () => {
                if (!formBarrio.nombre.trim()) return
                await db.createZona(formBarrio)
                cargarZonas()
                setFormBarrio({ nombre: '', ajustePorcentaje: 0 })
              }}
              className="btn-primary"
            >
              Crear barrio
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

/**
 * Botón que abre el selector de contactos del celular y autocompleta nombre + teléfono.
 *
 * Usa la Contact Picker API (Chrome Android). En PC/iOS la API no existe.
 * Si no está disponible muestra un mensaje claro.
 */
function BotonImportarContacto({ onImport }: { onImport: (nombre: string, telefono: string) => void }) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Feature detection: Contact Picker API solo existe en Chrome Android (y derivados)
  const disponible = typeof navigator !== 'undefined'
    && 'contacts' in navigator
    && 'ContactsManager' in (window as any)

  const importar = async () => {
    setError(null)
    if (!disponible) {
      setError('Esta función solo funciona desde el celular. En la PC no hay acceso a la libreta de contactos.')
      return
    }
    setLoading(true)
    try {
      const nav = navigator as any
      const props = ['name', 'tel']
      const contacts = await nav.contacts.select(props, { multiple: false })
      if (!contacts || contacts.length === 0) {
        setLoading(false)
        return // el usuario canceló
      }
      const c = contacts[0]
      const nombre = Array.isArray(c.name) && c.name[0] ? String(c.name[0]) : ''
      const telefono = Array.isArray(c.tel) && c.tel[0] ? String(c.tel[0]) : ''
      onImport(nombre, telefono)
    } catch (e: any) {
      setError('No se pudo abrir la libreta de contactos. ' + (e?.message ?? ''))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-2">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-emerald-700" fill="currentColor">
            <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.4-.1-.6.1-.2.3-.7.9-.8 1-.2.2-.3.2-.6.1-.3-.1-1.2-.4-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.7-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9 0 1.1.8 2.2 1 2.4.1.2 1.7 2.5 4 3.5.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.4-.6 1.6-1.1.2-.6.2-1 .1-1.1-.1-.1-.3-.1-.6-.2zm-5.4 7.2h0c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4c-1-1.6-1.5-3.4-1.5-5.2 0-5.5 4.5-10 10-10 2.7 0 5.2 1 7.1 2.9 1.9 1.9 2.9 4.4 2.9 7.1 0 5.5-4.5 9.8-10.2 9.8zM20.5 3.5C18.2 1.3 15.2 0 12.1 0 5.5 0 .1 5.4.1 12c0 2.1.6 4.2 1.6 6L0 24l6.2-1.6c1.7.9 3.7 1.4 5.7 1.4h0c6.6 0 12-5.4 12-12 0-3.2-1.3-6.2-3.4-8.3z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-emerald-900 text-sm">Importar de WhatsApp</p>
          <p className="text-[11px] text-emerald-700">
            {disponible
              ? 'Elegí un contacto y se completan nombre y teléfono solos'
              : 'Disponible solo desde el celular (APK)'}
          </p>
        </div>
        <button
          type="button"
          onClick={importar}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs shrink-0 transition"
        >
          {loading ? 'Abriendo...' : 'Elegir contacto'}
        </button>
      </div>
      {error && <p className="text-[11px] text-red-700 mt-2">{error}</p>}
    </div>
  )
}

export function ClienteForm({ form, setForm, zonas, onSubmit, onCancel }: {
  form: typeof EMPTY
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY>>
  zonas: Zona[]
  onSubmit: () => void
  onCancel: () => void
}) {
  return (
    <div className="space-y-4">
      <BotonImportarContacto onImport={(nombre, telefono) =>
        setForm(f => ({ ...f, nombre: nombre || f.nombre, telefono: telefono || f.telefono }))
      } />
      <div>
        <label className="label">Nombre *</label>
        <input className="input" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="label">Teléfono</label>
          <input className="input" type="tel" inputMode="tel" value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
        </div>
        <div>
          <label className="label">Grupo de zonas</label>
          {zonas.length === 0 ? (
            <Link
              to="/app/configuracion"
              className="block bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-800"
            >
              Cargá zonas en <strong>Configuración</strong> primero →
            </Link>
          ) : (
            <select
              className="input"
              value={form.zonaId ?? ''}
              onChange={e => setForm(f => ({ ...f, zonaId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">Sin zona asignada</option>
              {zonas.map(z => (
                <option key={z.id} value={z.id}>
                  {z.nombre}{z.ajustePorcentaje !== 0 ? ` (${z.ajustePorcentaje > 0 ? '+' : ''}${z.ajustePorcentaje}%)` : ''}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
      <div>
        <label className="label">Dirección</label>
        <input className="input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-1">
          <label className="label !mb-0">Días de reparto</label>
          <span className="text-[10px] text-gray-400">Tocá uno o varios</span>
        </div>
        <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
          {DIAS_SEMANA.map(d => {
            const activo = form.diasReparto.includes(d)
            return (
              <button
                key={d}
                type="button"
                onClick={() => setForm(f => ({
                  ...f,
                  diasReparto: activo
                    ? f.diasReparto.filter(x => x !== d)
                    : [...f.diasReparto, d],
                }))}
                className={`py-2.5 text-xs font-bold rounded-lg transition ${
                  activo
                    ? 'bg-botella-700 text-white shadow ring-2 ring-botella-300'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-botella-400'
                }`}
              >
                {DIA_LABEL[d].slice(0, 3)}
              </button>
            )
          })}
        </div>
        {form.diasReparto.length === 0 && (
          <p className="text-[10px] text-gray-400 mt-1.5">Sin días asignados — el cliente no aparece bajo ningún día en Viajes</p>
        )}
      </div>

      <div>
        <label className="label">Notas</label>
        <textarea className="input resize-none" rows={3} value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onCancel} className="btn-ghost">Cancelar</button>
        <button onClick={onSubmit} className="btn-primary">Guardar</button>
      </div>
    </div>
  )
}
