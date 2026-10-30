import React from 'react'

type Props = {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <section className="admin-page-header">
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="admin-page-header__actions">{action}</div>}
    </section>
  )
}
