'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline'
import { useClientStore, ClientWithStats } from '@/stores/clientStore'
import { ClientItem } from './ClientItem'
import { ClientFilters } from './ClientFilters'

export function ClientList() {
  const {
    clients,
    filters,
    pagination,
    setClients,
    setLoading,
    setError,
    setPagination,
    getClientStats
  } = useClientStore()

  // Construct query key from filters and pagination
  const queryKey = ['clients', filters, pagination.page, pagination.limit]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.company) params.set('company', filters.company)

      const response = await fetch(`/api/clients?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch clients')
      }
      return response.json()
    },
    staleTime: 30000, // 30 seconds
  })

  useEffect(() => {
    setLoading(isLoading)
  }, [isLoading, setLoading])

  useEffect(() => {
    if (error) {
      setError(error instanceof Error ? error.message : 'Unknown error')
    } else {
      setError(null)
    }
  }, [error, setError])

  useEffect(() => {
    if (data) {
      setClients(data.clients, data.pagination)
    }
  }, [data, setClients])

  const stats = getClientStats()

  const handlePageChange = (newPage: number) => {
    setPagination({ page: newPage })
  }

  if (isLoading && clients.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading clients...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading clients</p>
          <p className="text-sm text-gray-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
            <p className="text-gray-600">
              Manage your client relationships and contact information
            </p>
          </div>

          <Link
            href="/clients/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4" />
            Add Client
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Clients</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-red-600">{stats.activeTickets}</div>
            <div className="text-sm text-gray-600">Active Tickets</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.companies}</div>
            <div className="text-sm text-gray-600">Companies</div>
          </div>
        </div>
      </div>

      <ClientFilters />

      {/* Client Grid */}
      <div className="flex-1 p-6">
        {clients.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.196-2.121M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.196-2.121M7 20v-2c0-.656.126-1.283.356-1.857M7 4a3 3 0 116 0v1M7 4a3 3 0 100-6 3 3 0 000 6zm0 0v1m6-1V4a3 3 0 10-6 0v1M7 4h6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
            <p className="text-gray-600 mb-6">
              {filters.search || filters.company
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first client'}
            </p>
            <Link
              href="/clients/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4" />
              Add Client
            </Link>
          </div>
        ) : (
          <>
            {/* Loading Overlay */}
            {isLoading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-10">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-600"></div>
              </div>
            )}

            {/* Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
              {clients.map((client) => (
                <Link key={client.id} href={`/clients/${client.id}`}>
                  <ClientItem client={client} onClick={() => {}} />
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {((pagination.page - 1) * pagination.limit) + 1} to{' '}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
                  {pagination.total} results
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="h-4 w-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.pages }, (_, i) => i + 1)
                      .filter(page =>
                        page === 1 ||
                        page === pagination.pages ||
                        Math.abs(page - pagination.page) <= 2
                      )
                      .map((page, index, array) => (
                        <div key={page} className="flex items-center">
                          {index > 0 && array[index - 1] !== page - 1 && (
                            <span className="px-2 text-gray-400">...</span>
                          )}
                          <button
                            onClick={() => handlePageChange(page)}
                            className={`px-3 py-2 text-sm rounded-md ${
                              page === pagination.page
                                ? 'bg-slate-600 text-white'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                          >
                            {page}
                          </button>
                        </div>
                      ))}
                  </div>

                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages}
                    className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}