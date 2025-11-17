import { createApi } from "@reduxjs/toolkit/query/react";
import { baseQueryWithReauth } from "./baseQueryWithReauth.ts";

export interface ExamStartRequest {
    teacher_name: string;
    subject: string;
    teacher_description: string;
    materials?: string[];
}

export interface QuestionResponse {
    exam_session_id: number;
    question_id: number;
    question_text: string;
    question_audio_url: string;
    question_index: number;
    is_follow_up: boolean;
}

export interface AnswerRequest {
    exam_session_id: number;
    question_id: number;
    answer_audio_url: string;
}

export interface AnswerResponse {
    exam_session_id: number;
    answer_id: number;
    is_correct: boolean;
    ai_feedback: string;
    teacher_mood: string;
    next_question?: QuestionResponse;
    exam_completed: boolean;
}

export interface ExamStatusResponse {
    exam_session_id: number;
    status: string;
    teacher_mood: string;
    current_question_index: number;
    questions_count: number;
    created_at: string;
}

export interface StudyStartRequest {
    teacher_name: string;
    subject: string;
    teacher_description: string;
    materials?: string[];
}

export interface StudyResponse {
    study_session_id: number;
    teacher_response: string;
}

export interface StudyMessageRequest {
    study_session_id: number;
    message: string;
}

export interface StudyMessageResponse {
    study_session_id: number;
    message_id: number;
    message_text: string;
    is_from_student: boolean;
    created_at: string;
}

export interface PDFUploadResponse {
    subject: string;
    document_ids: string[];
    pages_count: number;
    chunks_count: number;
    message: string;
}

export const examApi = createApi({
    reducerPath: 'examApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Exam', 'Study', 'Materials'],
    endpoints: (builder) => ({
        uploadAudio: builder.mutation<string, File>({
            query: (file) => {
                const formData = new FormData();
                formData.append("file", file);

                return {
                    url: "/upload",
                    method: "POST",
                    body: formData,
                    responseHandler: (response: Response) => response.json(),
                };
            },
            transformResponse: (response: { url: string }) => response.url,
        }),

        startExam: builder.mutation<QuestionResponse, ExamStartRequest>({
            query: (data) => ({
                url: "/exam/start",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ['Exam'],
        }),

        submitAnswer: builder.mutation<AnswerResponse, AnswerRequest>({
            query: (data) => ({
                url: "/exam/answer",
                method: "POST",
                body: data,
            }),
        }),

        getExamStatus: builder.query<ExamStatusResponse, number>({
            query: (examSessionId) => `/exam/${examSessionId}/status`,
            providesTags: ['Exam'],
        }),

        startStudy: builder.mutation<StudyResponse, StudyStartRequest>({
            query: (data) => ({
                url: "/study/start",
                method: "POST",
                body: data,
            }),
            invalidatesTags: ['Study'],
        }),

        sendStudyMessage: builder.mutation<StudyResponse, StudyMessageRequest>({
            query: (data) => ({
                url: "/study/message",
                method: "POST",
                body: data,
            }),
        }),

        getStudyMessages: builder.query<StudyMessageResponse[], number>({
            query: (studySessionId) => `/study/${studySessionId}/messages`,
            providesTags: ['Study'],
        }),

        uploadPDF: builder.mutation<PDFUploadResponse, { subject: string; file: File }>({
            query: ({ subject, file }) => {
                const formData = new FormData();
                formData.append("subject", subject);
                formData.append("file", file);

                return {
                    url: "/materials/upload-pdf",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ['Materials'],
        }),

        uploadPDFFromUrl: builder.mutation<PDFUploadResponse, { subject: string; pdf_url: string }>({
            query: ({ subject, pdf_url }) => {
                const formData = new FormData();
                formData.append("subject", subject);
                formData.append("pdf_url", pdf_url);

                return {
                    url: "/materials/upload-pdf-from-url",
                    method: "POST",
                    body: formData,
                };
            },
            invalidatesTags: ['Materials'],
        }),
    })
})

export const {
    useUploadAudioMutation,
    useStartExamMutation,
    useSubmitAnswerMutation,
    useGetExamStatusQuery,
    useStartStudyMutation,
    useSendStudyMessageMutation,
    useGetStudyMessagesQuery,
    useUploadPDFMutation,
    useUploadPDFFromUrlMutation,
} = examApi