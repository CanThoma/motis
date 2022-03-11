import React from "react";

import SankeyTripGraph from "./SankeyTripGraph";
import TripPicker from "../../TripPicker";

import { TripId } from "../../../api/protocol/motis";
import { useSankeyContext } from "../../context/SankeyContext";

type TripPageProps = {
  tripName: string;
  width: number;
  selectedTrip: TripId | undefined;
  onTripPicked: (tripId: TripId | undefined) => void;
  onStationSelected: () => void;
};

const TripPage = ({ onStationSelected, width }: TripPageProps): JSX.Element => {
  const {
    tripName,
    selectedTrip,
    setSelectedTrip,
    setTripName,
    setSelectedStation,
    setStationName,
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
          <SankeyTripGraph
            tripId={selectedTrip}
            width={width}
            onStationSelected={(selectedStation: string, name: string) => {
              // TODO: DIE ZEIT MUSS NOCH GESETZT WERDEN.
              if (setSelectedStation) setSelectedStation(selectedStation);
              else
                console.warn(
                  "Internal Server Error: setSElectedStation not defined!"
                );
              if (setStationName) setStationName(name);
              else
                console.warn(
                  "Internal Server Error: setStationName not defined!"
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
