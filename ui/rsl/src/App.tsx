import React, { useState, useEffect } from "react";

import { addEdgeStatistics } from "./util/statistics";
import TimeControl from "./TimeControl";
import TripPicker from "./TripPicker";
import TripLoadForecastChart from "./TripLoadForecastChart";
import {
  PaxMonStatusResponse,
  PaxMonTripLoadInfo,
} from "./api/protocol/motis/paxmon";
import {
  sendPaxMonGroupsInTripRequest,
  sendPaxMonInitForward,
  sendPaxMonStatusRequest,
  sendPaxMonTripLoadInfosRequest,
} from "./api/paxmon";
import { TripId } from "./api/protocol/motis";
import { sendRISForwardTimeRequest } from "./api/ris";
import { PaxMonTripLoadInfoWithStats } from "./data/loadInfo";

async function getInitialStatus(
  setPaxMonStatus: (status: PaxMonStatusResponse | null) => void
) {
  const data = await sendPaxMonStatusRequest();
  setPaxMonStatus(data);
  if (!data.system_time) {
    console.log("Initial forward...");
    await sendPaxMonInitForward();
    await getInitialStatus(setPaxMonStatus);
  }
}

async function loadAndProcessTripInfo(trip: TripId) {
  const res = await sendPaxMonTripLoadInfosRequest({
    universe: 0,
    trips: [trip],
  });
  const tli = res.load_infos[0];
  const tliWithStats = addEdgeStatistics(tli);
  const groupsRes = await sendPaxMonGroupsInTripRequest(trip);
  return tliWithStats;
}

async function forwardTimeStepped(
  endTime: number,
  currentTime: number,
  stepSize: number,
  setPaxMonStatus: (status: PaxMonStatusResponse | null) => void,
  selectedTrip: TripId | null,
  setTripLoadInfo: (tli: PaxMonTripLoadInfoWithStats | null) => void
) {
  while (currentTime < endTime) {
    currentTime = Math.min(endTime, currentTime + stepSize);
    await sendRISForwardTimeRequest(currentTime);
    const statusData = await sendPaxMonStatusRequest();
    setPaxMonStatus(statusData);
    if (selectedTrip) {
      const tli = await loadAndProcessTripInfo(selectedTrip);
      setTripLoadInfo(tli);
    }
  }
}

function App(): JSX.Element {
  const [paxMonStatus, setPaxMonStatus] = useState<PaxMonStatusResponse | null>(
    null
  );
  const [selectedTrip, setSelectedTrip] = useState<TripId | null>(null);
  const [tripLoadInfo, setTripLoadInfo] =
    useState<PaxMonTripLoadInfoWithStats | null>(null);
  const [forwardInProgress, setForwardInProgress] = useState(false);

  const systemTime = paxMonStatus?.system_time;

  function forwardTime(newTime: number) {
    if (forwardInProgress) {
      return;
    }
    setForwardInProgress(true);
    forwardTimeStepped(
      newTime,
      systemTime || 0,
      60,
      setPaxMonStatus,
      selectedTrip,
      setTripLoadInfo
    )
      .then(() => {
        setForwardInProgress(false);
      })
      .catch((e) => {
        console.log("forwardTime failed:", e);
        setForwardInProgress(false);
      });
  }

  function loadTripInfo(trip: TripId) {
    setSelectedTrip(trip);
    loadAndProcessTripInfo(trip).then((tli) => {
      setTripLoadInfo(tli);
    });
  }

  useEffect(() => {
    getInitialStatus(setPaxMonStatus).catch((e) => {
      console.log("getInitialStatus failed:", e);
    });
  }, []);

  return (
    <div className="App">
      <TimeControl
        systemTime={systemTime}
        onForwardTime={forwardTime}
        disabled={forwardInProgress}
      />
      <TripPicker onLoadTripInfo={loadTripInfo} />
      <TripLoadForecastChart data={tripLoadInfo} systemTime={systemTime} />
    </div>
  );
}

export default App;