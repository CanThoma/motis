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
} from "./Sankey/TripGraph/SankeyTripTypes";
import { addEdgeStatistics } from "../util/statistics";
import { PaxMonTripLoadInfoWithStats } from "../data/loadInfo";
import { GroupsInTripSection } from "../api/protocol/motis/paxmon";

interface EdgeInfo {
  enterStationID: string;
  exitStationID: string;
  passengers: number;
}

/**
 * Fügt aus dem sankeyInterface die Nodeinformation aus dem groupsInTripSection Element hinzu. Entweder aus der from oder aus der to Perspektive der section
 * @param sankeyInterface Interface, dem der Node hinzugefügt wird
 * @param groupsInTripSection Element, dessen Information extrahiert wird
 * @param direction "from" oder "to" von groupsInTripSection
 */
function addGroupsInTripSection(
  sankeyInterface: SankeyInterfaceMinimal,
  groupsInTripSection: GroupsInTripSection,
  direction: "from" | "to"
) {
  //get entering station
  let currentEnteringStationID = "";
  let currentEnteringStationName = "";
  if (direction == "from") {
    currentEnteringStationID = groupsInTripSection.from.id;
    currentEnteringStationName = groupsInTripSection.from.name;
  } else if (direction == "to") {
    currentEnteringStationID = groupsInTripSection.to.id;
    currentEnteringStationName = groupsInTripSection.to.name;
  }
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
}
/**
 * Gibt ein SankeyInterfaceMinimal mit allen nötigen Informationen aus dem Backend zu dem Trip tripId zurück
 * @param tripId TripId der Verbindung
 * @constructor
 */
export function ExtractGroupInfoForThisTrain(
  tripId: TripId
): SankeyInterfaceMinimal | null {
  const [universe] = useAtom(universeAtom);
  // Rückgabewert
  const sankeyInterface: SankeyInterfaceMinimal = {
    links: [],
    nodes: [],
  };

  let success = true;
  const groupInfo = new Map<number, EdgeInfo>();
  {
    const { data: groupsInTrip } = usePaxMonGroupsInTripQuery({
      universe,
      trip: tripId,
      filter: "Entering", // only Entering information => "All" lacks information, so: split in two calls
      group_by_station: "None",
      group_by_other_trip: false,
      include_group_infos: true,
    });
    if (groupsInTrip) {
      // Jede der sections im Trip wird durchgegangen und es wird eine Node (from-node) gepusht. Am Ende der letzten section wird dann die to-node gepusht.
      // node wird komplett befüllt mit nötiger Information. groupInfo wird zum berechnen der links erstellt

      groupsInTrip.sections.forEach((groupsInTripSection) => {
        const nodeIdx = sankeyInterface.nodes.length.toString();
        // add the gITS from this section's from-node information to sankeyInterface node array
        addGroupsInTripSection(sankeyInterface, groupsInTripSection, "from");
        // prepare data for links in groupInfo
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
      // have to assume > 0 because last element needed
      if (groupsInTrip.sections.length > 0) {
        const lastSection =
          groupsInTrip.sections[groupsInTrip.sections.length - 1];
        addGroupsInTripSection(sankeyInterface, lastSection, "to");
      }
    } else {
      success = false;
    }
  }
  {
    const { data: groupsInTrip } = usePaxMonGroupsInTripQuery({
      universe,
      trip: tripId,
      filter: "Exiting",
      group_by_station: "None", // get the Last station => ENTER station
      group_by_other_trip: false,
      include_group_infos: true,
    });
    if (!success || !groupsInTrip) return null;

    let count = 1;
    groupsInTrip?.sections.forEach((groupsInTripSection) => {
      //get entering station name
      //const currentExitingStationID = groupsInTripSection.to.id;  // Value declared, but never used.
      //const currentExitingStationName = groupsInTripSection.to.name; // Value declared, but never used.
      groupsInTripSection.groups.forEach((groupedPassengerGroup) => {
        groupedPassengerGroup.info.groups.forEach((paxMonGroupBaseInfo) => {
          // get groupInfo[id] from "Entering" with same id. If not exist: mistake from backend.
          const info = groupInfo.get(paxMonGroupBaseInfo.id);
          if (info) {
            info.exitStationID = count.toString();
          }
        });
      });
      count = count + 1;
    });
  }
  let infos = Array.from(groupInfo.values());
  const prio = sankeyInterface.nodes.map((x) => x.id);

  // Sort by entering. subgroup of same entering will be sorted by exiting
  //
  //  Lausanne->Yverdon
  //  Lausanne->Biel/Bienne
  //  Lausanne->Oensingen
  //  Yverdon->Biel/Bienne
  //  Yverdon->Oensingen
  //  Biel/Bienne->Oensingen
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
  // Finally, add all links to interface
  for (const info of infos) {
    if (
      info.exitStationID != lastExitStationID ||
      info.enterStationID != lastEnterStationID
    ) {
      // new enter-exiting link. push into links with passengercount as value
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
      // same enter & exit -> group together in one link, so add value from this group to enter-exiting link
      sankeyInterface.links[sankeyInterface.links.length - 1].value +=
        info.passengers;
    }
  }

  //reset all nodeIds to new numbers (since they were mixed up by sorting)
  for (let i = 0; i < sankeyInterface.nodes.length; i++)
    sankeyInterface.nodes[i].id = i.toString();
  return sankeyInterface;
}

export async function loadAndProcessTripInfo(
  universe: number,
  trip: TripId
): Promise<PaxMonTripLoadInfoWithStats> {
  const res = await sendPaxMonTripLoadInfosRequest({
    universe,
    trips: [trip],
  });
  const tli = res.load_infos[0];
  return addEdgeStatistics(tli);
}
