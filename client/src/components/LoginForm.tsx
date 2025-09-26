
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, User, Lock, AlertCircle } from "lucide-react";

interface LoginFormProps {
  onLogin?: (credentials: { studentId: string; password: string; role: 'student' | 'admin' }) => void;
  onShowSignup?: () => void;
  isLoading?: boolean;
  error?: string;
}

export default function LoginForm({ onLogin, onShowSignup, isLoading, error }: LoginFormProps) {
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Determine role based on studentId pattern
    // Admin accounts typically start with 'admin' or have specific patterns
    const role = studentId.toLowerCase().includes('admin') ? 'admin' : 'student';
    
    onLogin?.({
      studentId,
      password,
      role
    });
  };

  return (
    <div>
      <div className="space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="studentId" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                ID
              </Label>
              <Input
                id="studentId"
                type="text"
                placeholder="Enter your ID"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                required
                data-testid="input-student-id"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Password
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                data-testid="input-password"
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !studentId || !password}
              data-testid="button-login"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
      </div>
    </div>
  );
}
