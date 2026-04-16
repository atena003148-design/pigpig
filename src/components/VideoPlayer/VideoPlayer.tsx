'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import NicoComments from '@/components/NicoComments/NicoComments';
import { Comment } from '@/lib/types';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
    node?: import('@/lib/types').VideoNode;
    videoUrl?: string; // either node or videoUrl
    comments: Comment[];
    onTimeUpdate?: (time: number) => void;
}

export default function VideoPlayer({ node, videoUrl, comments, onTimeUpdate }: VideoPlayerProps) {
    const activeVideoUrl = node?.video_url || videoUrl || '';
    const videoRef = useRef<HTMLVideoElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [showControls, setShowControls] = useState(true);
    const [commentInput, setCommentInput] = useState('');
    const [showComments, setShowComments] = useState(true);
    const hideTimer = useRef<NodeJS.Timeout | null>(null);

    const togglePlay = useCallback(() => {
        if (!videoRef.current) return;
        if (videoRef.current.paused) {
            videoRef.current.play();
            setIsPlaying(true);
        } else {
            videoRef.current.pause();
            setIsPlaying(false);
        }
    }, []);

    const handleTimeUpdate = useCallback(() => {
        if (!videoRef.current) return;
        const time = videoRef.current.currentTime;
        setCurrentTime(time);
        onTimeUpdate?.(time);
    }, [onTimeUpdate]);

    const handleSeek = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const time = parseFloat(e.target.value);
        videoRef.current.currentTime = time;
        setCurrentTime(time);
    }, []);

    const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!videoRef.current) return;
        const vol = parseFloat(e.target.value);
        videoRef.current.volume = vol;
        setVolume(vol);
        setIsMuted(vol === 0);
    }, []);

    const toggleMute = useCallback(() => {
        if (!videoRef.current) return;
        videoRef.current.muted = !videoRef.current.muted;
        setIsMuted(!isMuted);
    }, [isMuted]);

    const toggleFullscreen = useCallback(() => {
        const container = videoRef.current?.parentElement?.parentElement;
        if (!container) return;
        if (document.fullscreenElement) {
            document.exitFullscreen();
        } else {
            container.requestFullscreen();
        }
    }, []);

    const handleMouseMove = useCallback(() => {
        setShowControls(true);
        if (hideTimer.current) clearTimeout(hideTimer.current);
        hideTimer.current = setTimeout(() => {
            if (isPlaying) setShowControls(false);
        }, 3000);
    }, [isPlaying]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const [localComments, setLocalComments] = useState<Comment[]>(comments);
    const [commentColor, setCommentColor] = useState('#FFFFFF');

    const COLORS = ['#FFFFFF', 'var(--accent-primary)'];

    useEffect(() => {
        setLocalComments(comments);
    }, [comments]);

    const handleCommentSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentInput.trim() || !node) return;

        try {
            const newComment: Partial<Comment> = {
                video_node_id: node.id,
                content: commentInput.trim(),
                video_timestamp: currentTime,
                color: commentColor
            };

            const res = await fetch('/api/data?type=comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newComment)
            });
            const data = await res.json();

            setLocalComments(prev => [...prev, data.data].sort((a, b) => a.video_timestamp - b.video_timestamp));
            setCommentInput('');
        } catch (err) {
            console.error('Failed to post comment', err);
        }
    }, [commentInput, currentTime, node, commentColor]);

    // Comment density visualization on seekbar
    const commentDensity = useCallback(() => {
        if (duration === 0) return [];
        const bucketCount = 100;
        const bucketSize = duration / bucketCount;
        const buckets = new Array(bucketCount).fill(0);

        localComments.forEach((c) => {
            const bucket = Math.min(Math.floor(c.video_timestamp / bucketSize), bucketCount - 1);
            if (bucket >= 0) buckets[bucket]++;
        });

        const maxDensity = Math.max(...buckets, 1);
        return buckets.map((count) => count / maxDensity);
    }, [localComments, duration]);

    return (
        <div className={styles.playerContainer} onMouseMove={handleMouseMove}>
            <div className={styles.videoWrapper} onClick={togglePlay}>
                <video
                    ref={videoRef}
                    src={activeVideoUrl}
                    className={styles.video}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
                    onEnded={() => setIsPlaying(false)}
                    playsInline
                />

                {showComments && (
                    <NicoComments
                        comments={localComments}
                        currentTime={currentTime}
                        isPlaying={isPlaying}
                    />
                )}

                {/* Play button overlay when paused */}
                {!isPlaying && (
                    <div className={styles.playOverlay}>
                        <div className={styles.playButton}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className={`${styles.controls} ${showControls ? styles.controlsVisible : ''}`}>
                {/* Comment density heatmap */}
                <div className={styles.densityBar}>
                    {commentDensity().map((density, i) => (
                        <div
                            key={i}
                            className={styles.densitySegment}
                            style={{
                                opacity: Math.max(0.1, density),
                                background: density > 0.5
                                    ? `rgba(255, 107, 157, ${density})`
                                    : `rgba(108, 92, 231, ${density + 0.2})`,
                            }}
                        />
                    ))}
                </div>

                {/* Seekbar */}
                <input
                    type="range"
                    className={styles.seekbar}
                    min={0}
                    max={duration || 0}
                    step={0.1}
                    value={currentTime}
                    onChange={handleSeek}
                />

                <div className={styles.controlsRow}>
                    <div className={styles.controlsLeft}>
                        <button className={styles.controlBtn} onClick={togglePlay}>
                            {isPlaying ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /></svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                            )}
                        </button>

                        <button className={styles.controlBtn} onClick={toggleMute}>
                            {isMuted ? (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 12A4.5 4.5 0 0014 7.97v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51A8.796 8.796 0 0021 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06a8.99 8.99 0 003.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z" /></svg>
                            ) : (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3A4.5 4.5 0 0014 7.97v8.05c1.48-.73 2.5-2.25 2.5-3.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" /></svg>
                            )}
                        </button>

                        <input
                            type="range"
                            className={styles.volumeSlider}
                            min={0}
                            max={1}
                            step={0.05}
                            value={isMuted ? 0 : volume}
                            onChange={handleVolumeChange}
                        />

                        <span className={styles.time}>
                            {formatTime(currentTime)} / {formatTime(duration)}
                        </span>
                    </div>

                    <div className={styles.controlsRight}>
                        <button
                            className={`${styles.controlBtn} ${showComments ? styles.active : ''}`}
                            onClick={() => setShowComments(!showComments)}
                            title="コメント表示切替"
                        >
                            💬
                        </button>
                        <button className={styles.controlBtn} onClick={toggleFullscreen}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" /></svg>
                        </button>
                    </div>
                </div>
            </div>

            {/* Comment Input */}
            <div className={styles.commentSection}>
                <div className={styles.colorPicker}>
                    {COLORS.map(c => (
                        <button
                            key={c}
                            className={`${styles.colorBtn} ${commentColor === c ? styles.colorBtnActive : ''}`}
                            style={{ backgroundColor: c }}
                            onClick={() => setCommentColor(c)}
                            title={c}
                        />
                    ))}
                </div>
                <form className={styles.commentForm} onSubmit={handleCommentSubmit}>
                    <input
                        type="text"
                        className={styles.commentInput}
                        placeholder="コメントを入力... (この瞬間に流れます)"
                        value={commentInput}
                        onChange={(e) => setCommentInput(e.target.value)}
                    />
                    <button type="submit" className={styles.commentSubmit} disabled={!commentInput.trim()}>
                        送信
                    </button>
                </form>
            </div>
        </div>
    );
}
