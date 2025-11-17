import { NavLink, useNavigate } from 'react-router-dom';

const navItems = [
    { to: '/main', label: 'ГЛАВНАЯ' },
    { to: '/ai', label: 'AI-ПОМОЩНИК' },
    { to: '/schedule', label: 'РАСПИСАНИЕ' },
    { to: '/materials', label: 'МАТЕРИАЛЫ' },
];

export default function Navbar() {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-[#0a0a1f]/80 backdrop-blur-md border-b border-white/10">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-indigo-600 rounded-full shadow-lg" />

            <div className="hidden md:flex items-center gap-8 text-sm font-medium uppercase tracking-wider">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) =>
                            `transition-all duration-300 ${isActive
                                ? 'text-cyan-300 font-bold'
                                : 'text-gray-300 hover:text-cyan-300'
                            }`
                        }
                    >
                        {item.label}
                    </NavLink>
                ))}
            </div>

            <button
                onClick={handleLogout}
                className="px-5 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full text-sm font-medium text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-md"
            >
                ВЫХОД
            </button>
        </nav>
    );
}