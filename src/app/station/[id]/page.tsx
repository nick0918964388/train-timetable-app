'use client'
import { useParams, useRouter } from 'next/navigation'
import TitleBar from '@/components/layout/TitleBar'
import StationInfoCard from '@/components/station/StationInfoCard'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
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
      <main className="container mx-auto px-4 pt-8">
        {hasPreviousData && (
          <Button
            onClick={handleBack}
            variant="default"
            className="mb-6 flex items-center space-x-3 text-lg bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 h-14 rounded-lg shadow-md hover:shadow-lg transition-all duration-200"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>返回查詢結果</span>
          </Button>
        )}
        <div className="flex justify-center">
          <StationInfoCard stationId={params.id as string} />
        </div>
      </main>
    </div>
  )
}

export default StationPage 