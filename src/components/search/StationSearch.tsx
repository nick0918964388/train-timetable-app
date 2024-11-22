'use client'
import { useState, useEffect, useMemo } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight, ArrowLeft } from 'lucide-react'
import { fetchAllStations } from '@/services/stationService'
import type { Station } from '@/services/stationService'
import { Autocomplete } from '@/components/ui/autocomplete'
import { format, addDays, startOfYesterday } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface TrainSchedule {
  TrainInfo: {
    TrainNo: string;
    Direction: number;
    TrainTypeName: {
      Zh_tw: string;
      En: string;
    };
    StartingStationName: {
      Zh_tw: string;
      En: string;
    };
    EndingStationName: {
      Zh_tw: string;
      En: string;
    };
    Note?: string;
  };
  StopTimes: {
    StationID: string;
    StationName: {
      Zh_tw: string;
      En: string;
    };
    ArrivalTime: string;
    DepartureTime: string;
  }[];
}

interface CityGroup {
  name: string;
  stations: Station[];
}

interface StationSearchProps {
  initialState?: {
    date?: Date
    startStation?: string
    endStation?: string
    startStationInput?: string
    endStationInput?: string
    schedules?: any[]
  }
  onSearchResult?: (data: any) => void
}

interface TimeRange {
  start: string;
  end: string;
}

