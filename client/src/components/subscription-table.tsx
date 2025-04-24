import React, { useState } from 'react';
import { Link } from 'wouter';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  formatCurrency, 
  formatDate, 
  formatTimeRemaining, 
  getSubscriptionStatusClass,
  getCategoryIcon,
  getCategoryColorClass
} from '@/lib/utils';
import type { Subscription } from '@shared/schema';
import { Pencil, Trash2, Filter, ArrowUpDown } from 'lucide-react';
import * as LucideIcons from 'lucide-react';

interface SubscriptionTableProps {
  subscriptions: Subscription[];
  isLoading: boolean;
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}

type SortField = 'name' | 'dueDate' | 'amount' | 'category';
type SortDirection = 'asc' | 'desc';

const SubscriptionTable: React.FC<SubscriptionTableProps> = ({
  subscriptions,
  isLoading,
  onEdit,
  onDelete,
}) => {
  const [sortField, setSortField] = useState<SortField>('dueDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedSubscriptions = React.useMemo(() => {
    if (!subscriptions.length) return [];

    return [...subscriptions].sort((a, b) => {
      let valueA, valueB;

      switch (sortField) {
        case 'name':
          valueA = a.name.toLowerCase();
          valueB = b.name.toLowerCase();
          break;
        case 'dueDate':
          valueA = new Date(a.dueDate).getTime();
          valueB = new Date(b.dueDate).getTime();
          break;
        case 'amount':
          valueA = a.amount;
          valueB = b.amount;
          break;
        case 'category':
          valueA = a.category.toLowerCase();
          valueB = b.category.toLowerCase();
          break;
        default:
          return 0;
      }

      if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
      if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [subscriptions, sortField, sortDirection]);

  return (
    <div className="mb-8 w-full max-w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h2 className="text-lg font-semibold">Upcoming Payments</h2>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
            <ArrowUpDown className="h-4 w-4 mr-1" />
            Sort
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 w-full max-w-full">
        <div className="overflow-x-auto w-full">
          <Table className="w-full min-w-max table-auto">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[30%] sm:w-[250px]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('name')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Service
                    {sortField === 'name' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[20%]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('dueDate')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Due Date
                    {sortField === 'dueDate' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[15%]">
                  <Button 
                    variant="ghost" 
                    onClick={() => handleSort('amount')}
                    className="flex items-center text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Amount
                    {sortField === 'amount' && (
                      <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </Button>
                </TableHead>
                <TableHead className="w-[15%]">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </div>
                </TableHead>
                <TableHead className="w-[15%] text-right">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                // Loading state with skeletons
                Array.from({ length: 4 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell>
                      <div className="flex items-center">
                        <Skeleton className="h-10 w-10 rounded" />
                        <div className="ml-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-3 w-16 mt-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-3 w-12 mt-1" />
                    </TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Skeleton className="h-8 w-8 rounded" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : sortedSubscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No subscriptions found. Add your first subscription to get started.
                    <Link href="/services">
                      <Button className="mt-4">Browse Available Services</Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ) : (
                sortedSubscriptions.map((subscription) => {
                  const { bgColor, textColor, label } = getSubscriptionStatusClass(subscription.dueDate);
                  const { bgLight, textDark } = getCategoryColorClass(subscription.category);
                  const IconComponent = LucideIcons[getCategoryIcon(subscription.category) as keyof typeof LucideIcons] || LucideIcons.CreditCard;

                  return (
                    <TableRow key={subscription.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded ${bgLight} flex items-center justify-center ${textDark}`}>
                            <IconComponent className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-800">
                              {subscription.name}
                            </div>
                            <div className="text-sm text-gray-500">
                              {subscription.category}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-800">
                          {formatDate(subscription.dueDate)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTimeRemaining(subscription.dueDate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-800">
                          {formatCurrency(subscription.amount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {subscription.billingCycle}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${bgColor} ${textColor}`}>
                          {label}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(subscription.id)}
                            className="text-primary-600 hover:text-primary-800"
                          >
                            <Pencil className="h-5 w-5" />
                            <span className="sr-only">Edit</span>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(subscription.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                            <span className="sr-only">Delete</span>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
        {!isLoading && sortedSubscriptions.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button variant="outline" size="sm">Previous</Button>
                <Button variant="outline" size="sm">Next</Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">1</span> to{' '}
                    <span className="font-medium">{sortedSubscriptions.length}</span> of{' '}
                    <span className="font-medium">{sortedSubscriptions.length}</span> subscriptions
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button variant="outline" size="sm" className="rounded-l-md">
                      Previous
                    </Button>
                    <Button variant="outline" size="sm" className="rounded-r-md ml-2">
                      Next
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriptionTable;