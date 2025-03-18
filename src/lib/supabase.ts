import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

export type User = {
  id: string;
  email: string;
  full_name: string;
};

export type Problem = {
  id: string;
  user_id: string;
  completed_at: string;
  description?: string;
  category?: string;
  created_at: string;
};

export type NotificationPreference = {
  id: string;
  user_id: string;
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  enabled: boolean;
  created_at: string;
};

export type ProblemLog = {
  id: string;
  user_id: string;
  topic_id: string;
  problems_completed: number;
  date: string;
  created_at: string;
};

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
    
  return data;
}

export async function getCompletedProblems(userId: string) {
  console.log('Fetching problems for user:', userId);
  
  const { data, error } = await supabase
    .from('problems')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching problems:', error);
    throw error;
  }
  
  if (!data) {
    console.log('No problems found for user:', userId);
    return [];
  }
  
  console.log('Fetched problems:', data);
  return data;
}

export async function addCompletedProblem(userId: string, description?: string, category?: string) {
  const { data, error } = await supabase
    .from('problems')
    .insert([
      { 
        user_id: userId,
        completed_at: new Date().toISOString(),
        description,
        category 
      }
    ]);
    
  if (error) throw error;
  return data;
}

export async function getBothUsersProgress() {
  console.log('Fetching both users progress...');
  
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('*')
    .limit(2);
    
  if (profilesError) {
    console.error('Error fetching profiles:', profilesError);
    throw profilesError;
  }
  
  if (!profiles || profiles.length === 0) {
    console.log('No profiles found');
    return [];
  }
  
  console.log('Found profiles:', profiles);
  
  const result = await Promise.all(
    profiles.map(async (profile) => {
      try {
        const { data: logs, error: logsError } = await supabase
          .from('problem_logs')
          .select('problems_completed')
          .eq('user_id', profile.id);
          
        if (logsError) {
          console.error(`Error fetching problem logs for user ${profile.id}:`, logsError);
          return {
            ...profile,
            completed: 0,
            notification_frequency: profile.notification_frequency as 'daily' | 'weekly' | 'monthly'
          };
        }
        
        const totalProblems = logs?.reduce((sum, log) => sum + log.problems_completed, 0) || 0;
        console.log(`Total problems for user ${profile.id}:`, totalProblems);
        
        return {
          ...profile,
          completed: totalProblems,
          notification_frequency: profile.notification_frequency as 'daily' | 'weekly' | 'monthly'
        };
      } catch (error) {
        console.error(`Error processing user ${profile.id}:`, error);
        return {
          ...profile,
          completed: 0,
          notification_frequency: profile.notification_frequency as 'daily' | 'weekly' | 'monthly'
        };
      }
    })
  );
  
  console.log('Final result:', result);
  return result;
}

export async function updateProfile(userId: string, updates: Partial<User>) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId);
    
  if (error) throw error;
  return data;
}

export async function updateNotificationPreferences(
  userId: string, 
  preferences: Partial<NotificationPreference>
) {
  const { data, error } = await supabase
    .from('notification_preferences')
    .update(preferences)
    .eq('user_id', userId);
    
  if (error) throw error;
  return data;
}

export async function deleteAllProblems(userId: string) {
  console.log('Attempting to delete all problems for user', userId);

  const { data: deletedData, error: deleteError } = await supabase
    .from('problems')
    .delete()
    .eq('user_id', userId)
    .select('*');
    
  if (deleteError) {
    console.error('Error deleting all problems:', deleteError);
    throw deleteError;
  }

  console.log('Successfully deleted', deletedData?.length || 0, 'problems');
  return deletedData;
}

export async function deleteRecentProblems(userId: string, count: number) {
  console.log('Attempting to delete', count, 'recent problems for user', userId);
  
  const { data: problemsToDelete, error: fetchError } = await supabase
    .from('problems')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(count);

  if (fetchError) {
    console.error('Error fetching problems to delete:', fetchError);
    throw fetchError;
  }
  
  if (!problemsToDelete?.length) {
    console.log('No problems found to delete');
    return [];
  }

  const { data: deletedData, error: deleteError } = await supabase
    .from('problems')
    .delete()
    .in('id', problemsToDelete.map(p => p.id))
    .select('*');

  if (deleteError) {
    console.error('Error deleting problems:', deleteError);
    throw deleteError;
  }

  console.log('Successfully deleted', deletedData?.length || 0, 'problems');
  return deletedData;
}

