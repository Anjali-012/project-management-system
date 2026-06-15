import {createSlice} from '@reduxjs/toolkit';

import type { AuthState } from '../../types'

const initialState: { auth: AuthState | null; loading: boolean } = {
  auth: null,
  loading: false,
}


const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
      setAuth(state, action) {
        state.auth = action.payload
      },

      setLoading(state, action) {
        state.loading = action.payload
      },

      logout(state) {
        state.auth = null
      },
    },
  })

export const {
  setAuth,
  setLoading,
  logout,
} = authSlice.actions

export default authSlice.reducer

