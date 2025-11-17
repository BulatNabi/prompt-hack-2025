import { Link } from 'react-router-dom';

const ScheduleIcon = () => (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm0 2v2H5V6h14zm-7 5h5v5h-5v-5zm-2 0H5v5h5v-5zm7 7h-5v5h5v-5zm-7 0H5v5h5v-5z" />
    </svg>
);

const BookIcon = () => (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 2v14H5V5h14z" />
    </svg>
);

const ChatIcon = () => (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M20 2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4l4 4 4-4h4a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
    </svg>
);

const InfoIcon = () => (
    <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
);

const features = [
    {
        title: 'Расписание',
        description: 'Всегда знайте, когда и где ваша следующая пара с напоминаниями и дедлайнами',
        to: '/schedule',
        icon: <ScheduleIcon />,
        bgImg: '/images/feature-schedule.jpg',
    },
    {
        title: 'Материалы',
        description: 'Конспекты, методички и презентации – всё в одном месте с умным поиском',
        to: '/materials',
        icon: <BookIcon />,
        bgImg: '/images/feature-materials.jpg',
    },
    {
        title: 'AI‑помощник',
        description: 'Получайте мгновенные ответы на вопросы об учёбе, создавайте шпаргалки и саммари',
        to: '/ai',
        icon: <ChatIcon />,
        bgImg: '/images/feature-ai.jpg',
    },
    {
        title: 'Университет',
        description: 'Всё, что нужно знать о университете: контакты, новости, события',
        to: '/university',
        icon: <InfoIcon />,
        bgImg: '/images/feature-university.jpg',
    },
];

export default function Home() {
    return (
        <>
            <section className="relative h-screen flex items-center justify-center overflow-hidden">
                <div
                    className="absolute left-0 top-0 h-full w-1/2 bg-cover bg-left"
                    style={{ backgroundImage: 'url(./dick.png)' }}
                />
                <div
                    className="absolute right-0 top-0 h-full w-1/2 bg-cover bg-right"
                    style={{ width: "50vw", backgroundImage: 'url(./right.png)' }}
                />
                <div className="absolute inset-0 bg-black/70" />

                <div className="relative z-10 text-center px-6 max-w-3xl">
                    <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                        Учеба с AI
                    </h1>
                    <p className="text-lg md:text-xl text-gray-300 mb-8">
                        Все для успешной учебы, сдачи сессии и тд, сдачи сессии и тд!
                    </p>
                    <Link
                        to="/ai"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full font-medium text-white hover:from-indigo-600 hover:to-purple-700 transition-all"
                    >
                        AI‑помощник
                    </Link>
                </div>
            </section>

            <section className="py-20 px-6">
                <h2 className="text-3xl md:text-4xl font-bold text-center text-white mb-12">
                    Успешная учёба
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
                    {features.map((f, idx) => (
                        <Link
                            key={idx}
                            to={f.to}
                            className="group relative block rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                        >
                            <div
                                className="absolute inset-0 bg-cover bg-center"
                                style={{ backgroundImage: `url(${f.bgImg})` }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                            <div className="relative p-8 flex items-start gap-4 text-white">
                                <div className="flex-shrink-0 p-3 bg-white/10 rounded-full backdrop-blur-sm">
                                    {f.icon}
                                </div>
                                <div>
                                    <h3 className="text-xl font-semibold mb-2 group-hover:text-cyan-300 transition">
                                        {f.title}
                                    </h3>
                                    <p className="text-sm opacity-90">{f.description}</p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            </section>
        </>
    );
}