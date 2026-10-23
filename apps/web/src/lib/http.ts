import { API_GLOBAL_PREFIX } from '@furai/shared'

const API_BASE = `/${API_GLOBAL_PREFIX}`

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    throw new Error(await readError(response))
  }

  return (await response.json()) as T
}

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] }
    if (Array.isArray(body.message)) {
      return body.message.join(', ')
    }
    if (typeof body.message === 'string' && body.message.length > 0) {
      return body.message
    }
  } catch {
    return `Request failed (${response.status})`
  }

  return `Request failed (${response.status})`
}
