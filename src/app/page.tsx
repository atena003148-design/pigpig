'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Project, VideoNode } from '@/lib/types';
import styles from './page.module.css';
import videoStyles from '@/components/VideoCard/VideoCard.module.css';

export default function Home() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [allNodes, setAllNodes] = useState<(VideoNode & { project: Project })[]>([]);
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

        setProjects(pList);

        const nodesWithProj = nList.map((n: VideoNode) => ({
          ...n,
          project: pList.find((p: Project) => p.id === n.project_id)
        })).filter((n: any) => n.project);

        setAllNodes(nodesWithProj);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return <div className="content-wrapper" style={{ padding: '100px 0', textAlign: 'center' }}>読み込み中...</div>;
  }

  const trendingNodes = [...allNodes].sort((a, b) => (b.view_count || 0) - (a.view_count || 0));
  const recentNodes = [...allNodes].sort((a, b) =>
    new Date(b.created_at || Date.now()).getTime() - new Date(a.created_at || Date.now()).getTime()
  );
  const branchNodes = allNodes.filter(n => n.branch_y !== 0);

  const featuredProject = projects[0];

  return (
    <div className={styles.homeLayout}>
      {/* Hero Billboard */}
      {featuredProject && (
        <section className={styles.billboard} style={{ backgroundImage: `url(${featuredProject.thumbnail_url})` }}>
          <div className={styles.billboardGradient}></div>
          <div className={styles.billboardContent}>
            <h1 className={styles.billboardTitle}>{featuredProject.title}</h1>
            <p className={styles.billboardDesc}>{featuredProject.description}</p>
            <div className={styles.billboardActions}>
              <Link href={`/project/${featuredProject.id}`} className="btn-primary" style={{ padding: '10px 28px', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', color: '#000', background: '#fff', border: 'none' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z" />
                </svg>
                再生
              </Link>
              <Link href={`/project/${featuredProject.id}`} className="btn-secondary" style={{ padding: '10px 28px', fontSize: '18px', display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(109, 109, 110, 0.7)', color: 'white', border: 'none' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                詳細情報
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Rows for each project */}
      <div className={styles.rowsContainer}>
        {Array.from(new Set(projects.map(p => p.genre || 'その他'))).map((genre) => {
          const genreProjects = projects.filter(p => (p.genre || 'その他') === genre);
          if (genreProjects.length === 0) return null;
          
          return (
            <section key={genre} className={styles.carouselSection}>
              <div className={styles.carouselHeader}>
                <h2 className={styles.carouselTitle}>{genre}</h2>
              </div>
              <div className={styles.carouselContainer}>
                <button
                  className={`${styles.scrollButton} ${styles.scrollLeft}`}
                  onClick={(e) => {
                    const row = e.currentTarget.parentElement?.querySelector(`.${styles.carouselRow}`);
                    if (row) row.scrollBy({ left: -(window.innerWidth * 0.7), behavior: 'smooth' });
                  }}
                  aria-label="Scroll left"
                >
                  〈
                </button>
                <div className={styles.carouselRow}>
                  {genreProjects.map((project, j) => (
                    <Link href={`/project/${project.id}`} key={project.id} className={videoStyles.card}>
                      <div className={videoStyles.thumbnailWrapper}>
                        <img src={project.thumbnail_url} alt={project.title} className={videoStyles.thumbnail} />
                        <div className={videoStyles.overlay}>
                          <h3 className={videoStyles.title}>{project.title}</h3>
                          {project.node_count && (
                            <div className={videoStyles.meta} style={{ marginTop: '8px', opacity: 0.8 }}>
                              全 {project.node_count} エピソード
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
                <button
                  className={`${styles.scrollButton} ${styles.scrollRight}`}
                  onClick={(e) => {
                    const row = e.currentTarget.parentElement?.querySelector(`.${styles.carouselRow}`);
                    if (row) row.scrollBy({ left: window.innerWidth * 0.7, behavior: 'smooth' });
                  }}
                  aria-label="Scroll right"
                >
                  〉
                </button>
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
