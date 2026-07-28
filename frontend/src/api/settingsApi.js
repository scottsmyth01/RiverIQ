const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

async function request(endpoint, options = {}) {
  const headers = { ...options.headers };

  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  let res;

  try {
    res = await fetch(`${API_URL}${endpoint}`, {
      credentials: 'include',
      ...options,
      headers,
    });
  } catch {
    const error = new Error('Unable to connect. Please check your connection and try again.');
    error.status = 0;
    throw error;
  }

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.field = data.field;
    error.status = res.status;
    throw error;
  }

  return data;
}

export function updateSettings(settings) {
  return request('/api/settings', {
    method: 'PATCH',
    body: JSON.stringify(settings),
  });
}

export function updateBankroll(payload) {
  return request('/api/settings/bankroll', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('avatar', file);

  return request('/api/settings/avatar', {
    method: 'POST',
    body: formData,
  });
}

export function deleteAvatar() {
  return request('/api/settings/avatar', {
    method: 'DELETE',
  });
}
