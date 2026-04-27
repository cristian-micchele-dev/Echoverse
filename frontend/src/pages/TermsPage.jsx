import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './PrivacyPage.css'

export default function TermsPage() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <Helmet>
        <title>Términos y Condiciones — EchoVerse</title>
      </Helmet>

      <div className="legal-container">
        <button className="legal-back" onClick={() => navigate(-1)}>← Volver</button>

        <h1 className="legal-title">Términos y Condiciones</h1>
        <p className="legal-date">Última actualización: abril 2026</p>

        <section className="legal-section">
          <h2>1. Aceptación</h2>
          <p>
            Al crear una cuenta en EchoVerse, aceptás estos Términos y Condiciones en su totalidad.
            Si no estás de acuerdo con alguna parte, no podés usar el servicio.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Descripción del servicio</h2>
          <p>
            EchoVerse es una plataforma de entretenimiento que permite interactuar con personajes
            ficticios mediante inteligencia artificial. Las respuestas son generadas por IA y son
            ficticias — no representan las opiniones, palabras reales ni el carácter de personas
            reales o de los creadores de las obras originales.
          </p>
        </section>

        <section className="legal-section">
          <h2>3. Edad mínima</h2>
          <p>
            Debés tener al menos <strong>13 años</strong> para usar EchoVerse. Al registrarte,
            declarás que cumplís con este requisito. Los menores de 13 años tienen prohibido
            registrarse o usar el servicio.
          </p>
        </section>

        <section className="legal-section">
          <h2>4. Uso aceptable</h2>
          <p>Al usar EchoVerse, te comprometés a:</p>
          <ul>
            <li>No usar el servicio para fines ilegales o fraudulentos.</li>
            <li>No intentar vulnerar, hackear o sobrecargar la infraestructura.</li>
            <li>No usar la plataforma para generar contenido que incite al odio, violencia o discriminación.</li>
            <li>No hacerse pasar por otras personas o crear cuentas falsas.</li>
            <li>No intentar extraer o hacer scraping masivo del contenido generado.</li>
          </ul>
        </section>

        <section className="legal-section">
          <h2>5. Contenido generado</h2>
          <p>
            Las conversaciones con los personajes son generadas por IA y pueden contener
            referencias a violencia, lenguaje adulto o situaciones dramáticas consistentes
            con las obras originales de los personajes. El contenido es de naturaleza
            ficticia y de entretenimiento.
          </p>
          <p>
            EchoVerse no se responsabiliza por el uso que hagas del contenido generado
            ni por decisiones tomadas basándose en respuestas de la IA.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Propiedad intelectual</h2>
          <p>
            Los personajes representados en EchoVerse son propiedad de sus respectivos
            creadores y titulares de derechos. EchoVerse es un proyecto de entretenimiento
            sin fines de lucro que no reclama derechos sobre los personajes ficticios.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Cuentas y moderación</h2>
          <p>
            Nos reservamos el derecho de suspender o eliminar cuentas que violen estos
            términos, sin previo aviso y sin obligación de reembolso. Las decisiones de
            moderación son definitivas.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Disponibilidad del servicio</h2>
          <p>
            EchoVerse se brinda "tal como está". No garantizamos disponibilidad continua,
            y podemos modificar, suspender o discontinuar funciones en cualquier momento.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Limitación de responsabilidad</h2>
          <p>
            EchoVerse no será responsable por daños directos, indirectos, incidentales o
            consecuentes derivados del uso o la imposibilidad de uso del servicio.
          </p>
        </section>

        <section className="legal-section">
          <h2>10. Cambios a los términos</h2>
          <p>
            Podemos actualizar estos términos. El uso continuado del servicio tras la
            publicación de los cambios implica tu aceptación. Te recomendamos revisarlos
            periódicamente.
          </p>
        </section>
      </div>
    </div>
  )
}
