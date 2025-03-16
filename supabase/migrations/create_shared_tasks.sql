-- Create shared tasks table
create table public.shared_tasks (
    id uuid default gen_random_uuid() primary key,
    title text not null,
    description text,
    due_date date not null,
    created_by uuid references auth.users(id) not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create task completion tracking table
create table public.task_completions (
    id uuid default gen_random_uuid() primary key,
    task_id uuid references public.shared_tasks(id) on delete cascade not null,
    user_id uuid references auth.users(id) not null,
    completed_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(task_id, user_id)
);

-- Enable RLS
alter table public.shared_tasks enable row level security;
alter table public.task_completions enable row level security;

-- Policies for shared_tasks
create policy "Anyone can view shared tasks"
    on public.shared_tasks
    for select
    using (true);

create policy "Authenticated users can create shared tasks"
    on public.shared_tasks
    for insert
    with check (auth.uid() is not null);

create policy "Only creator can delete their tasks"
    on public.shared_tasks
    for delete
    using (auth.uid() = created_by);

-- Policies for task_completions
create policy "Users can view all task completions"
    on public.task_completions
    for select
    using (true);

create policy "Users can mark their own task completions"
    on public.task_completions
    for insert
    with check (auth.uid() = user_id);

create policy "Users can only delete their own task completions"
    on public.task_completions
    for delete
    using (auth.uid() = user_id); 