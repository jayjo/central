'use client'

import { useEffect, useState } from 'react'
import { OnboardingModal } from './OnboardingModal'

interface OnboardingProviderProps {
  children: React.ReactNode
  userCreatedAt?: Date | string | null
}

export function OnboardingProvider({ children, userCreatedAt }: OnboardingProviderProps) {
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    // Check if user has already completed onboarding
    const hasCompletedOnboarding = localStorage.getItem('nuclio-onboarding-completed')
    
    if (hasCompletedOnboarding) {
      return
    }

    // Check if user was created recently (within last 5 minutes)
    // This helps detect new signups
    if (userCreatedAt) {
      const createdAt = new Date(userCreatedAt)
      const now = new Date()
      const minutesSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60)
      
      // Show onboarding if user was created in the last 5 minutes
      // This catches new signups while avoiding showing it to existing users
      if (minutesSinceCreation < 5) {
        setShowOnboarding(true)
      }
    } else {
      // If we don't have createdAt, check if this is the first time visiting
      // (no onboarding completion flag and no other indicators)
      const isFirstVisit = !localStorage.getItem('nuclio-has-visited')
      if (isFirstVisit) {
        localStorage.setItem('nuclio-has-visited', 'true')
        // Show onboarding after a short delay to ensure page is loaded
        setTimeout(() => {
          setShowOnboarding(true)
        }, 1000)
      }
    }
  }, [userCreatedAt])

  return (
    <>
      {children}
      <OnboardingModal 
        isOpen={showOnboarding} 
        onClose={() => setShowOnboarding(false)} 
      />
    </>
  )
}
