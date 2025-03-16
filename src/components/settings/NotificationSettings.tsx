import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Bell, Plus, Trash2 } from "lucide-react";
import { supabase, User } from "@/lib/supabase";
import { toast } from "sonner";

interface NotificationRule {
  id: string;
  interval: number; // hours
  enabled: boolean;
}

interface NotificationSettings {
  enabled: boolean;
  rules: NotificationRule[];
}

export default function NotificationSettings({ user }: { user: User }) {
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: false,
    rules: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, [user.id]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;

      const enabled = data.some(rule => rule.enabled);
      const rules = data.map(rule => ({
        id: rule.id,
        interval: rule.interval,
        enabled: rule.enabled
      }));

      setSettings({ enabled, rules });
    } catch (error) {
      console.error('Error loading notification settings:', error);
      toast.error('Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  };

  const addRule = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_rules')
        .insert({
          user_id: user.id,
          interval: 2, // Default 2 hours
          enabled: true
        })
        .select()
        .single();

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        rules: [...prev.rules, { id: data.id, interval: data.interval, enabled: data.enabled }]
      }));

      toast.success('Added new notification rule');
    } catch (error) {
      console.error('Error adding notification rule:', error);
      toast.error('Failed to add notification rule');
    }
  };

  const updateRule = async (id: string, updates: Partial<NotificationRule>) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        rules: prev.rules.map(rule =>
          rule.id === id ? { ...rule, ...updates } : rule
        )
      }));

      toast.success('Updated notification rule');
    } catch (error) {
      console.error('Error updating notification rule:', error);
      toast.error('Failed to update notification rule');
    }
  };

  const deleteRule = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notification_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSettings(prev => ({
        ...prev,
        rules: prev.rules.filter(rule => rule.id !== id)
      }));

      toast.success('Deleted notification rule');
    } catch (error) {
      console.error('Error deleting notification rule:', error);
      toast.error('Failed to delete notification rule');
    }
  };

  if (loading) {
    return <div>Loading notification settings...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notification Settings
        </CardTitle>
        <CardDescription>
          Configure when you want to be reminded about adding problems
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="flex items-center gap-2">
            Enable Notifications
          </Label>
          <Switch
            id="notifications"
            checked={settings.enabled}
            onCheckedChange={(checked) => {
              setSettings(prev => ({ ...prev, enabled: checked }));
              // Update all rules
              settings.rules.forEach(rule => {
                updateRule(rule.id, { enabled: checked });
              });
            }}
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">Notification Rules</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={addRule}
              disabled={!settings.enabled}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Rule
            </Button>
          </div>

          {settings.rules.map((rule) => (
            <div
              key={rule.id}
              className="flex items-center gap-4 p-4 rounded-lg border"
            >
              <Select
                value={rule.interval.toString()}
                onValueChange={(value) => updateRule(rule.id, { interval: parseInt(value) })}
                disabled={!settings.enabled}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 5, 6].map((hours) => (
                    <SelectItem key={hours} value={hours.toString()}>
                      Every {hours} hours
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Switch
                checked={rule.enabled && settings.enabled}
                onCheckedChange={(checked) => updateRule(rule.id, { enabled: checked })}
                disabled={!settings.enabled}
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteRule(rule.id)}
                disabled={!settings.enabled}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {settings.rules.length === 0 && (
            <p className="text-center text-muted-foreground py-4">
              No notification rules set. Add one to get started!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 