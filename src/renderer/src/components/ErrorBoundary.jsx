import React from 'react'

/**
 * Catches unexpected React render errors and shows a friendly recovery UI
 * instead of crashing the entire window.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    return { error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center h-full bg-slate-900 text-slate-300 p-8">
          <div className="max-w-lg text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold text-white mb-2">Jotain meni pieleen</h2>
            <p className="text-sm text-slate-400 mb-6">
              {this.state.error?.message || 'Tuntematon virhe'}
            </p>
            <button
              onClick={() => this.setState({ error: null, errorInfo: null })}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-lg transition-colors"
            >
              Yritä uudelleen
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
