import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

// Schema for service plans
const planSchema = z.object({
  name: z.string().min(1, 'Plan name is required'),
  price: z.number().positive('Price must be greater than 0'),
  description: z.string().optional(),
});

// Schema for editing services
const editServiceSchema = z.object({
  name: z.string().min(1, 'Service name is required'),
  category: z.string().min(1, 'Category is required'),
  averagePrice: z.number().positive('Price must be greater than 0'),
  icon: z.string().min(1, 'Icon is required'),
  newPlans: z.array(planSchema).optional(),
});

// Define form values type
type EditServiceFormValues = z.infer<typeof editServiceSchema>;

const EditService: React.FC = () => {
  const [, navigate] = useLocation();
  const [, params] = useRoute('/edit-service/:serviceId');
  const serviceId = params?.serviceId;
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showNewPlans, setShowNewPlans] = useState(false);

  // Get categories for the dropdown
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    staleTime: 60 * 1000, // 1 minute
  });

  // Get the service details
  const { data: service, isLoading } = useQuery({
    queryKey: ['/api/services', serviceId],
    queryFn: () => apiRequest(`/api/services/${serviceId}`),
    enabled: !!serviceId,
  });

  // Get existing plans
  const { data: existingPlans = [], isLoading: isLoadingPlans } = useQuery({
    queryKey: ['/api/services', serviceId, 'plans'],
    queryFn: () => apiRequest(`/api/services/${serviceId}/plans`),
    enabled: !!serviceId,
    onError: (error) => {
      console.error("Error fetching service plans:", error);
      toast({
        title: 'Warning',
        description: 'Unable to load existing service plans.',
        variant: 'destructive',
      });
    }
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: (data: EditServiceFormValues) => apiRequest(`/api/services/${serviceId}`, { 
      method: 'PUT', 
      data: {
        name: data.name,
        category: data.category,
        averagePrice: data.averagePrice,
        icon: data.icon
      }
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/services'] });
      toast({ title: 'Service updated', description: 'The service was updated successfully.' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update service',
        description: error.message || 'An error occurred while updating the service.',
        variant: 'destructive',
      });
    },
  });


  // Form for editing service
  const form = useForm<EditServiceFormValues>({
    resolver: zodResolver(editServiceSchema),
    defaultValues: {
      name: '',
      category: '',
      averagePrice: 9.99,
      icon: 'Package',
      newPlans: [],
    },
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        category: service.category,
        averagePrice: service.averagePrice || 9.99,
        icon: service.icon || 'Package',
        newPlans: [], // Reset newPlans to an empty array
      });
    }
  }, [service, form.reset]);

  // Set up the field array for new plans
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "newPlans",
  });

  // Handle form submission
  const onSubmit = async (data: EditServiceFormValues) => {
    try {
      // First update the service details
      await updateServiceMutation.mutateAsync(data);

      // Then update all plans (combining existing and new)
      const updatedPlans = [...existingPlans];
      data.newPlans?.forEach(newPlan => {
          updatedPlans.push({
              name: newPlan.name,
              price: newPlan.price,
              description: newPlan.description || ''
          });
      });

      await fetch(`/api/services/${service?.id}/plans`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plans: updatedPlans })
      });

      toast({
        title: 'Service updated',
        description: 'The service has been updated successfully.',
      });

      navigate('/services');
    } catch (error) {
      console.error("Error updating service:", error);
      toast({
        title: 'Error',
        description: 'Failed to update service.',
        variant: 'destructive',
      });
    }
  };

  // Add a new plan
  const addPlan = () => {
    append({ name: '', price: 9.99, description: '' });
  };

  // Remove an existing plan
  const removePlan = async (planId: number | string) => {
    try {
      // Filter out the plan to remove
      const updatedPlans = existingPlans.filter(plan => plan.id !== planId);

      // Update plans on the server
      const response = await fetch(`/api/services/${service?.id}/plans`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ plans: updatedPlans })
      });

      if (!response.ok) {
        throw new Error('Failed to remove plan');
      }

      // Refresh the plans data
      queryClient.invalidateQueries(['/api/services', serviceId, 'plans']);

      toast({
        title: 'Plan removed',
        description: 'The plan has been removed successfully.',
      });
    } catch (error) {
      console.error("Error removing plan:", error);
      toast({
        title: 'Error',
        description: 'Failed to remove plan.',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle>Loading service...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!service && !isLoading) {
    return (
      <Card className="border border-gray-100">
        <CardHeader>
          <CardTitle>Service not found</CardTitle>
        </CardHeader>
        <CardContent>
          <p>The service you're trying to edit doesn't exist.</p>
          <Button 
            className="mt-4"
            onClick={() => navigate('/services')}
          >
            Back to Services
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-100">
      <CardHeader>
        <div className="flex items-center">
          <Button 
            variant="ghost"
            size="sm" 
            onClick={() => navigate('/services')}
            className="mr-2 h-8 w-8 p-0"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <CardTitle>Edit Service: {service?.name}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Netflix, Spotify, etc." {...field} />
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
                      value={field.value}
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

              <FormField
                control={form.control}
                name="averagePrice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Average Monthly Price</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        {...field} 
                        onChange={e => field.onChange(parseFloat(e.target.value))}
                      />
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {["Package", "Music", "Video", "Film", "Tv", "BookOpen", "Newspaper", "Gamepad2", "ShoppingCart", "Cloud", "Server", "Shield"]
                          .map(icon => (
                            <SelectItem key={icon} value={icon}>
                              <div className="flex items-center gap-2">
                                {React.createElement(
                                  LucideIcons[icon as keyof typeof LucideIcons] || LucideIcons.Package, 
                                  { className: "h-4 w-4 mr-2" }
                                )}
                                {icon}
                              </div>
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Existing Plans Section */}
            <div className="border-t pt-5">
              <h3 className="text-base font-medium mb-4">Existing Plans</h3>
              {isLoadingPlans ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border p-4 rounded-md animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                      <div className="h-3 bg-gray-100 rounded w-1/4 mb-2"></div>
                      <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                    </div>
                  ))}
                </div>
              ) : existingPlans.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {existingPlans.map((plan: any) => (
                    <div key={plan.id} className="border p-4 rounded-md relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => removePlan(plan.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                      <div className="flex justify-between pr-10">
                        <span className="font-medium">{plan.name}</span>
                        <span>${plan.price.toFixed(2)}/month</span>
                      </div>
                      {plan.description && (
                        <p className="text-xs mt-2 text-gray-600">{plan.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 mb-4">No plans found for this service. You can add new plans below.</p>
              )}
            </div>

            {/* New Plans Section */}
            <div className="border-t pt-5">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-medium">Add New Plans</h3>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowNewPlans(!showNewPlans)}
                >
                  {showNewPlans ? 'Hide Plans' : 'Add Plans'}
                </Button>
              </div>

              {showNewPlans && (
                <div className="mt-4 space-y-5">
                  {fields.map((field, index) => (
                    <div key={field.id} className="border p-4 rounded-md relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-8 w-8 p-0"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <FormField
                          control={form.control}
                          name={`newPlans.${index}.name`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Plan Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Basic, Premium, etc." {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name={`newPlans.${index}.price`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Monthly Price</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  step="0.01"
                                  min="0.01"
                                  {...field} 
                                  onChange={e => field.onChange(parseFloat(e.target.value))}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <FormField
                        control={form.control}
                        name={`newPlans.${index}.description`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Brief description of this plan" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addPlan}
                    className="flex items-center gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Plan
                  </Button>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/services')}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={updateServiceMutation.isPending}
              >
                {updateServiceMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

export default EditService;