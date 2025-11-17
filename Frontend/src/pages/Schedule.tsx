
interface Lesson {
    id: string;
    time: string;
    subject: string;
    type: 'Лекция' | 'Практика' | 'Лабораторная';
    teacher: string;
    room: string;
}

interface DaySchedule {
    day: string;
    date: string;
    lessons: Lesson[];
}

const scheduleData: DaySchedule[] = [
    {
        day: 'Понедельник',
        date: '17 ноября',
        lessons: [
            {
                id: '1',
                time: '10:05-11:30',
                subject: 'Методы продвижения и аналитики контента',
                type: 'Лекция',
                teacher: 'Бажова В.В.',
                room: '456 к',
            },
            {
                id: '2',
                time: '13:45-15:20',
                subject: 'Разработка IT-проекта',
                type: 'Практика',
                teacher: 'Талант В.В.',
                room: '407 к',
            },
        ],
    },
    {
        day: 'Вторник',
        date: '18 ноября',
        lessons: [
            {
                id: '3',
                time: '15:20-16:45',
                subject: 'Системы искусственного интеллекта',
                type: 'Лекция',
                teacher: 'Волков А.И.',
                room: 'ДО',
            },
            {
                id: '4',
                time: '16:55-18:20',
                subject: 'Информационные системы и технологии',
                type: 'Лекция',
                teacher: 'Лебедева С.В.',
                room: 'ДО',
            },
        ],
    },
    {
        day: 'Среда',
        date: '19 ноября',
        lessons: [
            {
                id: '5',
                time: '11:40-13:05',
                subject: 'Проектирование коммерческого контента',
                type: 'Практика',
                teacher: 'Талант В.В.',
                room: '407 к',
            },
        ],
    },
    {
        day: 'Четверг',
        date: '20 ноября',
        lessons: [
            {
                id: '6',
                time: '10:05-11:30',
                subject: 'Информационные системы и технологии',
                type: 'Лекция',
                teacher: 'Лебедева С.В.',
                room: '463 к',
            },
            {
                id: '7',
                time: '11:40-13:05',
                subject: 'Администрирование вычислительных систем',
                type: 'Лекция',
                teacher: 'Зверев В.В.',
                room: '463 к',
            },
            {
                id: '8',
                time: '13:45-15:20',
                subject: 'Разработка IT-проекта',
                type: 'Практика',
                teacher: 'Талант В.В.',
                room: '407 к',
            },
        ],
    },
    {
        day: 'Пятница',
        date: '21 ноября',
        lessons: [
            {
                id: '9',
                time: '10:05-11:30',
                subject: 'Разработка развлекательного контента',
                type: 'Лекция',
                teacher: 'Капулина Н.И.',
                room: '459 к',
            },
            {
                id: '10',
                time: '11:40-13:05',
                subject: 'Разработка развлекательного контента',
                type: 'Практика',
                teacher: 'Капулина Н.И.',
                room: '459 к',
            },
            {
                id: '11',
                time: '13:45-15:20',
                subject: 'Проектирование коммерческого контента',
                type: 'Практика',
                teacher: 'Талант В.В.',
                room: '407 к',
            },
            {
                id: '12',
                time: '15:15-18:20',
                subject: 'Администрирование вычислительных систем',
                type: 'Лекция',
                teacher: 'Зверев В.В.',
                room: 'ДО',
            },
        ],
    },
    {
        day: 'Суббота',
        date: '22 ноября',
        lessons: [
            {
                id: '13',
                time: '16:55-18:20',
                subject: 'Проектирование коммерческого контента',
                type: 'Практика',
                teacher: 'Николаева Л.Г.',
                room: '484 к',
            },
            {
                id: '14',
                time: '18:30-20:05',
                subject: 'Проектирование коммерческого контента',
                type: 'Практика',
                teacher: 'Николаева Л.Г.',
                room: '484 к',
            },
        ],
    },
];

export default function Schedule() {
    return (
        <div className="min-h-screen bg-[#0a0a1f] text-white pt-20 px-6">
            <div className="max-w-7xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-12">
                    Расписание занятий
                </h1>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {scheduleData.map((day) => (
                        <div
                            key={day.day}
                            className="bg-gradient-to-br from-cyan-500 via-blue-600 to-purple-700 rounded-3xl p-1 shadow-xl"
                        >
                            <div className="bg-[#0f0f2e] rounded-3xl p-6 h-full flex flex-col">
                                <div className="mb-4">
                                    <h2 className="text-2xl font-bold text-white">
                                        {day.date}
                                    </h2>
                                    <p className="text-sm text-gray-400">{day.day}</p>
                                </div>

                                <div className="space-y-4 flex-1">
                                    {day.lessons.length > 0 ? (
                                        day.lessons.map((lesson) => (
                                            <div
                                                key={lesson.id}
                                                className="bg-[#1a1a3a] rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all"
                                            >
                                                <div className="flex items-start justify-between mb-2">
                                                    <span className="text-xs font-medium text-cyan-300">
                                                        {lesson.time}
                                                    </span>
                                                </div>
                                                <h3 className="font-semibold text-white mb-1">
                                                    {lesson.subject}
                                                </h3>
                                                <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                                                    <span>{lesson.teacher}</span>
                                                    <span>•</span>
                                                    <span>{lesson.room}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-500 italic py-8">
                                            Нет занятий
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}