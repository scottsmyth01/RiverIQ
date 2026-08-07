import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GoogleOAuthProvider } from '@react-oauth/google';

const rootElement = document.getElementById('root');
const queryClient = new QueryClient();

document.documentElement.dataset.theme = 'dark';

window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'missing-google-client-id'}>
      <App />
    </GoogleOAuthProvider>
    <Toaster position='top-center' richColors closeButton />
  </QueryClientProvider>,
);
