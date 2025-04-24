
import React from 'react';
import { useLocation } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import * as LucideIcons from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

// Schema for creating custom services
const customServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  category: z.string().min(1, 'Category is required'),
  averagePrice: z.number().positive('Price must be greater than 0'),
  icon: z.string().min(1, 'Icon is required'),
});

type CustomServiceFormValues = z.infer<typeof customServiceSchema>;

const AddCustomService: React.FC = () => {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Create custom service mutation
  const createServiceMutation = useMutation({
    mutationFn: (data: CustomServiceFormValues) => apiRequest('/api/services/custom', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: 'Service created', description: 'Your custom service was created successfully.' });
      navigate('/services');
    },
    onError: (error) => {
      toast({
        title: 'Failed to create service',
        description: error.message || 'An error occurred while creating the service.',
        variant: 'destructive',
      });
    },
  });

  // Form for adding custom service
  const form = useForm<CustomServiceFormValues>({
    resolver: zodResolver(customServiceSchema),
    defaultValues: {
      name: '',
      category: '',
      averagePrice: 9.99,
      icon: 'Package',
    },
  });

  // Handle form submission
  const onSubmit = (data: CustomServiceFormValues) => {
    createServiceMutation.mutate(data);
  };

  // Get available icons from Lucide - limit to common ones
  const commonIcons = [
    'Package', 'CreditCard', 'ShoppingBag', 'Music', 'Film', 'Tv', 'Monitor', 
    'BookOpen', 'Briefcase', 'Car', 'Plane', 'Globe', 'Heart', 'Home',
    'Coffee', 'Food', 'Gamepad2', 'CloudRain', 'Settings', 'Smartphone', 'Headphones'
  ];
  
  return (
    <Card className="border border-gray-100">
      <CardHeader className="border-b">
        <div className="flex items-start gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/services')}
            className="mt-0.5 h-8 w-8 p-0 flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Add Custom Service</CardTitle>
            <p className="mt-1 text-sm text-gray-500">
              Create your own custom subscription service
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter service name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category: any) => (
                          <SelectItem key={category.name} value={category.name}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <FormField
                control={form.control}
                name="averagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Monthly Price</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0.01"
                          className="pl-8"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value))}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="icon"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Icon</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="h-60">
                        {commonIcons.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            <div className="flex items-center gap-2">
                              {React.createElement(
                                LucideIcons[icon as keyof typeof LucideIcons] || LucideIcons.Package, 
                                { className: "h-4 w-4" }
                              )}
                              <span>{icon}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="submit"
                disabled={createServiceMutation.isPending}
              >
                {createServiceMutation.isPending ? 'Creating...' : 'Create Service'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default AddCustomService;
