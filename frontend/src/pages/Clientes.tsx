import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'
import { DIAS_SEMANA, DIA_LABEL, type Cliente, type DiaSemana } from '../types'

const EMPTY = { nombre: '', telefono: '', direccion: '', zona: '', diaReparto: '' as '' | DiaSemana, notas: '' }

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [filtroDia, setFiltroDia] = useState<'TODOS' | DiaSemana>('TODOS')
  const [show, setShow] = useState(false)
  const [form, setForm] = useState(EMPTY)

  const cargar = () => api.get<Cliente[]>('/clientes').then(r => setClientes(r.data)).catch(() => {})
  useEffect(() => { cargar() }, [])

  const filtrados = useMemo(() => {
    let list = clientes
    if (filtroDia !== 'TODOS') list = list.filter(c => c.diaReparto === filtroDia)
    if (busqueda) {
      const q = busqueda.toLowerCase()
      list = list.filter(c => c.nombre.toLowerCase().includes(q) || (c.telefono ?? '').includes(q))
    }
    return list
  }, [clientes, busqueda, filtroDia])

  const guardar = async () => {
    if (!form.nombre.trim()) return
    const payload = { ...form, diaReparto: form.diaReparto || null, zona: form.zona || null }
    await api.post('/clientes', payload)
    setShow(false); setForm(EMPTY); cargar()
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div>
          <h1 className="page-title">Clientes</h1>
          <p className="page-subtitle">{clientes.length} cliente{clientes.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShow(true)} className="btn-primary">+ Nuevo</button>
      </div>

      <div className="space-y-3">
        <input className="input" placeholder="🔍 Buscar por nombre o teléfono..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <div className="scroll-h">
          <div className="flex gap-1.5 w-max">
            <button onClick={() => setFiltroDia('TODOS')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${filtroDia === 'TODOS' ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>Todos</button>
            {DIAS_SEMANA.map(d => (
              <button key={d} onClick={() => setFiltroDia(d)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${filtroDia === d ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                {DIA_LABEL[d].slice(0, 3)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* MOBILE: cards */}
      <div className="lg:hidden space-y-2">
        {filtrados.length === 0 && <p className="text-center text-sm text-gray-400 py-8">Sin clientes para mostrar.</p>}
        {filtrados.map(c => (
          <Link key={c.id} to={`/app/clientes/${c.id}`} className="block card p-3 active:bg-gray-50">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900 truncate">{c.nombre}</p>
                {c.telefono && <p className="text-xs text-gray-500 mt-0.5">📞 {c.telefono}</p>}
                {c.direccion && <p className="text-xs text-gray-500 truncate">📍 {c.direccion}</p>}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                {c.diaReparto && <span className="chip bg-botella-100 text-botella-700">{DIA_LABEL[c.diaReparto].slice(0, 3)}</span>}
                {c.zona && <span className="chip bg-dorado-100 text-dorado-800">{c.zona}</span>}
              </div>
            </div>
          </Link>
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
              <th className="px-4 py-3 text-center font-semibold">Día reparto</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-gray-400">No hay clientes para mostrar.</td></tr>
            )}
            {filtrados.map((c, i) => (
              <tr key={c.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                <td className="px-4 py-3 font-semibold text-gray-900">{c.nombre}</td>
                <td className="px-4 py-3 text-gray-700">{c.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{c.direccion ?? '—'}</td>
                <td className="px-4 py-3 text-center">
                  {c.zona ? <span className="chip bg-dorado-100 text-dorado-800">{c.zona}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {c.diaReparto ? <span className="chip bg-botella-100 text-botella-800">{DIA_LABEL[c.diaReparto]}</span> : <span className="text-gray-300">—</span>}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link to={`/app/clientes/${c.id}`} className="text-botella-700 font-semibold hover:underline">Ficha →</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={show} onClose={() => setShow(false)} title="Nuevo cliente" size="lg">
        <ClienteForm form={form} setForm={setForm} onSubmit={guardar} onCancel={() => setShow(false)} />
      </Modal>
    </div>
  )
}

export function ClienteForm({ form, setForm, onSubmit, onCancel }: {
  form: typeof EMPTY; setForm: React.Dispatch<React.SetStateAction<typeof EMPTY>>; onSubmit: () => void; onCancel: () => void
}) {
  return (
    <div className="space-y-4">
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
          <label className="label">Zona / barrio</label>
          <input className="input" placeholder="Centro, Sur..." value={form.zona} onChange={e => setForm(f => ({ ...f, zona: e.target.value }))} />
        </div>
      </div>
      <div>
        <label className="label">Dirección</label>
        <input className="input" value={form.direccion} onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))} />
      </div>

      <div>
        <label className="label">Día de reparto</label>
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1">
          <button type="button" onClick={() => setForm(f => ({ ...f, diaReparto: '' }))} className={`py-2 text-xs font-bold rounded ${form.diaReparto === '' ? 'bg-gray-200 text-gray-800' : 'bg-gray-50 text-gray-500 border border-gray-200'}`}>Ninguno</button>
          {DIAS_SEMANA.map(d => (
            <button key={d} type="button" onClick={() => setForm(f => ({ ...f, diaReparto: d }))} className={`py-2 text-xs font-bold rounded ${form.diaReparto === d ? 'bg-botella-700 text-white' : 'bg-white text-gray-700 border border-gray-200'}`}>
              {DIA_LABEL[d].slice(0, 3)}
            </button>
          ))}
        </div>
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
