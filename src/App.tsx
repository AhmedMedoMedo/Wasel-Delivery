import React from 'react';
import { useApp } from './context/AppContext';
import { RoleSelectScreen } from './components/RoleSelectScreen';
import { LoginScreen } from './components/LoginScreen';
import { RegisterScreen } from './components/RegisterScreen';
import { RestaurantDashboard } from './components/RestaurantDashboard';
import { DriverDashboard } from './components/DriverDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { EditFeeModal } from './components/EditFeeModal';
import { ToastContainer } from './components/ToastContainer';

const AppContent: React.FC = () => {
  const { currentScreen, authLoading } = useApp();

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

  return (
    <div className="max-w-[480px] mx-auto bg-white min-h-screen relative shadow-2xl flex flex-col overflow-hidden text-gray-800">
      {/* Toast Notifications */}
      <ToastContainer />

      {/* Edit Fee Modal */}
      <EditFeeModal />

      {/* Dynamic Screen Routing */}
      {currentScreen === 'screen-role-select' && <RoleSelectScreen />}
      {currentScreen === 'screen-login' && <LoginScreen />}
      {currentScreen === 'screen-register' && <RegisterScreen />}
      {currentScreen === 'screen-restaurant' && <RestaurantDashboard />}
      {currentScreen === 'screen-driver' && <DriverDashboard />}
      {currentScreen === 'screen-admin' && <AdminDashboard />}
    </div>
  );
};

export const App: React.FC = () => {
  return <AppContent />;
};

export default App;
