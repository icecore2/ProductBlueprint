import React from 'react';
import { Card } from '@/components/ui/card';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import type { SummaryStats } from '@/lib/types';

interface SummaryCardsProps {
  data?: SummaryStats;
  isLoading: boolean;
}

const SummaryCards: React.FC<SummaryCardsProps> = ({ data, isLoading }) => {
  return (
    <div className="mb-8">
      <h2 className="text-lg font-semibold mb-4">Summary</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Monthly Spending */}
        <Card className="p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Monthly Spending</p>
              {isLoading ? (
                <Skeleton className="h-8 w-24 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-800">
                  {data?.monthlySpending 
                    ? formatCurrency(data.monthlySpending) 
                    : '$0.00'}
                </p>
              )}
            </div>
            <div className="p-2 bg-primary-50 rounded-md text-primary-600">
              <DollarSign className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Active Subscriptions */}
        <Card className="p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Active Subscriptions</p>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-1" />
              ) : (
                <p className="text-2xl font-bold text-gray-800">
                  {data?.activeCount || 0}
                </p>
              )}
            </div>
            <div className="p-2 bg-green-50 rounded-md text-green-600">
              <CheckCircle className="h-6 w-6" />
            </div>
          </div>
        </Card>

        {/* Next Due */}
        <Card className="p-5 border border-gray-100">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm text-gray-500">Next Due</p>
              {isLoading ? (
                <>
                  <Skeleton className="h-8 w-24 mt-1" />
                  <Skeleton className="h-4 w-32 mt-2" />
                </>
              ) : data?.nextDue ? (
                <>
                  <p className="text-2xl font-bold text-gray-800">
                    {formatDate(data.nextDue.date)}
                  </p>
                  <p className="text-sm text-gray-500">
                    {data.nextDue.service} - {formatCurrency(data.nextDue.amount)}
                  </p>
                </>
              ) : (
                <p className="text-lg font-medium text-gray-800">No upcoming payments</p>
              )}
            </div>
            <div className="p-2 bg-amber-50 rounded-md text-amber-600">
              <Clock className="h-6 w-6" />
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default SummaryCards;
