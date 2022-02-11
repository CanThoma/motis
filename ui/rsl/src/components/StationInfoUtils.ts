import { Trip, TripId } from "../api/protocol/motis";
import {
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
} from "./SankeyStationTypes";
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
  pax: number;
  cap: number;
  interstation_time: number;
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
    pax: 0,
    cap: 0,
    interstation_time: 0,
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
  const graph: SankeyInterfaceMinimal = {
    fromNodes: [],
    toNodes: [],
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
  const arrivingTripsInStation: ExtTripId[] = [];
  const departuringTripsInStation: ExtTripId[] = [];
  const SpecialNode = (name: string, time: number) => {
    const node: NodeMinimal = {
      id: name,
      cap: 0,
      pax: 0,
      time: time,
      name: "",
    };
    return node;
  };
  const boardingNode: NodeMinimal = SpecialNode("boarding", Number.MIN_VALUE);
  const previousNode: NodeMinimal = SpecialNode(
    "previous",
    Number.MIN_VALUE * 2
  );
  const futureNode: NodeMinimal = SpecialNode("future", Number.MAX_VALUE - 1);
  const exitingNode: NodeMinimal = SpecialNode("exiting", Number.MAX_VALUE);

  if (data) {
    for (const interchange of data.interchanges) {
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
          arrivingStationIndex = -2;
        } else {
          let trip = arrivalInfo.trips[0];
          arrivingStationIndex = arrivingTripsInStation.findIndex((tripId) =>
            SameExtTripId(tripId, ToExtTripId(trip.trip))
          );
          let foundTripsInStation =
            arrivingTripsInStation[arrivingStationIndex];
          if (!foundTripsInStation) {
            let exttid = ToExtTripId(trip.trip);
            exttid.interstation_time = arrivalInfo.schedule_time;

            //TODO: move pax and cap to other query?
            exttid.pax = interchange.groups.max_passenger_count;
            exttid.cap = 500; //TBI

            arrivingStationIndex = arrivingTripsInStation.length;
            arrivingTripsInStation.push(exttid);
          } else {
            foundTripsInStation.pax += interchange.groups.max_passenger_count;
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
          departureStationIndex = -2;
        } else {
          let trip = departureInfo.trips[0];
          departureStationIndex = departuringTripsInStation.findIndex(
            (tripId) => SameExtTripId(tripId, ToExtTripId(trip.trip))
          );
          let foundTripsInStation =
            departuringTripsInStation[departureStationIndex];
          if (!foundTripsInStation) {
            const exttid = ToExtTripId(trip.trip);
            exttid.interstation_time = departureInfo.schedule_time;

            //TODO: move pax and cap to other query?
            exttid.pax = interchange.groups.max_passenger_count;
            exttid.cap = 500; //TBI

            departureStationIndex = departuringTripsInStation.length;
            departuringTripsInStation.push(exttid);
          } else {
            foundTripsInStation.pax += interchange.groups.max_passenger_count;
          }
        }
      } else {
        // error!!
        continue;
      }
      /* If there is boarding/exiting previous/future */
      if (arrivingStationIndex === -1) {
        //boarding
        boardingNode.pax += interchange.groups.max_passenger_count;
        boardingNode.cap += interchange.groups.max_passenger_count;
        console.log(
          "ADDING BOARDING " + interchange.groups.max_passenger_count
        );
      } else if (arrivingStationIndex === -2) {
        // previous
        previousNode.pax += interchange.groups.max_passenger_count;
        previousNode.cap += interchange.groups.max_passenger_count;
        console.log(
          "ADDING previousNode " + interchange.groups.max_passenger_count
        );
      }

      if (departureStationIndex === -1) {
        //exiting
        exitingNode.pax += interchange.groups.max_passenger_count;
        exitingNode.cap += interchange.groups.max_passenger_count;
      } else if (departureStationIndex === -2) {
        // future
        futureNode.pax += interchange.groups.max_passenger_count;
        futureNode.cap += interchange.groups.max_passenger_count;
      }

      /* take care of the links from the data we now gained */
      let src =
        arrivingStationIndex === -1
          ? "boarding"
          : arrivingStationIndex === -2
          ? "previous"
          : ToTripId(arrivingTripsInStation[arrivingStationIndex]);
      let trgt =
        departureStationIndex === -1
          ? "exiting"
          : departureStationIndex === -2
          ? "future"
          : ToTripId(departuringTripsInStation[departureStationIndex]);
      let val = interchange.groups.max_passenger_count;
      // in case of several groups going the same interchange
      let foundLink = graph.links.find(
        (link) => link.fNId === src && link.tNId === trgt
      );
      if (foundLink) {
        foundLink.value += val;
      } else {
        const link: LinkMinimal = {
          id: graph.links.length,
          value: val,
          fNId: src, // tripId if stationindex found, else string identifier
          tNId: trgt, // tripId if stationindex found, else string identifier
        };
        graph.links.push(link);
      }
    }
  }
  /* Push elements to graph node arrays */
  graph.fromNodes.push(boardingNode);
  graph.fromNodes.push(previousNode);
  for (let arrivingTrip of arrivingTripsInStation) {
    const tripId = ToTripId(arrivingTrip);
    const node: NodeMinimal = {
      id: tripId,
      pax: arrivingTrip.pax,
      cap: arrivingTrip.cap,
      name: tripId.train_nr.toString(),
      time: arrivingTrip.interstation_time,
    };
    graph.fromNodes.push(node);
  }
  for (let departuringTrip of departuringTripsInStation) {
    const tripId = ToTripId(departuringTrip);
    const node: NodeMinimal = {
      id: tripId,
      pax: departuringTrip.pax,
      cap: departuringTrip.cap,
      name: tripId.train_nr.toString(),
      time: departuringTrip.interstation_time,
    };
    graph.toNodes.push(node);
  }
  graph.toNodes.push(futureNode);
  graph.toNodes.push(exitingNode);

  /* Sort elements as output from MOTIS is not sorted */
  const TimeSort = (a: NodeMinimal, b: NodeMinimal) => {
    /* number comparators */
    if (a.time < b.time) return -1;
    else if (a.time > b.time) return 1;
    else return 0;
  };
  graph.fromNodes.sort(TimeSort);
  graph.toNodes.sort(TimeSort);
  return graph;
}
