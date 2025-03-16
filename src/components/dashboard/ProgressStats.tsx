import { ProblemLog, User } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { Award, BookOpen, TrendingUp, Calendar } from "lucide-react";
import { subDays } from "date-fns";

interface ProgressStatsProps {
  problemLogs: ProblemLog[];
  totalProblems: number;
  user: User | null;
  className?: string;
}

export default function ProgressStats({ problemLogs, totalProblems, user, className }: ProgressStatsProps) {
  if (!problemLogs || !user) return null;
  
  const targetProblems = 3000;
  const remainingProblems = Math.max(0, targetProblems - totalProblems);
  const percentageComplete = (totalProblems / targetProblems) * 100;
  
  // Get problems completed today
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const todaysProblems = problemLogs
    .filter(log => log.date === today)
    .reduce((sum, log) => sum + log.problems_completed, 0);
  
  // Get problems completed in the last 7 days
  const lastWeek = subDays(new Date(), 7).toISOString().split('T')[0];
  const weeklyProblems = problemLogs
    .filter(log => log.date >= lastWeek)
    .reduce((sum, log) => sum + log.problems_completed, 0);
  
  // Average problems per day (based on the last 7 days)
  const averagePerDay = (weeklyProblems / 7).toFixed(1);
  
  // Estimated days to completion at current rate
  const daysToCompletion = averagePerDay && averagePerDay !== "0.0" 
    ? Math.ceil(remainingProblems / parseFloat(averagePerDay))
    : "—";
    
  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Problems</CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalProblems}</div>
          <ProgressBar value={percentageComplete} className="mt-2" />
          <p className="text-xs text-muted-foreground mt-2">
            {remainingProblems} problems remaining
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{todaysProblems}</div>
          <p className="text-xs text-muted-foreground mt-2">
            problems completed today
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Weekly Progress</CardTitle>
          <BookOpen className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{weeklyProblems}</div>
          <p className="text-xs text-muted-foreground mt-2">
            problems in last 7 days
          </p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{averagePerDay}</div>
          <p className="text-xs text-muted-foreground mt-2">
            {typeof daysToCompletion === 'number' 
              ? `${daysToCompletion} days to goal at this rate`
              : 'Complete some problems to see estimate'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
