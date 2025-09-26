import ElectionCard from '../ElectionCard';

export default function ElectionCardExample() {
  //todo: remove mock functionality
  const mockElections = [
    {
      id: 'election_fall2025',
      title: 'Student Council Elections 2025',
      description: 'Annual election for student government representatives',
      startDate: '2025-10-01T00:00:00Z',
      endDate: '2025-10-07T23:59:59Z',
      status: 'active' as const,
      positions: [
        { id: 'pos_pres', title: 'President', candidateCount: 3 },
        { id: 'pos_vp', title: 'Vice President', candidateCount: 2 },
        { id: 'pos_sec', title: 'Secretary', candidateCount: 4 }
      ],
      hasVoted: false
    },
    {
      id: 'election_spring2025',
      title: 'Dormitory Representatives',
      description: 'Election for dormitory council representatives',
      startDate: '2025-03-15T00:00:00Z',
      endDate: '2025-03-22T23:59:59Z',
      status: 'closed' as const,
      positions: [
        { id: 'pos_dorm1', title: 'Building A Rep', candidateCount: 2 },
        { id: 'pos_dorm2', title: 'Building B Rep', candidateCount: 3 }
      ],
      hasVoted: true,
      votedPositions: ['pos_dorm1']
    }
  ];

  return (
    <div className="p-4 space-y-4 bg-background min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Elections</h2>
      {mockElections.map((election) => (
        <ElectionCard
          key={election.id}
          election={election}
          userRole="student"
          onVote={(id) => console.log('Vote clicked for:', id)}
          onViewResults={(id) => console.log('View results for:', id)}
        />
      ))}
    </div>
  );
}