import React from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import { MOCK_AVATAR_INITIALS, MOCK_USER_NAME } from '@/lib/constants';
import {
  HomeIcon,
  PlusIcon,
  Grid3x3Icon,
  BellIcon,
  Settings2Icon,
  UsersRoundIcon
} from 'lucide-react';
import ServicePackages from './service-packages';
import { Separator } from './ui/separator';

const navItems = [
  { href: '/', icon: HomeIcon, label: 'Dashboard' },
  { href: '/services', icon: Grid3x3Icon, label: 'Services' },
  { href: '/members', icon: UsersRoundIcon, label: 'Household' },
  { href: '/notifications', icon: BellIcon, label: 'Notifications' },
  { href: '/settings', icon: Settings2Icon, label: 'Settings' },
];

const Sidebar: React.FC = () => {
  const [location] = useLocation();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200">
      <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
        <div className="flex items-center flex-shrink-0 px-4">
          <h1 className="font-display text-xl font-bold text-primary-600">SubTrackr</h1>
        </div>
        <div className="mt-8 flex-grow flex flex-col">
          <nav className="flex-1 px-2 space-y-1">
            {navItems.map((item) => {
              const isActive = location === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={cn(
                    "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                    isActive 
                      ? "bg-primary-50 text-primary-600" 
                      : "text-gray-700 hover:bg-gray-50 hover:text-primary-600"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
          {/* Available Service Packages */}
          <div className="mt-6 px-2">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Available Service Packages</h3>
            <ServicePackages />
          </div>
        </div>
        <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold">
                {MOCK_AVATAR_INITIALS}
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">{MOCK_USER_NAME}</p>
              <p className="text-xs text-gray-500">View profile</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;