/**
 * Migración inicial: sube los datos que tenías en localStorage a Supabase.
 * Solo se ejecuta UNA VEZ. Después de la primera ejecución, queda un flag en
 * localStorage que indica que ya se migró.
 *
 * Lógica:
 *   1. Si en Supabase ya hay clientes/vinos → no migra (asumimos que ya están)
 *   2. Si localStorage tiene datos → los sube a Supabase
 *   3. Marca el flag y listo
 */
import { supabase } from '../lib/supabase'

const FLAG_KEY = 'vg.migracion.completa'

const K = {
  clientes: 'vg.clientes',
  vinos: 'vg.vinos',
  ventas: 'vg.ventas',
  deudas: 'vg.deudas',
  viajes: 'vg.viajes',
  plantillas: 'vg.plantillas',
}

function load<T>(key: string): T[] {
  try { return JSON.parse(localStorage.getItem(key) || '[]') } catch { return [] }
}

export async function migrarSiHaceFalta(): Promise<void> {
  // Si ya se migró, no hacer nada
  if (localStorage.getItem(FLAG_KEY) === '1') return

  try {
    // Chequear si Supabase ya tiene datos
    const { count: clientesEnSupabase } = await supabase
      .from('clientes')
      .select('*', { count: 'exact', head: true })

    const { count: vinosEnSupabase } = await supabase
      .from('vinos')
      .select('*', { count: 'exact', head: true })

    if ((clientesEnSupabase ?? 0) > 0 || (vinosEnSupabase ?? 0) > 0) {
      // Ya hay datos, marcar como migrado y no hacer nada
      localStorage.setItem(FLAG_KEY, '1')
      return
    }

    // Cargar de localStorage
    const clientesLocal = load<any>(K.clientes)
    const vinosLocal = load<any>(K.vinos)
    const deudasLocal = load<any>(K.deudas)
    const ventasLocal = load<any>(K.ventas)
    const viajesLocal = load<any>(K.viajes)
    const plantillasLocal = load<any>(K.plantillas)

    if (clientesLocal.length === 0 && vinosLocal.length === 0) {
      // No hay nada para migrar
      localStorage.setItem(FLAG_KEY, '1')
      return
    }

    console.info('[migración] Subiendo datos locales a Supabase...')

    // Map de IDs viejos → IDs nuevos (por si los IDs cambian)
    const idMapCliente = new Map<number, number>()
    const idMapVino = new Map<number, number>()

    // CLIENTES
    for (const c of clientesLocal) {
      // Soporta tanto el formato viejo (diaReparto: string) como el nuevo (diasReparto: array)
      const cAny = c as any
      const dias: any[] = Array.isArray(cAny.diasReparto)
        ? cAny.diasReparto
        : cAny.diaReparto ? [cAny.diaReparto] : []
      const { data, error } = await supabase.from('clientes').insert({
        nombre: c.nombre,
        telefono: c.telefono ?? '',
        direccion: c.direccion ?? '',
        zona: c.zona ?? null,
        dia_reparto: dias[0] ?? null,
        dias_reparto: dias,
        notas: c.notas ?? '',
      }).select().single()
      if (!error && data) idMapCliente.set(c.id, data.id)
    }

    // VINOS
    for (const v of vinosLocal) {
      const { data, error } = await supabase.from('vinos').insert({
        nombre: v.nombre,
        bodega: v.bodega ?? '',
        varietal: v.varietal ?? '',
        precio_venta: Number(v.precioVenta ?? 0),
        precio_costo: Number(v.precioCosto ?? 0),
        stock: v.stock ?? 0,
        activo: v.activo ?? true,
        foto_url: v.fotoUrl ?? null,
        descripcion: v.descripcion ?? null,
        mostrar_en_catalogo: v.mostrarEnCatalogo ?? true,
      }).select().single()
      if (!error && data) idMapVino.set(v.id, data.id)
    }

    // DEUDAS
    for (const d of deudasLocal) {
      const clienteId = idMapCliente.get(d.clienteId)
      if (!clienteId) continue
      await supabase.from('deudas').insert({
        cliente_id: clienteId,
        descripcion: d.descripcion ?? '',
        monto: Number(d.monto ?? 0),
        fecha: d.fecha,
      })
    }

    // VENTAS — actualizamos los IDs en cliente_snapshot y detalles
    for (const venta of ventasLocal) {
      const clienteIdNuevo = idMapCliente.get(venta.cliente?.id)
      const clienteSnapshot = venta.cliente
        ? { ...venta.cliente, id: clienteIdNuevo ?? venta.cliente.id }
        : null
      const detallesActualizados = (venta.detalles ?? []).map((d: any) => ({
        ...d,
        vino: d.vino ? { ...d.vino, id: idMapVino.get(d.vino.id) ?? d.vino.id } : d.vino,
      }))
      await supabase.from('ventas').insert({
        cliente_id: clienteIdNuevo ?? null,
        cliente_snapshot: clienteSnapshot,
        fecha: venta.fecha,
        total: Number(venta.total ?? 0),
        notas: venta.notas ?? '',
        detalles: detallesActualizados,
      })
    }

    // VIAJES — actualizamos clienteId en paradas e items
    for (const v of viajesLocal) {
      const paradasNuevas = (v.paradas ?? []).map((p: any) => {
        const cliente = p.cliente
          ? { ...p.cliente, id: idMapCliente.get(p.cliente.id) ?? p.cliente.id }
          : null
        const items = (p.items ?? []).map((it: any) => ({
          ...it,
          vinoId: idMapVino.get(it.vinoId) ?? it.vinoId,
        }))
        return { ...p, cliente, items }
      })
      await supabase.from('viajes').insert({
        fecha: v.fecha,
        titulo: v.titulo ?? null,
        notas: v.notas ?? null,
        estado: v.estado,
        inicio: v.inicio,
        fin: v.fin,
        paradas: paradasNuevas,
        cantidad_total_manual: v.cantidadTotalManual ?? null,
        cargado: v.cargado ?? false,
        fecha_carga: v.fechaCarga ?? null,
      })
    }

    // PLANTILLAS — solo si no hay ninguna (el SQL ya seteó las 3 por defecto)
    const { count: plantillasYa } = await supabase
      .from('plantillas_whatsapp')
      .select('*', { count: 'exact', head: true })
    if ((plantillasYa ?? 0) === 0) {
      for (const p of plantillasLocal) {
        await supabase.from('plantillas_whatsapp').insert({
          nombre: p.nombre,
          texto: p.texto,
          es_default: !!p.esDefault,
        })
      }
    }

    localStorage.setItem(FLAG_KEY, '1')
    console.info('[migración] Datos subidos a Supabase ✓')
  } catch (e) {
    console.error('[migración] Error al migrar:', e)
    // No marcar como completo si falló — se reintentará al próximo reload
  }
}
