import { Clock, Bell, Rocket } from 'lucide-react';

const ComingSoonPage = () => {
  return (
    <div className="flex h-screen items-start justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="hover:shadow-3xl transform rounded-3xl bg-white p-8 text-center shadow-2xl transition-all duration-300 md:p-12">
        {/* Icon */}
        <div className="mb-6 inline-flex h-20 w-20 animate-pulse items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
          <Rocket className="h-10 w-10 text-white" />
        </div>

        {/* Heading */}
        <h1 className="mb-4 text-4xl font-bold text-gray-800 md:text-5xl">Coming Soon</h1>

        {/* Subheading */}
        <p className="mx-auto mb-8 max-w-md text-lg text-gray-600 md:text-xl">
          We're working hard to bring you something amazing. Stay tuned!
        </p>

        {/* Features Grid */}
        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 p-6 transition-transform hover:scale-105">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500">
              <Bell className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">Notifications</h3>
            <p className="text-sm text-gray-600">We will notify when we launch</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 transition-transform hover:scale-105">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500">
              <Clock className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">Early Access</h3>
            <p className="text-sm text-gray-600">Be the first to try it out</p>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100 p-6 transition-transform hover:scale-105">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500">
              <Rocket className="h-6 w-6 text-white" />
            </div>
            <h3 className="mb-2 font-semibold text-gray-800">New Features</h3>
            <p className="text-sm text-gray-600">Exciting tools are on the way</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;
