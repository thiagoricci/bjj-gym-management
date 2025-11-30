import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Building2, MapPin, Globe, Save, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { getLocalTimezone } from "@/lib/date";

const settingsSchema = z.object({
  name: z.string().min(2, "Academy name must be at least 2 characters"),
  logo_url: z.string().optional(),
  address: z.string().optional(),
  timezone: z.string().min(1, "Timezone is required"),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// Common timezones list
const timezones = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Anchorage",
  "America/Honolulu",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Dubai",
  "Australia/Sydney",
  "Pacific/Auckland",
  "America/Sao_Paulo",
];

export default function Settings() {
  const { organization, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: "",
      logo_url: "",
      address: "",
      timezone: "UTC",
    },
  });

  useEffect(() => {
    if (organization) {
      form.reset({
        name: organization.name,
        logo_url: organization.logo_url || "",
        address: organization.address || "",
        timezone: organization.timezone || "UTC",
      });
    }
  }, [organization, form]);

  const onSubmit = async (data: SettingsFormValues) => {
    if (!organization) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({
          name: data.name,
          logo_url: data.logo_url || null,
          address: data.address || null,
          timezone: data.timezone,
        })
        .eq("id", organization.id);

      if (error) throw error;

      await refreshProfile();
      toast.success("Settings updated successfully");
    } catch (error: any) {
      console.error("Error updating settings:", error);
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  const handleDetectTimezone = () => {
    const localTz = getLocalTimezone();
    form.setValue("timezone", localTz);
    toast.info(`Detected timezone: ${localTz}`);
  };

  if (!organization) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Academy Settings</h1>
        <p className="text-muted-foreground">
          Manage your academy's profile and preferences.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>General Information</CardTitle>
          <CardDescription>
            Update your academy's public information and location settings.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academy Name</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="Gracie Barra Downtown" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="logo_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a direct link to your academy's logo image.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Input placeholder="123 Main St, City, State" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Timezone</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="flex-1 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                            <SelectContent>
                              {timezones.map((tz) => (
                                <SelectItem key={tz} value={tz}>
                                  {tz}
                                </SelectItem>
                              ))}
                              {!timezones.includes(field.value) && field.value && (
                                <SelectItem value={field.value}>
                                  {field.value}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                        </div>
                      </FormControl>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleDetectTimezone}
                      >
                        Detect
                      </Button>
                    </div>
                    <FormDescription>
                      This will be used to display dates and times correctly for your
                      location.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end">
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    "Saving..."
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>


      <Card>
        <CardHeader>
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Manage your payment integration.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-green-500/50 p-4">
            <div>
              <h3 className="font-semibold text-green-600">
                Payment System Active
              </h3>
              <p className="text-sm text-muted-foreground">
                Your academy is ready to accept payments through Stripe.
              </p>
            </div>
            <CreditCard className="h-6 w-6 text-green-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}