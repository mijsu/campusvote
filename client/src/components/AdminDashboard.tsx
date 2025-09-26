import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Plus, Users, Vote, Calendar, Activity, Download, Eye, Edit, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import UserList, { User } from "./UserList";
import AnnouncementList, { Announcement } from "./AnnouncementList";
import ElectionManagementModal from "./ElectionManagementModal";
import ResultsModal from "./ResultsModal";
import ElectionDetailsModal from "./ElectionDetailsModal";

interface Election {
  id: string;
  title: string;
  status: 'upcoming' | 'active' | 'closed';
  startDate: string;
  endDate: string;
  totalVotes?: number;
  eligibleVoters?: number;
  positions: Position[];
  description?: string;
}

interface Candidate {
  id: string;
  name: string;
  bio: string;
  photo?: string;
  goals?: string;
}

interface Position {
  id: string;
  title: string;
  maxVotes: number;
  candidates: Candidate[];
}

interface ElectionDetails extends Election {
  description: string;
  positions: Position[];
}

interface AdminDashboardProps {
  elections?: Election[];
  onCreateElection?: () => void;
  onEditElection?: (id: string) => void;
  onDeleteElection?: (id: string) => void;
  onViewResults?: (id: string) => void;
  onExportResults?: (id: string) => void;
}

