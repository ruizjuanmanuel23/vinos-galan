import { IMG } from '../data/catalogoDestacado'

export default function Nosotros() {
  return (
    <div className="text-white">
      {/* HERO */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMG.vineyardSunset})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-botella-950/70 via-botella-950/85 to-botella-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Nuestra historia</p>
          <h1 className="text-5xl sm:text-7xl font-black mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            Tres generaciones<br />de pasión por el vino
          </h1>
          <p className="text-lg text-botella-200 max-w-2xl mx-auto leading-relaxed">
            Desde que Antonio González desembarcó en 1942, somos una familia
            comprometida con la cultura del vino en La Plata.
          </p>
        </div>
      </section>

      {/* TIMELINE */}
      <section className="py-20 bg-botella-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-16">
            {[
              {
                year: '1942',
                title: 'El comienzo, en un carro',
                text: 'Antonio González llega a Buenos Aires desde Lamela, Pontevedra. Con la determinación del inmigrante, empieza el reparto de vinos con un carro tirado por caballos. Era el inicio de algo que iba a durar generaciones.'
              },
              {
                year: '1950s',
                title: 'Crecimiento y familia',
                text: 'La empresa familiar suma manos: parientes y amigos que vienen de España. El reparto se expande, primero por barrios y después por ciudades. Campana, Junín, Azul, Mar del Plata.'
              },
              {
                year: '1960s',
                title: 'Llega a La Plata',
                text: 'Se abre la sucursal platense en Calle 45 entre 22 y 23. La ciudad universitaria descubre el reparto de Galán: los Dodge D-100 verdes con damajuanas se vuelven parte del paisaje urbano.'
              },
              {
                year: '1972',
                title: 'De distribuidores a productores',
                text: 'Antonio compra su primer campo en San Martín, Mendoza. La idea es ambiciosa: dejar de comprar vinos a terceros y producirlos en casa, controlando cada etapa del proceso.'
              },
              {
                year: '1977',
                title: 'Nace la bodega propia',
                text: 'Se inaugura la bodega en Alto Verde, Mendoza. Las uvas Cabernet, Malbec, Bonarda, Syrah y Merlot empiezan a vinificarse bajo la propia etiqueta. Una nueva etapa para la marca.'
              },
              {
                year: 'Hoy',
                title: 'La misma filosofía, otros desafíos',
                text: 'Más de ocho décadas después, seguimos en Calle 45. Cambiaron los Dodge por las Citroën Traffic, llegó internet, llegaron las apps. Lo que no cambia es el oficio: elegir vino bueno y llevarlo con respeto a cada mesa.'
              },
            ].map((e, i) => (
              <div key={i} className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start group">
                <div className="md:col-span-3">
                  <div className="inline-block bg-dorado-500/10 border border-dorado-500/30 rounded-xl px-5 py-3 group-hover:bg-dorado-500/20 transition">
                    <div className="text-3xl sm:text-4xl font-black text-dorado-400 leading-none" style={{ fontFamily: 'Georgia, serif' }}>
                      {e.year}
                    </div>
                  </div>
                </div>
                <div className="md:col-span-9 border-l-2 border-dorado-500/30 pl-6 md:pl-8">
                  <h3 className="text-2xl sm:text-3xl font-black mb-3" style={{ fontFamily: 'Georgia, serif' }}>
                    {e.title}
                  </h3>
                  <p className="text-botella-200 leading-relaxed">{e.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* QUOTE */}
      <section className="py-20 bg-gradient-to-br from-botella-900 via-botella-950 to-botella-900 relative overflow-hidden">
        <div
          className="absolute inset-0 opacity-15 bg-cover bg-center"
          style={{ backgroundImage: `url(${IMG.glassRed})` }}
        />
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <svg className="w-12 h-12 mx-auto mb-6 text-dorado-400 opacity-70" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.5 7c-2.5 0-4.5 2-4.5 4.5v.5h3v6h-6V11c0-4.4 3.6-8 8-8v4zm10 0c-2.5 0-4.5 2-4.5 4.5v.5h3v6h-6V11c0-4.4 3.6-8 8-8v4z" />
          </svg>
          <blockquote className="text-2xl sm:text-3xl font-light italic text-white leading-relaxed mb-6" style={{ fontFamily: 'Georgia, serif' }}>
            "El repartidor de Vinos Galán siempre fue un amigo de la casa.
            Más familiar que el cartero o el sodero."
          </blockquote>
          <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold">
            — Crónica platense
          </p>
        </div>
      </section>

      {/* VARIETALES */}
      <section className="py-20 bg-botella-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Nuestra producción</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-4" style={{ fontFamily: 'Georgia, serif' }}>
              De Mendoza a tu mesa
            </h2>
            <p className="text-botella-300 max-w-2xl mx-auto">
              Vinificamos en Alto Verde con uvas de nuestros propios viñedos de San Martín.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['Cabernet Sauvignon', 'Malbec', 'Bonarda', 'Syrah', 'Merlot', 'Torrontés', 'Chardonnay', 'Damajuana Tinto']
              .map(v => (
                <div
                  key={v}
                  className="bg-botella-900/40 border border-botella-700/40 rounded-xl p-4 text-center hover:border-dorado-500/50 transition"
                >
                  <div className="text-2xl mb-2">🍇</div>
                  <p className="font-bold text-sm">{v}</p>
                </div>
              ))}
          </div>
        </div>
      </section>
    </div>
  )
}
