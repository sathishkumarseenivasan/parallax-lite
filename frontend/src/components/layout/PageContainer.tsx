/**
 * PageContainer — wraps page content with consistent max-width and padding.
 */
import { cn } from '@/lib/utils'

interface PageContainerProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function PageContainer({
  title,
  subtitle,
  actions,
  children,
  className,
}: PageContainerProps) {
  return (
    <main className={cn('max-w-7xl mx-auto px-6 py-8', className)}>
      {/* Page header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {children}
    </main>
  )
}
