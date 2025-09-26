import VotingModal from '../VotingModal';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function VotingModalExample() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  //todo: remove mock functionality
  const mockElection = {
    id: 'election_fall2025',
    title: 'Student Council Elections 2025',
    positions: [
      {
        id: 'pos_pres',
        title: 'President',
        maxVotes: 1,
        candidates: [
          {
            id: 'cand_01',
            name: 'Alice Johnson',
            bio: 'Computer Science major with 3 years of student government experience. Focused on improving campus technology infrastructure.'
          },
          {
            id: 'cand_02',
            name: 'Bob Martinez',
            bio: 'Business Administration student passionate about student services and campus dining improvements.'
          },
          {
            id: 'cand_03',
            name: 'Carol Chen',
            bio: 'Environmental Studies major advocating for sustainable campus practices and green initiatives.'
          }
        ]
      },
      {
        id: 'pos_vp',
        title: 'Vice President',
        maxVotes: 1,
        candidates: [
          {
            id: 'cand_04',
            name: 'David Kim',
            bio: 'Psychology major with strong communication skills and event planning experience.'
          },
          {
            id: 'cand_05',
            name: 'Emma Wilson',
            bio: 'Engineering student focused on improving study spaces and academic support services.'
          }
        ]
      }
    ]
  };

  const handleSubmitVote = (votes: Record<string, string>) => {
    setIsSubmitting(true);
    console.log('Submitting votes:', votes);
    
    // Simulate vote submission
    setTimeout(() => {
      setIsSubmitting(false);
      setIsOpen(false);
      console.log('Vote submitted successfully');
    }, 2000);
  };

  return (
    <div className="p-4 bg-background min-h-screen">
      <Button onClick={() => setIsOpen(true)} data-testid="button-open-voting">
        Open Voting Modal
      </Button>
      
      <VotingModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        election={mockElection}
        onSubmitVote={handleSubmitVote}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}