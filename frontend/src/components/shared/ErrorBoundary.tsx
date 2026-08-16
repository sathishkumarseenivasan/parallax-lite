'use client'

/**
 * ErrorBoundary — catches unhandled React render errors.
 *
 * Features:
 * - Displays a user-friendly error message with recovery button
 * - Prevents one broken component from crashing the entire app
 * - Logs error details for debugging
 *
 * Usage:
 *   <ErrorBoundary fallbackTitle="Chart failed to render">
 *     <AgentTelemetry />
 *   </ErrorBoundary>
 */
import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface ErrorBoundaryProps {
  children: ReactNode
  /** Custom fallback UI to render instead of the default. */
  fallback?: ReactNode
  /** Title shown in the default fallback. Defaults to "Something went wrong". */
  fallbackTitle?: string
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Structured error logging — no raw console.log
    if (process.env.NODE_ENV === 'development') {
      console.error(
        `[ErrorBoundary] Component crash:\n` +
        `  Error: ${error.message}\n` +
        `  Stack: ${info.componentStack?.slice(0, 300)}`
      )
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback

      return (
        <div className="flex flex-col items-center justify-center p-8 bg-rose-50/50 border border-rose-200 rounded-lg text-center">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
            style={{ background: '#FEE2E2' }}
          >
            <AlertTriangle size={18} style={{ color: '#E11D48' }} />
          </div>
          <p className="text-sm font-semibold text-red-700 mb-1">
            {this.props.fallbackTitle ?? 'Something went wrong'}
          </p>
          <p className="text-xs text-rose-500 font-mono mb-3 max-w-sm">
            {this.state.error?.message ?? 'An unexpected error occurred.'}
          </p>
          <button
            onClick={this.handleRetry}
            className="btn btn-default text-xs"
          >
            <RefreshCw size={12} />
            Try Again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