export default function StationSearch({ initialState, onSearchResult }: StationSearchProps) {
  const [date, setDate] = useState<Date>(initialState?.date || new Date())
  const [stations, setStations] = useState<Station[]>([])
  const [startStationInput, setStartStationInput] = useState(initialState?.startStationInput || '')
  const [endStationInput, setEndStationInput] = useState(initialState?.endStationInput || '')
  const [startStation, setStartStation] = useState<string>(initialState?.startStation || '')
  const [endStation, setEndStation] = useState<string>(initialState?.endStation || '')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<TrainSchedule[]>(initialState?.schedules || [])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [filteredStations, setFilteredStations] = useState<Station[]>([])
  const [showCitySelection, setShowCitySelection] = useState(false)
  const [activeInput, setActiveInput] = useState<'start' | 'end' | null>(null)
  const [showCityList, setShowCityList] = useState(true)
  const [timeRange, setTimeRange] = useState<TimeRange>({
    start: '',
    end: ''
  })

  useEffect(() => {
    async function loadStations() {
      try {
        setIsLoading(true)
        const data = await fetchAllStations()
        setStations(data)
        setError(null)
      } catch (err) {
        setError('載入車站資料失敗')
        console.error('Error loading stations:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStations()
  }, [])

  useEffect(() => {
    const restoreSearch = localStorage.getItem('restoreStationSearch')
    if (restoreSearch) {
      try {
        const {
          date: savedDate,
          startStation: savedStartStation,
          endStation: savedEndStation,
          startStationInput: savedStartInput,
          endStationInput: savedEndInput,
          schedules: savedSchedules
        } = JSON.parse(restoreSearch)

        setDate(savedDate ? new Date(savedDate) : new Date())
        setStartStation(savedStartStation)
        setEndStation(savedEndStation)
        setStartStationInput(savedStartInput)
        setEndStationInput(savedEndInput)
        setSchedules(savedSchedules)

        localStorage.removeItem('restoreStationSearch')
      } catch (error) {
        console.error('Error restoring station search:', error)
      }
    }
  }, [])

  const handleSwapStations = () => {
    const tempInput = startStationInput
    const tempStation = startStation
    setStartStationInput(endStationInput)
    setEndStationInput(tempInput)
    setStartStation(endStation)
    setEndStation(tempStation)
  }

  const handleSearch = async () => {
    if (!date || !startStation || !endStation) return;
    
    try {
      setIsSearching(true);
      setError(null);
      const formattedDate = format(date, 'yyyy-MM-dd');
      
      const response = await fetch(
        `/api/tdx/Rail/TRA/DailyTrainTimetable/OD/${startStation}/to/${endStation}/${formattedDate}?$top=1000&$format=JSON`
      );
      
      if (!response.ok) throw new Error('查詢失敗');
      
      const data = await response.json();
      let filteredSchedules = data.TrainTimetables || [];

      // 如果有設定時間範圍，進行過濾
      if (timeRange.start || timeRange.end) {
        filteredSchedules = filteredSchedules.filter((schedule: any) => {
          const startStop = schedule.StopTimes.find((stop: any) => stop.StationID === startStation);
          if (!startStop) return false;

          const departureTime = startStop.DepartureTime;
          
          const timeToNumber = (time: string) => 
            parseInt(time.replace(':', ''));
          
          const departure = timeToNumber(departureTime);
          
          if (timeRange.start && timeRange.end) {
            return departure >= timeToNumber(timeRange.start) && 
                   departure <= timeToNumber(timeRange.end);
          } else if (timeRange.start) {
            return departure >= timeToNumber(timeRange.start);
          } else if (timeRange.end) {
            return departure <= timeToNumber(timeRange.end);
          }
          
          return true;
        });
      }

      // 根據出發時間排序
      filteredSchedules.sort((a: any, b: any) => {
        const aStartStop = a.StopTimes.find((stop: any) => stop.StationID === startStation);
        const bStartStop = b.StopTimes.find((stop: any) => stop.StationID === startStation);
        
        if (!aStartStop || !bStartStop) return 0;
        
        const aTime = aStartStop.DepartureTime;
        const bTime = bStartStop.DepartureTime;
        
        // 轉換時間為數字以便比較 (例如: "13:45" -> 1345)
        const timeToNumber = (time: string) => parseInt(time.replace(':', ''));
        
        return timeToNumber(aTime) - timeToNumber(bTime);
      });

      setSchedules(filteredSchedules);
    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試');
      setSchedules([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleTrainClick = async (trainNo: string) => {
    try {
      setIsSearching(true)
      
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

      // 儲存車站查詢結果到 localStorage
      localStorage.setItem('previousStationSearch', JSON.stringify({
        date,
        startStation,
        endStation,
        startStationInput,
        endStationInput,
        schedules,
        activeTab: 'station'
      }))

      // 導航到車次查詢頁面
      router.push(`/train/${trainNo}`)

    } catch (error) {
      console.error('Error fetching train details:', error)
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試')
    } finally {
      setIsSearching(false)
    }
  }

  const stationOptions = stations.map(station => ({
    id: station.station_id,
    name: station.station_name
  }))

  // 修改處理按鍵事件的函數
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && date && startStation && endStation) {
      handleSearch()
    }
  }

  // 設定日期限制
  const yesterday = startOfYesterday()
  const maxDate = addDays(new Date(), 14) // 可以選擇未來14天

  // 修改 cityGroups 的定義
  const cityGroups = useMemo(() => {
    const cities: { name: string; stations: Station[] }[] = [
      { name: '臺北市', stations: [] },
      { name: '新北市', stations: [] },
      { name: '基隆市', stations: [] },
      { name: '宜蘭縣', stations: [] },
      { name: '桃園市', stations: [] },
      { name: '新竹市', stations: [] },
      { name: '新竹縣', stations: [] },
      { name: '苗栗縣', stations: [] },
      { name: '台中市', stations: [] },
      { name: '彰化縣', stations: [] },
      { name: '南投縣', stations: [] },
      { name: '雲林縣', stations: [] },
      { name: '嘉義市', stations: [] },
      { name: '嘉義縣', stations: [] },
      { name: '台南市', stations: [] },
      { name: '高雄市', stations: [] },
      { name: '屏東縣', stations: [] },
      { name: '台東縣', stations: [] },
      { name: '花蓮縣', stations: [] },
    ]

    // 根據車站的 city 屬性進行分類
    stations.forEach(station => {
      if (station.city) {
        const city = cities.find(c => c.name === station.city)
        if (city) {
          city.stations.push(station)
        }
      }
    })

    return cities.filter(city => city.stations.length > 0)
  }, [stations])

  // 修改處理縣市選擇的函數
  const handleCityClick = (cityName: string) => {
    setSelectedCity(cityName)
    const cityStations = cityGroups.find(c => c.name === cityName)?.stations || []
    setFilteredStations(cityStations)
    setShowCityList(false) // 新增這個 state 來控制縣市列表的顯示
  }

  // 修改處理車站輸入框點擊的函數
  const handleStationInputClick = (type: 'start' | 'end') => {
    setActiveInput(type)
    setShowCitySelection(true)
    setSelectedCity('') // 清空選中的縣市
    setFilteredStations([]) // 清空篩選的車站列表
    setShowCityList(true) // 重設為顯示縣市列表
  }

  // 處理車站選擇
  const handleStationSelect = (station: { id: string; name: string }) => {
    console.log('Selecting station:', station)
    console.log('Active input:', activeInput)
    
    if (activeInput === 'start') {
      setStartStationInput(station.name)
      setStartStation(station.id)
      console.log('Set start station:', station.id)
    } else if (activeInput === 'end') {
      setEndStationInput(station.name)
      setEndStation(station.id)
      console.log('Set end station:', station.id)
    }
    
    setShowCitySelection(false)
    setActiveInput(null)
  }

  console.log('Current state:', {
    isLoading,
    isSearching,
    date,
    startStation,
    endStation
  })

  // 在搜尋成功時更新父組件的狀態
  useEffect(() => {
    onSearchResult?.({
      date,
      startStation,
      endStation,
      startStationInput,
      endStationInput,
      schedules
    })
  }, [date, startStation, endStation, startStationInput, endStationInput, schedules])

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        {/* 日期選擇部分 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">日期</label>
          <div className="w-64">
            <DatePicker
              date={date}
              onChange={setDate}
              placeholder="選擇日期"
              fromDate={yesterday}
              toDate={maxDate}
              className="h-12"
            />
          </div>
        </div>

        {/* 加入時間範圍選擇 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">出發時間範圍</label>
          <div className="flex items-center space-x-2">
            <input
              type="time"
              value={timeRange.start}
              onChange={(e) => setTimeRange(prev => ({ ...prev, start: e.target.value }))}
              className="flex-1 h-10 px-3 border rounded-md"
            />
            <span className="text-gray-500">至</span>
            <input
              type="time"
              value={timeRange.end}
              onChange={(e) => setTimeRange(prev => ({ ...prev, end: e.target.value }))}
              className="flex-1 h-10 px-3 border rounded-md"
            />
          </div>
        </div>

        {/* 車站選擇 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">車站</label>
          <div className="flex items-center space-x-2">
            <div className="flex-1 relative">
              <input
                type="text"
                value={startStationInput}
                onClick={() => handleStationInputClick('start')}
                readOnly
                placeholder="請選擇起始站"
                className="w-full h-10 px-3 border rounded-md"
              />
            </div>
            
            <button
              onClick={handleSwapStations}
              className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100"
              disabled={isLoading}
            >
              <ArrowLeftRight className="w-5 h-5 text-gray-400" />
            </button>

            <div className="flex-1 relative">
              <input
                type="text"
                value={endStationInput}
                onClick={() => handleStationInputClick('end')}
                readOnly
                placeholder="請選擇終點站"
                className="w-full h-10 px-3 border rounded-md"
              />
            </div>
          </div>

          {/* 車站選擇面板 */}
          {showCitySelection && (
            <div className="mt-2 p-4 border rounded-lg bg-white shadow-lg">
              {/* 搜尋框 */}
              <input
                type="text"
                placeholder="搜尋車站名稱"
                className="w-full mb-4 p-2 border rounded"
                onChange={(e) => {
                  const searchText = e.target.value
                  if (searchText) {
                    setFilteredStations(stations.filter(s => 
                      s.station_name.includes(searchText)
                    ))
                    setSelectedCity('') // 清空選中的縣市
                    setShowCityList(true) // 顯示縣市列表
                  } else {
                    setFilteredStations([]) // 清空篩選結果
                    setShowCityList(true) // 顯示縣市列表
                  }
                }}
              />

              {/* 如果有選擇縣市，顯示返回按鈕 */}
              {selectedCity && !showCityList && (
                <button
                  onClick={() => {
                    setSelectedCity('')
                    setFilteredStations([])
                    setShowCityList(true)
                  }}
                  className="mb-4 px-4 py-2 text-blue-600 hover:text-blue-800 flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  返回縣市選擇
                </button>
              )}

              {/* 縣市按鈕群組 - 只在 showCityList 為 true 時顯示 */}
              {showCityList && (
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {cityGroups.map((city) => (
                    <button
                      key={city.name}
                      onClick={() => handleCityClick(city.name)}
                      className={`p-2 text-center rounded ${
                        selectedCity === city.name
                          ? 'bg-blue-100 text-blue-700'
                          : 'hover:bg-gray-100'
                      }`}
                    >
                      {city.name}
                    </button>
                  ))}
                </div>
              )}

              {/* 車站列表 */}
              {filteredStations.length > 0 && (
                <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto">
                  {filteredStations.map((station) => (
                    <button
                      key={station.station_id}
                      onClick={() => handleStationSelect({
                        id: station.station_id,
                        name: station.station_name
                      })}
                      className="p-2 text-center rounded hover:bg-gray-100"
                    >
                      {station.station_name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      <Button 
        className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white text-lg"
        onClick={handleSearch}
        disabled={isLoading || isSearching || !date || !startStation || !endStation}
      >
        {isSearching ? '查詢中...' : '查詢'}
      </Button>

      {/* 查詢結果 */}
      {schedules.length > 0 && (
        <div className="mt-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 border">車次</th>
                <th className="px-4 py-2 border">車種</th>
                <th className="px-4 py-2 border">出發站</th>
                <th className="px-4 py-2 border">終點站</th>
                <th className="px-4 py-2 border">出發時間</th>
                <th className="px-4 py-2 border">抵達時間</th>
                <th className="px-4 py-2 border">備註</th>
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule, index) => {
                const startStop = schedule.StopTimes.find(stop => stop.StationID === startStation)
                const endStop = schedule.StopTimes.find(stop => stop.StationID === endStation)
                
                return (
                  <tr key={`${schedule.TrainInfo.TrainNo}-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border text-center">
                      <button
                        onClick={() => handleTrainClick(schedule.TrainInfo.TrainNo)}
                        className="text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        {schedule.TrainInfo.TrainNo}
                      </button>
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {schedule.TrainInfo.TrainTypeName?.Zh_tw || '未知'}
                    </td>
                    <td className="px-4 py-2 border text-center w-28">
                      {schedule.TrainInfo.StartingStationName.Zh_tw}
                    </td>
                    <td className="px-4 py-2 border text-center w-28">
                      {schedule.TrainInfo.EndingStationName.Zh_tw}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {startStop?.DepartureTime || '--:--'}
                    </td>
                    <td className="px-4 py-2 border text-center">
                      {endStop?.ArrivalTime || '--:--'}
                    </td>
                    <td className="px-4 py-2 border text-center text-sm whitespace-pre-line">
                      {schedule.TrainInfo.Note || ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 