'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import TrainInfoDisplay from '@/components/search/TrainInfoDisplay'
import { ChevronLeft } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
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

        setTrainData({
          train: {
            ...detailData.pageProps.train,
          },
          live: liveData,
          stationNames
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

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto">
        <div className="relative h-14 flex items-center justify-center border-b bg-white shadow-sm">
          <Link 
            href="/"
            className="absolute left-4 flex items-center text-blue-500 hover:text-blue-600 transition-colors"
            onClick={() => {
              const previousSearch = localStorage.getItem('previousStationSearch')
              if (previousSearch) {
                localStorage.setItem('restoreStationSearch', previousSearch)
                localStorage.removeItem('previousTrainData')
              }
            }}
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-base">返回</span>
          </Link>
          
          <h1 className="text-lg font-medium">
            {params.trainNo} 次列車時刻表
          </h1>
        </div>

        <div className="p-4">
          {isLoading ? (
            // 載入中的骨架屏幕
            <div className="min-h-screen bg-gray-100">
              <div className="container mx-auto">
                {/* 標題列骨架屏幕 */}
                <div className="relative h-14 flex items-center justify-center border-b bg-white/80 backdrop-blur-sm shadow-sm">
                  <div className="absolute left-4 flex items-center text-blue-500">
                    <ChevronLeft className="w-5 h-5" />
                    <span className="text-base">返回</span>
                  </div>
                  <Skeleton className="h-6 w-48" />
                </div>

                <div className="p-4 space-y-4">
                  {/* 基本資訊骨架屏幕 */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="space-y-4">
                      <Skeleton className="h-8 w-1/4" />
                      <div className="space-y-3">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="flex justify-between">
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-6 w-1/2" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 時刻表骨架屏幕 */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <Skeleton className="h-8 w-1/4 mb-4" />
                    <div className="space-y-2">
                      {[...Array(8)].map((_, i) => (
                        <div key={i} className="flex justify-between items-center">
                          <Skeleton className="h-6 w-1/6" />
                          <Skeleton className="h-6 w-1/6" />
                          <Skeleton className="h-6 w-1/6" />
                          <Skeleton className="h-6 w-1/6" />
                          <Skeleton className="h-6 w-1/6" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 出車資訊骨架屏幕 */}
                  <div className="bg-white rounded-lg p-6 shadow-sm">
                    <Skeleton className="h-8 w-1/4 mb-4" />
                    <div className="flex flex-wrap gap-2">
                      {[...Array(6)].map((_, i) => (
                        <Skeleton key={i} className="h-10 w-24" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center p-8">
              <div className="bg-red-50 text-red-500 p-4 rounded-lg">
                {error}
              </div>
            </div>
          ) : !trainData ? (
            <div className="flex items-center justify-center p-8">
              <div className="text-gray-500">找不到列車資料</div>
            </div>
          ) : (
            <TrainInfoDisplay 
              trainData={trainData}
              trainNo={params.trainNo as string}
            />
          )}
        </div>
      </div>
    </div>
  )
} 