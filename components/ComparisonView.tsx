'use client';

import React, { useState } from 'react';
import { OutingPlanResult } from '@/lib/types';
import { IconCompare, IconSparkles, IconInfo } from './Icons';

interface ComparisonViewProps {
  plan: OutingPlanResult;
}

export function ComparisonView({ plan }: ComparisonViewProps) {
  const [activeTab, setActiveTab] = useState<'with_qloo' | 'without_qloo' | 'split'>('split');

  if (!plan.baselineComparison) return null;

  const { baselineStops, differenceSummary, methodologyNotice } = plan.baselineComparison;

  return (
    <div className="card" style={{
      maxWidth: '820px',
      margin: '2rem auto 0 auto',
      borderColor: 'rgba(56, 189, 248, 0.4)',
      backgroundColor: 'rgba(10, 14, 23, 0.95)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconCompare size={18} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Evaluation Benchmark: With Qloo vs. Generic Tourist Baseline
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Case study contrasting cultural taste graph curation against mass commercial density
            </p>
          </div>
        </div>

        {/* View Toggle */}
        <div style={{
          display: 'flex',
          backgroundColor: 'var(--bg-surface)',
          padding: '0.2rem',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
        }}>
          {(['split', 'with_qloo', 'without_qloo'] as const).map((view) => (
            <button
              key={view}
              type="button"
              onClick={() => setActiveTab(view)}
              style={{
                padding: '0.25rem 0.65rem',
                fontSize: '0.75rem',
                fontWeight: 600,
                borderRadius: '4px',
                border: 'none',
                backgroundColor: activeTab === view ? 'var(--bg-surface-elevated)' : 'transparent',
                color: activeTab === view ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
              }}
            >
              {view === 'split' ? 'Side-by-Side' : view === 'with_qloo' ? 'With Qloo' : 'Reference Baseline'}
            </button>
          ))}
        </div>
      </div>

      {/* Transparent Methodology Disclosure Banner */}
      <div style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(245, 158, 11, 0.08)',
        border: '1px solid rgba(245, 158, 11, 0.3)',
        marginBottom: '1.25rem',
        fontSize: '0.8125rem',
        lineHeight: 1.5,
        color: '#fef3c7',
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
      }}>
        <IconInfo size={16} color="#fbbf24" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
        <div>
          <strong style={{ color: '#fbbf24' }}>Judge Disclosure & Methodology:</strong> {methodologyNotice}
        </div>
      </div>

      {/* Difference Explanation */}
      <div style={{
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'rgba(56, 189, 248, 0.08)',
        border: '1px solid rgba(56, 189, 248, 0.25)',
        marginBottom: '1.5rem',
        fontSize: '0.875rem',
        lineHeight: 1.5,
        color: 'var(--text-main)',
      }}>
        <strong style={{ color: 'var(--accent-cyan)' }}>Observed Differentiation: </strong>
        {differenceSummary}
      </div>

      {/* Comparison Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: activeTab === 'split' ? 'repeat(auto-fit, minmax(320px, 1fr))' : '1fr',
        gap: '1.25rem',
      }}>
        {/* Column 1: With Qloo (Culturally Grounded) */}
        {(activeTab === 'split' || activeTab === 'with_qloo') && (
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(245, 158, 11, 0.04)',
            border: '2px solid rgba(245, 158, 11, 0.4)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <IconSparkles size={16} color="#fbbf24" />
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#fbbf24' }}>
                  With Qloo Taste Intelligence
                </h4>
              </div>
              <span className={plan.isSampleData ? 'badge badge-sample' : 'badge badge-qloo'}>
                {plan.isSampleData ? 'Culturally Grounded (Sample Fixture)' : 'Culturally Grounded (Live Qloo)'}
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {plan.stops.map((stop) => (
                <div
                  key={stop.placeId}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {stop.order}. {stop.placeName}
                    </span>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: plan.isSampleData ? 'var(--accent-indigo)' : 'var(--accent-amber)' }}>
                      {stop.qlooAffinityScore !== null
                        ? (plan.isSampleData ? `${stop.qlooAffinityScore}% Sample Affinity` : `${stop.qlooAffinityScore}% Qloo Affinity`)
                        : (plan.isSampleData ? 'Sample Taste Match' : 'Qloo Taste Match')}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '0.35rem' }}>
                    {stop.category} • {stop.neighborhood}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: '#fef3c7', lineHeight: 1.4 }}>
                    Linked to: <strong>{stop.connectedAnchorName}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Column 2: Without Qloo (Generic Foot-Traffic Baseline) */}
        {(activeTab === 'split' || activeTab === 'without_qloo') && (
          <div style={{
            padding: '1.25rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'rgba(100, 116, 139, 0.05)',
            border: '1px solid rgba(100, 116, 139, 0.25)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--text-dim)' }} />
                <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                  Standard Tourist Density Baseline
                </h4>
              </div>
              <span className="badge badge-sample" style={{ fontSize: '0.625rem' }}>
                Reference Benchmark
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {baselineStops.map((stop) => (
                <div
                  key={stop.placeId}
                  style={{
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface)',
                    border: '1px solid var(--border-subtle)',
                    opacity: 0.85,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                      {stop.order}. {stop.placeName}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                      Generic Tourist Spot
                    </span>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block', marginBottom: '0.35rem' }}>
                    {stop.category} • {stop.neighborhood}
                  </span>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontStyle: 'italic' }}>
                    Selected solely by mass tourist density. No cross-domain taste graph applied.
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
