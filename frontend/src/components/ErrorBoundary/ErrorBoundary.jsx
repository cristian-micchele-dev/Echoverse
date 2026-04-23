import { Component } from 'react'
import './ErrorBoundary.css'

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    const isChunkError =
      error?.name === 'ChunkLoadError' ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('Importing a module script failed')

    if (isChunkError) {
      const last = parseInt(sessionStorage.getItem('eb-chunk-reload') || '0')
      if (Date.now() - last > 10000) {
        sessionStorage.setItem('eb-chunk-reload', String(Date.now()))
        window.location.reload()
        return { hasError: false, error: null }
      }
    }

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
