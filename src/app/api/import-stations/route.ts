import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'


export async function POST(request: Request) {
  try {
    const { id } = await request.json() // 接收路線ID
    
    // 從 taiwanhelper API 獲取資料
    const response = await fetch(
      `https://taiwanhelper.com/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/line/${id}.json?id=${id}`
    )
    const data = await response.json()
    
    // 解構資料
    const { stations, line } = data.pageProps

    // 先儲存路線資料
    const { error: lineError } = await supabase
      .from('train_lines')
      .upsert({
        line_id: line.LineID,
        line_name_zh: line.LineNameZh,
        line_name_en: line.LineNameEn,
        line_section_name_zh: line.LineSectionNameZh,
        line_section_name_en: line.LineSectionNameEn,
        is_branch: line.IsBranch,
        update_time: line.UpdateTime
      })

    if (lineError) throw lineError

    // 儲存車站資料
    const { error: stationsError } = await supabase
      .from('train_stations')
      .upsert(
        stations.map((station: any) => ({
          station_id: station.StationID,
          station_name: station.StationName,
          sequence: station.Sequence,
          line_id: line.LineID,
          traveled_distance: station.TraveledDistance
        }))
      )

    if (stationsError) throw stationsError

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported ${stations.length} stations for line ${line.LineNameZh}`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import stations data' },
      { status: 500 }
    )
  }
} 