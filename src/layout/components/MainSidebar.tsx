import { Button } from 'antd';
import {
  LayoutDashboard,
  ClipboardList,
  Bed,
  Utensils,
  Receipt,
  Users,
  Settings,
  LogOut,
} from 'lucide-react';

import { Link, useLocation } from 'react-router-dom';

const MainSidebar = ({
  handleLogout,
  loading,
}: {
  handleLogout: () => void;
  loading: boolean;
}) => {
  const location = useLocation();
  const menuItems = [
    { name: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    {
      name: 'Reservations',
      icon: <ClipboardList size={20} />,
      path: '/dashboard/reservations',
    },
    { name: 'Rooms', icon: <Bed size={20} />, path: '/dashboard/rooms' },
    {
      name: 'Meal Management',
      icon: <Utensils size={20} />,
      path: '/dashboard/meal-management',
    },
    {
      name: 'Billing & Reports',
      icon: <Receipt size={20} />,
      path: '/dashboard/billing-report',
    },
    { name: 'Users', icon: <Users size={20} />, path: '/dashboard/users' },
    { name: 'Settings', icon: <Settings size={20} />, path: '/dashboard/settings' },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-[#0F2942] text-white shadow-xl">
      {/* Logo Section */}
      <div className="flex flex-col items-center border-b border-blue-900/50 p-6">
        <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-blue-500 bg-gradient-to-br from-blue-400 to-blue-700 shadow-lg">
          <span className="text-2xl font-bold">DSD</span>
        </div>
        <h1 className="text-lg font-bold uppercase tracking-wider">DSD RESORT</h1>
        <p className="text-[10px] tracking-[0.2em] text-blue-300">Management</p>
      </div>

      {/* Navigation Items */}
      <nav className="mt-6 flex-1 space-y-2 px-4">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              to={item.path}
              key={index}
              className={`group flex cursor-pointer items-center gap-4 rounded-xl px-4 py-3 transition-all duration-200 hover:bg-blue-600/20 hover:text-blue-300 ${isActive ? 'bg-blue-600/20 text-blue-300' : ''}`}
            >
              <div
                className={`group-hover:text-blue-300 ${isActive ? 'text-blue-300' : 'text-blue-400'}`}
              >
                {item.icon}
              </div>
              <span className="text-sm font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 🚪 Logout Section */}
      <div className="border-t border-blue-900/50 p-4">
        <Button
          loading={loading}
          onClick={() => {
            handleLogout();
          }}
          className="flex w-full items-center gap-4 rounded-xl bg-red-500/10 px-4 py-3 text-red-400 transition-all duration-300 hover:bg-red-500 hover:text-white border-none"
        >
          <LogOut size={20} />
          <span className="text-sm font-medium">Log Out</span>
        </Button>
      </div>
    </div>
  );
};

export default MainSidebar;
