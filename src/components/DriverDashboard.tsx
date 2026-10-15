import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { formatTimeAgo, formatTime, getDeliveryDurationMinutes } from '../utils/formatters';

export const DriverDashboard: React.FC = () => {
  const {
    currentUser,
    orders,
    logout,
    driverAcceptOrder,
    driverCompleteOrder,
    getRestaurant,
    getDriverRating,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'tasks'>('feed');

  const rating = currentUser ? getDriverRating(currentUser.id) : '5.0';

  // Available orders for this driver
  const availableOrders = orders
    .filter(
      (o) =>
        o.status === 'pending' &&
        !(o.applyingDrivers && o.applyingDrivers.includes(currentUser?.id || '')) &&
        (o.vehicleType === 'any' || o.vehicleType === currentUser?.vehicle)
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Driver's tasks (applied, active, or completed)
  const myTasks = orders
    .filter(
      (o) =>
        (o.driverId === currentUser?.id && o.status !== 'pending') ||
        (o.status === 'pending' && o.applyingDrivers?.includes(currentUser?.id || ''))
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  // Count active / pending applied tasks for badge
  const activeCount = orders.filter(
    (o) =>
      (o.driverId === currentUser?.id && o.status === 'active') ||
      (o.status === 'pending' && o.applyingDrivers?.includes(currentUser?.id || ''))
  ).length;

  const handleRefreshFeed = () => {
    showToast('تم تحديث قائمة الطلبات');
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 relative">
      {/* Top Header */}
      <div className="bg-white px-4 py-4 flex justify-between items-center shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                currentUser?.name || 'م'
              )}&background=FF5722&color=fff`}
              alt="Avatar"
              className="w-10 h-10 rounded-full border border-gray-200"
            />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <div className="bg-amber-100 text-yellow-600 px-1 py-0.2 rounded-full text-[10px] flex items-center justify-center font-bold">
                <i className="fa-solid fa-star text-yellow-500 ml-0.5"></i>
                <span>{rating}</span>
              </div>
            </div>
          </div>
          <div>
            <h2 className="font-bold text-sm text-[#263238]">{currentUser?.name || 'مندوب'}</h2>
            <p className="text-[11px] text-gray-500">
              عمولات مستحقة للموقع:{' '}
              <span className="font-bold text-[#F44336]">
                {(currentUser?.commissionOwed || 0).toFixed(2)}
              </span>{' '}
              ج.م
            </p>
          </div>
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

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {activeTab === 'feed' ? (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-[#263238]">الطلبات المتاحة الآن</h3>
              <button
                onClick={handleRefreshFeed}
                className="text-[#FF5722] text-sm font-bold active:scale-95 transition flex items-center gap-1 hover:opacity-80"
              >
                <i className="fa-solid fa-rotate-right"></i> تحديث
              </button>
            </div>

            {availableOrders.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <i className="fa-solid fa-mug-hot text-4xl mb-2 text-gray-300"></i>
                <p>لا توجد طلبات متاحة حالياً... انتظر قليلاً.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {availableOrders.map((order) => {
                  const rest = getRestaurant(order.restaurantId);
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden"
                    >
                      <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 bg-orange-100 text-[#FF5722] rounded-full flex items-center justify-center font-bold text-lg">
                            <i className="fa-solid fa-store"></i>
                          </div>
                          <div>
                            <h4 className="font-bold text-sm text-[#263238]">
                              {rest?.name || 'مطعم'}
                            </h4>
                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                              <i className="fa-regular fa-clock"></i> نشر منذ{' '}
                              {formatTimeAgo(order.createdAt)}
                            </span>
                          </div>
                        </div>
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs">
                          <i
                            className={`fa-solid ${
                              order.vehicleType === 'motorcycle' ? 'fa-motorcycle' : 'fa-car'
                            }`}
                          ></i>
                        </span>
                      </div>

                      <div className="p-4">
                        <p className="text-sm font-bold mb-3 flex items-center">
                          <i className="fa-solid fa-utensils text-gray-400 ml-1.5"></i>{' '}
                          {order.type}
                        </p>

                        <div className="flex gap-2 mb-4">
                          <div className="flex-1 bg-gray-50 border border-gray-100 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-gray-500 mb-0.5">تدفع للمطعم</p>
                            <p className="font-bold text-[#263238] text-sm">
                              {order.orderPrice} ج.م
                            </p>
                          </div>
                          <div className="flex-1 bg-orange-50 border border-orange-100 rounded-lg p-2 text-center">
                            <p className="text-[10px] text-orange-600 mb-0.5">تكسب (التوصيل)</p>
                            <p className="font-bold text-[#FF5722] text-sm">
                              +{order.deliveryFee} ج.م
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={() => driverAcceptOrder(order.id)}
                          className="w-full bg-[#FF5722] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#FF5722]/20 active:scale-95 transition"
                        >
                          <i className="fa-solid fa-hand-pointer"></i> أنا جاهز للتوصيل
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="font-bold text-[#263238] border-b border-gray-200 pb-2">
              طلباتي النشطة والمكتملة
            </h3>

            {myTasks.length === 0 ? (
              <div className="text-center text-gray-400 py-12 bg-white rounded-2xl border border-dashed border-gray-200">
                <i className="fa-solid fa-motorcycle text-4xl mb-2 text-gray-300"></i>
                <p>ليس لديك أي مشاوير حالياً.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {myTasks.map((order) => {
                  const rest = getRestaurant(order.restaurantId);
                  const shortId = order.id.replace('ord-', '').substring(0, 4);

                  let statusContent = null;

                  if (
                    order.status === 'pending' &&
                    order.applyingDrivers?.includes(currentUser?.id || '')
                  ) {
                    statusContent = (
                      <div className="bg-orange-50 text-orange-700 p-3 rounded-lg text-xs mt-3 flex items-center gap-2 border border-orange-100">
                        <i className="fa-solid fa-hourglass-half fa-spin"></i>
                        <span>في انتظار موافقة المطعم...</span>
                      </div>
                    );
                  } else if (order.status === 'active') {
                    statusContent = (
                      <div className="bg-[#FF5722]/10 border border-[#FF5722]/20 p-3 rounded-lg mt-3">
                        <p className="text-xs text-[#FF5722] font-bold mb-2 flex items-center">
                          <i className="fa-solid fa-person-biking ml-1"></i> المطعم اختارك! توجه
                          للمطعم الآن.
                        </p>
                        <p className="text-xs text-gray-600 mb-1">
                          المطعم: <span className="font-bold text-[#263238]">{rest?.name || ''}</span>
                        </p>
                        <p className="text-xs text-gray-600 mb-3">
                          رقم المطعم:{' '}
                          <a
                            href={`tel:${order.contactPhone}`}
                            className="text-[#FF5722] font-bold dir-ltr inline-block underline"
                          >
                            {order.contactPhone}
                          </a>
                        </p>
                        <button
                          onClick={() => driverCompleteOrder(order.id)}
                          className="w-full bg-[#4CAF50] text-white py-2.5 rounded-lg text-sm font-bold shadow-md shadow-[#4CAF50]/30 active:scale-95 transition flex items-center justify-center gap-1.5"
                        >
                          <i className="fa-solid fa-hand-holding-dollar ml-1"></i> تم التوصيل
                          واستلام المبلغ
                        </button>
                      </div>
                    );
                  } else if (order.status === 'completed') {
                    const diffMins = getDeliveryDurationMinutes(
                      order.createdAt,
                      order.completedAt
                    );
                    const formattedTime = formatTime(order.completedAt);

                    statusContent = (
                      <div className="bg-green-50 border border-green-100 p-3 rounded-lg mt-3">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-green-200/50">
                          <span className="text-[#4CAF50] text-xs font-bold flex items-center gap-1">
                            <i className="fa-solid fa-circle-check"></i> عملية ناجحة
                          </span>
                          <span className="text-[10px] text-gray-500 bg-white px-2 py-0.5 rounded border border-gray-100">
                            {formattedTime}
                          </span>
                        </div>
                        <div className="text-xs text-gray-600 space-y-1.5">
                          <p>
                            <i className="fa-solid fa-store text-gray-400 w-4 ml-1"></i> المطعم:{' '}
                            <span className="font-bold text-[#263238]">{rest?.name || ''}</span>
                          </p>
                          <p>
                            <i className="fa-solid fa-stopwatch text-gray-400 w-4 ml-1"></i> استغرق
                            التوصيل:{' '}
                            <span className="font-bold text-[#263238]">{diffMins} دقيقة</span>
                          </p>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={order.id}
                      className="bg-white p-4 rounded-xl shadow-sm border border-gray-200"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-sm text-[#263238]">
                          {order.type}{' '}
                          <span className="text-[11px] font-normal text-gray-400">
                            (#{shortId})
                          </span>
                        </h4>
                        <span className="font-bold text-[#FF5722]">+{order.deliveryFee} ج</span>
                      </div>
                      <div className="text-xs text-gray-500 flex gap-4">
                        <span className="flex items-center gap-1">
                          <i className="fa-solid fa-money-bill-1-wave ml-1 text-[#4CAF50]"></i>
                          ثمن الأوردر: {order.orderPrice} ج.م
                        </span>
                      </div>
                      {statusContent}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom Nav Bar */}
      <div className="bg-white border-t border-gray-200 flex justify-around p-2 pb-4 absolute bottom-0 w-full z-10 shadow-[0_-5px_10px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center p-2 w-1/2 rounded-lg transition ${
            activeTab === 'feed' ? 'text-[#FF5722] font-bold' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-house text-xl mb-1"></i>
          <span className="text-xs font-bold">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center p-2 w-1/2 rounded-lg relative transition ${
            activeTab === 'tasks' ? 'text-[#FF5722] font-bold' : 'text-gray-400'
          }`}
        >
          <i className="fa-solid fa-motorcycle text-xl mb-1"></i>
          <span className="text-xs font-bold">مشاويري</span>
          {activeCount > 0 && (
            <span className="absolute top-1 right-1/4 bg-[#F44336] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {activeCount}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};
