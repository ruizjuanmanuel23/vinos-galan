import { useRef } from 'react'

interface MapPickerProps {
  address: string
  onAddressChange: (address: string) => void
}

export default function MapPicker({ address, onAddressChange }: MapPickerProps) {
  const searchTimeout = useRef<NodeJS.Timeout>()

  const searchAddress = async (query: string) => {
    if (query.length < 3) return

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=ar&limit=5`
      )
      const data = await res.json()
      if (data.length > 0) {
        const suggestion = data[0].display_name
        onAddressChange(suggestion)
      }
    } catch (e) {
      console.error('Search error:', e)
    }
  }

  const handleAddressInput = (value: string) => {
    onAddressChange(value)
    clearTimeout(searchTimeout.current)
    searchTimeout.current = setTimeout(() => searchAddress(value), 800)
  }

  return (
    <div className="text-xs text-gray-500">
      💡 Escribiendo se busca automáticamente la dirección más cercana...
    </div>
  )
}
