export interface TrainInfo {
  trainNo: string
  trainType: string
  startStation: string
  endStation: string
  direction: string
  note: string
  runningDays: string
  remarks: string
}

export interface TimeTableItem {
  sequence: number
  station: string
  arrivalTime: string
  departureTime: string
  delay: string | null
}

export interface SearchResult {
  trainNo: string
  trainType: string
  startStation: string
  endStation: string
  departureTime: string
  arrivalTime: string
  duration: string
} 