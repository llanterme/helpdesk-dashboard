'use client'

import { useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PlusIcon, ChevronLeftIcon, ChevronRightIcon, UserGroupIcon } from '@heroicons/react/24/outline'
import { useAgentStore, AgentWithStats } from '@/stores/agentStore'
import { AgentItem } from './AgentItem'
import { AgentFilters } from './AgentFilters'

export function AgentList() {
  const {
    agents,
    filters,
    pagination,
    summary,
    setAgents,
    setLoading,
    setError,
    setPagination,
    setSummary,
    getAgentStats
  } = useAgentStore()

  // Construct query key from filters and pagination
  const queryKey = ['agents', filters, pagination.page, pagination.limit]

  const { data, isLoading, error } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      })

      if (filters.search) params.set('search', filters.search)
      if (filters.role) params.set('role', filters.role)
      if (filters.status) params.set('status', filters.status)

      const response = await fetch(`/api/agents?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch agents')
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
      setAgents(data.agents, data.pagination)
      setSummary(data.summary)
    }
  }, [data, setAgents, setSummary])

  const stats = getAgentStats()

  const handlePageChange = (newPage: number) => {
    setPagination({ page: newPage })
  }

  if (isLoading && agents.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-800 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-500">Loading agents...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-600">
          <p>Error loading agents</p>
          <p className="text-sm text-gray-500 mt-1">{error instanceof Error ? error.message : 'Unknown error'}</p>
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
            <h1 className="text-2xl font-bold text-gray-900">Team Directory</h1>
            <p className="text-gray-600">
              Manage your support team members and track their performance
            </p>
          </div>

          <Link
            href="/agents/new"
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
          >
            <PlusIcon className="h-4 w-4 text-current" />
            Add Agent
          </Link>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">{summary?.total || stats.total}</div>
            <div className="text-sm text-gray-600">Total Agents</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-green-600">{summary?.activeAgents || stats.activeAgents}</div>
            <div className="text-sm text-gray-600">Active Agents</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-blue-600">{summary?.totalActiveTickets || 0}</div>
            <div className="text-sm text-gray-600">Active Tickets</div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-purple-600">{stats.averageTickets}</div>
            <div className="text-sm text-gray-600">Avg Tickets/Agent</div>
          </div>
        </div>
      </div>

      <AgentFilters />

      {/* Agent Grid */}
      <div className="flex-1 p-6">
        {agents.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No agents found</h3>
            <p className="text-gray-600 mb-6">
              {filters.search || filters.role || filters.status
                ? 'Try adjusting your search or filters'
                : 'Get started by adding your first team member'}
            </p>
            <Link
              href="/agents/new"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors"
            >
              <PlusIcon className="h-4 w-4 text-current" />
              Add Agent
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

            {/* Agent Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 relative">
              {agents.map((agent) => (
                <Link key={agent.id} href={`/agents/${agent.id}`}>
                  <AgentItem agent={agent} onClick={() => {}} />
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
                    <ChevronLeftIcon className="h-4 w-4 text-current" />
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
                    <ChevronRightIcon className="h-4 w-4 text-current" />
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