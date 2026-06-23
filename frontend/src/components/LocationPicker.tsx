import { useState } from 'react'
import Icon from './Icon'

interface LocationPickerProps {
  onSelect: (address: string) => void
  onClose: () => void
  initialAddress?: string
}

export default function LocationPicker({ onSelect, onClose, initialAddress = '' }: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress)
  const BARRIOS = ['Centro', 'Casco Histórico', 'Zona Baja', 'Diagonal 73', 'Zona de Quintas', 'Los Hornos', 'City Bell', 'Tolosa', 'Berisso', 'Magdalena']

  const direccionesGuardadas = [
    'Av. 9, 1230, La Plata',
    'Calle 45 esq 22, La Plata',
    'Diagonal 73, 1500, La Plata',
    'Av. 72, 2800, La Plata',
  ]

  const selectBarrio = (barrio: string) => {
    setAddress(`${barrio}, La Plata`)
  }

  const selectDireccion = (dir: string) => {
    setAddress(dir)
  }

  return (
    <div className="space-y-4">
      {/* Búsqueda rápida de barrios */}
      <div>
        <label className="label">Barrios cercanos</label>
        <div className="grid grid-cols-2 gap-2">
          {BARRIOS.map(b => (
            <button
              key={b}
              onClick={() => selectBarrio(b)}
              className="px-3 py-2 text-sm text-left rounded-lg border border-gray-200 hover:bg-dorado-50 hover:border-dorado-300 transition"
            >
              <Icon name="map-pin" className="w-3 h-3 inline mr-1" />
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Direcciones guardadas */}
      <div>
        <label className="label">Direcciones guardadas</label>
        <div className="space-y-1">
          {direccionesGuardadas.map((dir, i) => (
            <button
              key={i}
              onClick={() => selectDireccion(dir)}
              className="w-full text-left px-3 py-2.5 text-sm rounded-lg border border-gray-100 hover:bg-botella-50 hover:border-botella-300 transition"
            >
              <Icon name="map-pin" className="w-3 h-3 inline mr-2" />
              {dir}
            </button>
          ))}
        </div>
      </div>

      {/* Campo de dirección manual */}
      <div>
        <label className="label">Dirección personalizada</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Calle, número y localidad..."
          className="input"
        />
        <p className="text-[11px] text-gray-500 mt-1">Escribí completa para Google Maps / WhatsApp</p>
      </div>

      {/* Link a Google Maps */}
      {address.trim() && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <a
            href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-700 hover:text-blue-900 font-semibold flex items-center gap-2"
          >
            <Icon name="map-pin" className="w-4 h-4" />
            Ver en Google Maps →
          </a>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-2">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button
          onClick={() => onSelect(address)}
          disabled={!address.trim()}
          className="btn-primary disabled:opacity-50"
        >
          Guardar dirección
        </button>
      </div>
    </div>
  )
}
