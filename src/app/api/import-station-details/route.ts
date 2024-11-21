import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const { id } = await request.json()
    
    // 從 taiwanhelper API 獲取資料
    const response = await fetch(
      `https://taiwanhelper.com/_next/data/bsBsvlyiGDJiVhyivWDW6/railway/station/${id}.json?id=${id}`
    )
    const data = await response.json()
    
    const station = data.pageProps.station

    // 儲存車站基本資料
    const { error: stationError } = await supabase
      .from('train_station_details')
      .upsert({
        station_id: station.id,
        station_uid: station.uid,
        station_name: station.name,
        station_name_en: station.nameEn,
        longitude: station.longitude,
        latitude: station.latitude,
        address: station.address,
        phone: station.phone,
        station_class: station.stationClass,
        url: station.url,
        updated_at: new Date().toISOString()
      })

    if (stationError) throw stationError

    // 儲存車站出口資料
    if (station.exits && station.exits.length > 0) {
      const { error: exitsError } = await supabase
        .from('train_station_exits')
        .upsert(
          station.exits.map((exit: any) => ({
            id: exit.id,
            station_id: station.id,
            exit_name: exit.name,
            longitude: exit.longitude,
            latitude: exit.latitude,
            location: exit.location,
            has_stair: exit.stair,
            has_escalator: exit.escalator,
            has_elevator: exit.elevator
          }))
        )

      if (exitsError) throw exitsError
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully imported station details for ${station.name}`
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: 'Failed to import station details' },
      { status: 500 }
    )
  }
} 