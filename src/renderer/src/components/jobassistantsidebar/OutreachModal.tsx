import React, { useState } from 'react'
import { useAppStore } from '../../lib/zustandStore'
import { LuCheck, LuCopy, LuMail, LuSend, LuSparkles, LuUser, LuX } from '@/components/icons'
import Logger from '@utils/logger'

export function OutreachModal(): React.JSX.Element | null {
  const { isOutreachModalOpen, setIsOutreachModalOpen, scrapedJob, llmResult } = useAppStore()
  const [copiedType, setCopiedType] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'recruiter' | 'hiringManager' | 'connection'>('recruiter')

  if (!isOutreachModalOpen) return null

  const jobTitle = scrapedJob?.jobTitle || llmResult?.executiveSummary?.jobTitle || 'Role'
  const company = scrapedJob?.company || llmResult?.executiveSummary?.company || 'Company'

  const templates = {
    recruiter: {
      title: 'Recruiter Message',
      subtitle: 'Best for internal tech recruiters & talent partners',
      subject: `Application Inquiry - ${jobTitle} position`,
      body: `Hi [Recruiter Name],\n\nI recently applied for the ${jobTitle} role at ${company} and wanted to reach out directly. Given my experience with key requirements for this position, I'm confident I can bring strong value to ${company}.\n\nI would love the opportunity to connect and discuss how my background aligns with what you're looking for.\n\nBest regards,\n[Your Name]`
    },
    hiringManager: {
      title: 'Hiring Manager Note',
      subtitle: 'Focused note demonstrating domain alignment & enthusiasm',
      subject: `Interested in ${jobTitle} on your team`,
      body: `Hi [Manager Name],\n\nI came across the ${jobTitle} opening on your team at ${company} and was genuinely impressed by your team's mission. Having worked on similar challenges, I am excited about the possibility of contributing to your ongoing goals.\n\nI'd appreciate 5 minutes to introduce myself if you're open to a brief chat.\n\nBest regards,\n[Your Name]`
    },
    connection: {
      title: 'Peer Connection Inquiry',
      subtitle: 'Informational chat template for current engineers or peers',
      subject: `Connecting regarding ${jobTitle} at ${company}`,
      body: `Hi [Name], I noticed your work at ${company} and wanted to connect! I'm currently exploring the ${jobTitle} position and would appreciate learning more about the team culture and engineering environment. Hope to stay connected!`
    }
  }

  const currentTemplate = templates[activeTab]

  const handleCopy = async (type: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedType(type)
      setTimeout(() => setCopiedType(null), 1500)
    } catch (err) {
      Logger.error('OutreachModal.tsx', 'handleCopy', 'Failed to copy outreach template', err)
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-neutral-900 flex items-center justify-between bg-neutral-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
              <LuSend className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Make Move — Direct Outreach
              </h2>
              <p className="text-xs text-neutral-400">
                Personalized cold outreach strategy for{' '}
                <span className="text-neutral-200 font-semibold">{company}</span> ({jobTitle})
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsOutreachModalOpen(false)}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
            title="Close modal"
          >
            <LuX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 flex-1 overflow-y-auto flex flex-col gap-4">
          {/* Tab Selector */}
          <div className="grid grid-cols-3 gap-2 bg-neutral-900/60 p-1 rounded-xl border border-neutral-850">
            <button
              onClick={() => setActiveTab('recruiter')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'recruiter'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LuMail className="w-3.5 h-3.5" />
              <span>Recruiter</span>
            </button>

            <button
              onClick={() => setActiveTab('hiringManager')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'hiringManager'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LuUser className="w-3.5 h-3.5" />
              <span>Hiring Manager</span>
            </button>

            <button
              onClick={() => setActiveTab('connection')}
              className={`py-2 px-3 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'connection'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <LuSparkles className="w-3.5 h-3.5" />
              <span>LinkedIn Note</span>
            </button>
          </div>

          {/* Template Details Card */}
          <div className="bg-black/60 border border-neutral-900 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                {currentTemplate.title}
              </span>
              <button
                type="button"
                onClick={() =>
                  handleCopy(
                    activeTab,
                    `Subject: ${currentTemplate.subject}\n\n${currentTemplate.body}`
                  )
                }
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer border ${
                  copiedType === activeTab
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    : 'bg-neutral-900 hover:bg-neutral-800 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                {copiedType === activeTab ? (
                  <>
                    <LuCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <LuCopy className="w-3.5 h-3.5 text-neutral-400" />
                    <span>Copy Full Message</span>
                  </>
                )}
              </button>
            </div>

            {/* Subject Line */}
            {currentTemplate.subject && (
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                  SUBJECT
                </span>
                <div className="p-2.5 bg-neutral-950 border border-neutral-900 rounded-lg text-xs text-neutral-200 font-medium">
                  {currentTemplate.subject}
                </div>
              </div>
            )}

            {/* Body Text */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                MESSAGE BODY
              </span>
              <div className="p-3 bg-neutral-950 border border-neutral-900 rounded-lg text-xs text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                {currentTemplate.body}
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-neutral-900 bg-neutral-900/30 flex items-center justify-end gap-3">
          <button
            onClick={() => setIsOutreachModalOpen(false)}
            className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
