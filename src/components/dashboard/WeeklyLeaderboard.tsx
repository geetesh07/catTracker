import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Crown, Trophy, Flame, ArrowUp, Medal, Sparkles, Star } from "lucide-react";
import { format, startOfWeek, endOfWeek } from "date-fns";
import { supabase, User } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import confetti from 'canvas-confetti';

const styles = `
  @keyframes shineGradient {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }

  @keyframes float {
    0% {
      transform: translateY(0px);
    }
    50% {
      transform: translateY(-20px);
    }
    100% {
      transform: translateY(0px);
    }
  }

  @keyframes twinkle {
    0%, 100% {
      opacity: 1;
      transform: scale(1);
    }
    50% {
      opacity: 0.2;
      transform: scale(0.5);
    }
  }

  @keyframes glow {
    0%, 100% {
      box-shadow: 0 0 20px rgba(255, 215, 0, 0.5),
                  0 0 40px rgba(255, 215, 0, 0.2);
    }
    50% {
      box-shadow: 0 0 40px rgba(255, 215, 0, 0.8),
                  0 0 60px rgba(255, 215, 0, 0.4);
    }
  }

  @keyframes shimmer {
    0% {
      background-position: -1000px 0;
    }
    100% {
      background-position: 1000px 0;
    }
  }

  .leader-card {
    background: linear-gradient(
      60deg,
      rgba(255, 215, 0, 0.1) 0%,
      rgba(255, 215, 0, 0.4) 25%,
      rgba(255, 223, 0, 0.6) 50%,
      rgba(255, 215, 0, 0.4) 75%,
      rgba(255, 215, 0, 0.1) 100%
    );
    background-size: 200% 200%;
    animation: shineGradient 4s ease infinite, glow 2s ease-in-out infinite;
  }

  .shimmer-text {
    background: linear-gradient(
      90deg,
      #ffd700 0%,
      #fff8c4 20%,
      #ffd700 40%,
      #ffd700 100%
    );
    background-size: 200% auto;
    color: transparent;
    background-clip: text;
    -webkit-background-clip: text;
    animation: shimmer 3s linear infinite;
  }

  .floating {
    animation: float 3s ease-in-out infinite;
  }

  .twinkling {
    animation: twinkle 2s ease-in-out infinite;
  }

  .sparkle {
    position: absolute;
    width: 6px;
    height: 6px;
    background: #FFD700;
    border-radius: 50%;
    animation: twinkle 1.5s ease-in-out infinite;
    box-shadow: 0 0 10px #FFD700;
  }
`;

interface WeeklyStats {
  user: User;
  weeklyTotal: number;
}

