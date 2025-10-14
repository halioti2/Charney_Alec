import { Outlet } from 'react-router-dom';

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-[#F6F1EB] text-[#000000]">
      <Outlet />
    </div>
  );
}
