import React, { useState, useMemo, useEffect } from 'react'
import { Resume, ProfileDetails, StructuredResume, ResumeDocument } from '../../types'
import { useNavigation } from '../../navigation/useNavigation'
import { useAppStore } from '../../lib/zustandStore'
import Logger from '@utils/logger'
import {
  getUserResumes,
  insertResume,
  updateResume,
  deleteResume
} from '../../supabase_utils/resumes'
import {
  getUserTailoredResumes,
  updateTailoredResume,
  deleteTailoredResume
} from '../../supabase_utils/tailoredResumes'
import { getActiveKey } from '../../utils/apiUsageService'
import { supabase } from '../../lib/supabase'
import { ResumeStructuredParser } from '../../utils/ResumeStructuredParser'
import { ResumeLibrary } from './library/ResumeLibrary'
import { ResumeWorkspace } from './workspace/ResumeWorkspace'
import { UploadResumeModal } from './modals/UploadResumeModal'
import { DeleteResumeModal } from './modals/DeleteResumeModal'
import { RenameResumeModal } from './modals/RenameResumeModal'

interface ResumePageProps {
  initialSelectedResumeName?: string
}

function mapStructuredToProfile(
  structuredData?: StructuredResume | Record<string, any>
): ProfileDetails {
  const s = (structuredData || {}) as StructuredResume
  const customFields: { id: string; label: string; value: string }[] = []

  const standardKeys = [
    'firstName',
    'lastName',
    'email',
    'phone',
    'location',
    'linkedin',
    'github',
    'portfolio',
    'summary',
    'skills',
    'experience',
    'education',
    'projects',
    'certifications',
    'awards',
    'languages',
    'publications'
  ]

  Object.keys(s).forEach((key) => {
    if (!standardKeys.includes(key) && s[key]) {
      const val = s[key]
      customFields.push({
        id: `cf-${key}`,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        value: typeof val === 'object' ? JSON.stringify(val) : String(val)
      })
    }
  })

  return {
    firstName: s.firstName || '',
    lastName: s.lastName || '',
    email: s.email || '',
    phone: s.phone || '',
    location: s.location || '',
    linkedin: s.linkedin || '',
    github: s.github || '',
    portfolio: s.portfolio || '',
    customFields
  }
}

