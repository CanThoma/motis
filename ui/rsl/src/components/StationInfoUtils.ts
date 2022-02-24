import { Trip, TripId, TripServiceInfo } from "../api/protocol/motis";
import {
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
} from "./SankeyStationTypes";
import { useAtom } from "jotai";
import { universeAtom } from "../data/simulation";
import {
  PaxMonGetInterchangesRequest,
  PaxMonInterchangeInfo,
  PaxMonTripInfo,
  PaxMonTripStopInfo,
} from "../api/protocol/motis/paxmon";
import {
  queryKeys,
  sendPaxMonTripLoadInfosRequest,
  usePaxMonGetInterchangesQuery,
  usePaxMonStatusQuery,
} from "../api/paxmon";
import { useQuery, useQueryClient } from "react-query";
import { loadAndProcessTripInfo } from "./TripInfoUtils";
import { addEdgeStatistics } from "../util/statistics";
import { formatLongDateTime } from "../util/dateFormat";

export type StationInterchangeParameters = {
  stationId: string;
  startTime: number;
  endTime: number;
  maxCount: number;
  onStatusUpdate: (status: "idle" | "error" | "loading" | "success") => void;
  onlyIncludeTripIds?: TripId[];
};
type TripIdAtStation = TripId & {
  pax: number;
  cap: number;
  interstation_time: number;
  stationID: string;
};
type NodeCapacityInfo = {
  cap: number;
  max_pax: number;
};
function SameTripIdAtStation(
  tripIdAtStationA: TripIdAtStation,
  tripIdAtStationB: TripIdAtStation
): boolean {
  return SameTripId(ToTripId(tripIdAtStationA), ToTripId(tripIdAtStationB));
}
export function SameTripId(tripIdA: TripId, tripIdB: TripId): boolean {
  return (
    tripIdA.time == tripIdB.time &&
    tripIdA.train_nr == tripIdB.train_nr &&
    tripIdA.target_station_id == tripIdB.target_station_id &&
    tripIdA.station_id == tripIdB.station_id &&
    tripIdA.line_id == tripIdB.line_id &&
    tripIdA.target_time == tripIdB.target_time
  );
}
export async function loadAndProcessTripInfos(
  universe: number,
  trips: TripId[]
) {
  const res = await sendPaxMonTripLoadInfosRequest({
    universe,
    trips: trips,
  });
  const tlis = res.load_infos;
  return tlis.map((tli) => addEdgeStatistics(tli));
}
function ToTripId(tripIdAtStation: TripIdAtStation): TripId {
  const tripId: TripId = {
    time: tripIdAtStation.time,
    train_nr: tripIdAtStation.train_nr,
    target_station_id: tripIdAtStation.target_station_id,
    station_id: tripIdAtStation.station_id,
    line_id: tripIdAtStation.line_id,
    target_time: tripIdAtStation.target_time,
  };
  return tripId;
}
function ToTripIdAtStation(tripId: TripId): TripIdAtStation {
  const tripIdAtStation: TripIdAtStation = {
    time: tripId.time,
    train_nr: tripId.train_nr,
    target_station_id: tripId.target_station_id,
    station_id: tripId.station_id,
    line_id: tripId.line_id,
    target_time: tripId.target_time,
    pax: 0,
    cap: 0,
    interstation_time: 0,
    stationID: "",
  };
  return tripIdAtStation;
}
enum InterchangePoint {
  ARRIVING,
  DEPARTING,
}
/**
 * Returns true if array contains element
 * @param el
 * @param filter
 * @param comparator Optional Parameter that compares the element el with every element of filter via a custom boolean function
 * @constructor
 */
function ArrayContains<T>(
  el: T,
  filter: T[],
  comparator?: (a: T, b: T) => boolean
): boolean {
  return (
    filter.findIndex((x) => (comparator ? comparator(el, x) : x === el)) !== -1
  );
}
/**
 *  Create a string-type NodeMinimal for boarding/exiting/previous/future
 *
 * @param name
 * @param time
 * @constructor
 */
function SpecialNodeMinimal(name: string, time: number): NodeMinimal {
  const node: NodeMinimal = {
    id: name,
    cap: 0,
    pax: 0,
    time: time,
    name: "",
  };
  return node;
}
/**
 * Will prevent the loop iteration to run, if the requirements of the structure are not met
 * @param interchange
 */
