import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Moon, Sun, Shield, LogOut, User } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  user?: {
    studentId?: string;
    name: string;
    role: 'student' | 'admin';
  };
  onThemeToggle?: () => void;
  onLogout?: () => void;
  isDark?: boolean;
}

export default function Header({ user, onThemeToggle, onLogout, isDark }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold text-foreground">University Elections</h1>
              <p className="text-xs text-muted-foreground">Secure Online Voting System</p>
            </div>
          </div>
          <Badge variant="secondary" className="hidden sm:flex">
            <Shield className="mr-1 h-3 w-3" />
            Encrypted
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {user && (
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">{user.name}</span>
              <Badge variant={user.role === 'admin' ? 'destructive' : 'default'}>
                {user.role}
              </Badge>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            data-testid="button-theme-toggle"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          
          {user && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onLogout}
              data-testid="button-logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}