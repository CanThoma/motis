import React, {useState} from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";

import {
  GroupedPassengerGroups,
  GroupsInTripSection, PaxMonGetInterchangesRequest,
  PaxMonGroupByStation,
  PaxMonGroupFilter,
} from "./api/protocol/motis/paxmon";
import {
  queryKeys,
  sendPaxMonTripLoadInfosRequest,
  usePaxMonFindTripsQuery, usePaxMonGetInterchangesQuery,
  usePaxMonGroupsInTripQuery,
  usePaxMonStatusQuery
} from "./api/paxmon";
import {useAtom} from "jotai";
import {universeAtom} from "./data/simulation";
import {QueryClient, QueryClientProvider, useQuery} from "react-query";
import {Station, Trip, TripId} from "./api/protocol/motis";
import TripDetails from "./components/TripDetails";
import {addEdgeStatistics} from "./util/statistics";
import {group} from "d3";
import {GroupByDirection} from "./components/CombinedGroup";
import {formatLongDateTime} from "./util/dateFormat";
import StationPicker from "./components/StationPicker";
import {LinkMinimal, NodeMinimal, SankeyInterfaceMinimal} from "./components/SankeyTypes";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});

export type StationInterchangeParameters = {
  stationId:string;
  startTime: number;
  endTime: number;
  maxCount: number;
};
type ExtTripId = TripId & {arrival_time: number|null; departure_time: number|null};
function ToExtTripId(tripId: TripId) : ExtTripId {
  let extTripId :ExtTripId= {
    time: tripId.time,
    train_nr: tripId.train_nr,
    target_station_id: tripId.target_station_id,
    station_id: tripId.station_id,
    line_id : tripId.line_id,
    target_time: tripId.target_time,
    arrival_time: null,
    departure_time: null,
  }
  return extTripId;
};
function ExtractStationData(params:StationInterchangeParameters) : SankeyInterfaceMinimal {
  let graph :SankeyInterfaceMinimal = {
    nodes: [],
    links: []
  };
  const [universe] = useAtom(universeAtom);
  const interchangeRequest : PaxMonGetInterchangesRequest = {
    start_time: params.startTime, // 25.10.2021 - 9:00
    end_time: params.endTime, // 25.10.2021 - 9:30
    station: params.stationId, // Lausanne
    include_meta_stations: false,
    include_group_infos: true,
    max_count: params.maxCount,
    universe: universe
  };
  const {data} = usePaxMonGetInterchangesQuery(interchangeRequest);
  let interchangingTripsInStation : ExtTripId[] = [];
  let sameTripId = (tripIdA : ExtTripId,tripIdB : ExtTripId) => {
    return tripIdA.time == tripIdB.time &&
      tripIdA.train_nr == tripIdB.train_nr &&
      tripIdA.target_station_id == tripIdB.target_station_id &&
      tripIdA.station_id == tripIdB.station_id &&
      tripIdA.line_id == tripIdB.line_id &&
      tripIdA.target_time == tripIdB.target_time;
  }
  if(data) {
    for(let interchange of data.interchanges)
    {
      console.log("arrival: " + interchange.arrival.length + " | departure: " + interchange.departure.length)

      let arrivingStationIndex = -1;
      let departureStationIndex = -1;

      if(interchange.arrival.length == 0 && interchange.departure.length == 0)
      {
        // error message? interchange has NO arrival or departure
        continue;
      }
      /* Get arrival point */
      if(interchange.arrival.length < 1)
      {
        // edge case if motis ever bugs, starting trip here => arrival stays "boarding"
      }
      else if(interchange.arrival.length == 1)
      {
        // zwischenstop/endstop
        let arrivalInfo = interchange.arrival[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if(arrivalInfo.trips.length != 1)
          continue;
        //"boarding" group, when arrival train is out of time range
        if(arrivalInfo.schedule_time < params.startTime)
          continue;
        else {
          let trip = arrivalInfo.trips[0];
          arrivingStationIndex = interchangingTripsInStation.findIndex((tripId) => {return sameTripId(tripId,ToExtTripId(trip.trip));});
          let foundTripsInStation = interchangingTripsInStation[arrivingStationIndex];
          if(!foundTripsInStation)
          {
            let exttid = ToExtTripId(trip.trip);
            exttid.arrival_time = arrivalInfo.schedule_time;
            interchangingTripsInStation.push(exttid);
          }
          else {
            foundTripsInStation.arrival_time = arrivalInfo.schedule_time;
          }
        }
      }
      else {
        // error!! this shouldnt happen
        continue;
      }

      /* Get departure point */

      if(interchange.departure.length < 1)
      {
        // edge case if motis ever bugs, endstation => "target" = exiting
      }
      else if(interchange.departure.length == 1)
      {
        //zwischenstop/start
        let departureInfo = interchange.departure[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if(departureInfo.trips.length != 1)
          continue;
        //"exiting" group, when arrival train is out of time range. this shouldn't happen from how the query works though
        if(departureInfo.schedule_time > params.endTime) {
          //console.log("schedule time of departure train is outside of end time. This shouldn't happen from how the query functions. departureInfo.schedule_time " +
          // formatLongDateTime(departureInfo.schedule_time) + " params.endTime " + formatLongDateTime(params.endTime));
          continue;
        }
        else {
          let trip = departureInfo.trips[0];
          departureStationIndex = interchangingTripsInStation.findIndex((tripId) => {return sameTripId(tripId,ToExtTripId(trip.trip));});
          let foundTripsInStation = interchangingTripsInStation[departureStationIndex];
          if(!foundTripsInStation)
          {
            let exttid = ToExtTripId(trip.trip);
            exttid.departure_time = departureInfo.schedule_time;
            interchangingTripsInStation.push(exttid);
          }
          else {
            foundTripsInStation.departure_time = departureInfo.schedule_time;
          }
        }
      }
      else {
        // error!!
        continue;
      }

      /* take care of the links from the data we now gained */
      let link : LinkMinimal = {
        id: graph.links.length,
        value: interchange.groups.max_passenger_count,
        source: arrivingStationIndex === -1 ? "boarding" : arrivingStationIndex.toString(),
        target: departureStationIndex === -1 ? "exiting" : departureStationIndex.toString()
      };
      graph.links.push(link);
    }
  }


  for(let trips of interchangingTripsInStation) {
    let node :NodeMinimal = {
      id: graph.nodes.length.toString(),
      name: trips.train_nr.toString(),
      sId: "TBI",
      arrival_time:trips.arrival_time?trips.arrival_time:0,
      departure_time:trips.departure_time?trips.departure_time:0,
      capacity: 999 // TODO: TBI
    };
    graph.nodes.push(node);
  }

  graph.nodes.sort((a,b)=>{
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if(a.departure_time == null && b.departure_time == null)
      return 0;
    else if(a.departure_time == null)
      return -1;
    else if(b.departure_time == null)
      return 1;
    /* number comparators */
    else if(a.departure_time < b.departure_time)
      return -1;
    else if(a.departure_time > b.departure_time)
      return 1;
    else
      return 0;
  });
  graph.nodes.sort((a,b)=>{
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if(a.arrival_time == null && b.arrival_time == null)
      return 0;
    else if(a.arrival_time == null)
      return -1;
    else if(b.arrival_time == null)
      return 1;
    /* number comparators */
    else if(a.arrival_time < b.arrival_time)
      return -1;
    else if(a.arrival_time > b.arrival_time)
      return 1;
    else
      return 0;
  });
  return graph;
}
function StationInterchangesDisplay(params:StationInterchangeParameters) : JSX.Element {
  const [universe] = useAtom(universeAtom);
  const interchangeRequest : PaxMonGetInterchangesRequest = {
    start_time: params.startTime, // 25.10.2021 - 9:00
    end_time: params.endTime, // 25.10.2021 - 9:30
    station: params.stationId, // Lausanne
    include_meta_stations: false,
    include_group_infos: true,
    max_count: params.maxCount,
    universe: universe
  };
  const {data} = usePaxMonGetInterchangesQuery(interchangeRequest);
  let interchangingTripsInStation : ExtTripId[] = [];
  let sameTripId = (tripIdA : ExtTripId,tripIdB : ExtTripId) => {
    return tripIdA.time == tripIdB.time &&
      tripIdA.train_nr == tripIdB.train_nr &&
      tripIdA.target_station_id == tripIdB.target_station_id &&
      tripIdA.station_id == tripIdB.station_id &&
      tripIdA.line_id == tripIdB.line_id &&
      tripIdA.target_time == tripIdB.target_time;
  }
  let links : LinkMinimal[] = [];
  if(data) {
    for(let interchange of data.interchanges)
    {
      console.log("arrival: " + interchange.arrival.length + " | departure: " + interchange.departure.length)

      let arrivingStationIndex = -1;
      let departureStationIndex = -1;

      if(interchange.arrival.length == 0 && interchange.departure.length == 0)
      {
        // error message? interchange has NO arrival or departure
        continue;
      }
      /* Get arrival point */
      if(interchange.arrival.length < 1)
      {
        // edge case if motis ever bugs, starting trip here => arrival stays "boarding"
      }
      else if(interchange.arrival.length == 1)
      {
        // zwischenstop/endstop
        let arrivalInfo = interchange.arrival[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if(arrivalInfo.trips.length != 1)
          continue;
        //"boarding" group, when arrival train is out of time range
        if(arrivalInfo.schedule_time < params.startTime)
          continue;
        else {
          let trip = arrivalInfo.trips[0];
          arrivingStationIndex = interchangingTripsInStation.findIndex((tripId) => {return sameTripId(tripId,ToExtTripId(trip.trip));});
          let foundTripsInStation = interchangingTripsInStation[arrivingStationIndex];
          if(!foundTripsInStation)
          {
            let exttid = ToExtTripId(trip.trip);
            exttid.arrival_time = arrivalInfo.schedule_time;
            interchangingTripsInStation.push(exttid);
          }
          else {
            foundTripsInStation.arrival_time = arrivalInfo.schedule_time;
          }
        }
      }
      else {
        // error!! this shouldnt happen
        continue;
      }

      /* Get departure point */

      if(interchange.departure.length < 1)
      {
        // edge case if motis ever bugs, endstation => "target" = exiting
      }
      else if(interchange.departure.length == 1)
      {
        //zwischenstop/start
        let departureInfo = interchange.departure[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if(departureInfo.trips.length != 1)
          continue;
        //"exiting" group, when arrival train is out of time range. this shouldn't happen from how the query works though
        if(departureInfo.schedule_time > params.endTime) {
          //console.log("schedule time of departure train is outside of end time. This shouldn't happen from how the query functions. departureInfo.schedule_time " +
           // formatLongDateTime(departureInfo.schedule_time) + " params.endTime " + formatLongDateTime(params.endTime));
          continue;
        }
        else {
          let trip = departureInfo.trips[0];
          departureStationIndex = interchangingTripsInStation.findIndex((tripId) => {return sameTripId(tripId,ToExtTripId(trip.trip));});
          let foundTripsInStation = interchangingTripsInStation[departureStationIndex];
          if(!foundTripsInStation)
          {
            let exttid = ToExtTripId(trip.trip);
            exttid.departure_time = departureInfo.schedule_time;
            interchangingTripsInStation.push(exttid);
          }
          else {
            foundTripsInStation.departure_time = departureInfo.schedule_time;
          }
        }
      }
      else {
        // error!!
        continue;
      }

      /* take care of the links from the data we now gained */
      let link : LinkMinimal = {
        id: links.length,
        value: interchange.groups.max_passenger_count,
        source: arrivingStationIndex === -1 ? "boarding" : arrivingStationIndex.toString(),
        target: departureStationIndex === -1 ? "exiting" : departureStationIndex.toString()
      };
      links.push(link);
    }
  }

  let nodes : NodeMinimal[] = [];

  for(let trips of interchangingTripsInStation) {
    let node :NodeMinimal = {
      id: nodes.length.toString(),
      name: trips.train_nr.toString(),
      sId: "TBI",
      arrival_time:trips.arrival_time?trips.arrival_time:0,
      departure_time:trips.departure_time?trips.departure_time:0,
      capacity: 999 // TODO: TBI
    };
    nodes.push(node);
  }

  nodes.sort((a,b)=>{
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if(a.departure_time == null && b.departure_time == null)
      return 0;
    else if(a.departure_time == null)
      return -1;
    else if(b.departure_time == null)
      return 1;
    /* number comparators */
    else if(a.departure_time < b.departure_time)
      return -1;
    else if(a.departure_time > b.departure_time)
      return 1;
    else
      return 0;
  });
  nodes.sort((a,b)=>{
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if(a.arrival_time == null && b.arrival_time == null)
      return 0;
    else if(a.arrival_time == null)
      return -1;
    else if(b.arrival_time == null)
      return 1;
    /* number comparators */
    else if(a.arrival_time < b.arrival_time)
      return -1;
    else if(a.arrival_time > b.arrival_time)
      return 1;
    else
      return 0;
  });
  return (
    <div>
      <div>
        <h1>Links count: {links.length}</h1>
        {links.map((val) => (
          <div>id={val.id} value={val.value} source={val.source} target={val.target}</div>
        ))}
      </div>
      <div>
        <h1>Interchange Count: {interchangingTripsInStation.length}</h1>
        {interchangingTripsInStation.map((x)=>(<div>{x.train_nr} ===
            Arrival: {x.arrival_time &&formatLongDateTime(x.arrival_time)} ===
          Departure: {x.departure_time &&formatLongDateTime(x.departure_time)}</div>
        ))}
      </div>
      {data?.station.name}
      {data?.interchanges.map((pmIntInfo) => (
        <div>===================<br/>Max Passenger Count: {pmIntInfo.groups.max_passenger_count}<br/>
          Groups: {pmIntInfo.groups.groups.map((pmGInfo) => (<div></div>))}<br/>
          Arrival: {pmIntInfo.arrival.map((tripStopInfo) =>
            (<div>{formatLongDateTime(tripStopInfo.schedule_time)}<br/>
            Train Number: {tripStopInfo.trips.map((tripServiceInfo)=>(tripServiceInfo.trip.train_nr))}</div>))}<br/>
          Departure: {pmIntInfo.departure.map((tripStopInfo) =>
            (<div>{formatLongDateTime(tripStopInfo.schedule_time)}<br/>
              Train Number: {tripStopInfo.trips.map((tripServiceInfo)=>(tripServiceInfo.trip.train_nr))}</div>))}<br/>
          <br/>
        </div>))}
    </div>
  )

}
type TestEnvParams = {
  stationId : string;
}
function TestEnv() : JSX.Element{
  const [station,setStation] = useState<string>();
  var someDate = new Date('Mon, 25 Oct 2021 09:15:00 GMT+2');
  var theUnixTime = someDate.getTime() / 1000;
  const startTime = theUnixTime-theUnixTime%1800; // dd-mm-yy 9:19 -> dd-mm-yy 9:00 ( this example timestamp 25-10-2021 9:15)
  const endTime = startTime + 15*60; // dd-mm-yy 9:30
  const StationInterchangesDisplayItem = station !== undefined?<StationInterchangesDisplay
                                          stationId={station}
                                          startTime={startTime}
                                          endTime={endTime}
                                          maxCount={0}/>:null;
  return (<div>
    <StationPicker onStationPicked={(station)=>{setStation(station?.id)}} clearOnPick={false}></StationPicker>
    {StationInterchangesDisplayItem} </div>);
}
ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TestEnv ></TestEnv>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
