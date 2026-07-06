const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000').replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }
  return data;
}

export async function getSessions() {
  const data = await request('/api/sessions');
  return data.sessions;
}

export async function addSession(sessionData) {
  const data = await request('/api/sessions/addSession', {
    method: 'POST',
    body: sessionData instanceof FormData ? sessionData : JSON.stringify(sessionData),
  });
  return data.session;
}

export async function updateSession({ id, sessionData }) {
  const data = await request(`/api/sessions/${id}`, {
    method: 'PUT',
    body: JSON.stringify(sessionData),
  });
  return data.session;
}

export async function deleteSession(id) {
  await request(`/api/sessions/${id}`, {
    method: 'DELETE',
  });
  return id;
}
