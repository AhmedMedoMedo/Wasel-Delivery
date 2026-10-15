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
    driverVerifyPickup,
    openCommissionModal,
    getCommissionOwed,
    getRestaurant,
    getDriverRating,
    showToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'feed' | 'tasks'>('feed');
  const [vehicleFilter, setVehicleFilter] = useState<'all' | 'motorcycle' | 'car'>('all');
  const [pickupCodes, setPickupCodes] = useState<Record<string, string>>({});
  const [verifyingMap, setVerifyingMap] = useState<Record<string, boolean>>({});

  const handleVerifyCode = async (orderId: string) => {
    const code = (pickupCodes[orderId] || '').trim();
    if (!code) {
      showToast('يرجى كتابة كود الاستلام السري المكون من 4 أرقام من المطعم', 'error');
      return;
    }
    setVerifyingMap((prev) => ({ ...prev, [orderId]: true }));
    const ok = await driverVerifyPickup(orderId, code);
    setVerifyingMap((prev) => ({ ...prev, [orderId]: false }));
    if (ok) {
      setPickupCodes((prev) => ({ ...prev, [orderId]: '' }));
    }
  };

  const rating = currentUser ? getDriverRating(currentUser.id) : '0.0';
  const commissionOwed = getCommissionOwed(currentUser);

  // Available orders for this driver
  const availableOrders = orders
    .filter(
      (o) =>
        o.status === 'pending' &&
        !(o.applyingDrivers && o.applyingDrivers.includes(currentUser?.id || '')) &&
        (vehicleFilter === 'all' || o.vehicleType === 'any' || o.vehicleType === vehicleFilter)
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
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800 relative">
      {/* Top Header - Sticky on mobile */}
      <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-md px-3.5 sm:px-4 py-2.5 sm:py-3 flex justify-between items-center shadow-xs border-b border-gray-100">
        <button
          onClick={openCommissionModal}
          className="flex items-center gap-2.5 sm:gap-3 text-right group cursor-pointer hover:opacity-95 transition"
          title="اضغط لعرض كشف حساب العمولات وطرق السداد"
        >
          <div className="relative">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                currentUser?.name || 'م'
              )}&background=FF5722&color=fff`}
              alt="Avatar"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-gray-200"
            />
            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <div className="bg-amber-100 text-yellow-600 px-1 py-0.2 rounded-full text-[10px] flex items-center justify-center font-bold">
                <i className="fa-solid fa-star text-yellow-500 ml-0.5"></i>
                <span>{rating}</span>
              </div>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="font-bold text-xs sm:text-sm text-[#263238] truncate max-w-[140px] sm:max-w-none">
                {currentUser?.name || 'مندوب'}
              </h2>
              <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.2 rounded-full font-bold shrink-0">
                {currentUser?.vehicle === 'car' ? 'سيارة' : 'موتوسيكل'}
              </span>
            </div>
            <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
              <span>العمولات:</span>
              <span className="font-bold text-[#F44336] bg-red-50 px-1.5 py-0.5 rounded-md border border-red-100 group-hover:bg-red-100 transition">
                {commissionOwed.toFixed(2)} ج.م
              </span>
              <span className="text-[10px] text-gray-400 font-normal">(1 ج.م/طلب)</span>
              <i className="fa-solid fa-receipt text-[10px] text-[#FF5722] mr-0.5"></i>
            </p>
          </div>
        </button>
        <button
          onClick={logout}
          className="text-gray-400 hover:text-[#F44336] p-2 transition rounded-xl hover:bg-gray-50"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <i className="fa-solid fa-right-from-bracket text-lg"></i>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-3.5 sm:p-4 pb-28">
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

            {/* Quick Vehicle Filter (Feature 2 enhancement) */}
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setVehicleFilter('all')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                  vehicleFilter === 'all'
                    ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <span>الكل</span>
                <span className="text-[10px] opacity-80">({orders.filter((o) => o.status === 'pending').length})</span>
              </button>
              <button
                onClick={() => setVehicleFilter('motorcycle')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                  vehicleFilter === 'motorcycle'
                    ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <i className="fa-solid fa-motorcycle text-xs"></i>
                <span>موتوسيكل</span>
              </button>
              <button
                onClick={() => setVehicleFilter('car')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 border ${
                  vehicleFilter === 'car'
                    ? 'bg-[#FF5722] text-white border-[#FF5722] shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                }`}
              >
                <i className="fa-solid fa-car text-xs"></i>
                <span>سيارة</span>
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
                        <span className="bg-gray-100 text-gray-600 px-2.5 py-1 rounded text-xs font-bold flex items-center gap-1">
                          <i
                            className={`fa-solid ${
                              order.vehicleType === 'motorcycle' ? 'fa-motorcycle' : 'fa-car'
                            }`}
                          ></i>
                          <span>{order.vehicleType === 'car' ? 'سيارة' : 'موتوسيكل'}</span>
                        </span>
                      </div>

                      <div className="p-4">
                        <p className="text-sm font-bold mb-2 flex items-center">
                          <i className="fa-solid fa-utensils text-gray-400 ml-1.5"></i>{' '}
                          {order.type}
                        </p>

                        {/* Feature 2: Show delivery address if provided */}
                        {order.deliveryAddress && (
                          <div className="mb-3 text-xs bg-blue-50/70 border border-blue-100 rounded-lg p-2 text-blue-900 flex items-center justify-between">
                            <span className="flex items-center gap-1.5 truncate">
                              <i className="fa-solid fa-location-dot text-blue-500"></i>
                              <span className="truncate">التوصيل: {order.deliveryAddress}</span>
                            </span>
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[10px] bg-white text-blue-600 font-bold px-2 py-0.5 rounded shadow-2xs shrink-0 mr-1"
                            >
                              خريطة
                            </a>
                          </div>
                        )}

                        <div className="flex gap-2 mb-3">
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

                        <div className="flex items-center justify-between text-[11px] text-gray-500 mb-3 px-1">
                          <span className="flex items-center gap-1">
                            <i className="fa-solid fa-shield-halved text-[#FF5722]"></i>
                            <span>عمولة المنصة: 1.00 ج.م ثابتة</span>
                          </span>
                          <span className="text-[#4CAF50] font-bold">
                            صافي الربح: {(order.deliveryFee - 1).toFixed(0)} ج.م
                          </span>
                        </div>

                        <button
                          onClick={() => driverAcceptOrder(order.id)}
                          className="w-full bg-[#FF5722] hover:bg-[#F4511E] text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-[#FF5722]/20 active:scale-95 transition"
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
                    const cleanPhone = order.contactPhone.replace(/\D/g, '');
                    const waMsg = encodeURIComponent(
                      `مرحباً ${rest?.name || 'المطعم'}، أنا كابتن ${currentUser?.name || ''} مندوب وصل دليفري، اخترتني للأوردر #${shortId} (${order.type}) وأنا في طريقي إليكم لاستلام الطلب ودفع حسابه.`
                    );
                    const isPickedUp = !!order.pickedUp;
                    const codeVal = pickupCodes[order.id] || '';
                    const isVerifying = !!verifyingMap[order.id];

                    statusContent = (
                      <div className="space-y-3 mt-3">
                        {/* Stage 1: Handover & Payment Verification */}
                        {!isPickedUp ? (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50/80 border border-amber-200 rounded-xl p-3 text-right shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px]">1</span>
                                المرحلة 1: التوجه للمطعم واستلام الطلب
                              </span>
                              <span className="text-[10px] font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full">
                                بانتظار الاستلام
                              </span>
                            </div>

                            <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200/80 text-xs text-gray-700 space-y-1">
                              <div className="flex justify-between items-center text-red-600 font-bold pb-1 border-b border-amber-100">
                                <span>المطلوب دفعه للمطعم نقداً:</span>
                                <span className="text-sm bg-red-50 text-red-600 px-2 py-0.5 rounded font-extrabold">
                                  {order.orderPrice} ج.م
                                </span>
                              </div>
                              <p className="flex justify-between pt-1">
                                <span className="text-gray-500">اسم المطعم:</span>
                                <span className="font-bold text-[#263238]">{rest?.name || 'مطعم'}</span>
                              </p>
                              <p className="flex justify-between">
                                <span className="text-gray-500">رقم الهاتف:</span>
                                <span className="font-bold text-[#FF5722] dir-ltr">{order.contactPhone}</span>
                              </p>
                            </div>

                            {/* One-Tap Call, WhatsApp, & Maps to Restaurant */}
                            <div className="grid grid-cols-2 gap-2">
                              <a
                                href={`tel:${order.contactPhone}`}
                                className="bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 text-xs py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                              >
                                <i className="fa-solid fa-phone text-[#4CAF50]"></i>
                                <span>اتصال بالمطعم</span>
                              </a>

                              <a
                                href={`https://wa.me/20${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}?text=${waMsg}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition shadow-2xs"
                              >
                                <i className="fa-brands fa-whatsapp text-sm"></i>
                                <span>واتساب المطعم</span>
                              </a>
                            </div>

                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(rest?.name || 'مطعم')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs py-2 px-2 rounded-lg font-bold flex items-center justify-center gap-1.5 transition text-center"
                            >
                              <i className="fa-solid fa-store text-blue-500"></i>
                              <span>فتح موقع المطعم في خرائط جوجل</span>
                            </a>

                            {/* Pickup Verification Methods */}
                            <div className="bg-white p-2.5 rounded-lg border border-amber-200/90 text-right space-y-2">
                              <p className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                <i className="fa-solid fa-shield-halved text-[#FF5722]"></i>
                                <span>كيف يتم تأكيد استلام الأوردر؟</span>
                              </p>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                • <strong className="text-gray-700">طريقة 1:</strong> بعد دفع {order.orderPrice} ج.م نقداً، سيضغط المطعم زر تأكيد الاستلام من جهازه مباشرة.
                              </p>
                              <p className="text-[11px] text-gray-500 leading-relaxed">
                                • <strong className="text-gray-700">طريقة 2:</strong> أو اطلب من المطعم "كود الاستلام السري" المكون من 4 أرقام واكتبه هنا:
                              </p>
                              <div className="flex gap-2 pt-1">
                                <input
                                  type="text"
                                  inputMode="numeric"
                                  maxLength={4}
                                  placeholder="كود 4 أرقام"
                                  value={codeVal}
                                  onChange={(e) =>
                                    setPickupCodes((prev) => ({ ...prev, [order.id]: e.target.value }))
                                  }
                                  className="w-28 text-center font-mono font-bold tracking-widest text-sm bg-gray-50 border border-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-[#FF5722]"
                                />
                                <button
                                  type="button"
                                  disabled={isVerifying || codeVal.trim().length !== 4}
                                  onClick={() => handleVerifyCode(order.id)}
                                  className="flex-1 bg-[#FF5722] hover:bg-[#F4511E] disabled:bg-gray-300 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition flex items-center justify-center gap-1 cursor-pointer disabled:cursor-not-allowed shadow-2xs"
                                >
                                  {isVerifying ? (
                                    <i className="fa-solid fa-spinner fa-spin"></i>
                                  ) : (
                                    <i className="fa-solid fa-check"></i>
                                  )}
                                  <span>تأكيد الاستلام والكود</span>
                                </button>
                              </div>
                            </div>

                            {/* Locked completion button */}
                            <div className="pt-1">
                              <button
                                disabled
                                className="w-full bg-gray-200 text-gray-500 py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-not-allowed border border-gray-300/60"
                              >
                                <i className="fa-solid fa-lock text-sm"></i>
                                <span>زر إنهاء التوصيل مقفول لحين استلام الأوردر من المطعم أولاً</span>
                              </button>
                            </div>
                          </div>
                        ) : (
                          /* Stage 2: Out for delivery to customer */
                          <div className="bg-gradient-to-br from-green-50 to-emerald-50/70 border border-green-200 rounded-xl p-3 text-right shadow-2xs space-y-2.5">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-green-950 flex items-center gap-1.5">
                                <span className="w-5 h-5 rounded-full bg-[#4CAF50] text-white flex items-center justify-center text-[10px]">2</span>
                                المرحلة 2: في طريقك لتسليم الأوردر للعميل
                              </span>
                              <span className="text-[10px] font-bold bg-green-200 text-green-900 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <i className="fa-solid fa-circle-check text-[10px]"></i>
                                تم استلام الوجبة
                              </span>
                            </div>

                            <div className="bg-white p-2.5 rounded-lg border border-green-200 text-xs space-y-1.5">
                              <div className="flex justify-between items-center text-[#4CAF50] font-bold pb-1 border-b border-gray-100">
                                <span className="text-gray-700">تحصل من العميل عند التسليم:</span>
                                <span className="text-sm bg-green-50 text-green-700 px-2 py-0.5 rounded font-extrabold">
                                  {order.orderPrice + order.deliveryFee} ج.م
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 flex justify-between">
                                <span>(ثمن الأوردر {order.orderPrice} ج.م + مصاريف التوصيل {order.deliveryFee} ج.م)</span>
                                <span className="font-bold text-[#FF5722]">
                                  صافي ربحك: {order.deliveryFee - 1} ج.م
                                </span>
                              </p>
                            </div>

                            {/* Customer Delivery Address & Maps */}
                            {order.deliveryAddress ? (
                              <div className="bg-white p-2.5 rounded-lg border border-blue-200 flex items-center justify-between gap-2">
                                <div className="text-xs min-w-0">
                                  <span className="text-[10px] text-gray-500 block">عنوان العميل:</span>
                                  <span className="font-bold text-blue-950 truncate block">{order.deliveryAddress}</span>
                                </div>
                                <a
                                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold py-1.5 px-3 rounded-lg flex items-center gap-1 shadow-2xs shrink-0"
                                >
                                  <i className="fa-solid fa-diamond-turn-right text-xs"></i>
                                  <span>خرائط جوجل</span>
                                </a>
                              </div>
                            ) : (
                              <div className="bg-amber-50 text-amber-800 p-2 rounded-lg text-xs border border-amber-200">
                                <i className="fa-solid fa-circle-info ml-1 text-amber-600"></i>
                                تواصل مع المطعم أو العميل لتحديد مكان التسليم بالتفصيل.
                              </div>
                            )}

                            {/* Active Complete Delivery Button */}
                            <div className="pt-1">
                              <button
                                onClick={() => driverCompleteOrder(order.id)}
                                className="w-full bg-[#4CAF50] hover:bg-[#43A047] text-white py-3 px-3 rounded-xl text-sm font-bold shadow-md shadow-[#4CAF50]/30 active:scale-98 transition flex items-center justify-center gap-2 cursor-pointer"
                              >
                                <i className="fa-solid fa-circle-check text-base"></i>
                                <span>تم تسليم العميل بنجاح واستلام {order.orderPrice + order.deliveryFee} ج.م</span>
                              </button>
                              <p className="text-[10px] text-gray-500 text-center mt-1">
                                * عمولة المنصة: 1.00 ج.م ثابتة تُسجل تلقائياً في حسابك.
                              </p>
                            </div>
                          </div>
                        )}
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
                          <p className="flex justify-between">
                            <span><i className="fa-solid fa-store text-gray-400 w-4 ml-1"></i> المطعم:</span>
                            <span className="font-bold text-[#263238]">{rest?.name || ''}</span>
                          </p>
                          <p className="flex justify-between">
                            <span><i className="fa-solid fa-stopwatch text-gray-400 w-4 ml-1"></i> استغرق التوصيل:</span>
                            <span className="font-bold text-[#263238]">{diffMins} دقيقة</span>
                          </p>
                          <p className="flex justify-between text-[#F44336] bg-white p-1.5 rounded border border-green-100 font-bold">
                            <span>عمولة المنصة المسجلة:</span>
                            <span>1.00 ج.م</span>
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

      {/* Bottom Nav Bar - Fixed for seamless mobile scrolling */}
      <div className="fixed bottom-0 left-0 right-0 max-w-[480px] mx-auto bg-white/95 backdrop-blur-md border-t border-gray-200/80 flex justify-around p-1.5 pb-3 z-30 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={() => setActiveTab('feed')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 w-1/2 rounded-xl transition ${
            activeTab === 'feed' ? 'text-[#FF5722] font-bold bg-orange-50/60' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <i className="fa-solid fa-house text-xl mb-0.5"></i>
          <span className="text-xs">الرئيسية</span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`flex flex-col items-center justify-center py-1.5 px-3 w-1/2 rounded-xl relative transition ${
            activeTab === 'tasks' ? 'text-[#FF5722] font-bold bg-orange-50/60' : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <div className="relative">
            <i className="fa-solid fa-motorcycle text-xl mb-0.5"></i>
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-[#F44336] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </div>
          <span className="text-xs">مشاويري</span>
        </button>
      </div>
    </div>
  );
};
