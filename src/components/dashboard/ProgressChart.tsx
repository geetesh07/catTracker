import { ProblemLog, User } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import { subDays, format } from "date-fns";

interface ProgressChartProps {
  problemLogs: ProblemLog[];
  totalProblems: number;
  user: User | null;
}

export default function ProgressChart({ problemLogs, user }: ProgressChartProps) {
  if (!problemLogs || !user) return null;

  // Get the last 7 days
  const dates = Array.from({ length: 7 }, (_, i) => {
    const date = subDays(new Date(), 6 - i);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD
  });

  // Create data for the chart
  const chartData = dates.map(date => {
    const dayProblems = problemLogs
      .filter(log => log.date === date)
      .reduce((sum, log) => sum + log.problems_completed, 0);

    return {
      date: format(new Date(date), 'MMM d'),
      problems: dayProblems
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Weekly Progress</CardTitle>
        <CardDescription>
          Your problem-solving activity over the past week
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis 
                dataKey="date"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value}`}
              />
              <Tooltip />
              <Bar
                dataKey="problems"
                fill="currentColor"
                radius={[4, 4, 0, 0]}
                className="fill-primary"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
