'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Search } from 'lucide-react'
import StationSearch from './StationSearch'
import TrainNoSearch from './TrainNoSearch'

interface SearchState {
  station: {
    date?: Date
    startStation?: string
    endStation?: string
    startStationInput?: string
    endStationInput?: string
    schedules?: any[]
  }
  trainNo: {
    trainNo?: string
    trainData?: any
  }
}

export default function SearchCard() {
  const [activeTab, setActiveTab] = useState('station')
  const [searchState, setSearchState] = useState<SearchState>({
    station: {},
    trainNo: {}
  })

  useEffect(() => {
    // 檢查是否有之前的查詢結果
    const previousData = localStorage.getItem('previousTrainData')
    if (previousData) {
      try {
        const { activeTab: savedTab, trainData, trainNo } = JSON.parse(previousData)
        if (savedTab) {
          setActiveTab(savedTab)
          if (savedTab === 'trainNo') {
            setSearchState(prev => ({
              ...prev,
              trainNo: { trainNo, trainData }
            }))
          }
        }
      } catch (error) {
        console.error('Error parsing previousTrainData:', error)
      }
    }

    // 檢查是否有車站搜尋的結果
    const restoreSearch = localStorage.getItem('restoreStationSearch')
    if (restoreSearch) {
      try {
        const savedStationData = JSON.parse(restoreSearch)
        setSearchState(prev => ({
          ...prev,
          station: savedStationData
        }))
        setActiveTab('station')
        localStorage.removeItem('restoreStationSearch')
      } catch (error) {
        console.error('Error parsing restoreStationSearch:', error)
      }
    }
  }, [])

  // 處理搜尋結果的更新
  const handleSearchResult = (type: 'station' | 'trainNo', data: any) => {
    setSearchState(prev => ({
      ...prev,
      [type]: data
    }))
  }

  // 處理 tab 切換
  const handleTabChange = (tab: string) => {
    // 保存當前 tab 的狀態到 localStorage
    if (activeTab === 'trainNo' && searchState.trainNo.trainData) {
      localStorage.setItem('previousTrainData', JSON.stringify({
        ...searchState.trainNo,
        activeTab: 'trainNo'
      }))
    } else if (activeTab === 'station' && searchState.station.schedules) {
      localStorage.setItem('previousStationSearch', JSON.stringify({
        ...searchState.station,
        activeTab: 'station'
      }))
    }
    
    setActiveTab(tab)
  }

  return (
    <Card className="w-[95%] max-w-[1200px] shadow-lg bg-white">
      <div className="flex items-center justify-center p-4 border-b">
        <Search className="w-5 h-5 mr-2" />
        <h1 className="text-lg font-medium">編組運用查詢</h1>
      </div>

      <div className="flex border-b">
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === 'station'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => handleTabChange('station')}
        >
          依時刻
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            activeTab === 'trainNo'
              ? 'text-blue-500 border-b-2 border-blue-500'
              : 'text-gray-500'
          }`}
          onClick={() => handleTabChange('trainNo')}
        >
          依車次
        </button>
      </div>

      <div className="bg-white">
        {activeTab === 'station' && (
          <StationSearch 
            initialState={searchState.station}
            onSearchResult={(data) => handleSearchResult('station', data)}
          />
        )}
        {activeTab === 'trainNo' && (
          <TrainNoSearch 
            initialState={searchState.trainNo}
            onSearchResult={(data) => handleSearchResult('trainNo', data)}
          />
        )}
      </div>
    </Card>
  )
} 