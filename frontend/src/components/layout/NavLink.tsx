import { Link, useLocation } from '@tanstack/react-router'
import { cn } from '@/lib/utils'

interface NavLinkProps {
  to: string
  children: React.ReactNode
}

export function NavLink({ to, children }: NavLinkProps) {
  const location = useLocation()
  const isActive = location.pathname === to

  return (
    <Link
      className={cn(
        'block rounded-lg px-3 py-2 text-sm',
        isActive ? 'bg-muted text-foreground' : 'text-muted-foreground',
      )}
      to={to}
    >
      {children}
    </Link>
  )
}
