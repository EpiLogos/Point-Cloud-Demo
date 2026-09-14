import {StrictMode, Suspense, lazy} from 'react';
import {createRoot} from 'react-dom/client';
const App = lazy(() => import('./App.tsx'));
const RenderView = lazy(() => import('./physis/RenderView'));
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>{location.pathname === '/render' ? <RenderView /> : <App />}</Suspense>
  </StrictMode>,
);
