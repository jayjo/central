'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Kbd } from '@/components/ui/kbd'
import { CheckSquare, Calendar, Settings, Plus } from 'lucide-react'

interface OnboardingModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0)

  const steps = [
    {
      title: 'Welcome to Nuclio',
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Nuclio helps you manage your todo lists and stay organized.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckSquare className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Manage Your Todos</h3>
                <p className="text-sm text-muted-foreground">
                  Create, organize, and track your tasks with due dates, priorities, and status updates.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <Calendar className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">Calendar View</h3>
                <p className="text-sm text-muted-foreground">
                  Visualize your todos on a calendar with month, week, and day views.
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Share with Your Team',
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Nuclio makes it easy to share todo lists with important people who might have similar tasks.
          </p>
          <div className="space-y-3">
            <div className="p-4 bg-accent rounded-lg">
              <h3 className="font-semibold mb-2">Organization Sharing</h3>
              <p className="text-sm text-muted-foreground mb-3">
                When you create a shared todo, everyone in your organization can see and collaborate on it.
              </p>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li>• Create todos visible to your entire team</li>
                <li>• Share specific todos with selected members</li>
                <li>• Collaborate with comments and updates</li>
              </ul>
            </div>
            <p className="text-sm text-muted-foreground">
              You can invite team members and manage your organization in Settings.
            </p>
          </div>
        </div>
      ),
    },
    {
      title: 'Keyboard Shortcuts',
      content: (
        <div className="space-y-4">
          <p className="text-lg">
            Nuclio has powerful keyboard shortcuts to help you work faster.
          </p>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Create New Todo</span>
              </div>
              <Kbd>
                <span>N</span>
              </Kbd>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <CheckSquare className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Open Todos Menu</span>
              </div>
              <Kbd>
                <span>T</span>
              </Kbd>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Go to Calendar</span>
              </div>
              <Kbd>
                <span>C</span>
              </Kbd>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-md">
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Go to Settings</span>
              </div>
              <Kbd>
                <span>S</span>
              </Kbd>
            </div>
            <div className="mt-4 p-3 bg-accent rounded-md">
              <p className="text-sm font-medium mb-2">Calendar View Shortcuts</p>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Month view</span>
                  <Kbd><span>M</span></Kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Week view</span>
                  <Kbd><span>W</span></Kbd>
                </div>
                <div className="flex items-center justify-between">
                  <span>Day view</span>
                  <Kbd><span>D</span></Kbd>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleFinish()
    }
  }

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleFinish = () => {
    // Mark onboarding as completed in localStorage
    localStorage.setItem('nuclio-onboarding-completed', 'true')
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleFinish()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" onInteractOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-2xl">{steps[currentStep].title}</DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          {steps[currentStep].content}
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-colors ${
                  index === currentStep
                    ? 'bg-primary'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          
          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button variant="outline" onClick={handlePrevious}>
                Previous
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button variant="ghost" onClick={handleFinish}>
                Skip
              </Button>
            )}
            <Button onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
