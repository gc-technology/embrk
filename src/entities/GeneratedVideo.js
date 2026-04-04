const WORKER_URL = 'https://embark-worker.gideonconcepts7.workers.dev'

export const GeneratedVideo = {
  async create(data) {
    const res = await fetch(`${WORKER_URL}/api/videos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async list(filters = {}) {
    const params = new URLSearchParams(filters)
    const res = await fetch(`${WORKER_URL}/api/videos?${params}`)
    return res.json()
  },
  async update(id, data) {
    const res = await fetch(`${WORKER_URL}/api/videos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return res.json()
  },
  async delete(id) {
    const res = await fetch(`${WORKER_URL}/api/videos/${id}`, {
      method: 'DELETE'
    })
    return res.json()
  }
}