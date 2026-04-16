import fs from 'fs/promises';
import path from 'path';
import { mockProjects, mockVideoNodes, mockAIMetadata, mockComments } from './mockData';
import { Project, VideoNode, AIMetadata, Comment } from './types';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');

export interface DB {
    projects: Project[];
    nodes: VideoNode[];
    aiMetadata: AIMetadata[];
    comments: Comment[];
}

export async function ensureDb(): Promise<void> {
    try {
        await fs.access(DB_PATH);
    } catch {
        const initialData: DB = {
            projects: mockProjects,
            nodes: mockVideoNodes,
            aiMetadata: mockAIMetadata,
            comments: mockComments,
        };
        await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
        await fs.writeFile(DB_PATH, JSON.stringify(initialData, null, 2), 'utf-8');
    }
}

export async function readDb(): Promise<DB> {
    await ensureDb();
    const raw = await fs.readFile(DB_PATH, 'utf-8');
    return JSON.parse(raw) as DB;
}

export async function writeDb(data: DB): Promise<void> {
    await ensureDb();
    await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), 'utf-8');
}

// Server-side helpers
export async function getProjects(): Promise<Project[]> {
    const db = await readDb();
    return db.projects;
}

export async function getProjectById(id: string): Promise<Project | undefined> {
    const db = await readDb();
    return db.projects.find((p) => p.id === id);
}

export async function getNodes(): Promise<(VideoNode & { project?: Project })[]> {
    const db = await readDb();
    return db.nodes.map(node => ({
        ...node,
        project: db.projects.find(p => p.id === node.project_id)
    }));
}

export async function getNodeById(id: string): Promise<(VideoNode & { project?: Project }) | undefined> {
    const nodes = await getNodes();
    return nodes.find(n => n.id === id);
}

export async function getNodesByProjectId(projectId: string): Promise<VideoNode[]> {
    const db = await readDb();
    return db.nodes.filter((n) => n.project_id === projectId);
}

export async function getAIMetadataByNodeId(nodeId: string): Promise<AIMetadata | undefined> {
    const db = await readDb();
    return db.aiMetadata.find((m) => m.video_node_id === nodeId);
}

export async function getCommentsByNodeId(nodeId: string): Promise<Comment[]> {
    const db = await readDb();
    return db.comments.filter((c) => c.video_node_id === nodeId).sort((a, b) => a.video_timestamp - b.video_timestamp);
}
