import React, { useEffect, useState } from "react";

import StationPicker from "../../StationPicker";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";

import InputSlider from "../../common/inputSlider";
import ScrollToUpdate from "../../common/scrollToUpdate";
import TimeInput from "../../measures/TimeInput";
import SankeyStationGraph from "./SankeyStationGraph";
import { TripId } from "../../../api/protocol/motis";

import config from "../../../config";
import { useSankeyContext } from "../../context/SankeyContext";

type StationPageProps = {
  onTripSelected: () => void;
};

/**
 *
 * @param onTripSelected
 * @constructor
 */
const StationPage = ({ onTripSelected }: StationPageProps): JSX.Element => {
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

  const [tmpStartTime, setTmpStartTime] = useState<Date>(new Date());
  const [tmpEndTime, setTmpEndTime] = useState<Date>(new Date());

  useEffect(() => {
    setTmpEndTime(endTime);
    setTmpStartTime(startTime);
  }, [showStationControls, endTime, startTime]);

  const handleTimeUpdate = () => {
    if (!setStartTime || !setEndTime) return;
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
    const time = new Date(
      startTime.getTime() - 1000 * 60 * config.station_timeInterval
    );

    if (!setStartTime) return;
    setStartTime(time);
    setTmpStartTime(time);
  };

  const handleRefreshDown = (): void => {
    const time = new Date(
      endTime.getTime() + 1000 * 60 * config.station_timeInterval
    );

    if (!setEndTime) return;
    setEndTime(time);
    setTmpEndTime(time);
  };

  return (
    <>
      <div className="flex justify-between w-full">
        <div className="flex-grow">
          <div className="mt-6 flex items-center justify-center gap-2">
            <span>Station:</span>
            <StationPicker
              onStationPicked={(station) => {
                if (!setSelectedStation || !setStationName || !station) return;
                setSelectedStation(station.id);
                setStationName(station.name);
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
                    onChange={(factor) => {
                      if (setFactor) setFactor(factor);
                      else
                        console.warn(
                          "Internal Server Error: setFactor not defined!"
                        );
                    }}
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
                width={1200}
                onTripSelected={(selectedTrip: TripId, name: string) => {
                  if (setSelectedTrip) setSelectedTrip(selectedTrip);
                  else
                    console.warn(
                      "Internal Server Error: setSelectedTrip not defined!"
                    );
                  if (setTripName) setTripName(name);
                  else
                    console.warn(
                      "Internal Server Error: setTripName not defined!"
                    );
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
