'use client'
import { useParams, useRouter } from 'next/navigation'
import TitleBar from '@/components/layout/TitleBar'
import StationInfoCard from '@/components/station/StationInfoCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft, ChevronLeft } from 'lucide-react'
import { useEffect, useState } from 'react'

function StationPage() {
  const params = useParams()
  const router = useRouter()
  const [hasPreviousData, setHasPreviousData] = useState(false)

  useEffect(() => {
    const previousData = localStorage.getItem('previousTrainData')
    setHasPreviousData(!!previousData)
  }, [])

  const handleBack = () => {
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <TitleBar />
      {hasPreviousData && (
        <div className="relative h-14 flex items-center justify-center border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <button
            onClick={handleBack}
            className="absolute left-4 flex items-center text-blue-500 hover:text-blue-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-base">返回</span>
          </button>
          <h1 className="text-lg font-medium">車站資訊</h1>
        </div>
      )}
      <main className="container mx-auto px-4 pt-8">
        <div className="flex justify-center">
          <StationInfoCard stationId={params.id as string} />
        </div>
      </main>
    </div>
  )
}

export default StationPage 