'use client'
import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { 
  Info, 
  MapPin, 
  Phone, 
  Globe, 
  Clock, 
  ArrowUpDown,
  StarsIcon
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface StationInfo {
  station_id: string
  station_uid: string
  station_name: string
  station_name_en: string
  longitude: number
  latitude: number
  address: string
  phone: string
  station_class: string
  url: string
}

interface StationExit {
  id: string
  exit_name: string
  longitude: number
  latitude: number
  location: string
  has_stair: boolean
  has_escalator: number
  has_elevator: boolean
}

interface StationInfoCardProps {
  stationId: string
}

export default function StationInfoCard({ stationId }: StationInfoCardProps) {
  const [stationInfo, setStationInfo] = useState<StationInfo | null>(null)
  const [exits, setExits] = useState<StationExit[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchStationData = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // 獲取車站基本資料
        const { data: stationData, error: stationError } = await supabase
          .from('train_station_details')
          .select('*')
          .eq('station_id', stationId)
          .single()

        if (stationError) throw stationError

        // 獲取車站出口資料
        const { data: exitData, error: exitError } = await supabase
          .from('train_station_exits')
          .select('*')
          .eq('station_id', stationId)
          .order('exit_name')

        if (exitError) throw exitError

        setStationInfo(stationData)
        setExits(exitData)
      } catch (err) {
        console.error('Error fetching station info:', err)
        setError('無法取得車站資訊')
      } finally {
        setIsLoading(false)
      }
    }

    if (stationId) {
      fetchStationData()
    }
  }, [stationId])

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3"></div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-4xl">
      <div className="p-6">
        {error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : stationInfo ? (
          <div className="space-y-6">
            {/* 基本資訊 */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Info className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold">基本資訊</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div>
                    <div className="text-gray-500 mb-1">車站名稱</div>
                    <div className="text-lg">{stationInfo.station_name}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">英文名稱</div>
                    <div>{stationInfo.station_name_en}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1">車站等級</div>
                    <div>{stationInfo.station_class}</div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center">
                      <MapPin className="w-4 h-4 mr-1" />
                      地址
                    </div>
                    <div>{stationInfo.address}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center">
                      <Phone className="w-4 h-4 mr-1" />
                      電話
                    </div>
                    <div>{stationInfo.phone}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 mb-1 flex items-center">
                      <Globe className="w-4 h-4 mr-1" />
                      網站
                    </div>
                    <a 
                      href={stationInfo.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {stationInfo.url}
                    </a>
                  </div>
                </div>
              </div>
            </Card>

            {/* 出口資訊 */}
            <Card className="p-6">
              <div className="flex items-center space-x-2 mb-6">
                <Clock className="w-6 h-6 text-blue-500" />
                <h2 className="text-xl font-bold">出口資訊</h2>
              </div>
              <div className="space-y-4">
                {exits.map((exit) => (
                  <div 
                    key={exit.id}
                    className="bg-gray-50 p-4 rounded-lg space-y-2"
                  >
                    <div className="font-medium text-lg">{exit.exit_name}</div>
                    <div className="text-gray-600">{exit.location}</div>
                    <div className="flex gap-4 mt-2">
                      {exit.has_stair && (
                        <div className="flex items-center text-gray-600">
                          <StarsIcon className="w-4 h-4 mr-1" />
                          樓梯
                        </div>
                      )}
                      {exit.has_escalator > 0 && (
                        <div className="flex items-center text-gray-600">
                          <ArrowUpDown className="w-4 h-4 mr-1" />
                          電扶梯
                        </div>
                      )}
                      {exit.has_elevator && (
                        <div className="flex items-center text-gray-600">
                          <ArrowUpDown className="w-4 h-4 mr-1" />
                          電梯
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        ) : (
          <div className="text-center py-8">請選擇車站</div>
        )}
      </div>
    </Card>
  )
} 