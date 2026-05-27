// SPDX-License-Identifier: GPL-3.0-or-later

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/profile-forms/ProfileForm'
import {
  CATEGORIES,
  helpersForCategory,
  type CategoryDescriptor,
  type HelperDescriptor,
} from '@/lib/helper-catalog'
import { cn } from '@/lib/utils'
import type {
  CiderDeckProfile,
  HelperCategory,
  HelperId,
} from '@/types/Profile'

interface AddProfileWizardProps {
  onCreate: (profile: CiderDeckProfile) => void
  onCancel: () => void
}

type WizardStep = 'category' | 'helper' | 'form'

export function AddProfileWizard({
  onCreate,
  onCancel,
}: AddProfileWizardProps) {
  const [step, setStep] = useState<WizardStep>('category')
  const [category, setCategory] = useState<HelperCategory>()
  const [helper, setHelper] = useState<HelperId>()

  const handlePickCategory = (next: CategoryDescriptor) => {
    setCategory(next.id)
    setHelper(undefined)
    setStep('helper')
  }

  const handlePickHelper = (next: HelperDescriptor) => {
    setHelper(next.id)
    setStep('form')
  }

  const handleBack = () => {
    if (step === 'form') setStep('helper')
    else if (step === 'helper') setStep('category')
    else onCancel()
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-3">
          <span className="tracking-tight">Add Profile</span>
          <span className="flex gap-1.5">
            {[1, 2, 3].map(n => (
              <span
                key={n}
                className={cn(
                  'h-1.5 w-1.5 rounded-full transition-colors duration-200',
                  n === (step === 'category' ? 1 : step === 'helper' ? 2 : 3)
                    ? 'bg-primary w-4'
                    : 'bg-muted-foreground/20'
                )}
              />
            ))}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {step === 'category' ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Pick what kind of helper this profile is for.
            </p>
            {CATEGORIES.map(cat => (
              <button
                type="button"
                key={cat.id}
                className="rounded-xl border bg-card p-3 text-start shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-primary hover:bg-primary/5 hover:shadow-md"
                onClick={() => handlePickCategory(cat)}
              >
                <p className="font-medium tracking-tight">{cat.label}</p>
                <p className="text-sm text-muted-foreground">{cat.blurb}</p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 'helper' && category ? (
          <div className="grid gap-2">
            <p className="text-sm text-muted-foreground">
              Choose a helper. Pick &ldquo;Custom&rdquo; if your tool
              isn&rsquo;t listed yet.
            </p>
            {helpersForCategory(category).map(helperOption => (
              <button
                type="button"
                key={helperOption.id}
                className="rounded-xl border bg-card p-3 text-start shadow-sm transition-all duration-150 hover:-translate-y-px hover:border-primary hover:bg-primary/5 hover:shadow-md"
                onClick={() => handlePickHelper(helperOption)}
              >
                <p className="font-medium tracking-tight">
                  {helperOption.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {helperOption.blurb}
                </p>
              </button>
            ))}
          </div>
        ) : null}

        {step === 'form' && helper && category ? (
          <ProfileForm
            helper={helper}
            category={category}
            onSubmit={onCreate}
            onCancel={onCancel}
            submitLabel="Create Profile"
          />
        ) : null}

        <div className="flex justify-between gap-2 pt-2">
          <Button type="button" variant="ghost" onClick={handleBack}>
            {step === 'category' ? 'Cancel' : 'Back'}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
