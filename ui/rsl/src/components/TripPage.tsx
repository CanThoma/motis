import React from "react";

import SankeyGraph from "./SankeyGraph";
import TripPicker from "./TripPicker";

import { TripId } from "../api/protocol/motis";
import { useSankeyContext } from "./context/SankeyContext";

type TripPageProps = {
  tripName: string;
  width: number;
  selectedTrip: TripId | undefined;
  onTripPicked: (tripId: TripId | undefined) => void;
  onStationSelected: () => void;
};

const TripPage = ({
  //tripName,
  onTripPicked,
  onStationSelected,
  //selectedTrip,
  width,
}: TripPageProps): JSX.Element => {
  const {
    tripName,
    selectedTrip,
    setSelectedTrip,
    setTripName,
    setSelectedStation,
    setStationName,
  } = useSankeyContext();

  const handleTripPick = (trip) => {
    setSelectedTrip(trip);
    setTripName(trip?.train_nr);
  };

  return (
    <>
      <div className="flex justify-between w-full">
        <div className="flex-grow">
          <div className="mt-6 flex items-center justify-center gap-2">
            <span>Trip:</span>
            <TripPicker
              onTripPicked={handleTripPick}
              clearOnPick={false}
              longDistanceOnly={true}
              placeHolder={tripName}
              className="w-96"
            />
          </div>
        </div>
      </div>
      <div className="app mt-16 text-center">
        {selectedTrip && (
          <SankeyGraph
            tripId={selectedTrip}
            width={width}
            onStationSelected={(selectedStation: string, name: string) => {
              // TODO: DIE ZEIT MUSS NOCH GESETZT WERDEN.
              setSelectedStation(selectedStation);
              setStationName(name);
              onStationSelected();
            }}
          />
        )}
      </div>
    </>
  );
};

export default TripPage;
