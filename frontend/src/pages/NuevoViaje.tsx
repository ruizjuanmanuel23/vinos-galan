import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { DIAS_SEMANA, DIA_LABEL, DIA_CORTO, diaSemanaHoy, type Cliente, type DiaSemana } from '../types'

export default function NuevoViaje() {
  const [diaSel, setDiaSel] = useState<DiaSemana | 'TODOS'>(diaSemanaHoy())
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [titulo, setTitulo] = useState('')
  const [notas, setNotas] = useState('')
  const [busq, setBusq] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const url = diaSel === 'TODOS' ? '/clientes' : `/clientes/dia/${diaSel}`
    api.get<Cliente[]>(url).then(r => setClientes(r.data)).catch(() => {})
  }, [diaSel])

  const filtrados = busq
    ? clientes.filter(c => c.nombre.toLowerCase().includes(busq.toLowerCase()) || (c.direccion ?? '').toLowerCase().includes(busq.toLowerCase()))
    : clientes

  const toggle = (id: number) => setSeleccionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const seleccionadosObj = clientes.filter(c => seleccionados.includes(c.id))

  const mover = (idx: number, dir: -1 | 1) => {
    const nuevo = [...seleccionados]
    const target = idx + dir
    if (target < 0 || target >= nuevo.length) return
    ;[nuevo[idx], nuevo[target]] = [nuevo[target], nuevo[idx]]
    setSeleccionados(nuevo)
  }

  const crear = async () => {
    if (seleccionados.length === 0) return
    setLoading(true)
    try {
      const r = await api.post('/viajes', {
        fecha, titulo: titulo || `Viaje ${new Date(fecha+'T00:00:00').toLocaleDateString('es-AR')}`, notas, clienteIds: seleccionados,
      })
      navigate(`/viajes/${r.data.id}`)
    } finally { setLoading(false) }
  }

  return (
    <div className="space-y-4 sm:space-y-5 pb-32 lg:pb-0">
      <Link to="/viajes" className="text-botella-700 text-sm font-medium hover:underline">← Viajes</Link>
      <div>
        <h1 className="page-title">Nuevo viaje</h1>
        <p className="page-subtitle">Armá un recorrido con los clientes que vas a visitar</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Datos + paradas seleccionadas */}
        <div className="space-y-4 lg:order-1 order-2">
          <div className="card p-4 sm:p-5 space-y-3">
            <h2 className="font-bold text-gray-900 text-sm sm:text-base">Datos del viaje</h2>
            <div>
              <label className="label">Fecha</label>
              <input className="input" type="date" value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
            <div>
              <label className="label">Título (opcional)</label>
              <input className="input" placeholder={`Viaje ${new Date().toLocaleDateString('es-AR')}`} value={titulo} onChange={e => setTitulo(e.target.value)} />
            </div>
            <div>
              <label className="label">Notas (opcional)</label>
              <textarea className="input resize-none" rows={2} placeholder="Observaciones..." value={notas} onChange={e => setNotas(e.target.value)} />
            </div>
          </div>

          <div className="card p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-bold text-gray-900 text-sm sm:text-base">Paradas elegidas</h2>
              <span className="chip bg-botella-100 text-botella-800">{seleccionados.length}</span>
            </div>
            {seleccionadosObj.length === 0 ? (
              <p className="text-xs text-gray-400 py-4 text-center">Tildá clientes para agregar paradas.</p>
            ) : (
              <div className="space-y-1.5">
                {seleccionadosObj.map((c, idx) => (
                  <div key={c.id} className="flex items-center gap-2 bg-gray-50 rounded-lg p-2">
                    <span className="w-6 h-6 rounded-full bg-botella-700 text-white text-xs font-black flex items-center justify-center shrink-0">{idx + 1}</span>
                    <span className="text-sm font-medium text-gray-800 flex-1 truncate">{c.nombre}</span>
                    <div className="flex gap-0.5 shrink-0">
                      <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="w-7 h-7 text-gray-400 hover:text-botella-700 disabled:opacity-30 text-sm">▲</button>
                      <button onClick={() => mover(idx, 1)} disabled={idx === seleccionadosObj.length - 1} className="w-7 h-7 text-gray-400 hover:text-botella-700 disabled:opacity-30 text-sm">▼</button>
                      <button onClick={() => toggle(c.id)} className="w-7 h-7 text-red-400 hover:text-red-600 text-sm">✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {seleccionados.length > 0 && (
              <button onClick={crear} disabled={loading} className="w-full btn-dorado mt-4">
                {loading ? 'Creando...' : `🚚 Crear viaje con ${seleccionados.length} parada${seleccionados.length !== 1 ? 's' : ''}`}
              </button>
            )}
          </div>
        </div>

        {/* Selector clientes */}
        <div className="lg:col-span-2 card p-4 sm:p-5 lg:order-2 order-1">
          <h2 className="font-bold text-gray-900 mb-3 text-sm sm:text-base">Elegir clientes</h2>

          <div className="scroll-h mb-3">
            <div className="flex gap-1.5 w-max">
              <button onClick={() => setDiaSel('TODOS')} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${diaSel === 'TODOS' ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>Todos</button>
              {DIAS_SEMANA.map(d => (
                <button key={d} onClick={() => setDiaSel(d)} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${diaSel === d ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-700'}`}>
                  <span className="sm:hidden">{DIA_CORTO[d]}</span>
                  <span className="hidden sm:inline">{DIA_LABEL[d]}</span>
                </button>
              ))}
            </div>
          </div>

          <input className="input mb-3" placeholder="🔍 Buscar..." value={busq} onChange={e => setBusq(e.target.value)} />

          <div className="border border-gray-100 rounded-lg max-h-[400px] lg:max-h-[500px] overflow-y-auto divide-y divide-gray-100">
            {filtrados.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-400">Sin clientes para este filtro.</p>
            )}
            {filtrados.map(c => {
              const sel = seleccionados.includes(c.id)
              return (
                <button key={c.id} onClick={() => toggle(c.id)} className={`w-full flex items-center gap-3 p-3 text-left hover:bg-gray-50 active:bg-gray-50 transition ${sel ? 'bg-botella-50' : ''}`}>
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-botella-700 border-botella-700' : 'border-gray-300'}`}>
                    {sel && <span className="text-white text-xs leading-none">✓</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-900 truncate">{c.nombre}</p>
                    <div className="flex gap-2 text-xs text-gray-500">
                      {c.direccion && <span className="truncate">📍 {c.direccion}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {c.diaReparto && <span className="chip bg-botella-100 text-botella-700">{DIA_LABEL[c.diaReparto].slice(0,3)}</span>}
                    {c.zona && <span className="chip bg-dorado-100 text-dorado-800">{c.zona}</span>}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
