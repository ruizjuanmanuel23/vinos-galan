export type DiaSemana = 'LUNES' | 'MARTES' | 'MIERCOLES' | 'JUEVES' | 'VIERNES' | 'SABADO' | 'DOMINGO'

export const DIAS_SEMANA: DiaSemana[] = ['LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO','DOMINGO']

export const DIA_LABEL: Record<DiaSemana, string> = {
  LUNES: 'Lunes', MARTES: 'Martes', MIERCOLES: 'Miércoles', JUEVES: 'Jueves',
  VIERNES: 'Viernes', SABADO: 'Sábado', DOMINGO: 'Domingo',
}

export const DIA_CORTO: Record<DiaSemana, string> = {
  LUNES: 'Lun', MARTES: 'Mar', MIERCOLES: 'Mié', JUEVES: 'Jue',
  VIERNES: 'Vie', SABADO: 'Sáb', DOMINGO: 'Dom',
}

export interface Cliente {
  id: number
  nombre: string
  telefono: string
  direccion: string
  zona: string | null
  diaReparto: DiaSemana | null
  notas: string
  creadoEn: string
}

export interface Vino {
  id: number
  nombre: string
  bodega: string
  varietal: string
  precioVenta: number
  precioCosto: number
  stock: number
  activo: boolean
  /** Foto del vino en base64 (data URL) o URL externa. Opcional. */
  fotoUrl?: string | null
  /** Descripción/nota de cata para el catálogo público. Opcional. */
  descripcion?: string | null
  /** Si se muestra en el catálogo público de la web (default true). */
  mostrarEnCatalogo?: boolean
  creadoEn: string
}

export interface DetalleVenta {
  id: number
  vino: Vino
  cantidad: number
  precioUnitario: number
}

export interface Venta {
  id: number
  cliente: Cliente
  fecha: string
  total: number
  notas: string
  detalles: DetalleVenta[]
}

export interface DeudaAnotacion {
  id: number
  descripcion: string
  monto: number
  fecha: string
  creadoEn: string
}

export type EstadoViaje = 'EN_CURSO' | 'FINALIZADO'
export type EstadoParada = 'PENDIENTE' | 'VISITADA' | 'OMITIDA'

/** Item de una parada: producto + cantidad que va para ese cliente. */
export interface ItemParada {
  id: number
  vinoId: number
  /** Snapshot del nombre del producto (por si se modifica/borra después). */
  vinoNombre: string
  cantidad: number
}

export interface Parada {
  id: number
  cliente: Cliente
  orden: number
  estado: EstadoParada
  notas: string | null
  horaVisita: string | null
  /** Detalle de productos a llevarle (vinos, jugos, etc. de la Bodega). */
  items: ItemParada[]
  /** Cantidad total de unidades de esta parada. Suma derivada (compat). */
  cantidadProductos: number
}

export interface Viaje {
  id: number
  fecha: string
  titulo: string | null
  notas: string | null
  estado: EstadoViaje
  inicio: string | null
  fin: string | null
  paradas: Parada[]
  /**
   * Si está seteado (>0), es la cantidad total cargada a mano para todo el viaje
   * (sin desglose). Útil para registrar rápido sin detallar producto por cliente.
   */
  cantidadTotalManual?: number | null
  /** Si la camioneta ya fue cargada (stock descontado de Bodega). */
  cargado?: boolean
  /** Cuándo se cargó el camión. */
  fechaCarga?: string | null
}

/** Producto + cantidad agregada (resumen para cargar el camión). */
export interface ItemCarga {
  vinoId: number
  vinoNombre: string
  cantidad: number
}

/** Devuelve los productos agregados de todo el viaje (suma por producto). */
export function cargaDeCamion(viaje: Viaje): ItemCarga[] {
  const map = new Map<number, ItemCarga>()
  for (const p of viaje.paradas) {
    for (const it of (p.items ?? [])) {
      const existing = map.get(it.vinoId)
      if (existing) existing.cantidad += it.cantidad
      else map.set(it.vinoId, { vinoId: it.vinoId, vinoNombre: it.vinoNombre, cantidad: it.cantidad })
    }
  }
  return Array.from(map.values()).sort((a, b) => b.cantidad - a.cantidad)
}

/** Cantidad total de productos a llevar en un viaje (manual o suma de paradas). */
export function totalProductosViaje(v: Viaje): number {
  if (v.cantidadTotalManual && v.cantidadTotalManual > 0) return v.cantidadTotalManual
  return v.paradas.reduce((acc, p) => acc + cantidadDeParada(p), 0)
}

/** Cantidad total de una parada (suma de items). */
export function cantidadDeParada(p: Parada): number {
  if (p.items && p.items.length > 0) {
    return p.items.reduce((acc, it) => acc + (it.cantidad || 0), 0)
  }
  return p.cantidadProductos || 0
}

export function diaSemanaHoy(): DiaSemana {
  const idx = new Date().getDay() // 0=domingo
  return ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'][idx] as DiaSemana
}
