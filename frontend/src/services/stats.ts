/**
 * Estadísticas calculadas leyendo de Supabase.
 * Reemplaza al `resumenAPI` que vivía en storage.ts.
 */
import { supabase } from '../lib/supabase'
import type { Cliente, Vino } from '../types'

export interface ResumenDia {
  fecha: string
  ventas: number
  recaudado: number
  paradas: number
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

export const statsAPI = {
  async delDia(fechaISO?: string): Promise<ResumenDia> {
    const fecha = fechaISO ?? new Date().toISOString().slice(0, 10)

    // Ventas del día
    const { data: ventas } = await supabase
      .from('ventas')
      .select('total, fecha')
      .gte('fecha', `${fecha}T00:00:00`)
      .lte('fecha', `${fecha}T23:59:59`)

    const ventasCount = (ventas ?? []).length
    const recaudado = (ventas ?? []).reduce((acc, v: any) => acc + Number(v.total || 0), 0)

    // Viajes del día
    const { data: viajes } = await supabase
      .from('viajes')
      .select('estado, paradas')
      .eq('fecha', fecha)

    let paradas = 0
    let productosEntregados = 0
    let viajesEnCurso = 0
    for (const v of (viajes ?? []) as any[]) {
      if (v.estado === 'EN_CURSO') viajesEnCurso++
      for (const p of (v.paradas ?? [])) {
        if (p.estado === 'VISITADA' && (p.horaVisita ?? '').startsWith(fecha)) {
          paradas++
          productosEntregados += p.cantidadProductos || 0
        }
      }
    }

    return { fecha, ventas: ventasCount, recaudado, paradas, productosEntregados, viajesEnCurso }
  },

  async delMes(year?: number, month?: number): Promise<{ ventas: number; recaudado: number; paradas: number }> {
    const ahora = new Date()
    const y = year ?? ahora.getFullYear()
    const m = month ?? ahora.getMonth() + 1
    const inicio = `${y}-${String(m).padStart(2, '0')}-01T00:00:00`
    const finMes = new Date(y, m, 0).toISOString().slice(0, 10) + 'T23:59:59'

    const { data: ventas } = await supabase
      .from('ventas')
      .select('total')
      .gte('fecha', inicio)
      .lte('fecha', finMes)

    const { data: viajes } = await supabase
      .from('viajes')
      .select('paradas')
      .gte('fecha', `${y}-${String(m).padStart(2, '0')}-01`)
      .lte('fecha', finMes.slice(0, 10))

    let paradasTotal = 0
    for (const v of (viajes ?? []) as any[]) {
      paradasTotal += (v.paradas ?? []).filter((p: any) => p.estado === 'VISITADA').length
    }

    return {
      ventas: (ventas ?? []).length,
      recaudado: (ventas ?? []).reduce((acc, v: any) => acc + Number(v.total || 0), 0),
      paradas: paradasTotal,
    }
  },

  async topClientes(dias = 30, limite = 5): Promise<RankingCliente[]> {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    const desdeISO = desde.toISOString().slice(0, 10)
    const { data } = await supabase
      .from('ventas')
      .select('total, cliente_id, cliente_snapshot')
      .gte('fecha', `${desdeISO}T00:00:00`)

    const map = new Map<number, { cliente: Cliente; total: number; n: number }>()
    for (const v of (data ?? []) as any[]) {
      const cliente = v.cliente_snapshot as Cliente
      if (!cliente?.id) continue
      const total = Number(v.total || 0)
      const e = map.get(cliente.id)
      if (e) { e.total += total; e.n += 1 }
      else map.set(cliente.id, { cliente, total, n: 1 })
    }
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, limite)
      .map(x => ({ cliente: x.cliente, totalGastado: x.total, cantidadCompras: x.n }))
  },

  async topProductos(dias = 30, limite = 5): Promise<RankingProducto[]> {
    const desde = new Date()
    desde.setDate(desde.getDate() - dias)
    const desdeISO = desde.toISOString().slice(0, 10)
    const { data } = await supabase
      .from('ventas')
      .select('detalles')
      .gte('fecha', `${desdeISO}T00:00:00`)

    const map = new Map<number, { vino: Vino; cant: number; total: number }>()
    for (const v of (data ?? []) as any[]) {
      for (const d of (v.detalles ?? [])) {
        const vino = d.vino as Vino
        if (!vino?.id) continue
        const subtotal = Number(d.precioUnitario || 0) * d.cantidad
        const e = map.get(vino.id)
        if (e) { e.cant += d.cantidad; e.total += subtotal }
        else map.set(vino.id, { vino, cant: d.cantidad, total: subtotal })
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.cant - a.cant)
      .slice(0, limite)
      .map(x => ({ vino: x.vino, cantidadVendida: x.cant, totalRecaudado: x.total }))
  },

  async stockCritico(umbral = 5): Promise<Vino[]> {
    const { data } = await supabase
      .from('vinos')
      .select('*')
      .eq('activo', true)
      .lte('stock', umbral)
      .order('stock')
    return ((data ?? []) as any[]).map(r => ({
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
    }))
  },
}
