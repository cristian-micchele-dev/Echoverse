import { useNavigate } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import './PrivacyPage.css'

export default function PrivacyPage() {
  const navigate = useNavigate()

  return (
    <div className="legal-page">
      <Helmet>
        <title>Política de Privacidad — EchoVerse</title>
      </Helmet>

      <div className="legal-container">
        <button className="legal-back" onClick={() => navigate(-1)}>← Volver</button>

        <h1 className="legal-title">Política de Privacidad</h1>
        <p className="legal-date">Última actualización: abril 2026</p>

        <section className="legal-section">
          <h2>1. Quiénes somos</h2>
          <p>
            EchoVerse es una plataforma de entretenimiento que permite chatear con personajes
            ficticios icónicos mediante inteligencia artificial. Este documento explica qué datos
            recopilamos, para qué los usamos y cómo los protegemos.
          </p>
        </section>

        <section className="legal-section">
          <h2>2. Datos que recopilamos</h2>
          <ul>
            <li><strong>Cuenta:</strong> dirección de email y nombre de usuario elegido al registrarse.</li>
            <li><strong>Actividad:</strong> historial de chats, estadísticas de uso (afinidad con personajes, misiones completadas, logros).</li>
            <li><strong>Datos técnicos:</strong> dirección IP (usada para rate limiting y seguridad), tipo de navegador.</li>
          </ul>
          <p>No recopilamos nombre real, fecha de nacimiento, número de teléfono ni datos de pago.</p>
        </section>

        <section className="legal-section">
          <h2>3. Cómo usamos tus datos</h2>
          <ul>
            <li>Gestionar tu cuenta y autenticación.</li>
            <li>Guardar tu progreso y preferencias dentro de la plataforma.</li>
            <li>Detectar y prevenir usos abusivos o fraudulentos.</li>
            <li>Mejorar la experiencia general del servicio.</li>
          </ul>
          <p>No vendemos, alquilamos ni compartimos tu información personal con terceros para fines comerciales.</p>
        </section>

        <section className="legal-section">
          <h2>4. Almacenamiento y seguridad</h2>
          <p>
            Tus datos se almacenan en <strong>Supabase</strong> (infraestructura en la nube con cifrado
            en reposo y en tránsito). El historial de chats también se guarda localmente en tu
            navegador (localStorage) y nunca se transmite a terceros.
          </p>
        </section>

        <section className="legal-section">
          <h2>5. Edad mínima</h2>
          <p>
            EchoVerse está destinado a personas de <strong>13 años o más</strong>. Si tenés menos
            de 13 años, no podés registrarte ni usar el servicio. Si tomamos conocimiento de que un
            usuario menor de 13 años ha creado una cuenta, la eliminaremos de inmediato.
          </p>
        </section>

        <section className="legal-section">
          <h2>6. Cookies y almacenamiento local</h2>
          <p>
            Usamos <strong>localStorage</strong> del navegador para guardar preferencias y el historial
            de chats localmente. Supabase puede utilizar cookies de sesión para mantener tu sesión
            activa. No usamos cookies de seguimiento ni publicidad.
          </p>
        </section>

        <section className="legal-section">
          <h2>7. Tus derechos</h2>
          <p>Tenés derecho a:</p>
          <ul>
            <li><strong>Acceder</strong> a los datos que tenemos sobre vos.</li>
            <li><strong>Rectificar</strong> datos incorrectos.</li>
            <li><strong>Eliminar</strong> tu cuenta y todos tus datos.</li>
            <li><strong>Oponerte</strong> al procesamiento de tus datos.</li>
          </ul>
          <p>
            Para ejercer cualquiera de estos derechos, podés eliminar tu cuenta desde el perfil o
            contactarnos directamente.
          </p>
        </section>

        <section className="legal-section">
          <h2>8. Cambios a esta política</h2>
          <p>
            Podemos actualizar esta política ocasionalmente. Te notificaremos sobre cambios
            significativos mediante un aviso visible en la plataforma. El uso continuado del servicio
            tras la notificación implica la aceptación de los cambios.
          </p>
        </section>

        <section className="legal-section">
          <h2>9. Contacto</h2>
          <p>
            Si tenés preguntas sobre esta política o sobre tus datos, podés contactarnos a través de
            nuestro perfil de GitHub o mediante los canales de la comunidad de EchoVerse.
          </p>
        </section>
      </div>
    </div>
  )
}
