import { IMG } from '../data/catalogoDestacado'
import { WHATSAPP_NUM, TELEFONO_VISIBLE, EMAIL, DIRECCION, DIRECCION_CIUDAD, HORARIO, whatsappLink } from '../data/config'

export default function Contacto() {
  return (
    <div className="text-white">
      {/* HERO */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{ backgroundImage: `url(${IMG.grapes})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-botella-950 via-botella-950/80 to-botella-950" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Contacto</p>
          <h1 className="text-5xl sm:text-7xl font-black mb-4" style={{ fontFamily: 'Georgia, serif' }}>
            Hablemos
          </h1>
          <p className="text-botella-200 max-w-xl mx-auto text-lg">
            Pedidos, consultas y cualquier cosa que necesites. Estamos para vos.
          </p>
        </div>
      </section>

      {/* CARDS */}
      <section className="py-12 sm:py-16 bg-botella-950">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          <a
            href={whatsappLink('Hola, quería consultar por Vinos Galán')}
            target="_blank"
            rel="noreferrer"
            className="group bg-emerald-600/10 hover:bg-emerald-600/20 border border-emerald-500/30 hover:border-emerald-400 rounded-2xl p-8 transition text-center"
          >
            <div className="text-5xl mb-3">💬</div>
            <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'Georgia, serif' }}>WhatsApp</h3>
            <p className="text-sm text-emerald-300 font-bold mb-2">{TELEFONO_VISIBLE}</p>
            <p className="text-xs text-botella-300">Nahuel García · Pedidos y consultas</p>
          </a>

          <a
            href={`tel:+${WHATSAPP_NUM}`}
            className="group bg-botella-900/40 hover:bg-botella-800/60 border border-botella-700 hover:border-dorado-400 rounded-2xl p-8 transition text-center"
          >
            <div className="text-5xl mb-3">📞</div>
            <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'Georgia, serif' }}>Teléfono</h3>
            <p className="text-sm text-dorado-300 font-bold mb-2">{TELEFONO_VISIBLE}</p>
            <p className="text-xs text-botella-300">Lunes a sábado, 9 a 20 hs.</p>
          </a>

          <a
            href={`mailto:${EMAIL}`}
            className="group bg-botella-900/40 hover:bg-botella-800/60 border border-botella-700 hover:border-dorado-400 rounded-2xl p-8 transition text-center"
          >
            <div className="text-5xl mb-3">✉️</div>
            <h3 className="font-black text-xl mb-2" style={{ fontFamily: 'Georgia, serif' }}>Email</h3>
            <p className="text-xs text-dorado-300 font-bold mb-2 break-all">{EMAIL}</p>
            <p className="text-xs text-botella-300">Consultas mayoristas</p>
          </a>
        </div>
      </section>

      {/* SUCURSAL */}
      <section className="py-16 sm:py-20 bg-gradient-to-b from-botella-950 to-botella-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-dorado-400 font-semibold mb-3">Sucursal La Plata</p>
            <h2 className="text-4xl sm:text-5xl font-black mb-6 leading-tight" style={{ fontFamily: 'Georgia, serif' }}>
              Vení a la sucursal
            </h2>

            <div className="space-y-4 text-botella-200">
              <div className="flex gap-3">
                <span className="text-dorado-400 text-xl shrink-0">📍</span>
                <div>
                  <p className="font-bold text-white">{DIRECCION}</p>
                  <p className="text-sm">{DIRECCION_CIUDAD}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-dorado-400 text-xl shrink-0">🕐</span>
                <div>
                  <p className="font-bold text-white">Horario de atención</p>
                  <p className="text-sm">{HORARIO.semana}</p>
                  <p className="text-sm">{HORARIO.sabado}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="text-dorado-400 text-xl shrink-0">🚚</span>
                <div>
                  <p className="font-bold text-white">Reparto a domicilio</p>
                  <p className="text-sm">En toda La Plata y alrededores. Coordinámoslo por teléfono o WhatsApp.</p>
                </div>
              </div>
            </div>

            <a
              href="https://www.google.com/maps/search/?api=1&query=Calle+45+entre+22+y+23,+La+Plata,+Buenos+Aires"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 mt-8 px-5 py-3 rounded-xl bg-botella-800 hover:bg-botella-700 border border-botella-600 hover:border-dorado-500 text-white font-bold transition"
            >
              Ver en Google Maps
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M7 17L17 7M17 7H8M17 7v9" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          </div>

          <div className="aspect-square rounded-2xl overflow-hidden ring-1 ring-dorado-500/20 shadow-2xl">
            <iframe
              title="Sucursal"
              src="https://www.openstreetmap.org/export/embed.html?bbox=-57.96%2C-34.93%2C-57.94%2C-34.91&layer=mapnik&marker=-34.92%2C-57.95"
              className="w-full h-full grayscale"
              loading="lazy"
            />
          </div>
        </div>
      </section>
    </div>
  )
}
