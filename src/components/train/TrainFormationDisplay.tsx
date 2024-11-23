'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Train, Wrench, AlertTriangle, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format } from 'date-fns'

interface TrainCar {
  trainseq: number
  assetnum: string
}

interface TrainFormation {
  date: string
  cars: TrainCar[][]
}

interface FormattedTrainCar {
  trainseq: number
  assetnum: string
  isEngine: boolean
}

interface MaintenanceRecord {
  id: string
  maintenance_date: string
  maintenance_type: string
  description: string
  completed: boolean
}

interface FaultRecord {
  id: string
  fault_date: string
  fault_type: string
  description: string
  resolved: boolean
  resolution_date: string | null
  resolution_description: string | null
}

interface CarDetails {
  maintenanceRecords: MaintenanceRecord[]
  faultRecords: FaultRecord[]
}

export default function TrainFormationDisplay({ trainNo }: { trainNo: string }) {
  const [formations, setFormations] = useState<TrainFormation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCar, setSelectedCar] = useState<string | null>(null)
  const [carDetails, setCarDetails] = useState<Record<string, CarDetails>>({})
  const [currentCarIndex, setCurrentCarIndex] = useState<number>(0)
  const [allCars, setAllCars] = useState<string[]>([])

  const isEngine = (assetnum: string) => {
    return /^E[1-5]/.test(assetnum)
  }

  const formatAllCars = (carGroups: TrainCar[][]) => {
    const uniqueCars = Array.from(
      new Map(
        carGroups.flat().map(car => [car.assetnum, car])
      ).values()
    )

    const engines = uniqueCars
      .filter(car => isEngine(car.assetnum))
      .map(car => ({ ...car, isEngine: true } as FormattedTrainCar))
    
    const normalCars = uniqueCars
      .filter(car => !isEngine(car.assetnum))
      .map(car => ({ ...car, isEngine: false } as FormattedTrainCar))
    
    let formattedCars: FormattedTrainCar[] = []

    if (engines.length >= 2) {
      formattedCars = [
        engines[0],
        ...normalCars,
        engines[engines.length - 1]
      ]
    } else if (engines.length === 1) {
      formattedCars = [
        engines[0],
        ...normalCars
      ]
    } else {
      formattedCars = normalCars
    }

    return formattedCars
  }

  // 獲取車輛詳細資訊
  const fetchCarDetails = async (assetNum: string) => {
    try {
      // 獲取最近30天的保養紀錄
      const { data: maintenanceData, error: maintenanceError } = await supabase
        .from('maintenance_records')
        .select('*')
        .eq('asset_num', assetNum)
        .gte('maintenance_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('maintenance_date', { ascending: false })

      if (maintenanceError) throw maintenanceError

      // 獲取最近30天的故障紀錄
      const { data: faultData, error: faultError } = await supabase
        .from('fault_records')
        .select('*')
        .eq('asset_num', assetNum)
        .gte('fault_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('fault_date', { ascending: false })

      if (faultError) throw faultError

      setCarDetails(prev => ({
        ...prev,
        [assetNum]: {
          maintenanceRecords: maintenanceData || [],
          faultRecords: faultData || []
        }
      }))
    } catch (error) {
      console.error('Error fetching car details:', error)
    }
  }

  // 處理車輛點擊
  const handleCarClick = async (assetNum: string) => {
    if (!carDetails[assetNum]) {
      await fetchCarDetails(assetNum)
    }
    setSelectedCar(assetNum)
    const index = allCars.indexOf(assetNum)
    setCurrentCarIndex(index)
  }

  // 處理上一筆
  const handlePrevious = async () => {
    if (currentCarIndex > 0) {
      const prevAssetNum = allCars[currentCarIndex - 1]
      if (!carDetails[prevAssetNum]) {
        await fetchCarDetails(prevAssetNum)
      }
      setSelectedCar(prevAssetNum)
      setCurrentCarIndex(currentCarIndex - 1)
    }
  }

  // 處理下一筆
  const handleNext = async () => {
    if (currentCarIndex < allCars.length - 1) {
      const nextAssetNum = allCars[currentCarIndex + 1]
      if (!carDetails[nextAssetNum]) {
        await fetchCarDetails(nextAssetNum)
      }
      setSelectedCar(nextAssetNum)
      setCurrentCarIndex(currentCarIndex + 1)
    }
  }

  useEffect(() => {
    async function fetchTrainFormation() {
      try {
        setIsLoading(true)
        setError(null)
        
        const { data: latestData, error: latestError } = await supabase
          .from('train_formations')
          .select('transdate')
          .eq('trainno', trainNo)
          .order('transdate', { ascending: false })
          .limit(1)

        if (latestError) throw latestError

        if (!latestData || latestData.length === 0) {
          setError('找不到車次的編組資料')
          return
        }

        const latestDate = latestData[0].transdate

        const { data: formationsData, error: formationError } = await supabase
          .from('train_formations')
          .select(`
            id,
            transdate,
            train_cars (
              trainseq,
              assetnum
            )
          `)
          .eq('trainno', trainNo)
          .eq('transdate', latestDate)
          .order('transdate', { ascending: false })

        if (formationError) throw formationError

        if (!formationsData || formationsData.length === 0) {
          setError('找不到該車次的編組資料')
          return
        }

        const groupedFormations = formationsData.reduce((acc: { [key: string]: TrainCar[][] }, curr) => {
          const date = format(new Date(curr.transdate), 'yyyy/MM/dd')
          if (!acc[date]) {
            acc[date] = []
          }
          if (curr.train_cars && curr.train_cars.length > 0) {
            acc[date].push(curr.train_cars)
          }
          return acc
        }, {})

        const processedFormations = Object.entries(groupedFormations).map(([date, carGroups]) => ({
          date,
          cars: carGroups
        }))

        setFormations(processedFormations)
      } catch (err) {
        console.error('Error fetching train formation:', err)
        setError('載入車輛編組資料失敗')
      } finally {
        setIsLoading(false)
      }
    }

    if (trainNo) {
      fetchTrainFormation()
    }
  }, [trainNo])

  // 更新 useEffect，在獲取編組資料後設置所有車輛列表
  useEffect(() => {
    if (formations.length > 0) {
      const uniqueCars = Array.from(
        new Set(
          formations
            .flatMap(formation => formation.cars.flat())
            .map(car => car.assetnum)
        )
      )
      setAllCars(uniqueCars)
    }
  }, [formations])

  // 處理背景點擊
  const handleBackdropClick = (e: React.MouseEvent) => {
    // 確保點擊的是背景而不是內容
    if (e.target === e.currentTarget) {
      setSelectedCar(null)
    }
  }

  return (
    <Card className="p-4 sm:p-6">
      <div className="flex items-center space-x-2 mb-4">
        <Train className="w-6 h-6 text-blue-500" />
        <h3 className="font-bold text-xl">出車資訊</h3>
      </div>
      
      <div className="space-y-4">
        {formations.map((formation, index) => (
          <div key={index}>
            <div className="text-gray-500 font-medium mb-2">
              {formation.date}
            </div>
            <div className="flex flex-wrap gap-1 overflow-x-auto pb-2">
              {formatAllCars(formation.cars).map((car, carIndex) => (
                <button
                  key={carIndex}
                  onClick={() => handleCarClick(car.assetnum)}
                  className={`
                    inline-block px-2 py-1 rounded text-sm cursor-pointer
                    hover:ring-2 hover:ring-blue-300 transition-all
                    ${car.isEngine 
                      ? 'bg-blue-50 text-blue-700 border border-blue-200' 
                      : 'bg-gray-50 text-gray-700 border border-gray-200'
                    }
                  `}
                >
                  {car.assetnum}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 車輛詳細資訊彈出層 */}
      {selectedCar && carDetails[selectedCar] && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={handleBackdropClick}
        >
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative">
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {/* 標題和關閉按鈕 */}
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">車輛 {selectedCar} 詳細資訊</h3>
                <button 
                  onClick={() => setSelectedCar(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 保養紀錄 */}
              <div className="mb-6">
                <div className="flex items-center gap-2 font-medium text-lg mb-4">
                  <Wrench className="w-5 h-5" />
                  <span>近期保養紀錄</span>
                </div>
                {carDetails[selectedCar].maintenanceRecords.length > 0 ? (
                  <div className="space-y-4">
                    {carDetails[selectedCar].maintenanceRecords.map(record => (
                      <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>{format(new Date(record.maintenance_date), 'yyyy/MM/dd')}</span>
                          <span className={record.completed ? 'text-green-500' : 'text-yellow-500'}>
                            {record.completed ? '已完成' : '進行中'}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-1">{record.maintenance_type}</div>
                        <div className="text-gray-500 text-sm mt-1">{record.description}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">無近期保養紀錄</div>
                )}
              </div>

              {/* 故障事件 */}
              <div>
                <div className="flex items-center gap-2 font-medium text-lg mb-4">
                  <AlertTriangle className="w-5 h-5" />
                  <span>近期故障事件</span>
                </div>
                {carDetails[selectedCar].faultRecords.length > 0 ? (
                  <div className="space-y-4">
                    {carDetails[selectedCar].faultRecords.map(record => (
                      <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <span>{format(new Date(record.fault_date), 'yyyy/MM/dd')}</span>
                          <span className={record.resolved ? 'text-green-500' : 'text-red-500'}>
                            {record.resolved ? '已解決' : '未解決'}
                          </span>
                        </div>
                        <div className="text-gray-600 mt-1">{record.fault_type}</div>
                        <div className="text-gray-500 text-sm mt-1">{record.description}</div>
                        {record.resolved && (
                          <div className="mt-2 pt-2 border-t">
                            <div className="text-sm text-gray-500">
                              解決時間：{format(new Date(record.resolution_date!), 'yyyy/MM/dd')}
                            </div>
                            <div className="text-sm text-gray-500">
                              解決方案：{record.resolution_description}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-500">無近期故障事件</div>
                )}
              </div>
            </div>

            {/* 導航控制區域 - 移到底部 */}
            <div className="border-t bg-gray-50 p-4">
              {/* 導航小圓點 */}
              <div className="flex justify-center gap-1 mb-4">
                {allCars.map((car, index) => (
                  <button
                    key={car}
                    onClick={() => handleCarClick(car)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentCarIndex
                        ? 'bg-blue-500 w-4'
                        : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                    title={car}
                  />
                ))}
              </div>

              {/* 上下一筆按鈕 */}
              <div className="flex justify-between items-center gap-4">
                <button
                  onClick={handlePrevious}
                  disabled={currentCarIndex === 0}
                  className={`flex-1 p-4 rounded-lg border transition-all ${
                    currentCarIndex === 0 
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ChevronLeft className="w-5 h-5" />
                    {currentCarIndex > 0 && (
                      <div className="text-left">
                        <div className="text-sm text-gray-500">上一筆</div>
                        <div className="font-medium">{allCars[currentCarIndex - 1]}</div>
                      </div>
                    )}
                  </div>
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentCarIndex === allCars.length - 1}
                  className={`flex-1 p-4 rounded-lg border transition-all ${
                    currentCarIndex === allCars.length - 1
                      ? 'bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'bg-white hover:bg-gray-50 text-gray-700 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-center justify-end gap-3">
                    {currentCarIndex < allCars.length - 1 && (
                      <div className="text-right">
                        <div className="text-sm text-gray-500">下一筆</div>
                        <div className="font-medium">{allCars[currentCarIndex + 1]}</div>
                      </div>
                    )}
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
} 