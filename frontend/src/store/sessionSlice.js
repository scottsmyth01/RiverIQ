import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// =======================
// GET ALL SESSIONS
// =======================

export const fetchSessions = createAsyncThunk('sessions/fetchSessions', async () => {
  try {
    const res = await fetch(`${API_URL}/api/sessions`, {
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to load sessions');
    return data.sessions;
  } catch (err) {
    throw new Error(err.message || 'Unable to load sessions');
  }
});

// =======================
// ADD SESSION
// =======================

export const addSession = createAsyncThunk('sessions/addSession', async (sessionData) => {
  try {
    const res = await fetch(`${API_URL}/api/sessions/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(sessionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Unable to add session');
    return data.session;
  } catch (err) {
    throw new Error(err.message || 'Unable to add session');
  }
});

// =======================
// UPDATE SESSION
// =======================

export const updateSession = createAsyncThunk('sessions/updateSession', async ({ id, sessionData }) => {
  try {
    const res = await fetch(`${API_URL}/api/sessions/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(sessionData),
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Unable to update sessions');

    return data.session;
  } catch (err) {
    throw new Error(err.message || 'Unable to update session');
  }
});

// =======================
// DELETE SESSION
// =======================

export const deleteSession = createAsyncThunk('sessions/deleteSession', async (id) => {
  try {
    const res = await fetch(`${API_URL}/api/sessions/${id}`, {
      method: 'DELETE',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) throw new Error('Unable to delete sessions');

    return id;
  } catch (err) {
    throw new Error(err.message || 'Unable to delete session');
  }
});

const initialState = {
  sessions: [],
  status: 'idle',
  loading: false,
  error: null,
};

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  extraReducers: (builder) => {
    builder

      // =======================
      // GET ALL SESSIONS
      // =======================

      .addCase(fetchSessions.pending, (state) => {
        state.status = 'loading';
        state.loading = true;
        state.error = null;
      })

      .addCase(fetchSessions.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.loading = false;
        state.sessions = action.payload;
      })

      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = 'failed';
        state.loading = false;
        state.error = action.error.message;
      })

      // =======================
      // ADD SESSION
      // =======================

      .addCase(addSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions.push(action.payload);
      })
      .addCase(addSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =======================
      // UPDATE SESSION
      // =======================

      .addCase(updateSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateSession.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.sessions.findIndex((session) => session._id === action.payload._id);

        if (index !== -1) {
          state.sessions[index] = action.payload;
        }
      })
      .addCase(updateSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // =======================
      // DELETE SESSION
      // =======================

      .addCase(deleteSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteSession.fulfilled, (state, action) => {
        state.loading = false;
        state.sessions = state.sessions.filter((session) => session._id !== action.payload);
      })
      .addCase(deleteSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

// Named Selectors
export const selectSessions = (state) => state.sessions.sessions;
export const selectSessionsStatus = (state) => state.sessions.status;
export const selectSessionsLoading = (state) => state.sessions.loading;
export const selectSessionsError = (state) => state.sessions.error;

export default sessionSlice.reducer;
