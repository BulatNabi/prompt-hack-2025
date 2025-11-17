import {Route, Routes} from "react-router-dom";
import Layout from "./components/Layout.tsx";
import Registration from "./components/Registration.tsx";
import AuthLayout from "./components/AuthLayout.tsx";
import Login from "./components/Login.tsx";
import Home from "./pages/Home.tsx";
import Materials from "./pages/Materials.tsx";
import Schedule from "./pages/Schedule.tsx";
import AiAssistant from "./pages/AiAssistent.tsx";

const App = () => {
    return (
        <div>
            <Routes>
                <Route element={<AuthLayout/>}>
                    <Route path="/" element={<Registration/>}/>
                    <Route path="/login" element={<Login/>}/>
                </Route>

                <Route element={<Layout/>}>
                    <Route path="/main" element={<Home/>}/>
                    <Route path="/ai" element={<AiAssistant/>}/>
                    <Route path="/schedule" element={<Schedule/>}/>
                    <Route path="/materials" element={<Materials/>}/>
                </Route>
            </Routes>
        </div>
    )
}

export default App