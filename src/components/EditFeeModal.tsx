import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';

export const EditFeeModal: React.FC = () => {
  const { editingOrderId, orders, closeEditFeeModal, saveNewFee } = useApp();
  const [fee, setFee] = useState<string>('');

  useEffect(() => {
    if (editingOrderId) {
      const order = orders.find((o) => o.id === editingOrderId);
      if (order) {
        setFee(order.deliveryFee.toString());
      }
    }
  }, [editingOrderId, orders]);

  if (!editingOrderId) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(fee);
    if (!isNaN(num) && num > 0) {
      saveNewFee(editingOrderId, num);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4 backdrop-blur-sm transition-opacity">
      <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-2xl transform scale-100 transition-transform">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-[#263238] text-lg">تعديل تكلفة التوصيل</h3>
          <button
            onClick={closeEditFeeModal}
            className="text-gray-400 hover:text-[#F44336] p-1"
            aria-label="إغلاق"
          >
            <i className="fa-solid fa-xmark text-xl"></i>
          </button>
        </div>
        <p className="text-xs text-gray-500 mb-3">
          أدخل التكلفة الجديدة لجذب المناديب لقبول الطلب:
        </p>
        <form onSubmit={handleSubmit}>
          <div className="relative mb-5">
            <input
              type="number"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-lg font-bold text-[#FF5722] focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]"
              placeholder="0"
              autoFocus
              min="1"
            />
            <span className="absolute left-4 top-3.5 text-gray-400 text-sm">ج.م</span>
          </div>
          <button
            type="submit"
            className="w-full bg-[#FF5722] text-white py-3 rounded-xl font-bold shadow-lg shadow-[#FF5722]/30 active:scale-95 transition"
          >
            حفظ التعديل
          </button>
        </form>
      </div>
    </div>
  );
};
