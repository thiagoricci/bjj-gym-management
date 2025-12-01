import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

export function usePlatformSubscription() {
  const { organization } = useAuth();

  return useQuery({
    queryKey: ["platform-subscription", organization?.id],
    queryFn: async () => {
      if (!organization?.id) return null;
      const { data, error } = await supabase
        .from("platform_subscriptions")
        .select("*")
        .eq("organization_id", organization.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!organization?.id,
  });
}