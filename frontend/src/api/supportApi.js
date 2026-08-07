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
    error.status = res.status;
    throw error;
  }

  return data;
}

export async function getMySupportConversation() {
  const data = await request('/api/support/me');
  return data.conversation;
}

export async function sendSupportMessage(messageData) {
  const data = await request('/api/support/messages', {
    method: 'POST',
    body: JSON.stringify(messageData),
  });

  return data.conversation;
}

export async function getSupportConversations(status = 'open') {
  const data = await request(`/api/support/conversations?status=${encodeURIComponent(status)}`);
  return data.conversations || [];
}

export async function getSupportConversation(id) {
  const data = await request(`/api/support/conversations/${id}`);
  return data.conversation;
}

export async function sendSupportReply({ id, body }) {
  const data = await request(`/api/support/conversations/${id}/messages`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });

  return data.conversation;
}

export async function updateSupportConversationStatus({ id, status }) {
  const data = await request(`/api/support/conversations/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  return data.conversation;
}

export async function deleteSupportConversation(id) {
  const data = await request(`/api/support/conversations/${id}`, {
    method: 'DELETE',
  });

  return data.id;
}
