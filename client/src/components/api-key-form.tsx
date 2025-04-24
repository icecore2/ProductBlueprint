import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { queryClient } from "@/lib/queryClient";

// Form schema
const apiKeySchema = z.object({
  service: z.string().min(1, "Service is required"),
  apiKey: z.string().min(1, "API key is required"),
  enabled: z.boolean().optional(),
});

type ApiKeyFormData = z.infer<typeof apiKeySchema>;

// Services that require API keys
const NOTIFICATION_SERVICES = [
  { id: "pushbullet", name: "Pushbullet" },
  { id: "pushover", name: "Pushover" },
  // Add other services as they become available
];

interface ApiKeyFormProps {
  onSaved?: () => void;
}

export function ApiKeyForm({ onSaved }: ApiKeyFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>(undefined);

  const form = useForm<ApiKeyFormData>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      service: "",
      apiKey: "",
      enabled: true,
    }
  });

  const onSubmit = async (data: ApiKeyFormData) => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/settings/apikeys', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save API key');
      }

      toast({
        title: "API Key Saved",
        description: `Your ${data.service} API key has been saved successfully.`,
      });

      // Reset form
      form.reset();
      setSelectedService(undefined);

      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/settings/apikeys'] });

      // Call onSaved callback if provided
      if (onSaved) onSaved();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save API key",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Add API Key</CardTitle>
        <CardDescription>
          Configure API keys for notification services.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="service"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service</FormLabel>
                  <Select 
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedService(value);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a service" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {NOTIFICATION_SERVICES.map((service) => (
                        <SelectItem key={service.id} value={service.id}>
                          {service.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {selectedService && (
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={`Enter your ${
                          NOTIFICATION_SERVICES.find(s => s.id === selectedService)?.name
                        } API key`}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {selectedService && (
              <div className="pt-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Saving..." : "Save API Key"}
                </Button>
              </div>
            )}
          </form>
        </Form>
      </CardContent>
      <CardFooter className="text-sm text-muted-foreground">
        {selectedService === "pushbullet" && (
          <p>
            You can find your Pushbullet API key in your account settings at{" "}
            <a 
              href="https://www.pushbullet.com/#settings"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              pushbullet.com
            </a>
          </p>
        )}
        {selectedService === "pushover" && (
          <p>
            Enter your Pushover API token and user key in the format: <strong>token:userkey</strong>.
            You can find these in your account dashboard at{" "}
            <a 
              href="https://pushover.net/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              pushover.net
            </a>
          </p>
        )}
      </CardFooter>
    </Card>
  );
}