import { Project, VideoNode, AIMetadata, Comment } from './types';

// --- サンプル動画URL（Big Buck Bunny） ---
const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_THUMB_1 = 'https://picsum.photos/seed/thumb1/320/180';
const SAMPLE_THUMB_2 = 'https://picsum.photos/seed/thumb2/320/180';
const SAMPLE_THUMB_3 = 'https://picsum.photos/seed/thumb3/320/180';
const SAMPLE_THUMB_4 = 'https://picsum.photos/seed/thumb4/320/180';
const SAMPLE_THUMB_5 = 'https://picsum.photos/seed/thumb5/320/180';
const SAMPLE_THUMB_6 = 'https://picsum.photos/seed/thumb6/320/180';

// --- プロジェクト ---
export const mockProjects: Project[] = [
    {
        id: 'proj-1',
        title: '星降る夜のアリア',
        description: '宇宙を漂う少女と機械の鳥の物語。無数の世界線が交差する壮大なSFアニメーション。',
        thumbnail_url: SAMPLE_THUMB_1,
        genre: 'SF・ファンタジー',
        created_by: 'user-1',
        created_at: '2026-03-01T00:00:00Z',
        node_count: 8,
        total_views: 124500,
    },
    {
        id: 'proj-2',
        title: '深海回廊',
        description: '海底都市に眠る古代の記憶。ダイバーたちが見つけた秘密とは。',
        thumbnail_url: SAMPLE_THUMB_2,
        genre: 'ミステリー・サスペンス',
        created_by: 'user-2',
        created_at: '2026-03-10T00:00:00Z',
        node_count: 5,
        total_views: 87200,
    },
    {
        id: 'proj-3',
        title: '量子庭園',
        description: '観測するたびに変化する庭で、少年は失われた花を探す。',
        thumbnail_url: SAMPLE_THUMB_3,
        genre: 'SF・ファンタジー',
        created_by: 'user-3',
        created_at: '2026-03-15T00:00:00Z',
        node_count: 6,
        total_views: 56800,
    },
    {
        id: 'proj-4',
        title: '紙飛行機の終着点',
        description: '教室から飛ばした紙飛行機が辿り着く、もう一つの世界。',
        thumbnail_url: SAMPLE_THUMB_4,
        genre: 'ヒューマンドラマ',
        created_by: 'user-1',
        created_at: '2026-03-20T00:00:00Z',
        node_count: 4,
        total_views: 34100,
    },
    {
        id: 'proj-5',
        title: '逆光のシルエット',
        description: '影だけの世界で、自分自身の輪郭を探し続ける旅。',
        thumbnail_url: SAMPLE_THUMB_5,
        genre: 'ヒューマンドラマ',
        created_by: 'user-4',
        created_at: '2026-03-25T00:00:00Z',
        node_count: 3,
        total_views: 21400,
    },
    {
        id: 'proj-6',
        title: '廃線上のワルツ',
        description: '使われなくなった線路の上で踊る幽霊たちの物語。',
        thumbnail_url: SAMPLE_THUMB_6,
        genre: 'ミステリー・サスペンス',
        created_by: 'user-5',
        created_at: '2026-04-01T00:00:00Z',
        node_count: 7,
        total_views: 98700,
    },
    {
        id: 'proj-7',
        title: '機械仕掛けの妖精',
        description: '廃棄された工場で目覚めた小さな機械。',
        thumbnail_url: SAMPLE_THUMB_1,
        genre: 'SF・ファンタジー',
        created_by: 'user-1',
        created_at: '2026-04-02T00:00:00Z',
        node_count: 1,
        total_views: 4300,
    },
    {
        id: 'proj-8',
        title: '星間郵便局',
        description: '何百光年も離れた星へ想いを届ける配達員たち。',
        thumbnail_url: SAMPLE_THUMB_2,
        genre: 'SF・ファンタジー',
        created_by: 'user-2',
        created_at: '2026-04-03T00:00:00Z',
        node_count: 1,
        total_views: 6500,
    },
    {
        id: 'proj-9',
        title: 'サイバー・シティの亡霊',
        description: 'ネオン輝く街でハッカーが見た幻想。',
        thumbnail_url: SAMPLE_THUMB_3,
        genre: 'SF・ファンタジー',
        created_by: 'user-3',
        created_at: '2026-04-04T00:00:00Z',
        node_count: 1,
        total_views: 8200,
    },
    {
        id: 'proj-10',
        title: '時間の彼方',
        description: '過去へ戻るチケットを手にした男の選択。',
        thumbnail_url: SAMPLE_THUMB_4,
        genre: 'SF・ファンタジー',
        created_by: 'user-4',
        created_at: '2026-04-05T00:00:00Z',
        node_count: 1,
        total_views: 11000,
    },
    {
        id: 'proj-11',
        title: '月面リゾート',
        description: '月への旅行が日常になった未来のバカンス。',
        thumbnail_url: SAMPLE_THUMB_5,
        genre: 'SF・ファンタジー',
        created_by: 'user-5',
        created_at: '2026-04-06T00:00:00Z',
        node_count: 1,
        total_views: 3100,
    },
    {
        id: 'proj-12',
        title: 'アンドロイドの見る夢',
        description: 'プログラムされた感情と、どこからか湧き上がる想い。',
        thumbnail_url: SAMPLE_THUMB_6,
        genre: 'SF・ファンタジー',
        created_by: 'user-1',
        created_at: '2026-04-07T00:00:00Z',
        node_count: 1,
        total_views: 9200,
    },
    {
        id: 'proj-13',
        title: 'ディープ・ダイブ',
        description: '電脳空間の深層に潜るダイバーの記録。',
        thumbnail_url: SAMPLE_THUMB_1,
        genre: 'SF・ファンタジー',
        created_by: 'user-2',
        created_at: '2026-04-08T00:00:00Z',
        node_count: 1,
        total_views: 15400,
    },
    {
        id: 'proj-14',
        title: '忘却の街',
        description: '記憶を失った人々が集う、謎めいた街。',
        thumbnail_url: SAMPLE_THUMB_2,
        genre: 'ミステリー・サスペンス',
        created_by: 'user-3',
        created_at: '2026-04-09T00:00:00Z',
        node_count: 1,
        total_views: 12100,
    },
    {
        id: 'proj-15',
        title: '真夜中の図書館',
        description: '夜中の12時にしか開かない特別な図書館の秘密。',
        thumbnail_url: SAMPLE_THUMB_3,
        genre: 'ミステリー・サスペンス',
        created_by: 'user-4',
        created_at: '2026-04-10T00:00:00Z',
        node_count: 1,
        total_views: 7600,
    }
];

