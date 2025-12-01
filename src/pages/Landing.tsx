import { Button } from "@/components/ui/button";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Landing() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      // Call the function without organizationId (anonymous flow)
      const { data, error } = await supabase.functions.invoke(
        "create-platform-checkout-session",
        {
          body: { isAnonymous: true },
        }
      );

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error("Error creating checkout session:", error);
      toast.error(error.message || "Failed to start subscription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b p-4 flex justify-between items-center container mx-auto">
        <h1 className="text-2xl font-bold">Jiu-Jitsu Manager</h1>
        <Button variant="ghost" onClick={() => navigate("/login")}>
          Login
        </Button>
      </header>

      <main className="flex-1 container mx-auto px-4 py-16 flex flex-col items-center text-center">
        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6">
          Manage Your Academy <br className="hidden md:block" /> Like a Black Belt
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mb-12">
          The all-in-one solution for student management, attendance tracking, and payments.
          Focus on teaching, we'll handle the rest.
        </p>

        <div className="w-full max-w-md border rounded-xl p-8 shadow-lg bg-card">
          <div className="mb-6">
            <h3 className="text-2xl font-bold">Standard Plan</h3>
            <p className="text-muted-foreground">Everything you need to grow.</p>
          </div>
          
          <div className="flex items-baseline justify-center gap-1 mb-8">
            <span className="text-5xl font-bold">$29</span>
            <span className="text-muted-foreground">/month</span>
          </div>

          <ul className="space-y-4 mb-8 text-left">
            {[
              "Unlimited Students",
              "Attendance Tracking",
              "Belt Promotions",
              "Financial Reports",
              "Stripe Integration",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <div className="h-6 w-6 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center shrink-0">
                  <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <span>{feature}</span>
              </li>
            ))}
          </ul>

          <Button 
            size="lg" 
            className="w-full text-lg h-12" 
            onClick={handleSubscribe}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : (
              "Start Your Subscription"
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-4">
            Secure payment via Stripe. Cancel anytime.
          </p>
        </div>
      </main>
    </div>
  );
}