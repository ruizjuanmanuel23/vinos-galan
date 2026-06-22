/**
 * Capa de datos remota con API REST (backend local en 8083)
 * Reemplaza a Supabase después de la migración a MySQL local.
 */

const API_BASE = 'http://localhost:8083/api'

import type {
  Cliente, Vino, Venta, DeudaAnotacion, Viaje, Parada,
  ItemParada, PlantillaWhatsApp, DiaSemana, Zona, PrecioZona,
} from '../types'

// =============================================================
// Helpers: mapeo snake_case (DB) <-> camelCase (frontend)
// =============================================================

function clienteFromRow(r: any): Cliente {
  let dias: any[] = []
  if (Array.isArray(r.diasReparto)) dias = r.diasReparto
  else if (typeof r.diasReparto === 'string') {
    try { const p = JSON.parse(r.diasReparto); if (Array.isArray(p)) dias = p } catch { /* ignore */ }
  }
  if (dias.length === 0 && r.diaReparto) dias = [r.diaReparto]
  return {
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono ?? '',
    direccion: r.direccion ?? '',
    zona: r.zona ?? null,
    zonaId: r.zonaId ?? null,
    diasReparto: dias.filter((d): d is any => typeof d === 'string'),
    notas: r.notas ?? '',
    creadoEn: r.creadoEn,
  }
}

function zonaFromRow(r: any): Zona {
  return {
    id: r.id,
    nombre: r.nombre,
    ajustePorcentaje: Number(r.ajustePorcentaje ?? 0),
    orden: r.orden ?? 0,
    creadoEn: r.creadoEn,
  }
}

function vinoFromRow(r: any): Vino {
  return {
    id: r.id,
    nombre: r.nombre,
    bodega: r.bodega ?? '',
    varietal: r.varietal ?? '',
    precioVenta: Number(r.precioVenta ?? 0),
    precioCosto: Number(r.precioCosto ?? 0),
    stock: r.stock ?? 0,
    activo: r.activo ?? true,
    fotoUrl: r.fotoUrl ?? null,
    descripcion: r.descripcion ?? null,
    mostrarEnCatalogo: r.mostrarEnCatalogo ?? true,
    creadoEn: r.creadoEn,
  }
}

// =============================================================
// Clientes
// =============================================================

export async function listClientes(): Promise<Cliente[]> {
  const res = await fetch(`${API_BASE}/clientes`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.map(clienteFromRow)
}

export async function getCliente(id: number): Promise<Cliente | null> {
  const res = await fetch(`${API_BASE}/clientes/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return clienteFromRow(await res.json())
}

export async function createCliente(c: Partial<Cliente>): Promise<Cliente> {
  const res = await fetch(`${API_BASE}/clientes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return clienteFromRow(await res.json())
}

export async function updateCliente(id: number, c: Partial<Cliente>): Promise<Cliente> {
  const res = await fetch(`${API_BASE}/clientes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(c),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return clienteFromRow(await res.json())
}

export async function deleteCliente(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/clientes/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// =============================================================
// Zonas
// =============================================================

export async function listZonas(): Promise<Zona[]> {
  const res = await fetch(`${API_BASE}/zonas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.map(zonaFromRow)
}

export async function createZona(z: Partial<Zona>): Promise<Zona> {
  const res = await fetch(`${API_BASE}/zonas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(z),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return zonaFromRow(await res.json())
}

export async function updateZona(id: number, z: Partial<Zona>): Promise<Zona> {
  const res = await fetch(`${API_BASE}/zonas/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(z),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return zonaFromRow(await res.json())
}

export async function deleteZona(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/zonas/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// =============================================================
// Vinos
// =============================================================

export async function listVinos(): Promise<Vino[]> {
  const res = await fetch(`${API_BASE}/vinos`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  return data.map(vinoFromRow)
}

export async function getVino(id: number): Promise<Vino | null> {
  const res = await fetch(`${API_BASE}/vinos/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return vinoFromRow(await res.json())
}

export async function createVino(v: Partial<Vino>): Promise<Vino> {
  const res = await fetch(`${API_BASE}/vinos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(v),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return vinoFromRow(await res.json())
}

export async function updateVino(id: number, v: Partial<Vino>): Promise<Vino> {
  const res = await fetch(`${API_BASE}/vinos/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(v),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return vinoFromRow(await res.json())
}

export async function deleteVino(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/vinos/${id}`, { method: 'DELETE' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
}

// Stub para vinos en catálogo (público)
export async function listVinosCatalogo(): Promise<Vino[]> {
  return listVinos()
}

// =============================================================
// Ventas (básico)
// =============================================================

export async function listVentas(): Promise<Venta[]> {
  const res = await fetch(`${API_BASE}/ventas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

export async function getVenta(id: number): Promise<Venta | null> {
  const res = await fetch(`${API_BASE}/ventas/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

// =============================================================
// Viajes (básico)
// =============================================================

export async function listViajes(): Promise<Viaje[]> {
  const res = await fetch(`${API_BASE}/viajes`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

export async function getViaje(id: number): Promise<Viaje | null> {
  const res = await fetch(`${API_BASE}/viajes/${id}`)
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

// =============================================================
// Deudas (básico)
// =============================================================

export async function listDeudas(): Promise<DeudaAnotacion[]> {
  const res = await fetch(`${API_BASE}/deudas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}

// =============================================================
// Plantillas (básico)
// =============================================================

export async function listPlantillas(): Promise<PlantillaWhatsApp[]> {
  const res = await fetch(`${API_BASE}/plantillas`)
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return await res.json()
}
