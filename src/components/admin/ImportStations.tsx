'use client'
import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Upload, Database } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface ImportLine {
  id: string;
  name: string;
}

export default function ImportStations() {
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

  const importSingleLine = useCallback(async (line: ImportLine) => {
    try {
      setMessage(`正在匯入 ${line.name} (${line.id})...`)

      // 先匯入路線和基本車站資料
      const response = await fetch('/api/import-stations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: line.id }),
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error)

      // 取得該路線的所有車站
      const stations = data.stations || []
      
      // 依序匯入每個車站的詳細資料
      for (const station of stations) {
        setMessage(`正在匯入 ${station.StationName} 詳細資料...`)
        await importStationDetails(station.StationID)
      }

      return true
    } catch (error) {
      console.error(`匯入 ${line.name} 失敗:`, error)
      throw error
    }
  }, [])

  const handleImport = async () => {
    if (importLines.length === 0) {
      setMessage('沒有設定要匯入的路線')
      return
    }

    try {
      setIsLoading(true)
      setCurrentIndex(0)

      for (let i = 0; i < importLines.length; i++) {
        const line = importLines[i]
        setCurrentIndex(i)
        
        await importSingleLine(line)
        setMessage(`${line.name} 匯入成功`)
        
        // 最後一個路線匯入完成
        if (i === importLines.length - 1) {
          setMessage('全部路線匯入完成')
          break
        }
        
        // 等待一秒後繼續下一個
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    } catch (error) {
      setMessage(`匯入失敗: ${error instanceof Error ? error.message : '未知錯誤'}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 匯入單一車站詳細資料
  const importStationDetail = async (stationId: string, stationName: string) => {
    try {
      const response = await fetch('/api/import-station-details', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: stationId }),
      })

      if (!response.ok) {
        throw new Error(`Failed to import station ${stationId}`)
      }

      return await response.json()
    } catch (error) {
      console.error(`匯入車站 ${stationName} (${stationId}) 詳細資料失敗:`, error)
      throw error
    }
  }

  // 匯入所有車站詳細資料
  const handleImportAllStationDetails = async () => {
    try {
      setIsLoading(true)
      setMessage('正在獲取車站列表...')

      // 從資料庫獲取所有車站
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

        await importStationDetail(station.station_id, station.station_name)
        
        // 最後一個車站匯入完成
        if (i === stations.length - 1) {
          setMessage('全部車站詳細資料匯入完成')
        } else {
          // 等待一秒後繼續下一個
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
    <div className="absolute top-0 right-0 p-4">
      <div className="flex items-center space-x-4">
        {message && (
          <span className={`text-sm ${
            message.includes('失敗') ? 'text-red-600' : 'text-green-600'
          }`}>
            {message}
          </span>
        )}
        
        <div className="flex space-x-2">
          <Button
            onClick={handleImport}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Upload className="h-4 w-4" />
            <span>
              {isLoading 
                ? `匯入路線中 (${currentIndex + 1}/${importLines.length})` 
                : '匯入路線'}
            </span>
          </Button>

          <Button
            onClick={handleImportAllStationDetails}
            disabled={isLoading}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <Database className="h-4 w-4" />
            <span>
              {isLoading && totalStations > 0
                ? `匯入車站資料中 (${currentIndex + 1}/${totalStations})` 
                : '匯入車站詳細資料'}
            </span>
          </Button>
        </div>
      </div>

      {/* 匯入進度顯示 */}
      {isLoading && totalStations > 0 && (
        <div className="mt-2 bg-white p-2 rounded shadow-lg">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(currentIndex + 1) / totalStations * 100}%` }}
            ></div>
          </div>
          <div className="text-sm text-gray-600 mt-1 text-center">
            {`${currentIndex + 1} / ${totalStations}`}
          </div>
        </div>
      )}
    </div>
  )
} 