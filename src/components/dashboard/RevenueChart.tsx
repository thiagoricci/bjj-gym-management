import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { subMonths, format, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

// Helper to generate the last 12 months
const getLast12Months = () => {
  const months = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    months.push(startOfMonth(subMonths(today, i)));
  }
  return months;
};

export default function RevenueChart() {
  const { organization } = useAuth();
  const queryClient = useQueryClient();
  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments-for-revenue-chart"],
    queryFn: async () => {
      const twelveMonthsAgo = format(subMonths(new Date(), 12), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("payments")
        .select("date, amount")
        .eq("organization_id", organization.id)
        .gte("date", twelveMonthsAgo);
      if (error) throw error;
      return data;
    },
  });


  if (isLoading) {
    return <div>Loading Chart...</div>;
  }

  const months = getLast12Months();
  const chartData = months.map((month) => {
    const monthString = format(month, "yyyy-MM");
    const monthlyRevenue = payments
      ?.filter((p) => format(new Date(p.date), "yyyy-MM") === monthString)
      .reduce((sum, p) => sum + (p.amount ? Number(p.amount) : 0), 0) || 0;
    
    return {
      month: format(month, "MMM"),
      revenue: monthlyRevenue,
    };
  });

  const hasData = chartData.some(d => d.revenue > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Revenue</CardTitle>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={(value) => `$${value}`} />
              <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
              <Bar dataKey="revenue" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center h-[300px] space-y-4">
            <p className="text-muted-foreground">No revenue data for the last 12 months.</p>
            <p className="text-sm text-muted-foreground">Add payment data to see the chart.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}