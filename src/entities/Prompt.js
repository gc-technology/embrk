const WORKER_URL = import.meta.env.VITE_WORKER_URL ?? ''

export const Prompt = {
  async create(data) {
    const res = await fetch(`${WORKER_URL}/api/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async list(filters = {}) {
    const params = new URLSearchParams(filters)
    const res = await fetch(`${WORKER_URL}/api/prompts?${params}`)
    return res.json()
  },
  async update(id, data) {
    const res = await fetch(`${WORKER_URL}/api/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async delete(id) {
    const res = await fetch(`${WORKER_URL}/api/prompts/${id}`, {
      method: 'DELETE'
    })
    return res.json()
  }
}