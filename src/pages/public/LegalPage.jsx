import "../../styles/legal.css";
import { useEffect } from "react";
import { Link } from "react-router";

export const CONTACT_EMAIL = "craneobarbero@gmail.com";
const LAST_UPDATE = "26 de noviembre de 2026";

function TermsContent() {
  return (
    <>
      <h1>Términos y condiciones</h1>
      <p className="legal-updated">Última actualización: {LAST_UPDATE}</p>

      <p>
        Al crear una cuenta en Cráneo Barbero aceptás estos términos. Si no estás de acuerdo con
        ellos, no uses el sitio.
      </p>

      <h2>1. Tu cuenta</h2>
      <ul>
        <li>Los datos que cargás tienen que ser verdaderos y estar actualizados.</li>
        <li>Tenés que verificar tu email para reservar turnos o comprar productos.</li>
        <li>La cuenta es personal: cuidá tu contraseña y no la compartas.</li>
        <li>Podés desactivar o eliminar tu cuenta cuando quieras desde "Mi cuenta".</li>
      </ul>

      <h2>2. Turnos</h2>
      <ul>
        <li>Los turnos online se pagan por adelantado con Mercado Pago. Tenés 30 minutos para pagar; si no, la reserva vence y el horario se libera.</li>
        <li>Podés reservar con hasta 60 días de anticipación.</li>
        <li>Podés modificar un turno hasta 4 horas antes de que empiece.</li>
        <li>Si cancelás con 4 horas o más de anticipación, te devolvemos el total. Si cancelás con menos de 4 horas, el pago no se devuelve.</li>
        <li>Si el local tiene que cancelar tu turno, te devolvemos el total y te avisamos por mail.</li>
      </ul>

      <h2>3. Tienda</h2>
      <ul>
        <li>Los productos se pagan con Mercado Pago y se retiran en la sucursal que elegiste.</li>
        <li>El pedido tiene 30 minutos para pagarse. Si al confirmarse el pago ya no hay stock, el pedido se cancela y se devuelve el dinero.</li>
        <li>Los precios pueden cambiar sin aviso, pero nunca cambia el precio de un turno o un pedido ya hecho.</li>
      </ul>

      <h2>4. Reseñas</h2>
      <p>
        Las reseñas tienen que ser respetuosas. Podemos ocultar comentarios ofensivos o que
        incluyan datos personales de otras personas.
      </p>

      <h2>5. Asistente de reservas</h2>
      <p>
        El asistente te ayuda a sacar un turno, pero siempre te muestra un resumen para que lo
        confirmes antes de reservar. Revisá los datos antes de confirmar.
      </p>

      <h2>6. Datos personales</h2>
      <p>
        El uso de tus datos se explica en la <Link to="/privacy">política de privacidad</Link>.
      </p>

      <h2>7. Contacto</h2>
      <p>
        Por cualquier consulta escribinos a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    </>
  );
}

function PrivacyContent() {
  return (
    <>
      <h1>Política de privacidad</h1>
      <p className="legal-updated">Última actualización: {LAST_UPDATE}</p>

      <p>
        Esta política explica qué datos personales guardamos, para qué los usamos y cómo podés
        ejercer tus derechos, según la Ley 25.326 de Protección de los Datos Personales.
      </p>

      <h2>1. Responsable</h2>
      <p>
        El responsable de los datos es Barbería Cráneo Barbero (Rosario, Santa Fe). Contacto:{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>

      <h2>2. Qué datos guardamos</h2>
      <ul>
        <li>Los de tu cuenta: nombre, email, teléfono (opcional), foto (opcional) y la fecha en que aceptaste estos términos. La contraseña se guarda cifrada y nadie puede leerla.</li>
        <li>Tus turnos, compras, pagos y reseñas.</li>
        <li>Los mails que te enviamos (confirmaciones, recordatorios y avisos).</li>
      </ul>
      <p>No guardamos datos de tarjetas: los pagos los procesa Mercado Pago.</p>

      <h2>3. Para qué los usamos</h2>
      <ul>
        <li>Gestionar tus turnos y pedidos, y avisarte por mail de confirmaciones, cambios y recordatorios.</li>
        <li>Procesar los pagos y los reembolsos.</li>
        <li>Armar estadísticas internas del local (los reportes no muestran datos de contacto).</li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros para publicidad.</p>

      <h2>4. Servicios que usamos</h2>
      <ul>
        <li>Mercado Pago, para cobrar los turnos y los productos.</li>
        <li>Brevo, para enviar los mails.</li>
        <li>Google Gemini, para entender los mensajes que le escribís al asistente de reservas. Solo se envía el texto del mensaje, nunca tu nombre ni tu email.</li>
        <li>Supabase, Render y Vercel, donde funcionan la base de datos y el sitio.</li>
      </ul>

      <h2>5. Quién ve tus datos</h2>
      <p>
        El barbero que te atiende ve tu nombre y tu teléfono para el turno. El personal
        administrativo del local puede ver los datos de tu cuenta para gestionar turnos y pedidos.
      </p>

      <h2>6. Tus derechos</h2>
      <ul>
        <li>Ver y corregir tus datos desde "Mi cuenta".</li>
        <li>Desactivar tu cuenta o eliminarla. Al eliminarla, tus turnos y compras pasados quedan sin tus datos, solo para las cuentas del local.</li>
        <li>Pedir acceso, corrección o eliminación escribiendo a <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</li>
      </ul>
      <p>
        Podés ejercer el derecho de acceso en forma gratuita cada seis meses, salvo que acredites
        un interés legítimo para hacerlo antes (artículo 14, inciso 3, de la Ley 25.326). La
        Agencia de Acceso a la Información Pública, como órgano de control de la Ley 25.326,
        atiende las denuncias y los reclamos por incumplimientos de las normas de protección de
        datos personales.
      </p>
    </>
  );
}

function LegalPage({ type }) {
  const isTerms = type === "terms";

  useEffect(() => {
    document.title = `${isTerms ? "Términos y condiciones" : "Política de privacidad"} | Cráneo Barbero`;
    window.scrollTo(0, 0);
  }, [isTerms]);

  return (
    <div className="legal-page page-transition">
      <article className="legal-card">{isTerms ? <TermsContent /> : <PrivacyContent />}</article>
    </div>
  );
}

export default LegalPage;
