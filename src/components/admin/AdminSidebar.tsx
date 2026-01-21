import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Wallet,
  Mail,
  Megaphone,
  Settings,
  Menu,
  X,
  Gift,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

const menuItems = [
  {
    href: '/ananindeua',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/ananindeua/users',
    label: 'Usuários',
    icon: Users,
  },
  {
    href: '/ananindeua/plans',
    label: 'Planos',
    icon: CreditCard,
  },
  {
    href: '/ananindeua/gateways',
    label: 'Gateways',
    icon: Wallet,
  },
  {
    href: '/ananindeua/smtp',
    label: 'SMTP',
    icon: Mail,
  },
  {
    href: '/ananindeua/broadcast',
    label: 'Broadcast',
    icon: Megaphone,
  },
  {
    href: '/ananindeua/affiliates',
    label: 'Afiliados',
    icon: Gift,
  },
  {
    href: '/ananindeua/settings',
    label: 'Configurações',
    icon: Settings,
  },
];

export function AdminSidebar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/ananindeua') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="bg-background/80 backdrop-blur-sm"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 h-full w-64 bg-background border-r z-40 transition-transform duration-300',
          'lg:translate-x-0',
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo/Header */}
          <div className="h-16 border-b flex items-center justify-center px-4">
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>

          {/* Menu */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors',
                    active
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}

