export type PromptLanguage = "ru" | "en";

export type AuditConfig = {
  brand: string;
  website: string | null;
  description: string | null;
  categoryPhrase: string | null;
  products: string[];
  market: string | null;
  targetAudience: string | null;
  useCases: string[];
  problems: string[];
  competitors: string[];
  promptLanguage: PromptLanguage;
};

export type SourceEntry = {
  name: string | null;
  domain: string | null;
  url: string | null;
  type: string | null;
  official: boolean;
  brandRelated: boolean;
  competitorRelated: boolean;
};

export type ClaimEntry = {
  text: string;
  potentialIssue: boolean;
};

export type CompetitorEntry = {
  name: string;
  mentioned: boolean;
  recommended: boolean;
  position: number | null;
};

export type CitationEntry = {
  title: string | null;
  url: string | null;
  domain: string | null;
};

export type StructuredCitation = {
  url: string;
  domain: string | null;
  title: string | null;
  sourceType: string | null;
  citationText: string | null;
};

export type AnalysisResult = {
  brandMentioned: boolean;
  recommended: boolean;
  recommendationPosition: number | null;
  competitors: CompetitorEntry[];
  products: string[];
  claims: ClaimEntry[];
  sources: SourceEntry[];
  citations: CitationEntry[];
  intent: string | null;
  insight: string | null;
};

export type ResponseLike = {
  id: string;
  promptId: string;
  status: string;
  promptText: string | null;
  category: string | null;
  brandMentioned: boolean;
  recommended: boolean;
  recommendationPosition: number | null;
  competitorNames: string[];
  products: string[];
  sourceDomains: string[];
  officialSources: boolean;
  brandRelatedSources: boolean;
  competitorRelatedSources: boolean;
  citations: CitationEntry[];
  potentialIssues: ClaimEntry[];
  provider: string | null;
  model: string | null;
  rawResponse: string | null;
  completedAt: Date | null;
  runId?: string | null;
  webSearchUsed?: boolean;
  structuredCitations?: StructuredCitation[];
  positioning?: PositioningResult | null;
};

export type RunLike = {
  id: string;
  runNumber: number;
  mode: string;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  promptSetVersion: number;
  promptSetHash: string | null;
  providers: string[];
  success: number;
  failed: number;
  total: number;
  sourceDetectedResponses: number;
  metrics: AiSearchMetrics;
};

export type SourceStat = {
  domain: string;
  count: number;
  official: boolean;
  brandRelated: boolean;
  competitorRelated: boolean;
};

export type SourceTypeCounts = {
  official: number;
  competitor: number;
  industry: number;
  documentation: number;
  review: number;
  community: number;
  media: number;
  other: number;
};

export type CategoryStat = {
  total: number;
  success: number;
  mentioned: number;
  recommended: number;
  mentionRate: number | null;
};

export type PotentialIssue = {
  claim: string;
  promptId: string;
  responseId: string;
};

export type AiSearchMetrics = {
  executed: number;
  success: number;
  failed: number;
  completedAt: Date | null;
  providers: string[];
  mentionRate: number | null;
  recommendationRate: number | null;
  top3Rate: number | null;
  citationRate: number | null;
  competitorPresenceRate: number | null;
  competitorOnlyCount: number;
  competitorOnlyPromptIds: string[];
  officialSourceRate: number | null;
  sourceCoverage: SourceStat[];
  sourceTypeCounts: SourceTypeCounts;
  sourceDataAvailable: boolean;
  potentialIssues: PotentialIssue[];
  byCategory: Record<string, CategoryStat>;
};

export type InsightResult = {
  type: string;
  severity: string;
  title: string;
  description: string;
  evidence: {
    promptIds: string[];
    responseIds: string[];
    stats: string;
  };
};

export type GapResult = {
  type: string;
  severity: string;
  title: string;
  description: string;
  hypothesis: string | null;
  evidence: {
    promptIds: string[];
    responseIds: string[];
    stats: string;
  };
};

