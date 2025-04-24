import React from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';
import {
  HomeIcon,
  PlusIcon,
  BellIcon,
  Settings2Icon,
  UsersRoundIcon
} from 'lucide-react';

const navItems = [
  { href: '/', icon: HomeIcon, label: 'Home' },
  { href: '/add', icon: PlusIcon, label: 'Add' },
  { href: '/members', icon: UsersRoundIcon, label: 'House' },
  { href: '/notifications', icon: BellIcon, label: 'Alerts' },
  { href: '/settings', icon: Settings2Icon, label: 'Settings' },
];

const MobileNavigation: React.FC = () => {
  const [location] = useLocation();

  return (
    <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-200 flex items-center justify-around py-3 z-10">
      {navItems.map((item) => {
        const isActive = location === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex flex-col items-center">
              <item.icon 
                className={cn(
                  "h-6 w-6", 
                  isActive ? "text-primary-600" : "text-gray-500"
                )} 
              />
              <span 
                className={cn(
                  "text-xs mt-1", 
                  isActive ? "text-primary-600" : "text-gray-500"
                )}
              >
                {item.label}
              </span>
          </Link>
        );
      })}
    </div>
  );
};

export default MobileNavigation;
