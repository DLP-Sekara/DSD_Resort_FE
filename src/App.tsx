import { ConfigProvider, theme } from 'antd';
import { ToastContainer } from 'react-toastify';
import Routers from './routes/Routers';
import enUS from 'antd/locale/en_US';

function App() {
  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {},
        components: {},
      }}
      componentSize="middle"
    >
      <ToastContainer position="bottom-center" autoClose={3000} />

      <Routers />
    </ConfigProvider>
  );
}

export default App;
