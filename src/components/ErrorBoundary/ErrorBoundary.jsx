import { Component } from "react";
import "../../styles/home.css";
import "../../styles/notFound.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Error no controlado en la pantalla", error, info?.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="notfound-container" role="alert">
        <div className="notfound-content">
          <i className="ti ti-alert-triangle notfound-icon" />
          <h1 className="notfound-title">Algo salió mal</h1>
          <p className="notfound-subtitle">
            Tuvimos un problema al mostrar esta pantalla. Probá recargar la página.
          </p>
          <div className="notfound-actions">
            <button className="btn-cta" onClick={() => window.location.reload()}>
              <i className="ti ti-refresh" />
              Recargar
            </button>
            <button className="btn-outline-custom" onClick={() => window.location.assign("/")}>
              Volver al inicio
            </button>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
