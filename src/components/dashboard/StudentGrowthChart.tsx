import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { subMonths, format, startOfMonth } from "date-fns";

// Helper to generate the last 12 months
const getLast12Months = () => {
  const months = [];
  const today = new Date();
  for (let i = 11; i >= 0; i--) {
    months.push(startOfMonth(subMonths(today, i)));
  }
  return months;
};

export default function StudentGrowthChart() {
  const { data: students, isLoading } = useQuery({
    queryKey: ["students-for-growth-chart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("join_date")
        .eq("status", "student");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading Chart...</div>;
  }

  const months = getLast12Months();
  const chartData = months.map((month) => {
    const cumulativeStudents = students?.filter(
      (s) => new Date(s.join_date) <= month
    ).length || 0;
    return {
      month: format(month, "MMM yy"),
      students: cumulativeStudents,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Area type="monotone" dataKey="students" stroke="#8884d8" fill="#8884d8" />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}