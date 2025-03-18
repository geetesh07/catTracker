-- Create topics table
create table public.topics (
    id uuid not null default uuid_generate_v4(),
    name text not null unique,
    created_at timestamp with time zone not null default now(),
    primary key (id)
);

-- Create problem_logs table
create table public.problem_logs (
    id uuid not null default uuid_generate_v4(),
    user_id uuid not null references auth.users(id) on delete cascade,
    topic_id uuid not null references public.topics(id) on delete cascade,
    problems_completed integer not null,
    date date not null default current_date,
    created_at timestamp with time zone not null default now(),
    primary key (id)
);

-- Enable RLS
alter table public.topics enable row level security;
alter table public.problem_logs enable row level security;

-- Create policies for topics
create policy "Everyone can view topics"
    on public.topics
    for select
    using (true);

-- Create policies for problem_logs
create policy "Users can view all problem logs"
    on public.problem_logs
    for select
    using (true);

create policy "Users can insert their own problem logs"
    on public.problem_logs
    for insert
    with check (auth.uid() = user_id);

create policy "Users can update their own problem logs"
    on public.problem_logs
    for update
    using (auth.uid() = user_id);

create policy "Users can delete their own problem logs"
    on public.problem_logs
    for delete
    using (auth.uid() = user_id);

-- Insert default topics
insert into public.topics (name) values
    ('General'),
    ('Quantitative Aptitude'),
    ('Data Interpretation & Logical Reasoning'),
    ('Verbal Ability & Reading Comprehension'); 