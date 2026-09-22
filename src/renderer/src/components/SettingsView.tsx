import React, { useState } from 'react'
import { BackButton } from './BackButton'
import { Session } from '@supabase/supabase-js'
import { changePassword, updateUserFullName } from '../supabase_utils'
import { LuCalendar, LuCheck, LuEye, LuEyeOff, LuKeyRound, LuMail, LuShieldCheck, LuUser } from '@/components/icons'

interface SettingsViewProps {
  profileName: string
  setProfileName: (name: string) => void
  profileSaving: boolean
  onSaveProfile: (e: React.FormEvent) => Promise<void> | void
  session?: Session | null
}

export function SettingsView({
  profileName,
  setProfileName,
  profileSaving,
  onSaveProfile,
  session
}: SettingsViewProps): React.JSX.Element {
  const [profileSuccessMsg, setProfileSuccessMsg] = useState<string | null>(null)
  const [profileErrorMsg, setProfileErrorMsg] = useState<string | null>(null)

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [passwordSaving, setPasswordSaving] = useState(false)
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null)
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null)

  const userEmail = session?.user?.email || 'N/A'
  const createdAt = session?.user?.created_at
    ? new Date(session.user.created_at).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : 'N/A'

  // Calculate initials for avatar
  const initials = (profileName.trim() || userEmail.split('@')[0] || 'U')
    .split(' ')
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()

  const handleProfileSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setProfileSuccessMsg(null)
    setProfileErrorMsg(null)

    if (!profileName.trim()) {
      setProfileErrorMsg('Full Name cannot be empty.')
      return
    }

    try {
      if (session?.user?.id) {
        await updateUserFullName(session.user.id, profileName)
      }
      if (onSaveProfile) {
        await onSaveProfile(e)
      }
      setProfileSuccessMsg('Profile information updated successfully!')
      setTimeout(() => setProfileSuccessMsg(null), 4000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update profile.'
      setProfileErrorMsg(msg)
    }
  }

  const handlePasswordSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setPasswordSuccessMsg(null)
    setPasswordErrorMsg(null)

    if (!currentPassword) {
      setPasswordErrorMsg('Please enter your current password.')
      return
    }

    if (newPassword.length < 6) {
      setPasswordErrorMsg('New password must be at least 6 characters long.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('New passwords do not match.')
      return
    }

    setPasswordSaving(true)
    try {
      await changePassword({
        currentPassword,
        newPassword,
        email: userEmail !== 'N/A' ? userEmail : undefined
      })
      setPasswordSuccessMsg('Your password has been changed successfully!')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSuccessMsg(null), 4000)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to update password.'
      setPasswordErrorMsg(msg)
    } finally {
      setPasswordSaving(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-8 bg-neutral-950 overflow-y-auto items-center selection:bg-neutral-800 selection:text-white">
      <div className="w-full max-w-3xl flex flex-col gap-6">
        {/* Page Header */}
        <div className="flex items-center gap-3.5 pb-2 border-b border-neutral-900">
          <BackButton title="Go back to previous page" />
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              Profile Settings
            </h1>
            <p className="text-xs text-neutral-400 mt-0.5">
              Manage your personal identity, account credentials, and security preferences.
            </p>
          </div>
        </div>

        {/* User Identity Overview Card */}
        <div className="bg-neutral-900/40 border border-neutral-800/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center sm:items-start gap-5 shadow-lg backdrop-blur-sm relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-neutral-800 to-neutral-700 border border-neutral-700 flex items-center justify-center text-xl font-bold text-white shadow-inner shrink-0">
            {initials}
          </div>

          <div className="flex-1 flex flex-col items-center sm:items-start text-center sm:text-left gap-1">
            <div className="flex items-center gap-2.5 flex-wrap justify-center sm:justify-start">
              <h2 className="text-base font-semibold text-white">
                {profileName.trim() || userEmail.split('@')[0]}
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center gap-1">
                <LuShieldCheck className="w-3 h-3" />
                Active Account
              </span>
            </div>

            <p className="text-xs text-neutral-400 flex items-center gap-1.5 mt-0.5">
              <LuMail className="w-3.5 h-3.5 text-neutral-500" />
              {userEmail}
            </p>

            <div className="flex items-center gap-4 text-[11px] text-neutral-500 mt-2">
              <span className="flex items-center gap-1.5">
                <LuCalendar className="w-3.5 h-3.5 text-neutral-600" />
                Joined {createdAt}
              </span>
            </div>
          </div>
        </div>

        {/* Edit Profile Information Form */}
        <form
          onSubmit={handleProfileSubmit}
          className="flex flex-col gap-5 bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <LuUser className="w-4 h-4 text-neutral-400" />
                Personal Information
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Your full display name across JobCopilot, resumes, and reports.
              </p>
            </div>
          </div>

          {profileSuccessMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <LuCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{profileSuccessMsg}</span>
            </div>
          )}

          {profileErrorMsg && (
            <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{profileErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                Full Name
              </label>
              <input
                type="text"
                required
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-950 transition-all"
                placeholder="Jane Doe"
              />
            </div>

            {/* Email Address (Read-only) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                  Email Address
                </label>
                <span className="text-[10px] text-neutral-500">Verified</span>
              </div>
              <input
                type="email"
                readOnly
                disabled
                value={userEmail}
                className="w-full bg-neutral-950/40 border border-neutral-850 rounded-xl px-3.5 py-2.5 text-xs text-neutral-400 cursor-not-allowed outline-none select-all"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-neutral-200 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-sm cursor-pointer"
            >
              {profileSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Profile'
              )}
            </button>
          </div>
        </form>

        {/* Change Password / Security Form */}
        <form
          onSubmit={handlePasswordSubmit}
          className="flex flex-col gap-5 bg-neutral-900/30 border border-neutral-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm"
        >
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800/60">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <LuKeyRound className="w-4 h-4 text-neutral-400" />
                Change Password
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Update your account password securely.
              </p>
            </div>
          </div>

          {passwordSuccessMsg && (
            <div className="bg-emerald-950/40 border border-emerald-900/50 rounded-xl p-3 text-xs text-emerald-300 flex items-center gap-2">
              <LuCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{passwordSuccessMsg}</span>
            </div>
          )}

          {passwordErrorMsg && (
            <div className="bg-red-950/40 border border-red-900/50 rounded-xl p-3 text-xs text-red-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
              <span>{passwordErrorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Current Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-950 transition-all"
                  placeholder="Current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs p-1"
                  aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                >
                  {showCurrentPassword ? (
                    <LuEyeOff className="w-4 h-4" />
                  ) : (
                    <LuEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-950 transition-all"
                  placeholder="Min. 6 characters"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs p-1"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? (
                    <LuEyeOff className="w-4 h-4" />
                  ) : (
                    <LuEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-semibold text-neutral-400 tracking-wider uppercase">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-neutral-950/80 border border-neutral-800 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-white placeholder-neutral-500 outline-none focus:border-neutral-600 focus:bg-neutral-950 transition-all"
                  placeholder="Repeat new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-200 text-xs p-1"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? (
                    <LuEyeOff className="w-4 h-4" />
                  ) : (
                    <LuEye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={passwordSaving || !currentPassword || !newPassword}
              className="px-5 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-medium text-xs rounded-xl active:scale-[0.99] transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 border border-neutral-700 cursor-pointer"
            >
              {passwordSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>Updating...</span>
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
