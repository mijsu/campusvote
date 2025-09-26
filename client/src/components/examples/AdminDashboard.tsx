import AdminDashboard from '../AdminDashboard';

export default function AdminDashboardExample() {
  //todo: remove mock functionality
  const mockElections = [
    {
      id: 'election_fall2025',
      title: 'Student Council Elections 2025',
      status: 'active' as const,
      startDate: '2025-10-01T00:00:00Z',
      endDate: '2025-10-07T23:59:59Z',
      totalVotes: 1250,
      eligibleVoters: 2000,
      positions: []
    },
    {
      id: 'election_spring2025',
      title: 'Dormitory Representatives Election',
      status: 'closed' as const,
      startDate: '2025-03-15T00:00:00Z',
      endDate: '2025-03-22T23:59:59Z',
      totalVotes: 890,
      eligibleVoters: 1500,
      positions: []
    },
    {
      id: 'election_winter2026',
      title: 'Graduate Student Association',
      status: 'upcoming' as const,
      startDate: '2026-01-15T00:00:00Z',
      endDate: '2026-01-22T23:59:59Z',
      totalVotes: 0,
      eligibleVoters: 800,
      positions: []
    }
  ];

  return (
    <div className="p-6 bg-background min-h-screen">
      <AdminDashboard
        elections={mockElections}
        onCreateElection={() => console.log('Create election clicked')}
        onEditElection={(id) => console.log('Edit election:', id)}
        onDeleteElection={(id) => console.log('Delete election:', id)}
        onViewResults={(id) => console.log('View results:', id)}
        onExportResults={(id) => console.log('Export results:', id)}
      />
    </div>
  );
}