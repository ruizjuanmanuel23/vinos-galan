interface MapPickerProps {
  address: string
  onAddressChange: (address: string) => void
}

export default function MapPicker({ address, onAddressChange }: MapPickerProps) {
  const BARRIOS = [
    'Centro', 'Casco Histórico', 'Zona Baja', 'Diagonal 73',
    'Zona de Quintas', 'Los Hornos', 'City Bell', 'Tolosa', 'Berisso', 'Magdalena'
  ]

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
      <div>
        <p className="text-xs font-bold text-blue-800 mb-2">📍 BARRIOS CERCANOS</p>
        <div className="grid grid-cols-2 gap-2">
          {BARRIOS.map(b => (
            <button
              key={b}
              onClick={() => onAddressChange(`${b}, La Plata`)}
              className="px-3 py-2 text-xs text-left rounded-lg border border-blue-200 hover:bg-blue-100 transition bg-white"
            >
              📍 {b}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-xs font-bold text-blue-800 block mb-1">DIRECCIÓN</label>
        <input
          type="text"
          value={address}
          onChange={(e) => onAddressChange(e.target.value)}
          placeholder="Calle, número, localidad..."
          className="w-full px-3 py-2 rounded-lg border border-blue-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {address.trim() && (
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
        >
          Ver en Google Maps →
        </a>
      )}
    </div>
  )
}
