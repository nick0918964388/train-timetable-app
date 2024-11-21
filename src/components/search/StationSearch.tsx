'use client'
import { useState, useEffect } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Button } from '@/components/ui/button'
import { ArrowLeftRight } from 'lucide-react'
import { fetchAllStations } from '@/services/stationService'
import type { Station } from '@/services/stationService'
import { Autocomplete } from '@/components/ui/autocomplete'
import { format } from 'date-fns'

interface TrainSchedule {
  TrainNo: string;
  Direction: number;
  StartingStationName: string;
  EndingStationName: string;
  DepartureTime: string;
  ArrivalTime: string;
  TrainTypeName: {
    Zh_tw: string;
  };
}

export default function StationSearch() {
  const [date, setDate] = useState<Date>()
  const [stations, setStations] = useState<Station[]>([])
  const [startStationInput, setStartStationInput] = useState('')
  const [endStationInput, setEndStationInput] = useState('')
  const [startStation, setStartStation] = useState<string>('')
  const [endStation, setEndStation] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schedules, setSchedules] = useState<TrainSchedule[]>([])
  const [isSearching, setIsSearching] = useState(false)

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

  const handleSwapStations = () => {
    const tempInput = startStationInput
    const tempStation = startStation
    setStartStationInput(endStationInput)
    setEndStationInput(tempInput)
    setStartStation(endStation)
    setEndStation(tempStation)
  }

  const handleSearch = async () => {
    if (!date || !startStation || !endStation) return
    
    try {
      setIsSearching(true)
      setError(null)
      const formattedDate = format(date, 'yyyy-MM-dd')
      
      const response = await fetch(
        `/api/tdx/Rail/TRA/DailyTrainTimetable/OD/${startStation}/to/${endStation}/${formattedDate}?$top=1000&$format=JSON`
      )
      
      if (!response.ok) throw new Error('查詢失敗')
      
      const data = await response.json()
      setSchedules(data.TrainTimetables || [])
    } catch (error) {
      console.error('Search error:', error)
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試')
      setSchedules([])
    } finally {
      setIsSearching(false)
    }
  }

  const stationOptions = stations.map(station => ({
    id: station.station_id,
    name: station.station_name
  }))

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-4">
        {/* 日期選擇 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">日期</label>
          <div className="w-48">
            <DatePicker
              date={date}
              onChange={setDate}
              placeholder="選擇日期"
            />
          </div>
        </div>

        {/* 車站選擇 */}
        <div className="flex flex-col space-y-2">
          <label className="text-sm font-medium">車站</label>
          <div className="flex items-center space-x-2">
            <Autocomplete
              value={startStationInput}
              onChange={setStartStationInput}
              onSelect={(option) => {
                setStartStationInput(option.name)
                setStartStation(option.id)
              }}
              options={stationOptions}
              placeholder="請選擇起始站"
              disabled={isLoading}
              className="flex-1"
            />
            
            <button
              onClick={handleSwapStations}
              className="flex items-center justify-center w-10 h-10 rounded-md hover:bg-gray-100"
              disabled={isLoading}
            >
              <ArrowLeftRight className="w-5 h-5 text-gray-400" />
            </button>

            <Autocomplete
              value={endStationInput}
              onChange={setEndStationInput}
              onSelect={(option) => {
                setEndStationInput(option.name)
                setEndStation(option.id)
              }}
              options={stationOptions}
              placeholder="請選擇終點站"
              disabled={isLoading}
              className="flex-1"
            />
          </div>
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
              </tr>
            </thead>
            <tbody>
              {schedules.map((schedule, index) => (
                <tr key={`${schedule.TrainNo}-${index}`} className="hover:bg-gray-50">
                  <td className="px-4 py-2 border text-center">{schedule.TrainNo}</td>
                  <td className="px-4 py-2 border text-center">{schedule.TrainTypeName.Zh_tw}</td>
                  <td className="px-4 py-2 border text-center">{schedule.StartingStationName}</td>
                  <td className="px-4 py-2 border text-center">{schedule.EndingStationName}</td>
                  <td className="px-4 py-2 border text-center">{schedule.DepartureTime}</td>
                  <td className="px-4 py-2 border text-center">{schedule.ArrivalTime}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
} 