'use client';

import { useState } from 'react';
import Link from 'next/link';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import { SignInButton, UserButton, useUser } from '@clerk/nextjs';
import styles from './Header.module.css';

export default function Header() {
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchFocused, setIsSearchFocused] = useState(false);
    const { isSignedIn, isLoaded } = useUser();

    return (
        <header className={styles.header}>
            <div className={styles.inner}>
                {/* Logo */}
                <Link href="/" className={styles.logo}>
                    <div className={styles.logoIcon}>
                        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                            <circle cx="14" cy="14" r="4" fill="url(#g1)" />
                            <circle cx="6" cy="8" r="2.5" fill="url(#g1)" opacity="0.7" />
                            <circle cx="22" cy="8" r="2.5" fill="url(#g1)" opacity="0.7" />
                            <circle cx="6" cy="20" r="2.5" fill="url(#g1)" opacity="0.7" />
                            <circle cx="22" cy="20" r="2.5" fill="url(#g1)" opacity="0.7" />
                            <line x1="14" y1="14" x2="6" y2="8" stroke="url(#g1)" strokeWidth="1" opacity="0.4" />
                            <line x1="14" y1="14" x2="22" y2="8" stroke="url(#g1)" strokeWidth="1" opacity="0.4" />
                            <line x1="14" y1="14" x2="6" y2="20" stroke="url(#g1)" strokeWidth="1" opacity="0.4" />
                            <line x1="14" y1="14" x2="22" y2="20" stroke="url(#g1)" strokeWidth="1" opacity="0.4" />
                            <defs>
                                <linearGradient id="g1" x1="0" y1="0" x2="28" y2="28">
                                    <stop stopColor="var(--accent-primary)" />
                                    <stop offset="0.5" stopColor="var(--accent-primary)" />
                                    <stop offset="1" stopColor="var(--accent-primary)" />
                                </linearGradient>
                            </defs>
                        </svg>
                    </div>
                    <span className={styles.logoText}>Rhizome</span>
                </Link>

                {/* Search */}
                <div className={`${styles.searchContainer} ${isSearchFocused ? styles.searchFocused : ''}`}>
                    <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="M21 21l-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="物語を検索..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setIsSearchFocused(false)}
                    />
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <Link href="/upload" className={styles.uploadBtn}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 5v14M5 12h14" />
                        </svg>
                        <span>投稿</span>
                    </Link>
                    <ThemeToggle />
                    
                    {isLoaded && (
                        <>
                            {isSignedIn ? (
                                <>
                                    <Link href="/mypage" style={{ textDecoration: 'none', color: 'var(--text-primary)', fontSize: '14px', fontWeight: 'bold' }}>マイページ</Link>
                                    <UserButton />
                                </>
                            ) : (
                                <SignInButton mode="modal">
                                    <button className={styles.avatarBtn} style={{ padding: '0 12px', width: 'auto', fontSize: '14px', borderRadius: '20px', backgroundColor: 'var(--accent-primary, #fff)', color: 'var(--background-primary, #000)', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}>
                                        ログイン / 登録
                                    </button>
                                </SignInButton>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    );
}
