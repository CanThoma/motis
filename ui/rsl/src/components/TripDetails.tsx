import React, { useState } from "react";

import {TripId, TripServiceInfo} from "../api/protocol/motis";
import { PaxMonEdgeLoadInfoWithStats } from "../data/loadInfo";

import TripLoadForecastCharts from "./TripLoadForecastChart";
import TripSectionDetails from "./TripSectionDetails";

type TripDetailsProps = {
  tripId: TripId;
  onSectionDetailClick: (trip: TripId | undefined) => void;
};

function TripDetails({ tripId,onSectionDetailClick }: TripDetailsProps): JSX.Element {
  const [selectedSection, setSelectedSection] =
    useState<PaxMonEdgeLoadInfoWithStats>();

  return (
    <div>
      {/*< TripLoadForecastCharts.TripLoadForecastChart
        tripId={tripId}
        mode="Interactive"
        onSectionClick={setSelectedSection}
      />*/}
      <TripLoadForecastCharts.TripLoadForecastChartVertical
        tripId={tripId}
        mode="Interactive"
        onSectionClick={setSelectedSection}
      />

      {selectedSection && (
        <TripSectionDetails
          tripId={tripId}
          selectedSection={selectedSection}
          onSectionDetailClick={onSectionDetailClick}
          onClose={() => setSelectedSection(undefined)}
        />
      )}
    </div>
  );
}

export default TripDetails;
