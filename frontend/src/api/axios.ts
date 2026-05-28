/**
 * Cliente de API fake que respeta la interfaz de axios pero usa localStorage internamente.
 * Las páginas no se enteran: siguen llamando api.get('/clientes').then(r => setX(r.data)).
 */
import { handleRequest } from '../services/storage'

interface Response<T> { data: T }

function call<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', url: string, body?: any): Promise<Response<T>> {
  return new Promise((resolve, reject) => {
    // Pequeño delay para que el spinner se vea (UX)
    setTimeout(() => {
      try {
        const data = handleRequest(method, url, body)
        Promise.resolve(data).then(d => resolve({ data: d as T })).catch(reject)
      } catch (err) { reject(err) }
    }, 0)
  })
}

const api = {
  get:    <T = any>(url: string)              => call<T>('GET', url),
  post:   <T = any>(url: string, body?: any)  => call<T>('POST', url, body),
  put:    <T = any>(url: string, body?: any)  => call<T>('PUT', url, body),
  delete: <T = any>(url: string)              => call<T>('DELETE', url),
}

export default api
