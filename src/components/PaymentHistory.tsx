import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, CheckCircle2, XCircle, HelpCircle, Clock } from "lucide-react";

interface Payment {
  id: number;
  student_id: number | null;
  organization_id: string;
  amount: number;
  date: string;
  status: string;
  failure_reason: string | null;
  created_at: string | null;
}

interface PaymentHistoryProps {
  studentId: string;
}

function StatusBadge({ status, failureReason }: { status: string; failureReason?: string | null }) {
  switch (status) {
    case "paid":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Paid
        </Badge>
      );
    case "scheduled":
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
          <Clock className="h-3 w-3 mr-1" />
          Scheduled
        </Badge>
      );
    case "failed":
      if (failureReason) {
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="destructive" className="cursor-help">
                  <XCircle className="h-3 w-3 mr-1" />
                  Failed
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p className="max-w-xs">{failureReason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      }
      return (
        <Badge variant="destructive">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <HelpCircle className="h-3 w-3 mr-1" />
          <span className="capitalize">{status}</span>
        </Badge>
      );
  }
}

export default function PaymentHistory({ studentId }: PaymentHistoryProps) {
  const { organization } = useAuth();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["student-payments", studentId, organization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select("*")
        .eq("student_id", studentId)
        .eq("organization_id", organization.id)
        .order("date", { ascending: false });

      if (error) throw error;
      return data as unknown as Payment[];
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading payment history...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          Payment History
        </CardTitle>
      </CardHeader>
      <CardContent>
        {payments && payments.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id} className={payment.status === "failed" ? "bg-red-50/50" : ""}>
                  <TableCell>
                    {formatDate(payment.date, organization?.timezone)}
                  </TableCell>
                  <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} failureReason={payment.failure_reason} />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {payment.failure_reason && (
                      <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                        {payment.failure_reason}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">No payment history found.</p>
        )}
      </CardContent>
    </Card>
  );
}
