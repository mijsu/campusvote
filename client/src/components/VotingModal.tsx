import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Vote, CheckCircle, Users, AlertTriangle, Target } from "lucide-react";
import { useState } from "react";

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
  positions: Position[];
}

interface VotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  election: Election | null;
  onSubmitVote: (votes: Record<string, string>) => void;
  isSubmitting: boolean;
}

export default function VotingModal({ isOpen, onClose, election, onSubmitVote, isSubmitting }: VotingModalProps) {
  const [selectedVotes, setSelectedVotes] = useState<Record<string, string>>({});
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!election) return null;

  const handleVoteChange = (positionId: string, candidateId: string) => {
    setSelectedVotes(prev => ({
      ...prev,
      [positionId]: candidateId
    }));
  };

  const handleSubmit = () => {
    // Check if all positions have votes
    const requiredVotes = election.positions.length;
    const submittedVotes = Object.keys(selectedVotes).length;

    if (submittedVotes < requiredVotes) {
      return; // Don't proceed if not all votes are cast
    }

    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    console.log('Vote submitted and encrypted:', selectedVotes);
    onSubmitVote(selectedVotes);
    // Don't clear selectedVotes here as it might be needed if the submission fails
    setShowConfirmation(false);
  };

  const handleCancel = () => {
    setShowConfirmation(false);
  };

  const handleClose = () => {
    setSelectedVotes({});
    setShowConfirmation(false);
    onClose();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const requiredVotes = election.positions.length;
  const submittedVotes = Object.keys(selectedVotes).length;
  const canSubmit = submittedVotes === requiredVotes;

  if (showConfirmation) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl">
              <CheckCircle className="h-6 w-6 text-green-600" />
              Confirm Your Vote
            </DialogTitle>
            <DialogDescription className="text-base">
              Please review your selections before submitting your vote.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Once submitted, your vote cannot be changed. Please review carefully.
              </AlertDescription>
            </Alert>

            {election.positions.map((position) => {
              const selectedCandidateId = selectedVotes[position.id];
              const selectedCandidate = position.candidates.find(c => c.id === selectedCandidateId);

              return (
                <Card key={position.id} className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-primary" />
                      {position.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <Avatar className="h-16 w-16 border-2 border-muted">
                        <AvatarImage 
                          src={selectedCandidate?.photo ? `/uploads/${selectedCandidate.photo}` : undefined} 
                          alt={selectedCandidate?.name}
                        />
                        <AvatarFallback className="text-lg font-semibold">
                          {getInitials(selectedCandidate?.name || '')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <span className="font-semibold text-lg">{selectedCandidate?.name}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{selectedCandidate?.bio}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="flex gap-3">
              <Button 
                onClick={handleCancel} 
                variant="outline" 
                className="flex-1"
                disabled={isSubmitting}
              >
                Back to Edit
              </Button>
              <Button 
                onClick={handleConfirm} 
                className="flex-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Vote'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Vote className="h-6 w-6 text-primary" />
            Cast Your Vote - {election.title}
          </DialogTitle>
          <DialogDescription className="text-base">
            Select one candidate for each position. Your vote is encrypted and secure.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Voting Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Vote className="h-5 w-5 text-primary" />
                Voting Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{requiredVotes}</div>
                <div className="text-sm text-muted-foreground">Total Positions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{submittedVotes}</div>
                <div className="text-sm text-muted-foreground">Votes Cast</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{requiredVotes - submittedVotes}</div>
                <div className="text-sm text-muted-foreground">Remaining</div>
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
                  <CardDescription>
                    Select one candidate for this position
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={selectedVotes[position.id] || ""}
                    onValueChange={(value) => handleVoteChange(position.id, value)}
                    className="space-y-4"
                  >
                    {position.candidates.map((candidate) => (
                      <div key={candidate.id} className="relative">
                        <Label 
                          htmlFor={candidate.id} 
                          className="cursor-pointer block"
                        >
                          <Card className={`transition-all duration-200 hover:shadow-md hover:border-primary/20 ${
                            selectedVotes[position.id] === candidate.id 
                              ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                              : 'hover:bg-muted/30'
                          }`}>
                            <CardContent className="p-6">
                              <div className="flex items-start gap-4">
                                <RadioGroupItem value={candidate.id} id={candidate.id} className="mt-2" />

                                <Avatar className="h-20 w-20 border-2 border-muted">
                                  <AvatarImage 
                                    src={candidate.photo ? `/uploads/${candidate.photo}` : undefined} 
                                    alt={candidate.name}
                                  />
                                  <AvatarFallback className="text-lg font-semibold">
                                    {getInitials(candidate.name)}
                                  </AvatarFallback>
                                </Avatar>

                                <div className="flex-1 space-y-3">
                                  <div>
                                    <h3 className="text-xl font-semibold">{candidate.name}</h3>
                                    <Badge variant="outline" className="mt-1">
                                      Candidate for {position.title}
                                    </Badge>
                                  </div>

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
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </CardContent>
              </Card>
            ))}
          </div>

          {!canSubmit && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                Please select a candidate for all {requiredVotes} positions before submitting your vote.
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-3">
            <Button 
              onClick={handleClose} 
              variant="outline" 
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={!canSubmit || isSubmitting}
              className="flex-1"
            >
              {canSubmit ? 'Review Vote' : `Select ${requiredVotes - submittedVotes} More`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}