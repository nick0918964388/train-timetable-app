'use client'
import { useState, useEffect } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Info, Clock } from 'lucide-react'
import type { TrainBasicInfo, TrainTimeTableItem, LiveData } from '@/types/station'
import { getStationNameMap } from '@/services/stationService'

export default function TrainNoSearch() {
  const [date, setDate] = useState<Date>()
  const [trainNo, setTrainNo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trainInfo, setTrainInfo] = useState<TrainBasicInfo | null>(null)
  const [timeTable, setTimeTable] = useState<TrainTimeTableItem[]>([])
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [stationNames, setStationNames] = useState<Record<string, string>>({})

  // 載入站名對照表
  useEffect(() => {
    async function loadStationNames() {
      const nameMap = await getStationNameMap()
      setStationNames(nameMap)
    }
    loadStationNames()
  }, [])

  const handleSearch = async () => {
    if (!trainNo) return;
    
    try {
      setIsLoading(true);
      setError(null);

      // 使用重寫的路徑
      const detailResponse = await fetch(
        `/api/taiwanhelper/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/train/${trainNo}.json?id=${trainNo}`
      );
      if (!detailResponse.ok) throw new Error('無法取得列車資料');
      const detailData = await detailResponse.json();
      
      if (!detailData?.pageProps?.train) {
        throw new Error('找不到該車次資料');
      }

      const { train } = detailData.pageProps;

      // 設置基本資訊
      setTrainInfo({
        trainNo: train.no || trainNo,
        trainType: train.trainTypeName || '未知車種',
        startStation: stationNames[train.startingStationId] || train.startingStationId || '',
        startTime: train.startingTime || '',
        endStation: stationNames[train.endingStationId] || train.endingStationId || '',
        endTime: train.endingTime || '',
        direction: train.direction === 0 ? '順行' : '逆行',
        note: train.note || '',
        runningDays: '每日行駛',
        remarks: [
          train.wheelChairFlag && '身障旅客專用座位',
          train.breastFeedFlag && '哺(集)乳室',
          train.dailyFlag && '每日行駛',
        ].filter(Boolean)
      });

      // 同樣修改即時狀態的 API 調用
      const liveResponse = await fetch(`/api/taiwanhelper/api/get-train-live?no=${trainNo}`);
      if (!liveResponse.ok) throw new Error('無法取得列車狀態');
      const liveData = await liveResponse.json();
      setLiveData(liveData);

      // 從 train.stopTimes 建立時刻表，使用站名對照表
      if (Array.isArray(train.stopTimes)) {
        setTimeTable(train.stopTimes.map((item: any, index: number) => ({
          sequence: item.seq,
          station: stationNames[item.stationId] || item.stationId, // 使用對照表取得站名
          stationId: item.stationId,
          arrival: item.arrivalTime,
          departure: item.departureTime
        })));
      } else {
        setTimeTable([]);
        console.warn('時刻表資料格式不正確');
      }

    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試');
      setTrainInfo(null);
      setTimeTable([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 取得延誤狀態文字
  const getDelayStatus = (stationId: string) => {
    if (!liveData) return '準點';
    
    const key = `${trainNo}_${stationId}`;
    const delay = liveData.trainLiveMap[key];
    
    if (delay === undefined) return '準點';
    if (delay === 0) return '準點';
    if (delay === 1) return '晚1分';
    if (delay === 2) return '晚2分';
    return `晚${delay}分`;
  }

  // 取得狀態顏色
  const getStatusColor = (status: string) => {
    if (status === '準點') return 'text-green-600';
    return 'text-red-600';
  }

  return (
    <div className="space-y-6 p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="w-48">
          <DatePicker 
            placeholder="選擇日期"
            date={date}
            onChange={setDate}
          />
        </div>
        <Input 
          placeholder="請輸入車次" 
          value={trainNo}
          onChange={(e) => setTrainNo(e.target.value)}
          className="text-center"
        />
      </div>
      
      <Button 
        className="w-full h-12 bg-blue-800 hover:bg-blue-900 text-white text-lg"
        onClick={handleSearch}
        disabled={isLoading || !trainNo}
      >
        {isLoading ? '查詢中...' : '查詢'}
      </Button>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {liveData && (
        <div className="text-sm text-gray-500 text-right">
          更新時間: {liveData.liveUpdateTime}
        </div>
      )}

      {trainInfo && timeTable.length > 0 && (
        <div className="grid grid-cols-3 gap-6">
          {/* 基本資訊 */}
          <Card className="p-6">
            <div className="flex items-center space-x-2 mb-6">
              <Info className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold">基本資訊</h3>
            </div>
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">車次</span>
                <span className="col-span-2">{trainInfo.trainNo}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">車種</span>
                <span className="col-span-2">{trainInfo.trainType}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">起站</span>
                <span className="col-span-2">{trainInfo.startStation} - {trainInfo.startTime}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">終站</span>
                <span className="col-span-2">{trainInfo.endStation} - {trainInfo.endTime}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">方向</span>
                <span className="col-span-2">{trainInfo.direction}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">說明</span>
                <span className="col-span-2">{trainInfo.note}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">行駛日</span>
                <span className="col-span-2">{trainInfo.runningDays}</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <span className="text-gray-500">註記</span>
                <div className="col-span-2">
                  {trainInfo.remarks.map((remark, index) => (
                    <div key={index}>✓ {remark}</div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          {/* 時刻表 */}
          <Card className="p-6 col-span-2">
            <div className="flex items-center space-x-2 mb-6">
              <Clock className="w-5 h-5 text-blue-500" />
              <h3 className="font-bold">時刻表</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 border text-center">順序</th>
                    <th className="px-4 py-2 border text-center">停靠站</th>
                    <th className="px-4 py-2 border text-center">抵達</th>
                    <th className="px-4 py-2 border text-center">出發</th>
                    <th className="px-4 py-2 border text-center">狀態</th>
                  </tr>
                </thead>
                <tbody>
                  {timeTable.map((item) => {
                    const status = getDelayStatus(item.stationId);
                    return (
                      <tr key={item.sequence}>
                        <td className="px-4 py-2 border text-center">{item.sequence}</td>
                        <td className="px-4 py-2 border text-center">{item.station}</td>
                        <td className="px-4 py-2 border text-center">{item.arrival}</td>
                        <td className="px-4 py-2 border text-center">{item.departure}</td>
                        <td className={`px-4 py-2 border text-center ${getStatusColor(status)}`}>
                          {status}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
} 