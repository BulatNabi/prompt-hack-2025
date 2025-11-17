import { useState, useRef } from 'react';
import { Upload, X, Link as LinkIcon, FileText, ArrowUpRight } from 'lucide-react';
import { useUploadPDFMutation, useUploadPDFFromUrlMutation } from '../Redux/api/examApi.ts';

const ArrowIcon = () => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5 5 5M7 17l5-5 5 5" />
    </svg>
);

interface Subject {
    id: string;
    name: string;
    gradient: string;
    bgImage?: string;
}

interface Material {
    id: string;
    title: string;
    description: string;
    date: string;
    fileUrl: string;
    bgImage?: string;
}

const subjects: Subject[] = [
    { id: 'math', name: 'Математический анализ', gradient: 'from-cyan-400 to-purple-600', bgImage: '/images/subject-math.jpg' },
    { id: 'prog', name: 'Программирование', gradient: 'from-blue-500 to-indigo-700', bgImage: '/images/subject-prog.jpg' },
    { id: 'phys', name: 'Физика', gradient: 'from-teal-500 to-cyan-700', bgImage: '/images/subject-phys.jpg' },
    { id: 'eng', name: 'Английский язык', gradient: 'from-pink-500 to-rose-600', bgImage: '/images/subject-eng.jpg' },
];

const materialsData: Record<string, Material[]> = {
    math: [
        { id: '1', title: 'Конспект лекций 1-5', description: 'Основные теоремы и определения', date: 'Добавлено: 14.11.2025', fileUrl: '#', bgImage: '/images/material-1.jpg' },
        { id: '2', title: 'Практикум по пределам', description: 'Задачи с решениями', date: 'Добавлено: 13.11.2025', fileUrl: '#', bgImage: '/images/material-2.jpg' },
    ],
    prog: [],
    phys: [],
    eng: [],
};

