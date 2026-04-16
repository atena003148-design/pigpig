'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import StoryMap from '@/components/StoryMap/StoryMap';
import { Project, VideoNode } from '@/lib/types';
import styles from './page.module.css';

export default function ProjectPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = params.id as string;

    const [project, setProject] = useState<Project | null>(null);
    const [nodes, setNodes] = useState<VideoNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [projRes, nodeRes] = await Promise.all([
                    fetch('/api/data?type=projects').then(r => r.json()),
                    fetch('/api/data?type=nodes').then(r => r.json())
                ]);
                const pList = projRes.data || [];
                const nList = nodeRes.data || [];

                setProject(pList.find((p: Project) => p.id === projectId) || null);
                setNodes(nList.filter((n: VideoNode) => n.project_id === projectId));
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (projectId) load();
    }, [projectId]);

    if (loading) {
        return <div className="content-wrapper" style={{ padding: '100px 0', textAlign: 'center' }}>読み込み中...</div>;
    }

    if (!project) {
        return (
            <div className="content-wrapper">
                <div className={styles.notFound}>
                    <h1>プロジェクトが見つかりません</h1>
                    <Link href="/" className="btn-primary">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    const handleNodeClick = (node: VideoNode) => {
        router.push(`/watch/${node.id}`);
    };

    const handleAddBranch = (parentNode: VideoNode, direction: string) => {
        router.push(`/upload?parent=${parentNode.id}&direction=${direction}`);
    };

    return (
        <div className={styles.page}>
            {/* Project Header */}
            <div className={styles.header}>
                <div className="content-wrapper">
                    <div className={styles.headerContent}>
                        <div className={styles.headerInfo}>
                            <div className={styles.breadcrumb}>
                                <Link href="/">ホーム</Link>
                                <span>/</span>
                                <span>プロジェクト</span>
                            </div>
                            <h1 className={styles.title}>{project.title}</h1>
                            <p className={styles.description}>{project.description}</p>
                            <div className={styles.stats}>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>{nodes.length}</span>
                                    <span className={styles.statLabel}>ノード</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statValue}>
                                        {nodes.filter(n => n.branch_y !== 0).length}
                                    </span>
                                    <span className={styles.statLabel}>分岐</span>
                                </div>
                            </div>
                        </div>
                        <Link href="/upload" className="btn-primary">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                            この物語に参加する
                        </Link>
                    </div>
                </div>
            </div>

            {/* Story Map */}
            <div className={styles.mapSection}>
                <div className={styles.mapHeader}>
                    <h2 className={styles.mapTitle}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 1v6M12 17v6M4.22 4.22l4.24 4.24M15.54 15.54l4.24 4.24M1 12h6M17 12h6M4.22 19.78l4.24-4.24M15.54 8.46l4.24-4.24" />
                        </svg>
                        ストーリーマップ
                    </h2>
                    <p className={styles.mapSubtitle}>ノードをクリックして動画を視聴 • ホバーで分岐を追加</p>
                </div>
                <StoryMap
                    nodes={nodes}
                    onNodeClick={handleNodeClick}
                    onAddBranch={handleAddBranch}
                />
            </div>
        </div>
    );
}
