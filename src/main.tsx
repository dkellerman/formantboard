import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import './tailwind.css';
import { AppShell } from './react/layout/AppShell';
import { NotFoundPage } from './react/pages/NotFoundPage';
import { SandboxPage } from './react/pages/SandboxPage';

const router = createBrowserRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <SandboxPage /> },
      { path: 'sandbox', element: <SandboxPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);

createRoot(document.getElementById('app') as HTMLElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
