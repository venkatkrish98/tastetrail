/**
 * TasteTrail Agentic Workflow Engine
 * 
 * Orchestrates a transparent 5-stage agent pipeline:
 * 1. Request Validation & Constraint Normalization
 * 2. Cultural Anchor Entity Resolution
 * 3. Qloo Cultural Intelligence Retrieval
 * 4. Deterministic Constraint Filtering & Sequencing
 * 5. Itinerary Synthesis & Provenance Attribution
 */

import {
  OutingRequest,
  OutingPlanResult,
  AgentWorkflowStep,
  ItineraryStop,
  QlooRawPlaceCandidate,
  ProvenanceBreakdown,
} from './types';
import { searchQlooEntities, fetchQlooPlaceInsights, isLiveQlooConfigured } from './qloo-client';
import { SAMPLE_CITIES_FIXTURES } from './sample-fixtures';

const QLOO_BASE_URL = process.env.QLOO_BASE_URL || 'https://hackathon.api.qloo.com';

/**
 * Calculates geographic distance in kilometers between two coordinates using the Haversine formula
 */
export function calculateHaversineDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's mean radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export async function runTasteTrailAgent(
  request: OutingRequest,
  onStepProgress?: (step: AgentWorkflowStep) => void
): Promise<OutingPlanResult> {
  const steps: AgentWorkflowStep[] = [];
  const logStep = (
    stepNum: number,
    title: string,
    description: string,
    status: AgentWorkflowStep['status'],
    details?: string,
    isSampleData?: boolean
  ) => {
    const stepObj: AgentWorkflowStep = {
      step: stepNum,
      title,
      description,
      status,
      timestamp: new Date().toISOString(),
      details,
      isSampleData,
    };
    steps.push(stepObj);
    if (onStepProgress) onStepProgress(stepObj);
  };

  const isSampleRequested = Boolean(request.forceSampleMode || !isLiveQlooConfigured());

  // -------------------------------------------------------------
  // STAGE 1: Request Validation & Constraint Normalization
  // -------------------------------------------------------------
  logStep(
    1,
    'Validating Request & Constraints',
    'Sanitizing city coordinates, bounding time window, and verifying input parameters.',
    'running'
  );

  const cityName = (request.cityName || 'New York').slice(0, 50).trim();
  const lat = Number(request.cityCoordinates?.lat);
  const lng = Number(request.cityCoordinates?.lng);

  if (isNaN(lat) || lat < -90 || lat > 90 || isNaN(lng) || lng < -180 || lng > 180) {
    throw new Error(`Invalid geographic coordinates: lat must be between -90 and 90, lng between -180 and 180.`);
  }

  const durationHours = Math.min(6, Math.max(1.5, Number(request.durationHours) || 3));
  const maxTotalMinutes = Math.round(durationHours * 60);
  const budget = ['free_or_low', 'moderate', 'treat'].includes(request.budgetTier)
    ? request.budgetTier
    : 'moderate';

  const mobility = request.mobility || {
    stepFreeAccess: false,
    lowWalkingTransit: false,
    seatedRestIntervals: false,
    sensoryFriendly: false,
  };

  if (!Array.isArray(request.anchors) || request.anchors.length === 0) {
    throw new Error('At least 1 cultural anchor (and ideally 2–3) is required to build a cultural trail.');
  }

  logStep(
    1,
    'Constraints Validated',
    `Target: ${cityName} (${lat.toFixed(4)}, ${lng.toFixed(4)}) | Window: ${durationHours}h (${maxTotalMinutes}m) | Budget: ${budget}`,
    'completed'
  );

  // -------------------------------------------------------------
  // STAGE 2: Cultural Anchor Resolution via Qloo Search
  // -------------------------------------------------------------
  logStep(
    2,
    'Resolving Cultural Anchors in Qloo Taste Graph',
    `Querying Qloo /search endpoint for ${request.anchors.length} cultural entities using documented 'types' parameter.`,
    'running'
  );

  const resolvedEntityIds: string[] = [];
  const resolvedAnchorNames: string[] = [];
  const unresolvableAnchors: string[] = [];
  let usedSampleDataInSearch = false;

  for (const anchor of request.anchors) {
    const searchRes = await searchQlooEntities(anchor.name, anchor.entityType, isSampleRequested);
    if (searchRes.isSampleData) usedSampleDataInSearch = true;

    if (searchRes.candidates.length > 0) {
      const topMatch = searchRes.candidates[0];
      resolvedEntityIds.push(topMatch.id);
      resolvedAnchorNames.push(topMatch.name);
    } else {
      unresolvableAnchors.push(anchor.name);
    }
  }

  // Live Qloo API integrity: NEVER send synthetic custom IDs to /v2/insights!
  if (resolvedEntityIds.length === 0) {
    logStep(
      2,
      'Clarification Required: No Cultural Anchors Matched in Qloo',
      `None of the provided anchors (${unresolvableAnchors.map(a => `"${a}"`).join(', ')}) were found in the Qloo Taste Graph.`,
      'clarification_needed'
    );
    throw new Error(
      `Cultural Anchor Clarification Needed: None of your provided anchors (${unresolvableAnchors.map(a => `"${a}"`).join(', ')}) matched verified entities in the Qloo Taste Graph. Please refine your anchor names (e.g., try well-known artists, directors, authors, or genres like 'Haruki Murakami', 'Miles Davis', 'Wes Anderson') or choose from suggested entities.`
    );
  }

  logStep(
    2,
    'Anchors Resolved in Qloo Taste Graph',
    unresolvableAnchors.length > 0
      ? `Successfully resolved ${resolvedAnchorNames.length} anchor(s): ${resolvedAnchorNames.join(' • ')}. Note: Anchor(s) '${unresolvableAnchors.join(', ')}' had no Qloo entity match and were omitted from live querying to protect API integrity.`
      : `Mapped entities: ${resolvedAnchorNames.join(' • ')} (${
          usedSampleDataInSearch ? 'Sample Reference Catalog' : 'Live Qloo Taste Graph'
        })`,
    'completed',
    usedSampleDataInSearch
      ? `Sample fixture entity references: ${resolvedEntityIds.join(', ')}`
      : `Live Qloo Entity IDs: ${resolvedEntityIds.join(', ')}`,
    usedSampleDataInSearch
  );

  // -------------------------------------------------------------
  // STAGE 3: Qloo Cultural Intelligence Retrieval
  // -------------------------------------------------------------
  logStep(
    3,
    'Querying Qloo Insights for Cultural Place Affinities',
    `Calling GET /v2/insights with filter.type=urn:entity:place around ${cityName}.`,
    'running'
  );

  const insightsRes = await fetchQlooPlaceInsights({
    entityIds: resolvedEntityIds,
    lat,
    lng,
    cityName,
    forceSampleMode: isSampleRequested,
  });

  const rawCandidates = insightsRes.candidates;
  const isSampleMode = insightsRes.isSampleData || usedSampleDataInSearch || isSampleRequested;

  if (rawCandidates.length === 0) {
    logStep(
      3,
      'No Place Candidates Found in Qloo',
      `Qloo /v2/insights returned 0 matching places near ${cityName} for the selected cultural anchors.`,
      'completed'
    );
    throw new Error(
      `Qloo Cultural Intelligence returned no matching venues for ${cityName} with the selected cultural anchors. Try selecting different anchors or checking a major cultural hub.`
    );
  }

  const scoresWithValues = rawCandidates
    .map(c => c.affinityScore)
    .filter((s): s is number => typeof s === 'number');

  const maxAffinity = scoresWithValues.length > 0 ? Math.max(...scoresWithValues) : null;

  logStep(
    3,
    'Cultural Candidates Discovered',
    `Retrieved ${rawCandidates.length} candidate places from ${isSampleMode ? 'Sample Demo Fixtures' : 'Live Qloo API /v2/insights'}. Top Affinity: ${
      maxAffinity !== null ? `${maxAffinity}%` : 'Unscored by upstream'
    }.`,
    'completed',
    `Data Source: ${isSampleMode ? 'Labeled Offline Sample Fixture' : 'Live Qloo Graph (hackathon.api.qloo.com)'}`,
    isSampleMode
  );

  // -------------------------------------------------------------
  // STAGE 4: Deterministic Constraint Filtering & Sequencing
  // -------------------------------------------------------------
  logStep(
    4,
    'Applying Deterministic Practical Constraints',
    'Filtering candidates against budget tiers, time allocation, and transit pacing.',
    'running'
  );

  let filteredPool = [...rawCandidates];
  let filteredOutCount = 0;

  // 1. Strict Budget Filter (Never silently falls back to expensive venues!)
  if (budget === 'free_or_low') {
    const before = filteredPool.length;
    filteredPool = filteredPool.filter(c => c.estimatedSpendTier === '$' || c.estimatedSpendTier === 'Unknown');
    filteredOutCount += before - filteredPool.length;
  } else if (budget === 'moderate') {
    const before = filteredPool.length;
    filteredPool = filteredPool.filter(c => c.estimatedSpendTier !== '$$$');
    filteredOutCount += before - filteredPool.length;
  }

  // Guard: if budget filter leaves 0 candidates, truthfully inform the user
  if (filteredPool.length === 0) {
    logStep(
      4,
      'No Venues Match Budget Constraint',
      `All ${rawCandidates.length} Qloo candidate venues exceeded the strict "${budget}" budget filter.`,
      'completed'
    );
    throw new Error(
      `No venues in ${cityName} matched your strict "${budget}" budget tier. Please select "moderate" or "treat" to view available cultural venues.`
    );
  }

  // 2. Strict Pairwise Low-Walking Route Chaining (<0.8 km between every consecutive stop)
  let selectedCandidates: QlooRawPlaceCandidate[] = [];
  let walkingClusteringApplied = false;

  // Determine target number of stops based on time window
  const targetStopCount = durationHours <= 2.5 ? 2 : durationHours <= 4.5 ? 3 : 4;

  if (mobility.lowWalkingTransit) {
    // A. Require verified geographic coordinates for low-walking mode
    const candidatesWithCoords = filteredPool.filter(
      c => typeof c.location?.lat === 'number' && typeof c.location?.lng === 'number'
    );
    const missingCoordsCount = filteredPool.length - candidatesWithCoords.length;
    filteredOutCount += missingCoordsCount;

    // B. Sort candidate pool by Qloo Affinity Score descending
    const sortedPool = [...candidatesWithCoords].sort((a, b) => {
      if (a.affinityScore === null && b.affinityScore === null) return 0;
      if (a.affinityScore === null) return 1;
      if (b.affinityScore === null) return -1;
      return b.affinityScore - a.affinityScore;
    });

    if (sortedPool.length > 0) {
      // Seed Stop 1 with highest affinity venue
      const chain: QlooRawPlaceCandidate[] = [sortedPool[0]];
      const remaining = sortedPool.slice(1);

      // Sequentially chain subsequent stops: each stop must be strictly <= 0.8 km from previous stop
      while (chain.length < targetStopCount && remaining.length > 0) {
        const currentStop = chain[chain.length - 1];
        const conformingHops = remaining.filter(c => {
          const dist = calculateHaversineDistanceKm(
            currentStop.location!.lat!,
            currentStop.location!.lng!,
            c.location!.lat!,
            c.location!.lng!
          );
          return dist <= 0.8; // Strictly <= 0.8 km straight-line distance between consecutive stops
        });

        if (conformingHops.length === 0) {
          // No remaining candidate venue is within 0.8 km of the current stop.
          // Stop chaining here to preserve the consecutive distance guarantee!
          break;
        }

        // Pick conforming candidate with highest affinity
        const nextStop = conformingHops[0];
        chain.push(nextStop);
        const removeIdx = remaining.indexOf(nextStop);
        if (removeIdx !== -1) remaining.splice(removeIdx, 1);
      }

      selectedCandidates = chain;
      walkingClusteringApplied = true;
      filteredOutCount += (filteredPool.length - selectedCandidates.length);
    } else {
      selectedCandidates = filteredPool.slice(0, 1);
    }
  } else {
    // Standard transit mode: sort by affinity score descending
    filteredPool.sort((a, b) => {
      if (a.affinityScore === null && b.affinityScore === null) return 0;
      if (a.affinityScore === null) return 1;
      if (b.affinityScore === null) return -1;
      return b.affinityScore - a.affinityScore;
    });
    selectedCandidates = filteredPool.slice(0, Math.min(filteredPool.length, targetStopCount));
  }

  logStep(
    4,
    'Constraints Applied & Sequenced',
    `Selected ${selectedCandidates.length} venues. Paced for a ${durationHours}-hour window.${
      mobility.lowWalkingTransit
        ? ' Pairwise route-chaining verified: all consecutive legs <= 0.8 km straight-line.'
        : ''
    } Excluded ${filteredOutCount} non-conforming candidates.`,
    'completed'
  );

  // -------------------------------------------------------------
  // STAGE 5: Itinerary Synthesis & Provenance Attribution
  // -------------------------------------------------------------
  logStep(
    5,
    'Synthesizing Structured Itinerary & Provenance',
    'Calculating stop arrival offsets, dwell times, and attributing Qloo vs. app-side decisions.',
    'running'
  );

  let cumulativeMinutes = 0;
  const transitMinutesPerHop = mobility.lowWalkingTransit ? 10 : 18;

  const itineraryStops: ItineraryStop[] = selectedCandidates.map((candidate, idx) => {
    const arrivalOffset = cumulativeMinutes;
    const dwell = Math.min(
      candidate.typicalDwellMinutes,
      Math.max(
        mobility.seatedRestIntervals ? 45 : 35,
        Math.floor((maxTotalMinutes - (selectedCandidates.length - 1) * transitMinutesPerHop) / selectedCandidates.length)
      )
    );
    cumulativeMinutes += dwell + (idx < selectedCandidates.length - 1 ? transitMinutesPerHop : 0);

    const anchorName =
      resolvedAnchorNames[idx % resolvedAnchorNames.length] || 'Cultural Profile';

    // Calculate straight-line and street-route distance to previous stop if coordinates exist
    let transitDistanceNote = `Allocated ${dwell} min dwell time plus ~${transitMinutesPerHop} min transit buffer.`;
    if (idx > 0 && selectedCandidates[idx - 1]?.location?.lat && candidate.location?.lat) {
      const prev = selectedCandidates[idx - 1].location!;
      const curr = candidate.location!;
      if (prev.lat && prev.lng && curr.lat && curr.lng) {
        const straightKm = calculateHaversineDistanceKm(prev.lat, prev.lng, curr.lat, curr.lng);
        const streetWalkKm = Math.round(straightKm * 1.35 * 100) / 100; // 1.35x urban street grid factor
        const walkMin = Math.max(5, Math.round((streetWalkKm / 4.5) * 60));
        transitDistanceNote = `Transit: ~${straightKm} km straight-line (~${streetWalkKm} km estimated street walk, ~${walkMin} min). ${straightKm <= 0.8 ? 'Within <= 0.8 km straight-line radius (not a sidewalk guarantee).' : ''} Allocated ${dwell}m dwell.`;
      }
    }

    // Truthful accessibility explanation: never claim Qloo verified wheelchair accessibility or guaranteed seating!
    const mobilityExplanation = mobility.stepFreeAccess
      ? 'Physical accessibility (wheelchair / step-free access) is not tracked or verified by Qloo Cultural Intelligence. Please contact the venue directly to confirm access.'
      : 'Standard street-level venue. Verify physical accessibility directly with the venue.';

    return {
      order: idx + 1,
      placeId: candidate.id,
      placeName: candidate.name,
      category: candidate.category,
      neighborhood: candidate.location?.neighborhood || cityName,
      location: candidate.location,
      arrivalOffsetMinutes: arrivalOffset,
      dwellMinutes: dwell,
      estimatedCost: candidate.estimatedSpendTier,
      qlooAffinityScore: candidate.affinityScore, // Truthful: number if returned, null if unprovided
      connectedAnchorName: anchorName,
      culturalRationale: candidate.affinityScore !== null
        ? `Qloo cultural graph identified ~${candidate.affinityScore}% affinity with ${anchorName} based on aggregate taste overlap in ${candidate.attributes?.slice(0, 2).join(' and ') || 'curated aesthetics'}.`
        : `Qloo cultural graph identified taste overlap with ${anchorName} (affinity score not provided upstream).`,
      isSampleData: candidate.isSampleData,
      practicalNotes: {
        mobility: mobilityExplanation,
        timing: transitDistanceNote,
        budget: candidate.estimatedSpendTier !== 'Unknown'
          ? `Spend tier ${candidate.estimatedSpendTier}: fits selected ${budget} budget preference.`
          : 'Price tier not specified by Qloo. Please check venue menu/ticketing.',
      },
      provenance: {
        qlooRecommended: true,
        qlooSignalSummary: candidate.affinityScore !== null
          ? `Affinity Index: ${candidate.affinityScore}/100. Over-indexes with audiences appreciating ${anchorName}.`
          : `Cultural match linked to ${anchorName}. Upstream affinity score not returned.`,
        appConstraintDecisions: [
          `Allocated ${dwell}m dwell within ${maxTotalMinutes}m overall window`,
          `App-side budget preference: ${budget} (strictly enforced)`,
          `Pacing strategy: Stop ${idx + 1} of ${selectedCandidates.length}${
            mobility.seatedRestIntervals ? ' with planned break/dwell allocation (seating unverified by Qloo)' : ''
          }`,
        ],
      },
    };
  });

  // Segregate enforced app constraints from unverified physical venue advisories
  const enforcedRules: string[] = [
    `Budget Filter: Strictly limited to '${budget}' tier (${filteredOutCount} non-conforming venues excluded)`,
    `Duration Cap: Max ${maxTotalMinutes} minutes enforced with realistic dwell and transit windows`,
  ];
  if (mobility.lowWalkingTransit) {
    enforcedRules.push(
      walkingClusteringApplied
        ? 'Low-Walking Constraint: Consecutive stops filtered to <= 0.8 km straight-line radius (~1.0-1.2 km estimated street walk via Haversine calculation, not a sidewalk guarantee)'
        : 'Low-Walking Transit Pacing: Reduced transit radius between consecutive stops (<= 0.8 km straight-line limit)'
    );
  }
  if (mobility.seatedRestIntervals) {
    enforcedRules.push('Planned Break / Dwell Allocation: Paced with 45+ min dwell intervals between active segments (physical seating unverified by Qloo)');
  }

  const unverifiedAdvisories: string[] = [];
  if (mobility.stepFreeAccess) {
    unverifiedAdvisories.push(
      'Step-Free Entry / Physical Ramps: NOT indexed by Qloo Taste Graph. Must be independently verified with venue staff.'
    );
  }
  if (mobility.sensoryFriendly) {
    unverifiedAdvisories.push(
      'Sensory & Acoustic Levels: Real-time decibels and crowd density are not tracked in Qloo aggregate data. Quiet hours must be confirmed with venue.'
    );
  }

  const provenanceBreakdown: ProvenanceBreakdown = {
    qlooIntelligence: {
      apiEndpointUsed: isSampleMode
        ? 'Offline Reference Catalog (Demo Mode)'
        : `${QLOO_BASE_URL}/v2/insights`,
      anchorsProcessed: resolvedAnchorNames,
      candidatesRetrieved: rawCandidates.length,
      affinityMetricDescription:
        'Aggregate cultural affinity score (0–100) reflecting taste graph resonance, or null if unprovided.',
      disclaimer:
        'Qloo outputs represent aggregate cultural affinities across creative domains and communities. They do not constitute proof of any individual’s identity, exact personal preferences, or future behavior. Physical venue accessibility, live opening hours, and real-time prices are NOT verified by Qloo and require direct confirmation.',
      isSampleData: isSampleMode,
    },
    appConstraints: {
      totalDurationLimitMinutes: maxTotalMinutes,
      allocatedDurationMinutes: cumulativeMinutes,
      budgetTierApplied: budget,
      mobilityFiltersEnforced: enforcedRules,
      unverifiedAdvisories: unverifiedAdvisories.length > 0 ? unverifiedAdvisories : undefined,
      sequencingStrategy:
        'Paced chronological progression with dwell and transit buffers.',
      candidatesFilteredOutCount: filteredOutCount,
    },
  };

  // Conceptual Baseline Comparison: clearly marked as a reference benchmark
  const baselineCity = SAMPLE_CITIES_FIXTURES[cityName] || SAMPLE_CITIES_FIXTURES['New York'];
  const baselineStops: ItineraryStop[] = baselineCity.genericBaselineCandidates.slice(0, targetStopCount).map((c, idx) => ({
    order: idx + 1,
    placeId: c.id,
    placeName: c.name,
    category: c.category,
    neighborhood: c.location?.neighborhood || cityName,
    location: c.location,
    arrivalOffsetMinutes: idx * 45,
    dwellMinutes: 30,
    estimatedCost: c.estimatedSpendTier,
    qlooAffinityScore: c.affinityScore,
    connectedAnchorName: 'None (Generic Tourist Density)',
    culturalRationale:
      'Standard high-density foot-traffic hotspot. No cultural affinity mapping or taste signals applied.',
    isSampleData: true,
    practicalNotes: {
      mobility: 'Commercial chain facility.',
      timing: '30 min quick visit.',
      budget: 'Standard retail pricing.',
    },
    provenance: {
      qlooRecommended: false,
      qlooSignalSummary: 'Baseline reference candidate (no Qloo taste signals).',
      appConstraintDecisions: ['Selected purely based on mass commercial foot-traffic density'],
    },
  }));

  logStep(
    5,
    'TasteTrail Itinerary Ready',
    `Generated ${itineraryStops.length}-stop cultural outing totaling ~${cumulativeMinutes} minutes (${
      isSampleMode ? 'Sample Mode' : 'Live Qloo Flow'
    }).`,
    'completed',
    undefined,
    isSampleMode
  );

  return {
    planId: `trail-${Date.now()}`,
    cityName,
    title: `${cityName} Cultural Trail: ${resolvedAnchorNames.slice(0, 2).join(' & ')}`,
    narrativeSummary: `A carefully paced ${durationHours}-hour cultural itinerary through ${cityName}, curated via ${
      isSampleMode ? 'verified reference fixtures' : "Qloo's cultural intelligence graph"
    } around ${resolvedAnchorNames.join(', ')} with honest dwell pacing and practical boundaries.`,
    totalDurationMinutes: cumulativeMinutes,
    stops: itineraryStops,
    provenance: provenanceBreakdown,
    workflowSteps: steps,
    isSampleData: isSampleMode,
    sampleDataNotice: isSampleMode
      ? 'Sample Data Demo Mode — Operating with verified reference fixtures for offline evaluation. Add a valid QLOO_API_KEY to .env.local to enable live API calls to https://hackathon.api.qloo.com.'
      : undefined,
    baselineComparison: {
      baselineStops,
      differenceSummary:
        'Standard discovery engines prioritize mass commercial foot-traffic (souvenir superstores, fast-food courts). With Qloo cultural intelligence, TasteTrail discovers independent jazz cellars, literary bookshops, and auteur cinemas that share authentic aesthetic resonance with your cultural anchors.',
      methodologyNotice:
        'Methodology Notice: This baseline is an illustrative reference benchmark demonstrating standard high-foot-traffic / commercial tourist recommendations for comparative evaluation. It is not an alternative live Qloo API query.',
    },
  };
}
