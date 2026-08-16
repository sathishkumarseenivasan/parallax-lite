import Link from 'next/link'

/**
 * Custom 404 page — beautiful, branded, with navigation back to the dashboard.
 */
export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center max-w-md px-6">
        {/* Animated glitch-style 404 */}
        <div className="relative mb-6">
          <p
            className="font-mono font-bold tracking-tighter"
            style={{ fontSize: 120, lineHeight: 1, color: '#E5E7EB' }}
          >
            404
          </p>
          <p
            className="absolute inset-0 font-mono font-bold tracking-tighter"
            style={{
              fontSize: 120,
              lineHeight: 1,
              color: '#4F46E5',
              clipPath: 'polygon(0 45%, 100% 45%, 100% 55%, 0 55%)',
            }}
          >
            404
          </p>
        </div>

        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Route not found
        </h1>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed">
          The page you're looking for doesn't exist in this protocol version.
          It may have been moved, deleted, or you may have mistyped the URL.
        </p>

        <div className="flex items-center justify-center gap-3">
          <Link
            href="/app"
            className="btn btn-primary"
          >
            ← Back to Dashboard
          </Link>
          <Link
            href="/transactions"
            className="btn btn-default"
          >
            View Transactions
          </Link>
        </div>

        <p className="text-xs text-gray-400 mt-8 font-mono">
          Parallax Protocol · v0.1.0
        </p>
      </div>
    </div>
  )
}
