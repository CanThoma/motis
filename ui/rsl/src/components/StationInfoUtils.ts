import { Trip, TripId } from "../api/protocol/motis";
import {
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
} from "./SankeyTypes";
import { useAtom } from "jotai";
import { universeAtom } from "../data/simulation";
import { PaxMonGetInterchangesRequest } from "../api/protocol/motis/paxmon";
import {
  queryKeys,
  usePaxMonGetInterchangesQuery,
  usePaxMonStatusQuery,
} from "../api/paxmon";
import { useQuery, useQueryClient } from "react-query";
import { loadAndProcessTripInfo } from "./TripInfoUtils";

export type StationInterchangeParameters = {
  stationId: string;
  startTime: number;
  endTime: number;
  maxCount: number;
};
type ExtTripId = TripId & {
  arrival_time: number | null;
  departure_time: number | null;
};
type NodeCapacityInfo = {
  cap: number;
  max_pax: number;
};
function SameExtTripId(extTripIdA: ExtTripId, extTripIdB: ExtTripId): boolean {
  return SameTripId(ToTripId(extTripIdA), ToTripId(extTripIdB));
}
function SameTripId(tripIdA: TripId, tripIdB: TripId): boolean {
  return (
    tripIdA.time == tripIdB.time &&
    tripIdA.train_nr == tripIdB.train_nr &&
    tripIdA.target_station_id == tripIdB.target_station_id &&
    tripIdA.station_id == tripIdB.station_id &&
    tripIdA.line_id == tripIdB.line_id &&
    tripIdA.target_time == tripIdB.target_time
  );
}
function ToTripId(extTripId: ExtTripId): TripId {
  const tripId: TripId = {
    time: extTripId.time,
    train_nr: extTripId.train_nr,
    target_station_id: extTripId.target_station_id,
    station_id: extTripId.station_id,
    line_id: extTripId.line_id,
    target_time: extTripId.target_time,
  };
  return tripId;
}
function ToExtTripId(tripId: TripId): ExtTripId {
  const extTripId: ExtTripId = {
    time: tripId.time,
    train_nr: tripId.train_nr,
    target_station_id: tripId.target_station_id,
    station_id: tripId.station_id,
    line_id: tripId.line_id,
    target_time: tripId.target_time,
    arrival_time: null,
    departure_time: null,
  };
  return extTripId;
}
enum TripDirection {
  FROM,
  TO,
}
export function ExtractThisStationTripInfo(
  universe: number,
  tripId: TripId,
  stationId: string,
  direction: TripDirection
): // return type
{
  from: NodeCapacityInfo | null;
  to: NodeCapacityInfo | null;
} {
  const { data: status } = usePaxMonStatusQuery();

  const queryClient = useQueryClient();
  const { data /*, isLoading, error*/ } = useQuery(
    queryKeys.tripLoad(universe, tripId),
    async () => loadAndProcessTripInfo(universe, tripId),
    {
      enabled: !!status,
      placeholderData: () => {
        return universe != 0
          ? queryClient.getQueryData(queryKeys.tripLoad(0, tripId))
          : undefined;
      },
    }
  );
  let thisStationFromEdge: NodeCapacityInfo | null = null;
  let thisStationToEdge: NodeCapacityInfo | null = null;
  if (!status || !data) {
    // error handling
  } else {
    let foundFromStation = data.edges.findIndex(
      (station) => station.from.id == stationId
    );
    if (foundFromStation == -1) {
      if (data.edges[data.edges.length - 1].to.id == stationId) {
        //TO station. last station
        let toStation = data.edges.length - 1;
        let lastEdge = data.edges[toStation];
        thisStationToEdge = {
          max_pax: lastEdge.max_pax,
          cap: lastEdge.capacity,
        };
      }
    } else {
      // its a FROM station information, assuming index != 0 => stationindex-1 = TO station information
      if (foundFromStation != 0) {
        let toStation = foundFromStation - 1;
        let toEdge = data.edges[toStation];
        thisStationToEdge = {
          max_pax: toEdge.max_pax,
          cap: toEdge.capacity,
        };
      }

      let fromEdge = data.edges[foundFromStation];
      thisStationFromEdge = {
        max_pax: fromEdge.max_pax,
        cap: fromEdge.capacity,
      };
    }
  }
  return {
    from: thisStationFromEdge,
    to: thisStationFromEdge,
  };
}
export function ExtractStationData(
  params: StationInterchangeParameters
): SankeyInterfaceMinimal {
  let graph: SankeyInterfaceMinimal = {
    nodes: [],
    links: [],
  };
  const [universe] = useAtom(universeAtom);
  const interchangeRequest: PaxMonGetInterchangesRequest = {
    start_time: params.startTime, // 25.10.2021 - 9:00
    end_time: params.endTime, // 25.10.2021 - 9:30
    station: params.stationId, // Lausanne
    include_meta_stations: false,
    include_group_infos: true,
    max_count: params.maxCount,
    universe: universe,
  };
  const { data } = usePaxMonGetInterchangesQuery(interchangeRequest);
  let interchangingTripsInStation: ExtTripId[] = [];
  if (data) {
    for (let interchange of data.interchanges) {
      let arrivingStationIndex = -1;
      let departureStationIndex = -1;

      if (
        interchange.arrival.length == 0 &&
        interchange.departure.length == 0
      ) {
        // error message? interchange has NO arrival or departure
        continue;
      }
      /* Get arrival point */
      if (interchange.arrival.length < 1) {
        // edge case if motis ever bugs, starting trip here => arrival stays "boarding"
      } else if (interchange.arrival.length == 1) {
        // zwischenstop/endstop
        let arrivalInfo = interchange.arrival[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if (arrivalInfo.trips.length != 1) continue;
        //"boarding" group, when arrival train is out of time range
        if (arrivalInfo.schedule_time < params.startTime) {
        } else {
          let trip = arrivalInfo.trips[0];
          arrivingStationIndex = interchangingTripsInStation.findIndex(
            (tripId) => {
              return SameExtTripId(tripId, ToExtTripId(trip.trip));
            }
          );
          let foundTripsInStation =
            interchangingTripsInStation[arrivingStationIndex];
          if (!foundTripsInStation) {
            let exttid = ToExtTripId(trip.trip);
            exttid.arrival_time = arrivalInfo.schedule_time;
            arrivingStationIndex = interchangingTripsInStation.length;
            interchangingTripsInStation.push(exttid);
          } else {
            foundTripsInStation.arrival_time = arrivalInfo.schedule_time;
          }
        }
      } else {
        // error!! this shouldnt happen
        continue;
      }

      /* Get departure point */

      if (interchange.departure.length < 1) {
        // edge case if motis ever bugs, endstation => "target" = exiting
      } else if (interchange.departure.length == 1) {
        //zwischenstop/start
        let departureInfo = interchange.departure[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if (departureInfo.trips.length != 1) continue;
        //"exiting" group, when arrival train is out of time range. this shouldn't happen from how the query works though
        if (departureInfo.schedule_time > params.endTime) {
          // formatLongDateTime(departureInfo.schedule_time) + " params.endTime " + formatLongDateTime(params.endTime));
        } else {
          let trip = departureInfo.trips[0];
          departureStationIndex = interchangingTripsInStation.findIndex(
            (tripId) => {
              return SameExtTripId(tripId, ToExtTripId(trip.trip));
            }
          );
          let foundTripsInStation =
            interchangingTripsInStation[departureStationIndex];
          if (!foundTripsInStation) {
            let exttid = ToExtTripId(trip.trip);
            exttid.departure_time = departureInfo.schedule_time;
            departureStationIndex = interchangingTripsInStation.length;
            interchangingTripsInStation.push(exttid);
          } else {
            foundTripsInStation.departure_time = departureInfo.schedule_time;
          }
        }
      } else {
        // error!!
        continue;
      }

      /* take care of the links from the data we now gained */
      let src =
        arrivingStationIndex === -1
          ? "boarding"
          : arrivingStationIndex.toString();
      let trgt =
        departureStationIndex === -1
          ? "exiting"
          : departureStationIndex.toString();
      let val = interchange.groups.max_passenger_count;
      let foundLink = graph.links.find(
        (link) => link.source == src && link.target == trgt
      );
      if (foundLink) {
        foundLink.value += val;
      } else {
        let link: LinkMinimal = {
          id: graph.links.length,
          value: val,
          source:
            arrivingStationIndex === -1
              ? "boarding"
              : arrivingStationIndex.toString(),
          target:
            departureStationIndex === -1
              ? "exiting"
              : departureStationIndex.toString(),
        };
        graph.links.push(link);
      }
    }
  }
  for (let trips of interchangingTripsInStation) {
    let node: NodeMinimal = {
      id: graph.nodes.length.toString(),
      name: trips.train_nr.toString(),
      sId: "TBI",
      arrival_time: trips.arrival_time ? trips.arrival_time : 0,
      departure_time: trips.departure_time ? trips.departure_time : 0,
      capacity: 200, // TODO: TBI
    };
    graph.nodes.push(node);
  }

  graph.nodes.sort((a, b) => {
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if (a.arrival_time == null && b.arrival_time == null) return 0;
    else if (a.arrival_time == null) return -1;
    else if (b.arrival_time == null) return 1;
    /* number comparators */ else if (a.arrival_time < b.arrival_time)
      return -1;
    else if (a.arrival_time > b.arrival_time) return 1;
    else return 0;
  });
  graph.nodes.sort((a, b) => {
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if (a.departure_time == null && b.departure_time == null) return 0;
    else if (a.departure_time == null) return -1;
    else if (b.departure_time == null) return 1;
    /* number comparators */ else if (a.departure_time < b.departure_time)
      return -1;
    else if (a.departure_time > b.departure_time) return 1;
    else return 0;
  });
  return graph;
}
