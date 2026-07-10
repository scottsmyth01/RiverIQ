import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const rootElement = document.getElementById('root');
const queryClient = new QueryClient();

window.__TANSTACK_QUERY_CLIENT__ = queryClient;

createRoot(rootElement).render(
  <QueryClientProvider client={queryClient}>
    <App />
    <ReactQueryDevtools initialIsOpen={true} />
    <Toaster />
  </QueryClientProvider>,
);
