'use client';

import { useEffect, useRef, useState } from 'react';
import { Comment } from '@/lib/types';
import styles from './NicoComments.module.css';

interface NicoCommentsProps {
    comments: Comment[];
    currentTime: number;
    isPlaying: boolean;
}

interface ActiveComment extends Comment {
    lane: number;
    startedAt: number;
}

const DISPLAY_WINDOW = 2; // Show comments within ±2 seconds
const COMMENT_DURATION = 6000; // ms for comment to cross screen
const MAX_LANES = 8;

export default function NicoComments({ comments, currentTime, isPlaying }: NicoCommentsProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [activeComments, setActiveComments] = useState<ActiveComment[]>([]);
    const shownIds = useRef(new Set<string>());
    const laneOccupied = useRef(new Array(MAX_LANES).fill(0));

    useEffect(() => {
        if (!isPlaying) return;

        const newComments = comments.filter(
            (c) =>
                Math.abs(c.video_timestamp - currentTime) < DISPLAY_WINDOW &&
                !shownIds.current.has(c.id)
        );

        if (newComments.length > 0) {
            const now = Date.now();
            const activated: ActiveComment[] = newComments.map((c) => {
                // Find least occupied lane
                let bestLane = 0;
                let minTime = Infinity;
                for (let i = 0; i < MAX_LANES; i++) {
                    if (laneOccupied.current[i] < minTime) {
                        minTime = laneOccupied.current[i];
                        bestLane = i;
                    }
                }
                laneOccupied.current[bestLane] = now + COMMENT_DURATION;
                shownIds.current.add(c.id);
                return { ...c, lane: bestLane, startedAt: now };
            });

            setActiveComments((prev) => [...prev, ...activated]);

            // Clean up old comments
            setTimeout(() => {
                setActiveComments((prev) =>
                    prev.filter((c) => Date.now() - c.startedAt < COMMENT_DURATION + 500)
                );
            }, COMMENT_DURATION + 500);
        }
    }, [currentTime, comments, isPlaying]);

    // Reset when seeking
    useEffect(() => {
        shownIds.current.clear();
        laneOccupied.current.fill(0);
        setActiveComments([]);
    }, [Math.floor(currentTime / 5)]);

    return (
        <div ref={containerRef} className={styles.container}>
            {activeComments.map((comment) => (
                <div
                    key={`${comment.id}-${comment.startedAt}`}
                    className={styles.comment}
                    style={{
                        top: `${(comment.lane / MAX_LANES) * 85 + 5}%`,
                        color: comment.color,
                        animationDuration: `${COMMENT_DURATION}ms`,
                    }}
                >
                    {comment.content}
                </div>
            ))}
        </div>
    );
}
