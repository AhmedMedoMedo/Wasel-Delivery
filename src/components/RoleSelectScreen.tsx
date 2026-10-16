import React, { useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const RoleSelectScreen: React.FC = () => {
  const { setCurrentScreen, setCurrentRoleSelecting } = useApp();

  // Secret URL access for Owner/Admin only: e.g. ?admin or #admin
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

      {/* Clean Footer */}
      <div className="w-full text-center text-xs text-gray-400 pb-2">
        <p>نظام مشفر وآمن عبر Firebase</p>
      </div>
    </div>
  );
};
