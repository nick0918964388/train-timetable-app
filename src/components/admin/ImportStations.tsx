'use client'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Database } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImportLine {
  id: string;
  name: string;
}

interface ImportStationsProps {
  onClose?: () => void;
}

export default function ImportStations({ onClose }: ImportStationsProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [totalStations, setTotalStations] = useState(0)
  const [message, setMessage] = useState('')

  // 解析環境變數中的路線資料
  const importLines: ImportLine[] = (process.env.NEXT_PUBLIC_IMPORT_LINES || '')
    .split(',')
    .filter(Boolean)
    .map(line => {
      const [id, name] = line.split(':')
      return { id: id.trim(), name: name.trim() }
    })

  // 匯入車站詳細資料
  const importStationDetails = async (stationId: string) => {
    try {
      const response = await fetch('/api/import-station-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: stationId }),
      })

      if (!response.ok) {
        throw new Error('Failed to import station details')
      }

      return await response.json()
    } catch (error) {
      console.error(`匯入車站 ${stationId} 詳細資料失敗:`, error)
      throw error
    }
  }

  // 整合的匯入功能
  const handleImport = async () => {
    if (importLines.length === 0) {
      setMessage('沒有設定要匯入的路線')
      return
    }

    try {
      setIsLoading(true)
      setCurrentIndex(0)

      // 第一步：匯入所有路線和基本車站資料
      for (let i = 0; i < importLines.length; i++) {
        const line = importLines[i]
        setMessage(`正在匯入路線 ${line.name} (${line.id})...`)
        
        const response = await fetch('/api/import-stations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id: line.id }),
        })

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
      }

      // 第二步：獲取所有車站並匯入詳細資料
      setMessage('正在獲取車站列表...')
      const { data: stations, error } = await supabase
        .from('train_stations')
        .select('station_id, station_name')
        .order('station_id')

      if (error) throw error

      setTotalStations(stations.length)
      setMessage(`開始匯入 ${stations.length} 個車站的詳細資料`)

      // 依序匯入每個車站的詳細資料
      for (let i = 0; i < stations.length; i++) {
        const station = stations[i]
        setCurrentIndex(i)
        setMessage(`正在匯入 ${station.station_name} (${station.station_id}) - ${i + 1}/${stations.length}`)

        await importStationDetails(station.station_id)
        
        if (i === stations.length - 1) {
          setMessage('全部資料匯入完成')
        } else {
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }

    } catch (error) {
      setMessage(`匯入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
      setCurrentIndex(0)
    }
  }

  return (
    <div className="space-y-4">
      {/* 進度和消息顯示 */}
      {message && (
        <div className={`text-sm p-2 rounded ${
          message.includes('失敗') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          {message}
        </div>
      )}
      
      {/* 匯入按鈕 */}
      <Button
        onClick={handleImport}
        disabled={isLoading}
        variant="outline"
        className="w-full flex items-center justify-center space-x-2"
      >
        <Database className="h-4 w-4" />
        <span>
          {isLoading 
            ? `資料匯入中 (${currentIndex + 1}/${totalStations})` 
            : '匯入資料'}
        </span>
      </Button>

      {/* 匯入進度顯示 */}
      {isLoading && totalStations > 0 && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex + 1) / totalStations * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-2 text-center">
            {`進度：${currentIndex + 1} / ${totalStations}`}
          </div>
        </div>
      )}
    </div>
  )
} 