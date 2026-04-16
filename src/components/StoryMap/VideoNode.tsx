'use client';

import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import styles from './VideoNode.module.css';

function formatViews(count: number): string {
    if (count >= 10000) return `${(count / 10000).toFixed(1)}万`;
    if (count >= 1000) return `${(count / 1000).toFixed(1)}K`;
    return count.toString();
}

function VideoNodeComponent({ data }: NodeProps) {
    const [showActions, setShowActions] = useState(false);

    const title = data.title as string;
    const thumbnail_url = data.thumbnail_url as string;
    const view_count = data.view_count as number;
    const comment_count = data.comment_count as number | undefined;
    const heat_score = data.heat_score as number | undefined;
    const branch_y = data.branch_y as number;
    const episode_x = data.episode_x as number;
    const isFocused = data.isFocused as boolean | undefined;
    const onNodeClick = data.onNodeClick as (() => void) | undefined;
    const onAddBranch = data.onAddBranch as ((direction: string) => void) | undefined;

    const isBranch = branch_y !== 0;
    const heatOpacity = Math.max(0.3, heat_score || 0.3);

    return (
        <div
            className={`${styles.node} ${isFocused ? styles.focused : ''} ${isBranch ? styles.branch : ''}`}
            style={{
                boxShadow: heat_score && heat_score > 0.5
                    ? `0 0 ${Math.round(heat_score * 30)}px rgba(108, 92, 231, ${heat_score * 0.5})`
                    : undefined,
            }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
            onClick={() => onNodeClick?.()}
        >
            <Handle type="target" position={Position.Left} className={styles.handle} />
            <Handle type="source" position={Position.Right} className={styles.handle} />

            {/* Thumbnail */}
            <div className={styles.thumbnailArea}>
                <img src={thumbnail_url} alt={title} className={styles.thumbnail} />
                <div className={styles.heatBar} style={{ opacity: heatOpacity }}>
                    <div className={styles.heatFill} style={{ width: `${(heat_score || 0) * 100}%` }} />
                </div>
                {isBranch && <div className={styles.branchIndicator}>分岐</div>}
                <div className={styles.episodeTag}>
                    E{episode_x + 1}
                    {branch_y !== 0 && ` / B${Math.abs(branch_y)}`}
                </div>
            </div>

            {/* Info */}
            <div className={styles.info}>
                <div className={styles.title}>{title}</div>
                <div className={styles.meta}>
                    <span>👁 {formatViews(view_count)}</span>
                    {comment_count && <span>💬 {comment_count}</span>}
                </div>
            </div>

            {/* Add Branch Actions */}
            {showActions && (
                <div className={styles.actions}>
                    <button
                        className={styles.actionBtn}
                        onClick={(e) => { e.stopPropagation(); onAddBranch?.('branch-up'); }}
                        title="上に分岐"
                    >
                        ↑
                    </button>
                    <button
                        className={`${styles.actionBtn} ${styles.actionContinue}`}
                        onClick={(e) => { e.stopPropagation(); onAddBranch?.('continue'); }}
                        title="続きを追加"
                    >
                        →
                    </button>
                    <button
                        className={styles.actionBtn}
                        onClick={(e) => { e.stopPropagation(); onAddBranch?.('branch-down'); }}
                        title="下に分岐"
                    >
                        ↓
                    </button>
                </div>
            )}
        </div>
    );
}

export default memo(VideoNodeComponent);
