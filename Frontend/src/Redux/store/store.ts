import { configureStore } from '@reduxjs/toolkit';
import {registerApi} from "../api/registerApi.ts";
import authReducer from "../slices/authSlice.ts";
import {examApi} from "../api/examApi.ts";

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const store = configureStore({
    reducer: {
        [examApi.reducerPath]: examApi.reducer,
        [registerApi.reducerPath]: registerApi.reducer,
        auth: authReducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware()
            .concat(registerApi.middleware)
            .concat(examApi.middleware)
});
