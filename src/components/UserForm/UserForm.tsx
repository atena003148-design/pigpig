'use client';

import React, { useState } from 'react';
import styles from './UserForm.module.css';

export function UserForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.error || 'Something went wrong');
      }

      setStatus('success');
      setMessage('User saved successfully!');
      setName('');
      setEmail('');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.message);
    }
  };

  return (
    <div className={styles.container}>
      <h2>Add New User</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="name">Name</label>
          <input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className={styles.input}
            placeholder="John Doe"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.input}
            placeholder="john@example.com"
          />
        </div>
        <button
          type="submit"
          disabled={status === 'loading'}
          className={styles.submitButton}
        >
          {status === 'loading' ? 'Saving...' : 'Save User'}
        </button>
      </form>
      {message && (
        <p className={`${styles.message} ${status === 'error' ? styles.error : styles.success}`}>
          {message}
        </p>
      )}
    </div>
  );
}
