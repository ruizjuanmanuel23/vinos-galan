import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'
import { DIAS_SEMANA, DIA_LABEL, DIA_CORTO, diaSemanaHoy, type Cliente, type DiaSemana, type Viaje } from '../types'

const fmt = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })
const fmtCorto = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })

export default function Viajes() {
  const [viajes, setViajes] = useState<Viaje[]>([])
  const [filtro, setFiltro] = useState<'TODOS' | 'EN_CURSO' | 'FINALIZADO'>('TODOS')

  const [diaSel, setDiaSel] = useState<DiaSemana>(diaSemanaHoy())
  const [clientesDia, setClientesDia] = useState<Cliente[]>([])
  const [seleccionados, setSeleccionados] = useState<number[]>([])
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const cargarViajes = () => api.get<Viaje[]>('/viajes').then(r => setViajes(r.data)).catch(() => {})

  useEffect(() => { cargarViajes() }, [])

  useEffect(() => {
    api.get<Cliente[]>(`/clientes/dia/${diaSel}`).then(r => {
      setClientesDia(r.data)
      setSeleccionados([])
    }).catch(() => {})
  }, [diaSel])

  const porZona = useMemo(() => {
    const out: Record<string, Cliente[]> = {}
    clientesDia.forEach(c => {
      const z = c.zona?.trim() || 'Sin zona'
      if (!out[z]) out[z] = []
      out[z].push(c)
    })
    return out
  }, [clientesDia])

  const toggle = (id: number) => setSeleccionados(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  const seleccionarTodos = () => setSeleccionados(clientesDia.map(c => c.id))

  const armarViaje = async () => {
    if (seleccionados.length === 0) return
    setLoading(true)
    try {
      const r = await api.post('/viajes', {
        fecha: new Date().toISOString().split('T')[0],
        titulo: `Recorrido ${DIA_LABEL[diaSel]}`,
        clienteIds: seleccionados,
      })
      navigate(`/viajes/${r.data.id}`)
    } finally { setLoading(false) }
  }

  const visibles = filtro === 'TODOS' ? viajes : viajes.filter(v => v.estado === filtro)

  return (
    <div className="space-y-5 sm:space-y-6">
      <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <h1 className="page-title">Viajes</h1>
          <p className="page-subtitle">Armá tu recorrido del día o revisá los anteriores</p>
        </div>
        <Link to="/viajes/nuevo" className="btn-secondary text-xs sm:text-sm">+ Personalizado</Link>
      </div>

      {/* RECORRIDO POR DÍA */}
      <section className="card overflow-hidden border-l-4 border-dorado-500">
        <div className="bg-gradient-to-r from-botella-50 to-white p-4 sm:p-5 border-b border-gray-100">
          <div className="flex items-start sm:items-end justify-between gap-2 flex-wrap">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl">📍</span>
                <h2 className="text-base sm:text-lg font-black text-botella-900">Recorrido por día</h2>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">Seleccioná clientes y armá viaje</p>
            </div>
            {seleccionados.length > 0 && (
              <button onClick={armarViaje} disabled={loading} className="btn-dorado text-xs sm:text-sm">
                🚚 Armar con {seleccionados.length}
              </button>
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
          {/* Selector día — scrolleable en mobile */}
          <div className="scroll-h">
            <div className="card !shadow-none p-1 inline-flex bg-gray-50 gap-0.5">
              {DIAS_SEMANA.map(d => (
                <button
                  key={d}
                  onClick={() => setDiaSel(d)}
                  className={`px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-semibold transition whitespace-nowrap ${
                    diaSel === d ? 'bg-botella-700 text-white shadow' : 'text-gray-600 hover:bg-white'
                  }`}
                >
                  <span className="sm:hidden">{DIA_CORTO[d]}</span>
                  <span className="hidden sm:inline">{DIA_LABEL[d]}</span>
                </button>
              ))}
            </div>
          </div>

          {clientesDia.length === 0 ? (
            <div className="py-6 sm:py-8 text-center">
              <p className="text-3xl sm:text-4xl mb-2">📭</p>
              <p className="text-gray-600 font-semibold text-sm">Sin clientes para {DIA_LABEL[diaSel].toLowerCase()}.</p>
              <p className="text-xs text-gray-400 mt-1">Asigná el día desde la ficha del cliente.</p>
            </div>
          ) : (
            <>
              <div className="text-xs sm:text-sm text-gray-600">
                <span className="font-bold text-botella-900">{clientesDia.length}</span> cliente{clientesDia.length !== 1 ? 's' : ''} ·{' '}
                <button onClick={seleccionarTodos} className="text-botella-700 font-semibold hover:underline">seleccionar todos</button>
                {seleccionados.length > 0 && <> · <button onClick={() => setSeleccionados([])} className="text-gray-500 hover:underline">limpiar</button></>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.entries(porZona).map(([zona, lista]) => (
                  <div key={zona} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-3 py-1.5 border-b border-gray-100 flex items-center justify-between">
                      <p className="text-xs font-bold uppercase tracking-wide text-gray-500">📍 {zona}</p>
                      <span className="text-xs text-gray-400">{lista.length}</span>
                    </div>
                    <div className="divide-y divide-gray-100">
                      {lista.map(c => {
                        const sel = seleccionados.includes(c.id)
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggle(c.id)}
                            className={`w-full flex items-center gap-2.5 p-2.5 sm:p-3 text-left hover:bg-gray-50 transition ${sel ? 'bg-botella-50' : ''}`}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${sel ? 'bg-botella-700 border-botella-700' : 'border-gray-300'}`}>
                              {sel && <span className="text-white text-xs leading-none">✓</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-gray-900 truncate">{c.nombre}</p>
                              {c.direccion && <p className="text-xs text-gray-500 truncate">{c.direccion}</p>}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* HISTORIAL */}
      <section>
        <div className="flex items-start sm:items-end justify-between gap-2 mb-3 flex-wrap">
          <div>
            <h2 className="text-base sm:text-lg font-black text-botella-900">Historial</h2>
            <p className="text-xs text-gray-500">Todos los recorridos hechos</p>
          </div>
          <div className="flex gap-1.5 scroll-h">
            {([['TODOS','Todos'], ['EN_CURSO','En curso'], ['FINALIZADO','Hechos']] as const).map(([k, l]) => (
              <button key={k} onClick={() => setFiltro(k)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition ${filtro === k ? 'bg-botella-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{l}</button>
            ))}
          </div>
        </div>

        {visibles.length === 0 ? (
          <div className="card p-8 sm:p-10 text-center">
            <p className="text-4xl mb-2">🚚</p>
            <p className="text-gray-600 font-semibold text-sm">Aún no hay viajes.</p>
          </div>
        ) : (
          <>
            {/* MOBILE: cards */}
            <div className="lg:hidden space-y-2">
              {visibles.map(v => {
                const visitadas = v.paradas.filter(p => p.estado === 'VISITADA').length
                const total = v.paradas.length
                const enCurso = v.estado === 'EN_CURSO'
                return (
                  <Link key={v.id} to={`/viajes/${v.id}`} className="block card p-3 active:bg-gray-50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-botella-900 text-sm truncate">{v.titulo ?? 'Viaje'}</span>
                          <span className={`chip text-[10px] ${enCurso ? 'bg-dorado-100 text-dorado-800' : 'bg-gray-100 text-gray-600'}`}>
                            {enCurso ? 'En curso' : '✓ Hecho'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 capitalize mt-0.5">{fmtCorto(v.fecha)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-black text-botella-900 text-sm"><span>{visitadas}</span>/{total}</p>
                        <p className="text-[10px] uppercase text-gray-400">paradas</p>
                      </div>
                    </div>
                    <div className="mt-2 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-botella-600" style={{ width: total > 0 ? `${(visitadas/total)*100}%` : '0%' }} />
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* DESKTOP: tabla */}
            <div className="hidden lg:block card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-botella-900 text-white">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold">Fecha</th>
                    <th className="px-4 py-3 text-left font-semibold">Título</th>
                    <th className="px-4 py-3 text-center font-semibold">Estado</th>
                    <th className="px-4 py-3 text-center font-semibold">Paradas</th>
                    <th className="px-4 py-3 text-left font-semibold">Progreso</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {visibles.map((v, i) => {
                    const visitadas = v.paradas.filter(p => p.estado === 'VISITADA').length
                    const total = v.paradas.length
                    const enCurso = v.estado === 'EN_CURSO'
                    return (
                      <tr key={v.id} className={`border-t border-gray-100 hover:bg-gray-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="px-4 py-3 text-gray-700 capitalize whitespace-nowrap">{fmt(v.fecha)}</td>
                        <td className="px-4 py-3 font-semibold text-gray-900">{v.titulo ?? '—'}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`chip ${enCurso ? 'bg-dorado-100 text-dorado-800' : 'bg-gray-100 text-gray-600'}`}>
                            {enCurso ? '🚚 En curso' : '✓ Finalizado'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          <span className="font-bold text-botella-900">{visitadas}</span>/{total}
                        </td>
                        <td className="px-4 py-3 w-48">
                          <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-botella-600" style={{ width: total > 0 ? `${(visitadas/total)*100}%` : '0%' }} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Link to={`/viajes/${v.id}`} className="text-botella-700 font-semibold hover:underline">Ver →</Link>
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
    </div>
  )
}
