import React from 'react';
import { useLocation } from 'wouter';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  formatCurrency, 
  getCategoryIcon, 
  getCategoryColorClass 
} from '@/lib/utils';
import { useSubscriptions } from '@/hooks/use-subscriptions';
import { DEFAULT_SERVICES } from '@/lib/constants';
import * as LucideIcons from 'lucide-react';
import type { SubscriptionFormData } from '@/lib/types';

const BrowseServices: React.FC = () => {
  const [, navigate] = useLocation();
  const { 
    services: { data: servicesData, isLoading }, 
    addSubscription 
  } = useSubscriptions();
  
  // Use DEFAULT_SERVICES if API call doesn't return data
  const services = servicesData.length > 0 ? servicesData : DEFAULT_SERVICES;

  const handleAddService = (service: any) => {
    const subscriptionData: SubscriptionFormData = {
      name: service.name,
      category: service.category,
      amount: service.averagePrice,
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      billingCycle: 'monthly',
      description: `Subscription imported from service library.`,
    };

    addSubscription.mutate(subscriptionData, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };

  return (
    <>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-display font-bold text-gray-800">Browse Services</h1>
            <p className="mt-1 text-sm text-gray-500">
              Select from popular subscription services to quickly add to your dashboard.
            </p>
          </div>
          <Button onClick={() => navigate('/add-custom-service')} className="gap-2">
            <LucideIcons.Plus className="h-4 w-4" />
            Custom Service
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            // Loading skeleton
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={`skeleton-${index}`} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded" />
                    <Skeleton className="h-6 w-40" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-6 w-20" />
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Skeleton className="h-10 w-full rounded" />
                </CardFooter>
              </Card>
            ))
          ) : (
            services.map((service) => {
              const { bgLight, textDark } = getCategoryColorClass(service.category);
              const IconComponent = LucideIcons[service.icon as keyof typeof LucideIcons] || 
                                   LucideIcons[getCategoryIcon(service.category) as keyof typeof LucideIcons];
              
              return (
                <Card key={service.name} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className={`flex-shrink-0 h-12 w-12 rounded ${bgLight} flex items-center justify-center ${textDark}`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <CardTitle className="text-lg">{service.name}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-500 mb-1">Category: {service.category}</p>
                    <p className="text-lg font-medium">
                      {formatCurrency(service.averagePrice)}<span className="text-sm text-gray-500"> /month</span>
                    </p>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button 
                      className="w-full" 
                      onClick={() => handleAddService(service)}
                      disabled={addSubscription.isPending}
                    >
                      {addSubscription.isPending ? "Adding..." : "Add to My Subscriptions"}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

export default BrowseServices;
