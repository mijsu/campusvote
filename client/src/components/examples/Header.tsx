import Header from '../Header';
import { useState } from 'react';

export default function HeaderExample() {
  const [isDark, setIsDark] = useState(false);
  
  //todo: remove mock functionality
  const mockUser = {
    studentId: '2023001',
    name: 'Jane Doe',
    role: 'student' as const
  };

  return (
    <div className={isDark ? 'dark' : ''}>
      <div className="min-h-screen bg-background">
        <Header 
          user={mockUser}
          isDark={isDark}
          onThemeToggle={() => {
            setIsDark(!isDark);
            console.log('Theme toggled:', !isDark ? 'dark' : 'light');
          }}
          onLogout={() => console.log('Logout triggered')}
        />
        <div className="p-8">
          <p className="text-muted-foreground">Header component example with student user</p>
        </div>
      </div>
    </div>
  );
}