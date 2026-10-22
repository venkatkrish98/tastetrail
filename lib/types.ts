/**
 * TasteTrail Core Domain Types
 * Qloo Cultural Intelligence & Agentic Outing Planner
 */

export type EntityType = 
  | 'urn:entity:artist'
  | 'urn:entity:movie'
  | 'urn:entity:book'
  | 'urn:entity:brand'
  | 'urn:entity:place'
  | 'urn:entity:podcast'
  | 'urn:entity:tv_show'
  | 'custom';

export interface CulturalAnchor {
  id: string; // Qloo entity ID or generated ID
  name: string;
  category: 'music' | 'film' | 'literature' | 'culinary' | 'visual_art' | 'brand';
  entityType?: EntityType;
  resolved: boolean;
  qlooEntityId?: string;
  ambiguityCandidates?: DisambiguationCandidate[];
}

export interface DisambiguationCandidate {
  id: string;
  name: string;
  type: string;
  description?: string;
  score?: number | null;
}

export type BudgetTier = 'free_or_low' | 'moderate' | 'treat';

export interface MobilityConstraints {
  stepFreeAccess: boolean;
  lowWalkingTransit: boolean; // Keep straight-line distance between stops under 0.8 km (~1.0 km street walk)
  seatedRestIntervals: boolean; // Include planned break / dwell intervals (45+ min dwell allocation)
  sensoryFriendly: boolean; // Moderate sound levels / non-overwhelming spaces advisory
}

export interface OutingRequest {
  cityName: string;
  cityCoordinates: {
    lat: number;
    lng: number;
  };
  durationHours: number; // 2, 3, 4, or 5
  budgetTier: BudgetTier;
  mobility: MobilityConstraints;
  anchors: CulturalAnchor[];
  compareWithoutAnchors?: boolean; // Demo mode: generate baseline without Qloo anchors
  forceSampleMode?: boolean; // User or judge can explicitly request offline sample fixture mode
}

export interface QlooRawPlaceCandidate {
  id: string;
  name: string;
  category: string;
  affinityScore: number | null; // 0 - 100 aggregate affinity, or null if unprovided
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
    neighborhood?: string;
  };
  attributes?: string[];
  estimatedSpendTier: '$' | '$$' | '$$$' | 'Unknown';
  typicalDwellMinutes: number;
  isSampleData: boolean;
  qlooSignalEvidence: {
    connectedAnchor: string;
    sharedAffinities: string[];
    affinityPercentile: number | null;
  };
}

export interface ItineraryStop {
  order: number;
  placeId: string;
  placeName: string;
  category: string;
  neighborhood: string;
  location?: {
    lat?: number;
    lng?: number;
    address?: string;
    neighborhood?: string;
  };
  arrivalOffsetMinutes: number;
  dwellMinutes: number;
  estimatedCost: string;
  qlooAffinityScore: number | null; // null if Qloo didn't return a numeric score
  connectedAnchorName: string;
  culturalRationale: string;
  isSampleData: boolean;
  practicalNotes: {
    mobility: string; // Truthful: explains physical verification required
    timing: string;
    budget: string;
  };
  provenance: {
    qlooRecommended: boolean;
    qlooSignalSummary: string;
    appConstraintDecisions: string[];
  };
}

export interface ProvenanceBreakdown {
  qlooIntelligence: {
    apiEndpointUsed: string;
    anchorsProcessed: string[];
    candidatesRetrieved: number;
    affinityMetricDescription: string;
    disclaimer: string;
    isSampleData: boolean;
  };
  appConstraints: {
    totalDurationLimitMinutes: number;
    allocatedDurationMinutes: number;
    budgetTierApplied: string;
    mobilityFiltersEnforced: string[];
    unverifiedAdvisories?: string[];
    sequencingStrategy: string;
    candidatesFilteredOutCount: number;
  };
}

export interface AgentWorkflowStep {
  step: number;
  title: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'clarification_needed' | 'error';
  timestamp?: string;
  details?: string;
  isSampleData?: boolean;
}

export interface OutingPlanResult {
  planId: string;
  cityName: string;
  title: string;
  narrativeSummary: string;
  totalDurationMinutes: number;
  stops: ItineraryStop[];
  provenance: ProvenanceBreakdown;
  workflowSteps: AgentWorkflowStep[];
  isSampleData: boolean;
  sampleDataNotice?: string;
  baselineComparison?: {
    baselineStops: ItineraryStop[];
    differenceSummary: string;
    methodologyNotice: string;
  };
}
