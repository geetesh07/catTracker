import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { differenceInDays, differenceInHours, differenceInMinutes, differenceInSeconds } from "date-fns";

// CAT exam date (update this to the actual date)
const CAT_EXAM_DATE = new Date("2025-11-15");

// Array of motivational quotes
const MOTIVATIONAL_QUOTES = [
  "Success is not final, failure is not fatal: it is the courage to continue that counts.",
  "The future depends on what you do today.",
  "Don't watch the clock; do what it does. Keep going.",
  "Believe you can and you're halfway there.",
  "The only way to do great work is to love what you do.",
  "Your time is limited, don't waste it living someone else's life.",
  "The harder you work for something, the greater you'll feel when you achieve it.",
  "Success is walking from failure to failure with no loss of enthusiasm.",
  "The only limit to our realization of tomorrow will be our doubts of today.",
  "Do what you can, with what you have, where you are.",
  "The best way to predict the future is to create it.",
  "Don't let yesterday take up too much of today.",
  "You are never too old to set another goal or to dream a new dream.",
  "The secret of getting ahead is getting started.",
  "Quality is not an act, it is a habit.",
  "Success usually comes to those who are too busy to be looking for it.",
  "The only person you are destined to become is the person you decide to be.",
  "What you get by achieving your goals is not as important as what you become by achieving your goals.",
  "The difference between ordinary and extraordinary is that little extra.",
  "Don't count the days, make the days count."
];

export default function ExamCountdown() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // Get today's quote based on the day of the year
    const dayOfYear = Math.floor((new Date().getTime() - new Date(new Date().getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    const todaysQuote = MOTIVATIONAL_QUOTES[dayOfYear % MOTIVATIONAL_QUOTES.length];
    setQuote(todaysQuote);

    // Update countdown every second
    const timer = setInterval(() => {
      const now = new Date();
      
      if (now >= CAT_EXAM_DATE) {
        clearInterval(timer);
        return;
      }

      setTimeLeft({
        days: differenceInDays(CAT_EXAM_DATE, now),
        hours: differenceInHours(CAT_EXAM_DATE, now) % 24,
        minutes: differenceInMinutes(CAT_EXAM_DATE, now) % 60,
        seconds: differenceInSeconds(CAT_EXAM_DATE, now) % 60
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <Card className="bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-red-500/10">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">CAT 2024 Countdown</CardTitle>
        <CardDescription className="text-center text-base">
          Every second counts towards your success
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="flex flex-col items-center p-4 bg-background rounded-lg shadow">
            <span className="text-3xl font-bold text-primary">{timeLeft.days}</span>
            <span className="text-sm text-muted-foreground">Days</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background rounded-lg shadow">
            <span className="text-3xl font-bold text-primary">{timeLeft.hours}</span>
            <span className="text-sm text-muted-foreground">Hours</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background rounded-lg shadow">
            <span className="text-3xl font-bold text-primary">{timeLeft.minutes}</span>
            <span className="text-sm text-muted-foreground">Minutes</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-background rounded-lg shadow">
            <span className="text-3xl font-bold text-primary">{timeLeft.seconds}</span>
            <span className="text-sm text-muted-foreground">Seconds</span>
          </div>
        </div>
        <div className="text-center italic text-muted-foreground border-t pt-4">
          "{quote}"
        </div>
      </CardContent>
    </Card>
  );
} 