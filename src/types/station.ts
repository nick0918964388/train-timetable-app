export interface TrainLine {
  lineId: string;
  lineNameZh: string;
  lineNameEn: string;
  lineSectionNameZh: string;
  lineSectionNameEn: string;
  isBranch: boolean;
  updateTime: string;
}

export interface TrainStation {
  stationId: string;
  stationName: string;
  sequence: number;
  lineId: string;
  traveledDistance: number;
}

export interface StationDetail {
  id: string;
  uid: string;
  name: string;
  nameEn: string;
  longitude: number;
  latitude: number;
  address: string;
  phone: string;
  stationClass: string;
  url: string;
}

export interface TrainBasicInfo {
  trainNo: string;
  trainType: string;
  startStation: string;
  startTime: string;
  endStation: string;
  endTime: string;
  direction: string;
  note: string;
  runningDays: string;
  remarks: string[];
}

export interface TrainTimeTableItem {
  sequence: number;
  station: string;
  stationId: string;
  arrival: string;
  departure: string;
}

export interface LiveData {
  liveUpdateTime: string;
  trainLiveMap: Record<string, number>;
  stationLiveMap: Record<string, number>;
} 