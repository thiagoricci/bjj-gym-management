import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/contexts/AuthContext";

const COLORS = {
  white: "#FFFFFF",
  blue: "#0000FF",
  purple: "#800080",
  brown: "#A52A2A",
  black: "#000000",
};

const beltOrder = ["white", "blue", "purple", "brown", "black"];

export default function BeltDistributionChart() {
  const { organization } = useAuth();
  const { data: students, isLoading } = useQuery({
    queryKey: ["students-for-belt-chart"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("belt")
        .eq("organization_id", organization.id)
        .eq("status", "student");
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading Chart...</div>;
  }

  const beltCounts = students?.reduce((acc, student) => {
    const belt = student.belt || "white";
    acc[belt] = (acc[belt] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = beltOrder
    .map((belt) => ({
      name: belt.charAt(0).toUpperCase() + belt.slice(1),
      value: beltCounts?.[belt] || 0,
    }))
    .filter((entry) => entry.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Belt Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              nameKey="name"
              labelLine={false}
              label={<CustomizedLabel />}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase() as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

const CustomizedLabel = ({ cx, cy, midAngle, outerRadius, name, value }: any) => {
  const RADIAN = Math.PI / 180;
  const radius = outerRadius + 25; // Position label outside the pie
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="#000000" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
      {`${name} (${value})`}
    </text>
  );
};