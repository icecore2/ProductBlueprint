import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2 } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

// API Key type
interface ApiKey {
  id: number;
  service: string;
  apiKey: string;
  enabled: boolean;
  createdAt: string;
}

export function ApiKeyList() {
  const { toast } = useToast();
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch API keys
  const { data: apiKeys, isLoading, error } = useQuery<ApiKey[]>({
    queryKey: ['/api/settings/apikeys'],
    refetchOnWindowFocus: false,
  });

  // Delete API key mutation
  const deleteApiKeyMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/settings/apikeys/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete API key');
      }
      
      return id;
    },
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['/api/settings/apikeys'] });
      
      toast({
        title: "API Key Deleted",
        description: "The API key has been successfully deleted.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete API key",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClick = (id: number) => {
    setDeleteId(id);
    setIsDialogOpen(true);
  };

  const confirmDelete = () => {
    if (deleteId !== null) {
      deleteApiKeyMutation.mutate(deleteId);
      setIsDialogOpen(false);
      setDeleteId(null);
    }
  };

  // Function to get service display name
  const getServiceDisplayName = (serviceId: string) => {
    const services: Record<string, string> = {
      'pushbullet': 'Pushbullet',
      'pushover': 'Pushover',
      // Add more as needed
    };
    return services[serviceId] || serviceId;
  };

  // Handle testing notification channel
  const testNotification = async (channel: string) => {
    try {
      const response = await fetch(`/api/notifications/test/${channel}`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `Failed to test ${channel} notification`);
      }
      
      toast({
        title: "Test Notification Sent",
        description: `A test notification has been sent via ${getServiceDisplayName(channel)}.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to test ${channel} notification`,
        variant: "destructive",
      });
    }
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-destructive">
            Failed to load API keys: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your API Keys</CardTitle>
        <CardDescription>
          Manage API keys for notification services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : apiKeys && apiKeys.length > 0 ? (
          <Table>
            <TableCaption>Your configured API keys for notification services</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>API Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Added</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {apiKeys.map((apiKey) => (
                <TableRow key={apiKey.id}>
                  <TableCell className="font-medium">
                    {getServiceDisplayName(apiKey.service)}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {apiKey.apiKey}
                  </TableCell>
                  <TableCell>
                    <Badge variant={apiKey.enabled ? "default" : "outline"}>
                      {apiKey.enabled ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {new Date(apiKey.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => testNotification(apiKey.service)}
                    >
                      Test
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteClick(apiKey.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No API keys configured yet. Add one to enable more notification channels.
          </div>
        )}

        <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete this API key and disable the associated notification channel.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete}>
                {deleteApiKeyMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}