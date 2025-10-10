import { Routes, Route } from 'react-router-dom';
import RootLayout from './src/layouts/RootLayout.jsx';
import DashboardPage from './src/pages/DashboardPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route index element={<DashboardPage />} />
      </Route>
    </Routes>
  );
}
