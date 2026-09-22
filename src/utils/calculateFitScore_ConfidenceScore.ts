import { RequirementAnalysis } from './zodSchema'

export const PRIORITY_WEIGHT = {
  CRITICAL: 5,
  REQUIRED: 4,
  PREFERRED: 2,
  CONTEXTUAL: 0
} as const

export const MATCH_WEIGHT = {
  MATCHED: 1.0,
  PARTIAL: 0.5,
  NOT_MENTIONED: 0.0,
  CONFLICTING: 0.0
} as const

export const EVIDENCE_WEIGHT = {
  NONE: 0.0,
  LISTED: 0.5,
  DEMONSTRATED: 0.75,
  PROFESSIONAL: 0.9,
  PRODUCTION: 1.0
} as const

export const REALISTIC_POTENTIAL_WEIGHT = {
  REWRITE_NOW: 0.80,
  ADD_EVIDENCE_IF_TRUE: 0.70,
  CANNOT_FIX_WITH_REWRITE: 0.00,
  NONE: 0.00
} as const

export function calculateScores(requirements: RequirementAnalysis[] = []) {
  if (!Array.isArray(requirements) || requirements.length === 0) {
    return {
      fitScore: 0,
      confidenceScore: 0,
      potentialFitScore: 0
    }
  }

  let totalPossibleFit = 0
  let totalEarnedFit = 0
  let totalPotentialEarnedFit = 0
  let totalPriorityConfidence = 0
  let confidencePoints = 0

  for (const req of requirements) {
    const priority = PRIORITY_WEIGHT[req.priority] ?? 0
    const match = MATCH_WEIGHT[req.match] ?? 0
    const evidence = EVIDENCE_WEIGHT[req.evidenceLevel] ?? 0

    // Only non-CONTEXTUAL requirements count towards technical fit score
    if (req.priority !== 'CONTEXTUAL') {
      totalPossibleFit += priority
      totalEarnedFit += priority * match

      let potentialMatch: number = match
      if (req.match !== 'MATCHED') {
        const realisticPotential =
          REALISTIC_POTENTIAL_WEIGHT[
            req.recommendationType as keyof typeof REALISTIC_POTENTIAL_WEIGHT
          ] ?? 0
        potentialMatch = Math.max(match, realisticPotential)
      }
      totalPotentialEarnedFit += priority * potentialMatch
    }

    totalPriorityConfidence += priority
    confidencePoints += priority * evidence
  }

  const rawFitScore = totalPossibleFit > 0 ? (totalEarnedFit / totalPossibleFit) * 100 : 0
  const rawPotentialFitScore = totalPossibleFit > 0 ? (totalPotentialEarnedFit / totalPossibleFit) * 100 : 0
  const rawConfidenceScore =
    totalPriorityConfidence > 0 ? (confidencePoints / totalPriorityConfidence) * 100 : 0

  const fitScore = Math.max(0, Math.min(100, Math.round(rawFitScore)))
  const potentialFitScore = Math.max(0, Math.min(100, Math.round(rawPotentialFitScore)))
  const confidenceScore = Math.max(0, Math.min(100, Math.round(rawConfidenceScore)))

  return {
    fitScore,
    confidenceScore,
    potentialFitScore
  }
}