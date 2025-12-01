'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Service } from '@/stores/serviceStore'
import { ServiceDetail } from '@/components/services/ServiceDetail'
import { ServiceForm } from '@/components/services/ServiceForm'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import {
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

interface DeleteConfirmationProps {
  service: Service
  isOpen: boolean
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationDialog({ service, isOpen, onConfirm, onCancel }: DeleteConfirmationProps) {
  if (!isOpen) return null

  const hasUsage = (service._count?.quoteItems || 0) + (service._count?.invoiceItems || 0) > 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Delete Service
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to delete <strong>{service.name}</strong>?
                {hasUsage && (
                  <span className="block mt-2 text-orange-600 font-medium">
                    This service has been used in {service._count?.quoteItems || 0} quote(s) and {service._count?.invoiceItems || 0} invoice(s).
                    It will be archived instead of permanently deleted.
                  </span>
                )}
              </p>

              <div className="bg-gray-50 border border-gray-200 rounded p-3 mb-4">
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>SKU:</strong> {service.sku}</div>
                  <div><strong>Category:</strong> {service.category}</div>
                  <div><strong>Rate:</strong> R{service.rate.toFixed(2)} {service.unit}</div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 flex items-center"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              {hasUsage ? 'Archive Service' : 'Delete Service'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ServiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const serviceId = params.id as string

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [serviceToDelete, setServiceToDelete] = useState<Service | undefined>()

  // Handle back to services list
  const handleBack = () => {
    router.push('/services')
  }

  // Handle edit service
  const handleEditService = (service: Service) => {
    setIsFormOpen(true)
  }

  // Handle delete service
  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service)
    setIsDeleteDialogOpen(true)
  }

  // Handle form success
  const handleFormSuccess = (service: Service) => {
    // Stay on the same page but close form
    setIsFormOpen(false)
  }

  // Handle form close
  const handleFormClose = () => {
    setIsFormOpen(false)
  }

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!serviceToDelete) return

    try {
      // After successful delete, navigate back to services list
      setIsDeleteDialogOpen(false)
      setServiceToDelete(undefined)
      router.push('/services')
    } catch (error) {
      console.error('Error deleting service:', error)
    }
  }

  // Handle cancel delete
  const handleCancelDelete = () => {
    setIsDeleteDialogOpen(false)
    setServiceToDelete(undefined)
  }

  return (
    <DashboardLayout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <nav className="flex" aria-label="Breadcrumb">
            <ol className="flex items-center space-x-4">
              <li>
                <button
                  onClick={handleBack}
                  className="text-gray-500 hover:text-gray-700 flex items-center"
                >
                  Services
                </button>
              </li>
              <li>
                <div className="flex items-center">
                  <svg className="flex-shrink-0 h-4 w-4 text-gray-400 mx-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
                  </svg>
                  <span className="text-gray-900 font-medium">
                    Service Details
                  </span>
                </div>
              </li>
            </ol>
          </nav>
        </div>

        {/* Main Content */}
        <ServiceDetail
          serviceId={serviceId}
          onBack={handleBack}
          onEdit={handleEditService}
          onDelete={handleDeleteService}
        />

        {/* Service Form Modal */}
        <ServiceForm
          service={serviceToDelete} // This will be set when editing
          isOpen={isFormOpen}
          onClose={handleFormClose}
          onSuccess={handleFormSuccess}
        />

        {/* Delete Confirmation Dialog */}
        {serviceToDelete && (
          <DeleteConfirmationDialog
            service={serviceToDelete}
            isOpen={isDeleteDialogOpen}
            onConfirm={handleConfirmDelete}
            onCancel={handleCancelDelete}
          />
        )}
      </div>
    </DashboardLayout>
  )
}