export default function AdminDashboard({ 
  elections: initialElections = [], 
  onCreateElection, 
  onEditElection, 
  onDeleteElection, 
  onViewResults, 
  onExportResults 
}: AdminDashboardProps) {
  const [elections, setElections] = useState<Election[]>(initialElections);
  const [users, setUsers] = useState<User[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [tab, setTab] = useState('elections');

  // modals & selection
  const [showElectionModal, setShowElectionModal] = useState(false);
  const [selectedElection, setSelectedElection] = useState<Election | Partial<Election> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [selectedResults, setSelectedResults] = useState<any>(null);
  const [isLoadingResults, setIsLoadingResults] = useState(false);
  const [showElectionDetails, setShowElectionDetails] = useState(false);
  const [selectedElectionDetails, setSelectedElectionDetails] = useState<ElectionDetails | null>(null);

  // delete confirmation (single instance)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [electionToDelete, setElectionToDelete] = useState<Election | null>(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const res = await fetch('/api/elections', { credentials: 'include' });
        if (res.ok) setElections(await res.json());
      } catch (err) { console.error(err); }
      try {
        const res = await fetch('/api/admin/users', { credentials: 'include' });
        if (res.ok) setUsers(await res.json());
      } catch (err) { console.error(err); }
      try {
        const res = await fetch('/api/announcements', { credentials: 'include' });
        if (res.ok) setAnnouncements(await res.json());
      } catch (err) { console.error(err); }
    }
    fetchAll();
  }, []);

  const stats = {
    totalElections: elections.length,
    activeElections: elections.filter(e => e.status === 'active').length,
    totalVotes: elections.reduce((sum, e) => sum + (typeof e.totalVotes === 'number' ? e.totalVotes : 0), 0),
    avgTurnout: (() => {
      const valid = elections.filter(e => typeof e.eligibleVoters === 'number' && e.eligibleVoters > 0);
      if (valid.length === 0) return 0;
      const total = valid.reduce((s, e) => s + ((e.totalVotes || 0) / (e.eligibleVoters || 1) * 100), 0);
      return Math.round(total / valid.length);
    })()
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'secondary';
      case 'active': return 'default';
      case 'closed': return 'destructive';
      default: return 'secondary';
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleCreateElection = () => { setSelectedElection(null); setShowElectionModal(true); };
  const handleEditElection = (id: string) => { const e = elections.find(x => x.id === id); if (e) { setSelectedElection(e); setShowElectionModal(true); } };
  const handleDeleteElection = (id: string) => { const e = elections.find(x => x.id === id); setElectionToDelete(e || null); setShowDeleteModal(true); };
  const confirmDeleteElection = async () => {
    if (!electionToDelete) return;
    try {
      const res = await fetch(`/api/elections/${electionToDelete.id}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) setElections(prev => prev.filter(x => x.id !== electionToDelete.id));
    } catch (err) { console.error(err); }
    setShowDeleteModal(false);
    setElectionToDelete(null);
  };

  const handleViewResults = async (electionId: string) => {
    setIsLoadingResults(true); setShowResultsModal(true); setSelectedResults(null);
    try {
      const res = await fetch(`/api/admin/elections/${electionId}/results`, { credentials: 'include' });
      if (res.ok) setSelectedResults(await res.json());
    } catch (err) { console.error(err); }
    setIsLoadingResults(false);
  };

  const handleViewDetails = async (electionId: string) => {
    try {
      const res = await fetch(`/api/elections/${electionId}`, { credentials: 'include' });
      if (res.ok) { const details: ElectionDetails = await res.json(); setSelectedElectionDetails(details); setShowElectionDetails(true); }
    } catch (err) { console.error(err); }
  };
  const handleCloseDetails = () => { setShowElectionDetails(false); setSelectedElectionDetails(null); };

  // chart data
  const chartData = elections.map(e => ({ name: e.title.slice(0, 20) + (e.title.length > 20 ? '...' : ''), votes: e.totalVotes || 0, turnout: e.eligibleVoters && e.eligibleVoters > 0 ? Math.round(((e.totalVotes || 0) / e.eligibleVoters) * 100) : 0 }));
  const statusData = [
    { name: 'Active', value: elections.filter(e => e.status === 'active').length, color: 'hsl(var(--primary))' },
    { name: 'Upcoming', value: elections.filter(e => e.status === 'upcoming').length, color: 'hsl(var(--secondary))' },
    { name: 'Closed', value: elections.filter(e => e.status === 'closed').length, color: 'hsl(var(--destructive))' }
  ].filter(x => x.value > 0);

  // minimal save handler placeholder to satisfy prop type — wiring full save is a separate task
  const handleSaveElection = async (data: any) => {
    setIsSubmitting(true);
    // TODO: call API to create/update election, refresh list
    setTimeout(() => setIsSubmitting(false), 400);
  };

  // Recompute stats and refresh elections
  const [isRecomputing, setIsRecomputing] = useState(false);
  const handleRecomputeStats = async () => {
    setIsRecomputing(true);
    try {
      const res = await fetch('/api/admin/elections/recompute-all-stats', { method: 'POST', credentials: 'include' });
      if (res.ok) {
        // After recompute, refresh elections
        const electionsRes = await fetch('/api/elections', { credentials: 'include' });
        if (electionsRes.ok) setElections(await electionsRes.json());
      }
    } catch (err) {
      console.error('Failed to recompute stats:', err);
    }
    setIsRecomputing(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage elections and monitor voting activity</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleCreateElection} data-testid="button-create-election"><Plus className="mr-2 h-4 w-4" />Create Election</Button>
          <Button onClick={handleRecomputeStats} disabled={isRecomputing} variant="outline" data-testid="button-recompute-stats">
            {isRecomputing ? 'Recomputing...' : 'Recompute Stats'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Elections</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalElections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Elections</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeElections}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Votes Cast</CardTitle>
            <Vote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVotes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Turnout</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgTurnout}%</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="elections">Elections</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="announcements">Announcements</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="elections" className="space-y-4">
          <div className="grid gap-4">
            {elections.map((election) => {
              const votes = typeof election.totalVotes === 'number' ? election.totalVotes : 0;
              const eligible = typeof election.eligibleVoters === 'number' ? election.eligibleVoters : 0;
              const turnoutPercent = eligible > 0 ? Math.round((votes / eligible) * 100) : 0;
              const progressValue = eligible > 0 ? Math.max(0, Math.min(100, (votes / eligible) * 100)) : 0;

              return (
                <Card key={election.id} className="hover-elevate cursor-pointer" onClick={() => handleViewDetails(election.id)}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{election.title}</CardTitle>
                        <CardDescription>{formatDate(election.startDate)} - {formatDate(election.endDate)}</CardDescription>
                      </div>
                      <Badge variant={getStatusColor(election.status)}>{election.status}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div><span className="text-muted-foreground">Votes Cast:</span><div className="font-medium">{votes}</div></div>
                      <div><span className="text-muted-foreground">Eligible Voters:</span><div className="font-medium">{eligible}</div></div>
                      <div><span className="text-muted-foreground">Turnout:</span><div className="font-medium">{turnoutPercent}%</div></div>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleEditElection(election.id); }} data-testid={`button-edit-${election.id}`}><Edit className="mr-2 h-3 w-3"/>Edit</Button>
                      {election.status === 'closed' && (
                        <>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleViewResults(election.id); }} data-testid={`button-view-results-${election.id}`}><Eye className="mr-2 h-3 w-3"/>Results</Button>
                          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); onExportResults?.(election.id); }} data-testid={`button-export-${election.id}`}><Download className="mr-2 h-3 w-3"/>Export</Button>
                        </>
                      )}
                      <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteElection(election.id); }} data-testid={`button-delete-${election.id}`} className="text-destructive hover:text-destructive"><Trash2 className="mr-2 h-3 w-3"/>Delete</Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {elections.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Elections Created</h3>
                  <p className="text-muted-foreground text-center mb-4">Get started by creating your first election</p>
                  <Button onClick={handleCreateElection}><Plus className="mr-2 h-4 w-4"/>Create Election</Button>
                </CardContent>
              </Card>
            )}

            <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Election</DialogTitle>
                  <DialogDescription>Are you sure you want to delete the election "{electionToDelete?.title}"? This action cannot be undone.</DialogDescription>
                </DialogHeader>
                <div className="flex justify-end gap-2 mt-4">
                  <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={confirmDeleteElection}>Delete</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <UserList users={users} onUserCreated={user => setUsers(prev => [...prev, user])} onUserDeleted={studentId => setUsers(prev => prev.filter(u => u.studentId !== studentId))} />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <AnnouncementList announcements={announcements} isAdmin={true} onAnnouncementCreated={a => setAnnouncements(prev => [...prev, a])} onAnnouncementDeleted={id => setAnnouncements(prev => prev.filter(a => a.id !== id))} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle>Voter Turnout by Election</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}><CartesianGrid strokeDasharray="3 3"/><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="turnout" fill="hsl(var(--primary))"/></BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Election Status Distribution</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={60} outerRadius={120} paddingAngle={5} dataKey="value">
                      {statusData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

  <ElectionManagementModal isOpen={showElectionModal} onClose={() => setShowElectionModal(false)} election={selectedElection ? { id: selectedElection.id ?? '', title: selectedElection.title ?? '', description: selectedElection.description ?? '', startDate: selectedElection.startDate ?? '', endDate: selectedElection.endDate ?? '', positions: Array.isArray((selectedElection as any).positions) ? (selectedElection as any).positions : [] } : null} onSave={handleSaveElection} isSubmitting={isSubmitting} />

      <ResultsModal isOpen={showResultsModal} onClose={() => setShowResultsModal(false)} results={selectedResults} isLoading={isLoadingResults} />

      <ElectionDetailsModal isOpen={showElectionDetails} onClose={handleCloseDetails} election={selectedElectionDetails} />
    </div>
  );
}