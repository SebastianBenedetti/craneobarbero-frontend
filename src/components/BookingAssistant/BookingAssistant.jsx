import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import "../../styles/assistant.css";
import { sendAssistantMessage } from "../../services/assistant.services";
import { resendVerificationEmail } from "../../services/appointments.services";
import { formatMoney } from "../../utils/format";

const AVATAR = "\u{1F469}\u{1F3FD}‍\u{1F4BB}";
const MAX_LENGTH = 300;

let nextId = 1;
const entry = (from, data) => ({ id: nextId++, from, ...data });

function Avatar() {
  return (
    <span className="assistant-avatar" aria-hidden="true">
      {AVATAR}
    </span>
  );
}

function SummaryCard({ summary }) {
  return (
    <div className="assistant-summary">
      <div className="assistant-summary-title">Resumen del turno</div>
      <dl>
        <dt>Sucursal</dt>
        <dd>
          {summary.branchName}
          <span className="assistant-summary-muted">{summary.branchAddress}</span>
        </dd>
        <dt>Barbero</dt>
        <dd>{summary.barberName}</dd>
        <dt>Servicio</dt>
        <dd>
          {summary.cutName}
          <span className="assistant-summary-muted">{summary.durationMinutes} min</span>
        </dd>
        <dt>Día y hora</dt>
        <dd>
          {summary.dateLabel} · {summary.time} h
        </dd>
        <dt>A pagar</dt>
        <dd className="assistant-summary-total">{formatMoney(summary.price)}</dd>
      </dl>
    </div>
  );
}

function BookingAssistant({ bottomOffset = false }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [conversationId, setConversationId] = useState(null);
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState("");
  const [needsVerification, setNeedsVerification] = useState(false);
  const [resendState, setResendState] = useState("");
  const started = useRef(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);
  const fabRef = useRef(null);

  const talk = async (request, clientText) => {
    if (loading) return;
    if (clientText) setMessages((current) => [...current, entry("client", { text: clientText })]);
    setOptions([]);
    setLoading(true);
    try {
      const data = await sendAssistantMessage({ conversationId, ...request });
      setConversationId(data.conversationId);
      setMessages((current) => [
        ...current,
        entry("assistant", { text: data.reply, summary: data.summary, checkoutUrl: data.checkoutUrl, done: data.step === "done" }),
      ]);
      setOptions(data.options ?? []);
    } catch (err) {
      if (err.code === "email_not_verified") {
        setNeedsVerification(true);
        setMessages((current) => [
          ...current,
          entry("assistant", {
            text: "Para reservar un turno primero tenés que verificar tu email. Revisá tu casilla o pedime que te reenvíe el mail.",
          }),
        ]);
      } else {
        setMessages((current) => [...current, entry("assistant", { text: err.message, error: true })]);
        setOptions([{ label: "Reintentar", value: "__retry", request }]);
      }
    } finally {
      setLoading(false);
    }
  };

  const openAssistant = () => {
    setOpen(true);
    if (!started.current) {
      started.current = true;
      talk({});
    }
  };

  const close = () => {
    setOpen(false);
    fabRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
        fabRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [messages, loading, options, open]);

  const choose = (option) => {
    if (option.value === "__retry") {
      talk(option.request);
      return;
    }
    talk({ choice: option.value }, option.label);
  };

  const submit = (event) => {
    event.preventDefault();
    const text = input.trim();
    if (!text) return;
    setInput("");
    talk({ message: text.slice(0, MAX_LENGTH) }, text);
  };

  const resend = async () => {
    setResendState("sending");
    try {
      await resendVerificationEmail();
      setResendState("sent");
    } catch (err) {
      setResendState(err.message);
    }
  };

  return (
    <>
      {!open && (
        <button
          ref={fabRef}
          type="button"
          className={`assistant-fab${bottomOffset ? " assistant-fab--stacked" : ""}`}
          onClick={openAssistant}
          aria-label="Abrir el asistente de reservas"
          title="Asistente de reservas"
        >
          <span aria-hidden="true">{AVATAR}</span>
        </button>
      )}

      {open && (
        <section
          className={`assistant-window${bottomOffset ? " assistant-window--stacked" : ""}`}
          role="dialog"
          aria-modal="false"
          aria-labelledby="assistant-title"
        >
          <header className="assistant-header">
            <Avatar />
            <h2 id="assistant-title" className="assistant-title">
              Asistente de Cráneo Barbero
            </h2>
            <button type="button" className="assistant-close" onClick={close} aria-label="Cerrar el asistente">
              <i className="ti ti-x" aria-hidden="true" />
            </button>
          </header>

          <div className="assistant-messages" ref={listRef} aria-live="polite">
            {messages.map((message) =>
              message.from === "client" ? (
                <div key={message.id} className="assistant-row assistant-row--client">
                  <div className="assistant-bubble assistant-bubble--client">{message.text}</div>
                </div>
              ) : (
                <div key={message.id} className="assistant-row">
                  <Avatar />
                  <div className="assistant-content">
                    <div className={`assistant-bubble${message.error ? " assistant-bubble--error" : ""}`}>
                      {message.text.split("\n").map((line, index) => (
                        <p key={index}>{line}</p>
                      ))}
                    </div>
                    {message.summary && <SummaryCard summary={message.summary} />}
                    {message.checkoutUrl && (
                      <a className="assistant-checkout" href={message.checkoutUrl}>
                        Pagar con Mercado Pago
                      </a>
                    )}
                    {message.done && !message.checkoutUrl && (
                      <Link className="assistant-checkout assistant-checkout--secondary" to="/my-account/appointments" onClick={close}>
                        Ir a Mis turnos
                      </Link>
                    )}
                  </div>
                </div>
              ),
            )}

            {needsVerification && (
              <div className="assistant-options">
                <button
                  type="button"
                  className="assistant-option"
                  onClick={resend}
                  disabled={resendState === "sending" || resendState === "sent"}
                >
                  {resendState === "sent" ? "Mail enviado" : "Reenviar el mail de verificación"}
                </button>
                {resendState && !["sending", "sent"].includes(resendState) && (
                  <p className="assistant-note">{resendState}</p>
                )}
              </div>
            )}

            {loading && (
              <div className="assistant-row">
                <Avatar />
                <div className="assistant-bubble assistant-typing" aria-label="El asistente está escribiendo">
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {!loading && options.length > 0 && (
              <div className="assistant-options" role="group" aria-label="Opciones">
                {options.map((option) => (
                  <button key={option.value} type="button" className="assistant-option" onClick={() => choose(option)}>
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form className="assistant-form" onSubmit={submit}>
            <label htmlFor="assistant-input" className="visually-hidden">
              Escribile al asistente
            </label>
            <input
              id="assistant-input"
              ref={inputRef}
              className="assistant-input"
              value={input}
              maxLength={MAX_LENGTH}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribí, por ejemplo: el sábado a la mañana"
              disabled={needsVerification}
              autoComplete="off"
            />
            <button
              type="submit"
              className="assistant-send"
              disabled={loading || needsVerification || !input.trim()}
              aria-label="Enviar"
            >
              <i className="ti ti-send" aria-hidden="true" />
            </button>
          </form>
        </section>
      )}
    </>
  );
}

export default BookingAssistant;
