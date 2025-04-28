import React from 'react';
import { useLocation, useRoute } from 'wouter';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
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
import SubscriptionForm from '@/components/subscription-form';
import type { SubscriptionFormData } from '@/lib/types';

const ServicesPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/services/:serviceId?');
  const serviceId = params?.serviceId;
  const [location] = useLocation();
  const searchParams = new URLSearchParams(location.split('?')[1] || '');
  const planName = searchParams.get('plan');
  const planPrice = searchParams.get('price') ? parseFloat(searchParams.get('price')!) : null;

  const { 
    services: { data: servicesData, isLoading }, 
    addSubscription 
  } = useSubscriptions();

  // Use DEFAULT_SERVICES if API call doesn't return data
  const services = servicesData.length > 0 ? servicesData : DEFAULT_SERVICES;

  // Find selected service if serviceId is provided
  const selectedService = serviceId ? 
    services.find(service => 'id' in service && service.id.toString() === serviceId) : 
    null;

  const handleAddService = (service: any) => {
    navigate(`/services/${service.id}${service.planName ? `?plan=${encodeURIComponent(service.planName)}&price=${service.averagePrice}` : ''}`);
  };

  const handleSubmit = (data: SubscriptionFormData) => {
    addSubscription.mutate(data, {
      onSuccess: () => {
        navigate('/');
      }
    });
  };

  // For defining service plans
  const DEFAULT_PLANS: Record<string, { id: string; name: string; price: number }[]> = {
    'Netflix': [
      { id: 'netflix-basic', name: 'Basic', price: 9.99 },
      { id: 'netflix-standard', name: 'Standard', price: 14.99 },
      { id: 'netflix-premium', name: 'Premium', price: 19.99 }
    ],
    'Spotify': [
      { id: 'spotify-individual', name: 'Individual', price: 9.99 },
      { id: 'spotify-duo', name: 'Duo', price: 12.99 },
      { id: 'spotify-family', name: 'Family', price: 15.99 }
    ],
    'Disney+': [
      { id: 'disney-monthly', name: 'Monthly', price: 7.99 },
      { id: 'disney-annual', name: 'Annual', price: 79.99/12 },
      { id: 'disney-bundle', name: 'Disney Bundle', price: 13.99 }
    ],
    'Amazon Prime': [
      { id: 'prime-monthly', name: 'Monthly', price: 12.99 },
      { id: 'prime-annual', name: 'Annual', price: 119/12 }
    ]
  };

  // Service listing - card rendering with plans dropdown
  const renderServiceCard = (service: any) => {
    const { bgLight, textDark } = getCategoryColorClass(service.category);
    const iconName = service.icon || getCategoryIcon(service.category);
    const id = 'id' in service ? service.id : 0;

    // Get plans for this service or use a default plan
    const servicePlans = DEFAULT_PLANS[service.name] || [
      { id: `${service.name.toLowerCase()}-default`, name: 'Standard', price: service.averagePrice }
    ];

    return (
      <Card key={id} className="overflow-hidden border border-gray-100">
        <div className="p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className={`flex-shrink-0 h-12 w-12 rounded ${bgLight} flex items-center justify-center ${textDark}`}>
              {React.createElement(
                LucideIcons[iconName as keyof typeof LucideIcons] || LucideIcons.Package, 
                { className: "h-6 w-6" }
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{service.name}</h3>
              <p className="text-sm text-gray-500">{service.category}</p>
            </div>
          </div>

          {servicePlans.length > 1 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-700 mb-1">Available Plans:</p>
              <div className="space-y-1">
                {servicePlans.map(plan => (
                  <div key={plan.id} className="flex justify-between items-center text-sm">
                    <span>{plan.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs">{formatCurrency(plan.price)}/mo</span>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-6 px-2 text-xs"
                        onClick={() => handleAddService({...service, averagePrice: plan.price, planName: plan.name})}
                      >
                        Select
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
            <div className="text-lg font-medium">
              {formatCurrency(service.averagePrice)}
              <span className="text-sm text-gray-500"> /month</span>
            </div>
            <div className="flex space-x-2">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => navigate(`/edit-service/${service.id}`)}
              >
                Edit
              </Button>
              <Button 
                size="sm"
                onClick={() => handleAddService(service)}
              >
                Add
              </Button>
            </div>
          </div>
        </div>
      </Card>
    );
  };

  return (
    <div className="flex flex-col space-y-6">
      {!serviceId ? (
        // Browse Services View
        <>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-display font-bold text-gray-800">Browse Services</h1>
              <p className="mt-1 text-sm text-gray-500">
                Select from popular subscription services to quickly add to your dashboard.
              </p>
            </div>
            <Button onClick={() => navigate('/add-custom-service')} className="gap-2 sm:self-start">
              <LucideIcons.Plus className="h-4 w-4" />
              Custom Service
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, index) => (
                <Card key={`skeleton-${index}`} className="overflow-hidden border border-gray-100">
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-12 w-12 rounded" />
                      <div>
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20 mt-1" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-9 w-16 rounded" />
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              services.map(renderServiceCard)
            )}
          </div>
        </>
      ) : (
        // Add Subscription Form View
        <Card className="border border-gray-100">
          <CardHeader className="border-b">
            <div className="flex items-center">
              <Button 
                variant="ghost"
                size="sm" 
                onClick={() => navigate('/services')}
                className="mr-2 h-8 w-8 p-0"
              >
                <LucideIcons.ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle>Add {selectedService?.name} Subscription</CardTitle>
                <CardDescription>
                  Fill in the details for your new subscription
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <SubscriptionForm 
              onSubmit={handleSubmit}
              initialValues={selectedService ? {
                name: selectedService.name + (planName ? ` (${planName})` : ''),
                category: selectedService.category,
                amount: planPrice || selectedService.averagePrice,
                dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
                billingCycle: 'monthly',
                description: `Subscription imported from service library${planName ? ` with ${planName} plan` : ''}.`,
              } : undefined}
              isSubmitting={addSubscription.isPending}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ServicesPage;