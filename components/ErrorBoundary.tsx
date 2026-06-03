import React, { Component, ErrorInfo, ReactNode } from "react"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050505] text-white p-8 flex flex-col items-center justify-center font-sans">
          <div className="w-full max-w-2xl bg-white/5 border border-red-500/20 rounded-3xl p-8 backdrop-blur-xl">
            <h1 className="text-2xl font-bold mb-4 text-red-500">حدث خطأ تقني</h1>
            <p className="text-white/60 mb-6 text-sm">
              نأسف لذلك، يبدو أن هناك مشكلة في تحميل النظام. يرجى تزويدنا بتفاصيل الخطأ أدناه:
            </p>
            <div className="bg-black/50 rounded-xl p-4 overflow-auto max-h-64 border border-white/10">
              <code className="text-xs text-red-400 font-mono">
                {this.state.error?.toString()}
              </code>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-8 px-6 py-3 bg-red-500 hover:bg-red-600 rounded-xl font-bold transition-all text-sm"
            >
              إعادة تحميل الصفحة
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