export type ActionResult = {
  gapType: string;
  priority: string;
  problem: string;
  recommendation: string;
  target: string | null;
  expectedPurpose: string | null;
  whyThisAction: string | null;
  verificationMethod: string | null;
  evidence: {
    promptIds: string[];
    responseIds: string[];
  };
};

export type IssueLike = {
  id: string;
  auditId: string;
  promptId: string | null;
  responseId: string | null;
  claim: string;
  status: string;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedAt: Date | null;
};

/**
 * Positioning: как AI описывает бренд в одном ответе.
 * Извлекается только то, что реально присутствует в raw response.
 */
export type PositioningResult = {
  brandDescriptions: string[];
  productAssociations: string[];
  categoryAssociations: string[];
  useCases: string[];
  valuePropositions: string[];
  differentiators: string[];
  recurringPhrases: string[];
  adjectives: string[];
  technicalTerms: string[];
  buyerCriteria: string[];
};

export type PositioningKey = keyof PositioningResult;

export type PhraseStat = {
  phrase: string;
  count: number;
  /** % от ответов, где бренд/сущность упомянута (знаменатель по контексту). */
  percentage: number | null;
  prompts: { promptId: string; promptText: string | null; responseId: string }[];
};

export type EntityPositioning = {
  entity: string;
  topDescriptions: PhraseStat[];
  topProducts: PhraseStat[];
  topUseCases: PhraseStat[];
  topTechnical: PhraseStat[];
  topRecurring: PhraseStat[];
  topBuyerCriteria: PhraseStat[];
  mentions: number;
};

export type PositioningGap = {
  type: "PRODUCT" | "USE_CASE" | "TECHNICAL" | "BUYER_CRITERIA" | "CATEGORY";
  item: string;
  severity: string;
  title: string;
  description: string;
  evidence: {
    promptIds: string[];
    responseIds: string[];
    stats: string;
  };
};

export type RunComparison = {
  runA: { runNumber: number; mode: string; providers: string[]; total: number; date: string | null } | null;
  runB: { runNumber: number; mode: string; providers: string[]; total: number; date: string | null } | null;
  promptSetCompatible: boolean;
  providerChanged: boolean;
  metrics: {
    mentionRate: { before: number | null; after: number | null; change: number | null };
    recommendationRate: { before: number | null; after: number | null; change: number | null };
    top3Rate: { before: number | null; after: number | null; change: number | null };
    citationRate: { before: number | null; after: number | null; change: number | null };
    officialSourceRate: { before: number | null; after: number | null; change: number | null };
    competitorOnlyCount: { before: number; after: number; change: number };
  };
  intent: {
    category: string;
    before: { mentioned: number; total: number };
    after: { mentioned: number; total: number };
    change: number;
  }[];
  sources: {
    newDomains: { domain: string; countAfter: number }[];
    disappearedDomains: { domain: string; countBefore: number }[];
    repeatedDomains: { domain: string; countBefore: number; countAfter: number; change: number }[];
    officialMentions: { before: number; after: number; change: number };
    competitorMentions: { before: number; after: number; change: number };
    industryMentions: { before: number; after: number; change: number };
    officialDomain: string | null;
  };
  positioning: {
    newPhrases: { phrase: string; countAfter: number }[];
    removedPhrases: { phrase: string; countBefore: number }[];
    increased: { phrase: string; before: number; after: number; change: number }[];
    decreased: { phrase: string; before: number; after: number; change: number }[];
  };
};

export const PROMPT_CATEGORY_LABELS: Record<string, string> = {
  BRAND: "Brand",
  PRODUCT: "Product",
  CATEGORY: "Category",
  BUYER_INTENT: "Buyer Intent",
  USE_CASE: "Use Case",
  COMPARISON: "Comparison",
  ALTERNATIVES: "Alternatives",
  PROBLEM_SOLUTION: "Problem / Solution",
  EXPERT_TECHNICAL: "Expert / Technical",
  COMPETITOR: "Competitor",
};