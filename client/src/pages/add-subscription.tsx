import React, { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import SubscriptionForm from '@/components/subscription-form';
import type { SubscriptionFormData } from '@/lib/types';
import { apiRequest } from '@/lib/queryClient';
import { Skeleton } from '@/components/ui/skeleton';

const AddSubscription: React.FC = () => {
  const [location, navigate] = useLocation();
  const { toast } = useToast();
  const { addSubscription, updateSubscription } = useSubscriptions();
  const [isLoading, setIsLoading] = useState(false);
  const [initialValues, setInitialValues] = useState<SubscriptionFormData | undefined>(undefined);

  // Parse the subscription ID from the URL
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const subscriptionId = searchParams.get('id');
  const isEditing = !!subscriptionId;

  // Fetch subscription data if editing
  useEffect(() => {
    if (subscriptionId) {
      setIsLoading(true);
      apiRequest(`/api/subscriptions/${subscriptionId}`)
        .then(data => {
          setInitialValues({
            name: data.name,
            category: data.category,
            amount: data.amount,
            dueDate: new Date(data.dueDate),
            billingCycle: data.billingCycle,
            description: data.description || '',
          });
          setIsLoading(false);
        })
        .catch(error => {
          toast({
            title: 'Error',
            description: 'Failed to fetch subscription details.',
            variant: 'destructive',
          });
          navigate('/');
          setIsLoading(false);
        });
    }
  }, [subscriptionId, toast, navigate]);

  const handleSubmit = (data: SubscriptionFormData) => {
    if (isEditing && subscriptionId) {
      // Update existing subscription
      updateSubscription.mutate({ id: parseInt(subscriptionId), data }, {
        onSuccess: () => {
          toast({
            title: 'Subscription updated',
            description: 'Your subscription has been updated successfully.',
          });
          navigate('/');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to update subscription.',
            variant: 'destructive',
          });
        },
      });
    } else {
      // Add new subscription
      addSubscription.mutate(data, {
        onSuccess: () => {
          toast({
            title: 'Subscription added',
            description: 'Your subscription has been added successfully.',
          });
          navigate('/');
        },
        onError: (error) => {
          toast({
            title: 'Error',
            description: error.message || 'Failed to add subscription.',
            variant: 'destructive',
          });
        },
      });
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">
        {isEditing ? 'Edit Subscription' : 'Add Subscription'}
      </h1>

      {isEditing && isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      ) : (
        <SubscriptionForm 
          onSubmit={handleSubmit}
          initialValues={initialValues}
          isSubmitting={isEditing ? updateSubscription.isPending : addSubscription.isPending}
        />
      )}
    </div>
  );
};

export default AddSubscription;