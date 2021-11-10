import React, { useState } from "react";

import { TripId } from "../api/protocol/motis";
import { PaxMonEdgeLoadInfoWithStats } from "../data/loadInfo";

import TripLoadForecastCharts from "./TripLoadForecastChart";
import TripSectionDetails from "./TripSectionDetails";

type TripDetailsProps = {
  tripId: TripId;
};

function TripDetails({ tripId }: TripDetailsProps): JSX.Element {
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
          onClose={() => setSelectedSection(undefined)}
        />
      )}
    </div>
  );
}

export default TripDetails;
