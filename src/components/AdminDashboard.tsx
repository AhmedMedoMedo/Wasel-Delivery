import React, { useState } from 'react';
import { useApp, COMMISSION_PER_ORDER } from '../context/AppContext';
import { User, PublicProfile, Order, DocumentImages, UserRole } from '../types';

type AdminTab = 'requests' | 'payments' | 'users' | 'orders';

interface ImageModalState {
  isOpen: boolean;
  imageUrl: string;
  title: string;
  userName: string;
}

export const AdminDashboard: React.FC = () => {
  const {
    orders,
    users,
    logout,
    getRestaurant,
    getDriver,
    adminApproveUser,
    adminRejectUser,
    adminDeleteUser,
    adminDeleteOrder,
    adminResetCommission,
    adminConfirmPayment,
    adminRejectPayment,
    getCommissionOwed,
  } = useApp();

  const [activeTab, setActiveTab] = useState<AdminTab>('requests');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'restaurant' | 'driver'>('all');
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState<'all' | 'pending' | 'active' | 'completed'>('all');

  // Rejection modal state
  const [rejectModalUser, setRejectModalUser] = useState<User | PublicProfile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Confirmation dialog state
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | PublicProfile | null>(null);
  const [confirmDeleteOrder, setConfirmDeleteOrder] = useState<Order | null>(null);
  const [confirmResetUser, setConfirmResetUser] = useState<User | PublicProfile | null>(null);

  // Full Image inspection modal state
  const [imageModal, setImageModal] = useState<ImageModalState>({
    isOpen: false,
    imageUrl: '',
    title: '',
    userName: '',
  });

  // User Documents view modal (for reviewing documents at any time from the Users tab)
  const [reviewDocsUser, setReviewDocsUser] = useState<User | PublicProfile | null>(null);

  // Calculations
  const pendingRequests = users.filter(
    (u) => u.role !== 'admin' && (u.approvalStatus === 'pending' || !u.approvalStatus)
  );

  const pendingPayments = users.filter((u) => u.paymentPending === true);

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.reduce(
    (sum, o) => sum + (o.commission ?? COMMISSION_PER_ORDER),
    0
  );
  const totalRests = users.filter((u) => u.role === 'restaurant').length;
  const totalDrivers = users.filter((u) => u.role === 'driver').length;

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredOrders = sortedOrders.filter((o) => {
    if (orderStatusFilter === 'all') return true;
    return o.status === orderStatusFilter;
  });

  const filteredUsers = users
    .filter((u) => u.role !== 'admin')
    .filter((u) => {
      if (userRoleFilter === 'all') return true;
      return u.role === userRoleFilter;
    })
    .filter((u) => {
      if (!userSearchQuery.trim()) return true;
      const q = userSearchQuery.toLowerCase();
      return (
        u.name?.toLowerCase().includes(q) ||
        u.phone?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    });

  const openImage = (url: string, title: string, userName: string) => {
    setImageModal({
      isOpen: true,
      imageUrl: url,
      title,
      userName,
    });
  };

  const closeImage = () => {
    setImageModal({
      isOpen: false,
      imageUrl: '',
      title: '',
      userName: '',
    });
  };

  const handleApprove = async (userId: string) => {
    await adminApproveUser(userId);
  };

  const handleOpenRejectModal = (user: User | PublicProfile) => {
    setRejectModalUser(user);
    setRejectionReason('الصور المرفقة غير واضحة أو لم تستوفِ الشروط المطلوبة');
  };

  const handleConfirmReject = async () => {
    if (!rejectModalUser) return;
    await adminRejectUser(rejectModalUser.id, rejectionReason);
    setRejectModalUser(null);
    setRejectionReason('');
  };

  const handleExecuteDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    await adminDeleteUser(confirmDeleteUser.id);
    setConfirmDeleteUser(null);
  };

  const handleExecuteDeleteOrder = async () => {
    if (!confirmDeleteOrder) return;
    await adminDeleteOrder(confirmDeleteOrder.id);
    setConfirmDeleteOrder(null);
  };

  const handleExecuteResetCommission = async () => {
    if (!confirmResetUser) return;
    await adminResetCommission(confirmResetUser.id);
    setConfirmResetUser(null);
  };

  const getDocLabels = (role: UserRole) => {
    if (role === 'restaurant') {
      return {
        idCardFront: 'صورة رخصة المحل / السجل التجاري',
        idCardBack: 'صورة واجهة المحل أو اللوجو',
        personalPhoto: 'صورة شخصية حديثة للمدير/المالك',
        selfieWithId: 'صورة بطاقة صاحب المنشأة',
      };
    }
    return {
      idCardFront: 'بطاقة الرقم القومي (الوجه الأمامي)',
      idCardBack: 'بطاقة الرقم القومي (الوجه الخلفي)',
      personalPhoto: 'صورة شخصية حديثة وواضحة',
      selfieWithId: 'صورة وأنت تحمل البطاقة / الرخصة',
    };
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 text-gray-800" dir="rtl">
      {/* Top Header */}
      <header className="bg-[#263238] text-white px-4 py-3.5 flex justify-between items-center shadow-md sticky top-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#FF5722] flex items-center justify-center text-white shadow-md shadow-[#FF5722]/30">
            <i className="fa-solid fa-shield-halved text-lg"></i>
          </div>
          <div>
            <h1 className="font-bold text-base leading-tight">لوحة تحكم الإدارة</h1>
            <p className="text-[10px] text-gray-300">نظام إدارة طلبات التسجيل والعمولات والعمليات</p>
          </div>
        </div>

        <button
          onClick={logout}
          className="text-gray-300 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-xl transition text-sm flex items-center gap-1.5"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <i className="fa-solid fa-right-from-bracket"></i>
          <span className="text-xs hidden sm:inline">خروج</span>
        </button>
      </header>

      {/* Quick KPI Overview */}
      <div className="p-3 bg-white border-b border-gray-200">
        <div className="grid grid-cols-4 gap-2 text-center">
          <div className="bg-blue-50/70 border border-blue-100 p-2 rounded-xl">
            <span className="text-[10px] text-blue-700 block font-medium">الطلبات</span>
            <span className="text-base font-black text-blue-900">{totalOrders}</span>
          </div>
          <div className="bg-green-50/70 border border-green-100 p-2 rounded-xl">
            <span className="text-[10px] text-green-700 block font-medium">العمولات (ج.م)</span>
            <span className="text-base font-black text-green-900">{totalRevenue.toFixed(0)}</span>
          </div>
          <div className="bg-amber-50/70 border border-amber-100 p-2 rounded-xl">
            <span className="text-[10px] text-amber-700 block font-medium">طلبات جديدة</span>
            <span className="text-base font-black text-amber-900">{pendingRequests.length}</span>
          </div>
          <div className="bg-purple-50/70 border border-purple-100 p-2 rounded-xl">
            <span className="text-[10px] text-purple-700 block font-medium">إشعار سداد</span>
            <span className="text-base font-black text-purple-900">{pendingPayments.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation (Optimized for Mobile) */}
      <div className="bg-white border-b border-gray-200 px-2 py-2 sticky top-[60px] z-10 shadow-2xs">
        <div className="grid grid-cols-4 gap-1">
          {/* Tab 1: Requests */}
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
              activeTab === 'requests'
                ? 'bg-[#FF5722] text-white shadow-sm shadow-[#FF5722]/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fa-solid fa-user-clock text-sm"></i>
            <span className="text-[11px] truncate">طلبات الانضمام</span>
            {pendingRequests.length > 0 && (
              <span
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                  activeTab === 'requests' ? 'bg-white text-[#FF5722]' : 'bg-[#FF5722] text-white shadow-xs'
                }`}
              >
                {pendingRequests.length}
              </span>
            )}
          </button>

          {/* Tab 2: Payments */}
          <button
            onClick={() => setActiveTab('payments')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 relative cursor-pointer ${
              activeTab === 'payments'
                ? 'bg-[#4CAF50] text-white shadow-sm shadow-[#4CAF50]/30'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fa-solid fa-money-check-dollar text-sm"></i>
            <span className="text-[11px] truncate">إشعارات السداد</span>
            {pendingPayments.length > 0 && (
              <span
                className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black ${
                  activeTab === 'payments' ? 'bg-white text-[#4CAF50]' : 'bg-[#4CAF50] text-white shadow-xs animate-bounce'
                }`}
              >
                {pendingPayments.length}
              </span>
            )}
          </button>

          {/* Tab 3: Users */}
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#263238] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fa-solid fa-users-gear text-sm"></i>
            <span className="text-[11px] truncate">المستخدمين</span>
          </button>

          {/* Tab 4: Orders */}
          <button
            onClick={() => setActiveTab('orders')}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-[#263238] text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <i className="fa-solid fa-list-check text-sm"></i>
            <span className="text-[11px] truncate">الطلبات</span>
          </button>
        </div>
      </div>

      {/* Main Tab Content */}
      <main className="flex-1 p-3 pb-24 overflow-y-auto">
        {/* ======================================================== */}
        {/* TAB 1: PENDING REGISTRATION REQUESTS & DOCUMENT AUDITING */}
        {/* ======================================================== */}
        {activeTab === 'requests' && (
          <div className="space-y-3">
            <div className="flex justify-between items-center mb-1">
              <h2 className="font-bold text-sm text-[#263238] flex items-center gap-1.5">
                <i className="fa-solid fa-file-signature text-[#FF5722]"></i>
                <span>طلبات التسجيل الجديدة المعلقة ({pendingRequests.length})</span>
              </h2>
              <span className="text-[11px] text-gray-500">راجع صور المستندات واقبل أو ارفض</span>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-2xs">
                <div className="w-14 h-14 bg-green-50 text-green-500 rounded-full flex items-center justify-center text-2xl mx-auto mb-3">
                  <i className="fa-solid fa-circle-check"></i>
                </div>
                <h3 className="font-bold text-sm text-gray-800 mb-1">لا توجد طلبات انضمام جديدة</h3>
                <p className="text-xs text-gray-500">
                  جميع طلبات تسجيل المطاعم والمناديب تمت مراجعتها واعتمادها بالفعل.
                </p>
              </div>
            ) : (
              pendingRequests.map((applicant) => {
                const docLabels = getDocLabels(applicant.role);
                const docs = applicant.documents || {};
                const hasDocs = Object.keys(docs).length > 0;

                return (
                  <div
                    key={applicant.id}
                    className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-3.5 transition hover:shadow-md"
                  >
                    {/* Header info */}
                    <div className="flex justify-between items-start border-b border-gray-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs ${
                            applicant.role === 'restaurant'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <i
                            className={
                              applicant.role === 'restaurant'
                                ? 'fa-solid fa-utensils'
                                : 'fa-solid fa-motorcycle'
                            }
                          ></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h3 className="font-bold text-sm text-gray-900">{applicant.name}</h3>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                applicant.role === 'restaurant'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {applicant.role === 'restaurant' ? 'مطعم' : 'مندوب'}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                            {applicant.phone && (
                              <a
                                href={`tel:${applicant.phone}`}
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <i className="fa-solid fa-phone text-[10px]"></i>
                                <span dir="ltr">{applicant.phone}</span>
                              </a>
                            )}
                            {applicant.email && (
                              <span className="text-gray-400 text-[11px] truncate max-w-[170px]" dir="ltr">
                                {applicant.email}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-left text-[11px] text-gray-400">
                        {applicant.createdAt
                          ? new Date(applicant.createdAt).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'حديثاً'}
                      </div>
                    </div>

                    {/* Inspection section: 4 Images */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                          <i className="fa-solid fa-images text-[#FF5722]"></i>
                          صور المستندات المرفوعة للتوثيق
                        </span>
                        {!hasDocs && (
                          <span className="text-[10px] text-red-500 font-bold bg-red-50 px-2 py-0.5 rounded">
                            لم يتم رفع صور
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {/* Doc 1: idCardFront / Commercial Register */}
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-gray-600 mb-1.5 truncate">
                            {docLabels.idCardFront}
                          </p>
                          {docs.idCardFront ? (
                            <div
                              onClick={() =>
                                openImage(docs.idCardFront!, docLabels.idCardFront, applicant.name)
                              }
                              className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video flex items-center justify-center"
                            >
                              <img
                                src={docs.idCardFront}
                                alt="Front"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold gap-1">
                                <i className="fa-solid fa-magnifying-glass-plus"></i> تكبير
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300">
                              غير مرفوع
                            </div>
                          )}
                        </div>

                        {/* Doc 2: idCardBack / Storefront */}
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-gray-600 mb-1.5 truncate">
                            {docLabels.idCardBack}
                          </p>
                          {docs.idCardBack ? (
                            <div
                              onClick={() =>
                                openImage(docs.idCardBack!, docLabels.idCardBack, applicant.name)
                              }
                              className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video flex items-center justify-center"
                            >
                              <img
                                src={docs.idCardBack}
                                alt="Back"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold gap-1">
                                <i className="fa-solid fa-magnifying-glass-plus"></i> تكبير
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300">
                              غير مرفوع
                            </div>
                          )}
                        </div>

                        {/* Doc 3: Personal Photo */}
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-gray-600 mb-1.5 truncate">
                            {docLabels.personalPhoto}
                          </p>
                          {docs.personalPhoto ? (
                            <div
                              onClick={() =>
                                openImage(docs.personalPhoto!, docLabels.personalPhoto, applicant.name)
                              }
                              className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video flex items-center justify-center"
                            >
                              <img
                                src={docs.personalPhoto}
                                alt="Personal"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold gap-1">
                                <i className="fa-solid fa-magnifying-glass-plus"></i> تكبير
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300">
                              غير مرفوع
                            </div>
                          )}
                        </div>

                        {/* Doc 4: Selfie with ID */}
                        <div className="bg-gray-50 p-2 rounded-xl border border-gray-200 flex flex-col justify-between">
                          <p className="text-[10px] font-bold text-gray-600 mb-1.5 truncate">
                            {docLabels.selfieWithId}
                          </p>
                          {docs.selfieWithId ? (
                            <div
                              onClick={() =>
                                openImage(docs.selfieWithId!, docLabels.selfieWithId, applicant.name)
                              }
                              className="relative group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-black aspect-video flex items-center justify-center"
                            >
                              <img
                                src={docs.selfieWithId}
                                alt="Selfie"
                                className="w-full h-full object-cover group-hover:scale-105 transition"
                              />
                              <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-xs font-bold gap-1">
                                <i className="fa-solid fa-magnifying-glass-plus"></i> تكبير
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300">
                              غير مرفوع
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons: Accept / Reject / Delete */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                      <button
                        onClick={() => handleApprove(applicant.id)}
                        className="flex-1 bg-[#4CAF50] hover:bg-[#43a047] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/20 active:scale-98 transition cursor-pointer"
                      >
                        <i className="fa-solid fa-circle-check"></i>
                        <span>قبول واعتماد الحساب</span>
                      </button>

                      <button
                        onClick={() => handleOpenRejectModal(applicant)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-amber-500/20 active:scale-98 transition cursor-pointer"
                      >
                        <i className="fa-solid fa-circle-xmark"></i>
                        <span>رفض الطلب</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeleteUser(applicant)}
                        className="w-10 h-10 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl flex items-center justify-center transition border border-red-200 cursor-pointer"
                        title="حذف هذا الطلب نهائياً"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: PAYMENT NOTIFICATIONS & COMMISSION RESET          */}
        {/* ======================================================== */}
        {activeTab === 'payments' && (
          <div className="space-y-4">
            {/* Sub-Section 1: Pending Payment Confirmations */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="font-bold text-sm text-[#263238] flex items-center gap-1.5">
                  <i className="fa-solid fa-bell text-[#4CAF50]"></i>
                  <span>المستخدمين الذين أرسلوا إشعار تم الدفع ({pendingPayments.length})</span>
                </h2>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 text-center border border-gray-200 shadow-2xs mb-4">
                  <i className="fa-solid fa-receipt text-3xl text-gray-300 mb-2"></i>
                  <p className="text-xs text-gray-500">
                    لا توجد إشعارات سداد معلقة بانتظار المراجعة والتأكيد حالياً.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5 mb-5">
                  {pendingPayments.map((user) => {
                    const owed = getCommissionOwed(user as User);
                    return (
                      <div
                        key={user.id}
                        className="bg-white rounded-2xl p-4 border-2 border-green-400 shadow-sm space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-sm text-gray-900">{user.name}</h3>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                  user.role === 'restaurant'
                                    ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                    : 'bg-blue-50 text-blue-700 border border-blue-200'
                                }`}
                              >
                                {user.role === 'restaurant' ? 'مطعم' : 'مندوب'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              رقم الهاتف: <span dir="ltr">{user.phone || '-'}</span>
                            </p>
                            {user.paymentReportedAt && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                وقت إشعار الدفع:{' '}
                                {new Date(user.paymentReportedAt).toLocaleTimeString('ar-EG', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                  day: 'numeric',
                                  month: 'short',
                                })}
                              </p>
                            )}
                          </div>

                          <div className="text-left bg-green-50 px-3 py-1.5 rounded-xl border border-green-200">
                            <span className="text-[10px] text-green-700 block">المبلغ المبلغ بسداده</span>
                            <span className="text-base font-extrabold text-[#4CAF50]">
                              {owed.toFixed(2)} ج.م
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <button
                            onClick={async () => {
                              await adminConfirmPayment(user.id);
                            }}
                            className="flex-1 bg-[#4CAF50] hover:bg-[#43a047] text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-green-500/20 active:scale-98 transition cursor-pointer"
                          >
                            <i className="fa-solid fa-check-double"></i>
                            <span>تأكيد السداد وتصفير العداد</span>
                          </button>

                          <button
                            onClick={async () => {
                              await adminRejectPayment(user.id);
                            }}
                            className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 active:scale-98 transition cursor-pointer"
                          >
                            <i className="fa-solid fa-xmark"></i>
                            <span>رفض إشعار السداد</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Sub-Section 2: Manual Fee Reset for All Users */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-2xs">
              <h3 className="font-bold text-xs text-[#263238] mb-1 flex items-center gap-1.5">
                <i className="fa-solid fa-rotate-left text-[#FF5722]"></i>
                <span>تصفير عداد الرسوم يدوياً لأي مستخدم</span>
              </h3>
              <p className="text-[11px] text-gray-500 mb-3">
                يمكنك تصفير عمولات أي مطعم أو مندوب مباشرة ليعود العداد لـ 0.00 ج.م
              </p>

              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {users
                  .filter((u) => u.role !== 'admin')
                  .map((u) => {
                    const owed = getCommissionOwed(u as User);
                    return (
                      <div key={u.id} className="py-2.5 flex justify-between items-center text-xs">
                        <div>
                          <p className="font-bold text-gray-800">{u.name}</p>
                          <p className="text-[10px] text-gray-400">
                            {u.role === 'restaurant' ? 'مطعم' : 'مندوب'} • الهاتف: {u.phone || '-'}
                          </p>
                        </div>

                        <div className="flex items-center gap-2.5">
                          <span
                            className={`font-bold font-mono ${
                              owed > 0 ? 'text-[#F44336]' : 'text-gray-400'
                            }`}
                          >
                            {owed.toFixed(2)} ج.م
                          </span>
                          <button
                            onClick={() => setConfirmResetUser(u)}
                            disabled={owed <= 0}
                            className="bg-gray-100 hover:bg-gray-200 disabled:opacity-40 text-gray-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                          >
                            <i className="fa-solid fa-arrows-rotate text-[10px]"></i>
                            <span>تصفير</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: ALL USERS MANAGEMENT & DOCUMENT AUDIT             */}
        {/* ======================================================== */}
        {activeTab === 'users' && (
          <div className="space-y-3">
            {/* Search and Filters */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <div className="relative">
                <i className="fa-solid fa-magnifying-glass absolute right-3 top-3 text-gray-400 text-xs"></i>
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="بحث بالاسم، رقم الهاتف، أو البريد..."
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl pr-9 pl-3 py-2 text-xs focus:outline-none focus:border-[#FF5722]"
                />
              </div>

              <div className="flex gap-1.5">
                <button
                  onClick={() => setUserRoleFilter('all')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    userRoleFilter === 'all'
                      ? 'bg-[#263238] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  الكل ({users.filter((u) => u.role !== 'admin').length})
                </button>
                <button
                  onClick={() => setUserRoleFilter('restaurant')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    userRoleFilter === 'restaurant'
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  المطاعم ({totalRests})
                </button>
                <button
                  onClick={() => setUserRoleFilter('driver')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                    userRoleFilter === 'driver'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  المناديب ({totalDrivers})
                </button>
              </div>
            </div>

            {/* Users List */}
            {filteredUsers.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-2xs">
                <i className="fa-solid fa-user-slash text-3xl text-gray-300 mb-2"></i>
                <p className="text-xs text-gray-500">لا يوجد مستخدمين مطابقين للبحث أو الفلتر.</p>
              </div>
            ) : (
              filteredUsers.map((user) => {
                const owed = getCommissionOwed(user as User);
                const hasDocs = user.documents && Object.keys(user.documents).length > 0;

                return (
                  <div
                    key={user.id}
                    className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-bold ${
                            user.role === 'restaurant'
                              ? 'bg-orange-100 text-orange-600'
                              : 'bg-blue-100 text-blue-600'
                          }`}
                        >
                          <i
                            className={
                              user.role === 'restaurant'
                                ? 'fa-solid fa-utensils'
                                : 'fa-solid fa-motorcycle'
                            }
                          ></i>
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <h4 className="font-bold text-sm text-gray-900">{user.name}</h4>
                            <span
                              className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                                user.role === 'restaurant'
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-blue-50 text-blue-700 border border-blue-200'
                              }`}
                            >
                              {user.role === 'restaurant' ? 'مطعم' : 'مندوب'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                            {user.phone ? (
                              <a
                                href={`tel:${user.phone}`}
                                className="text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <i className="fa-solid fa-phone text-[9px]"></i>
                                <span dir="ltr">{user.phone}</span>
                              </a>
                            ) : (
                              <span className="text-gray-400">بدون هاتف</span>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="font-bold text-gray-700">
                              العمولة: <span className="text-red-500">{owed.toFixed(1)} ج.م</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Approval badge */}
                      <div>
                        {user.approvalStatus === 'approved' && (
                          <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <i className="fa-solid fa-check"></i> معتمد
                          </span>
                        )}
                        {user.approvalStatus === 'pending' && (
                          <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <i className="fa-solid fa-hourglass-half"></i> معلق
                          </span>
                        )}
                        {user.approvalStatus === 'rejected' && (
                          <span className="text-[10px] bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <i className="fa-solid fa-xmark"></i> مرفوض
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 pt-1 border-t border-gray-100 text-xs">
                      {/* Review uploaded images at any time */}
                      <button
                        onClick={() => setReviewDocsUser(user)}
                        className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200 py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <i className="fa-solid fa-images text-[#FF5722]"></i>
                        <span>عرض المستندات ({hasDocs ? 'متوفرة' : 'لا توجد'})</span>
                      </button>

                      {/* Quick reset commission */}
                      <button
                        onClick={() => setConfirmResetUser(user)}
                        className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1 transition cursor-pointer"
                        title="تصفير الرسوم"
                      >
                        <i className="fa-solid fa-rotate-left"></i>
                        <span>تصفير</span>
                      </button>

                      {/* Delete user */}
                      <button
                        onClick={() => setConfirmDeleteUser(user)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-xl transition cursor-pointer"
                        title="حذف المستخدم نهائياً"
                      >
                        <i className="fa-solid fa-trash-can text-sm"></i>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: ORDERS MANAGEMENT & DELETION                      */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-3">
            {/* Filter pills */}
            <div className="flex gap-1.5 bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs">
              <button
                onClick={() => setOrderStatusFilter('all')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderStatusFilter === 'all'
                    ? 'bg-[#263238] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                الكل ({orders.length})
              </button>
              <button
                onClick={() => setOrderStatusFilter('pending')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderStatusFilter === 'pending'
                    ? 'bg-amber-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                انتظار
              </button>
              <button
                onClick={() => setOrderStatusFilter('active')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderStatusFilter === 'active'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                نشط
              </button>
              <button
                onClick={() => setOrderStatusFilter('completed')}
                className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition ${
                  orderStatusFilter === 'completed'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                مكتمل
              </button>
            </div>

            {/* Orders list */}
            {filteredOrders.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center border border-gray-200 shadow-2xs">
                <i className="fa-solid fa-box-open text-3xl text-gray-300 mb-2"></i>
                <p className="text-xs text-gray-500">لا توجد طلبات مطابقة لهذا الفلتر.</p>
              </div>
            ) : (
              filteredOrders.map((order) => {
                const rest = getRestaurant(order.restaurantId)?.name || 'مطعم غير معروف';
                const driver = order.driverId ? getDriver(order.driverId)?.name : 'بانتظار مندوب';
                const shortId = order.id.replace('ord-', '').substring(0, 5);

                let statusBadge = (
                  <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold">
                    انتظار
                  </span>
                );
                if (order.status === 'active') {
                  statusBadge = (
                    <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                      جاري التوصيل
                    </span>
                  );
                } else if (order.status === 'completed') {
                  statusBadge = (
                    <span className="text-[10px] bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-bold">
                      مكتمل
                    </span>
                  );
                }

                return (
                  <div
                    key={order.id}
                    className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-gray-400">#{shortId}</span>
                          <h4 className="font-bold text-sm text-gray-800">{order.type}</h4>
                          {statusBadge}
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          <span className="font-bold text-gray-700">المطعم:</span> {rest}
                          <span className="mx-1.5 text-gray-300">•</span>
                          <span className="font-bold text-gray-700">المندوب:</span> {driver}
                        </p>
                      </div>

                      <div className="text-left font-mono">
                        <span className="text-xs font-black text-[#FF5722] block">
                          {order.deliveryFee.toFixed(1)} ج.م
                        </span>
                        <span className="text-[10px] text-gray-400">
                          ثمن: {order.orderPrice.toFixed(0)} ج.م
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-xs">
                      <span className="text-[11px] text-gray-400">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('ar-EG', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : ''}
                      </span>

                      <button
                        onClick={() => setConfirmDeleteOrder(order)}
                        className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                        title="حذف الطلب"
                      >
                        <i className="fa-solid fa-trash-can text-[11px]"></i>
                        <span>حذف الطلب</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL 1: FULL RESOLUTION IMAGE INSPECTION MODAL          */}
      {/* ======================================================== */}
      {imageModal.isOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex flex-col justify-between p-4"
          dir="rtl"
          onClick={closeImage}
        >
          <div className="flex justify-between items-center text-white pb-3 border-b border-white/10">
            <div>
              <h3 className="font-bold text-sm text-white">{imageModal.title}</h3>
              <p className="text-xs text-gray-300">مقدم الطلب: {imageModal.userName}</p>
            </div>
            <button
              onClick={closeImage}
              className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition"
            >
              <i className="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <div
            className="flex-1 flex items-center justify-center p-2 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={imageModal.imageUrl}
              alt="Inspection"
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-2xl border border-white/20"
            />
          </div>

          <div className="flex justify-center gap-3 pt-3 border-t border-white/10">
            <a
              href={imageModal.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white text-gray-900 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-gray-100 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <i className="fa-solid fa-arrow-up-right-from-square"></i>
              <span>فتح بالحجم الأصلي</span>
            </a>
            <button
              onClick={closeImage}
              className="bg-gray-700 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-gray-600 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 2: USER DOCUMENTS REVIEW (AT ANY TIME)             */}
      {/* ======================================================== */}
      {reviewDocsUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#263238] text-white p-4 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2">
                  <i className="fa-solid fa-folder-open text-[#FF5722]"></i>
                  <span>مستندات وتوثيق: {reviewDocsUser.name}</span>
                </h3>
                <p className="text-[11px] text-gray-300">
                  {reviewDocsUser.role === 'restaurant' ? 'مطعم' : 'مندوب'} • الهاتف: {reviewDocsUser.phone || '-'}
                </p>
              </div>
              <button
                onClick={() => setReviewDocsUser(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-gray-300 transition"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[75vh] overflow-y-auto">
              {(() => {
                const labels = getDocLabels(reviewDocsUser.role);
                const docs = reviewDocsUser.documents || {};
                const keys: (keyof DocumentImages)[] = [
                  'idCardFront',
                  'idCardBack',
                  'personalPhoto',
                  'selfieWithId',
                ];

                const hasAny = keys.some((k) => !!docs[k]);

                if (!hasAny) {
                  return (
                    <div className="text-center py-8 text-gray-400 text-xs">
                      <i className="fa-solid fa-file-circle-xmark text-3xl mb-2 text-gray-300"></i>
                      <p>لم يقم هذا المستخدم برفع أي صور أو مستندات حتى الآن.</p>
                    </div>
                  );
                }

                return (
                  <div className="grid grid-cols-2 gap-3">
                    {keys.map((key) => {
                      const url = docs[key];
                      const title = labels[key as keyof typeof labels] || key;
                      return (
                        <div key={key} className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
                          <p className="text-[10px] font-bold text-gray-700 mb-2 truncate">{title}</p>
                          {url ? (
                            <div
                              onClick={() => openImage(url, title, reviewDocsUser.name)}
                              className="relative group cursor-pointer overflow-hidden rounded-lg aspect-video bg-black flex items-center justify-center border border-gray-300"
                            >
                              <img src={url} alt={title} className="w-full h-full object-cover" />
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-white text-[11px] font-bold gap-1">
                                <i className="fa-solid fa-magnifying-glass-plus"></i> عرض
                              </div>
                            </div>
                          ) : (
                            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-[10px] text-gray-400 border border-dashed border-gray-300">
                              غير مرفوع
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}

              <div className="pt-2 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setReviewDocsUser(null)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: REJECTION REASON PROMPT                         */}
      {/* ======================================================== */}
      {rejectModalUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600">
              <i className="fa-solid fa-triangle-exclamation text-2xl"></i>
              <div>
                <h3 className="font-bold text-sm text-gray-900">رفض طلب التسجيل</h3>
                <p className="text-xs text-gray-500">{rejectModalUser.name}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                سبب الرفض (يظهر للمتقدم عند محاولة الدخول):
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs focus:outline-none focus:border-amber-500"
                placeholder="اكتب سبب الرفض هنا..."
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleConfirmReject}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => setRejectModalUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: CONFIRM DELETE USER                             */}
      {/* ======================================================== */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">
                <i className="fa-solid fa-trash-can"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">حذف المستخدم نهائياً</h3>
                <p className="text-xs text-gray-500">{confirmDeleteUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-red-50 p-3 rounded-xl border border-red-100">
              هل أنت متأكد من حذف هذا الحساب نهائياً من قاعدة البيانات؟ لا يمكن التراجع عن هذا الإجراء وسيتم مسح كافة بياناته ومستنداته.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteDeleteUser}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                نعم، احذف المستخدم
              </button>
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 5: CONFIRM DELETE ORDER                            */}
      {/* ======================================================== */}
      {confirmDeleteOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2.5 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-lg">
                <i className="fa-solid fa-trash-can"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">حذف الطلب</h3>
                <p className="text-xs text-gray-500">
                  طلب #{confirmDeleteOrder.id.replace('ord-', '').substring(0, 5)} - {confirmDeleteOrder.type}
                </p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-red-50 p-3 rounded-xl border border-red-100">
              هل أنت متأكد من حذف هذا الطلب نهائياً من سجل الطلبات؟
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteDeleteOrder}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                نعم، احذف الطلب
              </button>
              <button
                onClick={() => setConfirmDeleteOrder(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 6: CONFIRM COMMISSION RESET                        */}
      {/* ======================================================== */}
      {confirmResetUser && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white w-full max-w-sm rounded-3xl p-5 shadow-2xl border border-gray-100 space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600">
              <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-lg">
                <i className="fa-solid fa-rotate-left"></i>
              </div>
              <div>
                <h3 className="font-bold text-sm text-gray-900">تصفير عداد الرسوم</h3>
                <p className="text-xs text-gray-500">{confirmResetUser.name}</p>
              </div>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed bg-amber-50 p-3 rounded-xl border border-amber-100">
              سيتم إعادة عداد عمولات هذا الحساب إلى 0.00 ج.م وسيبدأ الاحتساب من جديد مع أي طلبات تالية. هل تريد المتابعة؟
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExecuteResetCommission}
                className="flex-1 bg-[#4CAF50] hover:bg-[#43a047] text-white py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                تأكيد التصفير
              </button>
              <button
                onClick={() => setConfirmResetUser(null)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
