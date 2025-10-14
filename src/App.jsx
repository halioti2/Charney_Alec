import { Routes, Route } from 'react-router-dom';
import RootLayout from './layouts/RootLayout.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import PdfAuditCard from './components/PdfAuditCard.jsx';

export default function App() {
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