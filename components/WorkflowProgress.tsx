'use client';

import React from 'react';
import { AgentWorkflowStep } from '@/lib/types';
import { IconCheck, IconSparkles } from './Icons';

interface WorkflowProgressProps {
  steps: AgentWorkflowStep[];
  isLiveFlowActive: boolean;
}

export function WorkflowProgress({ steps, isLiveFlowActive }: WorkflowProgressProps) {
  if (steps.length === 0 && !isLiveFlowActive) return null;

  return (
    <div className="card" style={{
      maxWidth: '820px',
      margin: '2rem auto 0 auto',
      borderColor: 'rgba(56, 189, 248, 0.4)',
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{
            width: '28px',
            height: '28px',
            borderRadius: '6px',
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <IconSparkles size={16} color="var(--accent-cyan)" />
          </div>
          <div>
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              TasteTrail Agentic Pipeline Trace
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              5-Stage Transparent Decision Graph (Autonomous Qloo cultural intelligence integration)
            </p>
          </div>
        </div>

        <span className="badge badge-app">
          {isLiveFlowActive ? 'Live Execution' : 'Complete Execution Trace'}
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {steps.map((step) => {
          const isDone = step.status === 'completed';
          const isRunning = step.status === 'running';

          return (
            <div
              key={step.step}
              style={{
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'flex-start',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-md)',
                backgroundColor: isRunning
                  ? 'rgba(56, 189, 248, 0.1)'
                  : isDone
                  ? 'rgba(16, 185, 129, 0.06)'
                  : 'var(--bg-surface)',
                border: `1px solid ${
                  isRunning
                    ? 'var(--accent-cyan)'
                    : isDone
                    ? 'rgba(16, 185, 129, 0.25)'
                    : 'var(--border-subtle)'
                }`,
                transition: 'all var(--transition-fast)',
              }}
            >
              {/* Step indicator */}
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: isDone
                  ? 'var(--status-success)'
                  : isRunning
                  ? 'var(--accent-cyan)'
                  : 'var(--bg-surface-elevated)',
                color: isDone || isRunning ? '#0b0f17' : 'var(--text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
                flexShrink: 0,
                marginTop: '0.1rem',
              }}>
                {isDone ? <IconCheck size={14} color="#0b0f17" /> : step.step}
              </div>

              {/* Step details */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <h4 style={{
                    fontSize: '0.875rem',
                    fontWeight: 600,
                    color: isRunning ? 'var(--accent-cyan)' : 'var(--text-main)',
                  }}>
                    Stage {step.step}: {step.title}
                    {step.isSampleData && (
                      <span className="badge badge-sample" style={{ fontSize: '0.625rem', marginLeft: '0.4rem' }}>
                        Sample
                      </span>
                    )}
                  </h4>
                  {step.timestamp && (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-dim)', fontFamily: 'monospace' }}>
                      {new Date(step.timestamp).toLocaleTimeString()}
                    </span>
                  )}
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                  {step.description}
                </p>
                {step.details && (
                  <p style={{
                    fontSize: '0.75rem',
                    color: 'var(--accent-amber)',
                    marginTop: '0.35rem',
                    fontFamily: 'monospace',
                    backgroundColor: 'rgba(0, 0, 0, 0.25)',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '4px',
                  }}>
                    {step.details}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
