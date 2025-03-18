-- Create problems table
create table public.problems (
    id uuid not null default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    completed_at timestamp with time zone not null,
    description text,
    category text,
    created_at timestamp with time zone not null default now(),
    primary key (id)
);

-- Enable RLS
alter table public.problems enable row level security;

-- Create policies
create policy "Users can view all problems"
    on public.problems
    for select
    using (true);

create policy "Users can insert their own problems"
    on public.problems
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own problems"
    on public.problems
    for update
    using (auth.uid() = user_id);

create policy "Users can delete their own problems"
    on public.problems
    for delete
    using (auth.uid() = user_id); 