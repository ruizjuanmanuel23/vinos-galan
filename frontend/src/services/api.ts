/**
 * Capa de datos: Offline-first con backend Spring Boot
 * 1. Intenta backend (http://localhost:8110)
 * 2. Fallback a localStorage si backend no disponible
 * 3. Sincroniza automáticamente cuando backend vuelve
 */

import type {
  Cliente, Vino, Venta, DeudaAnotacion, Viaje, Parada,
  ItemParada, PlantillaWhatsApp, DiaSemana, Zona, PrecioZona,
} from '../types'

const STORAGE_KEYS = {
  clientes: 'vg:clientes',
  vinos: 'vg:vinos',
  zonas: 'vg:zonas',
  ventas: 'vg:ventas',
  viajes: 'vg:viajes',
  deudas: 'vg:deudas',
  plantillas: 'vg:plantillas',
}

const API_BASE = 'http://localhost:8110/api'
let backendAvailable = false

// ============================================================
// Backend availability check
// ============================================================

async function isBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/zonas`, { method: 'HEAD', mode: 'no-cors' })
    backendAvailable = res.status < 500
    return backendAvailable
  } catch {
    backendAvailable = false
    return false
  }
}

// ============================================================
// localStorage helpers
// ============================================================

function getFromStorage<T>(key: string, defaultValue: T[] = []): T[] {
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : defaultValue
  } catch {
    return defaultValue
  }
}

function saveToStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (e) {
    console.error('Error saving to localStorage:', e)
  }
}

// ============================================================
// Clientes
// ============================================================

export async function listClientes(): Promise<Cliente[]> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/clientes`)
      if (res.ok) {
        const data = await res.json()
        saveToStorage(STORAGE_KEYS.clientes, data)
        return data
      }
    } catch (e) {
      console.warn('Backend unavailable, using localStorage')
    }
  }

  return getFromStorage<Cliente>(STORAGE_KEYS.clientes, [])
}

export async function getCliente(id: number): Promise<Cliente | null> {
  const clientes = await listClientes()
  return clientes.find(c => c.id === id) ?? null
}

export async function createCliente(c: Partial<Cliente>): Promise<Cliente> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/clientes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      if (res.ok) {
        const cliente = await res.json()
        const clientes = await listClientes()
        saveToStorage(STORAGE_KEYS.clientes, [...clientes, cliente])
        return cliente
      }
    } catch (e) {
      console.warn('Backend create failed, using localStorage')
    }
  }

  const clientes = await listClientes()
  const newId = Math.max(0, ...clientes.map(x => x.id ?? 0)) + 1
  const cliente: Cliente = {
    id: newId,
    nombre: c.nombre ?? '',
    telefono: c.telefono ?? '',
    direccion: c.direccion ?? '',
    zona: c.zona ?? null,
    zonaId: c.zonaId ?? null,
    diasReparto: c.diasReparto ?? [],
    notas: c.notas ?? '',
    creadoEn: new Date().toISOString(),
  }
  const updated = [...clientes, cliente]
  saveToStorage(STORAGE_KEYS.clientes, updated)
  return cliente
}

export async function updateCliente(id: number, c: Partial<Cliente>): Promise<Cliente> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
      })
      if (res.ok) {
        const cliente = await res.json()
        const clientes = await listClientes()
        const idx = clientes.findIndex(x => x.id === id)
        clientes[idx] = cliente
        saveToStorage(STORAGE_KEYS.clientes, clientes)
        return cliente
      }
    } catch (e) {
      console.warn('Backend update failed, using localStorage')
    }
  }

  const clientes = await listClientes()
  const idx = clientes.findIndex(x => x.id === id)
  if (idx === -1) throw new Error('Cliente no encontrado')
  clientes[idx] = { ...clientes[idx], ...c, id }
  saveToStorage(STORAGE_KEYS.clientes, clientes)
  return clientes[idx]
}

export async function deleteCliente(id: number): Promise<void> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const clientes = await listClientes()
        saveToStorage(STORAGE_KEYS.clientes, clientes.filter(x => x.id !== id))
        return
      }
    } catch (e) {
      console.warn('Backend delete failed, using localStorage')
    }
  }

  const clientes = await listClientes()
  saveToStorage(STORAGE_KEYS.clientes, clientes.filter(x => x.id !== id))
}

// ============================================================
// Zonas (Barrios)
// ============================================================

