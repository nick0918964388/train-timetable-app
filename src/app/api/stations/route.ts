import { NextResponse } from 'next/server'

const STATIONS_DATA = {
  "stations": [
    {
      "Sequence": 1,
      "StationID": "3430",
      "StationName": "二水",
      "TraveledDistance": 0
    },
    {
      "Sequence": 2,
      "StationID": "3431",
      "StationName": "源泉",
      "TraveledDistance": 2.9
    },
    {
      "Sequence": 3,
      "StationID": "3432",
      "StationName": "濁水",
      "TraveledDistance": 10.8
    },
    {
      "Sequence": 4,
      "StationID": "3433",
      "StationName": "龍泉",
      "TraveledDistance": 15.7
    },
    {
      "Sequence": 5,
      "StationID": "3434",
      "StationName": "集集",
      "TraveledDistance": 20.1
    },
    {
      "Sequence": 6,
      "StationID": "3435",
      "StationName": "水里",
      "TraveledDistance": 27.4
    },
    {
      "Sequence": 7,
      "StationID": "3436",
      "StationName": "車埕",
      "TraveledDistance": 29.7
    }
  ],
  "line": {
    "LineNo": "",
    "LineID": "JJ",
    "LineNameZh": "集集線",
    "LineNameEn": "Jiji Line",
    "LineSectionNameZh": "二水-車埕",
    "LineSectionNameEn": "Ershui-Checheng",
    "IsBranch": true,
    "UpdateTime": "2022-09-20T01:09:52+08:00"
  }
}

export async function GET() {
  try {
    return NextResponse.json(STATIONS_DATA)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch stations data' },
      { status: 500 }
    )
  }
} 