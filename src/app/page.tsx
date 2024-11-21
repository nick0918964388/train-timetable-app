'use client'
import React from 'react'
import TitleBar from '@/components/layout/TitleBar'
import SearchCard from '@/components/search/SearchCard'

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <TitleBar />
      <main className="flex items-center justify-center pt-8">
        <SearchCard />
      </main>
    </div>
  )
}
