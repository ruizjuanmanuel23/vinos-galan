/**
 * Cliente de API que enruta las llamadas REST estilo /api/clientes a Supabase.
 * Mantiene la misma forma { data } que axios para no romper las páginas existentes.
 */
import {
  clientesDB, vinosDB, ventasDB, deudasDB, viajesDB, plantillasDB,
} from '../services/db'

interface Response<T> { data: T }

async function handle<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any): Promise<T> {
  const [path, queryStr] = url.split('?')
  const params = new URLSearchParams(queryStr ?? '')
  const P = path
  const M = method
  let m: RegExpMatchArray | null

  // CLIENTES
  if (M === 'GET' && P === '/clientes') {
    const q = params.get('q')
    return (q ? await clientesDB.search(q) : await clientesDB.listAll()) as T
  }
  m = P.match(/^\/clientes\/dia\/(\w+)$/)
  if (M === 'GET' && m) return await clientesDB.byDia(m[1] as any) as T
  m = P.match(/^\/clientes\/telefono\/(.+)$/)
  if (M === 'GET' && m) {
    const c = await clientesDB.byTelefono(m[1])
    if (!c) throw { response: { status: 404 } }
    return c as T
  }
  m = P.match(/^\/clientes\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'GET') {
      const c = await clientesDB.byId(id)
      if (!c) throw { response: { status: 404 } }
      return c as T
    }
    if (M === 'PUT')    return await clientesDB.update(id, body) as T
    if (M === 'DELETE') { await clientesDB.delete(id); return null as T }
  }
  if (M === 'POST' && P === '/clientes') return await clientesDB.create(body) as T

  // VINOS / BODEGA
  if (M === 'GET' && P === '/vinos')       return await vinosDB.listActivos() as T
  if (M === 'GET' && P === '/vinos/admin') return await vinosDB.listAll() as T
  if (M === 'POST' && P === '/vinos')      return await vinosDB.create(body) as T
  m = P.match(/^\/vinos\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return await vinosDB.update(id, body) as T
    if (M === 'DELETE') { await vinosDB.desactivar(id); return null as T }
  }

  // VENTAS
  m = P.match(/^\/ventas\/cliente\/(\d+)$/)
  if (M === 'GET' && m) return await ventasDB.byCliente(Number(m[1])) as T
  if (M === 'POST' && P === '/ventas') {
    try { return await ventasDB.create(body) as T }
    catch (e: any) { throw { response: { status: 400, data: e.message } } }
  }

  // DEUDAS
  m = P.match(/^\/deudas\/cliente\/(\d+)$/)
  if (M === 'GET' && m) return await deudasDB.byCliente(Number(m[1])) as T
  if (M === 'POST' && P === '/deudas') return await deudasDB.create(body) as T
  m = P.match(/^\/deudas\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return await deudasDB.update(id, body) as T
    if (M === 'DELETE') { await deudasDB.delete(id); return null as T }
  }

  // VIAJES
  if (M === 'GET' && P === '/viajes')  return await viajesDB.listAll() as T
  if (M === 'POST' && P === '/viajes') return await viajesDB.create(body) as T
  m = P.match(/^\/viajes\/(\d+)\/finalizar$/)
  if (M === 'PUT' && m) return await viajesDB.finalizar(Number(m[1])) as T
  m = P.match(/^\/viajes\/(\d+)\/cargar$/)
  if (M === 'POST' && m) {
    const res = await viajesDB.cargarCamion(Number(m[1]))
    if (!res.ok) throw { response: { status: 409, data: res.faltantes.join('\n') } }
    return res.viaje as T
  }
  m = P.match(/^\/viajes\/(\d+)\/descargar$/)
  if (M === 'POST' && m) return await viajesDB.descargarCamion(Number(m[1])) as T
  m = P.match(/^\/viajes\/(\d+)\/paradas$/)
  if (M === 'POST' && m) return await viajesDB.agregarParada(Number(m[1]), body.clienteId, body.cantidadProductos) as T
  m = P.match(/^\/viajes\/paradas\/(\d+)\/items$/)
  if (M === 'PUT' && m) return await viajesDB.setItemsParada(Number(m[1]), body.items ?? []) as T
  m = P.match(/^\/viajes\/paradas\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return await viajesDB.updateParada(id, body) as T
    if (M === 'DELETE') { await viajesDB.eliminarParada(id); return null as T }
  }
  m = P.match(/^\/viajes\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'GET') {
      const v = await viajesDB.byId(id)
      if (!v) throw { response: { status: 404 } }
      return v as T
    }
    if (M === 'PUT')    return await viajesDB.update(id, body) as T
    if (M === 'DELETE') { await viajesDB.delete(id); return null as T }
  }

  // PLANTILLAS
  if (M === 'GET' && P === '/plantillas')   return await plantillasDB.listAll() as T
  if (M === 'POST' && P === '/plantillas')  return await plantillasDB.create(body) as T
  m = P.match(/^\/plantillas\/(\d+)$/)
  if (m) {
    const id = Number(m[1])
    if (M === 'PUT')    return await plantillasDB.update(id, body) as T
    if (M === 'DELETE') { await plantillasDB.delete(id); return null as T }
  }

  throw new Error(`Ruta no manejada: ${method} ${url}`)
}

function call<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any): Promise<Response<T>> {
  return handle<T>(method, url, body).then(data => ({ data }))
}

const api = {
  get:    <T = any>(url: string)              => call<T>('GET', url),
  post:   <T = any>(url: string, body?: any)  => call<T>('POST', url, body),
  put:    <T = any>(url: string, body?: any)  => call<T>('PUT', url, body),
  delete: <T = any>(url: string)              => call<T>('DELETE', url),
}

export default api
