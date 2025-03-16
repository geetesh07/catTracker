import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/lib/database.types";

type StudyLogWithUser = Database["public"]["Views"]["study_logs_with_users"]["Row"];

export default function StudyLogs() {
  const [logs, setLogs] = useState<StudyLogWithUser[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingLog, setEditingLog] = useState<StudyLogWithUser | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUserId(user.id);
      }
    };
    getCurrentUser();
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from("study_logs_with_users")
      .select()
      .order("date", { ascending: false });

    if (error) {
      toast({
        title: "Error fetching logs",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    setLogs(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUserId) {
      toast({
        title: "Error",
        description: "You must be logged in to create or edit logs",
        variant: "destructive",
      });
      return;
    }

    if (editingLog) {
      const { error } = await supabase
        .from("study_logs")
        .update({
          title,
          description,
        })
        .eq("id", editingLog.id);

      if (error) {
        toast({
          title: "Error updating log",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Log updated successfully",
      });
      setEditingLog(null);
    } else {
      const { error } = await supabase
        .from("study_logs")
        .insert([{
          title,
          description,
          user_id: currentUserId,
        }]);

      if (error) {
        toast({
          title: "Error creating log",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Log created successfully",
      });
    }

    setTitle("");
    setDescription("");
    fetchLogs();
  };

  const handleEdit = (log: StudyLogWithUser) => {
    setEditingLog(log);
    setTitle(log.title);
    setDescription(log.description || "");
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("study_logs")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error deleting log",
        description: error.message,
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Log deleted successfully",
    });
    fetchLogs();
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{editingLog ? "Edit Study Log" : "Create Study Log"}</CardTitle>
          <CardDescription>Record what you studied today</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <Textarea
              placeholder="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <div className="flex gap-2">
              <Button type="submit">
                {editingLog ? "Update Log" : "Create Log"}
              </Button>
              {editingLog && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setEditingLog(null);
                    setTitle("");
                    setDescription("");
                  }}
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {logs.map((log) => (
          <Card key={log.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{log.title}</CardTitle>
                  <CardDescription>
                    By {log.full_name || log.email} on {format(new Date(log.date), "PPP")}
                  </CardDescription>
                </div>
                {log.user_id === currentUserId && (
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(log)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(log.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{log.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 