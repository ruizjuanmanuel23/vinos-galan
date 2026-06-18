import { Navigate } from 'react-router-dom'

/**
 * La pantalla "Nuevo viaje" se mergeó dentro de /app/viajes para que el armado
 * sea directo (sin sub-página). Esta ruta queda como redirect por compatibilidad
 * con bookmarks/links viejos.
 */
export default function NuevoViaje() {
  return <Navigate to="/app/viajes" replace />
}
