/**
 * Trello API Client
 *
 * HTTP client for making authenticated requests to Trello API
 */

import { getTrelloConfig, TRELLO_BASE_URL } from './config'

export interface TrelloApiError {
  message: string
  status: number
}

class TrelloClient {
  private apiKey: string
  private token: string

  constructor() {
    const config = getTrelloConfig()
    this.apiKey = config.apiKey
    this.token = config.token
  }

  private getAuthParams(): string {
    return `key=${this.apiKey}&token=${this.token}`
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const baseUrl = `${TRELLO_BASE_URL}${endpoint}`
    const authParams = this.getAuthParams()
    const queryString = params
      ? `${authParams}&${new URLSearchParams(params).toString()}`
      : authParams

    return `${baseUrl}?${queryString}`
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw {
        message: error || `Trello API error: ${response.statusText}`,
        status: response.status,
      } as TrelloApiError
    }

    return response.json()
  }

  async post<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw {
        message: error || `Trello API error: ${response.statusText}`,
        status: response.status,
      } as TrelloApiError
    }

    return response.json()
  }

  async put<T>(
    endpoint: string,
    body?: Record<string, unknown>,
    params?: Record<string, string>
  ): Promise<T> {
    const url = this.buildUrl(endpoint, params)

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    if (!response.ok) {
      const error = await response.text()
      throw {
        message: error || `Trello API error: ${response.statusText}`,
        status: response.status,
      } as TrelloApiError
    }

    return response.json()
  }

  async delete<T>(endpoint: string): Promise<T> {
    const url = this.buildUrl(endpoint)

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
      },
    })

    if (!response.ok) {
      const error = await response.text()
      throw {
        message: error || `Trello API error: ${response.statusText}`,
        status: response.status,
      } as TrelloApiError
    }

    return response.json()
  }
}

// Singleton instance
let trelloClient: TrelloClient | null = null

export const getTrelloClient = (): TrelloClient => {
  if (!trelloClient) {
    trelloClient = new TrelloClient()
  }
  return trelloClient
}

export { TrelloClient }
