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

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || 'Something went wrong');
  }

  return data;
}

function normalizeSavedReport(report = {}) {
  return {
    ...report,
    id: report._id || report.id,
  };
}

export async function getSavedReports() {
  const data = await request('/api/saved-reports');
  return (data.savedReports || []).map(normalizeSavedReport);
}

export async function createSavedReport(reportData) {
  const data = await request('/api/saved-reports', {
    method: 'POST',
    body: JSON.stringify(reportData),
  });

  return normalizeSavedReport(data.savedReport);
}

export async function updateSavedReport({ id, reportData }) {
  const data = await request(`/api/saved-reports/${id}`, {
    method: 'PUT',
    body: JSON.stringify(reportData),
  });

  return normalizeSavedReport(data.savedReport);
}

export async function deleteSavedReport(id) {
  await request(`/api/saved-reports/${id}`, {
    method: 'DELETE',
  });

  return id;
}
