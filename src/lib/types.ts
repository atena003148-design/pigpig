// Rhizome - 型定義

export interface Project {
  id: string;
  title: string;
  description: string;
  thumbnail_url: string;
  genre?: string;
  created_by: string;
  created_at: string;
  node_count?: number;
  total_views?: number;
}

export interface VideoNode {
  id: string;
  project_id: string;
  parent_id: string | null;
  episode_x: number;
  branch_y: number;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  view_count: number;
  duration_seconds: number;
  created_by: string;
  created_at: string;
  comment_count?: number;
  heat_score?: number;
}

export interface AIMetadata {
  id: string;
  video_node_id: string;
  key_prompts: string[];
  reference_images: string[];
  ai_model_info: {
    model_name: string;
    version: string;
    provider: string;
  };
  created_at: string;
}

export interface Comment {
  id: string;
  video_node_id: string;
  user_id: string;
  user_name?: string;
  content: string;
  video_timestamp: number;
  color: string;
  created_at: string;
}

export interface StoryMapNode {
  id: string;
  type: 'videoNode';
  position: { x: number; y: number };
  data: VideoNode;
}

export interface StoryMapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  animated?: boolean;
}
