import { Navigate, useLocation } from 'react-router-dom'
import { isAuth } from '../services/auth'

interface Props { children: React.ReactNode }

/** Envuelve rutas privadas. Si el usuario no está logueado, redirige a /login. */
export default function RequireAuth({ children }: Props) {
  const location = useLocation()
  if (!isAuth()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
