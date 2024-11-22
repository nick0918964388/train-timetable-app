import { supabase } from '@/lib/supabase'

export interface Station {
  station_id: string;
  station_name: string;
  address?: string;
  city?: string;
}

export interface StationDetail {
  station_id: string;
  station_name: string;
  station_name_en: string;
  address: string;
  phone: string;
  longitude: number;
  latitude: number;
}

export async function fetchAllStations(): Promise<Station[]> {
  try {
    const { data: stationData, error: stationError } = await supabase
      .from('train_station_details')
      .select('station_id, station_name, address')
      .order('station_name')

    if (stationError) throw stationError

    const stations = stationData.map(station => {
      let city = ''
      if (station.address) {
        const cityMatches = station.address.match(
          /(臺北市|新北市|基隆市|宜蘭縣|桃園市|新竹市|新竹縣|苗栗縣|台中市|彰化縣|南投縣|雲林縣|嘉義市|嘉義縣|台南市|高雄市|屏東縣|台東縣|花蓮縣)/
        )
        if (cityMatches) {
          city = cityMatches[1]
        }
      }

      return {
        station_id: station.station_id,
        station_name: station.station_name,
        address: station.address,
        city: city
      }
    })

    return stations
  } catch (error) {
    console.error('Error fetching stations:', error)
    throw error
  }
}

export async function fetchStationDetails(stationId: string): Promise<StationDetail | null> {
  try {
    const { data, error } = await supabase
      .from('train_station_details')
      .select('*')
      .eq('station_id', stationId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching station details:', error)
    return null
  }
}

export async function getStationNameMap(): Promise<Record<string, string>> {
  try {
    const { data, error } = await supabase
      .from('train_stations')
      .select('station_id, station_name')

    if (error) throw error

    return (data || []).reduce((acc, station) => {
      acc[station.station_id] = station.station_name
      return acc
    }, {} as Record<string, string>)
  } catch (error) {
    console.error('Error fetching station names:', error)
    return {}
  }
} 