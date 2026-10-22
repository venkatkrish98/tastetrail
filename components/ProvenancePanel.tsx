'use client';

import React, { useState } from 'react';
import { ProvenanceBreakdown } from '@/lib/types';
import { IconProvenance } from './Icons';

interface ProvenancePanelProps {
  provenance: ProvenanceBreakdown;
}

export function ProvenancePanel({ provenance }: ProvenancePanelProps) {
  const [activeTab, setActiveTab] = useState<'both' | 'qloo' | 'app'>('both');

  const { qlooIntelligence, appConstraints } = provenance;

  return (
    <div className="card" style={{
      maxWidth: '820px',
      margin: '2rem auto 0 auto',
      borderColor: 'rgba(99, 102, 241, 0.3)',
      backgroundColor: 'rgba(15, 23, 42, 0.9)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconProvenance size={18} color="var(--accent-indigo)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Dual-Layer Provenance Breakdown
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Traceable distinction: Qloo Cultural Intelligence vs. App-Side Practical Rules
            </p>
          </div>
        </div>

        {/* Filter View Tabs */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface)',
          padding: '0.2rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}>
          {(['both', 'qloo', 'app'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeTab === tab ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === tab ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {tab === 'both' ? 'Unified View' : tab === 'qloo' ? 'Qloo Signals Only' : 'App Decisions Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Two Column Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeTab === 'both' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
        gap: '1.25rem',
      }}>
        {/* Layer 1: Qloo Cultural Intelligence */}
        {(activeTab === 'both' || activeTab === 'qloo') && (
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(245, 158, 11, 0.05)',
            border: '1px solid rgba(245, 158, 11, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span className={qlooIntelligence.isSampleData ? 'badge badge-sample' : 'badge badge-qloo'}>
                  Layer 1
                </span>
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fbbf24' }}>
                  Cultural Intelligence Signals
                </h4>
              </div>
              <span style={{ fontSize: '0.6875rem', color: qlooIntelligence.isSampleData ? '#d8b4fe' : 'var(--accent-cyan)', fontWeight: 600 }}>
                {qlooIntelligence.isSampleData ? 'Sample Catalog' : 'Live Qloo API'}
              </span>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Upstream Endpoint:</span>
                <span style={{ fontFamily: 'monospace', color: 'var(--accent-amber)', fontSize: '0.75rem' }}>
                  {qlooIntelligence.apiEndpointUsed}
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Anchors Processed:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {qlooIntelligence.anchorsProcessed.join(' • ')}
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Raw Candidates Evaluated:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {qlooIntelligence.candidatesRetrieved} places
                </span>
              </li>
              <li style={{ paddingBottom: '0.4rem', borderBottom: '1px solid rgba(245, 158, 11, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Metric Definition:</span>
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {qlooIntelligence.affinityMetricDescription}
                </span>
              </li>
            </ul>

            {/* Ethical AI & Operational Limitation Notice */}
            <div style={{
              marginTop: '1rem',
              padding: '0.75rem',
              borderRadius: 'var(--radius-sm)',
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              fontSize: '0.75rem',
              color: '#d4d4d8',
              lineHeight: 1.5,
              borderLeft: '2px solid #f59e0b',
            }}>
              <strong>Grounding & Ethics Notice:</strong> {qlooIntelligence.disclaimer}
            </div>
          </div>
        )}

        {/* Layer 2: TasteTrail App Constraints */}
        {(activeTab === 'both' || activeTab === 'app') && (
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(56, 189, 248, 0.05)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
              <span className="badge badge-app">Layer 2</span>
              <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                App Deterministic Decisions
              </h4>
            </div>

            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.8125rem' }}>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(56, 189, 248, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Duration Enforced:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {appConstraints.allocatedDurationMinutes} min / {appConstraints.totalDurationLimitMinutes} min cap
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(56, 189, 248, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Budget Tier Filter:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>
                  {appConstraints.budgetTierApplied}
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(56, 189, 248, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mobility Rules Applied:</span>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                  {appConstraints.mobilityFiltersEnforced.length > 0
                    ? appConstraints.mobilityFiltersEnforced.join(', ')
                    : 'Standard Baseline'}
                </span>
              </li>
              <li style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '0.4rem', borderBottom: '1px solid rgba(56, 189, 248, 0.1)' }}>
                <span style={{ color: 'var(--text-muted)' }}>Candidates Excluded:</span>
                <span style={{ fontWeight: 600, color: 'var(--status-warning)' }}>
                  {appConstraints.candidatesFilteredOutCount} venues non-conforming
                </span>
              </li>
              <li style={{ paddingTop: '0.2rem' }}>
                <span style={{ color: 'var(--text-muted)', display: 'block', marginBottom: '0.2rem' }}>Sequencing Policy:</span>
                <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>
                  {appConstraints.sequencingStrategy}
                </span>
              </li>
            </ul>

            {appConstraints.unverifiedAdvisories && appConstraints.unverifiedAdvisories.length > 0 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                fontSize: '0.75rem',
                color: '#fca5a5',
              }}>
                <div style={{ fontWeight: 700, marginBottom: '0.35rem', color: '#f87171' }}>
                  Physical Venue Advisories (Manual Verification Required):
                </div>
                <ul style={{ paddingLeft: '1.2rem', margin: 0 }}>
                  {appConstraints.unverifiedAdvisories.map((adv, idx) => (
                    <li key={idx} style={{ marginBottom: '0.25rem' }}>{adv}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
