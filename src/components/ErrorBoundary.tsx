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
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in Wasel Delivery:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      const errorMsg = this.state.error?.message || 'خطأ غير معروف';
      const isDomainError = errorMsg.includes('unauthorized-domain') || errorMsg.includes('auth/unauthorized-domain');

      return (
        <div className="max-w-[480px] mx-auto min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 text-center font-sans" dir="rtl">
          <div className="w-16 h-16 bg-red-100 text-[#F44336] rounded-full flex items-center justify-center text-3xl mb-4 shadow-sm">
            <i className="fa-solid fa-triangle-exclamation"></i>
          </div>

          <h2 className="text-xl font-bold text-[#263238] mb-2">تنبيه أثناء تشغيل التطبيق</h2>

          {isDomainError ? (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 text-sm text-right mb-4">
              <p className="font-bold mb-1">
                <i className="fa-solid fa-shield-halved ml-1 text-amber-600"></i> النطاق غير مصرح به في Firebase:
              </p>
              <p className="text-xs text-amber-800 leading-relaxed mb-2">
                يجب إضافة نطاق GitHub Pages الخاص بك إلى قائمة النطاقات المصرح بها في لوحة تحكم Firebase:
              </p>
              <ol className="text-xs list-decimal list-inside space-y-1 text-amber-900 font-mono">
                <li>Firebase Console</li>
                <li>Authentication &gt; Settings</li>
                <li>Authorized domains &gt; Add domain</li>
                <li>أضف: <span className="font-bold bg-white px-1 rounded">{window.location.hostname}</span></li>
              </ol>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-100 text-red-800 rounded-xl p-3 text-xs mb-4 max-w-full overflow-x-auto text-left font-mono" dir="ltr">
              {errorMsg}
            </div>
          )}

          <button
            onClick={() => window.location.reload()}
            className="bg-[#FF5722] text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-md shadow-[#FF5722]/30 active:scale-95 transition"
          >
            <i className="fa-solid fa-rotate-right ml-1"></i> إعادة المحاولة
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
