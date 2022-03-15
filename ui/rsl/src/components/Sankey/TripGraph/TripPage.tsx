import React from "react";

import SankeyTripGraph from "./SankeyTripGraph";
import TripPicker from "../../TripPicker";

import { TripId } from "../../../api/protocol/motis";
import { useSankeyContext } from "../../context/SankeyContext";

type TripPageProps = {
  tripName: string;
  selectedTrip: TripId | null;
  onTripPicked: (tripId: TripId | undefined) => void;
  onStationSelected: () => void;
};

const TripPage = ({ onStationSelected }: TripPageProps): JSX.Element => {
  const {
    selectedTrip,
    setSelectedTrip,
    tripName,
    setTripName,
    setSelectedStation,
    setStationName,
    setStartTime,
    setEndTime,
  } = useSankeyContext();

  const handleTripPick = (trip: TripId) => {
    if (!setTripName || !setSelectedTrip) return;
    setSelectedTrip(trip);
    setTripName(String(trip.train_nr));
  };

  return (
    <>
      <div className="flex justify-between w-full">
        <div className="flex-grow">
          <div className="mt-6 flex items-center justify-center gap-2">
            <span>Trip:</span>
            <div className="justify-center">
              <TripPicker
                onTripPicked={handleTripPick}
                clearOnPick={false}
                longDistanceOnly={true}
                placeHolder={tripName}
                className="w-96"
              />
            </div>
            <div className="invisible">Trip:</div>
          </div>
        </div>
      </div>
      <div className="app mt-16 text-center">
        {selectedTrip && (
          <SankeyTripGraph
            tripId={selectedTrip}
            onStationSelected={(
              selectedStation: string,
              name: string,
              time: number
            ) => {
              if (setSelectedStation) setSelectedStation(selectedStation);
              else
                console.warn(
                  "Internal Server Error: setSelectedStation not defined!"
                );
              if (setStationName) setStationName(name);
              else
                console.warn(
                  "Internal Server Error: setStationName not defined!"
                );
              // set startTime to arrival time of selected train - 5 minutes ( - 60 sec * 5) and add ms ( * 1000 )
              if (setStartTime) setStartTime(new Date((time - 60 * 5) * 1000));
              else
                console.warn(
                  "Internal Server Error: setStartTime not defined!"
                );
              // set endTime to arrival time of selected train +25 minutes ( + 60 sec * 25) and add ms ( * 1000 )
              if (setEndTime) setEndTime(new Date((time + 60 * 25) * 1000));
              else
                console.warn(
                  "Internal Server Error: setStartTime not defined!"
                );
              onStationSelected();
            }}
          />
        )}
      </div>
    </>
  );
};

export default TripPage;
