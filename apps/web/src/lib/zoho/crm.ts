/**
 * Zoho CRM API Client
 *
 * Handles Contacts sync with CRM
 */

import { getZohoConfig, getZohoBaseUrls } from './config'
import { zohoFetch } from './auth'

export interface ZohoCrmContact {
  id: string
  Full_Name?: string
  First_Name?: string
  Last_Name: string
  Email?: string
  Phone?: string
  Mobile?: string
  Account_Name?: { id: string; name: string }
  Owner?: { id: string; name: string }
  Created_Time: string
  Modified_Time: string
}

export interface ZohoCrmCreateContact {
  First_Name?: string
  Last_Name: string
  Email?: string
  Phone?: string
  Mobile?: string
  Account_Name?: string
}

class ZohoCrmClient {
  private _baseUrl: string | null = null

  private get baseUrl(): string {
    if (!this._baseUrl) {
      const config = getZohoConfig()
      const urls = getZohoBaseUrls(config.region)
      this._baseUrl = urls.crm
    }
    return this._baseUrl
  }

  // ============ CONTACTS ============

  async getContacts(
    page: number = 1,
    perPage: number = 200
  ): Promise<{ contacts: ZohoCrmContact[]; hasMore: boolean }> {
    const response = await zohoFetch(
      `${this.baseUrl}/Contacts?page=${page}&per_page=${perPage}`
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to fetch Zoho CRM contacts: ${error}`)
    }

    const data = await response.json()
    return {
      contacts: data.data || [],
      hasMore: data.info?.more_records || false,
    }
  }

  async getContact(contactId: string): Promise<ZohoCrmContact> {
    const response = await zohoFetch(`${this.baseUrl}/Contacts/${contactId}`)

    if (!response.ok) {
      throw new Error(`Failed to fetch Zoho CRM contact ${contactId}`)
    }

    const data = await response.json()
    return data.data?.[0]
  }

  async createContact(contact: ZohoCrmCreateContact): Promise<ZohoCrmContact> {
    const response = await zohoFetch(`${this.baseUrl}/Contacts`, {
      method: 'POST',
      body: JSON.stringify({
        data: [contact],
        trigger: ['workflow'], // Trigger CRM workflows
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to create Zoho CRM contact: ${error}`)
    }

    const data = await response.json()

    if (data.data?.[0]?.status === 'error') {
      throw new Error(
        `Zoho CRM error: ${data.data[0].message || 'Unknown error'}`
      )
    }

    // Fetch the created contact to get full details
    const createdId = data.data?.[0]?.details?.id
    if (createdId) {
      return this.getContact(createdId)
    }

    return data.data?.[0]
  }

  async updateContact(
    contactId: string,
    updates: Partial<ZohoCrmCreateContact>
  ): Promise<ZohoCrmContact> {
    const response = await zohoFetch(`${this.baseUrl}/Contacts/${contactId}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: [updates],
        trigger: ['workflow'],
      }),
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Failed to update Zoho CRM contact: ${error}`)
    }

    const data = await response.json()

    if (data.data?.[0]?.status === 'error') {
      throw new Error(
        `Zoho CRM error: ${data.data[0].message || 'Unknown error'}`
      )
    }

    return this.getContact(contactId)
  }

  async findContactByEmail(email: string): Promise<ZohoCrmContact | null> {
    const response = await zohoFetch(
      `${this.baseUrl}/Contacts/search?email=${encodeURIComponent(email)}`
    )

    if (!response.ok) {
      // 204 means no results
      if (response.status === 204) {
        return null
      }
      return null
    }

    const data = await response.json()
    return data.data?.[0] || null
  }

  async searchContacts(criteria: string): Promise<ZohoCrmContact[]> {
    const response = await zohoFetch(
      `${this.baseUrl}/Contacts/search?criteria=${encodeURIComponent(criteria)}`
    )

    if (!response.ok) {
      if (response.status === 204) {
        return []
      }
      throw new Error('Failed to search Zoho CRM contacts')
    }

    const data = await response.json()
    return data.data || []
  }

  async deleteContact(contactId: string): Promise<void> {
    const response = await zohoFetch(`${this.baseUrl}/Contacts/${contactId}`, {
      method: 'DELETE',
    })

    if (!response.ok) {
      throw new Error(`Failed to delete Zoho CRM contact ${contactId}`)
    }
  }

  // ============ BULK OPERATIONS ============

  async upsertContacts(
    contacts: ZohoCrmCreateContact[]
  ): Promise<{ created: string[]; updated: string[]; errors: string[] }> {
    // Zoho allows max 100 records per request
    const results = {
      created: [] as string[],
      updated: [] as string[],
      errors: [] as string[],
    }

    const chunks = this.chunkArray(contacts, 100)

    for (const chunk of chunks) {
      const response = await zohoFetch(`${this.baseUrl}/Contacts/upsert`, {
        method: 'POST',
        body: JSON.stringify({
          data: chunk,
          duplicate_check_fields: ['Email'],
          trigger: ['workflow'],
        }),
      })

      if (!response.ok) {
        results.errors.push(`Bulk upsert failed: ${response.status}`)
        continue
      }

      const data = await response.json()

      for (const record of data.data || []) {
        if (record.status === 'success') {
          if (record.action === 'insert') {
            results.created.push(record.details.id)
          } else {
            results.updated.push(record.details.id)
          }
        } else {
          results.errors.push(record.message || 'Unknown error')
        }
      }
    }

    return results
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }
}

// Export singleton instance
export const zohoCrm = new ZohoCrmClient()
