'use client';

import React, { useState } from 'react';
import { CulturalAnchor, BudgetTier, MobilityConstraints, OutingRequest } from '@/lib/types';
import { POPULAR_CULTURAL_ANCHORS, SAMPLE_CITIES_FIXTURES } from '@/lib/sample-fixtures';
import {
  IconCompass,
  IconClock,
  IconWallet,
  IconAccessibility,
  IconSparkles,
  IconClose,
  IconPlus,
} from './Icons';

interface PlannerFormProps {
  onSubmit: (request: OutingRequest) => void;
  isLoading: boolean;
}

export function PlannerForm({ onSubmit, isLoading }: PlannerFormProps) {
  // Cities
  const cities = Object.keys(SAMPLE_CITIES_FIXTURES);
  const [selectedCity, setSelectedCity] = useState<string>('New York');

  // Constraints
  const [duration, setDuration] = useState<number>(3);
  const [budget, setBudget] = useState<BudgetTier>('moderate');
  const [mobility, setMobility] = useState<MobilityConstraints>({
    stepFreeAccess: false,
    lowWalkingTransit: false,
    seatedRestIntervals: false,
    sensoryFriendly: false,
  });

  // Selected Cultural Anchors
  const [anchors, setAnchors] = useState<CulturalAnchor[]>([
    {
      id: 'default-1',
      name: 'Miles Davis',
      category: 'music',
      entityType: 'urn:entity:artist',
      resolved: true,
    },
    {
      id: 'default-2',
      name: 'Haruki Murakami',
      category: 'literature',
      entityType: 'urn:entity:book',
      resolved: true,
    },
  ]);

  const [customAnchorInput, setCustomAnchorInput] = useState<string>('');
  const [compareBaseline, setCompareBaseline] = useState<boolean>(true);
  const [forceSampleMode, setForceSampleMode] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleAddPopularAnchor = (item: typeof POPULAR_CULTURAL_ANCHORS[0]) => {
    if (anchors.some(a => a.name.toLowerCase() === item.name.toLowerCase())) {
      return;
    }
    if (anchors.length >= 4) {
      setErrorMsg('A maximum of 3–4 anchors is recommended to keep the cultural signal focused.');
      return;
    }
    setErrorMsg(null);
    setAnchors([
      ...anchors,
      {
        id: `pop-${Date.now()}-${item.name}`,
        name: item.name,
        category: item.category,
        entityType: item.entityType,
        resolved: false,
      },
    ]);
  };

  const handleAddCustomAnchor = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customAnchorInput.trim();
    if (!trimmed) return;
    if (anchors.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
      setErrorMsg('This anchor is already added.');
      return;
    }
    if (anchors.length >= 4) {
      setErrorMsg('A maximum of 3–4 anchors is recommended.');
      return;
    }
    setErrorMsg(null);
    setAnchors([
      ...anchors,
      {
        id: `custom-${Date.now()}`,
        name: trimmed,
        category: 'music',
        entityType: 'urn:entity:artist',
        resolved: false,
      },
    ]);
    setCustomAnchorInput('');
  };

  const handleRemoveAnchor = (id: string) => {
    setAnchors(anchors.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (anchors.length === 0) {
      setErrorMsg('Please select at least 1 cultural anchor (and ideally 2–3) so Qloo can calculate taste affinities.');
      return;
    }
    setErrorMsg(null);

    const cityData = SAMPLE_CITIES_FIXTURES[selectedCity] || SAMPLE_CITIES_FIXTURES['New York'];

    const request: OutingRequest = {
      cityName: selectedCity,
      cityCoordinates: cityData.coordinates,
      durationHours: duration,
      budgetTier: budget,
      mobility,
      anchors,
      compareWithoutAnchors: compareBaseline,
      forceSampleMode,
    };

    onSubmit(request);
  };

  return (
    <form onSubmit={handleSubmit} className="card" style={{ maxWidth: '820px', margin: '0 auto' }}>
      {/* City & Duration Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.25rem',
      }}>
        {/* City Selection */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="city-select" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconCompass size={16} color="var(--accent-cyan)" />
            <span>Target City</span>
          </label>
          <select
            id="city-select"
            className="form-select"
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
          >
            {cities.map((city) => (
              <option key={city} value={city}>
                {city} ({SAMPLE_CITIES_FIXTURES[city].curatedCandidates.length} curated cultural hubs)
              </option>
            ))}
          </select>
          <p className="form-hint">Qloo spatial radius will center on verified city coordinates.</p>
        </div>

        {/* Time Available */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label htmlFor="duration-select" className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconClock size={16} color="var(--accent-amber)" />
            <span>Time Available</span>
          </label>
          <select
            id="duration-select"
            className="form-select"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
          >
            <option value={2}>2 Hours (Compact Outing • 2 stops)</option>
            <option value={3}>3 Hours (Balanced Outing • 3 stops • Recommended)</option>
            <option value={4}>4 Hours (Cultural Deep Dive • 3–4 stops)</option>
            <option value={5}>5 Hours (Half-Day Immersive • 4 stops)</option>
          </select>
          <p className="form-hint">Allocates dwell time, walk buffers, and transit rest.</p>
        </div>
      </div>

      {/* Cultural Anchors Section */}
      <div style={{
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(245, 158, 11, 0.25)',
        borderRadius: 'var(--radius-md)',
        padding: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <label className="form-label" style={{ marginBottom: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#fbbf24' }}>
            <IconSparkles size={18} color="#fbbf24" />
            <span>Cultural Anchors (Select 2–3)</span>
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Films, artists, authors, genres, or culinary crafts
          </span>
        </div>

        {/* Current Anchors Pills */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          minHeight: '44px',
          padding: '0.5rem',
          backgroundColor: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          border: '1px solid var(--border-subtle)',
          marginBottom: '0.85rem',
          alignItems: 'center',
        }}>
          {anchors.length === 0 ? (
            <span style={{ fontSize: '0.875rem', color: 'var(--text-dim)', fontStyle: 'italic', padding: '0 0.25rem' }}>
              No cultural anchors selected. Choose from popular suggestions below or type a custom one.
            </span>
          ) : (
            anchors.map((anchor) => (
              <span
                key={anchor.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(245, 158, 11, 0.15)',
                  border: '1px solid rgba(245, 158, 11, 0.4)',
                  color: '#fbbf24',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                }}
              >
                <span>{anchor.name}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveAnchor(anchor.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#fbbf24',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 1px',
                  }}
                  aria-label={`Remove ${anchor.name}`}
                >
                  <IconClose size={14} />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Custom Input */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.85rem' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Add custom anchor (e.g. David Bowie, Wong Kar-wai, Cyberpunk)..."
            value={customAnchorInput}
            onChange={(e) => setCustomAnchorInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddCustomAnchor(e);
              }
            }}
            aria-label="Add custom cultural anchor"
          />
          <button
            type="button"
            onClick={handleAddCustomAnchor}
            className="btn btn-secondary btn-sm"
            disabled={!customAnchorInput.trim()}
          >
            <IconPlus size={16} />
            <span>Add</span>
          </button>
        </div>

        {/* Popular suggestion chips */}
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', display: 'block', marginBottom: '0.4rem' }}>
            Quick Add Ideas:
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
            {POPULAR_CULTURAL_ANCHORS.slice(0, 8).map((pop) => {
              const isSelected = anchors.some(a => a.name.toLowerCase() === pop.name.toLowerCase());
              return (
                <button
                  key={pop.name}
                  type="button"
                  onClick={() => handleAddPopularAnchor(pop)}
                  disabled={isSelected}
                  style={{
                    fontSize: '0.78125rem',
                    padding: '0.25rem 0.65rem',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.1)' : 'var(--bg-surface)',
                    color: isSelected ? 'var(--text-dim)' : 'var(--text-main)',
                    border: `1px solid ${isSelected ? 'transparent' : 'var(--border-subtle)'}`,
                    cursor: isSelected ? 'default' : 'pointer',
                    transition: 'all var(--transition-fast)',
                  }}
                  title={pop.preview}
                >
                  + {pop.name}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget & Mobility Constraints Row */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '1.25rem',
        marginBottom: '1.5rem',
      }}>
        {/* Budget Ceiling */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconWallet size={16} color="var(--accent-cyan)" />
            <span>Budget Tier</span>
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
            {(
              [
                { tier: 'free_or_low', label: '$ Low / Free', hint: 'Parks, indie bookstores, casual coffee' },
                { tier: 'moderate', label: '$$ Moderate', hint: 'Galleries, jazz clubs, bistros' },
                { tier: 'treat', label: '$$$ Treat', hint: 'Specialty tastings, cocktail salons' },
              ] as const
            ).map((item) => (
              <button
                key={item.tier}
                type="button"
                onClick={() => setBudget(item.tier)}
                style={{
                  padding: '0.65rem 0.5rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: budget === item.tier ? 'rgba(56, 189, 248, 0.15)' : 'var(--bg-surface)',
                  border: `1px solid ${budget === item.tier ? 'var(--accent-cyan)' : 'var(--border-subtle)'}`,
                  color: budget === item.tier ? 'var(--accent-cyan)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontWeight: 600,
                  fontSize: '0.8125rem',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          <p className="form-hint">Enforces deterministic spending limits on venue candidates.</p>
        </div>

        {/* Mobility & Accessibility Needs */}
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <IconAccessibility size={16} color="var(--accent-indigo)" />
            <span>Mobility & Accessibility Constraints</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mobility.stepFreeAccess}
                onChange={(e) => setMobility({ ...mobility, stepFreeAccess: e.target.checked })}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Step-free / wheelchair accessible venues</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mobility.lowWalkingTransit}
                onChange={(e) => setMobility({ ...mobility, lowWalkingTransit: e.target.checked })}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Low-walking transit radius (&le;0.8 km straight-line between consecutive stops)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mobility.seatedRestIntervals}
                onChange={(e) => setMobility({ ...mobility, seatedRestIntervals: e.target.checked })}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Planned break / dwell intervals (45+ min dwell pacing between stops)</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.875rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={mobility.sensoryFriendly}
                onChange={(e) => setMobility({ ...mobility, sensoryFriendly: e.target.checked })}
                style={{ accentColor: 'var(--accent-cyan)' }}
              />
              <span>Sensory-friendly advisory (moderate volume / uncrowded spaces)</span>
            </label>
          </div>
          <p className="form-hint" style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Note: Qloo scores cultural affinities. Walking radius (&le;0.8 km straight-line / ~1.0-1.2 km estimated street walk) and dwell pacing are enforced algorithmically; physical sidewalk terrain, crosswalks, venue seating capacity, and wheelchair ramps require direct confirmation.
          </p>
        </div>
      </div>

      {/* Execution Mode & Comparison Options */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '0.75rem',
        marginBottom: '1.25rem',
      }}>
        {/* Compare Mode Checkbox */}
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.25rem',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={compareBaseline}
              onChange={(e) => setCompareBaseline(e.target.checked)}
              style={{ accentColor: 'var(--accent-cyan)' }}
            />
            <span style={{ color: 'var(--text-main)' }}>
              Compare With vs. Baseline
            </span>
          </label>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', paddingLeft: '1.65rem' }}>
            Contrasts cultural trail against standard foot-traffic baseline
          </span>
        </div>

        {/* Offline Sample Mode Override */}
        <div style={{
          padding: '0.75rem 1rem',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'rgba(168, 85, 247, 0.08)',
          border: '1px solid rgba(168, 85, 247, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: '0.25rem',
        }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', cursor: 'pointer', fontSize: '0.875rem', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={forceSampleMode}
              onChange={(e) => setForceSampleMode(e.target.checked)}
              style={{ accentColor: '#a855f7' }}
            />
            <span style={{ color: '#d8b4fe' }}>
              Force Sample Data Mode
            </span>
          </label>
          <span style={{ fontSize: '0.75rem', color: '#c084fc', paddingLeft: '1.65rem' }}>
            Explicitly evaluate labeled offline fixtures for testing
          </span>
        </div>
      </div>

      {/* Error message announcement */}
      {errorMsg && (
        <div
          role="alert"
          style={{
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid var(--status-error)',
            borderRadius: 'var(--radius-md)',
            color: '#fca5a5',
            fontSize: '0.875rem',
            marginBottom: '1.25rem',
          }}
        >
          {errorMsg}
        </div>
      )}

      {/* Submit Action */}
      <button
        type="submit"
        disabled={isLoading || anchors.length === 0}
        className="btn btn-primary"
        style={{ width: '100%', padding: '0.9rem', fontSize: '1.0625rem' }}
      >
        {isLoading ? (
          <>
            <span style={{
              width: '18px',
              height: '18px',
              border: '2px solid rgba(0,0,0,0.3)',
              borderTopColor: '#000',
              borderRadius: '50%',
              display: 'inline-block',
              animation: 'spin 1s linear infinite',
            }} />
            <span>Agent Orchestrating Cultural Trail...</span>
          </>
        ) : (
          <>
            <IconCompass size={20} color="#0b0f17" />
            <span>Generate Cultural Trail</span>
          </>
        )}
      </button>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </form>
  );
}
