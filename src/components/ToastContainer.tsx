import React from 'react';
import { useApp } from '../context/AppContext';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-20 left-0 right-0 z-50 flex flex-col items-center pointer-events-none space-y-2 px-4">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success';
        return (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto cursor-pointer max-w-sm px-4 py-3 rounded-xl shadow-xl text-sm font-bold flex items-center gap-2 transition-all duration-300 transform animate-in fade-in slide-in-from-bottom-5 ${
              isSuccess
                ? 'bg-[#263238] text-white border-r-4 border-[#4CAF50]'
                : 'bg-[#F44336] text-white'
            }`}
          >
            <i
              className={`fa-solid ${
                isSuccess ? 'fa-circle-check text-[#4CAF50]' : 'fa-circle-exclamation text-white'
              }`}
            />
            <span>{toast.message}</span>
          </div>
        );
      })}
    </div>
  );
};