function requirementsInterchangeMet(
  interchange: PaxMonInterchangeInfo
): boolean {
  const arrivalLengthRequirement = interchange.arrival.length == 1;
  const departureLengthRequirement = interchange.departure.length == 1;

  // assume error if length != 1 (all cases seemed to fulfill this property)
  const arrivalTripsRequirement =
    arrivalLengthRequirement && interchange.arrival[0].trips.length == 1;
  const departureTripsRequirement =
    departureLengthRequirement && interchange.departure[0].trips.length == 1;

  return (
    // include boarding/exiting by taking one of them == null into consideration
    arrivalTripsRequirement || departureTripsRequirement
  );
}

/**
 * Compares two links, returns true on same
 * @param a
 * @param b
 * @constructor
 */
function SameLink(a: string | TripId, b: string | TripId): boolean {
  return (
    (typeof a === "string" && typeof b === "string" && a === b) ||
    (typeof a !== "string" && typeof b !== "string" && SameTripId(a, b))
  );
}

/**
 * Generates the name of a train from TripServiceInfo object
 * @param tsi
 * @constructor
 */
function NameTrip(tsi: TripServiceInfo): string {
  const names = [
    ...new Set(
      tsi.service_infos.map((si) =>
        si.line ? `${si.train_nr} [${si.name}]` : si.name
      )
    ),
  ];
  const title = `${names.join(", ")} (${tsi.primary_station.name} - ${
    tsi.secondary_station.name
  })`;
  return title;
}
/**
 * Returns an index if element info has been found/created only if the given limitTime is in the time range.
 * Returns index > 0 if in time Range,
 * Else returns -2 if out of time range
 * @param info
 * @param tripsInStationPoint
 * @param type
 * @param limitTime if type is ARRIVING, this will represent the startTime of the graph, if type is DEPARTING this will represent the endTime of the graph
 * @constructor
 */
function InterchangePointInfoHandle(
  info: PaxMonTripStopInfo,
  tripsInStationPoint: TripIdAtStation[],
  type: InterchangePoint,
  limitTime: number,
  interchangePassengerCount: number
): number {
  let pointStationIndex = -1;
  /* Get arrival point */
  if (
    (type == InterchangePoint.ARRIVING && info.schedule_time < limitTime) ||
    (type == InterchangePoint.DEPARTING && info.schedule_time > limitTime)
  ) {
    pointStationIndex = -2;
  } else {
    let trip = info.trips[0];
    pointStationIndex = tripsInStationPoint.findIndex((tripId) =>
      SameTripIdAtStation(tripId, ToTripIdAtStation(trip.trip))
    );
    let foundTripsInStation = tripsInStationPoint[pointStationIndex];
    if (!foundTripsInStation) {
      let tripIdAtStation = ToTripIdAtStation(trip.trip);
      tripIdAtStation.interstation_time = info.schedule_time;

      tripIdAtStation.pax = interchangePassengerCount;
      tripIdAtStation.cap = 1;
      tripIdAtStation.stationID = info.station?.id;

      pointStationIndex = tripsInStationPoint.length;
      tripsInStationPoint.push(tripIdAtStation);
    } else {
      foundTripsInStation.pax += interchangePassengerCount;
    }
  }
  return pointStationIndex;
}
/**
 * Returns true if the trip given could be found in tripIdList
 * @param tripId
 * @param tripIdList
 * @constructor
 */
