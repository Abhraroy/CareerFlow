import React, { useState } from 'react'
import {
  FiChevronRight,
  FiEdit3,
  FiFileText,
  FiLayers,
  FiMinusCircle,
  FiPlusCircle,
  FiRepeat,
  FiCheckCircle
} from '../../icons'
import { useAppStore, TailorChangeDetail } from '../../../lib/zustandStore'
import { ResumeDocumentSheet } from './ResumeDocumentSheet'

type ChangeCategory = 'all' | 'added' | 'rewritten' | 'removed' | 'reordered'
type DiffViewType = 'document' | 'side-by-side' | 'cards'

interface ResumeChangeItem {
  id: string
  category: 'added' | 'rewritten' | 'removed' | 'reordered'
  section: string
  title: string
  description: string
  before?: string
  after?: string
  impact: 'High' | 'Medium' | 'Critical'
  gain: string
  keywords?: string[]
}

const DEFAULT_CHANGES: ResumeChangeItem[] = [
  {
    id: 'chg-1',
    category: 'added',
    section: 'Technical Skills',
    title: 'Injected High-Frequency ATS Keywords',
    description: 'Added React, TypeScript, Next.js, Tailwind CSS, REST APIs, and Redux to match JD requirements.',
    before: 'JavaScript, HTML, CSS, React basics, Git',
    after: 'React.js, TypeScript, Next.js, Tailwind CSS, Redux Toolkit, RESTful APIs, Node.js',
    impact: 'Critical',
    gain: '+12% Match',
    keywords: ['TypeScript', 'Next.js', 'Redux Toolkit', 'Tailwind CSS']
  },
  {
    id: 'chg-2',
    category: 'rewritten',
    section: 'Professional Experience',
    title: 'Framed Experience with Google XYZ Impact Formula',
    description: 'Transformed passive responsibilities into metric-driven accomplishment bullets.',
    before: 'Worked on building frontend features and fixing bugs for web applications.',
    after: 'Engineered scalable frontend architecture using React and TypeScript, boosting page load performance by 35% and reducing bundle size by 28%.',
    impact: 'High',
    gain: '+8% Impact',
    keywords: ['Performance Optimization', 'Architecture', 'Scalability']
  },
  {
    id: 'chg-3',
    category: 'rewritten',
    section: 'Professional Summary',
    title: 'Tailored Summary to Target Senior/Frontend Role',
    description: 'Aligned objective statement directly with the core requirements of the target position.',
    before: 'Passionate developer looking for new opportunities in web engineering.',
    after: 'Frontend Software Engineer with 3+ years of experience engineering responsive, high-performance web applications using React, TypeScript, and modern state architectures.',
    impact: 'High',
    gain: '+6% Match'
  },
  {
    id: 'chg-4',
    category: 'reordered',
    section: 'Layout & Hierarchy',
    title: 'Elevated Relevant Projects to Prioritize JD Fit',
    description: 'Moved e-commerce and SaaS dashboard projects above general utility tools.',
    before: 'Original project ordering prioritized utility tools over e-commerce modules.',
    after: 'Reordered projects to prioritize high-impact e-commerce and full-stack solutions.',
    impact: 'Medium',
    gain: '+4% Clarity'
  }
]