// --- 動画ノード（プロジェクト1：星降る夜のアリア） ---
export const mockVideoNodes: VideoNode[] = [
    // メインライン
    {
        id: 'node-1',
        project_id: 'proj-1',
        parent_id: null,
        episode_x: 0,
        branch_y: 0,
        title: '第1話：覚醒',
        description: '宇宙ステーション「アリア」で少女は目を覚ます。記憶はない。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_1,
        view_count: 45200,
        duration_seconds: 180,
        created_by: 'user-1',
        created_at: '2026-03-01T00:00:00Z',
        comment_count: 342,
        heat_score: 0.95,
    },
    {
        id: 'node-2',
        project_id: 'proj-1',
        parent_id: 'node-1',
        episode_x: 1,
        branch_y: 0,
        title: '第2話：機械の鳥',
        description: '少女は壊れかけの機械鳥と出会い、共に外の世界を目指す。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_2,
        view_count: 38100,
        duration_seconds: 210,
        created_by: 'user-1',
        created_at: '2026-03-05T00:00:00Z',
        comment_count: 287,
        heat_score: 0.85,
    },
    {
        id: 'node-3',
        project_id: 'proj-1',
        parent_id: 'node-2',
        episode_x: 2,
        branch_y: 0,
        title: '第3話：星の海',
        description: '脱出に成功した二人は、無限に広がる星の海を漂う。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_3,
        view_count: 31500,
        duration_seconds: 195,
        created_by: 'user-2',
        created_at: '2026-03-10T00:00:00Z',
        comment_count: 198,
        heat_score: 0.72,
    },
    {
        id: 'node-4',
        project_id: 'proj-1',
        parent_id: 'node-3',
        episode_x: 3,
        branch_y: 0,
        title: '第4話：再会',
        description: '漂流の果てに辿り着いた惑星で、少女は自分を知る者と出会う。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_4,
        view_count: 28900,
        duration_seconds: 240,
        created_by: 'user-2',
        created_at: '2026-03-15T00:00:00Z',
        comment_count: 412,
        heat_score: 0.98,
    },
    // 分岐1（node-2から分岐）
    {
        id: 'node-5',
        project_id: 'proj-1',
        parent_id: 'node-2',
        episode_x: 2,
        branch_y: 1,
        title: '第3話B：捕獲',
        description: '【分岐】脱出に失敗し、ステーション管理AIに捕らえられる。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_5,
        view_count: 22300,
        duration_seconds: 165,
        created_by: 'user-3',
        created_at: '2026-03-12T00:00:00Z',
        comment_count: 156,
        heat_score: 0.65,
    },
    {
        id: 'node-6',
        project_id: 'proj-1',
        parent_id: 'node-5',
        episode_x: 3,
        branch_y: 1,
        title: '第4話B：反乱',
        description: '【分岐】捕らえられた少女がAIのコアに接触し、真実を知る。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_6,
        view_count: 19800,
        duration_seconds: 200,
        created_by: 'user-3',
        created_at: '2026-03-18T00:00:00Z',
        comment_count: 231,
        heat_score: 0.78,
    },
    // 分岐2（node-1から分岐）
    {
        id: 'node-7',
        project_id: 'proj-1',
        parent_id: 'node-1',
        episode_x: 1,
        branch_y: -1,
        title: '第2話C：記憶の残滓',
        description: '【分岐】少女が記憶の断片を辿り、ステーションの秘密に迫る。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_3,
        view_count: 15600,
        duration_seconds: 175,
        created_by: 'user-4',
        created_at: '2026-03-08T00:00:00Z',
        comment_count: 98,
        heat_score: 0.45,
    },
    {
        id: 'node-8',
        project_id: 'proj-1',
        parent_id: 'node-7',
        episode_x: 2,
        branch_y: -1,
        title: '第3話C：観測者',
        description: '【分岐】記憶の奥で、すべてを見つめていた存在と対面する。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_1,
        view_count: 12400,
        duration_seconds: 190,
        created_by: 'user-4',
        created_at: '2026-03-14T00:00:00Z',
        comment_count: 145,
        heat_score: 0.55,
    },
    // プロジェクト2: 深海回廊
    {
        id: 'node-p2-1',
        project_id: 'proj-2',
        parent_id: null,
        episode_x: 0,
        branch_y: 0,
        title: '第1話：静かなる潜行',
        description: '光の届かない漆黒の海へ、彼らは潜っていく。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_2,
        view_count: 5500,
        duration_seconds: 120,
        created_by: 'user-2',
        created_at: '2026-03-10T00:00:00Z',
        comment_count: 12,
        heat_score: 0.6,
    },
    // プロジェクト3: 量子庭園
    {
        id: 'node-p3-1',
        project_id: 'proj-3',
        parent_id: null,
        episode_x: 0,
        branch_y: 0,
        title: '第1話：不確かな観測',
        description: '少年はただ見つめることしかできない。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_3,
        view_count: 8500,
        duration_seconds: 90,
        created_by: 'user-3',
        created_at: '2026-03-15T00:00:00Z',
        comment_count: 45,
        heat_score: 0.7,
    },
    // プロジェクト4: 紙飛行機の終着点
    {
        id: 'node-p4-1',
        project_id: 'proj-4',
        parent_id: null,
        episode_x: 0,
        branch_y: 0,
        title: '第1話：飛翔',
        description: '教室の窓から投げられた一つの願い。',
        video_url: SAMPLE_VIDEO,
        thumbnail_url: SAMPLE_THUMB_4,
        view_count: 12500,
        duration_seconds: 60,
        created_by: 'user-1',
        created_at: '2026-03-20T00:00:00Z',
        comment_count: 88,
        heat_score: 0.8,
    },
    // 追加プロジェクトのノード
    { id: 'node-p7-1', project_id: 'proj-7', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_1, view_count: 100, duration_seconds: 60, created_by: 'user-1', created_at: '2026-04-02T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p8-1', project_id: 'proj-8', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_2, view_count: 100, duration_seconds: 60, created_by: 'user-2', created_at: '2026-04-03T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p9-1', project_id: 'proj-9', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_3, view_count: 100, duration_seconds: 60, created_by: 'user-3', created_at: '2026-04-04T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p10-1', project_id: 'proj-10', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_4, view_count: 100, duration_seconds: 60, created_by: 'user-4', created_at: '2026-04-05T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p11-1', project_id: 'proj-11', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_5, view_count: 100, duration_seconds: 60, created_by: 'user-5', created_at: '2026-04-06T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p12-1', project_id: 'proj-12', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_6, view_count: 100, duration_seconds: 60, created_by: 'user-1', created_at: '2026-04-07T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p13-1', project_id: 'proj-13', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_1, view_count: 100, duration_seconds: 60, created_by: 'user-2', created_at: '2026-04-08T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p14-1', project_id: 'proj-14', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_2, view_count: 100, duration_seconds: 60, created_by: 'user-3', created_at: '2026-04-09T00:00:00Z', comment_count: 1, heat_score: 0.5 },
    { id: 'node-p15-1', project_id: 'proj-15', parent_id: null, episode_x: 0, branch_y: 0, title: '第1話', description: 'サンプル', video_url: SAMPLE_VIDEO, thumbnail_url: SAMPLE_THUMB_3, view_count: 100, duration_seconds: 60, created_by: 'user-4', created_at: '2026-04-10T00:00:00Z', comment_count: 1, heat_score: 0.5 },
];

