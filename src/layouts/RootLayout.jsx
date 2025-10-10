import { Outlet } from 'react-router-dom';

export default function RootLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#000000]">
      {children ?? <Outlet />}
    </div>
  );
}
