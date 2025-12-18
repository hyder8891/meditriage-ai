import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Component, ReactNode, ErrorInfo } from "react";
import { useLanguage } from '@/contexts/LanguageContext';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
          <div className="flex flex-col items-center w-full max-w-2xl p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-xl">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6">
              <AlertTriangle className="w-8 h-8 text-red-600 dark:text-red-400" />
            </div>

            <h2 className="text-3xl font-bold text-center mb-4 text-slate-900 dark:text-white">
              عذراً، حدث خطأ
            </h2>
            <p className="text-center text-slate-600 dark:text-slate-300 mb-6">
              حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى أو العودة إلى الصفحة الرئيسية.
            </p>

            {this.state.error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6 w-full">
                <p className="font-mono text-sm text-red-800 dark:text-red-300 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg",
                  "bg-blue-600 text-white hover:bg-blue-700",
                  "transition-colors duration-200"
                )}
              >
                <RotateCcw size={18} />
                إعادة المحاولة
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className={cn(
                  "flex items-center gap-2 px-6 py-3 rounded-lg",
                  "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white",
                  "hover:bg-slate-300 dark:hover:bg-slate-600",
                  "transition-colors duration-200"
                )}
              >
                <Home size={18} />
                العودة للرئيسية
              </button>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
              <details className="mt-6 w-full">
                <summary className="cursor-pointer text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white">
                  عرض تفاصيل الخطأ (وضع التطوير)
                </summary>
                <pre className="mt-4 p-4 bg-slate-100 dark:bg-slate-900 rounded-lg text-xs overflow-auto max-h-64">
                  {this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
