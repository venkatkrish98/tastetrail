'use client';

import { IconClose, IconSparkles } from './Icons';

interface JudgeGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function JudgeGuideModal({ isOpen, onClose }: JudgeGuideModalProps) {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="judge-guide-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.75rem',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
      }}>
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <IconSparkles size={20} color="#fbbf24" />
            </div>
            <div>
              <h2 id="judge-guide-title" style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Qloo Hackathon Judge & Architecture Guide
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                TasteTrail — Cultural Outing Generator & Agentic Discovery Tool
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-sm"
            aria-label="Close modal"
            style={{ padding: '0.4rem' }}
          >
            <IconClose size={18} />
          </button>
        </div>

        {/* 4 Judging Criteria Alignment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-amber)', marginBottom: '0.35rem' }}>
              1. Technological Implementation (Official Qloo API & Agentic Workflow)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              • <strong>Documented Qloo Endpoints:</strong> Uses <code>/search?types=urn:entity:...&query=...</code> for entity resolution and <code>GET /v2/insights</code> with <code>filter.type=urn:entity:place</code>, <code>signal.interests.entities</code>, and spatial coordinates <code>filter.location=POINT(lng lat)</code> via <code>https://hackathon.api.qloo.com</code>.<br />
              • <strong>Autonomous 5-Stage Agentic Pipeline:</strong> (1) Input validation & bounding, (2) Entity resolution, (3) Cultural affinity retrieval, (4) Deterministic constraints filtering, (5) Chronological pacing & dual-layer provenance attribution.<br />
              • <strong>Honest Live Error Handling:</strong> When live Qloo credentials fail or upstream services time out, TasteTrail exposes the error transparently—never silently disguising live failures behind sample data.
            </p>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)', marginBottom: '0.35rem' }}>
              2. Design & User Experience
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              • Original vector brand identity (waypoint + cultural lens) created as safe static SVG.<br />
              • Fully responsive, accessible WCAG AA contrast, keyboard navigability, transparent dwell pacing, and zero interface clutter.
            </p>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-indigo)', marginBottom: '0.35rem' }}>
              3. Potential Impact (Solving the Generic City Outing Dilemma)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              • Visitors and urban explorers with 2–5 hours typically default to commercial tourist traps. TasteTrail bridges cross-domain tastes (e.g., Haruki Murakami readers, Wes Anderson film lovers, Miles Davis jazz fans) into actionable real-world micro-itineraries.
            </p>
          </div>

          <div style={{
            padding: '1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
          }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#10b981', marginBottom: '0.35rem' }}>
              4. Quality of Idea & Meaningful Differentiator
            </h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              • TasteTrail is materially worse without Qloo: the built-in evaluation view contrasts the cultural trail against a generic mass-market tourist baseline (e.g. souvenir shops and fast-food chains) to demonstrate the tangible impact of cultural taste graphs.
            </p>
          </div>
        </div>

        {/* Security, Grounding & Operational Limitations */}
        <div style={{
          padding: '1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(56, 189, 248, 0.05)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          fontSize: '0.8125rem',
          lineHeight: 1.5,
          color: 'var(--text-muted)',
          marginBottom: '1.25rem',
        }}>
          <strong style={{ color: 'var(--accent-cyan)' }}>Security, Truthful Grounding & Operational Limitations:</strong>
          <br />• <strong>Server-side Key Isolation:</strong> <code>QLOO_API_KEY</code> is strictly maintained in server environment variables and never leaked to client bundles or browser logs.
          <br />• <strong>Aggregate Cultural Affinities:</strong> Qloo data reflects collective audience tastes across creative domains—never individual profiling, personal identity claims, or behavioral surveillance.
          <br />• <strong>Zero Fabricated Attributes:</strong> Physical venue accessibility (wheelchair ramps), live opening hours, and real-time ticket prices are NOT tracked by Qloo and are explicitly labeled as unverified.
        </div>

        <button
          type="button"
          onClick={onClose}
          className="btn btn-primary"
          style={{ width: '100%', padding: '0.75rem' }}
        >
          Close Guide & Return to TasteTrail
        </button>
      </div>
    </div>
  );
}
