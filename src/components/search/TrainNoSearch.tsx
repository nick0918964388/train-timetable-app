'use client'
import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getStationNameMap } from '@/services/stationService'
import TrainInfoDisplay from './TrainInfoDisplay'

interface TrainNoSearchProps {
  initialState?: {
    trainNo?: string;
    trainData?: any;
  };
  onSearchResult?: (data: any) => void;
  hasPreviousData?: boolean;
}

export default function TrainNoSearch({ 
  initialState, 
  onSearchResult,
  hasPreviousData 
}: TrainNoSearchProps) {
  const [trainNo, setTrainNo] = useState(initialState?.trainNo || '')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [trainData, setTrainData] = useState<any>(initialState?.trainData || null)
  const [stationNames, setStationNames] = useState<Record<string, string>>({})

  useEffect(() => {
    async function loadStationNames() {
      const nameMap = await getStationNameMap()
      setStationNames(nameMap)
    }
    loadStationNames()
  }, [])

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
      const newTrainData = {
        train: detailData.pageProps.train,
        live: liveData,
        stationNames
      };
      
      setTrainData(newTrainData);
      
      // 通知父組件搜尋結果
      onSearchResult?.({
        trainNo,
        trainData: newTrainData
      });

    } catch (error) {
      console.error('Search error:', error);
      setError(error instanceof Error ? error.message : '查詢失敗，請稍後再試');
      setTrainData(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <div className="flex space-x-4">
        <input
          type="text"
          value={trainNo}
          onChange={(e) => setTrainNo(e.target.value)}
          placeholder="請輸入車次號碼"
          className="flex-1 h-12 px-4 border rounded-lg text-lg"
        />
        <Button
          onClick={handleSearch}
          disabled={isLoading || !trainNo}
          className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white text-lg"
        >
          {isLoading ? '查詢中...' : '查詢'}
        </Button>
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2 bg-red-50 rounded">
          {error}
        </div>
      )}

      {trainData && (
        <TrainInfoDisplay
          trainData={trainData}
          trainNo={trainNo}
        />
      )}
    </div>
  );
} 