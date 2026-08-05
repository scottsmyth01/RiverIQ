const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

// helper function for API requests made from the frontend
// pass in the endpoint and any options (like body, method etc.)

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

  // if there is an error in the res object then create a new error
  // populate the error with .field and .status then throw the error
  // this error comes from the backend, front end validation occurs in the react hook form
  if (!res.ok) {
    const error = new Error(data.message || 'Something went wrong');
    error.field = data.field;
    error.status = res.status;
    throw error;
  }
  return data;
}

export async function getMe() {
  try {
    return await request('/api/auth/me');
  } catch (error) {
    if (error.status === 401) {
      return { user: null };
    }

    throw error;
  }
}

export function registerUser(formData) {
  return request('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export function loginUser(formData) {
  return request('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(formData),
  });
}

export function loginWithGoogle(credential) {
  return request('/api/auth/google', {
    method: 'POST',
    body: JSON.stringify({ credential }),
  });
}

export function logoutUser() {
  return request('/api/auth/logout', {
    method: 'POST',
  });
}

export function cancelSubscription() {
  return request('/api/payments/subscription/cancel', {
    method: 'POST',
  });
}

export function createBillingPortalSession() {
  return request('/api/payments/billing-portal', {
    method: 'POST',
  });
}

export function forgotPassword({ email }) {
  return request('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function validateResetToken(id, token) {
  return request(`/api/auth/reset-password/${id}/${token}`);
}

export function resetPassword(id, token, formData) {
  return request(`/api/auth/reset-password/${id}/${token}`, {
    method: 'POST',
    body: JSON.stringify(formData),
  });
  x;
}

export function verifyEmail(token) {
  return request(`/api/auth/verify-email/${token}`);
}
