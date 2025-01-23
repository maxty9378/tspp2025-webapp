import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
    // Log error to monitoring service
    this.logError(error, errorInfo);
  }

  private logError(error: Error, errorInfo: ErrorInfo) {
    // Here you would implement error logging to your monitoring service
    console.error('Error details:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 text-center">
          <div className="card bg-red-500/10 border border-red-500/30 p-8 max-w-md w-full">
            <h2 className="text-2xl font-semibold text-red-300 mb-4">
              Что-то пошло не так
            </h2>
            <p className="text-slate-300 mb-4">
              Произошла ошибка при загрузке компонента. Пожалуйста, обновите страницу.
            </p>
            {this.state.error && (
              <pre className="text-sm text-red-300 bg-red-500/5 p-4 rounded-lg mb-6 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-red-500/20 text-red-300 border border-red-500/30 py-3 px-6 rounded-lg hover:bg-red-500/30 transition-colors font-medium"
            >
              Обновить страницу
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}