import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PdfAuditCard from './components/PdfAuditCard.jsx';
import { supabase } from './lib/supabaseClient.js';

export default function App() {
  useEffect(() => {
    const loginDemoUser = async () => {
      const email = import.meta.env.VITE_DEMO_EMAIL;
      const password = import.meta.env.VITE_DEMO_PASSWORD;

      if (!email || !password) {
        console.warn('Demo credentials missing; skipping automatic login.');
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (data.session) {
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('Silent demo login failed:', error);
      }
    };

    loginDemoUser();
  }, []);

  return (
    <>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<DashboardPage />} />
        </Route>
      </Routes>
      <PdfAuditCard />
    </>
  );
}
