import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/login/Login';
import ServerError from '../pages/errorPages/ServerError';
import MainDashboard from '../pages/dashboard/MainDashboard';
import DashboardLayout from '../layout/DashboardLayout';
import Reservations from '../pages/reservations/Reservations';
import Rooms from '../pages/rooms/Rooms';
import MealManagement from '../pages/mealManagement/MealManagement';
import RestaurantOrders from '../pages/restaurantOrders/RestaurantOrders';
import KitchenManagement from '../pages/kitchen/KitchenManagement';
import ChefOperationsDesk from '../pages/kitchen/ChefOperationsDesk';
import BillingReport from '../pages/billingReport/BillingReport';
import GuestFeedback from '../pages/guestFeedback/GuestFeedback';
import Users from '../pages/users/Users';
import Settings from '../pages/settings/Settings';
import UserGuide from '../pages/UserGuide/UserGuide';
import ProtectedRoute from './ProtectedStep';
import RoleProtectedRoute from './RoleProtectedRoute';
import { useAuth } from '../hooks/useAuth';

// Role-aware Dashboard Landing Redirect
const DashboardIndex = () => {
  const { userData } = useAuth();
  const role = (userData?.role || 'ADMIN').toUpperCase();

  if (role === 'HEAD_CHEF' || role === 'CHEF') {
    return <Navigate to="/dashboard/chef-desk" replace />;
  }

  return <MainDashboard />;
};

const Routers = () => {
  const { userData } = useAuth();
  const isAuthenticated = userData !== null;

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/server-error" element={<ServerError />} />
      <Route path="/user-guide" element={<UserGuide />} />
      <Route path="*" element={<Navigate to="/login" replace />} />

      <Route element={<ProtectedRoute isAuthenticated={isAuthenticated} />}>
        <Route path="/dashboard/*" element={<DashboardLayout />}>
          <Route index element={<DashboardIndex />} />

          {/* 1. Receptionist & Admin Permissions (Front Desk Operations) */}
          <Route
            element={
              <RoleProtectedRoute allowedRoles={['ADMIN', 'RECEPTIONIST']} />
            }
          >
            <Route path="reservations" element={<Reservations />} />
            <Route path="restaurant-orders" element={<RestaurantOrders />} />
            <Route path="rooms" element={<Rooms />} />
            <Route path="billing-report" element={<BillingReport />} />
          </Route>

          {/* 2. Head Chef & Admin Permissions (Kitchen Operations) */}
          <Route
            element={
              <RoleProtectedRoute
                allowedRoles={['ADMIN', 'HEAD_CHEF']}
              />
            }
          >
            <Route path="kitchen-management" element={<KitchenManagement />} />
            <Route path="chef-desk" element={<ChefOperationsDesk />} />
          </Route>

          {/* 3. Super Admin Exclusive Permissions */}
          <Route element={<RoleProtectedRoute allowedRoles={['ADMIN']} />}>
            <Route path="meal-management" element={<MealManagement />} />
            <Route path="guest-feedback" element={<GuestFeedback />} />
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Settings />} />
          </Route>

          {/* Fallback route */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Route>
    </Routes>
  );
};

export default Routers;