export function ResumeChangesView(): React.JSX.Element {
  const [diffView, setDiffView] = useState<DiffViewType>('document')
  const [activeCategory, setActiveCategory] = useState<ChangeCategory>('all')
  const { setActiveChangeDetail, setIsChangeModalOpen, tailoredResume, currentResume, canvasZoom } = useAppStore()

  // Auto-sync persisted edit plan and tailored resume from storage if not in memory
  React.useEffect(() => {
    async function loadPersistedTailoring(): Promise<void> {
      if ((!tailoredResume || !tailoredResume.edits || tailoredResume.edits.length === 0) && window.api?.getEditPlan) {
        try {
          const editPlan = await window.api.getEditPlan()
          const tailoredDoc = await window.api.getTailoredResume?.()
          if (editPlan && Array.isArray(editPlan.edits) && editPlan.edits.length > 0) {
            const merged = {
              ...(tailoredDoc || tailoredResume || {}),
              edits: editPlan.edits
            }
            useAppStore.getState().setTailoredResume(merged)
          }
        } catch {
          // Ignore
        }
      }
    }
    loadPersistedTailoring()
  }, [])

  // Helper to reliably find original element text in base resume
  const findOriginalInBase = React.useCallback(
    (targetId: string): string | null => {
      if (!targetId) return null
      const baseResume =
        (currentResume as any)?.originalStructuredData ||
        (currentResume as any)?.structuredData ||
        currentResume
      if (!baseResume?.sections || !Array.isArray(baseResume.sections)) return null

      for (const section of baseResume.sections) {
        if (!Array.isArray(section.elements)) continue
        for (const el of section.elements) {
          if (el.id === targetId) {
            return typeof el.content === 'string' ? el.content : JSON.stringify(el.content)
          }
        }
        if (section.id === targetId) {
          return section.title || null
        }
      }
      return null
    },
    [currentResume]
  )

  const changesList = React.useMemo<ResumeChangeItem[]>(() => {
    // 1. Strictly prioritize tailoredResume.edits from storage/edit_plan.json
    if (tailoredResume?.edits && Array.isArray(tailoredResume.edits) && tailoredResume.edits.length > 0) {
      return tailoredResume.edits.map((edit: any, idx: number) => {
        const fallbackBefore = findOriginalInBase(edit.targetId)
        const beforeContent =
          edit.originalContent ||
          fallbackBefore ||
          (edit.operation === 'append' || edit.operation?.startsWith('insert')
            ? '(New addition to section)'
            : 'Original section content')

        return {
          id: `edit-${idx}`,
          category: edit.operation === 'append' || edit.operation?.startsWith('insert') ? 'added' : 'rewritten',
          section: edit.targetId?.includes('experience')
            ? 'Work Experience'
            : edit.targetId?.includes('skills')
              ? 'Skills'
              : edit.targetId?.includes('project')
                ? 'Projects'
                : edit.targetId?.includes('education')
                  ? 'Education'
                  : 'Resume Section',
          title: `Targeted Edit (${edit.operation || 'updated'})`,
          description: edit.reason || 'Optimized for target job alignment',
          before: beforeContent,
          after: edit.newContent,
          impact: 'High',
          gain: '+8% Impact'
        }
      })
    }

    // 2. Fallback to tailoredResume.sections with tailored metadata
    if (tailoredResume?.sections && Array.isArray(tailoredResume.sections)) {
      const extracted: ResumeChangeItem[] = []
      tailoredResume.sections.forEach((sec: any) => {
        ;(sec.elements || []).forEach((el: any) => {
          if (el.metadata?.tailored) {
            const fallbackBefore = findOriginalInBase(el.id)
            const beforeContent =
              el.metadata.originalContent ||
              fallbackBefore ||
              (el.metadata.insertedAfter || el.metadata.insertedBefore
                ? '(New addition to section)'
                : 'Original section content')

            extracted.push({
              id: el.id,
              category: el.metadata.insertedAfter || el.metadata.insertedBefore ? 'added' : 'rewritten',
              section: sec.title || 'Resume Section',
              title: `Optimized: ${el.id}`,
              description: el.metadata.editReason || 'Enhanced to align with job description requirements',
              before: beforeContent,
              after: typeof el.content === 'string' ? el.content : JSON.stringify(el.content),
              impact: 'High',
              gain: '+8% Impact'
            })
          }
        })
      })
      if (extracted.length > 0) return extracted
    }

    return DEFAULT_CHANGES
  }, [tailoredResume, findOriginalInBase])

  const filteredChanges = changesList.filter((item) => {
    if (activeCategory === 'all') return true
    return item.category === activeCategory
  })

  const handleOpenDetail = (change: ResumeChangeItem): void => {
    const detail: TailorChangeDetail = {
      id: change.id,
      sectionName: change.section,
      title: change.title,
      changesCount: 1,
      impactScore: change.gain,
      impactBadge: change.impact,
      summaryOfChange: change.description,
      beforeText: change.before || 'Original section content',
      afterText: change.after || 'N/A',
      keyImprovements: [
        'Tailored directly to job description keywords',
        'Enhanced metric and accomplishment focus',
        'Optimized ATS parse-rate and readability'
      ],
      atsKeywordGains: change.keywords || []
    }

    setActiveChangeDetail(detail)
    setIsChangeModalOpen(true)
  }

  return (
    <div className="w-full h-full flex flex-col overflow-hidden animate-in fade-in duration-200 select-none">
      {/* ── Diff Navigation Header ── */}
      <div className="w-full bg-white/70 dark:bg-[#0D0F0F]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/[0.06] px-4 py-2 flex items-center justify-between gap-3 flex-shrink-0 z-20 shadow-xs">
        {/* Left: Minimal Change Count */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-400 bg-emerald-100/80 dark:bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {changesList.length} Changes
          </span>
        </div>

        {/* Right: View Switcher */}
        <div className="flex items-center bg-slate-100 dark:bg-black/40 p-0.5 rounded-xl border border-slate-200 dark:border-white/[0.06] shadow-inner">
          <button
            onClick={() => setDiffView('document')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              diffView === 'document'
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiFileText className="w-3.5 h-3.5" />
            <span>Diff</span>
          </button>

          <button
            onClick={() => setDiffView('side-by-side')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              diffView === 'side-by-side'
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiRepeat className="w-3.5 h-3.5" />
            <span>Side-by-Side</span>
          </button>

          <button
            onClick={() => setDiffView('cards')}
            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
              diffView === 'cards'
                ? 'bg-white dark:bg-[#27272A] text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FiLayers className="w-3.5 h-3.5" />
            <span>Cards</span>
          </button>
        </div>
      </div>

      {/* ── View 1: Rendered Resume Diff Document (Default) ── */}
      {diffView === 'document' && (
        <div className="flex-1 w-full overflow-y-auto overflow-x-auto custom-scrollbar p-6 flex flex-col items-center justify-start bg-slate-100/90 dark:bg-[#050606]/50">
          <ResumeDocumentSheet highlightChanges={true} />
        </div>
      )}

      {/* ── View 2: Side-by-Side Comparison ── */}
      {diffView === 'side-by-side' && (
        <div className="flex-1 w-full overflow-y-auto custom-scrollbar p-4 bg-slate-100/90 dark:bg-[#050606]/50">
          <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Left Column: Original Base Resume */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-full max-w-[794px] px-3 py-1.5 rounded-xl bg-white dark:bg-[#0D0F0F] border border-slate-200 dark:border-white/[0.08] flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold text-slate-700 dark:text-neutral-300">
                  Base Original Resume
                </span>
                <span className="text-[10px] font-mono text-slate-500 dark:text-neutral-400">
                  Unmodified draft
                </span>
              </div>
              <div className="w-full flex justify-center overflow-x-auto">
                <ResumeDocumentSheet
                  id="original-base-resume-sheet"
                  tailoredResume={(currentResume as any)?.originalStructuredData || currentResume?.structuredData || currentResume}
                  highlightChanges={false}
                  zoom={Math.min(0.75, canvasZoom)}
                />
              </div>
            </div>

            {/* Right Column: Tailored Resume with Green Changes */}
            <div className="flex flex-col items-center gap-3">
              <div className="w-full max-w-[794px] px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between shadow-xs">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <FiCheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  New Tailored Resume
                </span>
                <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
                  Green = AI Optimized
                </span>
              </div>
              <div className="w-full flex justify-center overflow-x-auto">
                <ResumeDocumentSheet
                  highlightChanges={true}
                  zoom={Math.min(0.75, canvasZoom)}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── View 3: Change Cards List ── */}
      {diffView === 'cards' && (
        <div className="flex-1 w-full p-6 overflow-y-auto custom-scrollbar flex flex-col gap-5 max-w-4xl mx-auto">
          {/* Category Filter Pills */}
          <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-200 dark:border-white/[0.06]">
            <div className="flex items-center gap-1.5 flex-wrap">
              {(['all', 'added', 'rewritten', 'removed', 'reordered'] as ChangeCategory[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl capitalize transition-all cursor-pointer shadow-xs ${
                    activeCategory === cat
                      ? 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-800 dark:text-emerald-400 border border-emerald-500/30 font-bold'
                      : 'bg-slate-100 dark:bg-white/[0.03] text-slate-600 dark:text-neutral-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-white/[0.06]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <span className="text-xs text-slate-500 dark:text-neutral-400 font-semibold">
              Showing {filteredChanges.length} changes
            </span>
          </div>

          {/* Changes List */}
          <div className="flex flex-col gap-3">
            {filteredChanges.map((change) => {
              const isAdded = change.category === 'added'
              const isRewritten = change.category === 'rewritten'
              const isRemoved = change.category === 'removed'

              return (
                <div
                  key={change.id}
                  onClick={() => handleOpenDetail(change)}
                  className="bg-white dark:bg-[#080909]/80 border border-slate-200 dark:border-white/[0.06] hover:border-slate-300 dark:hover:border-white/15 rounded-2xl p-4 flex flex-col items-start justify-between gap-3 transition-all hover:bg-slate-50 dark:hover:bg-white/[0.02] cursor-pointer group shadow-md shadow-slate-200/50 dark:shadow-none"
                >
                  <div className="flex items-start justify-between gap-3.5 w-full">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div
                        className={`p-2 rounded-xl flex-shrink-0 mt-0.5 font-bold shadow-xs ${
                          isAdded
                            ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                            : isRewritten
                              ? 'bg-teal-100 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-500/20'
                              : isRemoved
                                ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                : 'bg-indigo-100 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20'
                        }`}
                      >
                        {isAdded && <FiPlusCircle className="w-4 h-4" />}
                        {isRewritten && <FiEdit3 className="w-4 h-4" />}
                        {isRemoved && <FiMinusCircle className="w-4 h-4" />}
                        {change.category === 'reordered' && <FiRepeat className="w-4 h-4" />}
                      </div>

                      <div className="flex flex-col gap-1 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold text-slate-500 dark:text-neutral-400 uppercase tracking-wider">
                            {change.section}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-black uppercase ${
                              change.impact === 'Critical'
                                ? 'bg-rose-100 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20'
                                : change.impact === 'High'
                                  ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20'
                                  : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400 border border-slate-200 dark:border-neutral-700'
                            }`}
                          >
                            {change.impact}
                          </span>
                        </div>

                        <h4 className="text-sm font-extrabold text-slate-900 dark:text-white tracking-tight leading-snug">
                          {change.title}
                        </h4>
                        <p className="text-xs text-slate-600 dark:text-neutral-400 leading-relaxed font-semibold">
                          {change.description}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs font-black text-emerald-700 dark:text-emerald-400 px-2.5 py-1 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-500/20 shadow-xs">
                        {change.gain}
                      </span>
                      <FiChevronRight className="w-4 h-4 text-slate-400 dark:text-neutral-500 group-hover:text-slate-900 dark:group-hover:text-white group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>

                  {/* Inline Before vs After Visual Diff Snippet */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs w-full mt-1">
                    <div className="p-3 rounded-xl bg-rose-50/80 dark:bg-rose-950/25 border border-rose-500/20 text-rose-900 dark:text-rose-200 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider">
                        Original / Before
                      </span>
                      <p className="font-mono text-[11px] leading-relaxed text-slate-800 dark:text-neutral-300 line-clamp-3">
                        {change.before || 'Original section content'}
                      </p>
                    </div>
                    <div className="p-3 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/25 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 flex flex-col gap-1">
                      <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Tailored / After
                      </span>
                      <p className="font-mono text-[11px] leading-relaxed text-slate-800 dark:text-neutral-300 line-clamp-3">
                        {change.after}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
