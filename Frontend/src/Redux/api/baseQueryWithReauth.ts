import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {RootState} from "../store/store.ts";
import {clearToken, setToken} from "../slices/authSlice.ts";


const rawBaseQuery = fetchBaseQuery({
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8000/',
    credentials: 'include',
});

export const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
    const headers = new Headers(args.headers);
    const token = (api.getState() as RootState).auth.accessToken;
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    let result = await rawBaseQuery({ ...args, headers }, api, extraOptions);

    if (result.error?.status === 401) {
        const refreshResult = await rawBaseQuery(
            {
                url: '/refresh',
                method: 'POST',
                body: {},
            },
            api,
            extraOptions
        );

        if (refreshResult.data) {
            const data = refreshResult.data as { access_token: string; refresh_token?: string };
            api.dispatch(setToken(data.access_token));

            if (data.refresh_token) {
                localStorage.setItem('refresh_token', data.refresh_token);
            }

            result = await rawBaseQuery({ ...args, headers }, api, extraOptions);
        } else {
            api.dispatch(clearToken());
            localStorage.removeItem('refresh_token');
        }
    }

    return result;
};