export function ResumePage({
  initialSelectedResumeName
}: ResumePageProps): React.JSX.Element {
  const { currentRoute, goToResume, goToResumes } = useNavigation()
  const {
    resumes: storeResumes,
    setResumes: setStoreResumes,
    setSelectedResumeName,
    setCurrentResume,
    userId
  } = useAppStore()

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [resumeToDelete, setResumeToDelete] = useState<Resume | null>(null)
  const [resumeToRename, setRenameTargetResume] = useState<Resume | null>(null)

  // Fetch resumes from Supabase on mount / when userId is available
  const fetchAllResumes = async () => {
    if (!userId) return
    try {
      const [baseRows, tailoredRows] = await Promise.all([
        getUserResumes(userId),
        getUserTailoredResumes(userId)
      ])

      const mappedBases: Resume[] = baseRows.map((r) => {
        const sData = (r.structured_data || {}) as StructuredResume
        return {
          id: r.id,
          name: r.name || 'Untitled Resume',
          fileName: r.file_name || undefined,
          fileSize: r.file_size
            ? `${(Number(r.file_size) / 1024).toFixed(1)} KB`
            : undefined,
          rawResumeData: r.raw_resume_data || undefined,
          uploadedData: r.raw_resume_data || undefined,
          structuredData: sData,
          createdAt: r.created_at,
          updatedAt: r.updated_at,
          profileDetails: mapStructuredToProfile(sData)
        }
      })

      const mappedTailored: Resume[] = tailoredRows.map((t) => {
        const sData = (t.structured_output || {}) as StructuredResume
        return {
          id: t.id,
          name: t.name,
          parentResumeId: t.resume_id,
          targetJobId: t.job_id,
          rawResumeData: t.raw_tailored_resume_data || undefined,
          uploadedData: t.raw_tailored_resume_data || undefined,
          structuredData: sData,
          createdAt: t.created_at,
          updatedAt: t.updated_at,
          tailoringMetadata: (t.tailored_based_on as any) || undefined,
          profileDetails: mapStructuredToProfile(sData)
        }
      })

      const allResumes = [...mappedBases, ...mappedTailored]
      setStoreResumes(allResumes)
    } catch (err) {
      Logger.error('ResumePage.tsx', 'fetchAllResumes', 'Error fetching resumes in ResumePage', err)
    }
  }

  useEffect(() => {
    fetchAllResumes()
  }, [userId])

  const displayResumes: Resume[] = useMemo(() => {
    return storeResumes || []
  }, [storeResumes])

  // Determine active opened resume if in workspace mode
  const activeResumeName =
    currentRoute.type === 'resume'
      ? currentRoute.resumeName
      : initialSelectedResumeName || null

  const activeResume = useMemo(() => {
    if (!activeResumeName) return null
    return (
      displayResumes.find(
        (r) => r.name.toLowerCase() === activeResumeName.toLowerCase()
      ) ||
      displayResumes[0] ||
      null
    )
  }, [activeResumeName, displayResumes])

  // Find parent resume if active resume is tailored
  const parentResumeOfActive = useMemo(() => {
    if (!activeResume || !activeResume.parentResumeId) return undefined
    return displayResumes.find((r) => r.id === activeResume.parentResumeId)
  }, [activeResume, displayResumes])

  // Handlers
  const handleOpenResume = (resume: Resume) => {
    setSelectedResumeName(resume.name)
    setCurrentResume(resume)
    goToResume(resume.name)
  }

  const handleBackToLibrary = () => {
    goToResumes()
  }

  const handleUploadFile = async (
    file: File,
    customName?: string,
    onProgress?: (status: string) => void
  ) => {
    const resumeName =
      customName || file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ')

    // Step 1: Extract text from file bytes
    onProgress?.('Extracting text from document...')
    let parsedText = ''
    try {
      if (file.name.toLowerCase().endsWith('.pdf') && window.api?.parseResumeBytes) {
        const arrayBuffer = await file.arrayBuffer()
        const uint8Array = new Uint8Array(arrayBuffer)
        parsedText = await window.api.parseResumeBytes(uint8Array, file.name)
      } else {
        parsedText = await file.text()
      }
    } catch (err) {
      Logger.warn('ResumePage.tsx', 'handleUploadFile', 'Could not parse bytes with pdf-parse, fallback to basic text', err)
      parsedText = `Uploaded document: ${file.name}\nSize: ${(file.size / 1024).toFixed(1)} KB`
    }

    // Step 2: OpenAI structured parsing
    // Resolve effective user ID
    let targetUserId = userId
    if (!targetUserId && supabase) {
      try {
        const { data: authData } = await supabase.auth.getUser()
        targetUserId = authData?.user?.id || null
        if (targetUserId) {
          useAppStore.getState().setUserId(targetUserId)
        }
      } catch (authErr) {
        Logger.warn('ResumePage.tsx', 'handleUploadFile', 'Could not resolve user from supabase.auth.getUser()', authErr)
      }
    }

    // Step 2: OpenAI structured parsing
    onProgress?.('Structuring resume with OpenAI...')
    let structuredData: ResumeDocument | StructuredResume = {} as any
    let keyRecord: any = null
    if (supabase && targetUserId) {
      try {
        keyRecord = await getActiveKey(supabase, targetUserId)
      } catch (keyErr) {
        Logger.warn('ResumePage.tsx', 'handleUploadFile', 'Could not get active key', keyErr)
      }
    }

    try {
      if (keyRecord?.encrypted_key) {
        structuredData = await ResumeStructuredParser.parseRawResume(
          parsedText,
          keyRecord.encrypted_key,
          targetUserId || undefined
        )
      } else {
        Logger.warn('ResumePage.tsx', 'handleUploadFile', 'No active OpenAI key connected. Saving raw text with basic structure.')
        structuredData = await ResumeStructuredParser.parseRawResume(parsedText)
      }
    } catch (aiErr) {
      Logger.error('ResumePage.tsx', 'handleUploadFile', 'Failed to structure resume with OpenAI, falling back to basic structure', aiErr)
      structuredData = await ResumeStructuredParser.parseRawResume(parsedText)
    }

    // Guarantee structuredData is valid ResumeDocument
    if (!structuredData || Object.keys(structuredData).length === 0) {
      structuredData = await ResumeStructuredParser.parseRawResume(parsedText)
    }

    // Step 3: Save to Supabase DB (public.resumes)
    onProgress?.('Saving to Supabase database...')
    let createdId = `resume-${Date.now()}`

    if (targetUserId) {
      try {
        const insertedRow = await insertResume({
          user_id: targetUserId,
          name: resumeName,
          file_name: file.name,
          file_size: file.size,
          raw_resume_data: parsedText,
          structured_data: structuredData as any
        })
        if (insertedRow?.id) {
          createdId = insertedRow.id
        }
      } catch (dbErr) {
        Logger.error('ResumePage.tsx', 'handleUploadFile', 'Failed to persist uploaded resume to Supabase', dbErr)
        throw new Error(
          'Failed to save resume into database: ' +
            (dbErr instanceof Error ? dbErr.message : String(dbErr))
        )
      }
    }

    // Step 4: Persist structured JSON to local storage/resumes/${createdId}.json
    if (window.api?.saveParsedResume) {
      try {
        const saveRes = await window.api.saveParsedResume(createdId, structuredData)
        Logger.info('ResumePage.tsx', 'handleUploadFile', `Saved parsed resume JSON to storage/resumes/${createdId}.json`, saveRes)
      } catch (saveErr) {
        Logger.error('ResumePage.tsx', 'handleUploadFile', 'Failed to save parsed resume JSON to storage', saveErr)
      }
    } else {
      Logger.warn(
        'ResumePage.tsx',
        'handleUploadFile',
        'window.api.saveParsedResume is NOT defined! The Electron app must be restarted to load the new preload script.'
      )
    }

    const newResume: Resume = {
      id: createdId,
      name: resumeName,
      fileName: file.name,
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      rawResumeData: parsedText,
      uploadedData: parsedText,
      structuredData,
      profileDetails: mapStructuredToProfile(structuredData)
    }

    const updated = [newResume, ...storeResumes]
    setStoreResumes(updated)
    setSelectedResumeName(newResume.name)
    setCurrentResume(newResume)
    goToResume(newResume.name)
  }

  const handleSaveDetails = async (updatedResume: Resume) => {
    const updated = displayResumes.map((r) =>
      (r.id && r.id === updatedResume.id) || r.name === updatedResume.name
        ? updatedResume
        : r
    )
    setStoreResumes(updated)
    setCurrentResume(updatedResume)

    if (updatedResume.id) {
      try {
        if (updatedResume.parentResumeId) {
          await updateTailoredResume(updatedResume.id, {
            name: updatedResume.name,
            raw_tailored_resume_data:
              updatedResume.rawResumeData || updatedResume.uploadedData,
            structured_output: (updatedResume.structuredData || {}) as any
          })
        } else {
          await updateResume(updatedResume.id, {
            name: updatedResume.name,
            raw_resume_data:
              updatedResume.rawResumeData || updatedResume.uploadedData,
            structured_data: (updatedResume.structuredData || {}) as any
          })
        }
      } catch (err) {
        Logger.error('ResumePage.tsx', 'handleSaveEditResume', 'Error updating resume in Supabase', err)
      }
    }
  }

  const handleRenameConfirm = async (resume: Resume, newName: string) => {
    const updated = displayResumes.map((r) =>
      r === resume || (r.id && r.id === resume.id) || r.name === resume.name
        ? { ...r, name: newName }
        : r
    )
    setStoreResumes(updated)

    if (currentRoute.type === 'resume' && currentRoute.resumeName === resume.name) {
      goToResume(newName)
    }

    if (resume.id) {
      try {
        if (resume.parentResumeId) {
          await updateTailoredResume(resume.id, { name: newName })
        } else {
          await updateResume(resume.id, { name: newName })
        }
      } catch (err) {
        Logger.error('ResumePage.tsx', 'handleRenameConfirm', 'Error renaming resume in Supabase', err)
      }
    }
  }

  const handleDeleteConfirm = async (resume: Resume) => {
    // If base resume, also remove child tailored resumes
    const updated = displayResumes.filter((r) => {
      if (r === resume || (r.id && r.id === resume.id) || r.name === resume.name) {
        return false
      }
      if (!resume.parentResumeId && r.parentResumeId === resume.id) {
        return false
      }
      return true
    })

    setStoreResumes(updated)

    if (currentRoute.type === 'resume' && currentRoute.resumeName === resume.name) {
      goToResumes()
    }

    if (resume.id) {
      try {
        if (resume.parentResumeId) {
          await deleteTailoredResume(resume.id)
        } else {
          await deleteResume(resume.id)
        }
      } catch (err) {
        Logger.error('ResumePage.tsx', 'handleDeleteConfirm', 'Error deleting resume in Supabase', err)
      }
    }
  }

  // Calculate child count for delete modal warning
  const deleteChildCount = useMemo(() => {
    if (!resumeToDelete || resumeToDelete.parentResumeId) return 0
    return displayResumes.filter(
      (r) =>
        r.parentResumeId === resumeToDelete.id ||
        r.name.toLowerCase().includes(resumeToDelete.name.toLowerCase())
    ).length
  }, [resumeToDelete, displayResumes])

  return (
    <div className="flex-1 flex flex-col h-full min-h-0 bg-[var(--bg-app)] text-[var(--text-main)] overflow-hidden select-none transition-colors duration-200">
      {/* Either Library View or Workspace View */}
      {currentRoute.type === 'resume' && activeResume ? (
        <ResumeWorkspace
          resume={activeResume}
          parentResume={parentResumeOfActive}
          onBack={handleBackToLibrary}
          onRename={(r) => setRenameTargetResume(r)}
          onDelete={(r) => setResumeToDelete(r)}
          onSaveDetails={handleSaveDetails}
        />
      ) : (
        <ResumeLibrary
          resumes={displayResumes}
          onOpenResume={handleOpenResume}
          onCompareResume={(r) => handleOpenResume(r)}
          onRenameResume={(r) => setRenameTargetResume(r)}
          onDeleteResume={(r) => setResumeToDelete(r)}
          onOpenUploadModal={() => setIsUploadModalOpen(true)}
        />
      )}

      {/* Upload Modal */}
      <UploadResumeModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUploadFile={handleUploadFile}
      />

      {/* Delete Confirmation Modal */}
      <DeleteResumeModal
        isOpen={!!resumeToDelete}
        resume={resumeToDelete}
        childCount={deleteChildCount}
        onClose={() => setResumeToDelete(null)}
        onConfirmDelete={handleDeleteConfirm}
      />

      {/* Rename Modal */}
      <RenameResumeModal
        isOpen={!!resumeToRename}
        resume={resumeToRename}
        onClose={() => setRenameTargetResume(null)}
        onConfirmRename={handleRenameConfirm}
      />
    </div>
  )
}
