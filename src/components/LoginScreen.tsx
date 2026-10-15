import React, { useState } from 'react';
import { useApp } from '../context/AppContext';

export const LoginScreen: React.FC = () => {
  const { currentRoleSelecting, setCurrentScreen, login } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const role = currentRoleSelecting || 'restaurant';
  let title = 'دخول المطاعم';
  if (role === 'driver') title = 'دخول المناديب';
  if (role === 'admin') title = 'دخول لوحة الإدارة';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    await login(email, password, role);
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white">
      <div className="p-6">
        <button
          onClick={() => setCurrentScreen('screen-role-select')}
          className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 mb-6 transition"
          aria-label="الرجوع"
        >
          <i className="fa-solid fa-arrow-right"></i>
        </button>

        <h2 className="text-2xl font-bold text-[#263238] mb-6">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder="name@example.com"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#FF5722] text-white py-3.5 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-[#FF5722]/30 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>جاري تسجيل الدخول...</span>
              </>
            ) : (
              'دخول'
            )}
          </button>

          {role !== 'admin' && (
            <div className="text-center mt-6">
              <p className="text-gray-500">
                ليس لديك حساب؟{' '}
                <button
                  type="button"
                  onClick={() => setCurrentScreen('screen-register')}
                  className="text-[#FF5722] font-bold hover:underline"
                >
                  سجل الآن
                </button>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
