/**
 * Capa de datos local con localStorage.
 * Reemplaza al backend Spring Boot — todos los datos viven en el navegador del usuario.
 *
 * Cada "tabla" se guarda como un array JSON bajo una clave única.
 * Los IDs son auto-incrementales (timestamp + counter para evitar colisiones).
 */

import type {
  Cliente, Vino, Venta, DetalleVenta, DeudaAnotacion,
  Viaje, Parada, ItemParada, DiaSemana, PlantillaWhatsApp,
} from '../types'
import { cargaDeCamion } from '../types'

// ============================================================
// CLAVES DE STORAGE
// ============================================================
const K = {
  clientes: 'vg.clientes',
  vinos:    'vg.vinos',
  ventas:   'vg.ventas',
  deudas:   'vg.deudas',
  viajes:   'vg.viajes',
  plantillas: 'vg.plantillas', // Plantillas WhatsApp
  counter:  'vg.counter',  // Contador para IDs únicos
} as const

// ============================================================
// HELPERS
// ============================================================
function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}
function save<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data))
}
function nextId(): number {
  const c = Number(localStorage.getItem(K.counter) || '0') + 1
  localStorage.setItem(K.counter, String(c))
  return c
}
function nowISO(): string { return new Date().toISOString() }
function todayISO(): string { return new Date().toISOString().split('T')[0] }

// ============================================================
// CLIENTES
// ============================================================
export const clientesAPI = {
  listAll(): Cliente[] {
    return load<Cliente>(K.clientes)
  },
  search(q: string): Cliente[] {
    const ql = q.toLowerCase()
    return load<Cliente>(K.clientes).filter(c =>
      c.nombre.toLowerCase().includes(ql) || (c.telefono ?? '').includes(q))
  },
  byDia(dia: DiaSemana): Cliente[] {
    return load<Cliente>(K.clientes)
      .filter(c => c.diaReparto === dia)
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  },
  byId(id: number): Cliente | null {
    return load<Cliente>(K.clientes).find(c => c.id === id) ?? null
  },
  byTelefono(tel: string): Cliente | null {
    return load<Cliente>(K.clientes).find(c => c.telefono === tel) ?? null
  },
  create(data: Partial<Cliente>): Cliente {
    const list = load<Cliente>(K.clientes)
    const nuevo: Cliente = {
      id: nextId(),
      nombre: data.nombre ?? '',
      telefono: data.telefono ?? '',
      direccion: data.direccion ?? '',
      zona: data.zona ?? null,
      diaReparto: (data.diaReparto ?? null) as Cliente['diaReparto'],
      notas: data.notas ?? '',
      creadoEn: nowISO(),
    }
    list.push(nuevo)
    save(K.clientes, list)
    return nuevo
  },
  update(id: number, data: Partial<Cliente>): Cliente | null {
    const list = load<Cliente>(K.clientes)
    const idx = list.findIndex(c => c.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...data, id }
    save(K.clientes, list)
    return list[idx]
  },
  delete(id: number): void {
    save(K.clientes, load<Cliente>(K.clientes).filter(c => c.id !== id))
    // limpieza cascada
    save(K.deudas, load<DeudaAnotacion>(K.deudas).filter(d => (d as any).clienteId !== id))
  },
}

