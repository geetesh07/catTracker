-- Create profiles table
create table public.profiles (
    id uuid not null references auth.users(id) on delete cascade,
    email text not null,
    full_name text not null,
    notification_frequency text default 'daily',
    created_at timestamp with time zone not null default now(),
    primary key (id)
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Create policies
create policy "Users can view all profiles"
    on public.profiles
    for select
    using (true);

create policy "Users can update their own profile"
    on public.profiles
    for update
    using (auth.uid() = id);

-- Create a trigger to create a profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (id, email, full_name)
    values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', 'Anonymous'));
    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user(); 