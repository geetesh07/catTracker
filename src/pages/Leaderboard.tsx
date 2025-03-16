import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Trophy, Flame, ArrowUp, History } from "lucide-react";
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { supabase, User } from "@/lib/supabase";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import WeeklyLeaderboard from "@/components/dashboard/WeeklyLeaderboard";

export default function Leaderboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
            <p className="text-muted-foreground">
              Track your progress and compete with your study partner
            </p>
          </div>

          <div className="grid gap-6">
            <WeeklyLeaderboard />
            
            {/* We can add historical stats here in the future */}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
} 