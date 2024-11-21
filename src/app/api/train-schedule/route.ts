import { NextResponse } from 'next/server'
import { searchTrainSchedule } from '@/services/tdxService'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const fromStation = searchParams.get('from')
    const toStation = searchParams.get('to')
    const date = searchParams.get('date')

    if (!fromStation || !toStation || !date) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 })
    }

    const schedules = await searchTrainSchedule(fromStation, toStation, date)
    return NextResponse.json(schedules)
  } catch (error) {
    console.error('Search error:', error)
    return NextResponse.json({ error: 'Failed to fetch train schedules' }, { status: 500 })
  }
} 