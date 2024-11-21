'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import TitleBar from '@/components/layout/TitleBar'
import SearchCard from '@/components/search/SearchCard'
import ImportStations from '@/components/admin/ImportStations'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <TitleBar />
      <ImportStations />
      <main className="flex items-center justify-center pt-8">
        <SearchCard />
      </main>
    </div>
  )
}
