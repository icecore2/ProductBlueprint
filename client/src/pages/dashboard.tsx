import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import SubscriptionTable from '@/components/subscription-table';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { SubscriptionFormData } from '@/lib/types';

const Dashboard: React.FC = () => {
  const [, navigate] = useLocation();
  const { subscriptions, summary, addSubscription, deleteSubscription } = useSubscriptions();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [subscriptionToDelete, setSubscriptionToDelete] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const handleAddSubscription = (data: SubscriptionFormData) => {
    addSubscription.mutate(data);
  };

  const handleEdit = (id: number) => {
    navigate(`/add-subscription?id=${id}`);
  };

  const handleDelete = (id: number) => {
    setSubscriptionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (subscriptionToDelete !== null) {
      deleteSubscription.mutate(subscriptionToDelete);
      setIsDeleteDialogOpen(false);
      setSubscriptionToDelete(null);
    }
  };
  
  return (
    <div className="space-y-6">
      {/* Dashboard Header with Summary Stats */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-800">Dashboard</h1>
            <p className="mt-1 text-sm text-gray-500">Keep track of all your subscriptions in one place.</p>
          </div>
          <Button asChild className="mt-4 sm:mt-0">
            <Link href="/services">
              <Plus className="-ml-1 mr-2 h-5 w-5" />
              Add Subscription
            </Link>
          </Button>
        </div>

        {/* Summary Stats in Smaller Cards */}
        <div className="grid grid-cols-3 gap-4">
          {/* Monthly Spending */}
          <Card className="border border-gray-100">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Monthly</p>
                {summary.isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-800">
                    {summary.data?.monthlySpending 
                      ? formatCurrency(summary.data.monthlySpending) 
                      : '$0.00'}
                  </p>
                )}
              </div>
              <div className="p-2 bg-primary-50 rounded-md text-primary-600">
                <DollarSign className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Active Subscriptions */}
          <Card className="border border-gray-100">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Active</p>
                {summary.isLoading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-xl font-bold text-gray-800">
                    {summary.data?.activeCount || 0}
                  </p>
                )}
              </div>
              <div className="p-2 bg-green-50 rounded-md text-green-600">
                <CheckCircle className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>

          {/* Next Due */}
          <Card className="border border-gray-100">
            <CardContent className="p-4 flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Next Due</p>
                {summary.isLoading ? (
                  <Skeleton className="h-7 w-20 mt-1" />
                ) : summary.data?.nextDue ? (
                  <p className="text-xl font-bold text-gray-800 flex flex-col">
                    <span>{formatDate(summary.data.nextDue.date)}</span>
                    <span className="text-xs font-normal text-gray-500 mt-1">
                      {summary.data.nextDue.service}
                    </span>
                  </p>
                ) : (
                  <p className="text-md font-medium text-gray-700">None</p>
                )}
              </div>
              <div className="p-2 bg-amber-50 rounded-md text-amber-600">
                <Clock className="h-5 w-5" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Your Subscriptions</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <SubscriptionTable 
            subscriptions={subscriptions.data}
            isLoading={subscriptions.isLoading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Subscription</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={deleteSubscription.isPending}>
              {deleteSubscription.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
