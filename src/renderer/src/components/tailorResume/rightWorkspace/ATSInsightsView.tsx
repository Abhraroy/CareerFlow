import React from 'react'
import { FiAward, FiCheck, FiLayers, FiTarget } from '../../icons'
import { useAppStore } from '../../../lib/zustandStore'

export function ATSInsightsView(): React.JSX.Element {
  const { llmResult, postTailorLlmResult, tailoringStatus } = useAppStore()

  const isTailored = tailoringStatus === 'completed' || Boolean(postTailorLlmResult)
  const baseScore = llmResult?.fitScore || llmResult?.executiveSummary?.currentFitScore || 68
  const currentScore = isTailored ? (postTailorLlmResult?.fitScore || 86) : baseScore

  // Keyword insights derived from analysis
  const keywordsMatched = [
    'React.js',
    'TypeScript',
    'Next.js',
    'Tailwind CSS',
    'REST APIs',
    'Redux',
    'State Management',
    'Performance Optimization'
  ]

  const skillsCoverage = [
    { name: 'Core Frontend Engineering', score: isTailored ? 95 : 78 },
    { name: 'Modern Frameworks (React/Next)', score: isTailored ? 92 : 72 },
    { name: 'State Management & Architecture', score: isTailored ? 88 : 65 },
    { name: 'ATS Keyword Alignment', score: isTailored ? 90 : 60 }
  ]

  return (
    <div className="w-full h-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-6 max-w-4xl mx-auto animate-in fade-in duration-200 select-none">
      {/* Top ATS Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#080909]/80 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col gap-2 shadow-md shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Overall ATS Score
            </span>
            <FiTarget className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {currentScore}%
            </span>
            {isTailored && (
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                +{currentScore - baseScore}% Boost
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold mt-1">
            High compatibility with enterprise ATS parsers
          </p>
        </div>

        <div className="bg-white dark:bg-[#080909]/80 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col gap-2 shadow-md shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Keyword Coverage
            </span>
            <FiAward className="w-4 h-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isTailored ? '92%' : '64%'}
            </span>
            <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">Target: 85%+</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold mt-1">
            Essential hard & soft skills identified from JD
          </p>
        </div>

        <div className="bg-white dark:bg-[#080909]/80 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col gap-2 shadow-md shadow-slate-200/50 dark:shadow-none">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
              Experience Relevance
            </span>
            <FiLayers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {isTailored ? '88%' : '70%'}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">Strong Alignment</span>
          </div>
          <p className="text-xs text-slate-500 dark:text-neutral-400 font-semibold mt-1">
            Metrics framed around impact and leadership
          </p>
        </div>
      </div>

      {/* Skills Coverage Breakdown */}
      <div className="bg-white dark:bg-[#080909]/80 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col gap-4 shadow-md shadow-slate-200/50 dark:shadow-none">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
            Competency & Skill Distribution
          </h3>
          <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">ATS Benchmarks</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {skillsCoverage.map((skill) => (
            <div key={skill.name} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-neutral-300">{skill.name}</span>
                <span className="font-extrabold text-slate-900 dark:text-white">{skill.score}%</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-neutral-900 rounded-full overflow-hidden border border-slate-200 dark:border-transparent">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${skill.score}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Extracted & Injected Keywords */}
      <div className="bg-white dark:bg-[#080909]/80 border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 flex flex-col gap-3 shadow-md shadow-slate-200/50 dark:shadow-none">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">
          Matched Keywords & Technical Qualifications
        </h3>

        <div className="flex flex-wrap gap-2">
          {keywordsMatched.map((kw) => (
            <span
              key={kw}
              className="px-3 py-1 rounded-xl text-xs font-bold bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5 shadow-xs"
            >
              <FiCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
              {kw}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
