import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";

const Layout = () => {
    return (
        <div className="min-h-screen bg-[#0a0a1f] flex flex-col">
            <Navbar />
            <main className="flex-1">
                <Outlet />
            </main>
        </div>
    );
};

export default Layout;