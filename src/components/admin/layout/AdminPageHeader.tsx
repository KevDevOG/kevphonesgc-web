import React from 'react'

type Props = {
  title: string
  subtitle: string
  action?: React.ReactNode
}

export function AdminPageHeader({ title, subtitle, action }: Props) {
  return (
    <section className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-2">
      <div>
        <h2 className="text-[32px] font-extrabold text-[#F7F7F7] mb-1 leading-none" style={{ fontFamily: 'Barlow Condensed, sans-serif' }}>
          {title}
        </h2>
        <p className="text-[16px] text-[#A8A8B0]">{subtitle}</p>
      </div>
      {action && (
        <div className="w-full md:w-auto">
          {action}
        </div>
      )}
    </section>
  )
}
