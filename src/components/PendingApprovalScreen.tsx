import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const PendingApprovalScreen: React.FC = () => {
  const { currentUser, logout, showToast, setCurrentScreen } = useApp();
  const [checking, setChecking] = useState(false);

  const handleRefresh = async () => {
    if (!currentUser) return;
    setChecking(true);
    try {
      const snap = await getDoc(doc(db, 'users', currentUser.id));
      if (snap.exists()) {
        const data = snap.data();
        if (data.approvalStatus === 'approved') {
          showToast('تهانينا! تمت الموافقة على حسابك وتفعيله بنجاح.');
          setCurrentScreen(currentUser.role === 'restaurant' ? 'screen-restaurant' : 'screen-driver');
          return;
        } else if (data.approvalStatus === 'rejected') {
          showToast('تم رفض طلب الانضمام: ' + (data.rejectionReason || 'يرجى مراجعة الإدارة'), 'error');
        } else {
          showToast('حسابك لا يزال قيد مراجعة وتدقيق الإدارة.');
        }
      }
    } catch {
      showToast('حسابك لا يزال قيد مراجعة وتدقيق الإدارة.');
    } finally {
      setChecking(false);
    }
  };

  const isRejected = currentUser?.approvalStatus === 'rejected';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 justify-between p-6 text-center select-none" dir="rtl">
      {/* Top spacer */}
      <div></div>

      {/* Main card */}
      <div className="w-full max-w-sm mx-auto bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col items-center">
        <div
          className={`w-20 h-20 rounded-full flex items-center justify-center text-3xl mb-4 shadow-lg ${
            isRejected
              ? 'bg-red-500 text-white shadow-red-500/30'
              : 'bg-amber-500 text-white shadow-amber-500/30 animate-pulse'
          }`}
        >
          <i className={isRejected ? 'fa-solid fa-circle-xmark' : 'fa-solid fa-hourglass-half'}></i>
        </div>

        <h2 className="text-xl font-bold text-[#263238] mb-2">
          {isRejected ? 'تم رفض طلب الانضمام' : 'طلبك قيد المراجعة والتدقيق'}
        </h2>

        <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 w-full text-xs text-gray-600 mb-4 space-y-2 text-right">
          <div className="flex justify-between border-b border-gray-200 pb-1.5">
            <span className="text-gray-400">الاسم:</span>
            <span className="font-bold text-gray-800">{currentUser?.name}</span>
          </div>
          <div className="flex justify-between border-b border-gray-200 pb-1.5">
            <span className="text-gray-400">نوع الحساب:</span>
            <span className="font-bold text-[#FF5722]">
              {currentUser?.role === 'restaurant' ? 'مطعم' : 'مندوب توصيل'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">حالة المستندات:</span>
            <span className={isRejected ? 'text-red-600 font-bold' : 'text-amber-600 font-bold'}>
              {isRejected ? 'مرفوض' : 'بانتظار اعتماد الإدارة'}
            </span>
          </div>
        </div>

        {isRejected ? (
          <p className="text-xs text-red-600 bg-red-50 p-3 rounded-xl border border-red-200 leading-relaxed mb-6">
            {currentUser?.rejectionReason || 'نعتذر، لم يتم استيفاء شروط التسجيل والصور المطلوبة بشكل صحيح. يرجى مراجعة الإدارة.'}
          </p>
        ) : (
          <p className="text-xs text-gray-500 leading-relaxed mb-6">
            لقد تم استلام بياناتك وصورك بنجاح. تقوم إدارة وصل دليفري بمراجعة المستندات والصور والتأكد من مطابقتها للشروط لتفعيل حسابك في أقرب وقت.
          </p>
        )}

        <div className="w-full space-y-2.5">
          {!isRejected && (
            <button
              onClick={handleRefresh}
              disabled={checking}
              className="w-full bg-[#FF5722] hover:bg-[#f4511e] text-white py-3 rounded-xl font-bold text-sm transition shadow-md shadow-[#FF5722]/30 active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <i className={`fa-solid fa-rotate-right ${checking ? 'fa-spin' : ''}`}></i>
              <span>التحقق من حالة الحساب الآن</span>
            </button>
          )}

          <button
            onClick={logout}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
          >
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-gray-400 pb-2">
        <span>وصل دليفري &copy; إدارة التحقق والأمان</span>
      </div>
    </div>
  );
};
