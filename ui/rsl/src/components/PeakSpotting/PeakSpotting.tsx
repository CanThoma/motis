import React, { useState, useRef } from "react";
import HorizontalTripDisplay from "./HorizontalTripDisplay";

import HorizontalTripDisplayTitle from "./HorizontalTripDisplayTitle";
import VerticalTripDisplay from "./VerticalTripDiplay";

import "./HorizontalTripDisplay.css";
import { colorSchema } from "../../config";

import { useQuery, useQueryClient } from "react-query";
import { useAtom } from "jotai";

import { PaxMonFilterTripsRequest } from "../../api/protocol/motis/paxmon";

import {
  queryKeys,
  sendPaxMonFilterTripsRequest,
  usePaxMonStatusQuery,
} from "../../api/paxmon";
import { universeAtom } from "../../data/simulation";
import Pagination from "../common/pagination";
import { paginate } from "./HorizontalTripDisplayUtils";
import { useSankeyContext } from "../context/SankeyContext";
import Loading from "../common/Loading";

import "./HorizontalTripDisplay.css";

const PeakSpotting = ({
  width = Math.max(900, window.screen.availWidth / 2) - 10,
}) => {
  // Voll so das Sammeln der Daten aus

  const [universe] = useAtom(universeAtom);
  const { data: status } = usePaxMonStatusQuery(universe);

  const [pageSize, setPageSize] = useState(10);

  const {
    setPeakSpottingTrips,
    peakSpottingTrips,
    peakSpottingPaginatedTrips: paginatedTrips,
    setPeakSpottingPaginatedTrips: setPaginatedTrips,
    peakSpottingSelectedTrip: selectedTrip,
    setPeakSpottingSelectedTrip: setSelectedTrip,
    peakSpottingCurrentPage: currentPage,
    setPeakSpottingCurrentPage: setCurrentPage,
  } = useSankeyContext();

  const queryClient = useQueryClient();

  const [sortBy, setSortBy] = useState({
    displayText: "der Kritikalität der Fahrten",
    value: "MostCritical",
  });
  const [showDropDown, setShowDropDown] = useState(false);

  const filterTripRequest: PaxMonFilterTripsRequest = {
    universe,
    ignore_past_sections: false,
    include_load_threshold: 0.0,
    critical_load_threshold: 1.0,
    crowded_load_threshold: 0.8,
    include_edges: true,
    sort_by: sortBy.value,
    max_results: 50,
    skip_first: 0,
  };

  async function loadAndProcessTripInfo(
    filterTripRequest: PaxMonFilterTripsRequest
  ) {
    const res = await sendPaxMonFilterTripsRequest(filterTripRequest);
    setPaginatedTrips(paginate(res.trips, 1, pageSize));
    if (!status) {
      console.log("AAAAAAAAAAAAAAAAAAA");
    }
    //if (!selectedTrip || refetchFlag)
    setSelectedTrip(res.trips[0]);
    //if (!peakSpottingTrips || refetchFlag)
    setPeakSpottingTrips(res.trips);
    setCurrentPage(1);
    return res.trips;
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setPaginatedTrips(paginate(data, page, pageSize));
  };

  const { data, isLoading, refetch } = useQuery(
    queryKeys.filterTrips(filterTripRequest),
    async () => loadAndProcessTripInfo(filterTripRequest),
    {
      enabled: !!status,
      placeholderData: () => {
        return universe != 0
          ? queryKeys.filterTrips(filterTripRequest)
          : undefined;
      },
    }
  );
  const handleSelect = async ({ displayText, value }) => {
    await setSortBy({ displayText, value });
    setShowDropDown(false);
    refetch();
  };
  // ENDE

  return (
    <div style={{ backgroundColor: colorSchema.lightGrey }}>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          paddingTop: "1.5rem",
        }}
      >
        <h3
          style={{
            color: "rgb(52, 58, 64)",
            fontSize: "15px",
            marginRight: "0.4rem",
          }}
        >
          Sortieren nach:{" "}
        </h3>
        <div className="dropdown">
          <button
            className="btn btn-primary dropdown-toggle"
            type="button"
            id="dropdownMenuButton"
            data-mdb-toggle="dropdown"
            aria-expanded="false"
            style={{ position: "relative" }}
            onClick={() => {
              setShowDropDown(!showDropDown);
            }}
          >
            {sortBy.displayText}
          </button>
          <ul
            className={showDropDown ? "dropdown-menu show" : "dropdown-menu"}
            aria-labelledby="dropdownMenuButton"
          >
            <li>
              <button
                className="dropdown-item"
                onClick={() =>
                  handleSelect({
                    displayText: "Erwarteten Passagieren",
                    value: "ExpectedPax",
                  })
                }
              >
                der Erwarteten Passagieren
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() =>
                  handleSelect({
                    displayText: "der Kritikalität der Fahrten",
                    value: "MostCritical",
                  })
                }
              >
                der Kritikalität der Fahrten
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() =>
                  handleSelect({
                    displayText: "der Abfahrtszeit",
                    value: "FirstDeparture",
                  })
                }
              >
                der Abfahrtszeit
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className="grid grid-flow-col pb-5">
        <>
          <div
            style={{ marginLeft: "10px", marginRight: "10px", width: width }}
          >
            {/** Der Titel Teil */}
            <HorizontalTripDisplayTitle
              width={width}
              title={`Alle Züge (${
                peakSpottingTrips ? peakSpottingTrips.length : 0
              })`}
            />
            {(!paginatedTrips || isLoading) && <Loading />}
            {paginatedTrips && peakSpottingTrips && (
              <>
                {/** Der eigentliche Teil */}
                {paginatedTrips.map((d) => (
                  <HorizontalTripDisplay
                    key={d.tsi.service_infos[0].train_nr}
                    tripData={d}
                    width={width}
                    selectedTrip={selectedTrip}
                    onClick={() => setSelectedTrip(d)}
                  />
                ))}
                <Pagination
                  itemsCount={peakSpottingTrips.length}
                  pageSize={pageSize}
                  onPageChange={handlePageChange}
                  currentPage={currentPage}
                />
              </>
            )}
          </div>
        </>

        {/** Prognose und so */}
        {selectedTrip && (
          <div style={{ marginLeft: "0px", marginRight: "5px", width: width }}>
            <VerticalTripDisplay trip={selectedTrip} width={width} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PeakSpotting;
