import { useLocation, useNavigate } from 'react-router-dom';

const ServerError = () => {
  const navigate = useNavigate();
  const { search } = useLocation();

  const queryParams = new URLSearchParams(search);
  const prevPath = queryParams.get('from') || '/dashboard';

  const handleRefresh = () => {
    navigate(prevPath, { replace: true });
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="max-w-md rounded-2xl bg-white p-6 text-center shadow-lg">
        <h1 className="mb-4 text-6xl font-bold text-red-500">500</h1>
        <h2 className="mb-2 text-2xl font-semibold text-gray-800">Server Error</h2>
        <p className="mb-6 text-gray-600">
          Oops! Something went wrong on our end. Please try again later.
        </p>
        <button
          onClick={handleRefresh}
          className="rounded-lg bg-red-500 px-4 py-2 text-white transition hover:bg-red-600"
        >
          Refresh Page
        </button>
      </div>
    </div>
  );
};

export default ServerError;
