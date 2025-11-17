import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLoginUserMutation } from "../Redux/api/registerApi.ts";
import { setToken } from "../Redux/slices/authSlice.ts";
import { useDispatch } from "react-redux";

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const [loginUser, { isLoading }] = useLoginUserMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await loginUser({ email1: email, password: password }).unwrap();
            dispatch(setToken(result.access_token));
            console.log("Успешный вход:", result);
            navigate("/main");
        } catch (err: any) {
            console.error("Ошибка входа:", err);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-6"
            style={{
                backgroundImage: 'url(./auth.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="bg-black/70 backdrop-blur-xl rounded-[36px] p-10 w-full max-w-md shadow-2xl border border-white/10">
                <h1 className="text-3xl font-bold text-white text-center mb-10">Вход</h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Почта</label>
                        <input
                            type="email"
                            placeholder="Введите почту..."
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Пароль</label>
                        <input
                            type="password"
                            placeholder="Введите пароль..."
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3 bg-white/5 border border-white/20 rounded-full text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:from-indigo-400 disabled:to-purple-500 text-white font-medium py-3 rounded-full transition-all duration-300 shadow-lg disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Вход...' : 'ВОЙТИ'}
                    </button>

                    <div className="text-center mt-6">
                        <Link
                            to="/"
                            className="text-sm text-gray-400 hover:text-white underline underline-offset-4 transition-colors"
                        >
                            Забыли пароль?
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}