export default function Materials() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedSubject, setSelectedSubject] = useState<Subject | null>(subjects[0]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
    const [pdfUrl, setPdfUrl] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [uploadPDF, { isLoading: isUploadingFile }] = useUploadPDFMutation();
    const [uploadPDFFromUrl, { isLoading: isUploadingUrl }] = useUploadPDFFromUrlMutation();

    const filteredSubjects = subjects.filter((s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const materials = selectedSubject ? materialsData[selectedSubject.id] || [] : [];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && selectedSubject) handleUploadFile(file);
    };

    const handleUploadFile = async (file: File) => {
        if (!selectedSubject) return;
        try {
            const result = await uploadPDF({ subject: selectedSubject.name, file }).unwrap();
            alert(`Успешно загружено! ${result.message}`);
            setShowUploadModal(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        } catch (error: any) {
            alert(`Ошибка: ${error?.data?.detail || 'Неизвестная ошибка'}`);
        }
    };

    const handleUploadFromUrl = async () => {
        if (!selectedSubject || !pdfUrl.trim()) return alert('Введите URL');
        try {
            const result = await uploadPDFFromUrl({ subject: selectedSubject.name, pdf_url: pdfUrl }).unwrap();
            alert(`Успешно загружено! ${result.message}`);
            setShowUploadModal(false);
            setPdfUrl('');
        } catch (error: any) {
            alert(`Ошибка: ${error?.data?.detail || 'Неизвестная ошибка'}`);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a1f] text-white pt-20 px-6">
            <div className="container mx-auto max-w-7xl">
                <h1 className="text-4xl md:text-5xl font-bold text-center mb-10">
                    Учебные материалы
                </h1>

                <div className="relative max-w-md mx-auto mb-10">
                    <input
                        type="text"
                        placeholder="Поиск по материалам..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400 transition"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-1 space-y-3">
                        {filteredSubjects.map((subject) => (
                            <button
                                key={subject.id}
                                onClick={() => setSelectedSubject(subject)}
                                className={`w-full p-1 rounded-3xl transition-all ${selectedSubject?.id === subject.id
                                    ? 'bg-gradient-to-br ' + subject.gradient + ' shadow-lg'
                                    : 'bg-white/5 hover:bg-white/10'
                                    }`}
                            >
                                <div className="bg-[#0f0f2e] rounded-3xl p-6 flex items-center gap-4">
                                    <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                                        <ArrowIcon />
                                    </div>
                                    <span className="font-medium text-left">{subject.name}</span>
                                </div>
                            </button>
                        ))}
                    </div>

                    <div className="lg:col-span-2 space-y-6">
                        {selectedSubject ? (
                            <>
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-bold flex items-center gap-3">
                                        <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-full flex items-center justify-center">
                                            <ArrowIcon />
                                        </div>
                                        {selectedSubject.name}
                                    </h2>
                                    <button
                                        onClick={() => setShowUploadModal(true)}
                                        className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-purple-600 px-5 py-2.5 rounded-full text-sm font-medium hover:from-cyan-600 hover:to-purple-700 transition shadow-md"
                                    >
                                        <Upload className="w-4 h-4" />
                                        Загрузить PDF
                                    </button>
                                </div>

                                {materials.length > 0 ? (
                                    <div className="space-y-4">
                                        {materials.map((material) => (
                                            <div
                                                key={material.id}
                                                className="relative rounded-2xl overflow-hidden bg-[#1a1a3a] border border-cyan-500/30 shadow-lg hover:shadow-cyan-500/20 transition-all"
                                            >
                                                <div
                                                    className="absolute inset-0 bg-cover bg-center"
                                                    style={{ backgroundImage: `url(${material.bgImage})` }}
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />

                                                <div className="relative p-6 flex justify-between items-start gap-4">
                                                    <div>
                                                        <div className="flex items-center gap-3 mb-2">
                                                            <div className="w-8 h-8 bg-cyan-500/20 rounded-full flex items-center justify-center">
                                                                <ArrowIcon />
                                                            </div>
                                                            <h3 className="text-lg font-semibold">{material.title}</h3>
                                                        </div>
                                                        <p className="text-sm text-gray-300">{material.description}</p>
                                                        <p className="text-xs text-gray-400 mt-1">{material.date}</p>
                                                    </div>
                                                    <a
                                                        href={material.fileUrl}
                                                        className="text-cyan-400 hover:text-cyan-300 transition"
                                                    >
                                                        <ArrowUpRight className="w-5 h-5" />
                                                    </a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-gray-500 italic">Материалы скоро появятся...</p>
                                )}
                            </>
                        ) : (
                            <p className="text-gray-500">Выберите предмет слева</p>
                        )}
                    </div>
                </div>

                {showUploadModal && selectedSubject && (
                    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-[#1a1a3a] rounded-3xl shadow-2xl max-w-md w-full p-8 border border-white/10">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-xl font-bold">Загрузить PDF</h3>
                                <button
                                    onClick={() => {
                                        setShowUploadModal(false);
                                        setUploadMode('file');
                                        setPdfUrl('');
                                    }}
                                    className="p-2 hover:bg-white/10 rounded-full transition"
                                >
                                    <X className="w-5 h-5 text-gray-400" />
                                </button>
                            </div>

                            <p className="text-sm text-gray-300 mb-6">
                                Предмет: <span className="font-semibold text-cyan-300">{selectedSubject.name}</span>
                            </p>

                            <div className="flex gap-3 mb-6">
                                <button
                                    onClick={() => setUploadMode('file')}
                                    className={`flex-1 py-2.5 rounded-full text-sm font-medium transition ${uploadMode === 'file'
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}
                                >
                                    <FileText className="w-4 h-4 inline mr-2" />
                                    Файл
                                </button>
                                <button
                                    onClick={() => setUploadMode('url')}
                                    className={`flex-1 py-2.5 rounded-full text-sm font-medium transition ${uploadMode === 'url'
                                        ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white'
                                        : 'bg-white/10 text-gray-400 hover:bg-white/20'
                                        }`}
                                >
                                    <LinkIcon className="w-4 h-4 inline mr-2" />
                                    URL
                                </button>
                            </div>

                            {uploadMode === 'file' && (
                                <div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                        id="pdf-upload"
                                    />
                                    <label
                                        htmlFor="pdf-upload"
                                        className="block p-8 border-2 border-dashed border-white/20 rounded-2xl text-center cursor-pointer hover:border-cyan-400 transition"
                                    >
                                        <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                                        <p className="text-sm text-gray-300">Нажмите или перетащите PDF</p>
                                    </label>
                                    {isUploadingFile && <p className="text-center text-cyan-400 mt-4">Загрузка...</p>}
                                </div>
                            )}

                            {uploadMode === 'url' && (
                                <div className="space-y-4">
                                    <input
                                        type="url"
                                        value={pdfUrl}
                                        onChange={(e) => setPdfUrl(e.target.value)}
                                        placeholder="https://example.com/file.pdf"
                                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400"
                                    />
                                    <button
                                        onClick={handleUploadFromUrl}
                                        disabled={!pdfUrl.trim() || isUploadingUrl}
                                        className="w-full py-3 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl font-medium hover:from-cyan-600 hover:to-purple-700 disabled:opacity-50 transition"
                                    >
                                        {isUploadingUrl ? 'Загрузка...' : 'Загрузить'}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}