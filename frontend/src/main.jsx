import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const rootElement = document.getElementById('root');
const queryClient = new QueryClient();

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <Toaster />
  </QueryClientProvider>,
);
