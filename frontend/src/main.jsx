import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import store from './store/store';
import { Toaster } from 'sonner';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <Provider store={store}>
    <AuthProvider>
      <App />
      <Toaster />
    </AuthProvider>
  </Provider>,
);
