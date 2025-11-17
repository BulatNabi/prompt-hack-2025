import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
    name: 'auth',
    initialState: {
        accessToken: null as string | null,
    },
    reducers: {
        setToken: (state, action) => {
            state.accessToken = action.payload;
        },
        clearToken: (state) => {
            state.accessToken = null;
        },
    },
});

export const { setToken, clearToken } = authSlice.actions;
export default authSlice.reducer;