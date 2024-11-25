'use client'
import { useState } from 'react'
import { Database, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import ImportStations from '@/components/admin/ImportStations'

export default function TitleBar() {
  const [isImportOpen, setIsImportOpen] = useState(false)

  return (
    <div className="bg-white border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Database className="h-6 w-6 text-blue-500" />
            <span className="ml-2 text-lg font-medium">車輛編組運用查詢</span>
          </div>
          
          {/* 匯入功能按鈕 */}
          <div className="relative">
            <Button
              variant="outline"
              className="flex items-center space-x-1"
              onClick={() => setIsImportOpen(!isImportOpen)}
            >
              <span>資料匯入</span>
              {isImportOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>

            {/* 匯入功能展開面板 */}
            {isImportOpen && (
              <div className="absolute right-0 mt-2 w-[480px] bg-white rounded-md shadow-lg z-50 border">
                <div className="p-4">
                  <ImportStations onClose={() => setIsImportOpen(false)} />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* 點擊外部關閉展開面板的遮罩 */}
      {isImportOpen && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setIsImportOpen(false)}
        />
      )}
    </div>
  )
} 