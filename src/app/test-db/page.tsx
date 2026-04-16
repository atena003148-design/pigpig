import React from 'react';
import { UserForm } from '@/components/UserForm/UserForm';

export default function TestDbPage() {
  return (
    <div style={{ minHeight: '100vh', padding: '4rem 2rem', backgroundColor: 'var(--background-primary, #000)' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem', color: 'var(--text-primary, #fff)' }}>Database Connection Test</h1>
      <UserForm />
    </div>
  );
}
