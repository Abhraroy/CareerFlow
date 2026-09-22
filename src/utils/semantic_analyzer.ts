import { RequirementAnalysis, LLMAnalysisOutput } from './zodSchema'
import { calculateScores, PRIORITY_WEIGHT } from './calculateFitScore_ConfidenceScore'

export function analyzeSemanticResults(
  requirements: RequirementAnalysis[] = [],
  jobData?: unknown
): LLMAnalysisOutput {
  // 1. Calculate the score deterministically using calculateScores
  const { fitScore, potentialFitScore } = calculateScores(requirements)

  // 2. Derive fit label / score label
  const getScoreLabel = (score: number) => {
    if (score >= 90) return 'Exceptional Match'
    if (score >= 80) return 'Strong Match'
    if (score >= 70) return 'Good Match'
    if (score >= 60) return 'Moderate Match'
    if (score >= 50) return 'Weak Match'
    return 'Low Match'
  }
  const fitLabel = getScoreLabel(fitScore)

  // 3. Derive Strong Matches
  const strongMatches = requirements
    .filter((r) => r.match === 'MATCHED')
    .filter((r) => r.evidenceLevel !== 'NONE')
    .sort((a, b) => {
      return (
        PRIORITY_WEIGHT[b.priority as keyof typeof PRIORITY_WEIGHT] -
        PRIORITY_WEIGHT[a.priority as keyof typeof PRIORITY_WEIGHT]
      )
    })
    .slice(0, 5)
    .map((r) => {
      const evidence = r.resumeEvidence.trim()
      const cleanEvidence = evidence.endsWith('.') ? evidence.slice(0, -1) : evidence
      const lowerEvidence = cleanEvidence.charAt(0).toLowerCase() + cleanEvidence.slice(1)
      return `${r.requirement} demonstrated through ${lowerEvidence}.`
    })

  // 4. Derive Key Gaps
  const keyGaps = requirements
    .filter((r) => r.match === 'PARTIAL' || r.match === 'NOT_MENTIONED')
    .filter((r) => r.priority !== 'CONTEXTUAL')
    .sort((a, b) => {
      return (
        PRIORITY_WEIGHT[b.priority as keyof typeof PRIORITY_WEIGHT] -
        PRIORITY_WEIGHT[a.priority as keyof typeof PRIORITY_WEIGHT]
      )
    })
    .slice(0, 5)
    .map((r) => {
      if (r.match === 'PARTIAL' && r.evidenceLevel === 'LISTED') {
        return `${r.requirement} is listed as a technical skill, but specific usage is not demonstrated.`
      }
      if (r.match === 'NOT_MENTIONED' || r.evidenceLevel === 'NONE') {
        const reqText = r.requirement.toLowerCase().includes('experience')
          ? r.requirement
          : `${r.requirement} experience`
        const capitalized = reqText.charAt(0).toUpperCase() + reqText.slice(1)
        return `${capitalized} is not mentioned in the supplied resume.`
      }
      return `${r.requirement} is partially matching, but not fully demonstrated (${r.resumeEvidence}).`
    })

  // 5. Derive Resume Improvements
  const resumeImprovements = requirements
    .filter((r) => r.recommendationType !== 'NONE')
    .sort((a, b) => {
      return (
        PRIORITY_WEIGHT[b.priority as keyof typeof PRIORITY_WEIGHT] -
        PRIORITY_WEIGHT[a.priority as keyof typeof PRIORITY_WEIGHT]
      )
    })
    .slice(0, 5)
    .map((r) => {
      if (r.recommendationType === 'REWRITE_NOW') {
        return `Strengthen the resume's ${r.requirement} experience: ${r.resumeAction}`
      }
      if (r.recommendationType === 'ADD_EVIDENCE_IF_TRUE') {
        return r.resumeAction || `If ${r.requirement} was used, explicitly identify where.`
      }
      if (r.recommendationType === 'CANNOT_FIX_WITH_REWRITE') {
        return `${r.requirement} experience is not demonstrated and cannot be fixed through wording alone.`
      }
      return r.resumeAction
    })

  // 6. Generate Score Explanation
  const matchedCount = requirements.filter((r) => r.match === 'MATCHED').length
  const partialCount = requirements.filter((r) => r.match === 'PARTIAL').length
  const missingCount = requirements.filter((r) => r.match === 'NOT_MENTIONED').length
  const scoreExplanation = `${fitLabel} exists across ${matchedCount} important requirements, with ${partialCount} partial matches and ${missingCount} requirements not demonstrated in the resume.`

  // Attempt to extract job details for UI fallback
  let jobTitle = 'Target Position'
  let company = 'Company'
  if (typeof jobData === 'string') {
    const titleMatch = jobData.match(/(?:Job Title|Title|Position):\s*([^\n\r]+)/i)
    const companyMatch = jobData.match(/(?:Company|Employer|Organization):\s*([^\n\r]+)/i)
    if (titleMatch) jobTitle = titleMatch[1].trim()
    if (companyMatch) company = companyMatch[1].trim()
  } else if (jobData && typeof jobData === 'object') {
    const obj = jobData as Record<string, any>
    if (obj.jobTitle) jobTitle = String(obj.jobTitle).trim()
    if (obj.company) company = String(obj.company).trim()
  }

  const payload: LLMAnalysisOutput = {
    fitScore,
    fitLabel,
    strongMatches,
    keyGaps,
    resumeImprovements,
    scoreExplanation,
    executiveSummary: {
      jobTitle,
      company,
      currentFitScore: fitScore,
      potentialFitScore: potentialFitScore,
      recommendation: fitLabel
    },
    finalVerdict: {
      decision: fitLabel
    },
    missingUnclearRequirements: {
      missing: requirements.filter((r) => r.match === 'NOT_MENTIONED').map((r) => r.requirement)
    },
    top5ChangesBeforeApplying: resumeImprovements,
    requirements,
    llmAnalysis: {
      requirements
    },
    result: {
      fitScore,
      fitLabel,
      strongMatches,
      keyGaps,
      resumeImprovements,
      scoreExplanation
    }
  }

  return payload
}
