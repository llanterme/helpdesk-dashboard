/**
 * Trello API Configuration
 *
 * Environment Variables Required:
 * - TRELLO_API_KEY: API Key from Trello Power-Up admin
 * - TRELLO_TOKEN: User token with read/write access
 */

export interface TrelloConfig {
  apiKey: string
  token: string
}

export const TRELLO_BASE_URL = 'https://api.trello.com/1'

export const getTrelloConfig = (): TrelloConfig => {
  const apiKey = process.env.TRELLO_API_KEY
  const token = process.env.TRELLO_TOKEN

  if (!apiKey || !token) {
    throw new Error(
      'Missing Trello configuration. Required: TRELLO_API_KEY, TRELLO_TOKEN'
    )
  }

  return {
    apiKey,
    token,
  }
}

// Check if Trello integration is configured
export const isTrelloConfigured = (): boolean => {
  return !!(process.env.TRELLO_API_KEY && process.env.TRELLO_TOKEN)
}
