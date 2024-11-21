'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import StationSearch from './StationSearch'
import TrainNoSearch from './TrainNoSearch'

export default function SearchCard() {
  const [activeTab, setActiveTab] = useState('station')

  return (
    <Card className="w-[95%] max-w-[1200px] shadow-lg bg-white">
      {/* 標題列 */}
      <div className="flex items-center justify-center p-4 border-b">
        <Search className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-medium">台鐵火車時刻表查詢</h1>
      </div>

      {/* 分頁標籤 */}
      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === 'station'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('station')}
        >
          依時刻
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === 'trainNo'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => setActiveTab('trainNo')}
        >
          依車次
        </button>
      </div>

      {/* 搜尋內容 */}
      <div className="bg-white">
        {activeTab === 'station' && <StationSearch />}
        {activeTab === 'trainNo' && <TrainNoSearch />}
      </div>
    </Card>
  )
} 