'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import TrainInfoDisplay from '@/components/search/TrainInfoDisplay'
import { Button } from '@/components/ui/button'
import { getStationNameMap } from '@/services/stationService'

export default function TrainDetailPage() {
  const params = useParams()
  const [trainData, setTrainData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadData() {
      if (!params.trainNo) return

      try {
        setIsLoading(true)
        setError(null)

        // 先獲取站名對照表
        const stationNames = await getStationNameMap()

        // 獲取列車詳細資訊
        const detailResponse = await fetch(
          `/api/taiwanhelper/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/train/${params.trainNo}.json?id=${params.trainNo}`
        )
        if (!detailResponse.ok) throw new Error('無法取得列車資料')
        const detailData = await detailResponse.json()
        
        if (!detailData?.pageProps?.train) {
          throw new Error('找不到該車次資料')
        }

        // 獲取即時狀態
        const liveResponse = await fetch(`/api/taiwanhelper/api/get-train-live?no=${params.trainNo}`)
        if (!liveResponse.ok) throw new Error('無法取得列車狀態')
        const liveData = await liveResponse.json()

        // 設置所有資料，確保包含站名對照表
        setTrainData({
          train: {
            ...detailData.pageProps.train,
            // 如果需要轉換其他站名，可以在這裡加入
          },
          live: liveData,
          stationNames // 加入站名對照表
        })

      } catch (err) {
        console.error('Error fetching train detail:', err)
        setError(err instanceof Error ? err.message : '發生錯誤')
      } finally {
        setIsLoading(false)
      }
    }

    loadData()
  }, [params.trainNo])

  if (isLoading) {
    return <div className="p-4">載入中...</div>
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>
  }

  if (!trainData) {
    return <div className="p-4">找不到列車資料</div>
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">
            {params.trainNo} 次列車時刻表
          </h1>
          <Link href="/">
            <Button 
              variant="outline"
              onClick={() => {
                const previousSearch = localStorage.getItem('previousStationSearch')
                if (previousSearch) {
                  localStorage.setItem('restoreStationSearch', previousSearch)
                  localStorage.removeItem('previousTrainData')
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              返回查詢
            </Button>
          </Link>
        </div>

        <TrainInfoDisplay 
          trainData={trainData}
          trainNo={params.trainNo as string}
        />
      </div>
    </div>
  )
} 