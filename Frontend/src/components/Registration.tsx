import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useRegisterUserMutation } from "../Redux/api/registerApi.ts";

export default function Registration() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [university, setUniversity] = useState('');
    const [course, setCourse] = useState('');
    const [specialty, setSpecialty] = useState('');
    const [fullName, setFullName] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [group, setGroup] = useState('');
    const [degree, setDegree] = useState('bachelor');

    const navigate = useNavigate();
    const [register, { isLoading }] = useRegisterUserMutation();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            username: fullName,
            email,
            password,
            university,
            course: Number(course),
            specialty,
            group,
            degree,
            birth_date: birthDate,
        };

        try {
            await register(payload).unwrap();
            navigate("/login");
        } catch (err) {
            console.log("Ошибка:", err);
        }
    };

    return (
        <div
            className="min-h-screen flex items-center justify-center p-4"
            style={{
                backgroundImage: 'url(/auth.svg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            }}
        >
            <div className="bg-black/70 backdrop-blur-xl rounded-[32px] p-6 w-full max-w-lg shadow-2xl border border-white/10">
                <h1 className="text-2xl font-bold text-white text-center mb-6">Регистрация</h1>

                <form onSubmit={handleSubmit} className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">ФИО</label>
                        <input
                            type="text"
                            placeholder="Иванов И.И."
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Почта</label>
                        <input
                            type="email"
                            placeholder="mail@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Пароль</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">ВУЗ</label>
                        <input
                            type="text"
                            placeholder="МГУ"
                            value={university}
                            onChange={(e) => setUniversity(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Направление</label>
                        <input
                            type="text"
                            placeholder="ИВТ"
                            value={specialty}
                            onChange={(e) => setSpecialty(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Курс</label>
                        <select
                            value={course}
                            onChange={(e) => setCourse(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        >
                            <option value="">Курс</option>
                            {[1, 2, 3, 4, 5, 6].map(n => (
                                <option key={n} value={n}>{n}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Группа</label>
                        <input
                            type="text"
                            placeholder="ИВТ-21"
                            value={group}
                            onChange={(e) => setGroup(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Уровень</label>
                        <div className="flex gap-4 text-sm text-white">
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="degree" value="bachelor" checked={degree === 'bachelor'} onChange={(e) => setDegree(e.target.value)} className="mr-1.5 accent-indigo-500 w-3.5 h-3.5" />
                                <span>Бакалавр</span>
                            </label>
                            <label className="flex items-center cursor-pointer">
                                <input type="radio" name="degree" value="master" checked={degree === 'master'} onChange={(e) => setDegree(e.target.value)} className="mr-1.5 accent-indigo-500 w-3.5 h-3.5" />
                                <span>Магистр</span>
                            </label>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">ДР</label>
                        <input
                            type="date"
                            value={birthDate}
                            onChange={(e) => setBirthDate(e.target.value)}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded-full text-white text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 disabled:opacity-70 text-white text-sm font-medium py-2.5 rounded-full transition-all shadow-md"
                    >
                        {isLoading ? 'Создание...' : 'СОЗДАТЬ'}
                    </button>

                    <div className="text-center text-xs text-gray-400 mt-3">
                        Есть аккаунт?{" "}
                        <Link to="/login" className="text-white hover:underline underline-offset-2 font-medium">
                            Войти
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
}