import { Outlet } from 'react-router-dom';

export default function AuthLayout() {
    return (
        <div className="min-h-screen bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-700">
            <Outlet />
        </div>
    );
}