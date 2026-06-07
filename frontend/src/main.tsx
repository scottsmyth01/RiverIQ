import { createRoot } from 'react-dom/client';
import './index.css';
import App from './pages/App';

// import { createBrowserRouter, RouterProvider } from 'react-router-dom';
// const router = createBrowserRouter([]);

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(<App />);
