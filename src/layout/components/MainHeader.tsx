import { User, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const MainHeader = () => {
  const { userData } = useAuth();
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="flex h-full items-center justify-between bg-white px-8">
      <div className="group relative hidden w-96 lg:flex">
        {/* Date Display (Hidden on small screens) */}
        <div className="hidden items-center gap-2 border-r border-gray-100 pr-6 text-sm text-gray-500 lg:flex">
          <Calendar size={16} className="text-blue-500" />
          <span>{today}</span>
        </div>
      </div>

      <div className="flex w-full items-center justify-end gap-6">
        {/* User Profile Info */}
        <div className="group flex items-center gap-3 pl-2">
          <div className="text-right">
            <p className="text-sm font-semibold text-gray-800 transition-colors group-hover:text-blue-600">
              {userData?.name}
            </p>
            <p className="text-[11px] text-gray-400">{userData?.role}</p>
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-blue-600 to-blue-400 text-white shadow-md shadow-blue-200">
            <User size={22} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainHeader;
