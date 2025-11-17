import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Trash2, Sparkles, MessageSquare, Volume2, Send, X } from 'lucide-react';
import { useUploadAudioMutation, useStartExamMutation, useSubmitAnswerMutation, useGetExamStatusQuery, useStartStudyMutation, useSendStudyMessageMutation, useGetStudyMessagesQuery, type QuestionResponse } from "../Redux/api/examApi.ts";
import TeacherVisualization from "../components/TeacherVisualization.tsx";

type Mode = 'select' | 'exam' | 'study';
type VisualizationState = 'waiting' | 'thinking' | 'evaluating' | 'speaking' | 'happy' | 'sad';

interface ExamMessage {
    id: string;
    type: 'question' | 'answer' | 'feedback';
    text?: string;
    audioUrl?: string;
    isPlaying?: boolean;
    isCorrect?: boolean;
    teacherMood?: string;
}

interface StudyMessage {
    id: string;
    text: string;
    isFromStudent: boolean;
    timestamp: Date;
}

export default function AIAssistant() {
    const [mode, setMode] = useState<Mode>('select');
    const [examStarted, setExamStarted] = useState(false);
    const [studyStarted, setStudyStarted] = useState(false);
    const [visualizationState, setVisualizationState] = useState<VisualizationState>('waiting');
    const [_currentAudioUrl, setCurrentAudioUrl] = useState<string | undefined>(undefined);

    const [examSessionId, setExamSessionId] = useState<number | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState<QuestionResponse | null>(null);
    const [examMessages, setExamMessages] = useState<ExamMessage[]>([]);
    const [isRecording, setIsRecording] = useState(false);
    const [recordTime, setRecordTime] = useState(0);

    const [studySessionId, setStudySessionId] = useState<number | null>(null);
    const [studyMessages, setStudyMessages] = useState<StudyMessage[]>([]);
    const [studyInput, setStudyInput] = useState('');

    const [teacherName, setTeacherName] = useState('');
    const [subject, setSubject] = useState('');
    const [teacherDescription, setTeacherDescription] = useState('');
    const [materials, setMaterials] = useState<string[]>(['']);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const [uploadAudio] = useUploadAudioMutation();
    const [startExam, { isLoading: isStartingExam }] = useStartExamMutation();
    const [submitAnswer, { isLoading: isSubmittingAnswer }] = useSubmitAnswerMutation();
    const [startStudy, { isLoading: isStartingStudy }] = useStartStudyMutation();
    const [sendStudyMessage, { isLoading: isSendingMessage }] = useSendStudyMessageMutation();

    const { data: studyMessagesData } = useGetStudyMessagesQuery(studySessionId!, { skip: !studySessionId, pollingInterval: studySessionId ? 2000 : 0 });
    const { data: examStatus } = useGetExamStatusQuery(examSessionId!, { skip: !examSessionId, pollingInterval: examSessionId ? 3000 : 0 });

    useEffect(() => {
        if (studyMessagesData) {
            const formatted: StudyMessage[] = studyMessagesData.map(msg => ({
                id: msg.message_id.toString(),
                text: msg.message_text,
                isFromStudent: msg.is_from_student,
                timestamp: new Date(msg.created_at),
            }));
            setStudyMessages(formatted);
        }
    }, [studyMessagesData]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [studyMessages, examMessages]);

    useEffect(() => {
        if (isRecording) {
            timerRef.current = setInterval(() => setRecordTime(prev => prev + 1), 1000);
        } else {
            if (timerRef.current) clearInterval(timerRef.current);
        }
        return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }, [isRecording]);

    const formatTime = (seconds: number) => {
        if (!seconds || isNaN(seconds)) return '0:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins > 0 ? mins + ':' : ''}${secs.toString().padStart(2, '0')}`;
    };

    const handleStartExam = async () => {
        if (!teacherName || !subject || !teacherDescription) return alert('Заполните все поля');
        setVisualizationState('thinking');
        try {
            const result = await startExam({ teacher_name: teacherName, subject, teacher_description: teacherDescription, materials: materials.filter(m => m.trim() !== '') }).unwrap();
            setExamSessionId(result.exam_session_id);
            setCurrentQuestion(result);
            setExamStarted(true);
            setMode('exam');
            const questionMsg: ExamMessage = { id: result.question_id.toString(), type: 'question', text: result.question_text, audioUrl: result.question_audio_url };
            setExamMessages([questionMsg]);
            playQuestionAudio(result.question_audio_url, result.question_id.toString());
        } catch (error) {
            alert('Не удалось запустить экзамен');
            setVisualizationState('waiting');
        }
    };

    const playQuestionAudio = (audioUrl: string, questionId: string) => {
        const audio = new Audio(audioUrl);
        audioRefs.current[questionId] = audio;
        setCurrentAudioUrl(audioUrl);
        setVisualizationState('speaking');
        audio.onplay = () => setExamMessages(prev => prev.map(m => m.id === questionId ? { ...m, isPlaying: true } : m));
        audio.onpause = audio.onended = () => {
            setExamMessages(prev => prev.map(m => m.id === questionId ? { ...m, isPlaying: false } : m));
            setVisualizationState('waiting');
            setCurrentAudioUrl(undefined);
        };
        audio.play().catch(() => { });
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);
            mediaRecorderRef.current = recorder;
            audioChunksRef.current = [];
            recorder.ondataavailable = e => audioChunksRef.current.push(e.data);
            recorder.onstop = async () => {
                stream.getTracks().forEach(t => t.stop());
                const blob = new Blob(audioChunksRef.current, { type: 'audio/mp3' });
                const file = new File([blob], `answer_${Date.now()}.mp3`, { type: 'audio/mp3' });
                try {
                    const audioUrl = await uploadAudio(file).unwrap();
                    const answerMsg: ExamMessage = { id: `answer_${Date.now()}`, type: 'answer', audioUrl };
                    setExamMessages(prev => [...prev, answerMsg]);
                    if (currentQuestion && examSessionId) {
                        setVisualizationState('evaluating');
                        const response = await submitAnswer({ exam_session_id: examSessionId, question_id: currentQuestion.question_id, answer_audio_url: audioUrl }).unwrap();
                        const feedbackMsg: ExamMessage = { id: `feedback_${Date.now()}`, type: 'feedback', text: response.ai_feedback, isCorrect: response.is_correct, teacherMood: response.teacher_mood };
                        setExamMessages(prev => [...prev, feedbackMsg]);
                        setVisualizationState(response.is_correct ? 'happy' : 'sad');
                        if (response.exam_completed) {
                            setTimeout(() => { alert('Экзамен завершен!'); setExamStarted(false); }, 3000);
                        } else if (response.next_question) {
                            const nextQuestion = response.next_question;
                            setTimeout(() => {
                                setVisualizationState('thinking');
                                setTimeout(() => {
                                    const nextMsg: ExamMessage = { id: nextQuestion.question_id.toString(), type: 'question', text: nextQuestion.question_text, audioUrl: nextQuestion.question_audio_url };
                                    setExamMessages(prev => [...prev, nextMsg]);
                                    setCurrentQuestion(nextQuestion);
                                    playQuestionAudio(nextQuestion.question_audio_url, nextQuestion.question_id.toString());
                                }, 2000);
                            }, 3000);
                        }
                    }
                } catch (error) { alert('Ошибка отправки'); }
            };
            recorder.start();
            setIsRecording(true);
            setRecordTime(0);
        } catch (err) { alert('Нет доступа к микрофону'); }
    };

    const stopRecording = () => { if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop(); setIsRecording(false); };
    const cancelRecording = () => { if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop(); setIsRecording(false); setRecordTime(0); };

    const handleStartStudy = async () => {
        if (!teacherName || !subject || !teacherDescription) return alert('Заполните все поля');
        setVisualizationState('thinking');
        try {
            const result = await startStudy({ teacher_name: teacherName, subject, teacher_description: teacherDescription, materials: materials.filter(m => m.trim() !== '') }).unwrap();
            setStudySessionId(result.study_session_id);
            setStudyStarted(true);
            setMode('study');
            const welcomeMsg: StudyMessage = { id: 'welcome', text: result.teacher_response, isFromStudent: false, timestamp: new Date() };
            setStudyMessages([welcomeMsg]);
            setVisualizationState('speaking');
            setTimeout(() => setVisualizationState('waiting'), 2000);
        } catch (error) {
            alert('Не удалось запустить подготовку');
            setVisualizationState('waiting');
        }
    };

    const handleSendStudyMessage = async () => {
        if (!studyInput.trim() || !studySessionId) return;
        const userMsg: StudyMessage = { id: `user_${Date.now()}`, text: studyInput, isFromStudent: true, timestamp: new Date() };
        setStudyMessages(prev => [...prev, userMsg]);
        const messageText = studyInput;
        setStudyInput('');
        setVisualizationState('thinking');
        try {
            const result = await sendStudyMessage({ study_session_id: studySessionId, message: messageText }).unwrap();
            const teacherMsg: StudyMessage = { id: `teacher_${Date.now()}`, text: result.teacher_response, isFromStudent: false, timestamp: new Date() };
            setStudyMessages(prev => [...prev, teacherMsg]);
            setVisualizationState('speaking');
            setTimeout(() => setVisualizationState('waiting'), 2000);
        } catch (error) {
            alert('Не удалось отправить сообщение');
            setVisualizationState('waiting');
        }
    };

    const addMaterialField = () => setMaterials([...materials, '']);
    const removeMaterialField = (index: number) => setMaterials(materials.filter((_, i) => i !== index));
    const updateMaterial = (index: number, value: string) => {
        const newMaterials = [...materials];
        newMaterials[index] = value;
        setMaterials(newMaterials);
    };

    if (mode === 'select') {
        return (
            <div className="min-h-screen bg-[#0a0a1f] flex items-center justify-center p-6">
                <div className="text-center max-w-2xl">
                    <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-cyan-400 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
                        <Sparkles className="w-12 h-12 text-white" />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">AI-Ассистент</h1>
                    <p className="text-gray-400 mb-10">Выберите режим работы</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <button onClick={() => setMode('exam')} className="bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold px-8 py-6 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 flex flex-col items-center gap-3 shadow-lg">
                            <Volume2 className="w-8 h-8" />
                            <span>Голосовой экзамен</span>
                        </button>
                        <button onClick={() => setMode('study')} className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold px-8 py-6 rounded-2xl hover:shadow-xl transition-all transform hover:scale-105 flex flex-col items-center gap-3 shadow-lg">
                            <MessageSquare className="w-8 h-8" />
                            <span>Подготовка к экзамену</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if ((mode === 'exam' && !examStarted) || (mode === 'study' && !studyStarted)) {
        return (
            <div className="min-h-screen bg-[#0a0a1f] py-8 px-6 mt-15">
                <div className="max-w-2xl mx-auto">
                    <div className="bg-[#1a1a3a] rounded-3xl shadow-2xl p-8 border border-white/10">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold text-white">
                                {mode === 'exam' ? 'Начать экзамен' : 'Начать подготовку'}
                            </h2>
                            <button onClick={() => { setMode('select'); setExamStarted(false); setStudyStarted(false); }} className="p-2 hover:bg-white/10 rounded-full transition">
                                <X className="w-5 h-5 text-gray-400" />
                            </button>
                        </div>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Имя преподавателя</label>
                                <input type="text" value={teacherName} onChange={e => setTeacherName(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Иван Петров" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Предмет</label>
                                <input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Математика" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Описание преподавателя</label>
                                <textarea value={teacherDescription} onChange={e => setTeacherDescription(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Строгий, требует точности" rows={3} />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Материалы (опционально)</label>
                                {materials.map((material, index) => (
                                    <div key={index} className="flex gap-2 mb-2">
                                        <textarea value={material} onChange={e => updateMaterial(index, e.target.value)} className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-400" placeholder="Текст материала..." rows={2} />
                                        {materials.length > 1 && (
                                            <button onClick={() => removeMaterialField(index)} className="p-2 text-red-400 hover:bg-white/10 rounded-xl transition">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                                <button onClick={addMaterialField} className="text-sm text-cyan-400 hover:text-cyan-300 font-medium">
                                    + Добавить материал
                                </button>
                            </div>
                            <button onClick={mode === 'exam' ? handleStartExam : handleStartStudy} disabled={isStartingExam || isStartingStudy} className="w-full bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold px-6 py-3 rounded-xl hover:from-cyan-600 hover:to-purple-700 transition-all disabled:opacity-50 shadow-lg">
                                {isStartingExam || isStartingStudy ? 'Запуск...' : 'Начать'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'exam' && examStarted) {
        return (
            <div className="min-h-screen bg-[#0a0a1f] flex flex-col mt-15">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Голосовой экзамен</h1>
                            <p className="text-gray-400">{subject} - {teacherName}</p>
                        </div>
                        {examStatus && (
                            <div className="text-sm text-cyan-400">
                                Вопрос {examStatus.current_question_index + 1} из {examStatus.questions_count}
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex justify-center my-6">
                    <TeacherVisualization state={visualizationState} />
                </div>

                <div
                    className="flex-1 container mx-auto px-6 max-w-4xl overflow-y-auto scrollbar-hide"
                    style={{ maxHeight: 'calc(100vh - 360px)' }}
                >
                    <div className="space-y-4 pb-4">
                        {examMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.type === 'question' ? 'justify-start' : 'justify-end'}`}>
                                <div
                                    className={`max-w-md rounded-2xl p-4 shadow-lg ${msg.type === 'question'
                                        ? 'bg-[#1a1a3a] border border-cyan-500/30 text-white'
                                        : msg.type === 'answer'
                                            ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                                            : msg.isCorrect
                                                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                                                : 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
                                        }`}
                                >
                                    {msg.type === 'question' && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <Volume2 className="w-4 h-4" />
                                                <span className="font-semibold">Вопрос:</span>
                                            </div>
                                            <p>{msg.text}</p>
                                            {msg.audioUrl && (
                                                <button
                                                    onClick={() => {
                                                        const audio = audioRefs.current[msg.id];
                                                        audio?.paused ? audio.play() : audio?.pause();
                                                    }}
                                                    className="mt-2 p-2 bg-white/20 rounded-full hover:bg-white/30 transition"
                                                >
                                                    {msg.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                    {msg.type === 'answer' && (
                                        <div className="flex items-center gap-2">
                                            <Mic className="w-4 h-4" />
                                            <span>Ваш ответ</span>
                                        </div>
                                    )}
                                    {msg.type === 'feedback' && (
                                        <div>
                                            <div className="font-semibold mb-1">{msg.isCorrect ? 'Правильно!' : 'Нужно доработать'}</div>
                                            <p>{msg.text}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {(isSubmittingAnswer || isRecording) && (
                            <div className="flex justify-end">
                                <div className="bg-white/10 text-white p-3 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent"></div>
                                        <span className="text-sm">
                                            {isRecording ? `Запись: ${formatTime(recordTime)}` : 'Обработка...'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    <div ref={messagesEndRef} />
                </div>

                <div className="container mx-auto px-6 py-4 max-w-4xl">
                    <div className="flex items-center gap-3">
                        {isRecording && (
                            <button
                                onClick={cancelRecording}
                                className="p-3 rounded-full bg-white/10 hover:bg-white/20 transition"
                            >
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </button>
                        )}
                        <div className="flex-1 text-center">
                            {isRecording && <span className="text-sm text-gray-300">Запись: {formatTime(recordTime)}</span>}
                        </div>
                        <button
                            onClick={isRecording ? stopRecording : startRecording}
                            disabled={isSubmittingAnswer}
                            className={`relative p-4 rounded-full transition-all ${isRecording
                                ? 'bg-red-500 animate-pulse shadow-lg'
                                : 'bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700'
                                } ${isSubmittingAnswer ? 'opacity-50' : ''}`}
                        >
                            {isRecording ? (
                                <>
                                    <MicOff className="w-6 h-6 text-white" />
                                    <span className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded">
                                        {formatTime(recordTime)}
                                    </span>
                                </>
                            ) : (
                                <Mic className="w-6 h-6 text-white" />
                            )}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'study' && studyStarted) {
        return (
            <div className="min-h-screen bg-[#0a0a1f] flex flex-col mt-15">
                <div className="container mx-auto px-6 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold text-white">Подготовка к экзамену</h1>
                            <p className="text-gray-400">{subject} - {teacherName}</p>
                        </div>
                        <button
                            onClick={() => {
                                setMode('select');
                                setStudyStarted(false);
                                setStudySessionId(null);
                            }}
                            className="p-2 hover:bg-white/10 rounded-full transition"
                        >
                            <X className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>
                </div>

                <div className="flex justify-center my-6">
                    <TeacherVisualization state={visualizationState} />
                </div>

                <div
                    className="flex-1 container mx-auto px-6 max-w-4xl overflow-y-auto scrollbar-hide"
                    style={{ maxHeight: 'calc(100vh - 360px)' }}
                >
                    <div className="space-y-4 pb-4">
                        {studyMessages.map(msg => (
                            <div key={msg.id} className={`flex ${msg.isFromStudent ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`max-w-md rounded-2xl p-4 shadow-lg ${msg.isFromStudent
                                        ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white'
                                        : 'bg-[#1a1a3a] border border-cyan-500/30 text-white'
                                        }`}
                                >
                                    <p className="whitespace-pre-wrap">{msg.text}</p>
                                    <div className="text-xs opacity-70 mt-2">{msg.timestamp.toLocaleTimeString()}</div>
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                        {isSendingMessage && (
                            <div className="flex justify-start">
                                <div className="bg-white/10 text-white p-3 rounded-2xl">
                                    <div className="flex items-center gap-2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-cyan-400 border-t-transparent"></div>
                                        <span className="text-sm">Отправка...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="container mx-auto px-6 py-4 max-w-4xl">
                    <div className="flex items-center gap-3">
                        <input
                            type="text"
                            value={studyInput}
                            onChange={e => setStudyInput(e.target.value)}
                            onKeyPress={e => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendStudyMessage();
                                }
                            }}
                            placeholder="Напишите вопрос..."
                            className="flex-1 px-4 py-3 bg-white/10 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-cyan-400 placeholder-gray-400"
                            disabled={isSendingMessage}
                        />
                        <button
                            onClick={handleSendStudyMessage}
                            disabled={!studyInput.trim() || isSendingMessage}
                            className="p-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}