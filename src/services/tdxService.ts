const TDX_AUTH_URL = 'https://tdx.transportdata.tw/auth/realms/TDXConnect/protocol/openid-connect/token'
const TDX_API_URL = 'https://tdx.transportdata.tw/api/basic/v3'

interface TrainSchedule {
  TrainNo: string;          // 車次號碼
  Direction: number;        // 行駛方向
  StartingStationID: string;// 起點車站代號
  StartingStationName: string;// 起點車站名稱
  EndingStationID: string;  // 終點車站代號
  EndingStationName: string;// 終點車站名稱
  DepartureTime: string;    // 離開時間
  ArrivalTime: string;      // 到達時間
  TrainTypeName: {
    Zh_tw: string;         // 車種中文名稱
  };
}

export async function getAuthorizationToken() {
  const response = await fetch(TDX_AUTH_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.TDX_CLIENT_ID!,
      client_secret: process.env.TDX_CLIENT_SECRET!,
    }),
  })

  const data = await response.json()
  return data.access_token
}

export async function searchTrainSchedule(fromStation: string, toStation: string, date: string) {
  const token = await getAuthorizationToken()
  
  const url = `${TDX_API_URL}/Rail/TRA/DailyTrainTimetable/OD/${fromStation}/to/${toStation}/${date}?$top=1000&$format=JSON`
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  const data = await response.json()
  return data.TrainTimetables as TrainSchedule[]
} 