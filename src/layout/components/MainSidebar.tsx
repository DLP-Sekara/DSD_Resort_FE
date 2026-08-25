import { Button } from 'antd';
import {
  LayoutDashboard,
  ClipboardList,
  Bed,
  Utensils,
  UtensilsCrossed,
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
    {
      name: 'Restaurant Orders',
      icon: <UtensilsCrossed size={20} />,
      path: '/dashboard/restaurant-orders',
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
    <div className="flex h-screen w-64 flex-col bg-[#092968] text-white shadow-xl">
      {/* Logo Section */}
      <div className="flex flex-col items-center border-b border-white/10 p-6">
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F26E22] text-white shadow-lg text-xl font-bold font-spaceGrotesk">
          <span>DSD</span>
        </div>
        <h1 className="font-spaceGrotesk text-lg font-extrabold uppercase tracking-wider text-white">
          DSD RESORT
        </h1>
        <p className="text-[11px] font-bold tracking-[0.25em] text-[#F26E22]">
          ADMIN PORTAL
        </p>
      </div>

      {/* Navigation Items */}
      <nav className="mt-6 flex-1 space-y-1.5 px-4">
        {menuItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              to={item.path}
              key={index}
              className={`group flex cursor-pointer items-center gap-3.5 rounded-xl px-4 py-3 transition-all duration-200 ${
                isActive
                  ? 'bg-[#F26E22] text-white font-bold shadow-md'
                  : 'text-white/85 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div
                className={`transition-colors ${
                  isActive ? 'text-white' : 'text-[#F26E22] group-hover:text-white'
                }`}
              >
                {item.icon}
              </div>
              <span className="text-sm font-semibold">{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* 🚪 Logout Section */}
      <div className="border-t border-white/10 p-4">
        <Button
          loading={loading}
          onClick={() => {
            handleLogout();
          }}
          className="flex h-11 w-full items-center justify-start gap-3 rounded-xl bg-red-500/15 px-4 py-2 text-red-300 transition-all duration-300 hover:!bg-red-600 hover:!text-white border-none font-semibold text-sm"
        >
          <LogOut size={20} />
          <span>Log Out</span>
        </Button>
      </div>
    </div>
  );
};

export default MainSidebar;
