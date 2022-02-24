import React, { useEffect, useState, useCallback } from "react";

import StationPicker from "./StationPicker";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";

import InputSlider from "./common/inputSlider";
import ScrollToUpdate from "./common/scrollToUpdate";
import TimeInput from "./measures/TimeInput";
import SankeyStationGraph from "./SankeyStationGraph";
import { TripId, Station } from "../api/protocol/motis";

import config from "../config";
import { useSankeyContext } from "./context/SankeyContext";

type StationPageProps = {
  stationName: string;
  selectedStation: string;
  onStationPicked: (station: Station | undefined) => void;
  onTripSelected: () => void;
};

const StationPage = ({
  //selectedStation,
  //stationName,
  onTripSelected,
  onStationPicked,
  onLoad,
}: StationPageProps): JSX.Element => {
  const {
    setSelectedTrip,
    setTripName,
    setStartTime,
    setEndTime,
    startTime,
    endTime,
    stationName,
    factor,
    setFactor,
    selectedStation,
    setSelectedStation,
    setStationName,
  } = useSankeyContext();

  const [showStationControls, setShowStationControls] = useState(false);
  /*
const [startTime, setStartTime] = useState<Date>(new Date());
const [endTime, setEndTime] = useState<Date>(new Date());

const [factor, setFactor] = useState(15); */

  const [tmpStartTime, setTmpStartTime] = useState<Date>(new Date());
  const [tmpEndTime, setTmpEndTime] = useState<Date>(new Date());

  useEffect(() => {
    /*
    // TODO: besserer wäre sicherlicht Date.now()
    const start = new Date(config.station_startDate);
    const end = new Date(
      start.getTime() + 1000 * 60 * config.station_timeInterval
    );

    setStartTime(start);
    setTmpEndTime(end); */

    setTmpEndTime(endTime);
    setTmpStartTime(startTime);

    window.addEventListener("keydown", toggleStationControls);

    // TODO: ggf ist hier der richtige Platz für den "Loading Triggä"
    return () => {
      window.removeEventListener("keydown", toggleStationControls);
    };
  }, [showStationControls]);

  const toggleStationControls = (e) => {
    if (e.key === " ") {
      e.preventDefault();

      setShowStationControls(!showStationControls);
    }
  };

  const handleTimeUpdate = () => {
    setStartTime(tmpStartTime);
    setEndTime(tmpEndTime);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.code === "Enter") {
      (document.activeElement as HTMLElement).blur();
      handleTimeUpdate();
    }
  };

  const handleRefresh = (): void => {
    const time = startTime;
    const newTime = new Date(
      time.getTime() - 1000 * 60 * config.station_timeInterval
    );

    setStartTime(newTime);
    setTmpStartTime(newTime);
  };

  const handleRefreshDown = (): void => {
    const time = endTime;
    const newTime = new Date(
      time.getTime() + 1000 * 60 * config.station_timeInterval
    );

    setEndTime(newTime);
    setTmpEndTime(newTime);
  };

  return (
    <>
      <div className="flex justify-between w-full">
        <div className="flex-grow">
          <div className="mt-6 flex items-center justify-center gap-2">
            <span>Station:</span>
            <StationPicker
              onStationPicked={(station) => {
                setSelectedStation(station?.id);
                setStationName(station?.name);
              }}
              clearOnPick={false}
              placeHolder={stationName}
            />
          </div>
        </div>
      </div>
      <div className="App text-center">
        {/** TEST GRIDLAYOUT */}

        <div
          className="relative rounded-xl"
          style={{ padding: "0 2rem 2rem 2rem" }}
        >
          <div className="text-center font-bold  rounded-lg">
            {showStationControls && (
              <div
                className="rounded-lg grid grid-rows row-span-2 col-span-2 grid-flow-col place-content-center"
                style={{ padding: "1rem 1rem 0 1rem" }}
              >
                {/* 03 */}
                <div style={{ marginRight: "1rem" }}>
                  <InputSlider
                    label="Skalierungsfaktor:"
                    values={[1, 4, 10, 12, 15, 20, 25]}
                    unit="×"
                    onChange={setFactor}
                    value={factor}
                  />
                </div>
                <div className="m-auto" style={{ marginRight: "1rem" }}>
                  <div className="">
                    <span>Startzeit:</span>
                  </div>
                  <div className="">
                    <TimeInput
                      className="cursor-pointer"
                      value={tmpStartTime}
                      onChange={(newTime) => setTmpStartTime(newTime)}
                      onBlur={handleTimeUpdate}
                      onError={(e) => console.log(e)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
                <div className="m-auto">
                  <div>
                    <span>Endzeit:</span>
                  </div>
                  <div>
                    <TimeInput
                      className="cursor-pointer"
                      value={tmpEndTime}
                      onChange={(newTime) => setTmpEndTime(newTime)}
                      onBlur={handleTimeUpdate}
                      onError={(e) => console.log(e)}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              </div>
            )}
            <div className="p-4 rounded-lg shadow-lg grid col-span-2 row-span-1">
              {/*02*/}
              <div
                onClick={() => setShowStationControls(!showStationControls)}
                style={{ cursor: "pointer" }}
              >
                {showStationControls ? (
                  <div
                    data-tooltip="Weg mit den doofen Kontrolloptionen!"
                    data-tooltip-location="top"
                  >
                    <ChevronUpIcon className="block m-auto h-4 w-4 text-gray-500" />
                  </div>
                ) : (
                  <div
                    data-tooltip="Zeige mir weitere Kontrolloptionen!"
                    data-tooltip-location="bottom"
                  >
                    <ChevronDownIcon className="block m-auto h-4 w-4 text-gray-500" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        {/** TEST GRIDLAYOUT END */}

        {selectedStation && (
          <ScrollToUpdate
            onRefreshUP={handleRefresh}
            onRefreshDOWN={handleRefreshDown}
          >
            <div style={{ height: "100%" }}>
              <SankeyStationGraph
                stationId={selectedStation}
                startTime={startTime.getTime() / 1000}
                endTime={endTime.getTime() / 1000}
                maxCount={0}
                width={1200} // TODO: ist mehr son Test.
                onTripSelected={(
                  selectedTrip: TripId | string,
                  name: string
                ) => {
                  setSelectedTrip(selectedTrip);
                  setTripName(name);
                  onTripSelected();
                }}
                factor={factor}
              />
            </div>
          </ScrollToUpdate>
        )}
      </div>
    </>
  );
};

export default StationPage;
