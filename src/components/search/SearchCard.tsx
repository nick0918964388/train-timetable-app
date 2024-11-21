'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import StationSearch from './StationSearch'
import TrainNoSearch from './TrainNoSearch'

export default function SearchCard() {
  const [activeTab, setActiveTab] = useState('station')

  useEffect(() => {
    // 檢查是否有之前的查詢結果
    const previousData = localStorage.getItem('previousTrainData')
    if (previousData) {
      try {
        const { activeTab: savedTab } = JSON.parse(previousData)
        if (savedTab) {
          setActiveTab(savedTab)
        }
      } catch (error) {
        console.error('Error parsing previousTrainData:', error)
      }
    }
  }, [])

  return (
    <Card className="w-[95%] max-w-[1200px] shadow-lg bg-white">
      <div className="flex items-center justify-center p-4 border-b">
        <Search className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-medium">台鐵火車時刻表查詢</h1>
      </div>

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

      <div className="bg-white">
        {activeTab === 'station' && <StationSearch />}
        {activeTab === 'trainNo' && <TrainNoSearch hasPreviousData={true} />}
      </div>
    </Card>
  )
} 