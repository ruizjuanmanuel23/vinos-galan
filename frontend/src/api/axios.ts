import axios from 'axios'

// En desarrollo: usa el proxy de Vite ("/api" → localhost:8083)
// En producción: usa VITE_API_URL definida en build (ej: https://vinos-galan.up.railway.app/api)
const baseURL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({ baseURL })

export default api
