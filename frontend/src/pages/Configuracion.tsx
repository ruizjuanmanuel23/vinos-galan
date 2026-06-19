import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import Modal from '../components/Modal'
import { aplicarVariables, type PlantillaWhatsApp, type Cliente } from '../types'

const VARIABLES = [
  { key: '{nombre}',    desc: 'Nombre del cliente' },
  { key: '{direccion}', desc: 'Dirección del cliente' },
  { key: '{zona}',      desc: 'Zona / barrio' },
  { key: '{dia}',       desc: 'Día de reparto asignado al cliente' },
  { key: '{dia_hoy}',   desc: 'Día de la semana actual (ej: lunes)' },
  { key: '{hora}',      desc: 'Hora actual (ej: 14:30)' },
]

const CLIENTE_DEMO: Cliente = {
  id: 0,
  nombre: 'Bar La Esquina',
  telefono: '1145556677',
  direccion: 'Av. Corrientes 1234',
  zona: 'Centro',
  diasReparto: ['JUEVES'],
  notas: '',
  creadoEn: '',
}

const EMPTY = { nombre: '', texto: '', esDefault: false }

export default function Configuracion() {
  const [plantillas, setPlantillas] = useState<PlantillaWhatsApp[]>([])
  const [show, setShow] = useState(false)
  const [editandoId, setEditandoId] = useState<number | null>(null)
  const [form, setForm] = useState(EMPTY)

  const cargar = () => api.get<PlantillaWhatsApp[]>('/plantillas').then(r => setPlantillas(r.data)).catch(() => {})
  useEffect(() => { cargar() }, [])

  const abrirNuevo = () => {
    setEditandoId(null)
    setForm({ ...EMPTY, esDefault: plantillas.length === 0 })
    setShow(true)
  }
  const abrirEditar = (p: PlantillaWhatsApp) => {
    setEditandoId(p.id)
    setForm({ nombre: p.nombre, texto: p.texto, esDefault: p.esDefault })
    setShow(true)
  }
  const guardar = async () => {
    if (!form.nombre.trim() || !form.texto.trim()) return
    if (editandoId) await api.put(`/plantillas/${editandoId}`, form)
    else await api.post('/plantillas', form)
    setShow(false); cargar()
  }
  const eliminar = async (id: number) => {
    if (!confirm('¿Eliminar esta plantilla?')) return
    await api.delete(`/plantillas/${id}`); cargar()
  }
  const marcarDefault = async (id: number) => {
    await api.put(`/plantillas/${id}`, { esDefault: true }); cargar()
  }

  const insertarVariable = (v: string) => {
    setForm(f => ({ ...f, texto: f.texto + (f.texto && !f.texto.endsWith(' ') ? ' ' : '') + v }))
  }

  const preview = aplicarVariables(form.texto, CLIENTE_DEMO)

  return (
    <div className="space-y-4 sm:space-y-5 max-w-3xl">
      <div>
        <h1 className="page-title">Configuración</h1>
        <p className="page-subtitle">Plantillas de mensaje para los clientes</p>
      </div>

      {/* Info */}
      <div className="card p-4 sm:p-5 bg-emerald-50/50 border-emerald-200 border-l-4">
        <div className="flex items-start gap-3">
          <span className="text-3xl shrink-0">💬</span>
          <div>
            <h2 className="font-bold text-emerald-900 text-sm sm:text-base">Mensajes rápidos por WhatsApp</h2>
            <p className="text-xs sm:text-sm text-emerald-800 mt-1 leading-relaxed">
              Configurá los mensajes que mandás a tus clientes (saludo para tomar pedido, aviso de en camino, etc.).
              Después, desde la ficha de cada cliente o el listado, tocás un botón verde y se abre WhatsApp con el mensaje listo.
            </p>
            <p className="text-xs text-emerald-700 mt-2">
              <strong>Usá variables</strong> como <code className="bg-white px-1 py-0.5 rounded text-[11px]">{'{nombre}'}</code> para que se reemplacen automáticamente con los datos del cliente.
            </p>
          </div>
        </div>
      </div>

      {/* Lista de plantillas */}
      <div className="flex items-center justify-between">
        <h2 className="text-sm sm:text-base font-bold text-gray-900">Plantillas ({plantillas.length})</h2>
        <button onClick={abrirNuevo} className="btn-primary text-xs sm:text-sm">+ Nueva plantilla</button>
      </div>

      <div className="space-y-2">
        {plantillas.length === 0 && (
          <p className="card p-8 text-center text-sm text-gray-400">
            Aún no tenés plantillas. Creá la primera con el botón de arriba.
          </p>
        )}
        {plantillas.map(p => (
          <div key={p.id} className={`card p-4 ${p.esDefault ? 'border-l-4 border-dorado-500' : ''}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-gray-900">{p.nombre}</h3>
                  {p.esDefault && <span className="chip bg-dorado-100 text-dorado-800">⭐ Default</span>}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                {!p.esDefault && (
                  <button onClick={() => marcarDefault(p.id)} className="text-xs text-dorado-700 hover:underline px-2 py-1">
                    Hacer default
                  </button>
                )}
                <button onClick={() => abrirEditar(p)} className="text-xs text-botella-700 hover:underline px-2 py-1">
                  Editar
                </button>
                <button onClick={() => eliminar(p.id)} className="text-xs text-red-500 hover:underline px-2 py-1">
                  ✕
                </button>
              </div>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {p.texto}
            </div>
          </div>
        ))}
      </div>

      {/* Modal nueva/editar */}
      <Modal open={show} onClose={() => setShow(false)} title={editandoId ? 'Editar plantilla' : 'Nueva plantilla'} size="xl">
        <div className="space-y-4">
          <div>
            <label className="label">Nombre de la plantilla *</label>
            <input
              className="input"
              placeholder='Ej: "Pedido del día"'
              value={form.nombre}
              onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
            />
            <p className="text-[11px] text-gray-500 mt-1">Solo para identificarla en la lista. No se manda al cliente.</p>
          </div>

          <div>
            <label className="label">Mensaje *</label>
            <textarea
              className="input resize-none font-mono text-sm"
              rows={5}
              placeholder="Hola {nombre}! ¿Cómo estás? Hoy estamos repartiendo y queríamos saber si te llevamos algo."
              value={form.texto}
              onChange={e => setForm(f => ({ ...f, texto: e.target.value }))}
            />
          </div>

          {/* Variables disponibles */}
          <div>
            <p className="label">Insertar variable</p>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertarVariable(v.key)}
                  title={v.desc}
                  className="px-2.5 py-1.5 rounded-lg bg-botella-50 border border-botella-200 hover:bg-botella-100 hover:border-botella-400 text-botella-800 font-mono text-xs font-bold transition"
                >
                  {v.key}
                </button>
              ))}
            </div>
          </div>

          {/* Preview */}
          {form.texto && (
            <div>
              <p className="label">Vista previa (con cliente de ejemplo)</p>
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-wide text-emerald-700 font-bold mb-1.5">
                  Mensaje para: {CLIENTE_DEMO.nombre}
                </p>
                <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{preview}</p>
              </div>
            </div>
          )}

          {/* Default toggle */}
          <label className="flex items-start gap-3 bg-dorado-50/50 border border-dorado-200 rounded-lg p-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.esDefault}
              onChange={e => setForm(f => ({ ...f, esDefault: e.target.checked }))}
              className="mt-0.5 w-4 h-4"
            />
            <div>
              <p className="font-bold text-sm text-dorado-900">⭐ Usar como plantilla por defecto</p>
              <p className="text-xs text-dorado-800 mt-0.5">
                Será la que se usa cuando tocás el botón verde de WhatsApp en un cliente sin elegir explícitamente.
              </p>
            </div>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button onClick={() => setShow(false)} className="btn-ghost">Cancelar</button>
            <button onClick={guardar} className="btn-primary">Guardar</button>
          </div>
        </div>
      </Modal>

      {/* Sección: variables disponibles (referencia) */}
      <details className="card p-4">
        <summary className="cursor-pointer font-bold text-sm text-gray-900">📖 Variables disponibles</summary>
        <div className="mt-3 space-y-2 text-sm">
          {VARIABLES.map(v => (
            <div key={v.key} className="flex items-center justify-between gap-3 py-1.5 border-b border-gray-100 last:border-0">
              <code className="bg-gray-100 px-2 py-0.5 rounded text-xs font-bold text-botella-800">{v.key}</code>
              <span className="text-xs text-gray-600 text-right">{v.desc}</span>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-3">
          Las variables se reemplazan automáticamente cuando mandás el mensaje. Si el cliente no tiene ese dato, queda vacío.
        </p>
      </details>

      <Link to="/app" className="block text-center text-sm text-botella-700 hover:underline pt-4">
        ← Volver al inicio
      </Link>
    </div>
  )
}
