import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
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
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/date";
import { useAuth } from "@/contexts/AuthContext";
import { DollarSign, CheckCircle2, XCircle, HelpCircle, Clock, Undo2 } from "lucide-react";
import { toast } from "sonner";

interface Payment {
  id: number;
  student_id: number | null;
  organization_id: string;
  amount: number;
  date: string;
  status: string;
  failure_reason: string | null;
  created_at: string | null;
  refunded_amount: number | null;
  refund_reason: string | null;
  refunded_at: string | null;
  stripe_payment_intent_id: string | null;
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
    case "refunded":
      return (
        <Badge className="bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-100">
          <Undo2 className="h-3 w-3 mr-1" />
          Refunded
        </Badge>
      );
    case "partially_refunded":
      return (
        <Badge className="bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100">
          <Undo2 className="h-3 w-3 mr-1" />
          Partially Refunded
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
  const queryClient = useQueryClient();

  const [refundTarget, setRefundTarget] = useState<Payment | null>(null);
  const [reasonCode, setReasonCode] = useState("requested_by_customer");
  const [reasonNote, setReasonNote] = useState("");
  const [partial, setPartial] = useState(false);
  const [partialAmount, setPartialAmount] = useState("");

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

  const openRefund = (payment: Payment) => {
    setRefundTarget(payment);
    setReasonCode("requested_by_customer");
    setReasonNote("");
    setPartial(false);
    setPartialAmount("");
  };

  const remainingRefundable = refundTarget
    ? Math.round((Number(refundTarget.amount) - Number(refundTarget.refunded_amount ?? 0)) * 100) / 100
    : 0;

  const parsedPartial = parseFloat(partialAmount);
  const partialIsValid =
    !partial || (!isNaN(parsedPartial) && parsedPartial > 0 && parsedPartial <= remainingRefundable);

  const refundMutation = useMutation({
    mutationFn: async () => {
      if (!refundTarget) throw new Error("No payment selected");
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke("refund-payment", {
        body: {
          paymentId: refundTarget.id,
          amount: partial ? parsedPartial : undefined,
          reasonCode,
          reasonNote: reasonNote.trim() || undefined,
        },
        headers: session ? { Authorization: `Bearer ${session.access_token}` } : undefined,
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["student-payments", studentId] });
      toast.success(
        data?.status === "partially_refunded"
          ? `Refunded $${Number(data.refundedAmount).toFixed(2)} (partial).`
          : "Payment fully refunded."
      );
      setRefundTarget(null);
    },
    onError: (error: Error) => {
      toast.error(`Refund failed: ${error.message}`);
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
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => {
                const refunded = Number(payment.refunded_amount ?? 0);
                const canRefund =
                  (payment.status === "paid" || payment.status === "partially_refunded") &&
                  !!payment.stripe_payment_intent_id &&
                  refunded < Number(payment.amount);
                return (
                  <TableRow key={payment.id} className={payment.status === "failed" ? "bg-red-50/50" : ""}>
                    <TableCell>
                      {formatDate(payment.date, organization?.timezone)}
                    </TableCell>
                    <TableCell>${Number(payment.amount).toFixed(2)}</TableCell>
                    <TableCell>
                      <StatusBadge status={payment.status} failureReason={payment.failure_reason} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {refunded > 0 && (
                        <span className="text-sm text-muted-foreground block">
                          Refunded ${refunded.toFixed(2)}
                          {payment.refund_reason ? ` — ${payment.refund_reason}` : ""}
                        </span>
                      )}
                      {payment.failure_reason && (
                        <span className="text-sm text-muted-foreground truncate max-w-[200px] block">
                          {payment.failure_reason}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {canRefund && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openRefund(payment)}
                        >
                          <Undo2 className="h-3.5 w-3.5 mr-1.5" />
                          Refund
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-sm">No payment history found.</p>
        )}
      </CardContent>

      <Dialog open={!!refundTarget} onOpenChange={(open) => !open && setRefundTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Refund Payment</DialogTitle>
            <DialogDescription>
              {refundTarget && (
                <>
                  Refunding a payment of{" "}
                  <span className="font-medium text-foreground">
                    ${Number(refundTarget.amount).toFixed(2)}
                  </span>
                  . Up to ${remainingRefundable.toFixed(2)} can be refunded.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reasonCode} onValueChange={setReasonCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested_by_customer">Requested by customer</SelectItem>
                  <SelectItem value="duplicate">Duplicate charge</SelectItem>
                  <SelectItem value="fraudulent">Fraudulent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refund-note">Note (optional)</Label>
              <Textarea
                id="refund-note"
                placeholder="Add context for this refund (saved to the payment record)."
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={partial}
                  onChange={(e) => setPartial(e.target.checked)}
                  className="h-4 w-4"
                />
                Partial refund
              </label>
              {partial && (
                <>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={remainingRefundable}
                    placeholder={`Up to ${remainingRefundable.toFixed(2)}`}
                    value={partialAmount}
                    onChange={(e) => setPartialAmount(e.target.value)}
                  />
                  {partialAmount !== "" && !partialIsValid && (
                    <p className="text-xs text-destructive">
                      Enter an amount between $0.01 and ${remainingRefundable.toFixed(2)}.
                    </p>
                  )}
                </>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setRefundTarget(null)} disabled={refundMutation.isPending}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => refundMutation.mutate()}
              disabled={refundMutation.isPending || !partialIsValid}
            >
              {refundMutation.isPending ? "Processing..." : "Issue Refund"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
