interface MapPickerProps {
  address: string
  onAddressChange: (address: string) => void
}

export default function MapPicker({ address, onAddressChange }: MapPickerProps) {
  return (
    <div className="space-y-2">
      <input
        type="text"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
        placeholder="Dirección (calle, número, localidad)"
        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      {address.trim() && (
        <a
          href={`https://www.google.com/maps/search/${encodeURIComponent(address)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-green-700 hover:text-green-900 font-semibold block"
        >
          Ver en Google Maps →
        </a>
      )}
    </div>
  )
}
