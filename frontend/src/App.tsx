import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
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
        <Route element={<Layout />}>
          <Route path="/" element={<Inicio />} />
          <Route path="/viajes" element={<Viajes />} />
          <Route path="/viajes/nuevo" element={<NuevoViaje />} />
          <Route path="/viajes/:id" element={<DetalleViaje />} />
          <Route path="/recorrido" element={<Navigate to="/viajes" replace />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="/clientes/:id" element={<ClienteFicha />} />
          <Route path="/vinos" element={<Vinos />} />
          <Route path="/ventas/nueva" element={<NuevaVenta />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  )
}
