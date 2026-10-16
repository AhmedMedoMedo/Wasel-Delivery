import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const RoleSelectScreen: React.FC = () => {
  const { setCurrentScreen, setCurrentRoleSelecting, showToast } = useApp();
  const [tapCount, setTapCount] = useState(0);
  const tapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check URL on mount for secret access: e.g. ?admin or #admin
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('admin') || window.location.hash.toLowerCase().includes('admin')) {
      handleSelectRole('admin');
    }
  }, []);

  const handleSelectRole = (role: 'restaurant' | 'driver' | 'admin') => {
    setCurrentRoleSelecting(role);
    setCurrentScreen('screen-login');
  };

  // Secret 5-tap gesture on the logo to open Admin portal
  const handleSecretLogoTap = () => {
    if (tapTimeoutRef.current) clearTimeout(tapTimeoutRef.current);

    const nextCount = tapCount + 1;
    if (nextCount >= 5) {
      setTapCount(0);
      showToast('🔓 تم فتح بوابة الإدارة السرية');
      handleSelectRole('admin');
      return;
    }

    setTapCount(nextCount);
    tapTimeoutRef.current = setTimeout(() => {
      setTapCount(0);
    }, 2500);
  };

  return (
    <div className="flex flex-col min-h-screen justify-between items-center p-6 bg-white selection:bg-[#FF5722] selection:text-white">
      {/* Top spacer */}
      <div className="w-full"></div>

      {/* Main Content */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Logo with secret 5-tap mechanism */}
        <button
          onClick={handleSecretLogoTap}
          type="button"
          title="وصل دليفري"
          className="w-32 h-32 bg-[#FF5722] rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-[#FF5722]/30 active:scale-95 transition cursor-pointer select-none"
        >
          <i className="fa-solid fa-motorcycle text-6xl text-white"></i>
        </button>

        <h1 className="text-3xl font-black text-[#263238] mb-2 tracking-tight">وصل دليفري</h1>
        <p className="text-gray-500 mb-10 text-center text-sm font-medium">
          المنصة الأسرع لربط المطاعم بمندوبي التوصيل
        </p>

        {/* Public Roles Only (Restaurant & Driver) */}
        <div className="w-full space-y-3.5">
          <button
            onClick={() => handleSelectRole('restaurant')}
            className="w-full bg-[#263238] hover:bg-[#1a2327] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition active:scale-95 shadow-md shadow-gray-900/10"
          >
            <i className="fa-solid fa-store text-lg text-emerald-400"></i>
            <span>دخول كمطعم</span>
          </button>

          <button
            onClick={() => handleSelectRole('driver')}
            className="w-full bg-[#FF5722] hover:bg-[#f4511e] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition active:scale-95 shadow-md shadow-[#FF5722]/25"
          >
            <i className="fa-solid fa-helmet-safety text-lg text-amber-200"></i>
            <span>دخول كمندوب</span>
          </button>
        </div>
      </div>

      {/* Footer with subtle hidden admin entrance */}
      <div className="w-full text-center text-xs text-gray-400 pb-2 flex items-center justify-center gap-2">
        <span>نظام مشفر وآمن عبر Firebase</span>
        <button
          onClick={handleSecretLogoTap}
          className="text-gray-300 hover:text-gray-500 transition p-1"
          title="نظام الإدارة"
          aria-label="Admin"
        >
          <i className="fa-solid fa-shield text-[10px] opacity-20 hover:opacity-100 transition"></i>
        </button>
      </div>
    </div>
  );
};
