'use client';

import React, { useState, useEffect } from 'react';
import { IconInfo } from './Icons';

interface HeaderProps {
  onOpenJudgeGuide: () => void;
}

export function Header({ onOpenJudgeGuide }: HeaderProps) {
  const [apiStatus, setApiStatus] = useState<{
    configured: boolean;
    mode: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/qloo/status')
      .then(res => res.json())
      .then(data => setApiStatus(data))
      .catch(() => setApiStatus({ configured: false, mode: 'sample_fixture', message: 'Offline mode' }));
  }, []);

  return (
    <header style={{
      borderBottom: '1px solid var(--border-subtle)',
      backgroundColor: 'rgba(10, 14, 23, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      padding: '0.85rem 0',
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
      }}>
        {/* Brand identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
          }}>
            <svg width="28" height="28" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="21" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="4 4" strokeOpacity="0.5" />
              <path d="M12 34 C12 26, 20 22, 24 16 C28 22, 36 26, 36 34 C36 40, 30 42, 24 42 C18 42, 12 40, 12 34 Z" fill="#6366f1" fillOpacity="0.7" />
              <path d="M10 24 C16 16, 32 16, 38 24 C32 32, 16 32, 10 24 Z" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="24" cy="24" r="4" fill="#f59e0b" />
              <circle cx="24" cy="24" r="1.5" fill="#ffffff" />
            </svg>
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1.25rem',
                letterSpacing: '-0.02em',
                background: 'linear-gradient(135deg, #ffffff 60%, #94a3b8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}>
                TasteTrail
              </span>
              <span style={{
                fontSize: '0.6875rem',
                padding: '0.15rem 0.45rem',
                borderRadius: '4px',
                background: 'rgba(245, 158, 11, 0.15)',
                color: '#fbbf24',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                fontWeight: 700,
              }}>
                QLOO AGENTIC
              </span>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Cultural Outing Itineraries via Qloo Taste Intelligence
            </p>
          </div>
        </div>

        {/* Status indicator & Judge Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {apiStatus && (
            <div
              className={`badge ${apiStatus.configured ? 'badge-live' : 'badge-sample'}`}
              title={apiStatus.message}
              style={{ cursor: 'help' }}
            >
              <span style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: apiStatus.configured ? '#10b981' : '#a855f7',
                display: 'inline-block',
              }} />
              {apiStatus.configured ? 'Key Configured' : 'Sample Fixture Mode'}
            </div>
          )}

          <button
            type="button"
            onClick={onOpenJudgeGuide}
            className="btn btn-secondary btn-sm"
            aria-label="Open Judge & Architecture Guide"
          >
            <IconInfo size={15} color="var(--accent-cyan)" />
            <span>Judge Guide</span>
          </button>
        </div>
      </div>
    </header>
  );
}
