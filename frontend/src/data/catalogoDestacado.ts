/**
 * Catálogo destacado de respaldo — se muestra en la web pública cuando
 * el localStorage está vacío (visitantes desde la calle).
 * Estos datos están inspirados en los vinos típicos que distribuye Vinos Galán La Plata.
 * Cuando Nahue cargue vinos desde el sistema interno con sus fotos reales,
 * esos van a aparecer en lugar de estos.
 */
export interface VinoDestacado {
  nombre: string
  bodega: string
  varietal: string
  precioVenta: number
  fotoUrl: string
  descripcion: string
}

export const CATALOGO_DESTACADO: VinoDestacado[] = [
  {
    nombre: 'Malbec',
    bodega: 'Bodega Galán',
    varietal: 'Malbec',
    precioVenta: 5500,
    fotoUrl: 'https://images.unsplash.com/photo-1568213816046-0ee1c42bd559?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Tinto frutado con notas de ciruela y violeta. Crianza en roble francés. El emblema de la casa.'
  },
  {
    nombre: 'Cabernet Sauvignon',
    bodega: 'Bodega Galán',
    varietal: 'Cabernet Sauvignon',
    precioVenta: 5200,
    fotoUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Estructurado y elegante, con taninos firmes y final largo. Ideal para carnes asadas.'
  },
  {
    nombre: 'Bonarda',
    bodega: 'Bodega Galán',
    varietal: 'Bonarda',
    precioVenta: 4200,
    fotoUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Joven, jugoso y muy fácil de beber. La cepa más argentina, con frutos rojos en boca.'
  },
  {
    nombre: 'Syrah Reserva',
    bodega: 'Bodega Galán',
    varietal: 'Syrah',
    precioVenta: 6800,
    fotoUrl: 'https://images.unsplash.com/photo-1566754966717-1a0c8a4f80a8?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Especiado con pimienta negra y mora. Crianza en barrica. Para los amantes del estilo Rhône.'
  },
  {
    nombre: 'Merlot',
    bodega: 'Bodega Galán',
    varietal: 'Merlot',
    precioVenta: 4800,
    fotoUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Suave, redondo y aterciopelado. Notas de cereza madura y cacao. El compañero perfecto de quesos.'
  },
  {
    nombre: 'Torrontés',
    bodega: 'Bodega Galán',
    varietal: 'Torrontés',
    precioVenta: 4500,
    fotoUrl: 'https://images.unsplash.com/photo-1566995541428-f3c70bee9da4?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Blanco aromático característico del norte argentino. Floral, fresco y con final cítrico.'
  },
  {
    nombre: 'Chardonnay',
    bodega: 'Bodega Galán',
    varietal: 'Chardonnay',
    precioVenta: 5100,
    fotoUrl: 'https://images.unsplash.com/photo-1547595628-c61a29f496f0?auto=format&fit=crop&w=600&q=80&blend=DCC85D&blend-mode=multiply&blend-alpha=10',
    descripcion: 'Blanco seco con paso por barrica. Manzana, vainilla y miel. Cuerpo y elegancia.'
  },
  {
    nombre: 'Damajuana Tinto 5L',
    bodega: 'Vinos Galán',
    varietal: 'Tinto de mesa',
    precioVenta: 12500,
    fotoUrl: 'https://images.unsplash.com/photo-1569919659476-f0852f6834b7?auto=format&fit=crop&w=600&q=80',
    descripcion: 'Nuestro clásico tinto para la mesa de todos los días. Cinco litros. La tradición de siempre.'
  },
]

/** URLs de imágenes de fondo (Unsplash) para el sitio público. */
export const IMG = {
  heroVineyard: 'https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1920&q=80',
  heroBarrels:  'https://images.unsplash.com/photo-1543007631-283050bb3e8c?auto=format&fit=crop&w=1920&q=80',
  heroPour:     'https://images.unsplash.com/photo-1567696911980-2eed69a46042?auto=format&fit=crop&w=1920&q=80',
  glassRed:     'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=80',
  bottles:      'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?auto=format&fit=crop&w=1200&q=80',
  cellar:       'https://images.unsplash.com/photo-1543007631-283050bb3e8c?auto=format&fit=crop&w=1200&q=80',
  grapes:       'https://images.unsplash.com/photo-1474722883778-792e7990302f?auto=format&fit=crop&w=1200&q=80',
  vineyardSunset: 'https://images.unsplash.com/photo-1506976785307-8732e854ad03?auto=format&fit=crop&w=1920&q=80',
}
