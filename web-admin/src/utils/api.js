const API = import.meta.env.VITE_API_URL || ''

export function getToken() {
  return localStorage.getItem('agendamx_token')
}

export async function apiFetch(path, options = {}) {
  const token = getToken()
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Error del servidor')
  return data
}
