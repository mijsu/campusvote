
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, Vote, Lock, CheckCircle, Users, Clock, Eye, EyeOff, Moon, Sun } from "lucide-react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

interface LandingPageProps {
  onLogin?: (credentials: { studentId: string; password: string; role: 'student' | 'admin' }) => void;
  onSignup?: (userData: { studentId: string; name: string; email: string; password: string }) => void;
  onThemeToggle?: () => void;
  isDark?: boolean;
  isLoading?: boolean;
  loginError?: string;
  signupError?: string;
}

export default function LandingPage({ 
  onLogin, 
  onSignup, 
  onThemeToggle, 
  isDark, 
  isLoading, 
  loginError, 
  signupError 
}: LandingPageProps) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuthModal = (mode: 'login' | 'signup') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  const handleLogin = (credentials: { studentId: string; password: string; role: 'student' | 'admin' }) => {
    onLogin?.(credentials);
  };

  const handleSignup = (userData: { studentId: string; name: string; email: string; password: string }) => {
    onSignup?.(userData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Navigation Header */}
      <nav className="fixed top-0 w-full z-40 bg-background/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-xl font-semibold">University Elections</h1>
              <p className="text-xs text-muted-foreground">Online Voting System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={onThemeToggle}
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => openAuthModal('login')}
            >
              Sign In
            </Button>
            
            <Button
              onClick={() => openAuthModal('signup')}
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="secondary" className="mb-6">
            <Shield className="mr-1 h-3 w-3" />
            Secure • Fair • Efficient
          </Badge>
          
          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-foreground to-primary bg-clip-text text-transparent mb-6">
            Online Voting System
          </h1>
          
          <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
            Experience the future of university elections with our secure, transparent, and user-friendly voting platform. 
            Your voice matters, and we make sure it's heard.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => openAuthModal('login')}
            >
              <Vote className="mr-2 h-5 w-5" />
              Start Voting
            </Button>
            
            <Button
              variant="outline"
              size="lg"
              className="text-lg px-8 py-6"
              onClick={() => openAuthModal('signup')}
            >
              Create Account
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Secure</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">∞</div>
              <div className="text-sm text-muted-foreground">Transparent</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/20">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Why Choose Our Platform?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built with cutting-edge technology to ensure every vote counts and every voice is heard.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Lock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">End-to-End Security</h3>
                <p className="text-sm text-muted-foreground">
                  Military-grade encryption protects your vote from submission to counting.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Verifiable Results</h3>
                <p className="text-sm text-muted-foreground">
                  Complete transparency with audit trails and real-time result verification.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Easy Access</h3>
                <p className="text-sm text-muted-foreground">
                  Vote from anywhere, anytime during the election period with your student ID.
                </p>
              </CardContent>
            </Card>
            
            <Card className="border-0 shadow-lg bg-card/50 backdrop-blur-sm">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Real-time Updates</h3>
                <p className="text-sm text-muted-foreground">
                  Stay informed with live election status and instant result notifications.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">Simple. Secure. Swift.</h2>
            <p className="text-xl text-muted-foreground">
              Participating in university elections has never been easier.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
                1
              </div>
              <h3 className="text-xl font-semibold mb-2">Create Account</h3>
              <p className="text-muted-foreground">
                Register with your student ID and verify your identity to get started.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
                2
              </div>
              <h3 className="text-xl font-semibold mb-2">Browse Elections</h3>
              <p className="text-muted-foreground">
                View active elections, candidate information, and make informed decisions.
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-2xl font-bold mx-auto mb-4">
                3
              </div>
              <h3 className="text-xl font-semibold mb-2">Cast Your Vote</h3>
              <p className="text-muted-foreground">
                Select your candidates and submit your encrypted vote securely.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t bg-muted/10">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-lg font-semibold">University Elections</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Empowering democratic participation through secure digital voting.
          </p>
          <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Protected by AES-256 encryption</span>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden">
          <div className="bg-gradient-to-br from-primary/5 to-accent/5 p-6">
            <DialogHeader className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <Shield className="h-10 w-10 text-primary" />
              </div>
              <DialogTitle className="text-2xl">
                {authMode === 'login' ? 'Welcome Back' : 'Get Started'}
              </DialogTitle>
            </DialogHeader>
            
            <Tabs value={authMode} onValueChange={(value) => setAuthMode(value as 'login' | 'signup')}>
              <TabsList className="grid w-full grid-cols-2 mb-6">
                <TabsTrigger value="login">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="login" className="mt-0">
                <div className="px-2">
                  <LoginForm
                    onLogin={handleLogin}
                    isLoading={isLoading}
                    error={loginError}
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="mt-0">
                <div className="px-2">
                  <SignupForm
                    onSignup={handleSignup}
                    isLoading={isLoading}
                    error={signupError}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
