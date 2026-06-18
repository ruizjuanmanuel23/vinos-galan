import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

/**
 * Genera los íconos del PWA/APK a partir de logo-vg.png.
 *
 * Padding chico (0.05) para que el logo ocupe casi todo el cuadrado y se vea
 * grande en el home de Android (comparable a los otros íconos del launcher).
 * El background bordó (#3f1d27) llena las esquinas — los launchers adaptables
 * lo recortan automáticamente al aplicar la shape del sistema (círculo/squircle).
 */
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0.05,
      resizeOptions: { background: '#3f1d27', fit: 'contain' },
    },
    apple: {
      sizes: [180],
      padding: 0.05,
      resizeOptions: { background: '#3f1d27', fit: 'contain' },
    },
  },
  images: ['public/logo-vg.png'],
})
