'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Train, Wrench, AlertTriangle, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Factory } from 'lucide-react'
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

interface DepotEntryRecord {
  id: string
  entry_date: string
  exit_date: string | null
  entry_reason: string
  description: string
  status: 'in_progress' | 'completed' | 'cancelled'
  depot_location: string
  estimated_days: number
  actual_days: number | null
}

interface CarDetails {
  maintenanceRecords: MaintenanceRecord[]
  faultRecords: FaultRecord[]
  depotEntryRecords: DepotEntryRecord[]
}

export default function TrainFormationDisplay({ trainNo }: { trainNo: string }) {
  const [formations, setFormations] = useState<TrainFormation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCar, setSelectedCar] = useState<string | null>(null)
  const [carDetails, setCarDetails] = useState<Record<string, CarDetails>>({})
  const [currentCarIndex, setCurrentCarIndex] = useState<number>(0)
  const [allCars, setAllCars] = useState<string[]>([])
  const [expandedMaintenance, setExpandedMaintenance] = useState(false)
  const [expandedFault, setExpandedFault] = useState<boolean | null>(null)
  const [expandedDepot, setExpandedDepot] = useState(false)

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

      // 獲取最近30天的進廠紀錄
      const { data: depotData, error: depotError } = await supabase
        .from('depot_entry_records')
        .select('*')
        .eq('asset_num', assetNum)
        .gte('entry_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
        .order('entry_date', { ascending: false })

      if (depotError) throw depotError

      // 設置所有資料
      const newCarDetails = {
        maintenanceRecords: maintenanceData || [],
        faultRecords: faultData || [],
        depotEntryRecords: depotData || []
      };

      setCarDetails(prev => ({
        ...prev,
        [assetNum]: newCarDetails
      }));

      // 如果有故障記錄，自動展開故障事件區塊
      if (faultData && faultData.length > 0) {
        setExpandedFault(true);
      } else {
        setExpandedFault(false);
      }

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
      <div className="flex flex-col space-y-1 mb-4">
        <div className="flex items-center space-x-2">
          <Train className="w-6 h-6 text-blue-500" />
          <h3 className="font-bold text-xl">新MMIS出車資訊</h3>
        </div>
        <p className="text-sm text-gray-500 ml-8">每日預計車號列表</p>
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
            {/* 修改標題列樣式 */}
            <div className="relative h-14 flex items-center justify-center border-b bg-gray-50/80 backdrop-blur-sm">
              {/* 返回按鈕 */}
              <button 
                onClick={() => setSelectedCar(null)}
                className="absolute left-4 flex items-center text-blue-500 hover:text-blue-600 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
                <span className="text-base">返回</span>
              </button>
              
              {/* 標題 */}
              <h3 className="text-lg font-medium">車輛 {selectedCar} 詳細資訊</h3>
            </div>

            {/* 內容區域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
              {/* 保養紀錄 - 可收合 */}
              <div className="mb-6">
                <button
                  onClick={() => setExpandedMaintenance(!expandedMaintenance)}
                  className="flex items-center gap-2 font-medium text-lg mb-4 w-full hover:text-blue-600 transition-colors"
                >
                  <Wrench className="w-5 h-5" />
                  <span>近期保養紀錄</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({carDetails[selectedCar].maintenanceRecords.length} 筆)
                  </span>
                  {expandedMaintenance ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>
                
                {expandedMaintenance && (
                  carDetails[selectedCar].maintenanceRecords.length > 0 ? (
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
                  )
                )}
              </div>

              {/* 故障事件 - 可收合 */}
              <div>
                <button
                  onClick={() => setExpandedFault(!expandedFault)}
                  className="flex items-center gap-2 font-medium text-lg mb-4 w-full hover:text-blue-600 transition-colors"
                >
                  <AlertTriangle className="w-5 h-5" />
                  <span>近期故障事件</span>
                  <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                    {carDetails[selectedCar].faultRecords.length}
                  </span>
                  {expandedFault ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>
                
                {expandedFault && (
                  carDetails[selectedCar].faultRecords.length > 0 ? (
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
                  )
                )}
              </div>

              {/* 進廠紀錄 - 可收合 */}
              <div className="mb-6">
                <button
                  onClick={() => setExpandedDepot(!expandedDepot)}
                  className="flex items-center gap-2 font-medium text-lg mb-4 w-full hover:text-blue-600 transition-colors"
                >
                  <Factory className="w-5 h-5" />
                  <span>近期進廠紀錄</span>
                  <span className="text-sm text-gray-500 ml-2">
                    ({carDetails[selectedCar].depotEntryRecords.length} 筆)
                  </span>
                  {expandedDepot ? (
                    <ChevronUp className="w-5 h-5 ml-auto" />
                  ) : (
                    <ChevronDown className="w-5 h-5 ml-auto" />
                  )}
                </button>
                
                {expandedDepot && (
                  carDetails[selectedCar].depotEntryRecords.length > 0 ? (
                    <div className="space-y-4">
                      {carDetails[selectedCar].depotEntryRecords.map(record => (
                        <div key={record.id} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between">
                            <span>
                              {format(new Date(record.entry_date), 'yyyy/MM/dd')}
                              {record.exit_date && ` ~ ${format(new Date(record.exit_date), 'yyyy/MM/dd')}`}
                            </span>
                            <span className={`
                              ${record.status === 'completed' ? 'text-green-500' : ''}
                              ${record.status === 'in_progress' ? 'text-yellow-500' : ''}
                              ${record.status === 'cancelled' ? 'text-red-500' : ''}
                            `}>
                              {record.status === 'completed' ? '已完成' : 
                               record.status === 'in_progress' ? '進行中' : '已取消'}
                            </span>
                          </div>
                          <div className="text-gray-600 mt-1">{record.entry_reason}</div>
                          <div className="text-gray-500 text-sm mt-1">{record.description}</div>
                          <div className="mt-2 text-sm text-gray-500">
                            <div>進廠地點：{record.depot_location}</div>
                            <div>預計天數：{record.estimated_days} 天</div>
                            {record.actual_days && <div>實際天數：{record.actual_days} 天</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-gray-500">無近期進廠紀錄</div>
                  )
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