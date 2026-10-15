import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { VehicleType } from '../types';
import { formatTimeAgo } from '../utils/formatters';

export const RestaurantDashboard: React.FC = () => {
  const {
    currentUser,
    orders,
    logout,
    postOrder,
    openEditFeeModal,
    restApproveDriver,
    restRejectDriver,
    rateDriver,
    getDriver,
    getDriverRating,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'post' | 'orders'>('post');

  // Form states
  const [orderType, setOrderType] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [vehicle, setVehicle] = useState<VehicleType>('motorcycle');

  const myOrders = orders
    .filter((o) => o.restaurantId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(orderPrice);
    const feeNum = parseFloat(deliveryFee);

    const success = await postOrder(orderType, priceNum, feeNum, contactPhone, vehicle);
    if (success) {
      setOrderType('');
      setOrderPrice('');
      setDeliveryFee('');
      setActiveTab('orders');
    }
  };

  const renderStars = (ratingStr: string) => {
    const rating = parseFloat(ratingStr);
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      if (rating >= i) {
        stars.push(<i key={i} className="fa-solid fa-star text-yellow-400"></i>);
      } else if (rating >= i - 0.5) {
        stars.push(<i key={i} className="fa-solid fa-star-half-stroke text-yellow-400"></i>);
      } else {
        stars.push(<i key={i} className="fa-regular fa-star text-gray-300"></i>);
      }
    }
    return stars;
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 relative">
      {/* Top Header */}
      <div className="bg-white px-4 py-4 flex justify-between items-center shadow-sm z-10">
        <div>
          <h2 className="font-bold text-lg text-[#263238]">{currentUser?.name || 'مطعم'}</h2>
          <p className="text-xs text-gray-500">
            رصيد العمولات المستحقة:{' '}
            <span className="font-bold text-[#F44336]">
              {(currentUser?.commissionOwed || 0).toFixed(2)}
            </span>{' '}
            ج.م
          </p>
        </div>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-[#F44336] p-2 transition"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <i className="fa-solid fa-right-from-bracket text-xl"></i>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'post' ? (
          <div className="space-y-4">
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-bold text-[#263238] mb-4 border-b border-gray-100 pb-2 flex items-center">
                <i className="fa-solid fa-pen-to-square text-[#FF5722] ml-2"></i> نشر طلب توصيل جديد
              </h3>

              <form onSubmit={handlePostSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    نوع/وصف الطلب (مثال: وجبات سريعة، بيتزا)
                  </label>
                  <input
                    type="text"
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF5722]"
                    placeholder="وجبات سريعة"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      ثمن الأوردر (ج.م)
                    </label>
                    <input
                      type="number"
                      value={orderPrice}
                      onChange={(e) => setOrderPrice(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF5722]"
                      placeholder="مثال: 200"
                      min="1"
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 mb-1">
                      تكلفة التوصيل (ج.م)
                    </label>
                    <input
                      type="number"
                      value={deliveryFee}
                      onChange={(e) => setDeliveryFee(e.target.value)}
                      className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF5722]"
                      placeholder="مثال: 30"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    رقم تواصل المطعم
                  </label>
                  <input
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#FF5722]"
                    placeholder="01xxxxxxxxx"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    المركبة المطلوبة
                  </label>
                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="vehicle"
                        value="motorcycle"
                        checked={vehicle === 'motorcycle'}
                        onChange={() => setVehicle('motorcycle')}
                        className="sr-only"
                      />
                      <div
                        className={`text-center rounded-lg p-2 transition border ${
                          vehicle === 'motorcycle'
                            ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722] font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <i className="fa-solid fa-motorcycle block mb-1"></i>
                        <span className="text-xs">موتوسيكل</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="vehicle"
                        value="car"
                        checked={vehicle === 'car'}
                        onChange={() => setVehicle('car')}
                        className="sr-only"
                      />
                      <div
                        className={`text-center rounded-lg p-2 transition border ${
                          vehicle === 'car'
                            ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722] font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <i className="fa-solid fa-car block mb-1"></i>
                        <span className="text-xs">سيارة</span>
                      </div>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="radio"
                        name="vehicle"
                        value="any"
                        checked={vehicle === 'any'}
                        onChange={() => setVehicle('any')}
                        className="sr-only"
                      />
                      <div
                        className={`text-center rounded-lg p-2 transition border ${
                          vehicle === 'any'
                            ? 'bg-[#FF5722]/10 border-[#FF5722] text-[#FF5722] font-bold'
                            : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}
                      >
                        <i className="fa-solid fa-infinity block mb-1"></i>
                        <span className="text-xs">أي مركبة</span>
                      </div>
                    </label>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FF5722] text-white py-3 rounded-xl font-bold mt-2 shadow-md shadow-[#FF5722]/20 active:scale-95 transition flex items-center justify-center gap-1"
                >
                  <i className="fa-solid fa-paper-plane ml-1"></i> نشر الطلب
                </button>
                <p className="text-[10px] text-gray-400 text-center">
                  * سيتم خصم عمولة 2.5 ج.م عند اكتمال التوصيل.
                </p>
              </form>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-[#263238] border-b border-gray-200 pb-2">
              طلباتي الحالية
            </h3>

            {myOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-10 bg-white rounded-2xl border border-dashed border-gray-200">
                <i className="fa-solid fa-box-open text-4xl mb-2 text-gray-300"></i>
                <p>لا توجد طلبات حالياً</p>
              </div>
            ) : (
              myOrders.map((order) => {
                const shortId = order.id.replace('ord-', '').substring(0, 4);
                const hasApplicants = order.applyingDrivers && order.applyingDrivers.length > 0;
                const driver = order.driverId ? getDriver(order.driverId) : null;

                let statusBadge = null;
                let actionContent = null;

                if (order.status === 'pending') {
                  if (hasApplicants) {
                    statusBadge = (
                      <span className="bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded-full font-bold">
                        متقدمين ({order.applyingDrivers.length})
                      </span>
                    );
                    actionContent = (
                      <div className="mt-3">
                        <p className="text-xs text-orange-800 mb-2 font-bold">
                          مناديب يرغبون في التوصيل (اختر الأنسب):
                        </p>
                        <div className="space-y-2">
                          {order.applyingDrivers.map((dId) => {
                            const appDriver = getDriver(dId);
                            if (!appDriver) return null;
                            const rating = getDriverRating(appDriver.id);
                            return (
                              <div
                                key={dId}
                                className="border border-orange-200 bg-orange-50 rounded-lg p-2.5"
                              >
                                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-100 mb-2">
                                  <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden text-gray-400">
                                    <i className="fa-solid fa-user"></i>
                                  </div>
                                  <div className="flex-1">
                                    <p className="font-bold text-sm text-[#263238]">
                                      {appDriver.name}
                                    </p>
                                    <div className="text-[10px] text-gray-500 flex items-center gap-1">
                                      <span className="flex text-xs">{renderStars(rating)}</span>
                                      <span className="font-bold text-black ml-1">
                                        {rating}
                                      </span>
                                      <span>
                                        ({appDriver.vehicle === 'motorcycle' ? 'موتوسيكل' : 'سيارة'})
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => restApproveDriver(order.id, appDriver.id)}
                                    className="flex-1 bg-[#4CAF50] text-white py-1.5 rounded-lg text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1"
                                  >
                                    <i className="fa-solid fa-check"></i> اختيار
                                  </button>
                                  <button
                                    onClick={() => restRejectDriver(order.id, appDriver.id)}
                                    className="flex-1 bg-red-100 text-[#F44336] py-1.5 rounded-lg text-xs font-bold active:scale-95 transition flex items-center justify-center gap-1"
                                  >
                                    <i className="fa-solid fa-xmark"></i> رفض
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  } else {
                    statusBadge = (
                      <span className="bg-gray-100 text-gray-600 text-[10px] px-2 py-1 rounded-full font-bold">
                        جاري البحث عن مندوب...
                      </span>
                    );
                    actionContent = (
                      <div className="mt-3">
                        <div className="bg-blue-50 text-blue-800 p-2 text-xs rounded-lg flex items-center gap-2">
                          <i className="fa-solid fa-spinner fa-spin"></i>
                          <span>المنشور قيد العرض للمناديب</span>
                        </div>
                        <div className="mt-2 text-left">
                          <button
                            onClick={() => openEditFeeModal(order.id)}
                            className="text-[#FF5722] text-xs font-bold underline hover:opacity-80"
                          >
                            <i className="fa-solid fa-pen ml-1"></i> تعديل تكلفة التوصيل؟
                          </button>
                        </div>
                      </div>
                    );
                  }
                } else if (order.status === 'active') {
                  statusBadge = (
                    <span className="bg-[#FF5722]/10 text-[#FF5722] text-[10px] px-2 py-1 rounded-full font-bold">
                      جاري التوصيل
                    </span>
                  );
                  actionContent = (
                    <div className="mt-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <p className="text-xs text-gray-600 mb-1">
                        المندوب: <span className="font-bold text-[#263238]">{driver?.name || 'غير معروف'}</span>
                      </p>
                      <p className="text-xs text-gray-600 mb-3">
                        رقم المندوب:{' '}
                        {driver && 'phone' in driver && (driver as any).phone ? (
                          <a
                            href={`tel:${(driver as any).phone}`}
                            className="text-[#FF5722] font-bold dir-ltr inline-block underline"
                          >
                            {(driver as any).phone}
                          </a>
                        ) : (
                          <span className="text-gray-400">محمي للخصوصية</span>
                        )}
                      </p>
                      <div className="bg-blue-50 text-blue-700 p-2 rounded-lg text-xs text-center border border-blue-100 font-bold">
                        <i className="fa-solid fa-motorcycle fa-fade ml-1"></i> المندوب في طريقه لتسليم الطلب...
                      </div>
                    </div>
                  );
                } else if (order.status === 'completed') {
                  statusBadge = (
                    <span className="bg-[#4CAF50]/10 text-[#4CAF50] text-[10px] px-2 py-1 rounded-full font-bold">
                      مكتمل
                    </span>
                  );
                  if (!order.rated) {
                    actionContent = (
                      <div className="mt-3 border border-gray-200 rounded-lg p-3 text-center bg-gray-50">
                        <p className="text-xs text-gray-600 mb-2 font-bold">
                          قيّم سرعة المندوب:
                        </p>
                        <div className="flex justify-center gap-3">
                          <button
                            onClick={() => rateDriver(order.id, 5)}
                            className="w-12 h-12 rounded-full bg-green-50 text-[#4CAF50] text-xl hover:bg-green-100 transition active:scale-95 flex items-center justify-center shadow-sm"
                            title="سريع"
                          >
                            <i className="fa-solid fa-thumbs-up"></i>
                          </button>
                          <button
                            onClick={() => rateDriver(order.id, 1)}
                            className="w-12 h-12 rounded-full bg-red-50 text-[#F44336] text-xl hover:bg-red-100 transition active:scale-95 flex items-center justify-center shadow-sm"
                            title="بطيء"
                          >
                            <i className="fa-solid fa-thumbs-down"></i>
                          </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2">
                          سريع (خلال 10 دقائق) / بطيء
                        </p>
                      </div>
                    );
                  } else {
                    actionContent = (
                      <div className="mt-3 text-center text-xs text-[#4CAF50] bg-green-50 py-2 rounded-lg flex items-center justify-center gap-1 font-bold">
                        <i className="fa-solid fa-check-circle"></i> تم التقييم وإنهاء العملية
                      </div>
                    );
                  }
                }

                return (
                  <div
                    key={order.id}
                    className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h4 className="font-bold text-sm text-[#263238]">
                          {order.type}{' '}
                          <span className="text-[11px] font-normal text-gray-400">
                            (#{shortId})
                          </span>
                        </h4>
                        <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                          <i className="fa-regular fa-clock"></i> {formatTimeAgo(order.createdAt)}
                        </span>
                      </div>
                      {statusBadge}
                    </div>

                    <div className="flex gap-4 text-xs text-gray-500 bg-gray-50 p-2 rounded-lg mb-2">
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-motorcycle text-[#FF5722]"></i>{' '}
                        {order.vehicleType === 'motorcycle'
                          ? 'موتوسيكل'
                          : order.vehicleType === 'car'
                          ? 'سيارة'
                          : 'أي مركبة'}
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fa-solid fa-money-bill-wave text-[#4CAF50]"></i>{' '}
                        توصيل: {order.deliveryFee} ج.م
                      </span>
                      <span className="text-gray-400">
                        ثمن: {order.orderPrice} ج.م
                      </span>
                    </div>

                    {actionContent}
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav Bar */}
      <div className="bg-white border-t border-gray-200 flex justify-around p-2 pb-4 absolute bottom-0 w-full z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => setActiveTab('post')}
          className={`flex flex-col items-center p-2 w-1/2 rounded-lg transition ${
            activeTab === 'post' ? 'text-[#FF5722] font-bold' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-plus-circle text-xl mb-1"></i>
          <span className="text-xs font-bold">إضافة طلب</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`flex flex-col items-center p-2 w-1/2 rounded-lg transition ${
            activeTab === 'orders' ? 'text-[#FF5722] font-bold' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-clipboard-list text-xl mb-1"></i>
          <span className="text-xs font-bold">متابعة الطلبات</span>
        </button>
      </div>
    </div>
  );
};
