import { XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

export default function PaymentCancelled() {
  const navigate = useNavigate();

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
            <XCircle className="h-8 w-8 text-destructive" />
            Payment Cancelled
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">
            Your payment was not completed. The student's membership status has not been changed.
          </p>
          <div className="pt-4 flex flex-col gap-2">
            <Button onClick={handleGoToStudent}>
              View Students
            </Button>
            <Button variant="outline" onClick={handleGoToDashboard}>
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}