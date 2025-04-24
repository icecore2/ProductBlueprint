import React from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  formatCurrency, 
  formatDate, 
  getCategoryIcon, 
  getCategoryColorClass,
  getSubscriptionStatusClass 
} from '@/lib/utils';
import type { Subscription } from '@shared/schema';
import * as LucideIcons from 'lucide-react';

interface RecentlyAddedProps {
  subscriptions: Subscription[];
  isLoading: boolean;
}

const RecentlyAdded: React.FC<RecentlyAddedProps> = ({ subscriptions, isLoading }) => {
  // Get the 3 most recently created subscriptions
  const recentSubscriptions = React.useMemo(() => {
    if (!subscriptions.length) return [];
    
    return [...subscriptions]
      .sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 3);
  }, [subscriptions]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Recently Added</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 3 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="p-5 border border-gray-100">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center">
                  <Skeleton className="h-10 w-10 rounded" />
                  <div className="ml-3">
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-16 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
              <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                <div>
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-5 w-32 mt-1" />
                </div>
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </Card>
          ))
        ) : recentSubscriptions.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No subscriptions added yet. Start by adding your first subscription.
          </div>
        ) : (
          recentSubscriptions.map((subscription) => {
            const { bgLight, textDark } = getCategoryColorClass(subscription.category);
            const { bgColor, textColor, label } = getSubscriptionStatusClass(subscription.dueDate);
            const IconComponent = LucideIcons[getCategoryIcon(subscription.category) as keyof typeof LucideIcons] || LucideIcons.CreditCard;
            
            return (
              <Card key={subscription.id} className="p-5 border border-gray-100">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center">
                    <div className={`flex-shrink-0 h-10 w-10 rounded ${bgLight} flex items-center justify-center ${textDark}`}>
                      <IconComponent className="h-6 w-6" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-gray-800">{subscription.name}</h3>
                      <p className="text-xs text-gray-500">{subscription.category}</p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-gray-800">{formatCurrency(subscription.amount)}</div>
                </div>
                <div className="border-t border-gray-100 pt-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500">Next payment</p>
                    <p className="text-sm font-medium text-gray-800">{formatDate(subscription.dueDate)}</p>
                  </div>
                  <div>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${bgColor} ${textColor}`}>
                      {label}
                    </span>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentlyAdded;
