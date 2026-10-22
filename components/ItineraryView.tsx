'use client';

import React from 'react';
import { OutingPlanResult } from '@/lib/types';
import {
  IconClock,
  IconSparkles,
  IconAccessibility,
  IconWallet,
  IconInfo,
} from './Icons';

interface ItineraryViewProps {
  plan: OutingPlanResult;
}

export function ItineraryView({ plan }: ItineraryViewProps) {
  return (
    <div style={{ maxWidth: '820px', margin: '2.5rem auto 0 auto' }}>
      {/* Header Summary Card */}
      <div className="card" style={{
        marginBottom: '1.5rem',
        borderLeft: plan.isSampleData ? '4px solid #a855f7' : '4px solid var(--accent-amber)',
        background: 'linear-gradient(135deg, rgba(23, 32, 51, 0.9) 0%, rgba(15, 23, 42, 0.95) 100%)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className={plan.isSampleData ? 'badge badge-sample' : 'badge badge-qloo'}>
                {plan.isSampleData ? 'Sample Reference Outing' : 'Live Qloo Cultural Trail'}
              </span>
              {plan.isSampleData && (
                <span style={{ fontSize: '0.6875rem', color: '#d8b4fe', fontWeight: 600 }}>
                  [OFFLINE FIXTURE]
                </span>
              )}
            </div>
            <h2 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.5rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              letterSpacing: '-0.02em',
            }}>
              {plan.title}
            </h2>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            backgroundColor: 'var(--bg-surface)',
            padding: '0.5rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
          }}>
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Total Window</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>
                ~{plan.totalDurationMinutes} min
              </span>
            </div>
            <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-subtle)' }} />
            <div style={{ textAlign: 'center' }}>
              <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', textTransform: 'uppercase', display: 'block' }}>Stops</span>
              <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--accent-amber)' }}>
                {plan.stops.length} Venues
              </span>
            </div>
          </div>
        </div>

        <p style={{ fontSize: '0.9375rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          {plan.narrativeSummary}
        </p>

        {plan.isSampleData && plan.sampleDataNotice && (
          <div style={{
            marginTop: '1rem',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-sm)',
            backgroundColor: 'rgba(168, 85, 247, 0.1)',
            border: '1px solid rgba(168, 85, 247, 0.3)',
            fontSize: '0.8125rem',
            color: '#d8b4fe',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}>
            <IconInfo size={16} color="#d8b4fe" />
            <span>{plan.sampleDataNotice}</span>
          </div>
        )}
      </div>

      {/* Ordered Stops List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {plan.stops.map((stop, index) => (
          <div
            key={stop.placeId}
            className="card"
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderTop: index === 0 ? '2px solid var(--accent-cyan)' : undefined,
            }}
          >
            {/* Top Bar: Order & Timing */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.85rem',
              flexWrap: 'wrap',
              gap: '0.5rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: stop.isSampleData
                    ? 'linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  fontWeight: 800,
                  fontSize: '0.9375rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                }}>
                  {stop.order}
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {stop.placeName}
                    </h3>
                    {stop.isSampleData && (
                      <span className="badge badge-sample" style={{ fontSize: '0.625rem' }}>
                        Sample Fixture
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                    {stop.category} • {stop.neighborhood}
                  </span>
                </div>
              </div>

              {/* Time Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.3rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: 'var(--bg-surface-elevated)',
                fontSize: '0.8125rem',
                color: 'var(--text-main)',
                border: '1px solid var(--border-subtle)',
              }}>
                <IconClock size={14} color="var(--accent-cyan)" />
                <span>+ {stop.arrivalOffsetMinutes}m arrival</span>
                <span style={{ color: 'var(--text-dim)' }}>•</span>
                <span>~{stop.dwellMinutes}m dwell</span>
              </div>
            </div>

            {/* Qloo Cultural Rationale Box */}
            <div style={{
              padding: '0.85rem 1rem',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(245, 158, 11, 0.08)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              marginBottom: '1rem',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem', flexWrap: 'wrap', gap: '0.4rem' }}>
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: '#fbbf24',
                  textTransform: 'uppercase',
                }}>
                  <IconSparkles size={14} color="#fbbf24" />
                  Cultural Affinity Link: {stop.connectedAnchorName}
                </span>

                <span className="badge badge-qloo">
                  {stop.qlooAffinityScore !== null
                    ? `Qloo Affinity Index: ${stop.qlooAffinityScore}%`
                    : 'Qloo Taste Match (Unscored Upstream)'}
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', color: '#fef3c7', lineHeight: 1.5 }}>
                {stop.culturalRationale}
              </p>
            </div>

            {/* Practical Notes & App Decisions */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '0.75rem',
              fontSize: '0.8125rem',
              backgroundColor: 'var(--bg-surface)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                <IconAccessibility size={15} color="var(--accent-indigo)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-main)', display: 'block' }}>Mobility / Access</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{stop.practicalNotes.mobility}</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.45rem' }}>
                <IconWallet size={15} color="var(--accent-cyan)" style={{ marginTop: '0.15rem', flexShrink: 0 }} />
                <div>
                  <strong style={{ color: 'var(--text-main)', display: 'block' }}>Budget Estimate</strong>
                  <span style={{ color: 'var(--text-muted)' }}>{stop.practicalNotes.budget}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Honest Estimates Notice */}
      <div style={{
        marginTop: '1.5rem',
        padding: '0.85rem 1rem',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-secondary)',
        border: '1px solid var(--border-subtle)',
        fontSize: '0.8125rem',
        color: 'var(--text-dim)',
        lineHeight: 1.5,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.65rem',
      }}>
        <IconInfo size={16} color="var(--text-muted)" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
        <div>
          <strong style={{ color: 'var(--text-muted)' }}>Honest Grounding & Verification Notice:</strong>{' '}
          Qloo outputs represent aggregate cultural affinities across creative communities and do not verify physical venue operations, live ticket availability, real-time pricing, or wheelchair ramps. Travel times and dwell durations are algorithmic approximations for pacing. Always verify directly with the venue before visiting.
        </div>
      </div>
    </div>
  );
}
