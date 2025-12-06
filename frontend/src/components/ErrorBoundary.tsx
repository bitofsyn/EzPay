import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-8 text-center">
            <div className="text-red-500 mb-4">
              <svg
                className="mx-auto h-16 w-16"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              오류가 발생했습니다
            </h2>
            <p className="text-gray-600 mb-6">
              페이지를 표시하는 중에 문제가 발생했습니다.
            </p>
            {this.state.error && (
              <details className="text-left bg-gray-50 p-4 rounded mb-4">
                <summary className="cursor-pointer text-sm font-semibold text-gray-700">
                  오류 상세 정보
                </summary>
                <p className="mt-2 text-xs text-gray-600 font-mono">
                  {this.state.error.toString()}
                </p>
              </details>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
              페이지 새로고침
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
