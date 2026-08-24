import { Outlet } from 'react-router-dom';
import MainHeader from './components/MainHeader';
import MainSidebar from './components/MainSidebar';
import { errorToast } from '../components/common/Alert';
import authMutation from '../mutations/auth.mutation';
import { useEffect } from 'react';

const DashboardLayout = () => {
  const { signOutMutation } = authMutation();

  const { mutateAsync: signOut, isPending: loading } = signOutMutation();
  // const { mutateAsync: heckUserSessionAction } = heckUserSessionMutation();

  const handleLogout = async () => {
    try {
      await signOut();
      localStorage.removeItem('user_info');
    } catch (error) {
      errorToast('Logout failed!');
    }
  };

  useEffect(() => {
    //check token is valid when login and refresh
    // const checkUserSession = async () => {
    //   await heckUserSessionAction();
    // };

    // checkUserSession();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#F8FAFC]">
      <aside className="hidden h-full flex-shrink-0 md:flex">
        <MainSidebar handleLogout={handleLogout} loading={loading} />
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 h-16 border-b bg-white shadow-sm">
          <MainHeader />
        </header>

        {/* Dynamic Content */}
        <main className="custom-scrollbar flex-1 overflow-y-auto p-6">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
