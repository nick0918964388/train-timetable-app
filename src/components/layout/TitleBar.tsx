'use client'
import { Database } from 'lucide-react'

export default function TitleBar() {
  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-blue-500" />
            <span className="ml-2 text-lg font-medium">台鐵時刻查詢系統</span>
          </div>
        </div>
      </div>
    </div>
  )
} 