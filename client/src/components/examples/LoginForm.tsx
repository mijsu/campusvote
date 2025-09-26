import LoginForm from '../LoginForm';
import { useState } from 'react';

export default function LoginFormExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (credentials: { studentId: string; password: string; role: 'student' | 'admin' }) => {
    setIsLoading(true);
    setError('');
    console.log('Login attempt:', credentials);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      if (credentials.studentId === 'demo' && credentials.password === 'demo') {
        console.log('Login successful');
      } else {
        setError('Invalid credentials. Try studentId: "demo", password: "demo"');
      }
    }, 1500);
  };

  return (
    <LoginForm 
      onLogin={handleLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}