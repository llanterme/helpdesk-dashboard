'use client'

import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className={`min-h-screen bg-gray-50 ${inter.className}`}>
      {/* Portal Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <a href="https://easyservicesgroup.co.za" className="flex items-center gap-3">
              <img
                src="/images/logo.png"
                alt="Easy Services Group"
                className="h-10 w-auto"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Customer Portal</h1>
                <p className="text-xs text-gray-500">Easy Services Group</p>
              </div>
            </a>
            <a
              href="https://easyservicesgroup.co.za"
              className="text-sm text-slate-600 hover:text-slate-800 flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Website
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>

      {/* Portal Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm text-gray-500">
              Need help? Contact us at{' '}
              <a href="tel:+27726583987" className="text-slate-600 hover:text-slate-800">
                +27 72 658 3987
              </a>
              {' '}or{' '}
              <a href="https://wa.me/27726583987" className="text-green-600 hover:text-green-700">
                WhatsApp
              </a>
            </div>
            <div className="text-sm text-gray-500">
              © {new Date().getFullYear()} Easy Services Group
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
