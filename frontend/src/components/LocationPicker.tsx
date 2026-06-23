import { useState } from 'react'

interface LocationPickerProps {
  onSelect: (address: string) => void
  onClose: () => void
  initialAddress?: string
}

export default function LocationPicker({ onSelect, onClose, initialAddress = '' }: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress)

  const BARRIOS = [
    'Centro', 'Casco Histórico', 'Zona Baja', 'Diagonal 73',
    'Zona de Quintas', 'Los Hornos', 'City Bell', 'Tolosa'
  ]

  return (
    <div className="space-y-4">
      <div>
        <label className="label mb-2">Barrios cercanos</label>
        <div className="grid grid-cols-2 gap-2">
          {BARRIOS.map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setAddress(`${b}, La Plata`)}
              className="px-3 py-2 text-sm text-left rounded-lg border border-gray-200 hover:bg-dorado-50 transition"
            >
              📍 {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="label">Dirección</label>
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Calle, número, localidad..."
          className="input"
        />
      </div>

      {address.trim() && (
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-sm text-blue-600 hover:underline"
        >
          Ver en Google Maps →
        </a>
      )}

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button
          onClick={() => onSelect(address)}
          disabled={!address.trim()}
          className="btn-primary disabled:opacity-50"
        >
          Guardar
        </button>
      </div>
    </div>
  )
}
