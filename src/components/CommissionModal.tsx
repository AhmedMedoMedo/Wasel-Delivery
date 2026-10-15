import React, { useState } from 'react';
import { useApp, COMMISSION_PER_ORDER } from '../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const CommissionModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const { currentUser, orders, showToast, getCommissionOwed } = useApp();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !currentUser) return null;

  const completedOrders = orders.filter((o) => {
    if (currentUser.role === 'restaurant') {
      return o.restaurantId === currentUser.id && o.status === 'completed';
    } else if (currentUser.role === 'driver') {
      return o.driverId === currentUser.id && o.status === 'completed';
    }
    return o.status === 'completed';
  }).sort((a, b) => new Date(b.completedAt || b.createdAt).getTime() - new Date(a.completedAt || a.createdAt).getTime());

  const totalOwed = getCommissionOwed(currentUser).toFixed(2);
  const vodafoneNumber = '01011112222';
  const instapayAccount = 'wasel@instapay';

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast('تم نسخ الرقم إلى الحافظة!');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    `مرحباً إدارة وصل دليفري،\nأرغب في إرسال إشعار تحويل عمولات:\n- الاسم: ${currentUser.name}\n- البريد: ${currentUser.email}\n- الدور: ${currentUser.role === 'restaurant' ? 'مطعم' : 'مندوب'}\n- عدد الطلبات المنفذة: ${completedOrders.length}\n- الرصيد المستحق: ${totalOwed} ج.م`
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#263238] to-[#37474F] text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FF5722] flex items-center justify-center text-xl shadow-md shadow-[#FF5722]/30">
              <i className="fa-solid fa-receipt"></i>
            </div>
            <div>
              <h3 className="font-bold text-base">كشف حساب العمولات</h3>
              <p className="text-[11px] text-gray-300">نظام التكلفة الثابتة ({COMMISSION_PER_ORDER.toFixed(2)} ج.م / طلب)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Summary Card */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">إجمالي العمولات المستحقة للموقع</p>
            <div className="text-3xl font-extrabold text-[#F44336] mb-1">
              {totalOwed} <span className="text-sm font-bold text-gray-600">ج.م</span>
            </div>
            <div className="inline-flex items-center gap-1.5 bg-white/80 px-3 py-1 rounded-full text-[11px] text-[#263238] font-medium border border-orange-100">
              <i className="fa-solid fa-circle-check text-green-500"></i>
              <span>{completedOrders.length} طلبات منفذة بنجاح</span>
              <span className="text-gray-400 mx-1">•</span>
              <span>1 ج.م / طلب</span>
            </div>
          </div>

          {/* Completed Orders Quick Summary */}
          {completedOrders.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-[#263238] mb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-clock-rotate-left text-[#FF5722]"></i>
                  سجل الطلبات المحتسبة
                </span>
                <span className="text-[10px] text-gray-400 font-normal">
                  ({completedOrders.length} طلب)
                </span>
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1.5 border border-gray-100 rounded-xl p-2 bg-gray-50/70">
                {completedOrders.map((ord) => (
                  <div
                    key={ord.id}
                    className="flex justify-between items-center bg-white p-2 rounded-lg text-xs border border-gray-100 shadow-2xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-[10px]">
                        <i className="fa-solid fa-check"></i>
                      </span>
                      <span className="font-bold text-gray-700 truncate max-w-[140px]">{ord.type}</span>
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-[#F44336]">
                        +{COMMISSION_PER_ORDER.toFixed(2)} ج.م
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Payment Instructions */}
          <div>
            <h4 className="text-xs font-bold text-[#263238] mb-2 flex items-center gap-1.5">
              <i className="fa-solid fa-wallet text-[#FF5722]"></i>
              طرق سداد وتسوية العمولات
            </h4>

            <div className="space-y-2">
              {/* Vodafone Cash */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center text-sm font-bold">
                    <i className="fa-solid fa-mobile-screen"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#263238]">فودافون كاش (Vodafone Cash)</p>
                    <p className="text-xs font-mono text-gray-600 font-bold">{vodafoneNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(vodafoneNumber, 'voda')}
                  className="bg-white hover:bg-gray-100 border border-gray-300 text-xs px-2.5 py-1 rounded-lg text-gray-700 font-bold transition flex items-center gap-1"
                >
                  <i className={`fa-solid ${copiedKey === 'voda' ? 'fa-check text-green-600' : 'fa-copy'}`}></i>
                  <span>{copiedKey === 'voda' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>

              {/* InstaPay */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center text-sm font-bold">
                    <i className="fa-solid fa-bolt"></i>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-[#263238]">إنستاباي (InstaPay IPA)</p>
                    <p className="text-xs font-mono text-gray-600 font-bold">{instapayAccount}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(instapayAccount, 'insta')}
                  className="bg-white hover:bg-gray-100 border border-gray-300 text-xs px-2.5 py-1 rounded-lg text-gray-700 font-bold transition flex items-center gap-1"
                >
                  <i className={`fa-solid ${copiedKey === 'insta' ? 'fa-check text-green-600' : 'fa-copy'}`}></i>
                  <span>{copiedKey === 'insta' ? 'تم النسخ' : 'نسخ'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Action button: Send WhatsApp Confirmation */}
          <a
            href={`https://wa.me/201011112222?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-[#25D366] hover:bg-[#20bd5a] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/30 transition active:scale-98"
          >
            <i className="fa-brands fa-whatsapp text-lg"></i>
            <span>إرسال إشعار السداد للإدارة عبر واتساب</span>
          </a>

          <div className="text-center">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-xs py-1 transition"
            >
              إغلاق النافذة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
