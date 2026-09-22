import React, { useState } from 'react'
import { Portal } from '../../types'
import { LuBuilding2, LuCompass, LuGlobe, LuLayers, LuSparkles } from '@/components/icons'

interface PortalIconProps {
  portal: Portal
  className?: string
}

export function PortalIcon({ portal, className = 'w-8 h-8' }: PortalIconProps): React.JSX.Element {
  const [imageError, setImageError] = useState(false)
  const id = portal.id.toLowerCase()

  if (portal.logo && !imageError) {
    return (
      <img
        src={portal.logo}
        alt={`${portal.label} logo`}
        onError={() => setImageError(true)}
        className={`${className} object-contain rounded-full`}
      />
    )
  }

  // Minimal monochrome outline icons fallback
  if (id === 'linkedin') {
    return <LuGlobe className={className} />
  }
  if (id === 'greenhouse') {
    return <LuBuilding2 className={className} />
  }
  if (id === 'naukri') {
    return <LuCompass className={className} />
  }
  if (id === 'wellfound' || id === 'angellist') {
    return <LuSparkles className={className} />
  }
  if (id === 'yc') {
    return <LuLayers className={className} />
  }

  return <LuGlobe className={className} />
}

