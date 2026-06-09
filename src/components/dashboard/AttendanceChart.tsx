import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { subDays, format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { CHART_HEIGHT_MOBILE, CHART_RESPONSIVE_CLASS } from "@/components/dashboard/chart-constants";

// Helper to generate the last 7 days
const getLast7Days = () => {
  const days = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    days.push(subDays(today, i));
  }
  return days;
};

export default function AttendanceChart() {
  const { organization } = useAuth();
  const { data: attendance, isLoading } = useQuery({
    queryKey: ["attendance-for-chart"],
    queryFn: async () => {
      const sevenDaysAgo = format(subDays(new Date(), 7), "yyyy-MM-dd");
      const { data, error } = await supabase
        .from("attendance")
        .select("date")
        .eq("organization_id", organization.id)
        .gte("date", sevenDaysAgo);
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading Chart...</div>;
  }

  const days = getLast7Days();
  const chartData = days.map((day) => {
    const dayString = format(day, "yyyy-MM-dd");
    const dailyAttendance = attendance?.filter((a) => a.date === dayString).length || 0;
    return {
      day: format(day, "EEE"),
      attendance: dailyAttendance,
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={CHART_HEIGHT_MOBILE} className={CHART_RESPONSIVE_CLASS}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="attendance" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}