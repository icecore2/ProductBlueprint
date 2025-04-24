import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import SubscriptionService from '@/lib/subscription-service';
import type { SubscriptionFormData } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export function useSubscriptions() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const subscriptionsQuery = useQuery({
    queryKey: ['/api/subscriptions'],
    queryFn: SubscriptionService.fetchSubscriptions,
  });

  const summaryQuery = useQuery({
    queryKey: ['/api/subscriptions/summary'],
    queryFn: SubscriptionService.fetchSummary,
  });

  const addSubscription = useMutation({
    mutationFn: (data: SubscriptionFormData) => 
      SubscriptionService.createSubscription({
        name: data.name,
        category: data.category,
        amount: data.amount,
        dueDate: data.dueDate,
        billingCycle: data.billingCycle,
        description: data.description || '',
        active: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/summary'] });
      toast({
        title: 'Subscription added',
        description: 'Your subscription has been added successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to add subscription',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const updateSubscription = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SubscriptionFormData> }) => 
      SubscriptionService.updateSubscription(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/summary'] });
      toast({
        title: 'Subscription updated',
        description: 'Your subscription has been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update subscription',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const deleteSubscription = useMutation({
    mutationFn: (id: number) => SubscriptionService.deleteSubscription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/subscriptions/summary'] });
      toast({
        title: 'Subscription deleted',
        description: 'Your subscription has been deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to delete subscription',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  const categoriesQuery = useQuery({
    queryKey: ['/api/categories'],
    queryFn: SubscriptionService.fetchCategories,
  });

  const servicesQuery = useQuery({
    queryKey: ['/api/services'],
    queryFn: SubscriptionService.fetchServices,
  });

  return {
    subscriptions: {
      data: subscriptionsQuery.data || [],
      isLoading: subscriptionsQuery.isLoading,
      error: subscriptionsQuery.error,
    },
    summary: {
      data: summaryQuery.data,
      isLoading: summaryQuery.isLoading,
      error: summaryQuery.error,
    },
    categories: {
      data: categoriesQuery.data || [],
      isLoading: categoriesQuery.isLoading,
      error: categoriesQuery.error,
    },
    services: {
      data: servicesQuery.data || [],
      isLoading: servicesQuery.isLoading,
      error: servicesQuery.error,
    },
    addSubscription: {
      mutate: addSubscription.mutate,
      isPending: addSubscription.isPending,
      error: addSubscription.error,
    },
    updateSubscription: {
      mutate: updateSubscription.mutate,
      isPending: updateSubscription.isPending,
      error: updateSubscription.error,
    },
    deleteSubscription: {
      mutate: deleteSubscription.mutate,
      isPending: deleteSubscription.isPending,
      error: deleteSubscription.error,
    },
  };
}

export function useNotificationSettings() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const settingsQuery = useQuery({
    queryKey: ['/api/settings/notifications'],
    queryFn: SubscriptionService.fetchNotificationSettings,
  });

  const updateSettings = useMutation({
    mutationFn: (settings: { enabled: boolean; reminderDays: number }) => 
      SubscriptionService.updateNotificationSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings/notifications'] });
      toast({
        title: 'Settings updated',
        description: 'Your notification settings have been updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update settings',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
    },
  });

  return {
    settings: {
      data: settingsQuery.data,
      isLoading: settingsQuery.isLoading,
      error: settingsQuery.error,
    },
    updateSettings: {
      mutate: updateSettings.mutate,
      isPending: updateSettings.isPending,
      error: updateSettings.error,
    },
  };
}
