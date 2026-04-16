'use client';

import { useMemo, useEffect, useCallback } from 'react';
import {
    ReactFlow,
    Background,
    Controls,
    MiniMap,
    ConnectionMode,
    useNodesState,
    useEdgesState,
    BackgroundVariant,
} from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import VideoNodeComponent from './VideoNode';
import { VideoNode } from '@/lib/types';
import styles from './StoryMap.module.css';

interface StoryMapProps {
    nodes: VideoNode[];
    focusNodeId?: string;
    onNodeClick?: (node: VideoNode) => void;
    onAddBranch?: (parentNode: VideoNode, direction: 'continue' | 'branch-up' | 'branch-down') => void;
}

const X_GAP = 360;
const Y_GAP = 240;

type VideoFlowNode = Node<Record<string, unknown>, 'videoNode'>;

const nodeTypes = {
    videoNode: VideoNodeComponent,
};

export default function StoryMap({ nodes, focusNodeId, onNodeClick, onAddBranch }: StoryMapProps) {
    const { flowNodes, flowEdges } = useMemo(() => {
        const fNodes: VideoFlowNode[] = nodes.map((node) => ({
            id: node.id,
            type: 'videoNode' as const,
            position: {
                x: node.episode_x * X_GAP,
                y: node.branch_y * Y_GAP,
            },
            data: {
                ...node,
                isFocused: node.id === focusNodeId,
                onNodeClick: () => onNodeClick?.(node),
                onAddBranch: (direction: 'continue' | 'branch-up' | 'branch-down') => onAddBranch?.(node, direction),
            } as Record<string, unknown>,
        }));

        const fEdges: Edge[] = nodes
            .filter((n) => n.parent_id)
            .map((node) => ({
                id: `edge-${node.parent_id}-${node.id}`,
                source: node.parent_id!,
                target: node.id,
                type: 'smoothstep',
                animated: true,
                style: {
                    stroke: node.branch_y !== 0 ? 'var(--accent-primary)' : 'var(--accent-primary)',
                    strokeWidth: 2,
                },
            }));

        return { flowNodes: fNodes, flowEdges: fEdges };
    }, [nodes, focusNodeId, onNodeClick, onAddBranch]);

    const [rNodes, setNodes, onNodesChangeOriginal] = useNodesState(flowNodes);
    const [rEdges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

    // Sync state when props changes
    useEffect(() => {
        setNodes(flowNodes);
        setEdges(flowEdges);
    }, [flowNodes, flowEdges, setNodes, setEdges]);

    const onNodesChange = useCallback(
        (changes: any) => {
            const constrainedChanges = changes.map((c: any) => {
                if (c.type === 'position' && c.position) {
                    const node = rNodes.find((n) => n.id === c.id);
                    if (node) {
                        const branch_y = node.data.branch_y as number;
                        const episode_x = node.data.episode_x as number;

                        const isMainLine = branch_y === 0;
                        if (isMainLine) {
                            // メインライン: y を初期位置に固定
                            return { ...c, position: { x: c.position.x, y: branch_y * 240 } };
                        } else {
                            // 分岐ストーリー: x を初期位置に固定
                            return { ...c, position: { x: episode_x * 360, y: c.position.y } };
                        }
                    }
                }
                return c;
            });
            onNodesChangeOriginal(constrainedChanges);
        },
        [rNodes, onNodesChangeOriginal]
    );

    const defaultViewport = useMemo(() => {
        if (focusNodeId) {
            const focusNode = nodes.find((n) => n.id === focusNodeId);
            if (focusNode) {
                return {
                    x: -(focusNode.episode_x * X_GAP) + 200,
                    y: -(focusNode.branch_y * Y_GAP) + 200,
                    zoom: 0.85,
                };
            }
        }
        return { x: 100, y: 150, zoom: 0.8 };
    }, [focusNodeId, nodes]);

    return (
        <div className={styles.mapContainer}>
            <ReactFlow
                nodes={rNodes}
                edges={rEdges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                connectionMode={ConnectionMode.Loose}
                defaultViewport={defaultViewport}
                fitView={!focusNodeId}
                fitViewOptions={{ padding: 0.3 }}
                minZoom={0.2}
                maxZoom={1.5}
                proOptions={{ hideAttribution: true }}
            >
                <Background
                    variant={BackgroundVariant.Dots}
                    gap={24}
                    size={1}
                    color="rgba(255,255,255,0.05)"
                />
                <Controls
                    className={styles.controls}
                    showInteractive={false}
                />
                <MiniMap
                    className={styles.minimap}
                    nodeColor={(node: VideoFlowNode) => {
                        const data = node.data as Record<string, unknown>;
                        if (data.isFocused) return '#3b82f6';
                        if ((data.branch_y as number) !== 0) return '#666666';
                        return '#666666';
                    }}
                    maskColor="rgba(0,0,0,0.7)"
                />
            </ReactFlow>

            {/* Legend */}
            <div className={styles.legend}>
                <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: 'var(--accent-primary)' }} />
                    <span>メインライン</span>
                </div>
                <div className={styles.legendItem}>
                    <div className={styles.legendDot} style={{ background: 'var(--accent-primary)' }} />
                    <span>分岐ストーリー</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendArrow}>→</span>
                    <span>エピソード進行</span>
                </div>
                <div className={styles.legendItem}>
                    <span className={styles.legendArrow}>↕</span>
                    <span>世界線分岐</span>
                </div>
            </div>
        </div>
    );
}
