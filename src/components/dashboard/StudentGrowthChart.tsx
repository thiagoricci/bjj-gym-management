import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { subMonths, format, startOfMonth, endOfMonth } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { CHART_HEIGHT_MOBILE, CHART_RESPONSIVE_CLASS } from "@/components/dashboard/chart-constants";

// Helper to generate months of the current year
const getMonthsOfYear = () => {
  const months = [];
  const currentYear = new Date().getFullYear();
  for (let i = 0; i < 12; i++) {
    months.push(startOfMonth(new Date(currentYear, i, 1)));
  }
  return months;
};

export default function StudentGrowthChart() {
  const { organization } = useAuth();
  const { data: students, isLoading } = useQuery({
    queryKey: ["students-for-growth-chart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("join_date")
        .eq("organization_id", organization.id)
        .eq("status", "student");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading Chart...</div>;
  }

  const months = getMonthsOfYear();
  const chartData = months.map((month) => {
    const monthEnd = endOfMonth(month);
    const cumulativeStudents = students?.filter(
      (s) => new Date(s.join_date) <= monthEnd
    ).length || 0;
    return {
      month: format(month, "MMM"),
      students: cumulativeStudents,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Student Growth</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_MOBILE} className={CHART_RESPONSIVE_CLASS}>
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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