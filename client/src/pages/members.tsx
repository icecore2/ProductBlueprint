import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreVertical, UserPlus, Trash2, Edit2, Star } from 'lucide-react';

// Schema for creating new household members
const memberFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').nullable().optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Must be a valid hex color').default('#3b82f6'),
  isDefault: z.boolean().default(false),
  notificationEnabled: z.boolean().default(true),
  reminderDays: z.number().int().min(1).max(30).default(7),
});

type MemberFormValues = z.infer<typeof memberFormSchema>;

interface Member {
  id: number;
  name: string;
  email: string | null;
  color: string | null;
  notificationEnabled: boolean | null;
  reminderDays: number | null;
  isDefault: boolean | null;
}

export default function MembersPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentMember, setCurrentMember] = useState<Member | null>(null);

  // Fetch all household members
  const { data: members = [], isLoading } = useQuery<Member[]>({
    queryKey: ['/api/users'],
    staleTime: 10 * 1000, // 10 seconds
  });

  // Add a new household member
  const addMemberMutation = useMutation({
    mutationFn: (data: MemberFormValues) => apiRequest('/api/users', { method: 'POST', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Member added',
        description: 'New household member was added successfully.',
      });
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Failed to add member',
        description: error.message || 'An error occurred while adding the member.',
        variant: 'destructive',
      });
    },
  });

  // Update a household member
  const updateMemberMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MemberFormValues> }) => 
      apiRequest(`/api/users/${id}`, { method: 'PUT', data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Member updated',
        description: 'Household member was updated successfully.',
      });
      setIsEditDialogOpen(false);
      setCurrentMember(null);
    },
    onError: (error) => {
      toast({
        title: 'Failed to update member',
        description: error.message || 'An error occurred while updating the member.',
        variant: 'destructive',
      });
    },
  });

  // Delete a household member
  const deleteMemberMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/users/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Member removed',
        description: 'Household member was removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to remove member',
        description: error.message || 'An error occurred while removing the member.',
        variant: 'destructive',
      });
    },
  });

  // Set a member as default
  const setDefaultMemberMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/users/${id}/set-default`, { method: 'PUT' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      toast({
        title: 'Default member updated',
        description: 'Default household member was updated successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Failed to update default member',
        description: error.message || 'An error occurred while updating the default member.',
        variant: 'destructive',
      });
    },
  });

  // Form for adding new household member
  const addForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: '',
      email: '',
      color: '#3b82f6',
      isDefault: false,
      notificationEnabled: true,
      reminderDays: 7,
    },
  });

  // Form for editing household member
  const editForm = useForm<MemberFormValues>({
    resolver: zodResolver(memberFormSchema),
    defaultValues: {
      name: '',
      email: '',
      color: '#3b82f6',
      isDefault: false,
      notificationEnabled: true,
      reminderDays: 7,
    },
  });

  // Reset and open the edit dialog when editing a member
  const handleEditMember = (member: Member) => {
    setCurrentMember(member);
    editForm.reset({
      name: member.name,
      email: member.email || '',
      color: member.color || '#3b82f6',
      isDefault: member.isDefault === true,
      notificationEnabled: member.notificationEnabled !== false,
      reminderDays: member.reminderDays || 7,
    });
    setIsEditDialogOpen(true);
  };

  // Handle form submission for adding a member
  const onAddSubmit = (data: MemberFormValues) => {
    addMemberMutation.mutate(data);
  };

  // Handle form submission for editing a member
  const onEditSubmit = (data: MemberFormValues) => {
    if (!currentMember) return;
    updateMemberMutation.mutate({ id: currentMember.id, data });
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Household Members</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <UserPlus className="h-4 w-4" />
              Add Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Household Member</DialogTitle>
              <DialogDescription>
                Add a new household member to track their subscriptions separately.
              </DialogDescription>
            </DialogHeader>
            <Form {...addForm}>
              <form onSubmit={addForm.handleSubmit(onAddSubmit)} className="space-y-4">
                <FormField
                  control={addForm.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter email (optional)" 
                          {...field} 
                          value={field.value || ''} 
                        />
                      </FormControl>
                      <FormDescription>
                        Email is used for notifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <div className="flex items-center gap-2">
                        <Input
                          type="color"
                          className="w-12 h-10 p-1"
                          {...field}
                        />
                        <Input
                          type="text"
                          placeholder="#3b82f6"
                          {...field}
                          onChange={(e) => {
                            // Ensure it's a valid hex color
                            if (/^#[0-9A-F]{0,6}$/i.test(e.target.value) || e.target.value === '') {
                              field.onChange(e);
                            }
                          }}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="isDefault"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Default Member</FormLabel>
                        <FormDescription>
                          Set as the default household member.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="notificationEnabled"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Notifications</FormLabel>
                        <FormDescription>
                          Receive notifications for upcoming subscription payments.
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
                <FormField
                  control={addForm.control}
                  name="reminderDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Days</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={30}
                          placeholder="7"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                          value={field.value || 7}
                        />
                      </FormControl>
                      <FormDescription>
                        Days before due date to send reminder notifications.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button
                    type="submit"
                    disabled={addMemberMutation.isPending}
                  >
                    {addMemberMutation.isPending ? 'Adding...' : 'Add Member'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : members.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="text-center space-y-2 my-8">
              <h3 className="text-xl font-semibold">No household members found</h3>
              <p className="text-gray-500">Add your first household member to get started.</p>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="gap-2"
            >
              <UserPlus className="h-4 w-4" />
              Add First Member
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {members.map((member: Member) => (
            <Card key={member.id} className="overflow-hidden">
              <div 
                className="h-2"
                style={{ backgroundColor: member.color || '#3b82f6' }} 
              />
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Avatar 
                    className="h-10 w-10"
                    style={{ 
                      backgroundColor: member.color || '#3b82f6',
                      color: '#ffffff'
                    }}
                  >
                    <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {member.name}
                      {member.isDefault === true && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      )}
                    </CardTitle>
                    <CardDescription>{member.email}</CardDescription>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem onClick={() => handleEditMember(member)}>
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    {member.isDefault !== true && (
                      <DropdownMenuItem onClick={() => setDefaultMemberMutation.mutate(member.id)}>
                        <Star className="mr-2 h-4 w-4" />
                        Set as Default
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-red-600"
                      onClick={() => deleteMemberMutation.mutate(member.id)}
                      disabled={member.isDefault === true}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium">Notifications</Label>
                    <p className="text-sm text-gray-500">
                      {member.notificationEnabled !== false ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium">Reminder Days</Label>
                    <p className="text-sm text-gray-500">
                      {member.reminderDays || 7} days before due date
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Household Member</DialogTitle>
            <DialogDescription>
              Update the household member details.
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <FormField
                control={editForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Enter email (optional)" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
                    <FormDescription>
                      Email is used for notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        className="w-12 h-10 p-1"
                        {...field}
                      />
                      <Input
                        type="text"
                        placeholder="#3b82f6"
                        {...field}
                        onChange={(e) => {
                          // Ensure it's a valid hex color
                          if (/^#[0-9A-F]{0,6}$/i.test(e.target.value) || e.target.value === '') {
                            field.onChange(e);
                          }
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="notificationEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Notifications</FormLabel>
                      <FormDescription>
                        Receive notifications for upcoming subscription payments.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              <FormField
                control={editForm.control}
                name="reminderDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reminder Days</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        max={30}
                        placeholder="7"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 7)}
                        value={field.value || 7}
                      />
                    </FormControl>
                    <FormDescription>
                      Days before due date to send reminder notifications.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button
                  type="submit"
                  disabled={updateMemberMutation.isPending}
                >
                  {updateMemberMutation.isPending ? 'Saving...' : 'Save Changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}