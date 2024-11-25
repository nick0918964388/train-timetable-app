'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { MapPin, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { getStationNameMap } from '@/services/stationService'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

interface TrainIdSearchProps {
  initialState?: {
    trainId?: string;
    trainData?: any;
  };
  onSearchResult?: (data: any) => void;
}

interface TrainOperation {
  date: string;
  trainNo: string;
  startStation: string;
  endStation: string;
  startTime: string;
  endTime: string;
}

// 新增常見車號範例
const EXAMPLE_TRAIN_IDS = [
  { id: 'EMU3160', description: '(太魯閣號)' },
]

export default function TrainIdSearch({ 
  initialState, 
  onSearchResult 
}: TrainIdSearchProps) {
  const [trainId, setTrainId] = useState(initialState?.trainId || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [operations, setOperations] = useState<TrainOperation[]>([])
  const [currentLocation, setCurrentLocation] = useState<string | null>(null)
  const [stationNames, setStationNames] = useState<Record<string, string>>({})
  const router = useRouter()

  useEffect(() => {
    async function loadStationNames() {
      const nameMap = await getStationNameMap()
      setStationNames(nameMap)
    }
    loadStationNames()
  }, [])

  // 在 useEffect 中加入恢復查詢結果的邏輯
  useEffect(() => {
    const restoreSearch = localStorage.getItem('restoreTrainIdSearch')
    if (restoreSearch) {
      try {
        const savedData = JSON.parse(restoreSearch)
        setTrainId(savedData.trainId || '')
        setOperations(savedData.operations || [])
        setCurrentLocation(savedData.currentLocation || null)
        localStorage.removeItem('restoreTrainIdSearch')
      } catch (error) {
        console.error('Error restoring train ID search:', error)
      }
    }
  }, [])

  // 新增處理範例點擊的函數
  const handleExampleClick = (trainId: string) => {
    setTrainId(trainId)
    // 自動執行搜尋
    handleSearch(trainId)
  }

  // 修改 handleSearch 函數以接受可選的 trainId 參數
  const handleSearch = async (searchTrainId?: string) => {
    const idToSearch = searchTrainId || trainId
    if (!idToSearch) return
    
    try {
      setIsLoading(true)
      setError(null)
      
      // 修改 SQL 查詢，加入 train_cars 的條件
      const { data: formationData, error: formationError } = await supabase
        .from('train_formations')
        .select(`
          id,
          transdate,
          trainno,
          train_cars!inner (
            trainseq,
            assetnum
          )
        `)
        .eq('train_cars.assetnum', idToSearch.toUpperCase()) // 加入車號條件，並轉為大寫
        .order('transdate', { ascending: false })

      if (formationError) throw formationError
      console.log('formationData:', formationData)

      // 整理出車紀錄，按日期分組
      const dailyOperations = formationData.reduce((acc: Record<string, string>, curr) => {
        const date = format(new Date(curr.transdate), 'yyyy/MM/dd')
        if (!acc[date]) {
          acc[date] = curr.trainno
        }
        return acc
      }, {})

      // 3. 獲取每個車次的詳細資訊
      const operationsWithDetails = await Promise.all(
        Object.entries(dailyOperations).map(async ([date, trainNo]) => {
          try {
            const detailResponse = await fetch(
              `/api/taiwanhelper/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/train/${trainNo}.json?id=${trainNo}`
            )
            const detailData = await detailResponse.json()
            
            return {
              date,
              trainNo,
              startStation: detailData.pageProps.train.startingStationName,
              endStation: detailData.pageProps.train.endingStationName,
              startTime: detailData.pageProps.train.startingTime,
              endTime: detailData.pageProps.train.endingTime
            }
          } catch (error) {
            console.error(`Error fetching details for train ${trainNo}:`, error)
            return null
          }
        })
      )

      const validOperations = operationsWithDetails.filter((op): op is TrainOperation => op !== null)
      setOperations(validOperations)

      // 4. 獲取最新一筆紀錄的即時位置
      if (validOperations.length > 0) {
        const latestOperation = validOperations[0]
        const liveResponse = await fetch(
          `/api/taiwanhelper/api/get-train-live?no=${latestOperation.trainNo}`
        )
        
        if (liveResponse.ok) {
          const liveData = await liveResponse.json()
          // 檢查是否有下一站資訊
          const nextStationKey = Object.entries(liveData.stationLiveMap)
            .find(([key, value]) => key.startsWith(`${latestOperation.trainNo}_`) && value === 0)
          
          if (nextStationKey) {
            // 從 key 中提取站點 ID 並轉換為站名
            const stationId = nextStationKey[0].split('_')[1]
            setCurrentLocation(stationNames[stationId] || latestOperation.endStation)
          } else {
            // 如果找不到下一站，使用終點站
            setCurrentLocation(latestOperation.endStation)
          }
        }
      }

      // 通知父組件搜尋結果
      onSearchResult?.({
        trainId: idToSearch,
        operations: validOperations,
        currentLocation
      })

    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試')
      setOperations([])
      setCurrentLocation(null)
    } finally {
      setIsLoading(false)
    }
  }

  // 修改 handleTrainClick 函數
  const handleTrainClick = async (trainNo: string) => {
    try {
      setIsLoading(true)
      
      // 獲取列車詳細資訊
      const detailResponse = await fetch(
        `/api/taiwanhelper/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/train/${trainNo}.json?id=${trainNo}`
      )
      if (!detailResponse.ok) throw new Error('無法取得列車資料')
      const detailData = await detailResponse.json()
      
      if (!detailData?.pageProps?.train) {
        throw new Error('找不到該車次資料')
      }

      // 獲取即時狀態
      const liveResponse = await fetch(`/api/taiwanhelper/api/get-train-live?no=${trainNo}`)
      if (!liveResponse.ok) throw new Error('無法取得列車狀態')
      const liveData = await liveResponse.json()

      // 儲存車次查詢結果到 localStorage
      localStorage.setItem('previousTrainData', JSON.stringify({
        trainData: {
          train: detailData.pageProps.train,
          live: liveData,
          stationNames: {} // 這裡可以加入站名對照表
        },
        trainNo,
        activeTab: 'trainNo'
      }))

      // 儲存車號查詢結果到 localStorage
      localStorage.setItem('previousTrainIdSearch', JSON.stringify({
        trainId,
        operations,
        currentLocation,
        activeTab: 'trainId'
      }))

      // 導航到車次查詢頁面
      router.push(`/train/${trainNo}`)

    } catch (error) {
      console.error('Error fetching train details:', error)
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-6">
      <div className="space-y-4">
        <div>
          <input
            type="text"
            value={trainId}
            onChange={(e) => setTrainId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isLoading && trainId && handleSearch()}
            placeholder="請輸入車號 (例如: EMU3160)"
            className="w-full h-12 px-4 border rounded-lg text-lg"
          />
        </div>

        {/* 範例車號 */}
        <div className="flex flex-wrap gap-2">
          {EXAMPLE_TRAIN_IDS.map((example) => (
            <button
              key={example.id}
              onClick={() => handleExampleClick(example.id)}
              className="px-3 py-1.5 text-sm bg-gray-50 hover:bg-gray-100 
                         text-gray-700 rounded-full border border-gray-200 
                         transition-colors duration-200"
            >
              {example.id} {example.description}
            </button>
          ))}
        </div>

        <div>
          <Button
            onClick={() => handleSearch()}
            disabled={isLoading || !trainId}
            className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white text-lg"
          >
            {isLoading ? '查詢中...' : '查詢'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {(currentLocation || operations.length > 0) && (
        <Card className="p-4">
          <div className="flex flex-col space-y-3">
            <div className="flex items-center space-x-2">
              <MapPin className="w-6 h-6 text-blue-500" />
              <span className="font-medium text-lg">車號 {trainId} 目前位置推測</span>
            </div>
            {currentLocation ? (
              <>
                <div className="text-center text-2xl font-medium text-blue-600">
                  {currentLocation}
                </div>
                <div className="text-sm text-gray-500 text-center">
                  依據列車 {operations[0]?.trainNo} 次運行資訊推測
                </div>
              </>
            ) : (
              <div className="text-center text-gray-500">
                查無目前位置資訊
              </div>
            )}
          </div>
        </Card>
      )}

      <div className="space-y-4">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Calendar className="w-5 h-5 text-blue-500" />
          出車紀錄
        </h3>
        {operations.length > 0 ? (
          <div className="grid gap-4">
            {operations.map((op, index) => (
              <Card key={index} className="p-4">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="text-gray-500">{op.date}</div>
                    <Link 
                      href={`/train/${op.trainNo}`}
                      className="text-lg font-medium text-blue-600 hover:text-blue-800"
                    >
                      {op.trainNo} 次
                    </Link>
                  </div>
                  <div className="text-right">
                    <div>{op.startStation} → {op.endStation}</div>
                    <div className="text-gray-500">
                      {op.startTime} - {op.endTime}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-6">
            <div className="text-center text-gray-500">
              查無出車紀錄
            </div>
          </Card>
        )}
      </div>
    </div>
  );
} 