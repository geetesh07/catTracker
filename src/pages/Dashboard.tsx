import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ProgressStats from "@/components/dashboard/ProgressStats";
import ProgressChart from "@/components/dashboard/ProgressChart";
import ProgressComparison from "@/components/dashboard/ProgressComparison";
import { 
  User, 
  ProblemLog,
  addProblemLog,
  getProblemLogs,
  getTotalCompletedProblems,
  deleteAllProblemLogs,
  deleteRecentProblemLogs,
  supabase 
} from "@/lib/supabase";
import { toast } from "sonner";
import { PlusCircle, Loader2, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function Dashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [problemLogs, setProblemLogs] = useState<ProblemLog[]>([]);
  const [totalProblems, setTotalProblems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formState, setFormState] = useState({
    description: "",
    category: "Quantitative Aptitude",
    numProblems: ""
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showDeleteRecentDialog, setShowDeleteRecentDialog] = useState(false);
  const [deleteCount, setDeleteCount] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  // Function to reset form state
  const resetForm = () => {
    setFormState({
      description: "",
      category: "Quantitative Aptitude",
      numProblems: ""
    });
  };

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          navigate("/login");
          return;
        }
        
        // Get user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();
          
        if (profile) {
          const typedProfile: User = {
            ...profile,
            notification_frequency: profile.notification_frequency as 'daily' | 'weekly' | 'monthly',
          };
          setUser(typedProfile);
          
          // Get problem logs and total
          const logs = await getProblemLogs(authUser.id);
          const total = await getTotalCompletedProblems(authUser.id);
          setProblemLogs(logs);
          setTotalProblems(total);

          // Set up real-time subscription with better error handling
          const channel = supabase.channel('problem-logs-changes');
          
          const subscription = channel
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'problem_logs',
                filter: `user_id=eq.${authUser.id}`,
              },
              async (payload) => {
                console.log('Received real-time update:', payload);
                try {
                  // Refresh both logs and total on any change
                  const freshLogs = await getProblemLogs(authUser.id);
                  const freshTotal = await getTotalCompletedProblems(authUser.id);
                  setProblemLogs(freshLogs);
                  setTotalProblems(freshTotal);
                } catch (error) {
                  console.error('Error handling real-time update:', error);
                  // Force refresh on error to ensure UI is in sync
                  await refreshProgress();
                }
              }
            )
            .subscribe();

          return () => {
            subscription.unsubscribe();
          };
        }
      } catch (error) {
        console.error("Error checking auth:", error);
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [navigate]);
  
  const handleAddProblems = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("You must be logged in to add problems");
      return;
    }
    
    const numProblems = parseInt(formState.numProblems);
    if (isNaN(numProblems) || numProblems <= 0) {
      toast.error("Please enter a valid number of problems (greater than 0)");
      return;
    }
    
    setSubmitting(true);
    
    try {
      const result = await addProblemLog(
        user.id,
        numProblems,
        formState.category
      );
      
      if (result) {
        // Refresh data
        const logs = await getProblemLogs(user.id);
        const total = await getTotalCompletedProblems(user.id);
        setProblemLogs(logs);
        setTotalProblems(total);
        
        toast.success(`Successfully added ${numProblems} problem${numProblems > 1 ? 's' : ''}`);
        
        if (total % 100 === 0) {
          toast.success(`🎉 Congratulations! You've completed ${total} problems!`, {
            duration: 5000,
          });
        }
        
        resetForm();
        setShowAddForm(false);
      }
    } catch (error: any) {
      console.error("Error adding problems:", error);
      toast.error("Failed to add problems. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormChange = (field: string, value: string | number) => {
    setFormState(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const refreshProgress = async () => {
    if (!user) return;
    
    try {
      setRefreshing(true);
      const logs = await getProblemLogs(user.id);
      const total = await getTotalCompletedProblems(user.id);
      setProblemLogs(logs);
      setTotalProblems(total);
      toast.success("Progress refreshed");
    } catch (error) {
      console.error("Error refreshing progress:", error);
      toast.error("Failed to refresh progress");
    } finally {
      setRefreshing(false);
    }
  };

  const handleDeleteAllProblems = async () => {
    if (!user) return;
    
    try {
      setSubmitting(true);
      await deleteAllProblemLogs(user.id);
      
      // Clear the UI
      setProblemLogs([]);
      setTotalProblems(0);
      setShowDeleteDialog(false);
      toast.success("Successfully deleted all progress");
    } catch (error) {
      console.error("Error deleting all problems:", error);
      toast.error("Failed to delete progress. Please try again.");
      // Refresh to show current state
      await refreshProgress();
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRecentProblems = async () => {
    if (!user || deleteCount <= 0) return;
    
    try {
      setSubmitting(true);
      await deleteRecentProblemLogs(user.id, deleteCount);
      
      // Refresh the data
      const logs = await getProblemLogs(user.id);
      const total = await getTotalCompletedProblems(user.id);
      setProblemLogs(logs);
      setTotalProblems(total);
      
      setShowDeleteRecentDialog(false);
      setDeleteCount(1);
      toast.success(`Successfully deleted recent progress`);
    } catch (error) {
      console.error("Error deleting recent problems:", error);
      toast.error("Failed to delete progress. Please try again.");
      // Refresh to show current state
      await refreshProgress();
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
            <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container px-4 md:px-6 py-8">
        <div className="flex flex-col space-y-8 animate-fade-in">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <p className="text-muted-foreground">
                Track your progress towards 3000 numerical problems
              </p>
            </div>
            <div className="flex gap-2 mt-4 md:mt-0">
              <Button
                variant="outline"
                onClick={refreshProgress}
                disabled={refreshing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Problems
              </Button>
            </div>
          </div>
          
          {showAddForm && (
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle>Add Completed Problems</CardTitle>
                <CardDescription>
                  Record the problems you've completed
                </CardDescription>
              </CardHeader>
              <form onSubmit={handleAddProblems}>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="numProblems">Number of Problems</Label>
                      <Input
                        id="numProblems"
                        type="number"
                        min="1"
                        max="100"
                        value={formState.numProblems}
                        onChange={(e) => handleFormChange('numProblems', e.target.value)}
                        disabled={submitting}
                        placeholder="Enter number of problems"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select 
                        value={formState.category} 
                        onValueChange={(value) => handleFormChange('category', value)}
                      >
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Quantitative Aptitude">Quantitative Aptitude</SelectItem>
                          <SelectItem value="Data Interpretation & Logical Reasoning">Data Interpretation & Logical Reasoning</SelectItem>
                          <SelectItem value="Verbal Ability & Reading Comprehension">Verbal Ability & Reading Comprehension</SelectItem>
                          <SelectItem value="General">General</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Notes (Optional)</Label>
                    <Textarea
                      id="description"
                      placeholder="Add any notes about these problems..."
                      value={formState.description}
                      onChange={(e) => handleFormChange('description', e.target.value)}
                      disabled={submitting}
                      className="resize-none"
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => {
                      resetForm();
                      setShowAddForm(false);
                    }}
                    disabled={submitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Progress"
                    )}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          )}
          
          <ProgressStats 
            problemLogs={problemLogs} 
            totalProblems={totalProblems}
            user={user} 
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ProgressChart 
              problemLogs={problemLogs}
              totalProblems={totalProblems}
              user={user} 
            />
            <ProgressComparison />
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