function InterchangePassFilter(tripId: TripId, tripIdList: TripId[]) {
  return ArrayContains(tripId, tripIdList, SameTripId);
}
export function ExtractStationData(
  params: StationInterchangeParameters
): SankeyInterfaceMinimal {
  if (params.onStatusUpdate) params.onStatusUpdate("loading");

  const graph: SankeyInterfaceMinimal = {
    fromNodes: [],
    toNodes: [],
    links: [],
  };
  const [universe] = useAtom(universeAtom);
  const queryClient = useQueryClient();

  const interchangeRequest: PaxMonGetInterchangesRequest = {
    start_time: params.startTime, // 25.10.2021 - 9:00
    end_time: params.endTime, // 25.10.2021 - 9:30
    station: params.stationId, // Lausanne
    include_meta_stations: false,
    include_group_infos: true,
    max_count: params.maxCount,
    universe: universe,
  };
  const { data, status: thomas } =
    usePaxMonGetInterchangesQuery(interchangeRequest);

  //if(params.onStatusUpdate) params.onStatusUpdate(thomas);

  const arrivingTripsInStation: TripIdAtStation[] = [];
  const departingTripsInStation: TripIdAtStation[] = [];

  const boardingNode: NodeMinimal = SpecialNodeMinimal(
    "boarding",
    Number.MIN_VALUE
  );
  const previousNode: NodeMinimal = SpecialNodeMinimal(
    "previous",
    Number.MIN_VALUE * 2
  );
  const futureNode: NodeMinimal = SpecialNodeMinimal(
    "future",
    Number.MAX_VALUE - 1
  );
  const exitingNode: NodeMinimal = SpecialNodeMinimal(
    "exiting",
    Number.MAX_VALUE
  );

  if (data) {
    for (const interchange of data.interchanges.filter(
      requirementsInterchangeMet
    )) {
      let arrivingStationIndex = -1;
      let departureStationIndex = -1;

      // zwischenstop/endstop
      let arrivalInfo = interchange.arrival[0];
      //zwischenstop/start
      let departureInfo = interchange.departure[0];
      /* do not include node/link information for trips that don't fit the filter criteria */
      if (
        params.onlyIncludeTripIds &&
        params.onlyIncludeTripIds.length > 0 &&
        // when departure & arrival exist
        ((departureInfo &&
          arrivalInfo &&
          !InterchangePassFilter(
            departureInfo.trips[0].trip,
            params.onlyIncludeTripIds
          ) &&
          !InterchangePassFilter(
            arrivalInfo.trips[0].trip,
            params.onlyIncludeTripIds
          )) ||
          // when arrival exists
          (arrivalInfo &&
            !InterchangePassFilter(
              arrivalInfo.trips[0].trip,
              params.onlyIncludeTripIds
            )) ||
          // when departure exists
          (departureInfo &&
            !InterchangePassFilter(
              departureInfo.trips[0].trip,
              params.onlyIncludeTripIds
            )))
      ) {
        continue;
      }

      /* Push/modify trip point, for arrival, if exists; else -1 = "boarding" */
      if (arrivalInfo)
        arrivingStationIndex = InterchangePointInfoHandle(
          arrivalInfo,
          arrivingTripsInStation,
          InterchangePoint.ARRIVING,
          params.startTime,
          interchange.groups.max_passenger_count
        );

      /* Push/modify trip point, for departure, if exists; else -1 = "exiting" */
      if (departureInfo)
        departureStationIndex = InterchangePointInfoHandle(
          departureInfo,
          departingTripsInStation,
          InterchangePoint.DEPARTING,
          params.endTime,
          interchange.groups.max_passenger_count
        );

      /* If there is boarding/exiting , add passengers to previous/future node */
      if (arrivingStationIndex === -1) {
        //boarding
        boardingNode.pax += interchange.groups.max_passenger_count;
        boardingNode.cap += interchange.groups.max_passenger_count;
      } else if (arrivingStationIndex === -2) {
        // previous
        previousNode.pax += interchange.groups.max_passenger_count;
        previousNode.cap += interchange.groups.max_passenger_count;
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
          ? boardingNode.id
          : arrivingStationIndex === -2
          ? previousNode.id
          : ToTripId(arrivingTripsInStation[arrivingStationIndex]);
      let trgt =
        departureStationIndex === -1
          ? exitingNode.id
          : departureStationIndex === -2
          ? futureNode.id
          : ToTripId(departingTripsInStation[departureStationIndex]);
      let val = interchange.groups.max_passenger_count;

      // in case of several groups going the same interchange points in arrival & departure at the same time
      let foundLink = graph.links.find((link) => {
        let left = false;
        let right = false;

        left = SameLink(link.fNId, src);

        right = SameLink(link.tNId, trgt);

        return left && right;
      });
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
  for (let departingTrip of departingTripsInStation) {
    const tripId = ToTripId(departingTrip);
    const node: NodeMinimal = {
      id: tripId,
      pax: departingTrip.pax,
      cap: departingTrip.cap,
      name: tripId.train_nr.toString(),
      time: departingTrip.interstation_time,
    };
    graph.toNodes.push(node);
  }
  graph.toNodes.push(futureNode);
  graph.toNodes.push(exitingNode);

  const arrivingTripIds: TripId[] = graph.fromNodes.flatMap(({ id }) => {
    return typeof id === "string" ? [] : id;
  });
  const arrivingTripIdStations: { tripId: TripId; stationId: string }[] =
    arrivingTripsInStation.map((x) => {
      return { tripId: ToTripId(x), stationId: x.stationID };
    });
  const departingTripIdStations: { tripId: TripId; stationId: string }[] =
    departingTripsInStation.map((x) => {
      return { tripId: ToTripId(x), stationId: x.stationID };
    });

  const previousData = data;
  const { data: status } = usePaxMonStatusQuery();
  {
    const { data, status: nina /*, isLoading, error*/ } = useQuery(
      queryKeys.tripsLoad(universe, arrivingTripIds),
      async () => loadAndProcessTripInfos(universe, arrivingTripIds),
      {
        enabled: !!previousData && !!status && arrivingTripIds.length > 0,
        placeholderData: () => {
          return universe != 0
            ? queryClient.getQueryData(queryKeys.tripsLoad(0, arrivingTripIds))
            : undefined;
        },
      }
    );

    if (params.onStatusUpdate) params.onStatusUpdate(nina);

    if (data) {
      console.assert(data.length + 2 == graph.fromNodes.length);
      for (let i = 0; i < data.length; i++) {
        const tsi = data[i];
        const arrivingStationId = arrivingTripIdStations.find((x) =>
          SameTripId(x.tripId, tsi.tsi.trip)
        )?.stationId;
        const edge = tsi.edges.find((edge) => edge.to.id === arrivingStationId);
        graph.fromNodes[i + 2].name = NameTrip(tsi.tsi);
        if (edge) {
          graph.fromNodes[i + 2].cap = edge.capacity;
          graph.fromNodes[i + 2].pax = edge.max_pax;
        } else {
          // situation: we do not have information about the train at params.stationId, because the trip we have found searching
          // for stationId, does not visit stationId. make the best out of it and take the biggest capacity in this trains entire trip.
          // this is a backend problem :shrug:
          const maxCapacity = tsi.edges.reduce(
            (max, ef) => (ef.capacity ? Math.max(max, ef.capacity) : max),
            0
          );
          const maxPax = tsi.edges.reduce(
            (max, ef) => Math.max(max, ef.max_pax || 0),
            0
          );

          graph.fromNodes[i + 2].cap = maxCapacity;
          graph.fromNodes[i + 2].pax = maxPax;
        }
      }
    }
  }
  // get all trip ids from arriving and make another query
  const departingTripIds: TripId[] = graph.toNodes.flatMap(({ id }) => {
    return typeof id === "string" ? [] : id;
  });
  {
    const { data /*, isLoading, error*/ } = useQuery(
      queryKeys.tripsLoad(universe, departingTripIds),
      async () => loadAndProcessTripInfos(universe, departingTripIds),
      {
        enabled: !!previousData && !!status && departingTripIds.length > 0,
        placeholderData: () => {
          return universe != 0
            ? queryClient.getQueryData(queryKeys.tripsLoad(0, departingTripIds))
            : undefined;
        },
      }
    );
    if (data) {
      console.assert(data.length + 2 == graph.toNodes.length);
      for (let i = 0; i < data.length; i++) {
        const tsi = data[i];
        const departingStationId = departingTripIdStations.find((x) =>
          SameTripId(x.tripId, tsi.tsi.trip)
        )?.stationId;
        const edge = tsi.edges.find(
          (edge) => edge.from.id === departingStationId
        );
        graph.toNodes[i].name = NameTrip(tsi.tsi);
        // it will not find an edge, if the trip is nahverkehr but station is fernverkehr (?)
        if (edge) {
          graph.toNodes[i].cap = edge.capacity;
          graph.toNodes[i].pax = edge.max_pax;
        } else {
          // situation: we do not have information about the train at params.stationId, because the trip we have found searching
          // for stationId, does not visit stationId. make the best out of it and take the biggest capacity in this trains entire trip.
          // this is a backend problem :shrug:
          const maxCapacity = tsi.edges.reduce(
            (max, ef) => (ef.capacity ? Math.max(max, ef.capacity) : max),
            0
          );
          const maxPax = tsi.edges.reduce(
            (max, ef) => Math.max(max, ef.max_pax || 0),
            0
          );

          graph.toNodes[i].cap = maxCapacity;
          graph.toNodes[i].pax = maxPax;
        }
      }
    }
  }

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