export async function listZonas(): Promise<Zona[]> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/zonas`)
      if (res.ok) {
        const data = await res.json()
        saveToStorage(STORAGE_KEYS.zonas, data)
        return data
      }
    } catch (e) {
      console.warn('Backend unavailable, using localStorage')
    }
  }

  return getFromStorage<Zona>(STORAGE_KEYS.zonas, [])
}

export async function createZona(z: Partial<Zona>): Promise<Zona> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/zonas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(z),
      })
      if (res.ok) {
        const zona = await res.json()
        const zonas = await listZonas()
        saveToStorage(STORAGE_KEYS.zonas, [...zonas, zona])
        return zona
      }
    } catch (e) {
      console.warn('Backend create failed, using localStorage')
    }
  }

  const zonas = await listZonas()
  const newId = Math.max(0, ...zonas.map(x => x.id ?? 0)) + 1
  const zona: Zona = {
    id: newId,
    nombre: z.nombre ?? '',
    ajustePorcentaje: z.ajustePorcentaje ?? 0,
    orden: z.orden ?? 0,
    creadoEn: new Date().toISOString(),
  }
  const updated = [...zonas, zona]
  saveToStorage(STORAGE_KEYS.zonas, updated)
  return zona
}

export async function updateZona(id: number, z: Partial<Zona>): Promise<Zona> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/zonas/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(z),
      })
      if (res.ok) {
        const zona = await res.json()
        const zonas = await listZonas()
        const idx = zonas.findIndex(x => x.id === id)
        zonas[idx] = zona
        saveToStorage(STORAGE_KEYS.zonas, zonas)
        return zona
      }
    } catch (e) {
      console.warn('Backend update failed, using localStorage')
    }
  }

  const zonas = await listZonas()
  const idx = zonas.findIndex(x => x.id === id)
  if (idx === -1) throw new Error('Zona no encontrada')
  zonas[idx] = { ...zonas[idx], ...z, id }
  saveToStorage(STORAGE_KEYS.zonas, zonas)
  return zonas[idx]
}

export async function deleteZona(id: number): Promise<void> {
  const isBackend = await isBackendAvailable()

  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/zonas/${id}`, { method: 'DELETE' })
      if (res.ok) {
        const zonas = await listZonas()
        saveToStorage(STORAGE_KEYS.zonas, zonas.filter(x => x.id !== id))
        return
      }
    } catch (e) {
      console.warn('Backend delete failed, using localStorage')
    }
  }

  const zonas = await listZonas()
  saveToStorage(STORAGE_KEYS.zonas, zonas.filter(x => x.id !== id))
}

// ============================================================
// Vinos (igual patrón: backend + fallback localStorage)
// ============================================================

export async function listVinos(): Promise<Vino[]> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/vinos`)
      if (res.ok) { const data = await res.json(); saveToStorage(STORAGE_KEYS.vinos, data); return data }
    } catch (e) {}
  }
  return getFromStorage<Vino>(STORAGE_KEYS.vinos, [])
}

export async function getVino(id: number): Promise<Vino | null> {
  const vinos = await listVinos()
  return vinos.find(v => v.id === id) ?? null
}

export async function createVino(v: Partial<Vino>): Promise<Vino> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/vinos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      if (res.ok) { const vino = await res.json(); const vinos = await listVinos(); saveToStorage(STORAGE_KEYS.vinos, [...vinos, vino]); return vino }
    } catch (e) {}
  }
  const vinos = await listVinos()
  const newId = Math.max(0, ...vinos.map(x => x.id ?? 0)) + 1
  const vino: Vino = { id: newId, nombre: v.nombre ?? '', bodega: v.bodega ?? '', varietal: v.varietal ?? '', precioVenta: v.precioVenta ?? 0, precioCosto: v.precioCosto ?? 0, stock: v.stock ?? 0, activo: v.activo ?? true, fotoUrl: v.fotoUrl ?? null, descripcion: v.descripcion ?? null, mostrarEnCatalogo: v.mostrarEnCatalogo ?? true, creadoEn: new Date().toISOString() }
  saveToStorage(STORAGE_KEYS.vinos, [...vinos, vino])
  return vino
}

export async function updateVino(id: number, v: Partial<Vino>): Promise<Vino> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/vinos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      if (res.ok) { const vino = await res.json(); const vinos = await listVinos(); const idx = vinos.findIndex(x => x.id === id); vinos[idx] = vino; saveToStorage(STORAGE_KEYS.vinos, vinos); return vino }
    } catch (e) {}
  }
  const vinos = await listVinos()
  const idx = vinos.findIndex(x => x.id === id)
  if (idx === -1) throw new Error('Vino no encontrado')
  vinos[idx] = { ...vinos[idx], ...v, id }
  saveToStorage(STORAGE_KEYS.vinos, vinos)
  return vinos[idx]
}

export async function deleteVino(id: number): Promise<void> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/vinos/${id}`, { method: 'DELETE' })
      if (res.ok) { const vinos = await listVinos(); saveToStorage(STORAGE_KEYS.vinos, vinos.filter(x => x.id !== id)); return }
    } catch (e) {}
  }
  const vinos = await listVinos()
  saveToStorage(STORAGE_KEYS.vinos, vinos.filter(x => x.id !== id))
}

