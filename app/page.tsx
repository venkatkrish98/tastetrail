'use client';

import React, { useState } from 'react';
import { Header } from '@/components/Header';
import { PlannerForm } from '@/components/PlannerForm';
import { WorkflowProgress } from '@/components/WorkflowProgress';
import { ItineraryView } from '@/components/ItineraryView';
import { ProvenancePanel } from '@/components/ProvenancePanel';
import { ComparisonView } from '@/components/ComparisonView';
import { JudgeGuideModal } from '@/components/JudgeGuideModal';
import { Footer } from '@/components/Footer';
import { OutingRequest, OutingPlanResult, AgentWorkflowStep } from '@/lib/types';
import { IconSparkles, IconCompass, IconProvenance, IconShield } from '@/components/Icons';

export default function HomePage() {
  const [isJudgeGuideOpen, setIsJudgeGuideOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [agentSteps, setAgentSteps] = useState<AgentWorkflowStep[]>([]);
  const [planResult, setPlanResult] = useState<OutingPlanResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePlanSubmit = async (request: OutingRequest) => {
    setIsLoading(true);
    setErrorMessage(null);

    // Initial progressive trace simulation while server executes
    setAgentSteps([
      {
        step: 1,
        title: 'Validating Request & Constraints',
        description: `Normalizing parameters for ${request.cityName} (${request.durationHours}h, budget: ${request.budgetTier}).`,
        status: 'running',
        timestamp: new Date().toISOString(),
      },
      {
        step: 2,
        title: 'Resolving Cultural Anchors in Qloo Taste Graph',
        description: `Querying Qloo /search endpoint for ${request.anchors.length} cultural entities.`,
        status: 'pending',
      },
      {
        step: 3,
        title: 'Querying Qloo Insights for Cultural Place Affinities',
        description: `Calling GET /v2/insights with filter.type=urn:entity:place around ${request.cityName}.`,
        status: 'pending',
      },
      {
        step: 4,
        title: 'Applying Deterministic Practical Constraints',
        description: 'Filtering against mobility requirements, time boundaries, and budget limits.',
        status: 'pending',
      },
      {
        step: 5,
        title: 'Synthesizing Structured Itinerary & Provenance',
        description: 'Sequencing stops, dwell allocations, and compiling Qloo vs. app provenance.',
        status: 'pending',
      },
    ]);

    try {
      const res = await fetch('/api/itinerary/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with HTTP ${res.status}`);
      }

      const plan = (await res.json()) as OutingPlanResult;
      setPlanResult(plan);
      setAgentSteps(plan.workflowSteps);
    } catch (err: unknown) {
      console.error('Failed to generate outing:', err);
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
      setAgentSteps((prev) =>
        prev.map((s, idx) => (idx === 0 ? { ...s, status: 'error', details: msg } : s))
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      {/* App Header */}
      <Header onOpenJudgeGuide={() => setIsJudgeGuideOpen(true)} />

      {/* Main Content Area */}
      <main className="container" style={{ padding: '2.5rem 1.25rem 0 1.25rem' }}>
        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 2.5rem auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            borderRadius: '9999px',
            backgroundColor: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            marginBottom: '1rem',
          }}>
            <IconSparkles size={16} color="#fbbf24" />
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#fbbf24', letterSpacing: '0.02em' }}>
              Qloo Agentic Cultural Intelligence
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2rem, 5vw, 2.75rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.03em',
            marginBottom: '1rem',
          }}>
            City Outings Shaped by Cultural Taste,{' '}
            <span style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #38bdf8 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Not Generic Foot-Traffic
            </span>
          </h1>

          <p style={{
            fontSize: '1.0625rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            marginBottom: '1.5rem',
          }}>
            Choose your city, time, budget, and mobility needs, along with 2–3 cultural anchors (authors, musicians, films, or cuisines). TasteTrail’s agent resolves your anchors against Qloo’s taste graph, uncovers culturally resonant venues, and builds a realistic, paced micro-itinerary.
          </p>

          {/* Quick value badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            fontSize: '0.8125rem',
            color: 'var(--text-dim)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconCompass size={16} color="var(--accent-cyan)" />
              <span>Cross-Domain Taste Affinities</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconProvenance size={16} color="var(--accent-amber)" />
              <span>Transparent 5-Stage Agent Trace</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <IconShield size={16} color="var(--accent-indigo)" />
              <span>Deterministic Mobility & Budget Bounds</span>
            </div>
          </div>
        </div>

        {/* Planner Input Form */}
        <PlannerForm onSubmit={handlePlanSubmit} isLoading={isLoading} />

        {/* Error Announcement */}
        {errorMessage && (
          <div
            role="alert"
            style={{
              maxWidth: '820px',
              margin: '1.5rem auto 0 auto',
              padding: '1rem 1.25rem',
              backgroundColor: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid var(--status-error)',
              borderRadius: 'var(--radius-md)',
              color: '#fca5a5',
              fontSize: '0.9375rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
            }}
          >
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Agentic Workflow Pipeline Trace */}
        <WorkflowProgress steps={agentSteps} isLiveFlowActive={isLoading} />

        {/* Output Itinerary Display */}
        {planResult && (
          <>
            <ItineraryView plan={planResult} />
            <ProvenancePanel provenance={planResult.provenance} />
            <ComparisonView plan={planResult} />
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />

      {/* Judge & Architecture Guide Modal */}
      <JudgeGuideModal
        isOpen={isJudgeGuideOpen}
        onClose={() => setIsJudgeGuideOpen(false)}
      />
    </div>
  );
}
