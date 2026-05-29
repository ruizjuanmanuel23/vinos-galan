/**
 * Comprime y redimensiona una imagen del File picker antes de guardarla en localStorage.
 * Sin esto, una foto de celu de 4 MB llenaría el localStorage en 1 o 2 vinos.
 *
 * Devuelve una data URL JPEG comprimida, lista para guardar en `vino.fotoUrl`.
 */
export async function comprimirImagen(file: File, opts: {
  maxWidth?: number
  maxHeight?: number
  quality?: number
} = {}): Promise<string> {
  const { maxWidth = 800, maxHeight = 800, quality = 0.78 } = opts

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        // Calcular dimensiones respetando aspecto
        let { width, height } = img
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) return reject(new Error('Canvas no disponible'))

        ctx.drawImage(img, 0, 0, width, height)
        const dataUrl = canvas.toDataURL('image/jpeg', quality)
        resolve(dataUrl)
      }
      img.onerror = reject
      img.src = reader.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/** Estima KB de una data URL base64. */
export function tamañoKb(dataUrl: string): number {
  const b64 = dataUrl.split(',')[1] ?? ''
  return Math.round((b64.length * 3) / 4 / 1024)
}