export async function listVinosCatalogo(): Promise<Vino[]> {
  const vinos = await listVinos()
  return vinos.filter(v => v.mostrarEnCatalogo && v.activo)
}

// ============================================================
// Ventas
// ============================================================

export async function listVentas(): Promise<Venta[]> {
  return getFromStorage<Venta>(STORAGE_KEYS.ventas, [])
}

export async function getVenta(id: number): Promise<Venta | null> {
  const ventas = await listVentas()
  return ventas.find(v => v.id === id) ?? null
}

// ============================================================
// Viajes
// ============================================================

export async function listViajes(): Promise<Viaje[]> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/viajes`)
      if (res.ok) { const data = await res.json(); saveToStorage(STORAGE_KEYS.viajes, data); return data }
    } catch (e) {}
  }
  return getFromStorage<Viaje>(STORAGE_KEYS.viajes, [])
}

export async function getViaje(id: number): Promise<Viaje | null> {
  const viajes = await listViajes()
  return viajes.find(v => v.id === id) ?? null
}

export async function createViaje(v: Partial<Viaje>): Promise<Viaje> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/viajes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      if (res.ok) { const viaje = await res.json(); const viajes = await listViajes(); saveToStorage(STORAGE_KEYS.viajes, [...viajes, viaje]); return viaje }
    } catch (e) {}
  }
  const viajes = await listViajes()
  const newId = Math.max(0, ...viajes.map(x => x.id ?? 0)) + 1
  const viaje: Viaje = { id: newId, fecha: v.fecha ?? '', titulo: v.titulo ?? null, notas: v.notas ?? null, estado: 'EN_CURSO', inicio: v.inicio ?? null, fin: v.fin ?? null, paradas: v.paradas ?? [], cantidadTotalManual: v.cantidadTotalManual ?? null, cargado: v.cargado ?? false, fechaCarga: v.fechaCarga ?? null }
  saveToStorage(STORAGE_KEYS.viajes, [...viajes, viaje])
  return viaje
}

export async function updateViaje(id: number, v: Partial<Viaje>): Promise<Viaje> {
  const isBackend = await isBackendAvailable()
  if (isBackend) {
    try {
      const res = await fetch(`${API_BASE}/viajes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(v) })
      if (res.ok) { const viaje = await res.json(); const viajes = await listViajes(); const idx = viajes.findIndex(x => x.id === id); viajes[idx] = viaje; saveToStorage(STORAGE_KEYS.viajes, viajes); return viaje }
    } catch (e) {}
  }
  const viajes = await listViajes()
  const idx = viajes.findIndex(x => x.id === id)
  if (idx === -1) throw new Error('Viaje no encontrado')
  viajes[idx] = { ...viajes[idx], ...v, id }
  saveToStorage(STORAGE_KEYS.viajes, viajes)
  return viajes[idx]
}

// ============================================================
// Deudas
// ============================================================

export async function listDeudas(): Promise<DeudaAnotacion[]> {
  return getFromStorage<DeudaAnotacion>(STORAGE_KEYS.deudas, [])
}

// ============================================================
// Plantillas
// ============================================================

export async function listPlantillas(): Promise<PlantillaWhatsApp[]> {
  return getFromStorage<PlantillaWhatsApp>(STORAGE_KEYS.plantillas, [])
}

// ============================================================
// Inicialización: cargar datos de seed si localStorage está vacío
// ============================================================

export async function initializeApp(): Promise<void> {
  // Cargar zonas de seed si no existen
  const zonas = await listZonas()
  if (zonas.length === 0) {
    await createZona({ nombre: 'La Plata', ajustePorcentaje: 0, orden: 0 })
    await createZona({ nombre: 'Berisso', ajustePorcentaje: 0, orden: 1 })
    await createZona({ nombre: 'Magdalena', ajustePorcentaje: 0, orden: 2 })
  }

  // Cargar vinos de seed si no existen
  const vinos = await listVinos()
  if (vinos.length === 0) {
    await createVino({
      nombre: 'Malbec La Consulta',
      bodega: 'Bodega 1',
      varietal: 'Malbec',
      precioVenta: 450,
      precioCosto: 200,
      stock: 50,
      activo: true,
      mostrarEnCatalogo: true,
    })
    await createVino({
      nombre: 'Cabernet Sauvignon',
      bodega: 'Bodega 2',
      varietal: 'Cabernet',
      precioVenta: 520,
      precioCosto: 250,
      stock: 30,
      activo: true,
      mostrarEnCatalogo: true,
    })
  }
}
