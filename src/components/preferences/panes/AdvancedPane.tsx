import { useTranslation } from 'react-i18next'

export function AdvancedPane() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-32 items-center justify-center rounded-xl border border-dashed bg-muted/20 p-6 text-center">
      <p className="text-sm text-muted-foreground">
        {t('preferences.advanced.empty')}
      </p>
    </div>
  )
}