// ============================================================
// VINOS
// ============================================================
export const vinosAPI = {
  listActivos(): Vino[] {
    return load<Vino>(K.vinos).filter(v => v.activo).sort((a, b) => a.nombre.localeCompare(b.nombre))
  },
  listAll(): Vino[] {
    return load<Vino>(K.vinos).sort((a, b) => a.nombre.localeCompare(b.nombre))
  },
  byId(id: number): Vino | null {
    return load<Vino>(K.vinos).find(v => v.id === id) ?? null
  },
  create(data: Partial<Vino>): Vino {
    const list = load<Vino>(K.vinos)
    const nuevo: Vino = {
      id: nextId(),
      nombre: data.nombre ?? '',
      bodega: data.bodega ?? '',
      varietal: data.varietal ?? '',
      precioVenta: Number(data.precioVenta ?? 0),
      precioCosto: Number(data.precioCosto ?? 0),
      stock: Number(data.stock ?? 0),
      activo: data.activo ?? true,
      fotoUrl: data.fotoUrl ?? null,
      descripcion: data.descripcion ?? null,
      mostrarEnCatalogo: data.mostrarEnCatalogo ?? true,
      creadoEn: nowISO(),
    }
    list.push(nuevo)
    save(K.vinos, list)
    return nuevo
  },
  update(id: number, data: Partial<Vino>): Vino | null {
    const list = load<Vino>(K.vinos)
    const idx = list.findIndex(v => v.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...data, id }
    save(K.vinos, list)
    return list[idx]
  },
  desactivar(id: number): void {
    vinosAPI.update(id, { activo: false })
  },
  /** Descuenta cantidad del stock. Usado al crear ventas. */
  descontarStock(id: number, cantidad: number): boolean {
    const v = vinosAPI.byId(id)
    if (!v || v.stock < cantidad) return false
    vinosAPI.update(id, { stock: v.stock - cantidad })
    return true
  },
}

