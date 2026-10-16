import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const RoleSelectScreen: React.FC = () => {
  const { setCurrentScreen, setCurrentRoleSelecting, showToast } = useApp();
  const [holdingSeconds, setHoldingSeconds] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);
  const TOTAL_HOLD_SECONDS = 20;

  // Secret URL access for Owner/Admin only: e.g. ?admin or #admin
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('admin') || window.location.hash.toLowerCase().includes('admin')) {
      handleSelectRole('admin');
    }
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const handleSelectRole = (role: 'restaurant' | 'driver' | 'admin') => {
    setCurrentRoleSelecting(role);
    setCurrentScreen('screen-login');
  };

  // Start 20-second hold on the shield
  const startHold = (e: React.SyntheticEvent) => {
    e.preventDefault();
    startTimeRef.current = Date.now();
    setHoldingSeconds(TOTAL_HOLD_SECONDS);

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const left = Math.max(0, Math.ceil(TOTAL_HOLD_SECONDS - elapsed));
      setHoldingSeconds(left);
      if (left <= 0) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 250);

    timerRef.current = setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setHoldingSeconds(null);
      showToast('🔓 تم التحقق بنجاح! مرحباً بك في بوابة الإدارة');
      handleSelectRole('admin');
    }, TOTAL_HOLD_SECONDS * 1000);
  };

  const cancelHold = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setHoldingSeconds(null);
  };

  return (
    <div className="flex flex-col min-h-screen justify-between items-center p-6 bg-white selection:bg-[#FF5722] selection:text-white">
      {/* Top spacer */}
      <div className="w-full"></div>

      {/* Main Content */}
      <div className="w-full max-w-sm flex flex-col items-center">
        {/* Static Non-Clickable Brand Logo */}
        <div className="w-32 h-32 bg-[#FF5722] rounded-3xl flex items-center justify-center mb-8 shadow-xl shadow-[#FF5722]/25 select-none pointer-events-none">
          <i className="fa-solid fa-motorcycle text-6xl text-white"></i>
        </div>

        <h1 className="text-3xl font-black text-[#263238] mb-2 tracking-tight">وصل دليفري</h1>
        <p className="text-gray-500 mb-10 text-center text-sm font-medium">
          المنصة الأسرع لربط المطاعم بمندوبي التوصيل
        </p>

        {/* Public Roles Only (Restaurant & Driver) */}
        <div className="w-full space-y-3.5">
          <button
            onClick={() => handleSelectRole('restaurant')}
            className="w-full bg-[#263238] hover:bg-[#1a2327] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition active:scale-95 shadow-md shadow-gray-900/10 cursor-pointer"
          >
            <i className="fa-solid fa-store text-lg text-emerald-400"></i>
            <span>دخول كمطعم</span>
          </button>

          <button
            onClick={() => handleSelectRole('driver')}
            className="w-full bg-[#FF5722] hover:bg-[#f4511e] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-3 transition active:scale-95 shadow-md shadow-[#FF5722]/25 cursor-pointer"
          >
            <i className="fa-solid fa-helmet-safety text-lg text-amber-200"></i>
            <span>دخول كمندوب</span>
          </button>
        </div>
      </div>

      {/* Footer with Secret 20-Second Shield Hold */}
      <div className="w-full text-center text-xs text-gray-400 pb-2 select-none flex flex-col items-center justify-center gap-1.5">
        <div className="flex items-center justify-center gap-2">
          <span>نظام مشفر وآمن عبر Firebase</span>
          <div
            onMouseDown={startHold}
            onMouseUp={cancelHold}
            onMouseLeave={cancelHold}
            onTouchStart={startHold}
            onTouchEnd={cancelHold}
            onTouchCancel={cancelHold}
            onContextMenu={(e) => e.preventDefault()}
            className="inline-flex items-center justify-center p-1 cursor-default select-none transition-transform"
            style={{ touchAction: 'none', userSelect: 'none' }}
          >
            <i
              className={`fa-solid fa-shield text-[11px] transition-all duration-300 ${
                holdingSeconds !== null
                  ? 'text-[#FF5722] scale-125 opacity-100'
                  : 'text-gray-300 opacity-25 hover:opacity-40'
              }`}
            ></i>
          </div>
        </div>

        {/* Discreet feedback only visible while holding */}
        {holdingSeconds !== null && (
          <div className="text-[11px] font-bold text-[#FF5722] font-mono animate-pulse bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
            استمر بالضغط: {holdingSeconds} ثانية
          </div>
        )}
      </div>
    </div>
  );
};
