import { supabase } from '@/lib/supabase'

export interface Station {
  station_id: string;
  station_name: string;
  line_id: string;
  sequence: number;
  traveled_distance: number;
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
    const { data, error } = await supabase
      .from('train_stations')
      .select('*')
      .order('station_name')

    if (error) throw error
    return data || []
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