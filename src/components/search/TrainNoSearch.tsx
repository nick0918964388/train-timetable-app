'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getStationNameMap } from '@/services/stationService'
import TrainInfoDisplay from './TrainInfoDisplay'

interface TrainNoSearchProps {
  hasPreviousData?: boolean;
}

export default function TrainNoSearch({ hasPreviousData }: TrainNoSearchProps) {
  const [trainNo, setTrainNo] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trainData, setTrainData] = useState<any>(null)
  const [stationNames, setStationNames] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadStationNames() {
      const nameMap = await getStationNameMap()
      setStationNames(nameMap)
    }
    loadStationNames()

    // 檢查是否有之前的查詢結果
    if (hasPreviousData) {
      const previousData = localStorage.getItem('previousTrainData')
      if (previousData) {
        try {
          const { trainData: savedTrainData, trainNo: savedTrainNo } = JSON.parse(previousData)
          if (savedTrainData && savedTrainNo) {
            setTrainData(savedTrainData)
            setTrainNo(savedTrainNo)
          }
          // 清除 localStorage
          localStorage.removeItem('previousTrainData')
        } catch (error) {
          console.error('Error parsing previousTrainData:', error)
        }
      }
    }
  }, [hasPreviousData])

  // 處理搜尋按鈕點擊
  const handleSearch = async () => {
    if (!trainNo) return;
    
    try {
      setIsLoading(true);
      setError(null);
      
      const detailResponse = await fetch(
        `/api/taiwanhelper/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/train/${trainNo}.json?id=${trainNo}`
      );
      if (!detailResponse.ok) throw new Error('無法取得列車資料');
      const detailData = await detailResponse.json();
      
      if (!detailData?.pageProps?.train) {
        throw new Error('找不到該車次資料');
      }

      // 獲取即時狀態
      const liveResponse = await fetch(`/api/taiwanhelper/api/get-train-live?no=${trainNo}`);
      if (!liveResponse.ok) throw new Error('無法取得列車狀態');
      const liveData = await liveResponse.json();

      // 設置所有資料
      setTrainData({
        train: detailData.pageProps.train,
        live: liveData,
        stationNames
      });

    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試');
      setTrainData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 添加處理按鍵事件的函數
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !isLoading && trainNo) {
      handleSearch()
    }
  }

  return (
    <div className="space-y-6">
      {/* 搜尋區塊 */}
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="space-y-4">
          <Input 
            placeholder="請輸入車次" 
            value={trainNo}
            onChange={(e) => setTrainNo(e.target.value)}
            onKeyDown={handleKeyDown}
            className="text-center text-lg h-12"
          />
          
          <Button 
            className="w-full h-14 bg-blue-800 hover:bg-blue-900 text-white text-xl"
            onClick={handleSearch}
            disabled={isLoading || !trainNo}
          >
            {isLoading ? '查詢中...' : '查詢'}
          </Button>

          {error && (
            <div className="text-red-500 text-base p-2 bg-red-50 rounded">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* 顯示區塊 */}
      {trainData && (
        <TrainInfoDisplay 
          trainData={trainData}
          trainNo={trainNo}
        />
      )}
    </div>
  )
} 