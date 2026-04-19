import { Component } from 'react'
import './ErrorBoundary.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/'
  }

  render() {
    if (!this.state.hasError) return this.props.children

    const isDev = import.meta.env.DEV

    return (
      <div className="error-boundary">
        <div className="error-boundary__card">
          <span className="error-boundary__icon">⚠</span>
          <h2 className="error-boundary__title">Algo salió mal</h2>
          <p className="error-boundary__message">
            {isDev && this.state.error
              ? this.state.error.message
              : 'Ocurrió un error inesperado. Intentá volver al inicio.'}
          </p>
          <button className="error-boundary__btn" onClick={this.handleReset}>
            Volver al inicio
          </button>
        </div>
      </div>
    )
  }
}
