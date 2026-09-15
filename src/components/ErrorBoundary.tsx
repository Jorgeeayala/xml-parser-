import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg border border-red-200 p-6 max-w-lg w-full text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                Ocurrió un error inesperado
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                La aplicación encontró una dificultad al procesar los datos.
              </p>
            </div>
            {this.state.error && (
              <div className="bg-slate-50 border border-slate-200 rounded p-3 text-left overflow-auto max-h-36">
                <p className="text-xs font-mono text-red-700 break-words">
                  {this.state.error.message || String(this.state.error)}
                </p>
              </div>
            )}
            <button
              onClick={this.handleReset}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-semibold hover:bg-slate-800 transition shadow"
            >
              <RefreshCw className="w-4 h-4" />
              Recargar aplicación
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
