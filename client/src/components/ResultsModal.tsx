
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Trophy, Users, Vote, TrendingUp } from "lucide-react";

interface ResultsData {
  electionId: string;
  title: string;
  totalVotes: number;
  eligibleVoters: number;
  results: {
    positionId: string;
    positionTitle: string;
    candidates: {
      candidateId: string;
      candidateName: string;
      voteCount: number;
      percentage: number;
    }[];
  }[];
  generatedAt: string;
}

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  results: ResultsData | null;
  isLoading?: boolean;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658'];

export default function ResultsModal({ isOpen, onClose, results, isLoading }: ResultsModalProps) {
  if (!results && !isLoading) return null;

  const turnoutPercentage = results ? Math.round((results.totalVotes / results.eligibleVoters) * 100) : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {isLoading ? 'Loading Results...' : `Results: ${results?.title}`}
          </DialogTitle>
          <DialogDescription>
            {isLoading ? 'Please wait while we fetch the election results.' : 'Final election results and statistics'}
          </DialogDescription>
        </DialogHeader>
        
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Vote className="h-8 w-8 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Loading results...</p>
            </div>
          </div>
        ) : results && (
          <div className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Votes</CardTitle>
                  <Vote className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results.totalVotes}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Eligible Voters</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{results.eligibleVoters}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Turnout</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{turnoutPercentage}%</div>
                  <Progress value={turnoutPercentage} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Results by Position */}
            {results.results.map((position, positionIndex) => {
              const winner = position.candidates.reduce((prev, current) => 
                prev.voteCount > current.voteCount ? prev : current
              );
              
              const chartData = position.candidates.map(candidate => ({
                name: candidate.candidateName,
                votes: candidate.voteCount,
                percentage: candidate.percentage
              }));

              const pieData = position.candidates.map((candidate, index) => ({
                name: candidate.candidateName,
                value: candidate.voteCount,
                color: COLORS[index % COLORS.length]
              }));

              return (
                <Card key={position.positionId}>
                  <CardHeader>
                    <CardTitle className="text-xl">{position.positionTitle}</CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        <Trophy className="h-3 w-3 mr-1" />
                        Winner: {winner.candidateName}
                      </Badge>
                      <Badge variant="outline">
                        {winner.voteCount} votes ({winner.percentage.toFixed(1)}%)
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-6">
                    {/* Candidates List */}
                    <div className="space-y-3">
                      {position.candidates
                        .sort((a, b) => b.voteCount - a.voteCount)
                        .map((candidate, index) => (
                        <div key={candidate.candidateId} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                              <span className="font-medium">{candidate.candidateName}</span>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="font-medium">{candidate.voteCount} votes</div>
                            <div className="text-sm text-muted-foreground">{candidate.percentage.toFixed(1)}%</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Vote Distribution</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="votes" fill="hsl(var(--primary))" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-3">Percentage Breakdown</h4>
                        <ResponsiveContainer width="100%" height={200}>
                          <PieChart>
                            <Pie
                              data={pieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={40}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {pieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            
            <div className="text-sm text-muted-foreground text-center pt-4 border-t">
              Results generated on {new Date(results.generatedAt).toLocaleString()}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
