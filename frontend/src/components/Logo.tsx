/**
 * Logo VG con recorte circular y zoom para esconder el fondo de papel.
 * Se integra con el verde botella del sitio.
 *
 * - `size`: tamaño del lado en pixeles (default 48)
 * - `ring`: si lleva anillo dorado decorativo (default true)
 * - `glow`: sombra brillante alrededor (default false, útil para hero)
 */
interface Props {
  size?: number
  ring?: boolean
  glow?: boolean
  className?: string
}

export default function Logo({ size = 48, ring = true, glow = false, className = '' }: Props) {
  const ringClass = ring ? 'ring-2 ring-dorado-400/50' : ''
  const glowClass = glow ? 'shadow-2xl shadow-dorado-500/30' : 'drop-shadow'
  return (
    <div
      className={`rounded-full overflow-hidden bg-gradient-to-br from-botella-600 to-botella-800 ${ringClass} ${glowClass} ${className}`}
      style={{ width: size, height: size }}
    >
      <img
        src="/logo-vg.png"
        alt="Vinos Galán"
        className="w-full h-full object-cover scale-[1.18] origin-center select-none pointer-events-none"
        draggable={false}
      />
    </div>
  )
}
