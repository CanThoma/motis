import { useAtom } from "jotai";
import { universeAtom } from "../data/simulation";
import {
  sendPaxMonTripLoadInfosRequest,
  usePaxMonGroupsInTripQuery,
} from "../api/paxmon";
import { TripId } from "../api/protocol/motis";

import {
  SankeyInterfaceMinimal,
  NodeMinimal,
  LinkMinimal,
} from "./SankeyTypes";
import { addEdgeStatistics } from "../util/statistics";

interface EdgeInfo {
  enterStationID: string;
  exitStationID: string;
  passengers: number;
}

export function ExtractGroupInfoForThisTrain(
  tripId: TripId
): SankeyInterfaceMinimal | null {
  const [universe] = useAtom(universeAtom);
  const sankeyInterface: SankeyInterfaceMinimal = {
    links: [],
    nodes: [],
  };
  const groupInfo = new Map<number, EdgeInfo>();
  {
    const {
      data: groupsInTrip,
      // isLoading, // Momentan ungenutzt
      // error, // Momentan ungenutzt
    } = usePaxMonGroupsInTripQuery({
      universe,
      trip: tripId,
      filter: "Entering",
      group_by_station: "None", // get the Last station => ENTER station
      group_by_other_trip: false,
      include_group_infos: true,
    });
    //TODO: add check if null first
    groupsInTrip?.sections.forEach((groupsInTripSection) => {
      //get entering station name
      const currentEnteringStationID = groupsInTripSection.from.id;
      const currentEnteringStationName = groupsInTripSection.from.name;
      const nodeIdx = sankeyInterface.nodes.length.toString();
      const node: NodeMinimal = {
        id: nodeIdx,
        sId: currentEnteringStationID,
        name: currentEnteringStationName,
        arrival_current_time: groupsInTripSection.arrival_current_time,
        arrival_schedule_time: groupsInTripSection.arrival_schedule_time,
        departure_current_time: groupsInTripSection.departure_current_time,
        departure_schedule_time: groupsInTripSection.departure_schedule_time,
      };
      sankeyInterface.nodes.push(node);
      groupsInTripSection.groups.forEach((groupedPassengerGroup) => {
        groupedPassengerGroup.info.groups.forEach((paxMonGroupBaseInfo) => {
          const info: EdgeInfo = {
            enterStationID: nodeIdx,
            exitStationID: "",
            passengers: paxMonGroupBaseInfo.passenger_count,
          };
          groupInfo.set(paxMonGroupBaseInfo.id, info);
        });
      });
    });
    if (groupsInTrip != null && groupsInTrip.sections.length > 0) {
      const currentEnteringStationID =
        groupsInTrip.sections[groupsInTrip.sections.length - 1].to.id;
      const currentEnteringStationName =
        groupsInTrip.sections[groupsInTrip.sections.length - 1].to.name;
      const node: NodeMinimal = {
        id: sankeyInterface.nodes.length.toString(),
        sId: currentEnteringStationID,
        name: currentEnteringStationName,
      };
      sankeyInterface.nodes.push(node);
    }
  }
  {
    const {
      data: groupsInTrip,
      // isLoading, // Value declared, but never used.
      // error, // Value declared, but never used.
    } = usePaxMonGroupsInTripQuery({
      universe,
      trip: tripId,
      filter: "Exiting",
      group_by_station: "None", // get the Last station => ENTER station
      group_by_other_trip: false,
      include_group_infos: true,
    });
    //TODO: add check if null first
    let count = 1;
    groupsInTrip?.sections.forEach((groupsInTripSection) => {
      //get entering station name
      //const currentExitingStationID = groupsInTripSection.to.id;  // Value declared, but never used.
      //const currentExitingStationName = groupsInTripSection.to.name; // Value declared, but never used.
      groupsInTripSection.groups.forEach((groupedPassengerGroup) => {
        groupedPassengerGroup.info.groups.forEach((paxMonGroupBaseInfo) => {
          const info = groupInfo.get(paxMonGroupBaseInfo.id);
          if (info == null) {
            // TODO: error handling
          } else {
            info.exitStationID = count.toString();
          }
        });
      });
      count = count + 1;
    });
  }
  let infos = Array.from(groupInfo.values());
  const prio = sankeyInterface.nodes.map((x) => x.id);

  infos = infos.sort((a, b) => {
    if (a.enterStationID === b.enterStationID) {
      return prio.indexOf(a.exitStationID) < prio.indexOf(b.exitStationID)
        ? -1
        : 1;
    } else {
      return prio.indexOf(a.enterStationID) < prio.indexOf(b.enterStationID)
        ? -1
        : 1;
    }
  });
  let lastEnterStationID = null,
    lastExitStationID = null;
  for (const info of infos) {
    if (
      info.exitStationID != lastExitStationID ||
      info.enterStationID != lastEnterStationID
    ) {
      const link: LinkMinimal = {
        id: "link" + sankeyInterface.links.length,
        source: sankeyInterface.nodes
          .findIndex((x) => x.id === info.enterStationID)
          .toString(),
        target: sankeyInterface.nodes
          .findIndex((x) => x.id === info.exitStationID)
          .toString(),
        value: info.passengers,
      };
      sankeyInterface.links.push(link);
      lastExitStationID = info.exitStationID;
      lastEnterStationID = info.enterStationID;
    } else {
      sankeyInterface.links[sankeyInterface.links.length - 1].value +=
        info.passengers;
    }
  }
  for (let i = 0; i < sankeyInterface.nodes.length; i++)
    sankeyInterface.nodes[i].id = i.toString();
  return sankeyInterface;
}

export async function loadAndProcessTripInfo(universe: number, trip: TripId) {
  const res = await sendPaxMonTripLoadInfosRequest({
    universe,
    trips: [trip],
  });
  const tli = res.load_infos[0];
  return addEdgeStatistics(tli);
}
