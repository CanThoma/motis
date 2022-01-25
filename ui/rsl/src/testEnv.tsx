import React, {useState} from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";

import {
  GroupsInTripSection,
  PaxMonGroupByStation,
  PaxMonGroupFilter,
} from "./api/protocol/motis/paxmon";
import {
  queryKeys,
  sendPaxMonTripLoadInfosRequest,
  usePaxMonFindTripsQuery,
  usePaxMonGroupsInTripQuery,
  usePaxMonStatusQuery
} from "./api/paxmon";
import {useAtom} from "jotai";
import {universeAtom} from "./data/simulation";
import {QueryClient, QueryClientProvider, useQuery} from "react-query";
import {TripId} from "./api/protocol/motis";
import TripDetails from "./components/TripDetails";
import {addEdgeStatistics} from "./util/statistics";
import {group} from "d3";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});
type TripDetailsType = {
  tripNumber: number;
};
type TripSectionDetailsType = {
  tripId: TripId;
  filter: PaxMonGroupFilter;
  groupByStation: PaxMonGroupByStation;
};
type TripGeneratorParams = {
  onClick: () => void;
}

async function loadAndProcessTripInfo(universe: number, trip: TripId) {
  const res = await sendPaxMonTripLoadInfosRequest({
    universe,
    trips: [trip],
  });
  const tli = res.load_infos[0];
  return addEdgeStatistics(tli);
}