export default function WeeklyLeaderboard() {
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const confettiRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchWeeklyStats = async () => {
      try {
        // Get all users
        const { data: users } = await supabase
          .from('profiles')
          .select('*')
          .limit(2);

        if (!users) return;

        // Get all-time totals for each user
        const stats = await Promise.all(
          users.map(async (user) => {
            const { data: logs } = await supabase
              .from('problem_logs')
              .select('problems_completed')
              .eq('user_id', user.id);

            const totalProblems = logs?.reduce((sum, log) => sum + log.problems_completed, 0) || 0;

            return {
              user: {
                ...user,
                notification_frequency: user.notification_frequency as 'daily' | 'weekly' | 'monthly'
              },
              weeklyTotal: totalProblems // renamed for backward compatibility
            };
          })
        );

        // Sort by total in descending order
        const sortedStats = stats.sort((a, b) => b.weeklyTotal - a.weeklyTotal);
        setWeeklyStats(sortedStats);

        // Trigger confetti if there's a leader
        if (sortedStats[0]?.weeklyTotal > 0) {
          const end = Date.now() + (2 * 1000);

          // Launch confetti
          const frame = () => {
            confetti({
              particleCount: 2,
              angle: 60,
              spread: 55,
              origin: { x: 0, y: 0.8 }
            });
            confetti({
              particleCount: 2,
              angle: 120,
              spread: 55,
              origin: { x: 1, y: 0.8 }
            });

            if (Date.now() < end) {
              requestAnimationFrame(frame);
            }
          };
          frame();
        }
      } catch (error) {
        console.error('Error fetching total stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchWeeklyStats();

    // Set up real-time subscription
    const channel = supabase.channel('weekly-leaderboard');
    
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'problem_logs'
        },
        () => {
          fetchWeeklyStats(); // Refresh stats on any change
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const getMotivationalMessage = (position: number, difference: number) => {
    if (position === 0) {
      return {
        message: "👑 Overall Champion! Keep crushing it!",
        icon: Crown
      };
    } else {
      if (difference <= 5) {
        return {
          message: `🔥 Only ${difference} problems behind! The crown is within reach!`,
          icon: Flame
        };
      } else {
        return {
          message: "💪 Every problem solved brings you closer to victory!",
          icon: ArrowUp
        };
      }
    }
  };

  // Add sparkles randomly positioned
  const renderSparkles = () => {
    const sparkles = [];
    for (let i = 0; i < 20; i++) {
      const top = Math.random() * 100;
      const left = Math.random() * 100;
      const delay = Math.random() * 2;
      sparkles.push(
        <div
          key={i}
          className="sparkle"
          style={{
            top: `${top}%`,
            left: `${left}%`,
            animationDelay: `${delay}s`
          }}
        />
      );
    }
    return sparkles;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Weekly Leaderboard</CardTitle>
          <CardDescription>Loading weekly stats...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d');
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d');
  const leaderTotal = weeklyStats[0]?.weeklyTotal || 0;

  return (
    <div ref={confettiRef}>
      <style>{styles}</style>
      <Card className="overflow-hidden">
        <CardHeader className="border-b bg-gradient-to-r from-yellow-500/30 via-amber-500/50 to-yellow-500/30">
          <CardTitle className="flex items-center gap-2 text-2xl">
            Weekly Leaderboard
            <Trophy className="h-6 w-6 text-yellow-500 animate-bounce" />
          </CardTitle>
          <CardDescription className="text-base">
            Problems completed this week ({weekStart} - {weekEnd})
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          {weeklyStats.map((stat, index) => {
            const difference = index === 0 ? 0 : leaderTotal - stat.weeklyTotal;
            const { message, icon: MotivationIcon } = getMotivationalMessage(index, difference);
            const isLeader = index === 0 && stat.weeklyTotal > 0;
            
            return (
              <div
                key={stat.user.id}
                className={cn(
                  "relative overflow-hidden rounded-xl p-6 transition-all duration-300",
                  isLeader 
                    ? "bg-gradient-to-r from-yellow-500/30 via-amber-500/50 to-yellow-500/30 border-2 border-yellow-500 shadow-[0_0_30px_rgba(234,179,8,0.5)] animate-pulse"
                    : "bg-muted/50 border border-border"
                )}
              >
                {isLeader && (
                  <>
                    <div className="absolute top-0 right-0 p-3">
                      <Crown className="h-8 w-8 text-yellow-500 animate-bounce" />
                    </div>
                    <Star className="absolute top-2 left-2 h-6 w-6 text-yellow-500 animate-ping" />
                    <Star className="absolute bottom-2 right-2 h-6 w-6 text-yellow-500 animate-ping" />
                    <Star className="absolute top-2 right-1/4 h-6 w-6 text-yellow-500 animate-ping" />
                    <Star className="absolute bottom-2 left-1/4 h-6 w-6 text-yellow-500 animate-ping" />
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/20 via-transparent to-yellow-500/20 animate-pulse" />
                  </>
                )}
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "flex items-center justify-center w-12 h-12 rounded-full text-2xl font-bold shadow-lg",
                        isLeader
                          ? "bg-gradient-to-r from-yellow-500 to-amber-500 text-white animate-bounce"
                          : "bg-muted text-muted-foreground"
                      )}>
                        #{index + 1}
                      </div>
                      <div>
                        <h3 className={cn(
                          "text-xl font-bold",
                          isLeader && "text-yellow-500 animate-pulse"
                        )}>
                          {stat.user.full_name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {stat.weeklyTotal} problems this week
                        </p>
                      </div>
                    </div>
                    
                    {isLeader && (
                      <div className="flex items-center gap-2">
                        <Medal className="h-8 w-8 text-yellow-500 animate-bounce" />
                        <Trophy className="h-8 w-8 text-yellow-500 animate-bounce" />
                      </div>
                    )}
                  </div>
                  
                  <div className={cn(
                    "flex items-center gap-2 p-4 rounded-lg",
                    isLeader
                      ? "bg-gradient-to-r from-yellow-500/30 via-amber-500/50 to-yellow-500/30 animate-pulse"
                      : "bg-background/50"
                  )}>
                    <MotivationIcon className={cn(
                      "h-5 w-5",
                      isLeader ? "text-yellow-500 animate-bounce" : "text-primary"
                    )} />
                    <p className={cn(
                      "text-sm font-medium",
                      isLeader ? "text-yellow-500" : "text-muted-foreground"
                    )}>
                      {message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          
          {weeklyStats.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
              <p className="text-lg font-medium text-muted-foreground">
                No problems completed this week.
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Be the first to claim the crown! 👑
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 