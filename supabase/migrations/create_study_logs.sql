-- Create study_logs table
create table public.study_logs (
    id uuid not null default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null,
    description text,
    date date not null default current_date,
    created_at timestamp with time zone not null default now(),
    primary key (id)
);

-- Create view to join study_logs with user profiles
create or replace view public.study_logs_with_users as
select 
    sl.*,
    u.email,
    u.raw_user_meta_data->>'full_name' as full_name
from public.study_logs sl
join auth.users u on u.id = sl.user_id;

-- Enable RLS
alter table public.study_logs enable row level security;

-- Create policies
create policy "Users can view their own logs and logs of others"
    on public.study_logs
    for select
    using (true);

create policy "Users can insert their own logs"
    on public.study_logs
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own logs"
    on public.study_logs
    for update
    using (auth.uid() = user_id);

create policy "Users can delete their own logs"
    on public.study_logs
    for delete
    using (auth.uid() = user_id); 