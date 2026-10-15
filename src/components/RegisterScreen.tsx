import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VehicleType } from '../types';

export const RegisterScreen: React.FC = () => {
  const { currentRoleSelecting, setCurrentScreen, register } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>('motorcycle');
  const [loading, setLoading] = useState(false);

  // Fallback to driver if somehow admin was selected
  const role = currentRoleSelecting === 'restaurant' ? 'restaurant' : 'driver';
  const title = role === 'restaurant' ? 'تسجيل مطعم جديد' : 'تسجيل مندوب جديد';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(name, email, phone, password, role, vehicle);
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white overflow-y-auto">
      <div className="p-6 pb-20">
        <button
          onClick={() => setCurrentScreen('screen-login')}
          className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-full flex items-center justify-center text-gray-600 mb-6 transition"
          aria-label="الرجوع"
        >
          <i className="fa-solid fa-arrow-right"></i>
        </button>

        <h2 className="text-2xl font-bold text-[#263238] mb-6">{title}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {role === 'restaurant' ? 'اسم المطعم' : 'الاسم الكامل'}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder={role === 'restaurant' ? 'مثال: مطعم الأندلس' : 'مثال: أحمد محمد'}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder="example@mail.com"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الهاتف
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder="01xxxxxxxxx"
              required
              dir="ltr"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              كلمة المرور (6 أحرف أو أرقام على الأقل)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          {role === 'driver' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                نوع المركبة
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setVehicle('motorcycle')}
                  className={`flex-1 p-2 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                    vehicle === 'motorcycle'
                      ? 'border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722]'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <i className="fa-solid fa-motorcycle"></i> موتوسيكل
                </button>
                <button
                  type="button"
                  onClick={() => setVehicle('car')}
                  className={`flex-1 p-2 rounded-xl border text-sm font-bold flex items-center justify-center gap-2 transition ${
                    vehicle === 'car'
                      ? 'border-[#FF5722] bg-[#FF5722]/10 text-[#FF5722]'
                      : 'border-gray-200 bg-gray-50 text-gray-600'
                  }`}
                >
                  <i className="fa-solid fa-car"></i> سيارة
                </button>
              </div>
            </div>
          )}

          {/* Registration Documents UI */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-gray-800 flex items-center">
              <i className="fa-solid fa-file-shield text-[#FF5722] ml-1.5"></i>{' '}
              المستندات المطلوبة (للتوثيق)
            </h3>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                صورة البطاقة (وش)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                صورة البطاقة (ضهر)
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                صورة شخصية
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                صورة لك وأنت تحمل البطاقة بجوار وجهك
              </label>
              <input
                type="file"
                accept="image/*"
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#263238] text-white py-3.5 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-[#263238]/30 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>جاري إنشاء الحساب والمصادقة...</span>
              </>
            ) : (
              'تسجيل وإرسال للمراجعة'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
