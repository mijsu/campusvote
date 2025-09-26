import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Users, Vote, Clock, CheckCircle, BarChart3 } from "lucide-react";

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
  }[];
  hasVoted?: boolean;
  votedPositions?: string[];
}

interface ElectionCardProps {
  election: Election;
  onVote?: (electionId: string) => void;
  onViewResults?: (electionId: string) => void;
  onViewDetails?: (electionId: string) => void;
  userRole?: 'student' | 'admin';
}

export default function ElectionCard({ election, onVote, onViewResults, onViewDetails, userRole }: ElectionCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'secondary';
      case 'active': return 'default';
      case 'closed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'upcoming': return <Clock className="h-3 w-3" />;
      case 'active': return <Vote className="h-3 w-3" />;
      case 'closed': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const canVote = election.status === 'active' && !election.hasVoted && userRole === 'student';
  const canViewResults = election.status === 'closed' || userRole === 'admin';

  return (
    <Card
      className="hover-elevate cursor-pointer transition-all duration-200 hover:shadow-lg hover:border-primary/20"
      onClick={() => onViewDetails?.(election.id)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg">{election.title}</CardTitle>
            <CardDescription>{election.description}</CardDescription>
          </div>
          <Badge variant={getStatusColor(election.status)} className="flex items-center gap-1">
            {getStatusIcon(election.status)}
            {election.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Starts: {formatDate(election.startDate)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Ends: {formatDate(election.endDate)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span>{election.positions.length} positions available</span>
        </div>

        {election.hasVoted && (
          <div className="flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="h-4 w-4" />
            <span>You have voted in this election</span>
          </div>
        )}

        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="outline"
            onClick={() => onViewDetails?.(election.id)}
            data-testid={`button-details-${election.id}`}
            className="flex-1"
          >
            View Details
          </Button>

          {canVote && (
            <Button
              onClick={() => onVote?.(election.id)}
              data-testid={`button-vote-${election.id}`}
              className="flex-1"
            >
              <Vote className="mr-2 h-4 w-4" />
              Cast Vote
            </Button>
          )}

          {canViewResults && (
            <Button
              variant="outline"
              onClick={() => onViewResults?.(election.id)}
              data-testid={`button-results-${election.id}`}
              className="flex-1"
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              View Results
            </Button>
          )}

          {election.status === 'upcoming' && (
            <Button variant="outline" disabled className="flex-1">
              Voting Not Started
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}