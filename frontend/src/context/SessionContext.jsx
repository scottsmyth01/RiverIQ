import { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from './AuthContext';
const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [sessions, setSessions] = useState(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const getSessions = async () => {
      try {
        const res = await fetch(`${API_URL}/api/sessions`, {
          credentials: 'include',
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Unable to load sessions');

        setSessions(data.sessions);
        console.log(data.sessions);
      } catch (error) {
        console.log(error);
        setSessions(null);
      } finally {
        setLoading(false);
      }
    };
    getSessions();
  }, []);
  return (
    <SessionContext.Provider
      value={{
        sessions,
        loading,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSessions() {
  return useContext(SessionContext);
}
