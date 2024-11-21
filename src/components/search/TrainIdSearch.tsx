'use client'
import { useState } from 'react'
import { DatePicker } from '@/components/ui/date-picker'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export default function TrainIdSearch() {
  const [searchResults, setSearchResults] = useState(null)
  const [selectedDate, setSelectedDate] = useState<Date>()
  const [trainId, setTrainId] = useState('')

  const handleSearch = async () => {
    // TODO: 實作API查詢邏輯
    console.log('搜尋:', { selectedDate, trainId })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatePicker 
          placeholder="選擇日期"
          date={selectedDate}
          onChange={setSelectedDate}
        />
        <Input 
          placeholder="請輸入車號" 
          value={trainId}
          onChange={(e) => setTrainId(e.target.value)}
        />
      </div>
      
      <Button className="w-full" onClick={handleSearch}>查詢</Button>
      
      {searchResults && (
        <div className="mt-4">
          {/* 搜尋結果 */}
        </div>
      )}
    </div>
  )
} 