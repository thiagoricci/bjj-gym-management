import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Lock, Mail, Loader2 } from "lucide-react";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function AccountSettingsCard() {
  const { user, refreshProfile } = useAuth();
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);

  const emailForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email("Invalid email address") })),
    defaultValues: {
      email: user?.email || "",
    },
  });

  const passwordForm = useForm({
    resolver: zodResolver(
      z.object({
        password: z.string().min(6, "Password must be at least 6 characters"),
        confirmPassword: z.string(),
      }).refine((data) => data.password === data.confirmPassword, {
        message: "Passwords do not match",
        path: ["confirmPassword"],
      })
    ),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onUpdateEmail = async (data: { email: string }) => {
    setLoadingEmail(true);
    try {
      const { error } = await supabase.auth.updateUser({ email: data.email });
      if (error) throw error;
      // Keep the display email on the profile in sync for the staff list.
      if (user) {
        await supabase.from("profiles").update({ email: data.email }).eq("id", user.id);
        await refreshProfile(true);
      }
      toast.success("Check your email to confirm the change");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update email");
    } finally {
      setLoadingEmail(false);
    }
  };

  const onUpdatePassword = async (data: { password: string }) => {
    setLoadingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success("Password updated successfully");
      passwordForm.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to update password");
    } finally {
      setLoadingPassword(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Security</CardTitle>
        <CardDescription>
          Update your email address and password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...emailForm}>
          <form onSubmit={emailForm.handleSubmit(onUpdateEmail)} className="space-y-4">
            <FormField
              control={emailForm.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <div className="flex-1 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <Input {...field} type="email" />
                      </div>
                    </FormControl>
                    <Button type="submit" disabled={loadingEmail}>
                      {loadingEmail ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Email"}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">
              Change Password
            </span>
          </div>
        </div>

        <Form {...passwordForm}>
          <form onSubmit={passwordForm.handleSubmit(onUpdatePassword)} className="space-y-4">
            <FormField
              control={passwordForm.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Input {...field} type="password" placeholder="New password" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={passwordForm.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-muted-foreground" />
                      <Input {...field} type="password" placeholder="Confirm new password" />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={loadingPassword}>
                {loadingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
