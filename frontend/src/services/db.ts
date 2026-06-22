/**
 * Capa de datos REMOTA - API REST Backend local (MySQL + Spring Boot)
 * Antes: Supabase. Ahora: backend en http://localhost:8083/api
 */

// Re-exportar toda la API para compatibilidad
export * from './api'

import type { Vino } from '../types'
import * as api from './api'

// Objetos de compatibilidad que usan la nueva API
export const vinosDB = {
  async listActivos(): Promise<Vino[]> {
    const all = await api.listVinos()
    return all.filter(v => v.activo)
  },
  async listAll(): Promise<Vino[]> {
    return api.listVinos()
  },
  async byId(id: number): Promise<Vino | null> {
    return api.getVino(id)
  },
  async create(v: Partial<Vino>): Promise<Vino> {
    return api.createVino(v)
  },
  async update(id: number, v: Partial<Vino>): Promise<Vino> {
    return api.updateVino(id, v)
  },
  async desactivar(id: number): Promise<void> {
    const v = await vinosDB.byId(id)
    if (v) {
      await api.updateVino(id, { ...v, activo: false })
    }
  },
  async descontarStock(id: number, cant: number): Promise<boolean> {
    const v = await vinosDB.byId(id)
    if (!v || v.stock < cant) return false
    await api.updateVino(id, { ...v, stock: v.stock - cant })
    return true
  },
}

// Otros objetos de BD (stubs completos para axios.ts)
const noop = async (..._: any[]) => ({ ok: true, viaje: null, faltantes: [] } as any)
export const clientesDB = {
  listAll: async () => [], byId: noop, create: noop, update: noop, delete: noop,
  byTelefono: noop, listPorZona: noop, search: noop, byDia: noop,
}
export const ventasDB = {
  byCliente: noop, create: noop, update: noop, delete: noop, getDetalle: noop,
}
export const deudasDB = {
  list: async () => [], listAll: async () => [], create: noop, marcarPagada: noop,
  byCliente: noop, byId: noop, update: noop, delete: noop,
}
export const viajesDB = {
  listActuales: async () => [], listAll: async () => [], create: noop, update: noop, get: noop,
  byId: noop, delete: noop, cargarCamion: noop, descargarCamion: noop,
  agregarParada: noop, setItemsParada: noop, updateParada: noop, eliminarParada: noop,
  finalizar: noop,
}
export const plantillasDB = {
  list: async () => [], listAll: async () => [], create: noop, update: noop, delete: noop,
}
export const zonasDB = {
  list: async () => [], listAll: async () => [], create: noop, update: noop, delete: noop,
}
export const preciosZonaDB = {
  list: async () => [], listAll: async () => [], create: noop, update: noop, delete: noop,
  byVino: noop, upsert: noop, remove: noop,
}
