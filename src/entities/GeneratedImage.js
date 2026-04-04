const WORKER_URL = 'https://embark-worker.gideonconcepts7.workers.dev'

export const GeneratedImage = {
  async create(data) {
    const res = await fetch(`${WORKER_URL}/api/images`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async list(filters = {}) {
    const params = new URLSearchParams(filters)
    const res = await fetch(`${WORKER_URL}/api/images?${params}`)
    return res.json()
  },
  async update(id, data) {
    const res = await fetch(`${WORKER_URL}/api/images/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async delete(id) {
    const res = await fetch(`${WORKER_URL}/api/images/${id}`, {
      method: 'DELETE'
    })
    return res.json()
  }
}