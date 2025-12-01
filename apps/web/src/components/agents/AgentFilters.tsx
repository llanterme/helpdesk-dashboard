'use client'

import { useState } from 'react'
import { useAgentStore, agentUtils } from '@/stores/agentStore'
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline'

export function AgentFilters() {
  const { filters, setFilters, clearFilters, hasActiveFilters } = useAgentStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchChange = (search: string) => {
    setFilters({ search })
  }

  const handleRoleChange = (role: string) => {
    setFilters({ role })
  }

  const handleStatusChange = (status: string) => {
    setFilters({ status })
  }

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    setFilters({ sortBy: sortBy as any, sortOrder: sortOrder as any })
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.search) count++
    if (filters.role && filters.role !== 'all') count++
    if (filters.status && filters.status !== 'all') count++
    return count
  }

  const activeFilterCount = getActiveFilterCount()

  return (
    <div className="bg-white border-b border-gray-200 p-4">
      <div className="flex flex-col gap-4">
        {/* Search and Primary Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search agents by name or email..."
              value={filters.search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`flex items-center gap-2 px-3 py-2 text-sm font-medium border rounded-md transition-colors ${
                showAdvanced
                  ? 'border-slate-300 bg-slate-50 text-slate-700'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <AdjustmentsHorizontalIcon className="h-4 w-4 text-current" />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-slate-600 text-white text-xs rounded-full px-2 py-0.5">
                  {activeFilterCount}
                </span>
              )}
            </button>

            {hasActiveFilters() && (
              <button
                onClick={clearFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
              >
                <XMarkIcon className="h-4 w-4 text-current" />
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
            {/* Role Filter */}
            <div>
              <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="role-filter"
                value={filters.role}
                onChange={(e) => handleRoleChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">All Roles</option>
                {agentUtils.getAvailableRoles().map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status-filter"
                value={filters.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
              >
                <option value="">All Statuses</option>
                {agentUtils.getAvailableStatuses().map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div>
              <label htmlFor="sort-filter" className="block text-sm font-medium text-gray-700 mb-1">
                Sort By
              </label>
              <div className="flex gap-2">
                <select
                  id="sort-filter"
                  value={filters.sortBy}
                  onChange={(e) => handleSortChange(e.target.value, filters.sortOrder)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="name">Name</option>
                  <option value="created">Created Date</option>
                  <option value="tickets">Total Tickets</option>
                  <option value="performance">Performance</option>
                </select>
                <select
                  value={filters.sortOrder}
                  onChange={(e) => handleSortChange(filters.sortBy, e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                >
                  <option value="asc">↑ Asc</option>
                  <option value="desc">↓ Desc</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {hasActiveFilters() && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-200">
            <span className="text-sm font-medium text-gray-700">Active filters:</span>

            {filters.search && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-sm rounded-md">
                Search: "{filters.search}"
                <button
                  onClick={() => handleSearchChange('')}
                  className="text-blue-600 hover:text-blue-800"
                >
                  <XMarkIcon className="h-3 w-3 text-current" />
                </button>
              </span>
            )}

            {filters.role && filters.role !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 text-sm rounded-md">
                Role: {agentUtils.getRoleDisplayName(filters.role as any)}
                <button
                  onClick={() => handleRoleChange('')}
                  className="text-purple-600 hover:text-purple-800"
                >
                  <XMarkIcon className="h-3 w-3 text-current" />
                </button>
              </span>
            )}

            {filters.status && filters.status !== 'all' && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-sm rounded-md">
                Status: {agentUtils.getStatusDisplayName(filters.status as any)}
                <button
                  onClick={() => handleStatusChange('')}
                  className="text-green-600 hover:text-green-800"
                >
                  <XMarkIcon className="h-3 w-3 text-current" />
                </button>
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}