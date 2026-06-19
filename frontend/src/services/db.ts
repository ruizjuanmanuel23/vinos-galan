/**
 * Capa de datos REMOTA con Supabase.
 * Reemplaza al storage local (localStorage). Todo se guarda en el servidor.
 *
 * Tabla → función:
 *   clientes_db          → CRUD de clientes
 *   vinos_db             → CRUD de productos de Bodega
 *   ventas_db            → CRUD de ventas
 *   deudas_db            → CRUD de deudas
 *   viajes_db            → CRUD de viajes + paradas embebidas
 *   plantillas_db        → CRUD de plantillas WhatsApp
 *
 * Las paradas y los detalles de ventas viven embebidos como JSONB para
 * mantener consistencia con la forma del frontend.
 */
import { supabase } from '../lib/supabase'
import type {
  Cliente, Vino, Venta, DeudaAnotacion, Viaje, Parada,
  ItemParada, PlantillaWhatsApp, DiaSemana, Zona, PrecioZona,
} from '../types'

// =============================================================
// HELPERS: mapeo snake_case (DB) <-> camelCase (frontend)
// =============================================================

function clienteFromRow(r: any): Cliente {
  // Días: leer del nuevo campo dias_reparto (JSONB array). Si no existe (DB vieja),
  // fallback al campo legacy dia_reparto (string singular) → array de 1.
  let dias: any[] = []
  if (Array.isArray(r.dias_reparto)) dias = r.dias_reparto
  else if (typeof r.dias_reparto === 'string') {
    try { const p = JSON.parse(r.dias_reparto); if (Array.isArray(p)) dias = p } catch { /* ignore */ }
  }
  if (dias.length === 0 && r.dia_reparto) dias = [r.dia_reparto]
  return {
    id: r.id,
    nombre: r.nombre,
    telefono: r.telefono ?? '',
    direccion: r.direccion ?? '',
    zona: r.zona ?? null,
    zonaId: r.zona_id ?? null,
    diasReparto: dias.filter((d): d is any => typeof d === 'string'),
    notas: r.notas ?? '',
    creadoEn: r.creado_en,
  }
}
function clienteToRow(c: Partial<Cliente>) {
  const dias = c.diasReparto ?? []
  return {
    nombre: c.nombre,
    telefono: c.telefono ?? '',
    direccion: c.direccion ?? '',
    zona: c.zona ?? null,
    zona_id: c.zonaId ?? null,
    // Campo nuevo: array completo de días.
    dias_reparto: dias,
    // Campo legacy: mantenemos el primer día para compatibilidad con otras tools.
    dia_reparto: dias[0] ?? null,
    notas: c.notas ?? '',
  }
}

function zonaFromRow(r: any): Zona {
  return {
    id: r.id,
    nombre: r.nombre,
    ajustePorcentaje: Number(r.ajuste_porcentaje ?? 0),
    orden: r.orden ?? 0,
    creadoEn: r.creado_en,
  }
}
function zonaToRow(z: Partial<Zona>) {
  return {
    nombre: z.nombre,
    ajuste_porcentaje: Number(z.ajustePorcentaje ?? 0),
    orden: z.orden ?? 0,
  }
}

function precioZonaFromRow(r: any): PrecioZona {
  return {
    id: r.id,
    vinoId: r.vino_id,
    zonaId: r.zona_id,
    precio: Number(r.precio ?? 0),
  }
}

