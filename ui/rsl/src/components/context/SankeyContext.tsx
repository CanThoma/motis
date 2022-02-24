import React, { createContext, useState, useContext } from "react";

import config from "../../config";

export const SankeyContext = createContext({});
SankeyContext.displayName = "SankeyContext";

export const useSankeyContext = () => useContext(SankeyContext);

// context provider
export const SankeyContextProvider = ({ children }) => {
  const [endTime, setEndTime] = useState(
    new Date(
      new Date(config.station_startDate).getTime() +
        1000 * 60 * config.station_timeInterval
    )
  );
  const [startTime, setStartTime] = useState(
    new Date(config.station_startDate)
  );
  const [stationId, setStationId] = useState(null);
  const [stationStatus, setStationStatus] = useState<"loading" | "success">(
    "loading"
  );

  const [tripName, setTripName] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedStation, setSelectedStation] = useState("");
  const [stationName, setStationName] = useState("");
  const [factor, setFactor] = useState(15); // TODO: später in config auslagern.

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
      }}
    >
      {children}
    </SankeyContext.Provider>
  );
};
