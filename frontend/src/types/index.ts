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

export interface Parada {
  id: number
  cliente: Cliente
  orden: number
  estado: EstadoParada
  notas: string | null
  horaVisita: string | null
  /** Cantidad de unidades/cajas a llevarle a este cliente. Default 0. */
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
   * (ignora la suma de las paradas). Útil para cargar rápido sin desglosar por cliente.
   * Si es null/undefined o 0, el total del viaje se calcula sumando las paradas.
   */
  cantidadTotalManual?: number | null
}

/** Cantidad total de productos a llevar en un viaje (manual o suma de paradas). */
export function totalProductosViaje(v: Viaje): number {
  if (v.cantidadTotalManual && v.cantidadTotalManual > 0) return v.cantidadTotalManual
  return v.paradas.reduce((acc, p) => acc + (p.cantidadProductos || 0), 0)
}

export function diaSemanaHoy(): DiaSemana {
  const idx = new Date().getDay() // 0=domingo
  return ['DOMINGO','LUNES','MARTES','MIERCOLES','JUEVES','VIERNES','SABADO'][idx] as DiaSemana
}
