import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, XCircle } from "lucide-react";

interface FailedPayment {
  id: number;
  student_id: number;
  amount: number;
  date: string;
  failure_reason: string | null;
  students: { name: string } | null;
}

export default function FailedPayments() {
  const { organization } = useAuth();
  const navigate = useNavigate();

  const { data: failedPayments } = useQuery({
    queryKey: ["failed-payments", organization?.id],
    enabled: !!organization?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("id, student_id, amount, date, failure_reason, students(name)")
        .eq("organization_id", organization!.id)
        .eq("status", "failed")
        .order("date", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data as unknown as FailedPayment[];
    },
  });

  if (!failedPayments || failedPayments.length === 0) return null;

  return (
    <Card className="border-red-200 bg-red-50/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          Failed Payments ({failedPayments.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {failedPayments.map((payment) => (
            <div
              key={payment.id}
              className="flex items-center justify-between rounded-lg border border-red-200 bg-white p-4 transition-all hover:border-red-400 hover:shadow-md cursor-pointer"
              onClick={() => navigate(`/student/${payment.student_id}`)}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-600">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {payment.students?.name || "Unknown Student"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(payment.date, organization?.timezone)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {payment.failure_reason && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger>
                        <span className="hidden sm:block text-xs text-muted-foreground max-w-[180px] truncate cursor-help">
                          {payment.failure_reason}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">{payment.failure_reason}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
                <Badge variant="destructive">
                  ${Number(payment.amount).toFixed(2)}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
