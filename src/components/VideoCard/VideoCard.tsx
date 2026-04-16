'use client';

import Link from 'next/link';
import styles from './VideoCard.module.css';
import { VideoNode, Project } from '@/lib/types';

interface VideoCardProps {
    node: VideoNode;
    project?: Project;
    index?: number;
}

function formatViews(count: number): string {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

function formatTimeAgo(dateStr: string): string {
    const now = new Date();
    const date = new Date(dateStr);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 1) return '今日';
    if (diffDays < 7) return `${diffDays}日前`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}週間前`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)}ヶ月前`;
    return `${Math.floor(diffDays / 365)}年前`;
}

function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function VideoCard({ node, project, index = 0 }: VideoCardProps) {
    const isBranch = node.branch_y !== 0;

    return (
        <div className={`${styles.card} animate-fade-in-up stagger-${Math.min(index + 1, 8)}`}>
            <Link href={`/watch/${node.id}`} className={styles.thumbnailLink}>
                <div className={styles.thumbnailWrapper}>
                    <img
                        src={node.thumbnail_url}
                        alt={node.title}
                        className={styles.thumbnail}
                        loading="lazy"
                    />
                    
                    <div className={styles.gradientOverlay}></div>

                    <div className={styles.badgesTop}>
                        {node.heat_score && node.heat_score > 0.8 && (
                            <div className={styles.hotBadge}>🔥 HOT</div>
                        )}
                        {isBranch && (
                            <div className={styles.branchBadge}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                    <path d="M6 3v12M18 9a3 3 0 100-6 3 3 0 000 6zM6 21a3 3 0 100-6 3 3 0 000 6zM18 9a9 9 0 01-9 9" />
                                </svg>
                                分岐
                            </div>
                        )}
                    </div>
                    
                    <div className={styles.infoOverlay}>
                        <h3 className={styles.title}>{node.title}</h3>
                        <div className={styles.metaRow}>
                            <span>{formatDuration(node.duration_seconds || 0)}</span>
                            <span className={styles.dot}>•</span>
                            <span>{formatViews(node.view_count || 0)} 回視聴</span>
                            <span className={styles.dot}>•</span>
                            <span>{formatTimeAgo(node.created_at || new Date().toISOString())}</span>
                        </div>
                    </div>

                    <div className={styles.playOverlay}>
                        <div className={styles.playIconContainer}>
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    );
}
