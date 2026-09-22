import React, { useState, useEffect } from 'react'
import { Resume, ProfileDetails, StructuredResume } from '../../../types'
import { LuPencil, LuPlus, LuSave, LuTrash2, LuX } from '@/components/icons'
import Logger from '@utils/logger'

interface ResumeEditDrawerProps {
  isOpen: boolean
  resume: Resume
  onClose: () => void
  onSave: (updatedResume: Resume) => Promise<void>
}

export function ResumeEditDrawer({
  isOpen,
  resume,
  onClose,
  onSave
}: ResumeEditDrawerProps): React.JSX.Element | null {
  const [details, setDetails] = useState<ProfileDetails>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    portfolio: '',
    customFields: []
  })
  const [resumeText, setResumeText] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [newFieldLabel, setNewFieldLabel] = useState('')
  const [newFieldValue, setNewFieldValue] = useState('')
  const [showAddField, setShowAddField] = useState(false)

  useEffect(() => {
    if (resume) {
      const sData = (resume.structuredData || {}) as StructuredResume
      const prof = resume.profileDetails || {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        location: '',
        linkedin: '',
        github: '',
        portfolio: ''
      }

      setDetails({
        firstName: sData.firstName || prof.firstName || '',
        lastName: sData.lastName || prof.lastName || '',
        email: sData.email || prof.email || '',
        phone: sData.phone || prof.phone || '',
        location: sData.location || prof.location || '',
        linkedin: sData.linkedin || prof.linkedin || '',
        github: sData.github || prof.github || '',
        portfolio: sData.portfolio || prof.portfolio || '',
        customFields: prof.customFields ? [...prof.customFields] : []
      })
      setResumeText(resume.rawResumeData || resume.uploadedData || '')
    }
  }, [resume, isOpen])

  if (!isOpen) return null

  const handleFieldChange = (key: keyof ProfileDetails, val: string) => {
    setDetails((prev) => ({ ...prev, [key]: val }))
  }

  const handleCustomFieldChange = (id: string, key: 'label' | 'value', val: string) => {
    setDetails((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).map((f) =>
        f.id === id ? { ...f, [key]: val } : f
      )
    }))
  }

  const handleRemoveCustomField = (id: string) => {
    setDetails((prev) => ({
      ...prev,
      customFields: (prev.customFields || []).filter((f) => f.id !== id)
    }))
  }

  const handleAddCustomField = () => {
    if (!newFieldLabel.trim()) return
    const newField = {
      id: `cf-${Date.now()}`,
      label: newFieldLabel.trim(),
      value: newFieldValue.trim()
    }
    setDetails((prev) => ({
      ...prev,
      customFields: [...(prev.customFields || []), newField]
    }))
    setNewFieldLabel('')
    setNewFieldValue('')
    setShowAddField(false)
  }

  const handleSaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const existingStructured = (typeof resume.structuredData === 'object' && resume.structuredData)
        ? resume.structuredData
        : {}

      const updatedResume: Resume = {
        ...resume,
        rawResumeData: resumeText,
        uploadedData: resumeText,
        profileDetails: details,
        structuredData: {
          ...existingStructured,
          firstName: details.firstName,
          lastName: details.lastName,
          email: details.email,
          phone: details.phone,
          location: details.location,
          linkedin: details.linkedin,
          github: details.github,
          portfolio: details.portfolio
        }
      }
      await onSave(updatedResume)
      onClose()
    } catch (err) {
      Logger.error('ResumeEditDrawer.tsx', 'handleSave', 'Error saving resume', err)
      alert('Failed to save resume details.')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl bg-[#111215] border-l border-white/[0.08] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800/80 bg-neutral-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <LuPencil className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Edit Resume Details</h2>
              <p className="text-[11.5px] text-neutral-400">
                Update document text, contact details, and custom metadata
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <LuX className="w-4 h-4" />
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <form onSubmit={handleSaveSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 select-none">
          {/* Section: Document Content */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-neutral-300">
              Full Resume Document Text (Raw / Markdown)
            </label>
            <textarea
              rows={10}
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste or edit the full resume text here..."
              className="w-full p-3 rounded-xl bg-neutral-950 border border-neutral-800 text-xs text-neutral-200 font-mono focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 outline-none leading-relaxed resize-y select-text"
            />
          </div>

          {/* Section: Personal Info */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider border-b border-neutral-800 pb-1">
              Contact & Social Details
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">First Name</label>
                <input
                  type="text"
                  value={details.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">Last Name</label>
                <input
                  type="text"
                  value={details.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">Email</label>
                <input
                  type="email"
                  value={details.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-neutral-400 mb-1">Phone</label>
                <input
                  type="text"
                  value={details.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-neutral-400 mb-1">Location</label>
              <input
                type="text"
                value={details.location}
                onChange={(e) => handleFieldChange('location', e.target.value)}
                placeholder="e.g. San Francisco, CA"
                className="w-full px-3 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[10.5px] font-medium text-neutral-400 mb-1">LinkedIn</label>
                <input
                  type="text"
                  value={details.linkedin}
                  onChange={(e) => handleFieldChange('linkedin', e.target.value)}
                  placeholder="linkedin.com/in/..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11.5px] text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-medium text-neutral-400 mb-1">GitHub</label>
                <input
                  type="text"
                  value={details.github}
                  onChange={(e) => handleFieldChange('github', e.target.value)}
                  placeholder="github.com/..."
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11.5px] text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-[10.5px] font-medium text-neutral-400 mb-1">Portfolio</label>
                <input
                  type="text"
                  value={details.portfolio}
                  onChange={(e) => handleFieldChange('portfolio', e.target.value)}
                  placeholder="portfolio.dev"
                  className="w-full px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-[11.5px] text-white outline-none focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Section: Custom Fields */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-1">
              <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-wider">
                Custom Fields / Sections
              </h3>
              <button
                type="button"
                onClick={() => setShowAddField(true)}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-medium"
              >
                <LuPlus className="w-3 h-3" />
                <span>Add Field</span>
              </button>
            </div>

            {details.customFields && details.customFields.length > 0 ? (
              <div className="space-y-2">
                {details.customFields.map((cf) => (
                  <div key={cf.id} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={cf.label}
                      onChange={(e) => handleCustomFieldChange(cf.id, 'label', e.target.value)}
                      placeholder="Label"
                      className="w-1/3 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-neutral-300 outline-none focus:border-indigo-500"
                    />
                    <input
                      type="text"
                      value={cf.value}
                      onChange={(e) => handleCustomFieldChange(cf.id, 'value', e.target.value)}
                      placeholder="Value"
                      className="flex-1 px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCustomField(cf.id)}
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-800 rounded-lg transition-colors"
                      title="Delete field"
                    >
                      <LuTrash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11.5px] text-neutral-500 italic">No custom fields added.</p>
            )}

            {showAddField && (
              <div className="p-3 rounded-xl bg-neutral-900 border border-neutral-800 space-y-2 mt-2">
                <div className="text-[11px] font-semibold text-neutral-300">Add New Field</div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Field Name (e.g. Clearance)"
                    value={newFieldLabel}
                    onChange={(e) => setNewFieldLabel(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Secret)"
                    value={newFieldValue}
                    onChange={(e) => setNewFieldValue(e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-neutral-950 border border-neutral-800 text-xs text-white outline-none"
                  />
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddField(false)}
                    className="px-2.5 py-1 rounded text-[11px] text-neutral-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomField}
                    className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Drawer Bottom Actions */}
        <div className="p-4 border-t border-neutral-800/80 bg-neutral-900/50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSaveSubmit}
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/30 transition-all disabled:opacity-50"
          >
            <LuSave className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
