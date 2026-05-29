import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PublicLayout from './components/PublicLayout'
import Landing from './pages/Landing'
import Catalogo from './pages/Catalogo'
import Nosotros from './pages/Nosotros'
import Contacto from './pages/Contacto'
import Inicio from './pages/Inicio'
import Viajes from './pages/Viajes'
import DetalleViaje from './pages/DetalleViaje'
import NuevoViaje from './pages/NuevoViaje'
import Clientes from './pages/Clientes'
import ClienteFicha from './pages/ClienteFicha'
import Vinos from './pages/Vinos'
import NuevaVenta from './pages/NuevaVenta'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* SITIO PÚBLICO */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/catalogo" element={<Catalogo />} />
          <Route path="/nosotros" element={<Nosotros />} />
          <Route path="/contacto" element={<Contacto />} />
        </Route>

        {/* SISTEMA INTERNO */}
        <Route path="/app" element={<Layout />}>
          <Route index element={<Inicio />} />
          <Route path="viajes" element={<Viajes />} />
          <Route path="viajes/nuevo" element={<NuevoViaje />} />
          <Route path="viajes/:id" element={<DetalleViaje />} />
          <Route path="recorrido" element={<Navigate to="/app/viajes" replace />} />
          <Route path="clientes" element={<Clientes />} />
          <Route path="clientes/:id" element={<ClienteFicha />} />
          <Route path="vinos" element={<Vinos />} />
          <Route path="ventas/nueva" element={<NuevaVenta />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