function TripGenerator({onClick} : TripGeneratorParams) : JSX.Element {
return (<button type="button"
              className="bg-db-red-500 px-3 py-1 rounded text-white text-sm hover:bg-db-red-600"
              onClick={onClick}>Generate</button>)
}
interface InfoRenameThis {
  enterStationID: string;
  enterStationName: string;
  exitStationID: string;
  exitStationName: string;
  passengers: number;
}
function ExtractGroupInfoForThisTrain(tripId:TripId) : InfoRenameThis[] | null {
  const [universe] = useAtom(universeAtom);
  let groupInfo = new Map<number, InfoRenameThis>();

  {
    const {
      data: groupsInTrip,
      isLoading,
      error,
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
      groupsInTripSection.groups.forEach((groupedPassengerGroup)=>{
        groupedPassengerGroup.info.groups.forEach((paxMonGroupBaseInfo)=> {
            const info: InfoRenameThis = {
              enterStationID: currentEnteringStationID,
              enterStationName: currentEnteringStationName,
              exitStationID: "",
              exitStationName: "",
              passengers: paxMonGroupBaseInfo.passenger_count
            };
            groupInfo.set(paxMonGroupBaseInfo.id, info);
          }
        );
      });
    });
  }
  {
    const {
      data: groupsInTrip,
      isLoading,
      error,
    } = usePaxMonGroupsInTripQuery({
      universe,
      trip: tripId,
      filter: "Exiting",
      group_by_station: "None", // get the Last station => ENTER station
      group_by_other_trip: false,
      include_group_infos: true,
    });
    //TODO: add check if null first
    groupsInTrip?.sections.forEach((groupsInTripSection) => {
      //get entering station name
      const currentExitingStationID = groupsInTripSection.to.id;
      const currentExitingStationName = groupsInTripSection.to.name;
      groupsInTripSection.groups.forEach((groupedPassengerGroup)=>{
        groupedPassengerGroup.info.groups.forEach((paxMonGroupBaseInfo)=> {
            let info = groupInfo.get(paxMonGroupBaseInfo.id);
            if(info == null)
            {
              // TODO: error handling
            }
            else {
              info.exitStationID = currentExitingStationID;
              info.exitStationName = currentExitingStationName;
            }
          }
        );
      });
    });
  };
  let infos = Array.from(groupInfo.values());
  infos = infos.sort((a, b) => a.exitStationID.localeCompare(b.exitStationID));
  infos = infos.sort((a, b) => a.enterStationID.localeCompare(b.enterStationID));
  let lastEnterStationID = null,lastExitStationID = null;
  let links = new Array();
  for(let info of infos)
  {
    if(info.exitStationID != lastExitStationID || info.enterStationID != lastEnterStationID)
    {
      const link : InfoRenameThis = {
        enterStationID: info.enterStationID,
        enterStationName: info.enterStationName,
        exitStationID: info.exitStationID,
        exitStationName: info.exitStationName,
        passengers: info.passengers
      }
      links.push(link);
      lastExitStationID= info.exitStationID;
      lastEnterStationID = info.enterStationID;
    }
    else {
      links[links.length-1].passengers += info.passengers;
    }
  }
  return links;
}
function TripSectionInfoDisplay({tripId,filter,groupByStation} : TripSectionDetailsType) : JSX.Element | null {
  const groupInfo = ExtractGroupInfoForThisTrain(tripId);
  const content = groupInfo === null ? (
    <div>Loading trip section data..</div>
  ) :
    (
    <div>
      {groupInfo.map((info)=>(<p>{info.passengers} from {info.enterStationName} to {info.exitStationName}</p>))}
    </div>
  );

  return content;
}
function TripInfoDisplay({tripNumber} : TripDetailsType) : JSX.Element | null {
    if(tripNumber === 0)
      return null;
  const [universe] = useAtom(universeAtom);
  const {data} = usePaxMonFindTripsQuery(universe, tripNumber);
  const firstTrip = data?.trips || [];
  const tripId = firstTrip.length > 0? firstTrip[0].tsi.trip : null;
  const tripSectionInfoDisplayEntering =
    tripId !== null ? <TripSectionInfoDisplay tripId={tripId} filter="Entering" groupByStation="LastLongDistance"/> : null;
  const tripSectionInfoDisplayExiting =
    tripId !== null ? <TripSectionInfoDisplay tripId={tripId} filter="Exiting" groupByStation="LastLongDistance"/> : null;

    const tripObjectGen = (tripId: TripId) => (<div>
      <label>Time: {tripId?.time}</label><br/>
      <label>Target Station ID: {tripId?.target_station_id}</label><br/>
      <label>Train Nr: {tripId?.train_nr}</label><br/>
      <label>Target Time: {tripId?.target_time}</label><br/>
      <label>Station ID: {tripId?.target_station_id}</label><br/>
      <label>Line ID: {tripId?.line_id}</label><br/>
      <label>Station ID: {tripId?.station_id}</label><br/>
    </div>);
    const {data: status} = usePaxMonStatusQuery();
    const {data: resData /*, isLoading, error*/} = useQuery(
      queryKeys.tripLoad(universe, tripId),
      async () => loadAndProcessTripInfo(universe, tripId),
      {
        enabled: !!status && tripId != null,
        placeholderData: () => {
          return universe != 0
            ? queryClient.getQueryData(queryKeys.tripLoad(0, tripId))
            : undefined;
        },
      }
    );
    //Object.keys(resData).forEach(e => console.log(`key=${e}  value=${resData[e]}`));
    const searchingTrip = tripId ? tripObjectGen(tripId) : null;
    return (
      <div>
        {searchingTrip}{tripSectionInfoDisplayEntering}{tripSectionInfoDisplayExiting}
      </div>
    )
}
function TestEnv() : JSX.Element{
  const [tripNumber,setTripNumber]=useState<number>(1517);
  const TripInfoDisplayItem = <TripInfoDisplay tripNumber={tripNumber} />;
  const TripInfoGenerator = <TripGenerator onClick={()=>{
    //if(tripNumber == 0) setTripNumber(4); else setTripNumber(0)
    setTripNumber(tripNumber+1);
  }} />;
  return (<div>{TripInfoGenerator} {TripInfoDisplayItem} </div>);
  // var tripId = data.trips[0].tsi.trip;
  // const {
  //   data: groupsInTrip,
  //   isLoading,
  //   error,
  // } = usePaxMonGroupsInTripQuery({
  //   universe,
  //   trip: tripId,
  //   filter: groupFilter,
  //   group_by_station: groupByStation,
  //   group_by_other_trip: groupByOtherTrip,
  //   include_group_infos: false
  // });
  // return (<label>{tripId.target_station_id.toString()}</label>)
}
ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
    <TestEnv></TestEnv>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
