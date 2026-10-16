import React from 'react';
import { useApp } from './context/AppContext';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { EditFeeModal } from './components/EditFeeModal';
import { CommissionModal } from './components/CommissionModal';
import { ToastContainer } from './components/ToastContainer';

import { PendingApprovalScreen } from './components/PendingApprovalScreen';

const AppContent: React.FC = () => {
  const { currentScreen, authLoading, isCommissionModalOpen, closeCommissionModal } = useApp();

  if (authLoading) {
    return (
      <div className="max-w-[480px] mx-auto bg-white min-h-screen relative shadow-2xl flex flex-col justify-center items-center p-6 text-gray-800">
        <div className="w-20 h-20 bg-[#FF5722] rounded-full flex items-center justify-center mb-4 shadow-lg shadow-[#FF5722]/40 animate-pulse">
          <i className="fa-solid fa-motorcycle text-3xl text-white"></i>
        </div>
        <p className="text-[#263238] font-bold text-base mb-1">وصل دليفري</p>
        <p className="text-gray-400 text-xs flex items-center gap-1.5">
          <i className="fa-solid fa-spinner fa-spin text-[#FF5722]"></i>
          <span>جاري التحقق من الجلسة...</span>
        </p>
      </div>
    );
  }

  const renderScreen = () => {
    switch (currentScreen) {
      case 'screen-role-select':
        return <RoleSelectScreen />;
      case 'screen-login':
        return <LoginScreen />;
      case 'screen-register':
        return <RegisterScreen />;
      case 'screen-restaurant':
        return <RestaurantDashboard />;
      case 'screen-driver':
        return <DriverDashboard />;
      case 'screen-admin':
        return <AdminDashboard />;
      case 'screen-pending-approval':
        return <PendingApprovalScreen />;
      default:
        return <RoleSelectScreen />;
    }
  };

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen relative shadow-2xl flex flex-col overflow-hidden text-gray-800">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Edit Fee Modal */}
      <EditFeeModal />

      {/* Commission Settlement Modal */}
      <CommissionModal isOpen={isCommissionModalOpen} onClose={closeCommissionModal} />

      {/* Dynamic Screen Routing with safe fallback */}
      {renderScreen()}
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