// --- AIメタデータ ---
export const mockAIMetadata: AIMetadata[] = [
    {
        id: 'meta-1',
        video_node_id: 'node-1',
        key_prompts: [
            'A girl floating in a space station, ethereal lighting, anime style',
            'Zero gravity environment, soft particle effects, cyberpunk aesthetic',
            'Opening eyes slowly, cosmic background visible through window',
        ],
        reference_images: [SAMPLE_THUMB_1, SAMPLE_THUMB_2],
        ai_model_info: {
            model_name: 'Runway Gen-3 Alpha',
            version: '2025.12',
            provider: 'Runway',
        },
        created_at: '2026-03-01T00:00:00Z',
    },
    {
        id: 'meta-2',
        video_node_id: 'node-2',
        key_prompts: [
            'Mechanical bird companion, steampunk design, glowing blue eyes',
            'Girl and bird exploring dark corridors, emergency lights',
            'Reaching toward an escape pod, dramatic angle',
        ],
        reference_images: [SAMPLE_THUMB_2],
        ai_model_info: {
            model_name: 'Kling AI',
            version: '1.6',
            provider: 'Kuaishou',
        },
        created_at: '2026-03-05T00:00:00Z',
    },
];

// --- コメント（ニコニコスタイル） ---
export const mockComments: Comment[] = [
    { id: 'c-1', video_node_id: 'node-1', user_id: 'u-1', user_name: 'cos_painter', content: '作画やばい', video_timestamp: 3.2, color: '#FFFFFF', created_at: '2026-03-02T00:00:00Z' },
    { id: 'c-2', video_node_id: 'node-1', user_id: 'u-2', user_name: 'astro_fan', content: 'この宇宙ステーションの設定好き', video_timestamp: 8.5, color: '#00FF88', created_at: '2026-03-02T01:00:00Z' },
    { id: 'c-3', video_node_id: 'node-1', user_id: 'u-3', user_name: 'night_sky', content: 'ここで分岐ほしい！', video_timestamp: 15.0, color: '#FF6B6B', created_at: '2026-03-02T02:00:00Z' },
    { id: 'c-4', video_node_id: 'node-1', user_id: 'u-4', user_name: 'mecha_love', content: 'BGMも神', video_timestamp: 22.1, color: '#FFFFFF', created_at: '2026-03-02T03:00:00Z' },
    { id: 'c-5', video_node_id: 'node-1', user_id: 'u-5', user_name: 'anime_critic', content: 'エヴァっぽい雰囲気ある', video_timestamp: 30.0, color: '#FFD93D', created_at: '2026-03-02T04:00:00Z' },
    { id: 'c-6', video_node_id: 'node-1', user_id: 'u-6', user_name: 'pixel_art', content: 'すごすぎて草', video_timestamp: 5.0, color: '#FFFFFF', created_at: '2026-03-02T05:00:00Z' },
    { id: 'c-7', video_node_id: 'node-1', user_id: 'u-7', user_name: 'story_worm', content: '続き気になる', video_timestamp: 45.0, color: '#C084FC', created_at: '2026-03-02T06:00:00Z' },
    { id: 'c-8', video_node_id: 'node-1', user_id: 'u-8', user_name: 'genAI_lab', content: 'これAIで作ったの!?', video_timestamp: 12.0, color: '#00D4FF', created_at: '2026-03-02T07:00:00Z' },
    { id: 'c-9', video_node_id: 'node-1', user_id: 'u-9', user_name: 'dream_seeker', content: '映画みたい', video_timestamp: 55.0, color: '#FFFFFF', created_at: '2026-03-02T08:00:00Z' },
    { id: 'c-10', video_node_id: 'node-1', user_id: 'u-10', user_name: 'creator_z', content: '自分も分岐作りたい', video_timestamp: 60.0, color: '#FF6B6B', created_at: '2026-03-02T09:00:00Z' },
    { id: 'c-11', video_node_id: 'node-1', user_id: 'u-11', user_name: 'otaku_pro', content: 'ここの光の表現えぐい', video_timestamp: 18.0, color: '#FFD93D', created_at: '2026-03-02T10:00:00Z' },
    { id: 'c-12', video_node_id: 'node-1', user_id: 'u-12', user_name: 'sci_fi_nerd', content: 'SF好きにはたまらない', video_timestamp: 35.0, color: '#00FF88', created_at: '2026-03-02T11:00:00Z' },
    { id: 'c-13', video_node_id: 'node-4', user_id: 'u-1', user_name: 'cos_painter', content: 'ここで泣いた', video_timestamp: 120.0, color: '#FF6B6B', created_at: '2026-03-16T00:00:00Z' },
    { id: 'c-14', video_node_id: 'node-4', user_id: 'u-3', user_name: 'night_sky', content: '再会シーン最高', video_timestamp: 150.0, color: '#FFFFFF', created_at: '2026-03-16T01:00:00Z' },
    { id: 'c-15', video_node_id: 'node-4', user_id: 'u-5', user_name: 'anime_critic', content: '伏線回収！', video_timestamp: 180.0, color: '#FFD93D', created_at: '2026-03-16T02:00:00Z' },
];

// --- ヘルパー関数 ---
export function getProjectById(id: string): Project | undefined {
    return mockProjects.find(p => p.id === id);
}

export function getNodesByProjectId(projectId: string): VideoNode[] {
    return mockVideoNodes.filter(n => n.project_id === projectId);
}

export function getNodeById(id: string): VideoNode | undefined {
    return mockVideoNodes.find(n => n.id === id);
}

export function getCommentsByNodeId(nodeId: string): Comment[] {
    return mockComments.filter(c => c.video_node_id === nodeId);
}

export function getAIMetadataByNodeId(nodeId: string): AIMetadata | undefined {
    return mockAIMetadata.find(m => m.video_node_id === nodeId);
}

export function getTrendingNodes(): VideoNode[] {
    return [...mockVideoNodes].sort((a, b) => b.view_count - a.view_count);
}

export function getAllNodesWithProjects(): (VideoNode & { project: Project })[] {
    return mockVideoNodes.map(node => ({
        ...node,
        project: mockProjects.find(p => p.id === node.project_id)!,
    })).filter(n => n.project);
}
