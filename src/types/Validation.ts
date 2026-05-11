// SPDX-License-Identifier: GPL-3.0-or-later

export type ValidationSeverity = 'error' | 'warning' | 'info'

export interface ValidationIssue {
  severity: ValidationSeverity
  message: string
}

export interface ValidationResult {
  issues: ValidationIssue[]
  hasErrors: boolean
}
