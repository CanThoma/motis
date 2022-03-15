import React, { createContext, useState, useContext } from "react";

import { factor as scaleFactor, stationConfig as config } from "../../config";
import { TripId } from "../../api/protocol/motis";
import { PaxMonFilteredTripInfo } from "../../api/protocol/motis/paxmon";

type Props = {
  stationId: string;
  setStationId?: (stationId: string) => void;
  startTime: Date;
  setStartTime?: (startTime: Date) => void;
  endTime: Date;
  setEndTime?: (endTime: Date) => void;
  stationStatus: "loading" | "success";
  setStationStatus?: (status: "loading" | "success") => void;
  tripName: string;
  setTripName?: (name: string) => void;
  selectedTrip: TripId | null;
  setSelectedTrip?: (trip: TripId | null) => void;
  selectedStation: string;
  setSelectedStation?: (station: string) => void;
  stationName: string;
  setStationName?: (stationName: string) => void;
  factor: number;
  setFactor?: (factor: number) => void;
  peakSpottingTrips: undefined | PaxMonFilteredTripInfo[];
  setPeakSpottingTrips?: (trip: PaxMonFilteredTripInfo[] | undefined) => void;
  peakSpottingPaginatedTrips: undefined | PaxMonFilteredTripInfo[];
  setPeakSpottingPaginatedTrips?: (
    trip: PaxMonFilteredTripInfo[] | undefined
  ) => void;
  peakSpottingSelectedTrip: PaxMonFilteredTripInfo | undefined;
  setPeakSpottingSelectedTrip?: (
    trip: PaxMonFilteredTripInfo | undefined
  ) => void;
  peakSpottingCurrentPage: number;
  setPeakSpottingCurrentPage?: (page: number) => void;
};

const SankeyContext = createContext<Props>({
  stationId: "",
  startTime: new Date(0),
  endTime: new Date(0),
  stationStatus: "loading",
  tripName: "",
  selectedTrip: null,
  selectedStation: "",
  stationName: "",
  factor: scaleFactor,
  peakSpottingTrips: undefined,
  peakSpottingPaginatedTrips: undefined,
  peakSpottingSelectedTrip: undefined,
  peakSpottingCurrentPage: 1,
});
SankeyContext.displayName = "SankeyContext";

export const useSankeyContext = (): Props => useContext(SankeyContext);

/**
 * context provider
 * initialisiert context
 * @param children
 * @constructor
 */
export const SankeyContextProvider = ({
  children,
}: {
  children: JSX.Element;
}): JSX.Element => {
  const [endTime, setEndTime] = useState(
    new Date(
      new Date(config.station_startDate).getTime() +
        1000 * 60 * config.station_timeInterval
    )
  );
  const [startTime, setStartTime] = useState(
    new Date(config.station_startDate)
  );
  const [stationId, setStationId] = useState("");
  const [stationStatus, setStationStatus] = useState<"loading" | "success">(
    "loading"
  );

  const [tripName, setTripName] = useState("");
  const [selectedTrip, setSelectedTrip] = useState<TripId | null>(null);
  const [selectedStation, setSelectedStation] = useState("");
  const [stationName, setStationName] = useState("");
  const [factor, setFactor] = useState(scaleFactor);
  const [peakSpottingTrips, setPeakSpottingTrips] = useState<
    PaxMonFilteredTripInfo[] | undefined
  >(undefined);
  const [peakSpottingPaginatedTrips, setPeakSpottingPaginatedTrips] = useState<
    PaxMonFilteredTripInfo[] | undefined
  >(undefined);
  const [peakSpottingSelectedTrip, setPeakSpottingSelectedTrip] = useState<
    PaxMonFilteredTripInfo | undefined
  >(undefined);
  const [peakSpottingCurrentPage, setPeakSpottingCurrentPage] = useState(1);

  return (
    <SankeyContext.Provider
      value={{
        stationId,
        setStationId,
        startTime,
        setStartTime,
        endTime,
        setEndTime,
        stationStatus,
        setStationStatus,
        tripName,
        setTripName,
        selectedTrip,
        setSelectedTrip,
        selectedStation,
        setSelectedStation,
        stationName,
        setStationName,
        factor,
        setFactor,
        peakSpottingTrips,
        setPeakSpottingTrips,
        peakSpottingPaginatedTrips,
        setPeakSpottingPaginatedTrips,
        peakSpottingSelectedTrip,
        setPeakSpottingSelectedTrip,
        peakSpottingCurrentPage,
        setPeakSpottingCurrentPage,
      }}
    >
      {children}
    </SankeyContext.Provider>
  );
};
