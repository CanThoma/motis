import React, { useState } from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./components/App";

import {
  GroupedPassengerGroups,
  GroupsInTripSection,
  PaxMonGetInterchangesRequest,
  PaxMonGroupByStation,
  PaxMonGroupFilter,
} from "./api/protocol/motis/paxmon";
import {
  queryKeys,
  sendPaxMonTripLoadInfosRequest,
  usePaxMonFindTripsQuery,
  usePaxMonGetInterchangesQuery,
  usePaxMonGroupsInTripQuery,
  usePaxMonStatusQuery,
} from "./api/paxmon";
import { useAtom } from "jotai";
import { universeAtom } from "./data/simulation";
import { QueryClient, QueryClientProvider, useQuery } from "react-query";
import { Station, Trip, TripId } from "./api/protocol/motis";
import TripDetails from "./components/TripDetails";
import { addEdgeStatistics } from "./util/statistics";
import { group } from "d3";
import { GroupByDirection } from "./components/CombinedGroup";
import { formatLongDateTime } from "./util/dateFormat";
import StationPicker from "./components/StationPicker";
import {
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
} from "./components/SankeyTypes";
import {
  ExtractStationData,
  StationInterchangeParameters,
} from "./components/StationInfoUtils";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});
function StationInterchangesDisplay(
  params: StationInterchangeParameters
): JSX.Element {
  const graph = ExtractStationData(params);
  return (
    <div>
      <div>
        <h1>FromNode count: {graph.fromNodes.length}</h1>
        {graph.fromNodes.map((val) => (
          <div>
            node id={typeof val.id === "string" ? val.id : val.id.train_nr}{" "}
            name={val.name} pax={val.pax} time={val.time}
          </div>
        ))}
        <h1>ToNode count: {graph.toNodes.length}</h1>
        {graph.toNodes.map((val) => (
          <div>
            node id={typeof val.id === "string" ? val.id : val.id.train_nr}{" "}
            name={val.name} pax={val.pax} time={val.time}
          </div>
        ))}
        <h1>Links count: {graph.links.length}</h1>
        {graph.links.map((val) => (
          <div>
            link id={val.id} value={val.value} fNId=
            {typeof val.fNId === "string" ? val.fNId : val.fNId.train_nr} tNId=
            {typeof val.tNId === "string" ? val.tNId : val.tNId.train_nr}
          </div>
        ))}
      </div>
    </div>
  );
}
type TestEnvParams = {
  stationId: string;
};
function TestEnv(): JSX.Element {
  const [station, setStation] = useState<string>();
  var someDate = new Date("Mon, 25 Oct 2021 09:15:00 GMT+2");
  var theUnixTime = someDate.getTime() / 1000;
  const startTime = theUnixTime - (theUnixTime % 1800); // dd-mm-yy 9:19 -> dd-mm-yy 9:00 ( this example timestamp 25-10-2021 9:15)
  const endTime = startTime + 180 * 60; // dd-mm-yy 9:30
  const StationInterchangesDisplayItem =
    station !== undefined ? (
      <StationInterchangesDisplay
        stationId={station}
        startTime={startTime}
        endTime={endTime}
        maxCount={0}
      />
    ) : null;
  return (
    <div>
      <StationPicker
        onStationPicked={(station) => {
          setStation(station?.id);
        }}
        clearOnPick={false}
      ></StationPicker>
      {StationInterchangesDisplayItem}{" "}
    </div>
  );
}
ReactDOM.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <TestEnv></TestEnv>
    </QueryClientProvider>
  </React.StrictMode>,
  document.getElementById("root")
);
