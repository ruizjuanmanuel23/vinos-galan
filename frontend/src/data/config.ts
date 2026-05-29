/**
 * Configuración del sitio público.
 * Cambiá estos valores cuando tengas los datos reales de Vinos Galán.
 */

/** Número de WhatsApp de Nahuel García en formato internacional para wa.me. */
export const WHATSAPP_NUM = '5492216384423'

/** Teléfono visible para mostrar al cliente (con formato). */
export const TELEFONO_VISIBLE = '(221) 638-4423'

/** Email de contacto. */
export const EMAIL = 'contacto@vinosgalanlaplata.com'

/** Dirección de la sucursal. */
export const DIRECCION = 'Calle 45 entre 22 y 23'
export const DIRECCION_CIUDAD = 'La Plata, Buenos Aires'

/** Horarios. */
export const HORARIO = {
  semana: 'Lunes a viernes 9 a 13 hs. y 16 a 20 hs.',
  sabado: 'Sábados 9 a 13 hs.',
}

/** Genera un link de WhatsApp con mensaje pre-armado. */
export function whatsappLink(mensaje: string): string {
  const encoded = encodeURIComponent(mensaje)
  return `https://wa.me/${WHATSAPP_NUM}?text=${encoded}`
}
