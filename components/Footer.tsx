'use client';

import React from 'react';

export function Footer() {
  return (
    <footer style={{
      borderTop: '1px solid var(--border-subtle)',
      backgroundColor: 'var(--bg-secondary)',
      padding: '2.5rem 0 2rem 0',
      marginTop: '4rem',
    }}>
      <div className="container" style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: '1.25rem',
      }}>
        {/* Brand line */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.125rem',
            color: 'var(--text-main)',
          }}>
            TasteTrail
          </span>
          <span style={{ color: 'var(--text-dim)' }}>•</span>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Built for the Qloo Agentic Hackathon
          </span>
        </div>

        {/* Ethical AI & Aggregate Cultural Affinity Disclosure */}
        <p style={{
          maxWidth: '680px',
          fontSize: '0.8125rem',
          color: 'var(--text-muted)',
          lineHeight: 1.6,
        }}>
          <strong>Cultural Intelligence Notice:</strong> TasteTrail utilizes the Qloo Taste AI API to analyze aggregate cultural affinities across films, literature, music, and physical venues. Qloo outputs represent collective taste resonance across creative communities and are never presented as proof of an individual’s identity, private preferences, or predictive behavioral profiling.
        </p>

        {/* Security, Open Source & License */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          fontSize: '0.75rem',
          color: 'var(--text-dim)',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}>
          <span>Released under the <strong>MIT Open Source License</strong></span>
          <span>•</span>
          <span>Server-side Key Isolation (Zero client exposure)</span>
          <span>•</span>
          <span>Estimates only — venue details independently verified</span>
        </div>
      </div>
    </footer>
  );
}
