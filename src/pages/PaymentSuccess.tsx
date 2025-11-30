import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshProfile } = useAuth(); // To potentially refresh user context if needed
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const [message, setMessage] = useState("Verifying payment...");

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");

      if (!sessionId) {
        setStatus("error");
        setMessage("Missing session ID.");
        return;
      }

      try {
        // Call the new Supabase Edge Function to verify the payment and update the student
        // This function will be created next
        const { data: { session } } = await supabase.auth.getSession();
        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment-and-update-student`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${session?.access_token}`, // Pass the user's session token
            },
            body: JSON.stringify({ sessionId }),
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to verify payment.");
        }

        const result = await response.json();
        if (result.success) {
          setStatus("success");
          setMessage(result.message || "Payment confirmed and student activated successfully!");
          // Optionally refresh any cached student data here if needed globally
          // For now, we rely on the student detail page to refetch data when navigated to
        } else {
          setStatus("error");
          setMessage(result.message || "Payment verification failed.");
        }
      } catch (error: any) {
        console.error("Payment verification error:", error);
        setStatus("error");
        setMessage(error.message || "An unexpected error occurred during payment verification.");
      }
    };

    verifyPayment();
  }, [searchParams]);

  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  const handleGoToStudent = () => {
    // We could pass the student ID if we stored it before the checkout, but for now, go to the main student list
    navigate("/students");
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl">
            {status === "success" ? (
              <>
                <CheckCircle className="h-8 w-8 text-green-50" />
                Success
              </>
            ) : status === "error" ? (
              <>
                <XCircle className="h-8 w-8 text-destructive" />
                Error
              </>
            ) : (
              "Processing..."
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          {status === "success" && (
            <div className="pt-4 flex flex-col gap-2">
              <Button onClick={handleGoToStudent}>
                View Students
              </Button>
              <Button variant="outline" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
            </div>
          )}
          {status === "error" && (
            <div className="pt-4">
              <Button variant="outline" onClick={handleGoToDashboard}>
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}