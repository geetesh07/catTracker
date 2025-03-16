import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { Menu, X, Moon, Sun, LogOut, User, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  
  useEffect(() => {
    // Check if dark mode is enabled
    if (localStorage.theme === 'dark' || (!('theme' in localStorage) && 
      window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    } else {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    }
    
    // Get current user
    const getCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUser(data?.user);
    };
    
    getCurrentUser();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
    
    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);
  
  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.theme = 'light';
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.theme = 'dark';
      setIsDark(true);
    }
  };
  
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  
  const closeMenu = () => setIsOpen(false);
  
  const navLinks = [
    { href: "/", label: "Home" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/leaderboard", label: "Leaderboard", icon: Trophy },
    { href: "/profile", label: "Profile" }
  ];
  
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
            CATPrepTracker
          </span>
        </Link>
        
        {/* Desktop navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 space-x-4">
          <div className="flex space-x-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "transition-all duration-200 px-3 py-2 rounded-md text-sm font-medium flex items-center",
                  location.pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
                onClick={closeMenu}
              >
                {link.icon && <link.icon className="h-4 w-4 mr-1" />}
                {link.label}
              </Link>
            ))}
          </div>
        </div>
          
        <div className="flex items-center space-x-2 border-l border-border pl-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="rounded-full"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          
          {user ? (
            <>
              <Button 
                variant="ghost" 
                size="icon"
                asChild
                className="rounded-full"
              >
                <Link to="/profile">
                  <User size={18} />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-full"
              >
                <LogOut size={18} />
              </Button>
            </>
          ) : (
            <Button 
              variant="default" 
              size="sm"
              asChild
              className="rounded-full"
            >
              <Link to="/login">Login</Link>
            </Button>
          )}
        </div>
        
        {/* Mobile menu button */}
        <div className="flex items-center md:hidden">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={toggleTheme}
            className="mr-2 rounded-full"
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setIsOpen(!isOpen)}
            className="rounded-full"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden animate-fade-in">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-b border-border">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium flex items-center",
                  location.pathname === link.href
                    ? "text-foreground"
                    : "text-muted-foreground"
                )}
                onClick={closeMenu}
              >
                {link.icon && <link.icon className="h-4 w-4 mr-1" />}
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="w-full justify-start"
              >
                <LogOut size={16} className="mr-2" />
                Logout
              </Button>
            ) : (
              <Link
                to="/login"
                className="block px-3 py-2 rounded-md text-base font-medium text-muted-foreground"
                onClick={closeMenu}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
