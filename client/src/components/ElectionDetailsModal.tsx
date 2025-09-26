
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, Users, Vote, Target } from "lucide-react";

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

interface Election {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'closed';
  positions: Position[];
}

interface ElectionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election | null;
}

export default function ElectionDetailsModal({ isOpen, onClose, election }: ElectionDetailsModalProps) {
  if (!election) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'secondary';
      case 'active': return 'default';
      case 'closed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Vote className="h-6 w-6 text-primary" />
            {election.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            {election.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Election Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Election Information
                </span>
                <Badge variant={getStatusColor(election.status)} className="text-sm">
                  {election.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Start Date</span>
                </div>
                <div className="font-medium">{formatDate(election.startDate)}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>End Date</span>
                </div>
                <div className="font-medium">{formatDate(election.endDate)}</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>Positions Available</span>
                </div>
                <div className="font-medium">{election.positions.length} positions</div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Vote className="h-4 w-4" />
                  <span>Total Candidates</span>
                </div>
                <div className="font-medium">
                  {election.positions.reduce((sum, pos) => sum + pos.candidates.length, 0)} candidates
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Positions and Candidates */}
          <div className="space-y-6">
            {election.positions.map((position) => (
              <Card key={position.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    {position.title}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {position.candidates.length} candidate{position.candidates.length !== 1 ? 's' : ''} running
                    • Select up to {position.maxVotes} candidate{position.maxVotes !== 1 ? 's' : ''}
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {position.candidates.map((candidate) => (
                      <Card key={candidate.id} className="border-l-4 border-l-primary/20">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row gap-6">
                            {/* Candidate Photo and Basic Info */}
                            <div className="flex flex-col sm:flex-row items-start gap-4">
                              <Avatar className="h-24 w-24 border-2 border-muted">
                                <AvatarImage 
                                  src={candidate.photo ? `/uploads/${candidate.photo}` : undefined} 
                                  alt={candidate.name}
                                />
                                <AvatarFallback className="text-lg font-semibold">
                                  {getInitials(candidate.name)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="space-y-2">
                                <h3 className="text-xl font-semibold">{candidate.name}</h3>
                                <Badge variant="outline" className="w-fit">
                                  Candidate for {position.title}
                                </Badge>
                              </div>
                            </div>

                            {/* Candidate Details */}
                            <div className="flex-1 space-y-4">
                              <div>
                                <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2">
                                  Background
                                </h4>
                                <p className="text-sm leading-relaxed">{candidate.bio}</p>
                              </div>
                              
                              {candidate.goals && (
                                <div>
                                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                                    <Target className="h-4 w-4" />
                                    Vision & Goals
                                  </h4>
                                  <p className="text-sm leading-relaxed">{candidate.goals}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
