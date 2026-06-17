/**
 * Sincronización en tiempo real entre dispositivos.
 *
 * Suscribe a cambios en TODAS las tablas y emite un evento que el resto de la app
 * puede escuchar para refrescar sus datos.
 *
 * Las páginas que quieran "auto-refrescarse" cuando otro dispositivo modifique
 * algo, solo tienen que llamar `useRealtimeRefresh()` y reaccionar al cambio.
 */
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'

const TABLAS = ['clientes', 'vinos', 'ventas', 'deudas', 'viajes', 'plantillas_whatsapp']

let channel: ReturnType<typeof supabase.channel> | null = null
const listeners = new Set<(tabla: string) => void>()

function ensureChannel() {
  if (channel) return channel
  channel = supabase.channel('vg-realtime')
  for (const tabla of TABLAS) {
    channel.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, () => {
      listeners.forEach(fn => {
        try { fn(tabla) } catch {}
      })
    })
  }
  channel.subscribe()
  return channel
}

/**
 * Hook que llama `onChange(tabla)` cada vez que cambia una tabla en Supabase.
 * Útil para refrescar datos cuando otro dispositivo modifica algo.
 *
 * Filtralo por tabla si te interesa solo una:
 *   useRealtimeRefresh(tabla => { if (tabla === 'clientes') cargar() })
 */
export function useRealtimeRefresh(onChange: (tabla: string) => void) {
  useEffect(() => {
    ensureChannel()
    listeners.add(onChange)
    return () => { listeners.delete(onChange) }
  }, [onChange])
}
