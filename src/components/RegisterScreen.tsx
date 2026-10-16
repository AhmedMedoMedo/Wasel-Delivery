import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VehicleType, DocumentImages } from '../types';
import { compressImageToBase64 } from '../utils/imageCompressor';

export const RegisterScreen: React.FC = () => {
  const { currentRoleSelecting, setCurrentScreen, register, showToast } = useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [vehicle, setVehicle] = useState<VehicleType>('motorcycle');
  const [loading, setLoading] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [documents, setDocuments] = useState<DocumentImages>({});

  // Fallback to driver if somehow admin was selected
  const role = currentRoleSelecting === 'restaurant' ? 'restaurant' : 'driver';
  const title = role === 'restaurant' ? 'تسجيل مطعم جديد' : 'تسجيل مندوب جديد';

  const handleFileUpload = async (key: keyof DocumentImages, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setCompressing(true);
      const base64 = await compressImageToBase64(file, 800, 0.7);
      setDocuments((prev) => ({ ...prev, [key]: base64 }));
      showToast('تم تحميل الصورة بنجاح!');
    } catch (err) {
      console.error(err);
      showToast('فشل معالجة الصورة، يرجى المحاولة مرة أخرى', 'error');
    } finally {
      setCompressing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await register(name, email, phone, password, role, vehicle, documents);
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
            <div>
              <h3 className="font-bold text-sm text-gray-800 flex items-center">
                <i className="fa-solid fa-file-shield text-[#FF5722] ml-1.5"></i>{' '}
                المستندات والصور المطلوبة للتوثيق
              </h3>
              <p className="text-[11px] text-gray-500 mt-0.5">
                تراجع الإدارة هذه الصور للتأكد من هوية المتقدم وتفعيل الحساب.
              </p>
            </div>

            {/* Document 1: ID Front / Commercial Register */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  {role === 'restaurant' ? 'صورة رخصة المحل / السجل التجاري' : 'صورة بطاقة الرقم القومي (الوجه الأمامي)'}
                </label>
                {documents.idCardFront && (
                  <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-circle-check"></i> تم الرفع
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('idCardFront', e)}
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
              {documents.idCardFront && (
                <img src={documents.idCardFront} alt="Preview" className="mt-2 h-20 w-auto rounded border object-cover" />
              )}
            </div>

            {/* Document 2: ID Back / Store Front */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  {role === 'restaurant' ? 'صورة واجهة المحل أو اللوجو' : 'صورة بطاقة الرقم القومي (الوجه الخلفي)'}
                </label>
                {documents.idCardBack && (
                  <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-circle-check"></i> تم الرفع
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('idCardBack', e)}
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
              {documents.idCardBack && (
                <img src={documents.idCardBack} alt="Preview" className="mt-2 h-20 w-auto rounded border object-cover" />
              )}
            </div>

            {/* Document 3: Personal Photo */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  صورة شخصية حديثة وواضحة
                </label>
                {documents.personalPhoto && (
                  <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-circle-check"></i> تم الرفع
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('personalPhoto', e)}
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
              {documents.personalPhoto && (
                <img src={documents.personalPhoto} alt="Preview" className="mt-2 h-20 w-auto rounded border object-cover" />
              )}
            </div>

            {/* Document 4: Selfie with ID or License */}
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  {role === 'restaurant' ? 'صورة بطاقة صاحب المنشأة' : 'صورة شخصية وأنت تحمل البطاقة أو رخصة القيادة'}
                </label>
                {documents.selfieWithId && (
                  <span className="text-[11px] text-green-600 font-bold flex items-center gap-1">
                    <i className="fa-solid fa-circle-check"></i> تم الرفع
                  </span>
                )}
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileUpload('selfieWithId', e)}
                className="w-full text-xs text-gray-500 file:mr-0 file:ml-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#FF5722] file:text-white hover:file:bg-[#e64a19] cursor-pointer"
              />
              {documents.selfieWithId && (
                <img src={documents.selfieWithId} alt="Preview" className="mt-2 h-20 w-auto rounded border object-cover" />
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || compressing}
            className="w-full bg-[#263238] hover:bg-[#1a2327] text-white py-3.5 rounded-xl font-bold text-lg mt-4 shadow-lg shadow-[#263238]/30 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
          >
            {loading ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i>
                <span>جاري إرسال الطلب والمستندات...</span>
              </>
            ) : compressing ? (
              <>
                <i className="fa-solid fa-circle-notch fa-spin"></i>
                <span>جاري معالجة الصور...</span>
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