export async function addProblemLog(userId: string, numProblems: number, topicName: string = 'General') {
  console.log('Adding problem log:', { userId, numProblems, topicName });
  
  const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
  
  // First, get the topic ID
  const { data: topic, error: topicError } = await supabase
    .from('topics')
    .select('id')
    .eq('name', topicName)
    .single();

  if (topicError) {
    console.error('Error finding topic:', topicError);
    throw topicError;
  }

  if (!topic) {
    console.error('Topic not found:', topicName);
    throw new Error(`Topic "${topicName}" not found`);
  }

  console.log('Found topic:', topic);

  // Check if there's already a log for today and this topic
  const { data: existingLog, error: existingLogError } = await supabase
    .from('problem_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topic.id)
    .eq('date', today)
    .single();

  if (existingLogError && existingLogError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
    console.error('Error checking existing log:', existingLogError);
    throw existingLogError;
  }

  console.log('Existing log:', existingLog);

  if (existingLog) {
    // Update existing log
    const { data, error } = await supabase
      .from('problem_logs')
      .update({
        problems_completed: existingLog.problems_completed + numProblems
      })
      .eq('id', existingLog.id)
      .select();

    if (error) {
      console.error('Error updating existing log:', error);
      throw error;
    }

    console.log('Updated existing log:', data);
    return data;
  } else {
    // Create new log
    const { data, error } = await supabase
      .from('problem_logs')
      .insert([
        {
          user_id: userId,
          topic_id: topic.id,
          problems_completed: numProblems,
          date: today
        }
      ])
      .select();

    if (error) {
      console.error('Error creating new log:', error);
      throw error;
    }

    console.log('Created new log:', data);
    return data;
  }
}

export async function deleteAllProblemLogs(userId: string) {
  console.log('Attempting to delete all problem logs for user', userId);

  // First, get the count of logs to be deleted
  const { count, error: countError } = await supabase
    .from('problem_logs')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (countError) {
    console.error('Error counting problem logs:', countError);
    throw countError;
  }

  console.log('Found', count, 'problem logs to delete');

  if (!count) {
    console.log('No problem logs to delete');
    return [];
  }

  // Delete all logs
  const { data: deletedData, error: deleteError } = await supabase
    .from('problem_logs')
    .delete()
    .eq('user_id', userId)
    .select();
    
  if (deleteError) {
    console.error('Error deleting all problem logs:', deleteError);
    throw deleteError;
  }

  console.log('Successfully deleted', deletedData?.length || 0, 'problem logs');
  return deletedData;
}

export async function deleteRecentProblemLogs(userId: string, count: number) {
  console.log('Attempting to delete', count, 'recent problem logs for user', userId);
  
  // Get the most recent logs to delete
  const { data: logsToDelete, error: fetchError } = await supabase
    .from('problem_logs')
    .select('id, date')
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(count);

  if (fetchError) {
    console.error('Error fetching problem logs to delete:', fetchError);
    throw fetchError;
  }
  
  if (!logsToDelete?.length) {
    console.log('No problem logs found to delete');
    return [];
  }

  console.log('Found', logsToDelete.length, 'logs to delete');

  // Delete the selected logs
  const { data: deletedData, error: deleteError } = await supabase
    .from('problem_logs')
    .delete()
    .in('id', logsToDelete.map(p => p.id))
    .select();

  if (deleteError) {
    console.error('Error deleting problem logs:', deleteError);
    throw deleteError;
  }

  console.log('Successfully deleted', deletedData?.length || 0, 'problem logs');
  return deletedData;
}

export async function getProblemLogs(userId: string) {
  console.log('Fetching problem logs for user:', userId);
  
  const { data, error } = await supabase
    .from('problem_logs')
    .select(`
      *,
      topic:topics(name)
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false });
    
  if (error) {
    console.error('Error fetching problem logs:', error);
    throw error;
  }
  
  console.log('Fetched problem logs:', data);
  return data || [];
}

export async function getTotalCompletedProblems(userId: string) {
  console.log('Fetching total problems for user:', userId);
  
  const { data: logs, error } = await supabase
    .from('problem_logs')
    .select('problems_completed')
    .eq('user_id', userId);
    
  if (error) {
    console.error('Error fetching problem logs:', error);
    throw error;
  }
  
  if (!logs) {
    console.log('No problem logs found for user:', userId);
    return 0;
  }
  
  const total = logs.reduce((sum, log) => sum + log.problems_completed, 0);
  console.log('Total problems:', total);
  return total;
}
