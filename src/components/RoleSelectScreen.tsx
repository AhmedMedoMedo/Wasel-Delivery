import React from 'react';
import { useApp } from '../context/AppContext';

export const RoleSelectScreen: React.FC = () => {
  const { setCurrentScreen, setCurrentRoleSelecting } = useApp();

  const handleSelectRole = (role: 'restaurant' | 'driver' | 'admin') => {
    setCurrentRoleSelecting(role);
    setCurrentScreen('screen-login');
  };

  return (
    <div className="flex flex-col min-h-screen justify-center items-center p-6 bg-white">
      <div className="w-32 h-32 bg-[#FF5722] rounded-full flex items-center justify-center mb-8 shadow-lg shadow-[#FF5722]/40">
        <i className="fa-solid fa-motorcycle text-6xl text-white"></i>
      </div>

      <h1 className="text-3xl font-bold text-[#263238] mb-2">وصل دليفري</h1>
      <p className="text-gray-500 mb-10 text-center">
        المنصة الأسرع لربط المطاعم بمندوبي التوصيل
      </p>

      <div className="w-full space-y-4">
        <button
          onClick={() => handleSelectRole('restaurant')}
          className="w-full bg-[#263238] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition active:scale-95 shadow-md"
        >
          <i className="fa-solid fa-store"></i> دخول كمطعم
        </button>

        <button
          onClick={() => handleSelectRole('driver')}
          className="w-full bg-[#FF5722] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition active:scale-95 shadow-md shadow-[#FF5722]/30"
        >
          <i className="fa-solid fa-helmet-safety"></i> دخول كمندوب
        </button>

        <button
          onClick={() => handleSelectRole('admin')}
          className="w-full bg-gray-100 text-gray-600 hover:bg-gray-200 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition active:scale-95 mt-4"
        >
          <i className="fa-solid fa-user-tie"></i> لوحة الإدارة
        </button>
      </div>

      <div className="mt-8 text-center text-xs text-gray-400">
        <p>نظام مصادقة مشفر وآمن عبر Firebase Authentication</p>
      </div>
    </div>
  );
};
