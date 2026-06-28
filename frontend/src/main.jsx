import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { SessionProvider } from './context/SessionsContext';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <AuthProvider>
    <SessionProvider>
      <App />
    </SessionProvider>
  </AuthProvider>,
);
