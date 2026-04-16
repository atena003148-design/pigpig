'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import { Project, VideoNode, AIMetadata, Comment } from '@/lib/types';
import styles from './page.module.css';

export default function WatchPage() {
    const params = useParams();
    const router = useRouter();
    const nodeId = params.id as string;

    const [node, setNode] = useState<VideoNode | null>(null);
    const [project, setProject] = useState<Project | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [aiMetadata, setAIMetadata] = useState<AIMetadata | null>(null);
    const [relatedNodes, setRelatedNodes] = useState<VideoNode[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [nodeRes, projRes, commentRes, aiRes] = await Promise.all([
                    fetch('/api/data?type=nodes').then(r => r.json()),
                    fetch('/api/data?type=projects').then(r => r.json()),
                    fetch('/api/data?type=comments').then(r => r.json()),
                    fetch('/api/data?type=aiMetadata').then(r => r.json())
                ]);

                const nList = nodeRes.data || [];
                const pList = projRes.data || [];
                const cList = commentRes.data || [];
                const aList = aiRes.data || [];

                const targetNode = nList.find((n: VideoNode) => n.id === nodeId);
                if (!targetNode) {
                    setLoading(false);
                    return;
                }

                setNode(targetNode);
                setProject(pList.find((p: Project) => p.id === targetNode.project_id) || null);
                setComments(cList.filter((c: Comment) => c.video_node_id === nodeId).sort((a: Comment, b: Comment) => a.video_timestamp - b.video_timestamp));
                setAIMetadata(aList.find((a: AIMetadata) => a.video_node_id === nodeId) || null);

                // Parent and children
                const related = nList.filter((n: VideoNode) =>
                    n.id === targetNode.parent_id || n.parent_id === targetNode.id
                );
                setRelatedNodes(related);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        if (nodeId) load();
    }, [nodeId]);

    if (loading) {
        return <div className="content-wrapper" style={{ padding: '100px 0', textAlign: 'center' }}>読み込み中...</div>;
    }

    if (!node || !project) {
        return (
            <div className="content-wrapper">
                <div className={styles.notFound}>
                    <h1>動画が見つかりません</h1>
                    <Link href="/" className="btn-primary">ホームに戻る</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <div className={styles.layout}>
                <div className={styles.main}>
                    <VideoPlayer node={node} comments={comments} />

                    <div className={styles.videoInfo}>
                        <div className={styles.tags}>
                            <span className="badge badge-episode">Episode {node.episode_x + 1}</span>
                            {node.branch_y !== 0 && (
                                <span className="badge badge-branch">分岐点</span>
                            )}
                        </div>

                        <h1 className={styles.videoTitle}>{node.title}</h1>

                        <div className={styles.videoMeta}>
                            <span>👁 {(node.view_count || 0).toLocaleString()} 回視聴</span>
                            <span className={styles.dot}>•</span>
                            <span>{new Date(node.created_at || Date.now()).toLocaleDateString('ja-JP')}</span>
                        </div>

                        <p className={styles.videoDesc}>{node.description}</p>

                        <div className={styles.actionButtons}>
                            <Link href={`/upload?parent=${node.id}&direction=continue`} className="btn-primary">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M5 12h14M12 5l7 7-7 7" />
                                </svg>
                                この続きを作る
                            </Link>
                            <Link href={`/upload?parent=${node.id}&direction=branch-down`} className="btn-secondary">
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 5v14M5 12h14" />
                                </svg>
                                別の世界線を分岐させる
                            </Link>
                        </div>
                    </div>

                    {/* AI Metadata Package */}
                    {aiMetadata && (
                        <div className={styles.aiPackage}>
                            <div className={styles.aiPackageHeader}>
                                <h3 className={styles.aiPackageTitle}>🤖 AI制作パッケージ</h3>
                                <span className="badge">オープンソース</span>
                            </div>

                            <div className={styles.aiSection}>
                                <div className={styles.aiSectionTitle}>キープロンプト</div>
                                <div className={styles.promptList}>
                                    {aiMetadata.key_prompts.map((prompt, i) => (
                                        <div key={i} className={styles.promptItem}>
                                            <span className={styles.promptNum}>{i + 1}</span>
                                            <span className={styles.promptText}>{prompt}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {aiMetadata.reference_images && aiMetadata.reference_images.length > 0 && (
                                <div className={styles.aiSection}>
                                    <div className={styles.aiSectionTitle}>参照画像</div>
                                    <div className={styles.refImages}>
                                        {aiMetadata.reference_images.map((img, i) => (
                                            <img key={i} src={img} alt={`Reference ${i + 1}`} className={styles.refImage} />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {aiMetadata.ai_model_info && (
                                <div className={styles.aiSection}>
                                    <div className={styles.aiSectionTitle}>使用モデル</div>
                                    <div className={styles.modelInfo}>
                                        <div className={styles.modelItem}>
                                            <span className={styles.modelLabel}>モデル</span>
                                            <span className={styles.modelValue}>{aiMetadata.ai_model_info.model_name}</span>
                                        </div>
                                        {aiMetadata.ai_model_info.provider && (
                                            <div className={styles.modelItem}>
                                                <span className={styles.modelLabel}>プロバイダ</span>
                                                <span className={styles.modelValue}>{aiMetadata.ai_model_info.provider}</span>
                                            </div>
                                        )}
                                        {aiMetadata.ai_model_info.version && (
                                            <div className={styles.modelItem}>
                                                <span className={styles.modelLabel}>バージョン</span>
                                                <span className={styles.modelValue}>{aiMetadata.ai_model_info.version}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className={styles.sidebar}>
                    <div className={styles.sidebarSection}>
                        <h3 className={styles.sidebarTitle}>所属プロジェクト</h3>
                        <Link href={`/project/${project.id}`} className={styles.projectCard}>
                            <img src={project.thumbnail_url} alt={project.title} className={styles.projectThumb} />
                            <div className={styles.projectInfo}>
                                <div className={styles.projectName}>{project.title}</div>
                                <div className={styles.projectNodes}>マップ全体を見る →</div>
                            </div>
                        </Link>
                    </div>

                    {relatedNodes.length > 0 && (
                        <div className={styles.sidebarSection}>
                            <h3 className={styles.sidebarTitle}>関連エピソード</h3>
                            <div className={styles.relatedList}>
                                {relatedNodes.map(rNode => (
                                    <Link key={rNode.id} href={`/watch/${rNode.id}`} className={styles.relatedItem}>
                                        <div className={styles.relatedThumb}>
                                            <img src={rNode.thumbnail_url} alt={rNode.title} />
                                            {rNode.branch_y !== 0 && (
                                                <div className={styles.relatedBranch}>分岐</div>
                                            )}
                                        </div>
                                        <div className={styles.relatedInfo}>
                                            <div className={styles.relatedTitle}>{rNode.title}</div>
                                            <div className={styles.relatedMeta}>
                                                Episode {rNode.episode_x + 1}
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
