'use client'
import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/card'
import { Info, Clock } from 'lucide-react'
import type { TrainBasicInfo, TrainTimeTableItem, LiveData } from '@/types/station'
import { format } from 'date-fns'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import TrainFormationDisplay from '@/components/train/TrainFormationDisplay'

interface TrainInfoDisplayProps {
  trainData: {
    train: any;
    live: LiveData;
    stationNames: Record<string, string>;
  };
  trainNo: string;
}

export default function TrainInfoDisplay({ trainData, trainNo }: TrainInfoDisplayProps) {
  const router = useRouter()
  const [trainInfo, setTrainInfo] = useState<TrainBasicInfo | null>(null)
  const [timeTable, setTimeTable] = useState<TrainTimeTableItem[]>([])
  const [liveData, setLiveData] = useState<LiveData | null>(null)
  const [refreshCountdown, setRefreshCountdown] = useState<number>(30)
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false)
  const [lastUpdateTime, setLastUpdateTime] = useState<string>('')

  // 格式化時間的函數
  const formatUpdateTime = useCallback(() => {
    return format(new Date(), 'yyyy/MM/dd HH:mm:ss')
  }, [])

  // 初始化資料
  useEffect(() => {
    const { train, live, stationNames } = trainData;
    
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

    if (Array.isArray(train.stopTimes)) {
      setTimeTable(train.stopTimes.map((item: any) => ({
        sequence: item.seq,
        station: stationNames[item.stationId] || item.stationId,
        stationId: item.stationId,
        arrival: item.arrivalTime,
        departure: item.departureTime
      })));
    }

    setLiveData(live);
    setLastUpdateTime(formatUpdateTime());
    setAutoRefresh(true);
    setRefreshCountdown(30);
  }, [trainData, trainNo, formatUpdateTime]);

  // 取得延誤狀態文字
  const getDelayStatus = useCallback((stationId: string, arrivalTime: string) => {
    if (!liveData) return '-';
    
    const key = `${trainNo}_${stationId}`;
    
    // 先檢查是否為下一站
    if (liveData.stationLiveMap[key] === 0) {
      return '下一站';
    }
    
    const currentTime = new Date();
    const arrivalDateTime = new Date();
    const [hours, minutes] = arrivalTime.split(':').map(Number);
    arrivalDateTime.setHours(hours, minutes, 0);
    
    // 再檢查時間
    if (currentTime < arrivalDateTime) {
      return '-';
    }
    
    // 最後檢查延誤狀態
    const delay = liveData.trainLiveMap[key];
    
    if (delay === undefined) return '-';
    if (delay === 0) return '準點';
    if (delay === 1) return '晚1分';
    if (delay === 2) return '晚2分';
    return `晚${delay}分`;
  }, [liveData, trainNo]);

  // 取得狀態顏色
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case '準點':
        return 'text-green-600';
      case '下一站':
        return 'text-blue-600 font-medium';
      case '-':
        return 'text-gray-400';
      default:
        return 'text-red-600';
    }
  }, []);

  // 自動更新功能
  const fetchLatestData = useCallback(async () => {
    try {
      const liveResponse = await fetch(`/api/taiwanhelper/api/get-train-live?no=${trainNo}`);
      if (!liveResponse.ok) throw new Error('無法取得列車狀態');
      const newLiveData = await liveResponse.json();
      setLiveData(newLiveData);
      setLastUpdateTime(formatUpdateTime());
      setRefreshCountdown(30);
    } catch (error) {
      console.error('更新失敗:', error);
      setAutoRefresh(false);
    }
  }, [trainNo, formatUpdateTime]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let countdownTimer: NodeJS.Timeout;

    if (autoRefresh) {
      // 倒數計時器
      countdownTimer = setInterval(() => {
        setRefreshCountdown(prev => {
          if (prev <= 1) {
            fetchLatestData();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);

      // 更新計時器
      timer = setInterval(fetchLatestData, 30000);
    }

    return () => {
      clearInterval(timer);
      clearInterval(countdownTimer);
    };
  }, [autoRefresh, fetchLatestData]);

  // 新增一個函數來獲取車站代碼
  const getStationId = useCallback((stationName: string) => {
    // 反轉 stationNames 物件來查找車站代碼
    const stationEntries = Object.entries(trainData.stationNames)
    const station = stationEntries.find(([_, name]) => name === stationName)
    return station ? station[0] : null
  }, [trainData.stationNames])

  // 修改 getStationStatus 函數
  const getStationStatus = useCallback((item: TrainTimeTableItem, liveData: LiveData | null) => {
    if (!liveData) return '-';
    
    // 檢查是否為下一站 - 使用 stationLiveMap 判斷
    const stationKey = `${trainNo}_${item.stationId}`;
    if (liveData.stationLiveMap[stationKey] === 0) {
      return '下一站';
    }
    
    // 獲取延誤狀態
    const delay = liveData.trainLiveMap[stationKey];
    
    // 檢查是否已經過站
    const currentTime = new Date();
    const departureTime = new Date();
    const [hours, minutes] = item.departure.split(':').map(Number);
    departureTime.setHours(hours, minutes, 0);
    
    if (currentTime < departureTime) {
      return '-';
    }
    
    if (delay === undefined) return '-';
    if (delay === 0) return '準點';
    if (delay === 1) return '晚1分';
    if (delay === 2) return '晚2分';
    return `晚${delay}分`;
  }, [trainNo]);

  // 修改處理點擊站名的函數
  const handleStationClick = (stationId: string) => {
    // 保存當前查詢結果和分頁狀態到 localStorage
    localStorage.setItem('previousTrainData', JSON.stringify({
      trainData,
      trainNo,
      activeTab: 'trainNo' // 記錄當前是在車次查詢分頁
    }))
    
    // 導航到車站頁面
    router.push(`/station/${stationId}`)
  }

  return (
    <div className="space-y-4">
      {/* 更新時間和倒數計時 */}
      {liveData && (
        <div className="flex justify-between items-center text-base text-gray-500 bg-white p-4 rounded-lg shadow">
          <div>
            {autoRefresh && (
              <span className="text-blue-600">
                {refreshCountdown} 秒後重新整理
              </span>
            )}
          </div>
          <div>
            最後更新: {lastUpdateTime}
          </div>
        </div>
      )}

      {/* 基本資訊和時刻表 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 基本資訊 */}
        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Info className="w-6 h-6 text-blue-500" />
            <h3 className="font-bold text-xl">基本資訊</h3>
          </div>
          <div className="space-y-4 text-base sm:text-lg">
            {trainInfo && (
              <>
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
              </>
            )}
          </div>
        </Card>

        {/* 時刻表 */}
        <Card className="p-4 sm:p-6 lg:col-span-2">
          <div className="flex items-center space-x-2 mb-4 sm:mb-6">
            <Clock className="w-6 h-6 text-blue-500" />
            <h3 className="font-bold text-xl">時刻表</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 border">順序</th>
                  <th className="px-4 py-2 border">站名</th>
                  <th className="px-4 py-2 border">到達</th>
                  <th className="px-4 py-2 border">離開</th>
                  <th className="px-4 py-2 border">狀態</th>
                </tr>
              </thead>
              <tbody>
                {timeTable.map((item, index) => {
                  const status = getStationStatus(item, liveData);
                  const isNextStation = status === '下一站';  // 使用 status 來判斷是否為下一站
                  const stationId = getStationId(item.station);

                  return (
                    <tr 
                      key={index} 
                      className={`${isNextStation ? 'bg-blue-50' : ''} hover:bg-gray-50`}
                    >
                      <td className={`px-4 py-3 text-base sm:text-lg text-center ${
                        isNextStation ? 'font-medium' : ''
                      }`}>
                        {item.sequence}
                      </td>
                      <td className={`px-4 py-3 text-base sm:text-lg text-center ${
                        isNextStation ? 'font-medium' : ''
                      }`}>
                        {stationId ? (
                          <button 
                            onClick={() => handleStationClick(stationId)}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {item.station}
                          </button>
                        ) : (
                          item.station
                        )}
                      </td>
                      <td className={`px-4 py-3 text-base sm:text-lg text-center ${
                        isNextStation ? 'font-medium' : ''
                      }`}>
                        {item.arrival}
                      </td>
                      <td className={`px-4 py-3 text-base sm:text-lg text-center ${
                        isNextStation ? 'font-medium' : ''
                      }`}>
                        {item.departure}
                      </td>
                      <td className={`px-4 py-3 text-base sm:text-lg text-center ${getStatusColor(status)}`}>
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

      {/* 添加車輛編組資訊 */}
      <TrainFormationDisplay trainNo={trainNo} />
    </div>
  );
} 