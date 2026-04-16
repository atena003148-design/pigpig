'use client';

import { useState, Suspense, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Project, VideoNode } from '@/lib/types';
import styles from './page.module.css';

const AI_MODEL_TEMPLATES = [
    { label: "Runway Gen-3 Alpha", model: "Gen-3 Alpha", version: "alpha", provider: "Runway" },
    { label: "Runway Gen-2", model: "Gen-2", version: "2.0", provider: "Runway" },
    { label: "Sora (OpenAI)", model: "Sora", version: "1.0", provider: "OpenAI" },
    { label: "DALL-E 3 (OpenAI)", model: "DALL-E 3", version: "3", provider: "OpenAI" },
    { label: "ChatGPT (GPT-4o)", model: "GPT-4o", version: "2024-05-13", provider: "OpenAI" },
    { label: "Luma Dream Machine", model: "Dream Machine", version: "1.0", provider: "Luma AI" },
    { label: "Kling AI", model: "Kling", version: "1.0", provider: "Kuaishou" },
    { label: "Pika", model: "Pika", version: "1.0", provider: "Pika Labs" },
    { label: "Haiper", model: "Haiper", version: "1.0", provider: "Haiper" },
    { label: "Midjourney v6.0", model: "Midjourney", version: "v6.0", provider: "Midjourney" },
    { label: "Niji 6 (Midjourney)", model: "Niji", version: "6", provider: "Midjourney" },
    { label: "Stable Diffusion XL", model: "SDXL", version: "1.0", provider: "Stability AI" },
    { label: "Stable Video Diffusion", model: "SVD", version: "1.0", provider: "Stability AI" },
    { label: "Stable Audio", model: "Stable Audio", version: "2.0", provider: "Stability AI" },
    { label: "Claude 3.5 Sonnet", model: "Claude 3.5 Sonnet", version: "20240620", provider: "Anthropic" },
    { label: "Gemini 1.5 Pro", model: "Gemini 1.5 Pro", version: "1.5", provider: "Google" },
    { label: "Suno v3.5", model: "Suno", version: "v3.5", provider: "Suno" },
    { label: "Udio v1.5", model: "Udio", version: "v1.5", provider: "Udio" },
    { label: "ElevenLabs", model: "ElevenLabs", version: "v1", provider: "ElevenLabs" }
];

function UploadContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const parentId = searchParams.get('parent');
    const direction = searchParams.get('direction');

    const [parentNode, setParentNode] = useState<VideoNode | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        projectId: '',
        thumbnailUrl: '',
        keyPrompts: [''],
        aiModelName: '',
        aiModelVersion: '',
        aiModelProvider: '',
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [submittingError, setSubmittingError] = useState('');

    useEffect(() => {
        async function load() {
            try {
                const [projRes, nodeRes] = await Promise.all([
                    fetch('/api/data?type=projects').then(r => r.json()),
                    fetch('/api/data?type=nodes').then(r => r.json())
                ]);
                const pList = projRes.data || [];
                const nList = nodeRes.data || [];

                setProjects(pList);
                if (parentId) {
                    const parent = nList.find((n: VideoNode) => n.id === parentId);
                    setParentNode(parent || null);
                    if (parent) {
                        setFormData(prev => ({ ...prev, projectId: parent.project_id }));
                    }
                }
            } catch (err) {
                console.error(err);
            }
        }
        load();
    }, [parentId]);

    const handlePromptChange = (index: number, value: string) => {
        const newPrompts = [...formData.keyPrompts];
        newPrompts[index] = value;
        setFormData({ ...formData, keyPrompts: newPrompts });
    };

    const addPrompt = () => {
        setFormData({ ...formData, keyPrompts: [...formData.keyPrompts, ''] });
    };

    const removePrompt = (index: number) => {
        if (formData.keyPrompts.length <= 1) return;
        const newPrompts = formData.keyPrompts.filter((_, i) => i !== index);
        setFormData({ ...formData, keyPrompts: newPrompts });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setSubmittingError('');

        try {
            let videoUrl = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'; // fallback

            // Upload file if selected
            if (selectedFile) {
                const form = new FormData();
                form.append('file', selectedFile);
                form.append('type', 'video');
                const uploadRes = await fetch('/api/upload', {
                    method: 'POST',
                    body: form
                });
                if (!uploadRes.ok) throw new Error('Upload failed');
                const uploadData = await uploadRes.json();
                videoUrl = uploadData.url;
            }

            // Let's create project if needed
            let effectiveProjectId = formData.projectId;
            if (!effectiveProjectId) {
                const newProj: Partial<Project> = {
                    title: formData.title,
                    description: formData.description,
                    thumbnail_url: videoUrl,
                    node_count: 1,
                    total_views: 0
                };
                const projRes = await fetch('/api/data?type=projects', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newProj)
                });
                const d = await projRes.json();
                effectiveProjectId = d.data.id;
            }

            // Create VideoNode
            let episodeX = 0;
            let branchY = 0;

            if (parentNode) {
                if (direction === 'continue') {
                    episodeX = parentNode.episode_x + 1;
                    branchY = parentNode.branch_y;
                } else {
                    const activeNodesRes = await fetch('/api/data?type=nodes').then(r => r.json());
                    const activeNodes = activeNodesRes.data || [];
                    const existingChild = activeNodes.find((n: VideoNode) => n.parent_id === parentNode.id && n.branch_y === parentNode.branch_y);
                    if (existingChild) {
                        episodeX = (parentNode.episode_x + existingChild.episode_x) / 2;
                    } else {
                        episodeX = parentNode.episode_x + 0.5; // 親と次のエピソードの中間
                    }
                    branchY = parentNode.branch_y + (direction === 'branch-up' ? -1 : 1);
                }
            }

            const fallbackThumbnail = `https://picsum.photos/seed/${Math.random().toString(36).substring(7)}/1280/720`;
            const finalThumbnailUrl = formData.thumbnailUrl || fallbackThumbnail;

            const newNode: Partial<VideoNode> = {
                project_id: effectiveProjectId,
                parent_id: parentNode ? parentNode.id : null,
                episode_x: episodeX,
                branch_y: branchY,
                title: formData.title,
                description: formData.description,
                video_url: videoUrl,
                thumbnail_url: finalThumbnailUrl,
                view_count: 0
            };

            const nodeRes = await fetch('/api/data?type=nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newNode)
            });
            const createdNode = (await nodeRes.json()).data;

            // Create AIMetadata
            if (formData.keyPrompts[0] || formData.aiModelName) {
                await fetch('/api/data?type=aiMetadata', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        video_node_id: createdNode.id,
                        key_prompts: formData.keyPrompts.filter(p => p),
                        reference_images: [],
                        ai_model_info: {
                            model_name: formData.aiModelName,
                            version: formData.aiModelVersion,
                            provider: formData.aiModelProvider
                        }
                    })
                });
            }

            setSubmitted(true);
        } catch (err) {
            console.error(err);
            setSubmittingError('送信中にエラーが発生しました。');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <div className="content-wrapper">
                <div className={styles.successCard}>
                    <div className={styles.successIcon}>✨</div>
                    <h1 className={styles.successTitle}>投稿完了！</h1>
                    <p className={styles.successDesc}>
                        新しい物語のノードがストーリーマップに追加されました。
                    </p>
                    <div className={styles.successActions}>
                        <Link href="/" className="btn-primary">ホームに戻る</Link>
                        <Link href={`/project/${formData.projectId}`} className="btn-secondary">
                            マップを見る
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="content-wrapper">
            <div className={styles.uploadContainer}>
                <div className={styles.header}>
                    <h1 className={styles.title}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                        </svg>
                        動画を投稿
                    </h1>
                    <p className={styles.subtitle}>
                        {parentNode
                            ? `「${parentNode.title}」の${direction === 'continue' ? '続き' : '分岐'}を投稿`
                            : '新しい物語を始める'}
                    </p>
                </div>

                {/* Parent info */}
                {parentNode && (
                    <div className={styles.parentInfo}>
                        <img src={parentNode.thumbnail_url} alt={parentNode.title} className={styles.parentThumb} />
                        <div>
                            <div className={styles.parentLabel}>
                                {direction === 'continue' ? '→ 続きのエピソード' : '↕ 分岐ストーリー'}
                            </div>
                            <div className={styles.parentTitle}>{parentNode.title}</div>
                        </div>
                    </div>
                )}

                {submittingError && (
                    <div style={{ color: 'var(--accent-pink)', marginBottom: '16px' }}>{submittingError}</div>
                )}

                <form className={styles.form} onSubmit={handleSubmit}>
                    {/* Video Upload */}
                    <div className={styles.dropZone}>
                        <input
                            type="file"
                            accept="video/*"
                            onChange={e => setSelectedFile(e.target.files?.[0] || null)}
                            style={{ display: 'none' }}
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', width: '100%' }}>
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4">
                                <rect x="2" y="2" width="20" height="20" rx="4" />
                                <path d="M10 9l5 3-5 3V9z" />
                            </svg>
                            <p className={styles.dropText}>
                                {selectedFile ? selectedFile.name : '動画ファイルを選択'}
                            </p>
                            <p className={styles.dropHint}>MP4, WebM (最大 200MB)</p>
                            <div className="btn-secondary" style={{ marginTop: '12px' }}>
                                ファイルを選択
                            </div>
                        </label>
                    </div>

                    {/* Project Selection */}
                    {!parentNode && (
                        <div className={styles.field}>
                            <label className={styles.label}>プロジェクト</label>
                            <select
                                className="input-field"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">新しいプロジェクトを作る</option>
                                {projects.map((p) => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className={styles.field}>
                        <label className={styles.label}>サムネイル画像URL</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="https://... (空欄の場合ランダムな仮画像が適用されます)"
                            value={formData.thumbnailUrl}
                            onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>タイトル *</label>
                        <input
                            type="text"
                            className="input-field"
                            placeholder="エピソードのタイトル"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>あらすじ</label>
                        <textarea
                            className="input-field"
                            placeholder="このエピソードの概要..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* AI Metadata Section */}
                    <div className={styles.aiSection}>
                        <h3 className={styles.aiTitle}>🤖 AI制作パッケージ</h3>
                        <p className={styles.aiDesc}>
                            制作に使用したプロンプトやAIモデル情報を共有することで、他のクリエイターが世界線を広げやすくなります。
                        </p>

                        {/* Key Prompts */}
                        <div className={styles.field}>
                            <label className={styles.label}>キープロンプト</label>
                            {formData.keyPrompts.map((prompt, i) => (
                                <div key={i} className={styles.promptRow}>
                                    <input
                                        type="text"
                                        className="input-field"
                                        placeholder={`プロンプト ${i + 1}`}
                                        value={prompt}
                                        onChange={(e) => handlePromptChange(i, e.target.value)}
                                    />
                                    {formData.keyPrompts.length > 1 && (
                                        <button type="button" className={styles.removeBtn} onClick={() => removePrompt(i)}>✕</button>
                                    )}
                                </div>
                            ))}
                            <button type="button" className={styles.addBtn} onClick={addPrompt}>
                                + プロンプトを追加
                            </button>
                        </div>

                        {/* AI Model Info */}
                        <div className={styles.field} style={{ marginBottom: '16px' }}>
                            <label className={styles.label}>テンプレートを検索・選択</label>
                            <input 
                                className="input-field"
                                list="ai-models"
                                placeholder="モデル名を入力..."
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const tpl = AI_MODEL_TEMPLATES.find(t => t.label === val);
                                    if (tpl) {
                                        setFormData(prev => ({
                                            ...prev,
                                            aiModelName: tpl.model,
                                            aiModelVersion: tpl.version,
                                            aiModelProvider: tpl.provider
                                        }));
                                    }
                                }}
                            />
                            <datalist id="ai-models">
                                {AI_MODEL_TEMPLATES.map((tpl, i) => (
                                    <option key={i} value={tpl.label} />
                                ))}
                            </datalist>
                        </div>
                        <div className={styles.modelFields}>
                            <div className={styles.field}>
                                <label className={styles.label}>AIモデル名</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="例: Runway Gen-3 Alpha"
                                    value={formData.aiModelName}
                                    onChange={(e) => setFormData({ ...formData, aiModelName: e.target.value })}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>バージョン</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="例: 2025.12"
                                    value={formData.aiModelVersion}
                                    onChange={(e) => setFormData({ ...formData, aiModelVersion: e.target.value })}
                                />
                            </div>
                            <div className={styles.field}>
                                <label className={styles.label}>プロバイダ</label>
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="例: Runway"
                                    value={formData.aiModelProvider}
                                    onChange={(e) => setFormData({ ...formData, aiModelProvider: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit */}
                    <div className={styles.submitRow}>
                        <Link href="/" className="btn-secondary">キャンセル</Link>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={isSubmitting || !formData.title}
                        >
                            {isSubmitting ? (
                                <>
                                    <span className={styles.spinner} />
                                    アップロード中...
                                </>
                            ) : (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" />
                                    </svg>
                                    投稿する
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function UploadPage() {
    return (
        <Suspense fallback={<div className="content-wrapper">Loading...</div>}>
            <UploadContent />
        </Suspense>
    );
}