function vinoFromRow(r: any): Vino {
  return {
    id: r.id,
    nombre: r.nombre,
    bodega: r.bodega ?? '',
    varietal: r.varietal ?? '',
    precioVenta: Number(r.precio_venta ?? 0),
    precioCosto: Number(r.precio_costo ?? 0),
    stock: r.stock ?? 0,
    activo: r.activo ?? true,
    fotoUrl: r.foto_url ?? null,
    descripcion: r.descripcion ?? null,
    mostrarEnCatalogo: r.mostrar_en_catalogo ?? true,
    creadoEn: r.creado_en,
  }
}
function vinoToRow(v: Partial<Vino>) {
  return {
    nombre: v.nombre,
    bodega: v.bodega ?? '',
    varietal: v.varietal ?? '',
    precio_venta: Number(v.precioVenta ?? 0),
    precio_costo: Number(v.precioCosto ?? 0),
    stock: Number(v.stock ?? 0),
    activo: v.activo ?? true,
    foto_url: v.fotoUrl ?? null,
    descripcion: v.descripcion ?? null,
    mostrar_en_catalogo: v.mostrarEnCatalogo ?? true,
  }
}

function ventaFromRow(r: any): Venta {
  return {
    id: r.id,
    cliente: r.cliente_snapshot,
    fecha: r.fecha,
    total: Number(r.total ?? 0),
    notas: r.notas ?? '',
    detalles: r.detalles ?? [],
  }
}

function viajeFromRow(r: any): Viaje {
  return {
    id: r.id,
    fecha: r.fecha,
    titulo: r.titulo ?? null,
    notas: r.notas ?? null,
    estado: r.estado,
    inicio: r.inicio,
    fin: r.fin,
    paradas: (r.paradas ?? []) as Parada[],
    cantidadTotalManual: r.cantidad_total_manual ?? null,
    cargado: r.cargado ?? false,
    fechaCarga: r.fecha_carga ?? null,
  }
}

function deudaFromRow(r: any): DeudaAnotacion {
  return {
    id: r.id,
    descripcion: r.descripcion ?? '',
    monto: Number(r.monto ?? 0),
    fecha: r.fecha,
    creadoEn: r.creado_en,
  }
}

function plantillaFromRow(r: any): PlantillaWhatsApp {
  return {
    id: r.id,
    nombre: r.nombre,
    texto: r.texto,
    esDefault: r.es_default ?? false,
    creadoEn: r.creado_en,
  }
}

// =============================================================
// CLIENTES
// =============================================================
export const clientesDB = {
  async listAll(): Promise<Cliente[]> {
    const { data } = await supabase.from('clientes').select('*').order('nombre')
    return (data ?? []).map(clienteFromRow)
  },
  async search(q: string): Promise<Cliente[]> {
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or(`nombre.ilike.%${q}%,telefono.ilike.%${q}%`)
      .order('nombre')
    return (data ?? []).map(clienteFromRow)
  },
  async byDia(dia: DiaSemana): Promise<Cliente[]> {
    // Compatibilidad: matchea por dias_reparto (JSONB array, nuevo) O por dia_reparto (legacy).
    // .cs = contains (para JSONB arrays). Si la columna nueva no existe en DB, el OR cae al campo viejo.
    const { data } = await supabase
      .from('clientes')
      .select('*')
      .or(`dia_reparto.eq.${dia},dias_reparto.cs.["${dia}"]`)
      .order('nombre')
    return (data ?? []).map(clienteFromRow)
  },
  async byId(id: number): Promise<Cliente | null> {
    const { data } = await supabase.from('clientes').select('*').eq('id', id).maybeSingle()
    return data ? clienteFromRow(data) : null
  },
  async byTelefono(tel: string): Promise<Cliente | null> {
    const { data } = await supabase.from('clientes').select('*').eq('telefono', tel).maybeSingle()
    return data ? clienteFromRow(data) : null
  },
  async create(c: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').insert(clienteToRow(c)).select().single()
    if (error) throw error
    return clienteFromRow(data)
  },
  async update(id: number, c: Partial<Cliente>): Promise<Cliente> {
    const { data, error } = await supabase.from('clientes').update(clienteToRow(c)).eq('id', id).select().single()
    if (error) throw error
    return clienteFromRow(data)
  },
  async delete(id: number): Promise<void> {
    await supabase.from('clientes').delete().eq('id', id)
  },
}

