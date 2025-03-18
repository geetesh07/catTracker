import { useEffect, useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Check, X, Home, ChevronRight as ChevronRightIcon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/components/ui/use-toast";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string;
  created_by: string;
  created_at: string;
  is_completed?: boolean;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<Record<string, string[]>>({});
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    due_date: format(new Date(), "yyyy-MM-dd")
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDetailOpen, setIsTaskDetailOpen] = useState(false);
  const { toast } = useToast();
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    // Get current user on component mount
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setCurrentUser(user.id);
      }
    });
  }, []);

  const fetchTasks = async () => {
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    const { data: tasksData, error: tasksError } = await supabase
      .from("shared_tasks")
      .select("*")
      .gte("due_date", format(startDate, "yyyy-MM-dd"))
      .lte("due_date", format(endDate, "yyyy-MM-dd"));

    if (tasksError) {
      toast({
        title: "Error fetching tasks",
        description: tasksError.message,
        variant: "destructive"
      });
      return;
    }

    const { data: completionsData } = await supabase
      .from("task_completions")
      .select("*");

    const completionsMap: Record<string, string[]> = {};
    completionsData?.forEach((completion) => {
      if (!completionsMap[completion.task_id]) {
        completionsMap[completion.task_id] = [];
      }
      completionsMap[completion.task_id].push(completion.user_id);
    });

    setTasks(tasksData || []);
    setCompletions(completionsMap);
  };

  useEffect(() => {
    fetchTasks();
  }, [currentDate]);

  const handleAddTask = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({
        title: "Error adding task",
        description: "You must be logged in to add tasks",
        variant: "destructive"
      });
      return;
    }

    const { data, error } = await supabase
      .from("shared_tasks")
      .insert([{
        ...newTask,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) {
      toast({
        title: "Error adding task",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    setTasks([...tasks, data]);
    setIsDialogOpen(false);
    setNewTask({
      title: "",
      description: "",
      due_date: format(new Date(), "yyyy-MM-dd")
    });
  };

  const isTaskCompleted = (taskId: string) => {
    return currentUser && completions[taskId]?.includes(currentUser);
  };

  const toggleTaskCompletion = async (taskId: string) => {
    if (!currentUser) return;

    const isCompleted = isTaskCompleted(taskId);

    if (isCompleted) {
      await supabase
        .from("task_completions")
        .delete()
        .match({ task_id: taskId, user_id: currentUser });
    } else {
      await supabase
        .from("task_completions")
        .insert({ task_id: taskId, user_id: currentUser });
    }

    fetchTasks();
  };

  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(currentDate)),
    end: endOfWeek(endOfMonth(currentDate))
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-8 flex-1">
        {/* Breadcrumb Navigation */}
        <div className="flex items-center gap-2 mb-6 text-sm">
          <Link to="/" className="flex items-center gap-1 text-muted-foreground hover:text-foreground">
            <Home className="h-4 w-4" />
            Cat Tracker
          </Link>
          <ChevronRightIcon className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Calendar</span>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-6">
            <CardTitle className="text-2xl font-bold">
              Study Calendar
            </CardTitle>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-lg font-semibold">
                {format(currentDate, "MMMM yyyy")}
              </span>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setCurrentDate(addMonths(currentDate, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Task
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Input
                      placeholder="Task title"
                      value={newTask.title}
                      onChange={(e) =>
                        setNewTask({ ...newTask, title: e.target.value })
                      }
                    />
                    <Textarea
                      placeholder="Task description"
                      value={newTask.description}
                      onChange={(e) =>
                        setNewTask({ ...newTask, description: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      value={newTask.due_date}
                      onChange={(e) =>
                        setNewTask({ ...newTask, due_date: e.target.value })
                      }
                    />
                    <Button onClick={handleAddTask}>Add Task</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-px bg-muted">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <div
                  key={day}
                  className="bg-background p-2 text-center text-sm font-semibold"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-px bg-muted">
              {days.map((day, dayIdx) => (
                <div
                  key={day.toString()}
                  className={`min-h-[120px] bg-background p-2 ${
                    !isSameMonth(day, currentDate)
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  <time dateTime={format(day, "yyyy-MM-dd")}>
                    {format(day, "d")}
                  </time>
                  <div className="mt-2 space-y-1">
                    {tasks
                      .filter((task) =>
                        isSameDay(new Date(task.due_date), day)
                      )
                      .map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between rounded bg-primary/10 p-1 text-xs cursor-pointer hover:bg-primary/20"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsTaskDetailOpen(true);
                          }}
                        >
                          <span className={`truncate ${isTaskCompleted(task.id) ? 'line-through text-muted-foreground' : ''}`}>
                            {task.title}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-4 w-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleTaskCompletion(task.id);
                            }}
                          >
                            {isTaskCompleted(task.id) ? (
                              <Check className="h-3 w-3" />
                            ) : (
                              <X className="h-3 w-3" />
                            )}
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Task Detail Dialog */}
        <Dialog open={isTaskDetailOpen} onOpenChange={setIsTaskDetailOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Task Details</DialogTitle>
            </DialogHeader>
            {selectedTask && (
              <div className="space-y-4">
                <div>
                  <h3 className={`text-lg font-medium ${isTaskCompleted(selectedTask.id) ? 'line-through text-muted-foreground' : ''}`}>
                    {selectedTask.title}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    Due: {format(new Date(selectedTask.due_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <p className="text-sm">{selectedTask.description}</p>
                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => toggleTaskCompletion(selectedTask.id)}
                  >
                    {isTaskCompleted(selectedTask.id) ? "Mark Incomplete" : "Mark Complete"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
} 