// ============================================================
// VENTAS
// ============================================================
export const ventasAPI = {
  byCliente(clienteId: number): Venta[] {
    return load<Venta>(K.ventas)
      .filter(v => v.cliente?.id === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  },
  create(data: { clienteId: number; notas: string; detalles: { vinoId: number; cantidad: number }[] }): Venta {
    const cliente = clientesAPI.byId(data.clienteId)
    if (!cliente) throw new Error('Cliente no encontrado')

    const detalles: DetalleVenta[] = []
    let total = 0

    for (const item of data.detalles) {
      const vino = vinosAPI.byId(item.vinoId)
      if (!vino) throw new Error(`Vino no encontrado: ${item.vinoId}`)
      if (vino.stock < item.cantidad) throw new Error(`Stock insuficiente para: ${vino.nombre}`)
      vinosAPI.descontarStock(vino.id, item.cantidad)

      const subtotal = vino.precioVenta * item.cantidad
      total += subtotal
      detalles.push({
        id: nextId(),
        vino: vinosAPI.byId(vino.id)!, // versión actualizada con stock descontado
        cantidad: item.cantidad,
        precioUnitario: vino.precioVenta,
      })
    }

    const venta: Venta = {
      id: nextId(),
      cliente,
      fecha: nowISO(),
      total,
      notas: data.notas ?? '',
      detalles,
    }
    const list = load<Venta>(K.ventas)
    list.push(venta)
    save(K.ventas, list)
    return venta
  },
}

// ============================================================
// DEUDAS
// ============================================================
type DeudaStored = DeudaAnotacion & { clienteId: number }

export const deudasAPI = {
  byCliente(clienteId: number): DeudaAnotacion[] {
    return load<DeudaStored>(K.deudas)
      .filter(d => d.clienteId === clienteId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
      .map(({ clienteId: _, ...rest }) => rest as DeudaAnotacion)
  },
  create(data: { clienteId: number; descripcion: string; monto: number; fecha?: string }): DeudaAnotacion {
    const list = load<DeudaStored>(K.deudas)
    const nueva: DeudaStored = {
      id: nextId(),
      clienteId: data.clienteId,
      descripcion: data.descripcion ?? '',
      monto: Number(data.monto ?? 0),
      fecha: data.fecha ?? todayISO(),
      creadoEn: nowISO(),
    }
    list.push(nueva)
    save(K.deudas, list)
    const { clienteId: _, ...rest } = nueva
    return rest as DeudaAnotacion
  },
  update(id: number, data: Partial<DeudaAnotacion> & { clienteId?: number }): DeudaAnotacion | null {
    const list = load<DeudaStored>(K.deudas)
    const idx = list.findIndex(d => d.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...data, id } as DeudaStored
    save(K.deudas, list)
    const { clienteId: _, ...rest } = list[idx]
    return rest as DeudaAnotacion
  },
  delete(id: number): void {
    save(K.deudas, load<DeudaStored>(K.deudas).filter(d => d.id !== id))
  },
}

// ============================================================
// VIAJES + PARADAS
// ============================================================
export const viajesAPI = {
  listAll(): Viaje[] {
    return load<Viaje>(K.viajes)
      .sort((a, b) => (b.fecha + String(b.id)).localeCompare(a.fecha + String(a.id)))
  },
  byId(id: number): Viaje | null {
    return load<Viaje>(K.viajes).find(v => v.id === id) ?? null
  },
  create(data: {
    fecha: string;
    titulo?: string;
    notas?: string;
    /** Forma simple: solo IDs de clientes. */
    clienteIds?: number[];
    /** Cantidades por cliente (forma vieja, sin desglose por producto). */
    cantidades?: number[];
    /** Forma nueva: detalle de items por cliente. */
    paradas?: { clienteId: number; items?: { vinoId: number; cantidad: number }[] }[];
    /** Total manual sin desglose. */
    cantidadTotalManual?: number | null;
  }): Viaje {
    const list = load<Viaje>(K.viajes)
    const paradas: Parada[] = []

    // Forma nueva: usa paradas con items
    if (data.paradas && data.paradas.length > 0) {
      data.paradas.forEach((p, i) => {
        const cliente = clientesAPI.byId(p.clienteId)
        if (!cliente) return
        const items: ItemParada[] = (p.items ?? []).map(it => {
          const v = vinosAPI.byId(it.vinoId)
          return {
            id: nextId(),
            vinoId: it.vinoId,
            vinoNombre: v?.nombre ?? '—',
            cantidad: Number(it.cantidad) || 0,
          }
        }).filter(it => it.cantidad > 0)
        const cantTotal = items.reduce((acc, it) => acc + it.cantidad, 0)
        paradas.push({
          id: nextId(), cliente, orden: i + 1,
          estado: 'PENDIENTE', notas: null, horaVisita: null,
          items, cantidadProductos: cantTotal,
        })
      })
    } else {
      // Forma vieja: ids + cantidades genéricas
      const ids = data.clienteIds ?? []
      const cants = data.cantidades ?? []
      ids.forEach((cId, i) => {
        const cliente = clientesAPI.byId(cId)
        if (!cliente) return
        paradas.push({
          id: nextId(), cliente, orden: i + 1,
          estado: 'PENDIENTE', notas: null, horaVisita: null,
          items: [], cantidadProductos: Number(cants[i] ?? 0),
        })
      })
    }

    const nuevo: Viaje = {
      id: nextId(),
      fecha: data.fecha ?? todayISO(),
      titulo: data.titulo ?? null,
      notas: data.notas ?? null,
      estado: 'EN_CURSO',
      inicio: nowISO(),
      fin: null,
      paradas,
      cantidadTotalManual: data.cantidadTotalManual ?? null,
      cargado: false,
      fechaCarga: null,
    }
    list.push(nuevo)
    save(K.viajes, list)
    return nuevo
  },

  /** Setea los items de una parada (reemplaza la lista entera). */
  setItemsParada(paradaId: number, items: { vinoId: number; cantidad: number }[]): Parada | null {
    const list = load<Viaje>(K.viajes)
    for (const v of list) {
      const idx = v.paradas.findIndex(p => p.id === paradaId)
      if (idx === -1) continue
      const p = v.paradas[idx]
      const nuevos: ItemParada[] = items.filter(it => (it.cantidad || 0) > 0).map(it => {
        const vino = vinosAPI.byId(it.vinoId)
        // Reutilizar IDs viejos si existen para no romper claves React
        const viejo = (p.items ?? []).find(x => x.vinoId === it.vinoId)
        return {
          id: viejo?.id ?? nextId(),
          vinoId: it.vinoId,
          vinoNombre: vino?.nombre ?? viejo?.vinoNombre ?? '—',
          cantidad: Number(it.cantidad),
        }
      })
      p.items = nuevos
      p.cantidadProductos = nuevos.reduce((acc, it) => acc + it.cantidad, 0)
      save(K.viajes, list)
      return p
    }
    return null
  },

  /**
   * Carga el camión: descuenta de stock los productos del viaje.
   * Si el stock no alcanza, no descuenta nada y devuelve error.
   */
  cargarCamion(viajeId: number): { ok: true; viaje: Viaje } | { ok: false; faltantes: string[] } {
    const v = viajesAPI.byId(viajeId)
    if (!v) return { ok: false, faltantes: ['Viaje no encontrado'] }
    if (v.cargado) return { ok: true, viaje: v }
    const carga = cargaDeCamion(v)
    const faltantes: string[] = []
    for (const c of carga) {
      const vino = vinosAPI.byId(c.vinoId)
      if (!vino) { faltantes.push(`${c.vinoNombre} (eliminado de bodega)`); continue }
      if (vino.stock < c.cantidad) faltantes.push(`${vino.nombre}: hay ${vino.stock}, faltan ${c.cantidad - vino.stock}`)
    }
    if (faltantes.length > 0) return { ok: false, faltantes }
    // Todo OK: descuento
    for (const c of carga) vinosAPI.descontarStock(c.vinoId, c.cantidad)
    const viaje = viajesAPI._update(viajeId, vv => ({ ...vv, cargado: true, fechaCarga: nowISO() }))!
    return { ok: true, viaje }
  },

  /** Descarga el camión: devuelve el stock. Solo si el viaje no está finalizado. */
  descargarCamion(viajeId: number): Viaje | null {
    const v = viajesAPI.byId(viajeId)
    if (!v || !v.cargado) return v
    if (v.estado === 'FINALIZADO') return v
    const carga = cargaDeCamion(v)
    for (const c of carga) {
      const vino = vinosAPI.byId(c.vinoId)
      if (!vino) continue
      vinosAPI.update(vino.id, { stock: vino.stock + c.cantidad })
    }
    return viajesAPI._update(viajeId, vv => ({ ...vv, cargado: false, fechaCarga: null }))
  },
  update(id: number, data: Partial<Pick<Viaje, 'titulo' | 'notas' | 'fecha' | 'cantidadTotalManual'>>): Viaje | null {
    const list = load<Viaje>(K.viajes)
    const idx = list.findIndex(v => v.id === id)
    if (idx === -1) return null
    list[idx] = { ...list[idx], ...data, id }
    save(K.viajes, list)
    return list[idx]
  },
  finalizar(id: number): Viaje | null {
    return viajesAPI._update(id, v => ({ ...v, estado: 'FINALIZADO', fin: nowISO() }))
  },
  delete(id: number): void {
    save(K.viajes, load<Viaje>(K.viajes).filter(v => v.id !== id))
  },
  // PARADAS
  agregarParada(viajeId: number, clienteId: number, cantidadProductos = 0): Parada | null {
    const cliente = clientesAPI.byId(clienteId)
    if (!cliente) return null
    return viajesAPI._update(viajeId, v => {
      const orden = v.paradas.reduce((max, p) => Math.max(max, p.orden), 0) + 1
      const nueva: Parada = {
        id: nextId(), cliente, orden, estado: 'PENDIENTE',
        notas: null, horaVisita: null,
        items: [],
        cantidadProductos: Number(cantidadProductos) || 0,
      }
      return { ...v, paradas: [...v.paradas, nueva] }
    })?.paradas.slice(-1)[0] ?? null
  },
  updateParada(paradaId: number, data: { estado?: string; notas?: string; orden?: number; cantidadProductos?: number }): Parada | null {
    const list = load<Viaje>(K.viajes)
    for (const v of list) {
      const idx = v.paradas.findIndex(p => p.id === paradaId)
      if (idx === -1) continue
      const p = v.paradas[idx]
      if (data.estado) {
        const e = data.estado as Parada['estado']
        p.estado = e
        if (e === 'VISITADA' && !p.horaVisita) p.horaVisita = nowISO()
        if (e === 'PENDIENTE') p.horaVisita = null
      }
      if (data.notas !== undefined) p.notas = data.notas
      if (data.orden !== undefined) p.orden = data.orden
      if (data.cantidadProductos !== undefined) p.cantidadProductos = Number(data.cantidadProductos) || 0
      save(K.viajes, list)
      return p
    }
    return null
  },
  eliminarParada(paradaId: number): void {
    const list = load<Viaje>(K.viajes)
    for (const v of list) {
      const idx = v.paradas.findIndex(p => p.id === paradaId)
      if (idx !== -1) {
        v.paradas.splice(idx, 1)
        save(K.viajes, list)
        return
      }
    }
  },
  _update(id: number, fn: (v: Viaje) => Viaje): Viaje | null {
    const list = load<Viaje>(K.viajes)
    const idx = list.findIndex(v => v.id === id)
    if (idx === -1) return null
    list[idx] = fn(list[idx])
    save(K.viajes, list)
    return list[idx]
  },
}

// ============================================================
// RESUMEN / ESTADÍSTICAS
// ============================================================
export interface ResumenDia {
  fecha: string
  ventas: number             // cantidad de ventas
  recaudado: number          // $ vendido
  paradas: number            // paradas hechas (visitadas)
  productosEntregados: number
  viajesEnCurso: number
}

export interface RankingCliente {
  cliente: Cliente
  totalGastado: number
  cantidadCompras: number
}

export interface RankingProducto {
  vino: Vino
  cantidadVendida: number
  totalRecaudado: number
}

export const resumenAPI = {
  /** Resumen del día (ventas + paradas + productos entregados). */
  delDia(fechaISO?: string): ResumenDia {
    const fecha = fechaISO ?? new Date().toISOString().slice(0, 10)
    const ventas = load<Venta>(K.ventas)
    const viajes = load<Viaje>(K.viajes)

    // Ventas: filtrar por fecha (creadoEn / fecha empieza con yyyy-mm-dd)
    const ventasHoy = ventas.filter(v => (v.fecha ?? '').startsWith(fecha))
    const recaudado = ventasHoy.reduce((acc, v) => acc + Number(v.total || 0), 0)

    // Paradas hechas en cualquier viaje de hoy
    let paradas = 0
    let productosEntregados = 0
    let viajesEnCurso = 0
    for (const v of viajes) {
      if (v.fecha !== fecha) continue
      if (v.estado === 'EN_CURSO') viajesEnCurso++
      for (const p of v.paradas) {
        if (p.estado === 'VISITADA' && (p.horaVisita ?? '').startsWith(fecha)) {
          paradas++
          productosEntregados += p.cantidadProductos || 0
        }
      }
    }

    return { fecha, ventas: ventasHoy.length, recaudado, paradas, productosEntregados, viajesEnCurso }
  },

  /** Top N clientes por total gastado en los últimos N días. */
  topClientes(dias = 30, limite = 5): RankingCliente[] {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    const desdeISO = desde.toISOString().slice(0, 10)
    const ventas = load<Venta>(K.ventas).filter(v => (v.fecha ?? '') >= desdeISO)
    const map = new Map<number, { cliente: Cliente; total: number; n: number }>()
    for (const v of ventas) {
      if (!v.cliente) continue
      const existing = map.get(v.cliente.id)
      const total = Number(v.total || 0)
      if (existing) {
        existing.total += total
        existing.n += 1
      } else {
        map.set(v.cliente.id, { cliente: v.cliente, total, n: 1 })
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limite)
      .map(x => ({ cliente: x.cliente, totalGastado: x.total, cantidadCompras: x.n }))
  },

  /** Top N productos más vendidos en los últimos N días. */
  topProductos(dias = 30, limite = 5): RankingProducto[] {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    const desdeISO = desde.toISOString().slice(0, 10)
    const ventas = load<Venta>(K.ventas).filter(v => (v.fecha ?? '') >= desdeISO)
    const map = new Map<number, { vino: Vino; cant: number; total: number }>()
    for (const v of ventas) {
      for (const d of (v.detalles ?? [])) {
        const existing = map.get(d.vino.id)
        const subtotal = Number(d.precioUnitario || 0) * d.cantidad
        if (existing) {
          existing.cant += d.cantidad
          existing.total += subtotal
        } else {
          map.set(d.vino.id, { vino: d.vino, cant: d.cantidad, total: subtotal })
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.cant - a.cant)
      .slice(0, limite)
      .map(x => ({ vino: x.vino, cantidadVendida: x.cant, totalRecaudado: x.total }))
  },

  /** Productos con stock bajo (≤ umbral). */
  stockCritico(umbral = 5): Vino[] {
    return load<Vino>(K.vinos)
      .filter(v => v.activo && v.stock <= umbral)
      .sort((a, b) => a.stock - b.stock)
  },

  /** Resumen del mes: ventas, recaudación, paradas. */
  delMes(year?: number, month?: number): { ventas: number; recaudado: number; paradas: number } {
    const ahora = new Date()
    const y = year ?? ahora.getFullYear()
    const m = month ?? ahora.getMonth() + 1
    const prefijo = `${y}-${String(m).padStart(2, '0')}`
    const ventas = load<Venta>(K.ventas).filter(v => (v.fecha ?? '').startsWith(prefijo))
    const viajes = load<Viaje>(K.viajes).filter(v => v.fecha.startsWith(prefijo))
    let paradas = 0
    for (const v of viajes) paradas += v.paradas.filter(p => p.estado === 'VISITADA').length
    return {
      ventas: ventas.length,
      recaudado: ventas.reduce((acc, v) => acc + Number(v.total || 0), 0),
      paradas,
    }
  },
}

// ============================================================
// PLANTILLAS WHATSAPP
// ============================================================
export const plantillasAPI = {
  listAll(): PlantillaWhatsApp[] {
    return load<PlantillaWhatsApp>(K.plantillas)
  },
  byId(id: number): PlantillaWhatsApp | null {
    return load<PlantillaWhatsApp>(K.plantillas).find(p => p.id === id) ?? null
  },
  getDefault(): PlantillaWhatsApp | null {
    const list = load<PlantillaWhatsApp>(K.plantillas)
    return list.find(p => p.esDefault) ?? list[0] ?? null
  },
  create(data: Partial<PlantillaWhatsApp>): PlantillaWhatsApp {
    const list = load<PlantillaWhatsApp>(K.plantillas)
    const nueva: PlantillaWhatsApp = {
      id: nextId(),
      nombre: data.nombre ?? 'Sin nombre',
      texto: data.texto ?? '',
      esDefault: !!data.esDefault,
      creadoEn: nowISO(),
    }
    // Si se marca como default, desmarcar las otras
    if (nueva.esDefault) list.forEach(p => p.esDefault = false)
    list.push(nueva)
    save(K.plantillas, list)
    return nueva
  },
  update(id: number, data: Partial<PlantillaWhatsApp>): PlantillaWhatsApp | null {
    const list = load<PlantillaWhatsApp>(K.plantillas)
    const idx = list.findIndex(p => p.id === id)
    if (idx === -1) return null
    // Si se marca como default, desmarcar otras
    if (data.esDefault) list.forEach(p => p.esDefault = false)
    list[idx] = { ...list[idx], ...data, id }
    save(K.plantillas, list)
    return list[idx]
  },
  delete(id: number): void {
    save(K.plantillas, load<PlantillaWhatsApp>(K.plantillas).filter(p => p.id !== id))
  },
}

// ============================================================
// ROUTER: matchea URLs del estilo backend y devuelve datos.
// Usado por src/api/axios.ts para que las páginas no cambien.
// ============================================================
export async function handleRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any,
): Promise<any> {
  // Quitar query string para matchear path
  const [path, queryStr] = url.split('?')
  const params = new URLSearchParams(queryStr ?? '')
  const M = method
  const P = path

  // CLIENTES
  if (M === 'GET' && P === '/clientes') {
    const q = params.get('q')
    return q ? clientesAPI.search(q) : clientesAPI.listAll()
  }
  let m = P.match(/^\/clientes\/dia\/(\w+)$/)
  if (M === 'GET' && m) return clientesAPI.byDia(m[1] as DiaSemana)
  m = P.match(/^\/clientes\/telefono\/(.+)$/)
  if (M === 'GET' && m) {
    const c = clientesAPI.byTelefono(m[1])
    if (!c) throw { response: { status: 404 } }
    return c
  }
  m = P.match(/^\/clientes\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'GET') {
      const c = clientesAPI.byId(id)
      if (!c) throw { response: { status: 404 } }
      return c
    }
    if (M === 'PUT')    return clientesAPI.update(id, body)
    if (M === 'DELETE') { clientesAPI.delete(id); return null }
  }
  if (M === 'POST' && P === '/clientes') return clientesAPI.create(body)

  // VINOS
  if (M === 'GET' && P === '/vinos')       return vinosAPI.listActivos()
  if (M === 'GET' && P === '/vinos/admin') return vinosAPI.listAll()
  if (M === 'POST' && P === '/vinos')      return vinosAPI.create(body)
  m = P.match(/^\/vinos\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return vinosAPI.update(id, body)
    if (M === 'DELETE') { vinosAPI.desactivar(id); return null }
  }

  // VENTAS
  m = P.match(/^\/ventas\/cliente\/(\d+)$/)
  if (M === 'GET' && m) return ventasAPI.byCliente(Number(m[1]))
  if (M === 'POST' && P === '/ventas') {
    try { return ventasAPI.create(body) }
    catch (e: any) { throw { response: { status: 400, data: e.message } } }
  }

  // DEUDAS
  m = P.match(/^\/deudas\/cliente\/(\d+)$/)
  if (M === 'GET' && m) return deudasAPI.byCliente(Number(m[1]))
  if (M === 'POST' && P === '/deudas') return deudasAPI.create(body)
  m = P.match(/^\/deudas\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return deudasAPI.update(id, body)
    if (M === 'DELETE') { deudasAPI.delete(id); return null }
  }

  // VIAJES
  if (M === 'GET' && P === '/viajes')  return viajesAPI.listAll()
  if (M === 'POST' && P === '/viajes') return viajesAPI.create(body)
  m = P.match(/^\/viajes\/(\d+)\/finalizar$/)
  if (M === 'PUT' && m) return viajesAPI.finalizar(Number(m[1]))
  m = P.match(/^\/viajes\/(\d+)\/cargar$/)
  if (M === 'POST' && m) {
    const res = viajesAPI.cargarCamion(Number(m[1]))
    if (!res.ok) throw { response: { status: 409, data: res.faltantes.join('\n') } }
    return res.viaje
  }
  m = P.match(/^\/viajes\/(\d+)\/descargar$/)
  if (M === 'POST' && m) return viajesAPI.descargarCamion(Number(m[1]))
  m = P.match(/^\/viajes\/paradas\/(\d+)\/items$/)
  if (M === 'PUT' && m) return viajesAPI.setItemsParada(Number(m[1]), body.items ?? [])
  m = P.match(/^\/viajes\/(\d+)\/paradas$/)
  if (M === 'POST' && m) return viajesAPI.agregarParada(Number(m[1]), body.clienteId, body.cantidadProductos)
  m = P.match(/^\/viajes\/paradas\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return viajesAPI.updateParada(id, body)
    if (M === 'DELETE') { viajesAPI.eliminarParada(id); return null }
  }
  m = P.match(/^\/viajes\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'GET') {
      const v = viajesAPI.byId(id)
      if (!v) throw { response: { status: 404 } }
      return v
    }
    if (M === 'PUT')    return viajesAPI.update(id, body)
    if (M === 'DELETE') { viajesAPI.delete(id); return null }
  }

  // PLANTILLAS WHATSAPP
  if (M === 'GET' && P === '/plantillas') return plantillasAPI.listAll()
  if (M === 'POST' && P === '/plantillas') return plantillasAPI.create(body)
  m = P.match(/^\/plantillas\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'GET')    return plantillasAPI.byId(id)
    if (M === 'PUT')    return plantillasAPI.update(id, body)
    if (M === 'DELETE') { plantillasAPI.delete(id); return null }
  }

  throw new Error(`Ruta no manejada: ${method} ${url}`)
}

// ============================================================
// SEED: si el localStorage está vacío, carga datos de ejemplo
// ============================================================
export function seedIfEmpty(): void {
  // Seed de plantillas si no hay ninguna
  if (load<PlantillaWhatsApp>(K.plantillas).length === 0) {
    plantillasAPI.create({
      nombre: 'Pedido del día',
      texto: 'Hola {nombre}! Te habla Vinos Galán 🍷\n\n¿Necesitás algo para el {dia_hoy}? Hoy estamos repartiendo y queríamos saber si te llevamos algo.',
      esDefault: true,
    })
    plantillasAPI.create({
      nombre: 'En camino',
      texto: 'Hola {nombre}! Estamos en camino para tu zona ({zona}). Llegamos en un rato 🚚',
    })
    plantillasAPI.create({
      nombre: 'Saludo simple',
      texto: 'Hola {nombre}! ¿Cómo estás?',
    })
  }

  if (load<Cliente>(K.clientes).length > 0) return
  const c1 = clientesAPI.create({ nombre: 'Bar La Esquina',     telefono: '1144556677', direccion: 'San Martín 100',     zona: 'Centro', diaReparto: 'MARTES' })
  const c2 = clientesAPI.create({ nombre: 'Restaurante El Pino', telefono: '1145678900', direccion: 'Av. Corrientes 1234', zona: 'Centro', diaReparto: 'JUEVES' })
  clientesAPI.create({ nombre: 'Almacén Don José',  telefono: '1167890123', direccion: 'Belgrano 545',  zona: 'Sur',    diaReparto: 'MARTES' })
  vinosAPI.create({ nombre: 'Malbec Reserva',  bodega: 'Trapiche',  varietal: 'Malbec',   precioVenta: 5500, precioCosto: 3200, stock: 24 })
  vinosAPI.create({ nombre: 'Cabernet Joven',  bodega: 'Norton',    varietal: 'Cabernet', precioVenta: 4200, precioCosto: 2400, stock: 18 })
  vinosAPI.create({ nombre: 'Chardonnay Crianza', bodega: 'Catena', varietal: 'Chardonnay', precioVenta: 6800, precioCosto: 4100, stock: 12 })
  // Una deuda y una venta de ejemplo para que se vea
  deudasAPI.create({ clienteId: c1.id, descripcion: '6 botellas Malbec (fiado)', monto: 33000, fecha: todayISO() })
  ventasAPI.create({ clienteId: c2.id, notas: '', detalles: [{ vinoId: 1, cantidad: 2 }] })
}
