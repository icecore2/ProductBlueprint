import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatCurrency, calculateCategoryPercentage } from '@/lib/utils';
import type { Subscription } from '@shared/schema';

interface CategoryCardsProps {
  subscriptions: Subscription[];
  isLoading: boolean;
}

type CategorySummary = {
  name: string;
  count: number;
  total: number;
  percentage: number;
};

const CategoryCards: React.FC<CategoryCardsProps> = ({ subscriptions, isLoading }) => {
  const categorySummaries = useMemo(() => {
    if (!subscriptions.length) return [];

    const categoryMap = new Map<string, CategorySummary>();
    
    // Calculate total spending for all subscriptions
    const totalSpending = subscriptions.reduce((total, sub) => total + sub.amount, 0);

    // Group by category
    subscriptions.forEach(sub => {
      const existing = categoryMap.get(sub.category);
      
      if (existing) {
        existing.count += 1;
        existing.total += sub.amount;
      } else {
        categoryMap.set(sub.category, {
          name: sub.category,
          count: 1,
          total: sub.amount,
          percentage: 0,
        });
      }
    });

    // Calculate percentages
    categoryMap.forEach(category => {
      category.percentage = calculateCategoryPercentage(category.total, totalSpending);
    });

    return Array.from(categoryMap.values());
  }, [subscriptions]);

  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Categories</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <Card key={`skeleton-${index}`} className="p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-8 rounded-full" />
              </div>
              <Skeleton className="h-7 w-16 mt-2" />
              <Skeleton className="h-4 w-24 mt-1" />
            </Card>
          ))
        ) : categorySummaries.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No categories yet. Add subscriptions to see category breakdowns.
          </div>
        ) : (
          categorySummaries.map((category) => (
            <Card key={category.name} className="p-4 border border-gray-100">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium text-gray-800">{category.name}</h3>
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                  {category.count}
                </span>
              </div>
              <div className="text-xl font-bold text-gray-800">{formatCurrency(category.total)}</div>
              <div className="text-xs text-gray-500">{category.percentage}% of your spending</div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CategoryCards;