// =============================================================
// VINOS / BODEGA
// =============================================================
export const vinosDB = {
  async listActivos(): Promise<Vino[]> {
    const { data } = await supabase.from('vinos').select('*').eq('activo', true).order('nombre')
    return (data ?? []).map(vinoFromRow)
  },
  async listAll(): Promise<Vino[]> {
    const { data } = await supabase.from('vinos').select('*').order('nombre')
    return (data ?? []).map(vinoFromRow)
  },
  async byId(id: number): Promise<Vino | null> {
    const { data } = await supabase.from('vinos').select('*').eq('id', id).maybeSingle()
    return data ? vinoFromRow(data) : null
  },
  async create(v: Partial<Vino>): Promise<Vino> {
    const { data, error } = await supabase.from('vinos').insert(vinoToRow(v)).select().single()
    if (error) throw error
    return vinoFromRow(data)
  },
  async update(id: number, v: Partial<Vino>): Promise<Vino> {
    const { data, error } = await supabase.from('vinos').update(vinoToRow(v)).eq('id', id).select().single()
    if (error) throw error
    return vinoFromRow(data)
  },
  async desactivar(id: number): Promise<void> {
    await supabase.from('vinos').update({ activo: false }).eq('id', id)
  },
  async descontarStock(id: number, cant: number): Promise<boolean> {
    const v = await vinosDB.byId(id)
    if (!v || v.stock < cant) return false
    await supabase.from('vinos').update({ stock: v.stock - cant }).eq('id', id)
    return true
  },
}

