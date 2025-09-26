import { useState, useEffect } from "react";
import { ThemeProvider, useTheme } from "./ThemeProvider";
import Header from "./Header";
import LoginForm from "./LoginForm";
import ElectionCard from "./ElectionCard";
import VotingModal from "./VotingModal";
import AdminDashboard from "./AdminDashboard";
import ResultsModal from "./ResultsModal";
import SignupForm from "./SignupForm";
import ElectionDetailsModal from "./ElectionDetailsModal";
import LandingPage from "./LandingPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { CheckCircle, Vote, Calendar, Users, PartyPopper } from "lucide-react";
import AnnouncementList, { Announcement } from "./AnnouncementList";

// Types
interface User {
  studentId: string;
  name: string;
  role: 'student' | 'admin';
  email: string;
  votedElections: Record<string, string[]>;
}

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  positions: {
    id: string;
    title: string;
    candidateCount: number;
    maxVotes: number;
    candidates: {
      id: string;
      name: string;
      bio: string;
      photo?: string;
    }[];
  }[];
  hasVoted?: boolean;
  votedPositions?: string[];
  totalVotes?: number;
  eligibleVoters?: number;
}

function VotingSystemAppInner() {
  const { theme, setTheme } = useTheme();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [elections, setElections] = useState<Election[]>([]);
  const [selectedElection, setSelectedElection] = useState<Election | null>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedResults, setSelectedResults] = useState(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);
  const [signupError, setSignupError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showElectionDetails, setShowElectionDetails] = useState(false);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState<Election | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Announcements state (for demo, static; later fetch from backend)
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  // Fetch announcements from backend
  useEffect(() => {
    async function fetchAnnouncements() {
      try {
        const res = await fetch('/api/announcements', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setAnnouncements(data);
        } else {
          setAnnouncements([]);
        }
      } catch (e) {
        setAnnouncements([]);
      }
    }
    fetchAnnouncements();
  }, []);

  // Check for existing session on load
  useEffect(() => {
    checkAuth();
  }, []);

  // Load elections when user changes
  useEffect(() => {
    if (currentUser) {
      loadElections();
    }
  }, [currentUser]);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });
      if (response.ok) {
        const { user } = await response.json();
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadElections = async () => {
    try {
      const response = await fetch('/api/elections', {
        credentials: 'include'
      });
      if (response.ok) {
        const electionsData = await response.json();
        console.log('Raw elections data:', electionsData);

        // Calculate status and add stats
        const now = new Date();
        const processedElections = electionsData.map((election: any) => {
          const startDate = new Date(election.startDate);
          const endDate = new Date(election.endDate);

          let status: 'upcoming' | 'active' | 'closed';
          if (now < startDate) {
            status = 'upcoming';
          } else if (now > endDate) {
            status = 'closed';
          } else {
            status = 'active';
          }

          // Ensure hasVoted is properly set based on votedPositions
          const hasVoted = Array.isArray(election.votedPositions) && election.votedPositions.length > 0;

          return {
            ...election,
            status,
            hasVoted,
            positions: election.positions.map((pos: any) => ({
              ...pos,
              candidateCount: pos.candidates.length
            })),
            totalVotes: election.totalVotes || 0,
            eligibleVoters: election.eligibleVoters || 1000 // Default if not set
          };
        });

        console.log('Processed elections:', processedElections);
        setElections(processedElections);
      } else {
        const errorData = await response.json();
        console.error('Failed to load elections:', response.status, response.statusText, errorData);
      }
    } catch (error) {
      console.error('Failed to load elections:', error);
    }
  };

  const handleLogin = async (credentials: { studentId: string; password: string; role: 'student' | 'admin' }) => {
    setIsLoggingIn(true);
    setLoginError('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
      });

      if (response.ok) {
        const { user } = await response.json();
        setCurrentUser(user);
      } else {
        const { error } = await response.json();
        setLoginError(error || 'Login failed');
      }
    } catch (error) {
      setLoginError('Network error. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignup = async (userData: { studentId: string; name: string; email: string; password: string }) => {
    setIsSigningUp(true);
    setSignupError('');

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        const { user } = await response.json();
        setCurrentUser(user);
        setShowSignup(false);
      } else {
        const { error } = await response.json();
        setSignupError(error || 'Signup failed');
      }
    } catch (error) {
      setSignupError('Network error. Please try again.');
    } finally {
      setIsSigningUp(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      setCurrentUser(null);
      setElections([]);
      setSelectedElection(null);
      setShowVotingModal(false);
    }
  };

  const handleVote = (electionId: string) => {
    const election = elections.find(e => e.id === electionId);
    if (election) {
      setSelectedElection(election);
      setShowVotingModal(true);
    }
  };

  const handleSubmitVote = async (votes: Record<string, string>) => {
    if (!selectedElection) return;

    console.log('Submitting votes:', votes);
    console.log('For election:', selectedElection.id);

    setIsSubmittingVote(true);

    try {
      const response = await fetch(`/api/elections/${selectedElection.id}/vote`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ votes }),
      });

      const responseData = await response.json();
      console.log('Vote submission response:', responseData);

      if (response.ok) {
        // Close the voting modal first
        setShowVotingModal(false);
        
        // Update current user's voted elections
        if (currentUser) {
          const updatedUser = {
            ...currentUser,
            votedElections: {
              ...currentUser.votedElections,
              [selectedElection.id]: Object.keys(votes)
            }
          };
          setCurrentUser(updatedUser);
        }

        // Show success modal
        setShowSuccessModal(true);

        // Update the elections list
        setElections(prevElections => prevElections.map(election => {
          if (election.id === selectedElection.id) {
            return {
              ...election,
              hasVoted: true,
              votedPositions: Object.keys(votes)
            };
          }
          return election;
        }));

        // Force a reload of elections from server
        setTimeout(() => loadElections(), 500);
      } else {
        console.error('Vote submission failed:', responseData.error);
      }
    } catch (error) {
      console.error('Vote submission error:', error);
    } finally {
      setIsSubmittingVote(false);
      setSelectedElection(null);
    }
  };

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleViewDetails = (electionId: string) => {
    const election = elections.find(e => e.id === electionId);
    if (election) {
      setSelectedElectionDetails(election);
      setShowElectionDetails(true);
    }
  };

  const handleViewResults = async (electionId: string) => {
    setIsLoadingResults(true);
    setShowResultsModal(true);
    setSelectedResults(null);

    try {
      // Use different endpoint based on user role
      const endpoint = currentUser?.role === 'admin' 
        ? `/api/admin/elections/${electionId}/results`
        : `/api/elections/${electionId}/results`;
        
      const response = await fetch(endpoint, {
        credentials: 'include'
      });

      if (response.ok) {
        const results = await response.json();
        setSelectedResults(results);
      } else {
        console.error('Failed to load results');
      }
    } catch (error) {
      console.error('Results loading error:', error);
    } finally {
      setIsLoadingResults(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Landing page with modal auth
  if (!currentUser) {
    return (
      <LandingPage
        onLogin={handleLogin}
        onSignup={handleSignup}
        onThemeToggle={handleThemeToggle}
        isDark={theme === 'dark'}
        isLoading={isLoggingIn || isSigningUp}
        loginError={loginError}
        signupError={signupError}
      />
    );
  }

  // Admin dashboard
  if (currentUser.role === 'admin') {
    return (
      <div className="min-h-screen bg-background">
        <Header
          user={currentUser}
          isDark={theme === 'dark'}
          onThemeToggle={handleThemeToggle}
          onLogout={handleLogout}
        />
        <main className="container mx-auto px-4 py-6">
          <AdminDashboard
            elections={elections.map(e => ({
              id: e.id,
              title: e.title,
              status: e.status,
              startDate: e.startDate,
              endDate: e.endDate,
              totalVotes: e.totalVotes || 0,
              eligibleVoters: e.eligibleVoters || 0,
              positions: e.positions
            }))}
            onCreateElection={() => console.log('Create election clicked')}
            onEditElection={(id) => console.log('Edit election:', id)}
            onDeleteElection={(id) => console.log('Delete election:', id)}
            onViewResults={handleViewResults}
            onExportResults={(id) => console.log('Export results:', id)}
          />
        </main>
      </div>
    );
  }

  // Student dashboard
  return (
    <div className="min-h-screen bg-background">
      <Header
        user={currentUser}
        isDark={theme === 'dark'}
        onThemeToggle={handleThemeToggle}
        onLogout={handleLogout}
      />
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold">Welcome, {currentUser.name}</h1>
            <p className="text-muted-foreground">
              Cast your vote in active elections below. Your vote is encrypted and secure.
            </p>
          </div>

          {/* Stats Cards */}
          {/* Dashboard Main Grid: Announcements (left), Stats (right) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Announcements Section (left, col-span-2 on desktop) */}
            <div className="md:col-span-2">
              <AnnouncementList announcements={announcements} />
            </div>
            {/* Stats Cards (right, col-span-1) */}
            <div className="flex flex-col gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
                  <Vote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {elections.filter(e => e.status === 'active').length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Votes Cast</CardTitle>
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {elections.filter(e => e.hasVoted).length}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Upcoming Elections</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {elections.filter(e => e.status === 'upcoming').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Elections List */}
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold">Elections</h2>

            {elections.map((election) => (
              <ElectionCard
                key={election.id}
                election={{
                  id: election.id,
                  title: election.title,
                  description: election.description,
                  startDate: election.startDate,
                  endDate: election.endDate,
                  status: election.status,
                  positions: election.positions.map(p => ({
                    id: p.id,
                    title: p.title,
                    candidateCount: p.candidateCount
                  })),
                  hasVoted: election.hasVoted,
                  votedPositions: election.votedPositions
                }}
                userRole="student"
                onVote={handleVote}
                onViewResults={handleViewResults}
                onViewDetails={handleViewDetails}
              />
            ))}

            {elections.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Vote className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Elections Available</h3>
                  <p className="text-muted-foreground text-center">
                    There are currently no active elections for you to vote in.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Voting Modal */}
      {selectedElection && (
        <VotingModal
          isOpen={showVotingModal}
          onClose={() => setShowVotingModal(false)}
          election={{
            id: selectedElection.id,
            title: selectedElection.title,
            positions: selectedElection.positions
          }}
          onSubmitVote={handleSubmitVote}
          isSubmitting={isSubmittingVote}
        />
      )}

      {/* Results Modal */}
      <ResultsModal
        isOpen={showResultsModal}
        onClose={() => setShowResultsModal(false)}
        results={selectedResults}
        isLoading={isLoadingResults}
      />

      {/* Election Details Modal */}
      <ElectionDetailsModal
        isOpen={showElectionDetails}
        onClose={() => setShowElectionDetails(false)}
        election={selectedElectionDetails}
      />

      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <PartyPopper className="h-6 w-6 text-green-500" />
              Vote Submitted Successfully!
            </DialogTitle>
            <DialogDescription className="text-center pt-4">
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="h-16 w-16 text-green-500" />
                <p className="text-lg">Thank you for participating in the election!</p>
                <p className="text-sm text-muted-foreground">
                  Your vote has been securely recorded and encrypted.
                </p>
                <Button
                  onClick={() => setShowSuccessModal(false)}
                  className="mt-4"
                >
                  Close
                </Button>
              </div>
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function VotingSystemApp() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="ovs-theme">
      <VotingSystemAppInner />
    </ThemeProvider>
  );
}