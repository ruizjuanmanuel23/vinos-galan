import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface MapPickerProps {
  address: string
  onAddressChange: (address: string) => void
}

export default function MapPicker({ address, onAddressChange }: MapPickerProps) {
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [marker, setMarker] = useState<{ lat: number; lng: number } | null>(null)
  const [showMap, setShowMap] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<L.Map | null>(null)
  const markerInstance = useRef<L.Marker | null>(null)
  const searchTimeout = useRef<NodeJS.Timeout>()

  // Inicializar mapa cuando se muestra
  useEffect(() => {
    if (!showMap || !mapRef.current) return

    setTimeout(() => {
      if (!mapRef.current) return
      mapInstance.current = L.map(mapRef.current).setView([-34.9011, -57.9537], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
      }).addTo(mapInstance.current)

      mapInstance.current.on('click', (e) => {
        const { lat, lng } = e.latlng
        setMarker({ lat, lng })
        updateMarker(lat, lng)
        reverseGeocode(lat, lng)
      })
    }, 0)

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove()
        mapInstance.current = null
      }
    }
  }, [showMap])

  const updateMarker = (lat: number, lng: number) => {
    if (markerInstance.current) {
      markerInstance.current.setLatLng([lat, lng])
    } else if (mapInstance.current) {
      markerInstance.current = L.marker([lat, lng]).addTo(mapInstance.current)
    }
    if (mapInstance.current) {
      mapInstance.current.setView([lat, lng], 15)
    }
  }

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`)
      const data = await res.json()
      if (data.address) {
        const addr = data.address.road || data.address.street || data.display_name
        onAddressChange(addr)
      }
    } catch (e) {
      console.error('Error:', e)
    }
  }

  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([])
      setShowMap(false)
      return
    }

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=8`
      )
      const data = await res.json()
      setSuggestions(data)
      setShowMap(data.length > 0)

      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setMarker({ lat, lng })
        setTimeout(() => updateMarker(lat, lng), 100)
      }
    } catch (e) {
      console.error('Search error:', e)
    }
  }

  const handleAddressInput = (value: string) => {
    onAddressChange(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchAddress(value), 600)
  }

  return (
    <div className="space-y-2">
      {suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 max-h-32 overflow-y-auto">
          <p className="text-xs text-blue-700 font-bold mb-1">Direcciones aproximadas:</p>
          {suggestions.slice(0, 5).map((s, i) => (
            <button
              key={i}
              onClick={() => {
                const lat = parseFloat(s.lat)
                const lng = parseFloat(s.lon)
                setMarker({ lat, lng })
                updateMarker(lat, lng)
                onAddressChange(s.display_name)
              }}
              className="w-full text-left text-xs px-2 py-1.5 hover:bg-blue-100 rounded transition text-gray-700"
            >
              📍 {s.display_name?.split(',')?.slice(0, 2)?.join(',')?.trim()}
            </button>
          ))}
        </div>
      )}

      {showMap && (
        <div className="space-y-2">
          <p className="text-xs text-gray-600 font-semibold">Clickeá en el mapa para ajustar la ubicación exacta</p>
          <div ref={mapRef} className="w-full h-64 rounded-lg border-2 border-dorado-300 shadow-lg" />
          {marker && (
            <p className="text-xs text-gray-500 text-center">
              📍 {marker.lat.toFixed(5)}, {marker.lng.toFixed(5)}
            </p>
          )}
        </div>
      )}
    </div>
  )
}