// =============================================================
// VENTAS
// =============================================================
export const ventasDB = {
  async byCliente(clienteId: number): Promise<Venta[]> {
    const { data } = await supabase
      .from('ventas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
    return (data ?? []).map(ventaFromRow)
  },
  async create(input: { clienteId: number; notas: string; detalles: { vinoId: number; cantidad: number }[] }): Promise<Venta> {
    const cliente = await clientesDB.byId(input.clienteId)
    if (!cliente) throw new Error('Cliente no encontrado')
    let total = 0
    const detalles: any[] = []
    for (const it of input.detalles) {
      const vino = await vinosDB.byId(it.vinoId)
      if (!vino) throw new Error(`Vino no encontrado: ${it.vinoId}`)
      if (vino.stock < it.cantidad) throw new Error(`Stock insuficiente para: ${vino.nombre}`)
      await vinosDB.descontarStock(vino.id, it.cantidad)
      const subtotal = Number(vino.precioVenta) * it.cantidad
      total += subtotal
      detalles.push({
        id: Date.now() + Math.floor(Math.random() * 1000),
        vino,
        cantidad: it.cantidad,
        precioUnitario: Number(vino.precioVenta),
      })
    }
    const { data, error } = await supabase.from('ventas').insert({
      cliente_id: cliente.id,
      cliente_snapshot: cliente,
      total,
      notas: input.notas ?? '',
      detalles,
    }).select().single()
    if (error) throw error
    return ventaFromRow(data)
  },
  async all(): Promise<Venta[]> {
    const { data } = await supabase.from('ventas').select('*').order('fecha', { ascending: false })
    return (data ?? []).map(ventaFromRow)
  },
}

// =============================================================
// DEUDAS
// =============================================================
export const deudasDB = {
  async byCliente(clienteId: number): Promise<DeudaAnotacion[]> {
    const { data } = await supabase
      .from('deudas')
      .select('*')
      .eq('cliente_id', clienteId)
      .order('fecha', { ascending: false })
    return (data ?? []).map(deudaFromRow)
  },
  async create(d: { clienteId: number; descripcion: string; monto: number; fecha?: string }): Promise<DeudaAnotacion> {
    const { data, error } = await supabase.from('deudas').insert({
      cliente_id: d.clienteId,
      descripcion: d.descripcion ?? '',
      monto: Number(d.monto ?? 0),
      fecha: d.fecha ?? new Date().toISOString().slice(0, 10),
    }).select().single()
    if (error) throw error
    return deudaFromRow(data)
  },
  async update(id: number, d: Partial<DeudaAnotacion>): Promise<DeudaAnotacion | null> {
    const { data, error } = await supabase.from('deudas').update({
      descripcion: d.descripcion,
      monto: d.monto != null ? Number(d.monto) : undefined,
      fecha: d.fecha,
    }).eq('id', id).select().single()
    if (error) return null
    return deudaFromRow(data)
  },
  async delete(id: number): Promise<void> {
    await supabase.from('deudas').delete().eq('id', id)
  },
}

// =============================================================
// VIAJES
// =============================================================
function viajeToRow(v: Partial<Viaje>) {
  return {
    fecha: v.fecha,
    titulo: v.titulo ?? null,
    notas: v.notas ?? null,
    estado: v.estado,
    inicio: v.inicio,
    fin: v.fin,
    paradas: v.paradas ?? [],
    cantidad_total_manual: v.cantidadTotalManual ?? null,
    cargado: v.cargado ?? false,
    fecha_carga: v.fechaCarga ?? null,
  }
}

let _seqParada = 1
function nextParadaId() {
  return Date.now() * 100 + ((_seqParada++) % 100)
}

export const viajesDB = {
  async listAll(): Promise<Viaje[]> {
    const { data } = await supabase.from('viajes').select('*').order('fecha', { ascending: false }).order('id', { ascending: false })
    return (data ?? []).map(viajeFromRow)
  },
  async byId(id: number): Promise<Viaje | null> {
    const { data } = await supabase.from('viajes').select('*').eq('id', id).maybeSingle()
    return data ? viajeFromRow(data) : null
  },
  async create(input: {
    fecha: string; titulo?: string; notas?: string;
    clienteIds?: number[];
    cantidades?: number[];
    paradas?: { clienteId: number; items?: { vinoId: number; cantidad: number }[] }[];
    extras?: { vinoId: number; cantidad: number }[];
    cantidadTotalManual?: number | null;
  }): Promise<Viaje> {
    const paradas: Parada[] = []
    if (input.paradas && input.paradas.length > 0) {
      for (let i = 0; i < input.paradas.length; i++) {
        const p = input.paradas[i]
        const cliente = await clientesDB.byId(p.clienteId)
        if (!cliente) continue
        const items: ItemParada[] = []
        for (const it of (p.items ?? [])) {
          const v = await vinosDB.byId(it.vinoId)
          items.push({
            id: nextParadaId(),
            vinoId: it.vinoId,
            vinoNombre: v?.nombre ?? '—',
            cantidad: Number(it.cantidad) || 0,
          })
        }
        const filtered = items.filter(it => it.cantidad > 0)
        paradas.push({
          id: nextParadaId(),
          cliente, orden: i + 1,
          estado: 'PENDIENTE', notas: null, horaVisita: null,
          items: filtered,
          cantidadProductos: filtered.reduce((a, b) => a + b.cantidad, 0),
        })
      }
    } else {
      const ids = input.clienteIds ?? []
      const cants = input.cantidades ?? []
      for (let i = 0; i < ids.length; i++) {
        const cliente = await clientesDB.byId(ids[i])
        if (!cliente) continue
        paradas.push({
          id: nextParadaId(),
          cliente, orden: i + 1,
          estado: 'PENDIENTE', notas: null, horaVisita: null,
          items: [],
          cantidadProductos: Number(cants[i] ?? 0),
        })
      }
    }

    // Productos "extra" sin cliente — parada virtual al final con cliente synthetic id=-1
    if (input.extras && input.extras.length > 0) {
      const items: ItemParada[] = []
      for (const it of input.extras) {
        if ((it.cantidad || 0) <= 0) continue
        const v = await vinosDB.byId(it.vinoId)
        items.push({
          id: nextParadaId(),
          vinoId: it.vinoId,
          vinoNombre: v?.nombre ?? '—',
          cantidad: Number(it.cantidad),
        })
      }
      if (items.length > 0) {
        const clienteExtras: Cliente = {
          id: -1, nombre: 'Productos extra', telefono: '', direccion: '',
          zona: null, zonaId: null, diasReparto: [], notas: '', creadoEn: new Date().toISOString(),
        }
        paradas.push({
          id: nextParadaId(),
          cliente: clienteExtras, orden: paradas.length + 1,
          estado: 'VISITADA', notas: null, horaVisita: null,
          items,
          cantidadProductos: items.reduce((a, b) => a + b.cantidad, 0),
        })
      }
    }

    const { data, error } = await supabase.from('viajes').insert({
      fecha: input.fecha ?? new Date().toISOString().slice(0, 10),
      titulo: input.titulo ?? null,
      notas: input.notas ?? null,
      estado: 'EN_CURSO',
      inicio: new Date().toISOString(),
      paradas,
      cantidad_total_manual: input.cantidadTotalManual ?? null,
      cargado: false,
    }).select().single()
    if (error) throw error
    return viajeFromRow(data)
  },
  async update(id: number, v: Partial<Viaje>): Promise<Viaje | null> {
    const row = viajeToRow(v as any)
    // Solo enviar campos definidos
    const filtered: any = {}
    for (const [k, val] of Object.entries(row)) {
      if (val !== undefined) filtered[k] = val
    }
    const { data, error } = await supabase.from('viajes').update(filtered).eq('id', id).select().single()
    if (error) return null
    return viajeFromRow(data)
  },
  async finalizar(id: number): Promise<Viaje | null> {
    const { data } = await supabase.from('viajes').update({
      estado: 'FINALIZADO',
      fin: new Date().toISOString(),
    }).eq('id', id).select().single()
    return data ? viajeFromRow(data) : null
  },
  async delete(id: number): Promise<void> {
    await supabase.from('viajes').delete().eq('id', id)
  },
  // PARADAS: viven embebidas, así que modificamos el array y guardamos el viaje completo
  async agregarParada(viajeId: number, clienteId: number, cantidadProductos = 0): Promise<Parada | null> {
    const v = await viajesDB.byId(viajeId)
    if (!v) return null
    const cliente = await clientesDB.byId(clienteId)
    if (!cliente) return null
    const orden = v.paradas.reduce((m, p) => Math.max(m, p.orden), 0) + 1
    const nueva: Parada = {
      id: nextParadaId(), cliente, orden, estado: 'PENDIENTE',
      notas: null, horaVisita: null, items: [],
      cantidadProductos: Number(cantidadProductos) || 0,
    }
    const paradas = [...v.paradas, nueva]
    await supabase.from('viajes').update({ paradas }).eq('id', viajeId)
    return nueva
  },
  async updateParada(paradaId: number, data: { estado?: string; notas?: string; orden?: number; cantidadProductos?: number }): Promise<Parada | null> {
    // Buscar el viaje que contiene esta parada
    const all = await viajesDB.listAll()
    for (const v of all) {
      const idx = v.paradas.findIndex(p => p.id === paradaId)
      if (idx === -1) continue
      const p = { ...v.paradas[idx] }
      if (data.estado) {
        p.estado = data.estado as Parada['estado']
        if (p.estado === 'VISITADA' && !p.horaVisita) p.horaVisita = new Date().toISOString()
        if (p.estado === 'PENDIENTE') p.horaVisita = null
      }
      if (data.notas !== undefined) p.notas = data.notas
      if (data.orden !== undefined) p.orden = data.orden
      if (data.cantidadProductos !== undefined) p.cantidadProductos = Number(data.cantidadProductos) || 0
      const paradas = [...v.paradas]
      paradas[idx] = p
      await supabase.from('viajes').update({ paradas }).eq('id', v.id)
      return p
    }
    return null
  },
  async setItemsParada(paradaId: number, items: { vinoId: number; cantidad: number }[]): Promise<Parada | null> {
    const all = await viajesDB.listAll()
    for (const v of all) {
      const idx = v.paradas.findIndex(p => p.id === paradaId)
      if (idx === -1) continue
      const p = { ...v.paradas[idx] }
      const nuevos: ItemParada[] = []
      for (const it of items) {
        if ((it.cantidad || 0) <= 0) continue
        const viejo = (p.items ?? []).find(x => x.vinoId === it.vinoId)
        const vino = await vinosDB.byId(it.vinoId)
        nuevos.push({
          id: viejo?.id ?? nextParadaId(),
          vinoId: it.vinoId,
          vinoNombre: vino?.nombre ?? viejo?.vinoNombre ?? '—',
          cantidad: Number(it.cantidad),
        })
      }
      p.items = nuevos
      p.cantidadProductos = nuevos.reduce((a, b) => a + b.cantidad, 0)
      const paradas = [...v.paradas]
      paradas[idx] = p
      await supabase.from('viajes').update({ paradas }).eq('id', v.id)
      return p
    }
    return null
  },
  async eliminarParada(paradaId: number): Promise<void> {
    const all = await viajesDB.listAll()
    for (const v of all) {
      const idx = v.paradas.findIndex(p => p.id === paradaId)
      if (idx === -1) continue
      const paradas = v.paradas.filter(p => p.id !== paradaId)
      await supabase.from('viajes').update({ paradas }).eq('id', v.id)
      return
    }
  },
  async cargarCamion(viajeId: number): Promise<{ ok: true; viaje: Viaje } | { ok: false; faltantes: string[] }> {
    const v = await viajesDB.byId(viajeId)
    if (!v) return { ok: false, faltantes: ['Viaje no encontrado'] }
    if (v.cargado) return { ok: true, viaje: v }
    // Agregar items
    const map = new Map<number, { nombre: string; cant: number }>()
    for (const p of v.paradas) {
      for (const it of (p.items ?? [])) {
        const e = map.get(it.vinoId)
        if (e) e.cant += it.cantidad
        else map.set(it.vinoId, { nombre: it.vinoNombre, cant: it.cantidad })
      }
    }
    const faltantes: string[] = []
    for (const [vinoId, info] of map) {
      const vino = await vinosDB.byId(vinoId)
      if (!vino) { faltantes.push(`${info.nombre} (eliminado)`); continue }
      if (vino.stock < info.cant) faltantes.push(`${vino.nombre}: hay ${vino.stock}, faltan ${info.cant - vino.stock}`)
    }
    if (faltantes.length > 0) return { ok: false, faltantes }
    for (const [vinoId, info] of map) await vinosDB.descontarStock(vinoId, info.cant)
    const { data } = await supabase.from('viajes').update({
      cargado: true, fecha_carga: new Date().toISOString(),
    }).eq('id', viajeId).select().single()
    return { ok: true, viaje: viajeFromRow(data) }
  },
  async descargarCamion(viajeId: number): Promise<Viaje | null> {
    const v = await viajesDB.byId(viajeId)
    if (!v || !v.cargado || v.estado === 'FINALIZADO') return v
    const map = new Map<number, number>()
    for (const p of v.paradas) for (const it of (p.items ?? [])) map.set(it.vinoId, (map.get(it.vinoId) ?? 0) + it.cantidad)
    for (const [vinoId, cant] of map) {
      const vino = await vinosDB.byId(vinoId)
      if (!vino) continue
      await supabase.from('vinos').update({ stock: vino.stock + cant }).eq('id', vinoId)
    }
    const { data } = await supabase.from('viajes').update({ cargado: false, fecha_carga: null }).eq('id', viajeId).select().single()
    return data ? viajeFromRow(data) : null
  },
}

// =============================================================
// PLANTILLAS
// =============================================================
export const plantillasDB = {
  async listAll(): Promise<PlantillaWhatsApp[]> {
    const { data } = await supabase.from('plantillas_whatsapp').select('*').order('id')
    return (data ?? []).map(plantillaFromRow)
  },
  async create(p: Partial<PlantillaWhatsApp>): Promise<PlantillaWhatsApp> {
    if (p.esDefault) await supabase.from('plantillas_whatsapp').update({ es_default: false }).neq('id', 0)
    const { data, error } = await supabase.from('plantillas_whatsapp').insert({
      nombre: p.nombre ?? 'Sin nombre',
      texto: p.texto ?? '',
      es_default: !!p.esDefault,
    }).select().single()
    if (error) throw error
    return plantillaFromRow(data)
  },
  async update(id: number, p: Partial<PlantillaWhatsApp>): Promise<PlantillaWhatsApp | null> {
    if (p.esDefault) await supabase.from('plantillas_whatsapp').update({ es_default: false }).neq('id', id)
    const { data, error } = await supabase.from('plantillas_whatsapp').update({
      nombre: p.nombre,
      texto: p.texto,
      es_default: p.esDefault,
    }).eq('id', id).select().single()
    if (error) return null
    return plantillaFromRow(data)
  },
  async delete(id: number): Promise<void> {
    await supabase.from('plantillas_whatsapp').delete().eq('id', id)
  },
}

// =============================================================
// ZONAS — catálogo de grupos de localidades (Berisso, Magdalena, etc).
// =============================================================
export const zonasDB = {
  async listAll(): Promise<Zona[]> {
    const { data, error } = await supabase
      .from('zonas')
      .select('*')
      .order('orden')
      .order('nombre')
    if (error) return []
    return (data ?? []).map(zonaFromRow)
  },
  async create(z: Partial<Zona>): Promise<Zona> {
    const { data, error } = await supabase.from('zonas').insert(zonaToRow(z)).select().single()
    if (error) throw error
    return zonaFromRow(data)
  },
  async update(id: number, z: Partial<Zona>): Promise<Zona | null> {
    const { data, error } = await supabase.from('zonas').update(zonaToRow(z)).eq('id', id).select().single()
    if (error) return null
    return zonaFromRow(data)
  },
  async delete(id: number): Promise<void> {
    await supabase.from('zonas').delete().eq('id', id)
  },
}

// =============================================================
// PRECIOS POR ZONA — overrides puntuales (vino × zona → precio fijo).
// Si no hay override, el precio se calcula con el ajuste % de la zona.
// =============================================================
export const preciosZonaDB = {
  async listAll(): Promise<PrecioZona[]> {
    const { data, error } = await supabase.from('precios_zona').select('*')
    if (error) return []
    return (data ?? []).map(precioZonaFromRow)
  },
  async byVino(vinoId: number): Promise<PrecioZona[]> {
    const { data, error } = await supabase.from('precios_zona').select('*').eq('vino_id', vinoId)
    if (error) return []
    return (data ?? []).map(precioZonaFromRow)
  },
  /** Crea o reemplaza un override. Si ya existe (vino+zona), lo actualiza. */
  async upsert(vinoId: number, zonaId: number, precio: number): Promise<PrecioZona | null> {
    const { data, error } = await supabase
      .from('precios_zona')
      .upsert({ vino_id: vinoId, zona_id: zonaId, precio }, { onConflict: 'vino_id,zona_id' })
      .select()
      .single()
    if (error) return null
    return precioZonaFromRow(data)
  },
  /** Quita el override → vuelve a usarse el porcentaje de la zona. */
  async remove(vinoId: number, zonaId: number): Promise<void> {
    await supabase.from('precios_zona').delete().eq('vino_id', vinoId).eq('zona_id', zonaId)
  },
}
