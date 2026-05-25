import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import api from '../api/axios'
import type { EstadoParada, Viaje, Parada } from '../types'

const fmtFecha = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })
const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function DetalleViaje() {
  const { id } = useParams()
  const [viaje, setViaje] = useState<Viaje | null>(null)
  const navigate = useNavigate()

  const cargar = () => { api.get<Viaje>(`/viajes/${id}`).then(r => setViaje(r.data)).catch(() => {}) }
  useEffect(() => { cargar() }, [id])

  const actualizarEstado = async (paradaId: number, estado: EstadoParada) => {
    await api.put(`/viajes/paradas/${paradaId}`, { estado }); cargar()
  }
  const eliminarParada = async (paradaId: number) => {
    if (!confirm('¿Quitar esta parada?')) return
    await api.delete(`/viajes/paradas/${paradaId}`); cargar()
  }
  const finalizar = async () => {
    if (!confirm('¿Finalizar el viaje?')) return
    await api.put(`/viajes/${id}/finalizar`); cargar()
  }
  const eliminar = async () => {
    if (!confirm('¿Eliminar este viaje?')) return
    await api.delete(`/viajes/${id}`); navigate('/viajes')
  }

  if (!viaje) return <p className="text-center text-gray-400 py-12">Cargando...</p>

  const visitadas = viaje.paradas.filter(p => p.estado === 'VISITADA').length
  const omitidas = viaje.paradas.filter(p => p.estado === 'OMITIDA').length
  const pendientes = viaje.paradas.filter(p => p.estado === 'PENDIENTE').length
  const total = viaje.paradas.length
  const progreso = total > 0 ? ((visitadas + omitidas) / total) * 100 : 0
  const bloqueado = viaje.estado === 'FINALIZADO'

  return (
    <div className="space-y-4 sm:space-y-5">
      <Link to="/viajes" className="text-botella-700 text-sm font-medium hover:underline">← Viajes</Link>

      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="page-title">{viaje.titulo ?? 'Viaje'}</h1>
            <span className={`chip ${!bloqueado ? 'bg-dorado-100 text-dorado-800' : 'bg-gray-100 text-gray-600'}`}>
              {!bloqueado ? '🚚 En curso' : '✓ Finalizado'}
            </span>
          </div>
          <p className="page-subtitle capitalize">{fmtFecha(viaje.fecha)}</p>
        </div>
        <div className="flex gap-2">
          {!bloqueado && <button onClick={finalizar} className="btn-primary text-xs sm:text-sm">Finalizar</button>}
          <button onClick={eliminar} className="btn-secondary !text-red-600 !border-red-300 text-xs sm:text-sm">Eliminar</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-500">Total</p>
          <p className="text-xl sm:text-2xl font-black text-botella-900 mt-1">{total}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-emerald-50 border-emerald-200">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-emerald-700">Visitadas</p>
          <p className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{visitadas}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-gray-50">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-gray-600">Omitidas</p>
          <p className="text-xl sm:text-2xl font-black text-gray-600 mt-1">{omitidas}</p>
        </div>
        <div className="card p-3 sm:p-4 bg-dorado-50 border-dorado-200">
          <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-dorado-700">Pendientes</p>
          <p className="text-xl sm:text-2xl font-black text-dorado-700 mt-1">{pendientes}</p>
        </div>
      </div>

      <div className="card p-4">
        <div className="flex justify-between text-xs font-semibold mb-1">
          <span className="text-gray-600">Avance</span>
          <span className="text-botella-700">{Math.round(progreso)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-botella-600 transition-all" style={{ width: `${progreso}%` }} />
        </div>
      </div>

      {viaje.notas && (
        <div className="card p-4 bg-dorado-50/50 border-dorado-200">
          <p className="text-xs font-semibold text-dorado-800 mb-1">Notas</p>
          <p className="text-sm text-gray-700 italic">{viaje.notas}</p>
        </div>
      )}

      {/* Paradas */}
      <div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-3">Paradas ({total})</h2>
        {total === 0 ? (
          <p className="text-center text-gray-400 py-8">Sin paradas.</p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {viaje.paradas.map((p, idx) => (
              <ParadaCard key={p.id} parada={p} numero={idx + 1} onEstado={actualizarEstado} onEliminar={eliminarParada} bloqueado={bloqueado} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ParadaCard({ parada, numero, onEstado, onEliminar, bloqueado }: {
  parada: Parada; numero: number; onEstado: (id: number, e: EstadoParada) => void; onEliminar: (id: number) => void; bloqueado: boolean
}) {
  const c = parada.cliente
  const dirGoogle = c.direccion ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(c.direccion)}` : null
  const borde =
    parada.estado === 'VISITADA' ? 'border-l-emerald-500' :
    parada.estado === 'OMITIDA'  ? 'border-l-gray-400'   : 'border-l-dorado-500'

  return (
    <div className={`card p-3 sm:p-4 border-l-4 ${borde} ${parada.estado !== 'PENDIENTE' ? 'opacity-80' : ''}`}>
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-botella-100 text-botella-800 font-black text-sm flex items-center justify-center shrink-0">{numero}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <Link to={`/clientes/${c.id}`} className="font-bold text-gray-900 hover:text-botella-700 truncate">{c.nombre}</Link>
            {parada.estado === 'VISITADA' && parada.horaVisita && (
              <span className="chip bg-emerald-100 text-emerald-700 shrink-0">✓ {fmtHora(parada.horaVisita)}</span>
            )}
          </div>
          {c.telefono && <a href={`tel:${c.telefono}`} className="block text-xs text-botella-600 mt-0.5 active:underline">📞 {c.telefono}</a>}
          {c.direccion && (
            <div className="text-xs text-gray-500 mt-0.5">
              {dirGoogle ? <a href={dirGoogle} target="_blank" rel="noreferrer" className="active:underline hover:underline">📍 {c.direccion}</a> : <>📍 {c.direccion}</>}
            </div>
          )}
        </div>
      </div>

      {!bloqueado && (
        <>
          <div className="mt-3 grid grid-cols-3 gap-1.5">
            <button onClick={() => onEstado(parada.id, 'VISITADA')} className={`py-2 rounded-lg text-xs font-bold transition ${parada.estado === 'VISITADA' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 active:bg-emerald-100'}`}>✓ Visitada</button>
            <button onClick={() => onEstado(parada.id, 'OMITIDA')} className={`py-2 rounded-lg text-xs font-bold transition ${parada.estado === 'OMITIDA' ? 'bg-gray-500 text-white' : 'bg-gray-100 text-gray-700 active:bg-gray-200'}`}>⏭ Omitir</button>
            <button onClick={() => onEstado(parada.id, 'PENDIENTE')} className={`py-2 rounded-lg text-xs font-bold transition ${parada.estado === 'PENDIENTE' ? 'bg-dorado-500 text-white' : 'bg-dorado-50 text-dorado-800 active:bg-dorado-100'}`}>↻ Pendiente</button>
          </div>
          <button onClick={() => onEliminar(parada.id)} className="mt-2 text-xs text-red-500 active:text-red-700 hover:underline">Quitar del viaje</button>
        </>
      )}
    </div>
  )
}
