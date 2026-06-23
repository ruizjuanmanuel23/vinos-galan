import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  onSelect: (address: string) => void
  onClose: () => void
  initialAddress?: string
}

interface MapMarker {
  lat: number
  lng: number
}

export default function LocationPicker({ onSelect, onClose, initialAddress = '' }: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress)
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [marker, setMarker] = useState<MapMarker | null>(null)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerInstance = useRef<L.Marker | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout>()

  // Inicializar mapa
  useEffect(() => {
    if (!mapRef.current) return

    mapInstance.current = L.map(mapRef.current).setView([-34.9011, -57.9537], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance.current)

    // Click en el mapa para seleccionar
    mapInstance.current.on('click', (e) => {
      const { lat, lng } = e.latlng
      setMarker({ lat, lng })
      updateMarker(lat, lng)
      reverseGeocode(lat, lng)
    })

    return () => {
      mapInstance.current?.remove()
    }
  }, [])

  const updateMarker = (lat: number, lng: number) => {
    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng])
    } else if (mapInstance.current) {
      markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current)
    }
    mapInstance.current?.setView([lat, lng], 15)
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data.address) {
        setAddress(data.address.road || data.address.street || data.display_name)
      }
    } catch (e) {
      console.error('Reverse geocoding failed:', e)
    }
  }

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      return
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=5`
      )
      const data = await res.json()
      setSuggestions(data)
    } catch (e) {
      console.error('Search failed:', e)
    }
  }

  const handleAddressChange = (value: string) => {
    setAddress(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchAddress(value), 500)
  }

  const selectSuggestion = (suggestion: any) => {
    const displayName = suggestion.display_name || suggestion.address?.road || ''
    setAddress(displayName)
    setSuggestions([])

    const lat = parseFloat(suggestion.lat)
    const lng = parseFloat(suggestion.lon)
    setMarker({ lat, lng })
    updateMarker(lat, lng)
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="label">Buscar dirección</label>
        <input
          type="text"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder="Calle, número, localidad..."
          className="input"
          autoComplete="off"
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 mt-1 max-w-md">
            {suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => selectSuggestion(s)}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 border-b border-gray-100 last:border-0 text-sm"
              >
                📍 {s.display_name?.split(',')?.slice(0, 3)?.join(',') || s.display_name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="label">Seleccioná en el mapa (clickeá para marcar)</label>
        <div ref={mapRef} className="w-full h-80 rounded-lg border border-gray-200 bg-gray-50" />
        {marker && (
          <p className="text-xs text-gray-500 mt-2">
            📍 {marker.lat.toFixed(4)}, {marker.lng.toFixed(4)}
          </p>
        )}
      </div>

      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="btn-ghost">Cancelar</button>
        <button
          onClick={() => onSelect(address)}
          disabled={!address.trim()}
          className="btn-primary disabled:opacity-50"
        >
          Guardar ubicación
        </button>
      </div>
    </div>
  )
}
