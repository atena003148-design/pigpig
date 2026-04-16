'use client';

import React, { useEffect, useState } from 'react';
import { useUser, SignOutButton } from "@clerk/nextjs";

export default function MyPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  if (!isLoaded || !isSignedIn) {
    return null;
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '4rem 2rem', color: 'var(--text-primary, #fff)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color, #333)', paddingBottom: '1rem', marginBottom: '2rem' }}>
        <h1>My Page</h1>
        <SignOutButton>
          <button style={{ padding: '0.5rem 1rem', background: '#333', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>
        </SignOutButton>
      </div>

      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button 
          onClick={() => setActiveTab('profile')}
          style={{ padding: '0.5rem 1rem', background: activeTab === 'profile' ? 'var(--accent-color, #fff)' : 'transparent', color: activeTab === 'profile' ? '#000' : 'var(--text-secondary, #a0a0a0)', border: '1px solid var(--border-color, #333)', borderRadius: '4px', cursor: 'pointer' }}>
          Profile
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          style={{ padding: '0.5rem 1rem', background: activeTab === 'history' ? 'var(--accent-color, #fff)' : 'transparent', color: activeTab === 'history' ? '#000' : 'var(--text-secondary, #a0a0a0)', border: '1px solid var(--border-color, #333)', borderRadius: '4px', cursor: 'pointer' }}>
          Post History
        </button>
      </div>

      {activeTab === 'profile' && (
        <div style={{ background: 'var(--background-secondary, #1a1a1a)', padding: '2rem', borderRadius: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '2rem' }}>
            <img src={user.imageUrl} alt="Profile" style={{ width: '80px', height: '80px', borderRadius: '50%' }} />
            <div>
              <h2 style={{ margin: 0 }}>{user.fullName || "User"}</h2>
              <p style={{ color: 'var(--text-secondary, #a0a0a0)', margin: '0.5rem 0 0 0' }}>{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary, #a0a0a0)' }}>プロフィール情報の詳細やID連携などはClerkのダッシュボードまたは専用UIから追加可能です。</p>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ background: 'var(--background-secondary, #1a1a1a)', padding: '2rem', borderRadius: '8px' }}>
          <h2>Post History (Coming Soon)</h2>
          <p style={{ color: 'var(--text-secondary, #a0a0a0)' }}>ここに自分が投稿した物語（ノード）の履歴が表示される予定です。</p>
        </div>
      )}
    </div>
  );
}
