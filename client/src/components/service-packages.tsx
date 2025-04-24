
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { cn, getCategoryColorClass, getCategoryIcon } from '@/lib/utils';
import * as LucideIcons from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { Button } from './ui/button';
import { PlusCircle, ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Badge } from './ui/badge';

interface ServicePlan {
  id: string;
  name: string;
  price: number;
}

interface Service {
  id: number;
  name: string;
  category: string;
  averagePrice: number;
  icon: string;
  plans?: ServicePlan[];
}

const DEFAULT_PLANS: Record<string, ServicePlan[]> = {
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

const ServicePackages: React.FC = () => {
  const [selectedPlans, setSelectedPlans] = useState<string[]>([]);
  
  const { data: services = [], isLoading } = useQuery<Service[]>({
    queryKey: ['/api/services'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Get just a few popular services to display in sidebar
  const popularServices = React.useMemo(() => {
    return services.slice(0, 4).map(service => ({
      ...service,
      plans: DEFAULT_PLANS[service.name] || [
        { id: `${service.name.toLowerCase()}-default`, name: 'Standard', price: service.averagePrice }
      ]
    }));
  }, [services]);

  const togglePlan = (planId: string) => {
    setSelectedPlans(prev => 
      prev.includes(planId) 
        ? prev.filter(id => id !== planId) 
        : [...prev, planId]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center space-x-2">
            <Skeleton className="h-8 w-8 rounded" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-2 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return <p className="text-sm text-gray-500">No services available.</p>;
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Popular Services</h3>
        {selectedPlans.length > 0 && (
          <Badge variant="outline" className="text-xs">
            {selectedPlans.length} selected
          </Badge>
        )}
      </div>
      
      {popularServices.map((service) => {
        const { bgLight, textDark } = getCategoryColorClass(service.category);
        const IconComponent = LucideIcons[getCategoryIcon(service.category) as keyof typeof LucideIcons] || LucideIcons.Package;
        
        return (
          <div key={service.id} className="flex items-center space-x-2">
            <div className={cn("flex-shrink-0 h-8 w-8 rounded flex items-center justify-center", bgLight, textDark)}>
              <IconComponent className="h-4 w-4" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-medium text-gray-700">{service.name}</p>
              <div className="flex items-center">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center text-xs text-gray-500 hover:text-gray-700">
                      Plans <ChevronDown className="h-3 w-3 ml-1" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-48">
                    {service.plans?.map(plan => (
                      <DropdownMenuItem 
                        key={plan.id}
                        onClick={() => togglePlan(plan.id)}
                        className="flex items-center justify-between"
                      >
                        <span>{plan.name}</span>
                        <div className="flex items-center">
                          <span className="text-xs mr-2">${plan.price.toFixed(2)}/mo</span>
                          {selectedPlans.includes(plan.id) && (
                            <Check className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            <button 
              onClick={() => togglePlan(service.plans?.[0]?.id || '')}
              className="text-blue-500 hover:text-blue-600"
            >
              <PlusCircle className="h-4 w-4" />
            </button>
          </div>
        );
      })}
      
      <div className="grid grid-cols-2 gap-2 mt-2">
        <Link href="/services">
          <Button variant="outline" size="sm" className="w-full text-xs">
            Browse All
          </Button>
        </Link>
        <Link href="/add-custom-service">
          <Button variant="outline" size="sm" className="w-full text-xs">
            Create Custom
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ServicePackages;
