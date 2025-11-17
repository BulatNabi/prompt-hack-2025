import {createApi} from "@reduxjs/toolkit/query/react";
import {baseQueryWithReauth} from "./baseQueryWithReauth.ts";

export const registerApi = createApi({
    reducerPath: 'registerApi',
    baseQuery: baseQueryWithReauth,
    endpoints: (builder) => ({
        registerUser: builder.mutation<string, {username: string, password: string, email: string}>({
            query: ({ username, password, email }) => ({
                url: '/register',
                method: 'POST',
                body: { username, password, email },
            }),
        }),
        loginUser: builder.mutation<
            { access_token: string; refresh_token: string; token_type: string },
            { email1: string; password: string }
        >({
            query: ({ email1: email, password }) => ({
                url: '/login',
                method: 'POST',
                body: {
                    email,
                    password,
                },
            }),
        }),
    })
})

export const {
    useRegisterUserMutation,
    useLoginUserMutation
} = registerApi