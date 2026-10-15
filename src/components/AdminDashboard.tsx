import React from 'react';
import { useApp, COMMISSION_RATE } from '../context/AppContext';

export const AdminDashboard: React.FC = () => {
  const { orders, users, logout, getRestaurant, getDriver } = useApp();

  const totalOrders = orders.length;
  const completedOrders = orders.filter((o) => o.status === 'completed');
  const totalRevenue = completedOrders.length * (COMMISSION_RATE * 2);
  const totalRests = users.filter((u) => u.role === 'restaurant').length;
  const totalDrivers = users.filter((u) => u.role === 'driver').length;

  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-[#263238] text-white px-4 py-4 flex justify-between items-center shadow-md z-10">
        <h2 className="font-bold text-lg flex items-center">
          <i className="fa-solid fa-shield-halved ml-2 text-[#FF5722]"></i> لوحة تحكم الإدارة
        </h2>
        <button
          onClick={logout}
          className="text-gray-300 hover:text-white p-2 transition"
          title="تسجيل الخروج"
          aria-label="تسجيل الخروج"
        >
          <i className="fa-solid fa-right-from-bracket text-xl"></i>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-12">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <i className="fa-solid fa-box-open text-2xl text-blue-500 mb-2"></i>
            <span className="text-xs text-gray-500">إجمالي الطلبات</span>
            <span className="text-xl font-bold text-[#263238]">{totalOrders}</span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <i className="fa-solid fa-sack-dollar text-2xl text-green-500 mb-2"></i>
            <span className="text-xs text-gray-500">عمولات الموقع (ج.م)</span>
            <span className="text-xl font-bold text-[#4CAF50]">{totalRevenue.toFixed(1)}</span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <i className="fa-solid fa-users text-2xl text-orange-500 mb-2"></i>
            <span className="text-xs text-gray-500">عدد المطاعم</span>
            <span className="text-xl font-bold text-[#263238]">{totalRests}</span>
          </div>

          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center text-center">
            <i className="fa-solid fa-helmet-safety text-2xl text-[#FF5722] mb-2"></i>
            <span className="text-xs text-gray-500">عدد المناديب</span>
            <span className="text-xl font-bold text-[#263238]">{totalDrivers}</span>
          </div>
        </div>

        {/* Transactions Table */}
        <h3 className="font-bold text-[#263238] mb-3 border-b border-gray-200 pb-2">
          سجل العمليات الأخير
        </h3>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className="bg-gray-50 text-gray-600 text-xs">
                <tr>
                  <th className="px-4 py-3">رقم</th>
                  <th className="px-4 py-3">المطعم</th>
                  <th className="px-4 py-3">المندوب</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">العمولة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      لا توجد عمليات مسجلة
                    </td>
                  </tr>
                ) : (
                  sortedOrders.map((order) => {
                    const rest = getRestaurant(order.restaurantId)?.name || '-';
                    const driver = order.driverId ? getDriver(order.driverId)?.name : '-';
                    const shortId = order.id.replace('ord-', '').substring(0, 4);

                    let statusClass = 'text-gray-500';
                    let statusText = 'انتظار';
                    if (order.status === 'active') {
                      statusClass = 'text-blue-500 font-bold';
                      statusText = 'نشط';
                    } else if (order.status === 'completed') {
                      statusClass = 'text-[#4CAF50] font-bold';
                      statusText = 'مكتمل';
                    }

                    return (
                      <tr key={order.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 font-mono text-xs">#{shortId}</td>
                        <td className="px-4 py-3 font-medium text-gray-700">{rest}</td>
                        <td className="px-4 py-3 text-gray-600">{driver}</td>
                        <td className={`px-4 py-3 ${statusClass}`}>{statusText}</td>
                        <td className="px-4 py-3 font-bold text-[#F44336]">
                          {order.status === 'completed' ? (COMMISSION_RATE * 2).toFixed(1) : '0'}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
