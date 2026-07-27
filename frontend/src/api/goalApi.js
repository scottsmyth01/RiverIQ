const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5001').replace(/\/$/, '');

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

export async function getGoals() {
  const data = await request('/api/goals');
  return (data.goals || []).map(normalizeGoal);
}

function normalizeGoal(goal = {}) {
  return {
    ...goal,
    id: goal._id || goal.id,
    dueDate: goal.dueDate ? goal.dueDate.slice(0, 10) : '',
  };
}

export async function createGoal(goalData) {
  const data = await request('/api/goals', {
    method: 'POST',
    body: JSON.stringify(goalData),
  });

  return normalizeGoal(data.goal);
}

export async function updateGoal({ id, goalData }) {
  const data = await request(`/api/goals/${id}`, {
    method: 'PUT',
    body: JSON.stringify(goalData),
  });

  return normalizeGoal(data.goal);
}

export async function deleteGoal(id) {
  await request(`/api/goals/${id}`, {
    method: 'DELETE',
  });

  return id;
}
