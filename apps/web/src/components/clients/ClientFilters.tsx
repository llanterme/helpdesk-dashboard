'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { useClientStore } from '@/stores/clientStore'

export function ClientFilters() {
  const { filters, setFilters, resetFilters } = useClientStore()
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasActiveFilters = filters.search || filters.company

  return (
    <div className="bg-white p-4 border-b border-gray-200">
      <div className="flex flex-col gap-4">
        {/* Search Bar */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search clients by name, email, or company..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded-md transition-colors ${
              showAdvanced || hasActiveFilters
                ? 'bg-slate-100 text-slate-700 border border-slate-300'
                : 'text-gray-600 hover:text-gray-900 border border-transparent hover:border-gray-300'
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filters
            {hasActiveFilters && (
              <span className="bg-slate-600 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
                {[filters.search, filters.company].filter(Boolean).length}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-2 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <XMarkIcon className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="pt-4 border-t border-gray-100">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Company Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company
                </label>
                <input
                  type="text"
                  placeholder="Filter by company name..."
                  value={filters.company}
                  onChange={(e) => setFilters({ company: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-slate-500 focus:border-transparent text-sm"
                />
              </div>

              {/* Additional filters can be added here in the future */}
              <div className="col-span-1 sm:col-span-2 lg:col-span-1 flex items-end">
                <div className="text-xs text-gray-500">
                  More filters coming soon...
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}