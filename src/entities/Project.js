const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? ''

export const Project = {
  async create(data) {
    const res = await fetch(`${WORKER_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async list() {
    const res = await fetch(`${WORKER_URL}/api/projects`)
    return res.json()
  },
  async get(id) {
    const res = await fetch(`${WORKER_URL}/api/projects/${id}`)
    return res.json()
  },
  async update(id, data) {
    const res = await fetch(`${WORKER_URL}/api/projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async delete(id) {
    const res = await fetch(`${WORKER_URL}/api/projects/${id}`, {
      method: 'DELETE'
    })
    return res.json()
  }
}