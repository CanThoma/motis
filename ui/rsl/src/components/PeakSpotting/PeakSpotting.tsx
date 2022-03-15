import React, { useState, useEffect } from "react";
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

  const [pageSize, setPageSize] = useState(7);

  const [refetchFlag, setRefetchFlag] = useState(true);
  const [maxResults, setMaxResults] = useState(50);

  const [componentIsRendered, setComponentIsRendered] = useState(false);

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
    max_results: maxResults,
    skip_first: 0,
  };

  async function loadAndProcessTripInfo(
    filterTripRequest: PaxMonFilterTripsRequest
  ) {
    console.log("CALLED");
    if (!refetchFlag) return;
    console.log("ACHTUNG");

    const res = await sendPaxMonFilterTripsRequest(filterTripRequest);

    if (!res.trips) return;

    setPaginatedTrips(paginate(res.trips, 1, pageSize));

    //if (!selectedTrip || refetchFlag)
    setSelectedTrip(res.trips[0]);
    //if (!peakSpottingTrips || refetchFlag)
    setPeakSpottingTrips(res.trips);
    setCurrentPage(1);
    setRefetchFlag(false);
  }

  const handlePageChange = (page) => {
    setCurrentPage(page);
    setPaginatedTrips(paginate(peakSpottingTrips, page, pageSize));
  };

  const {
    data,
    status: loadingStatus,
    isLoading,
    refetch,
  } = useQuery(
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
    await setRefetchFlag(true);
    await setComponentIsRendered(false);
    await setSortBy({ displayText, value });
    setShowDropDown(false);
    refetch();
  };
  const handleMaxResultChange = async (num) => {
    await setComponentIsRendered(false);
    await setRefetchFlag(true);
    await setMaxResults(num);
    refetch();
  };
  // ENDE

  useEffect(() => {
    setComponentIsRendered(true);
  }, [peakSpottingTrips]);

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
        <div>
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
                      displayText: "den Erwarteten Passagieren",
                      value: "ExpectedPax",
                    })
                  }
                >
                  den Erwarteten Passagieren
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
        <div style={{ marginLeft: "20px" }}>
          <h3
            style={{
              color: "rgb(52, 58, 64)",
              fontSize: "15px",
              marginRight: "0.4rem",
            }}
          >
            Anzahl Züge
          </h3>
          <input
            className="form-control form-control-sm"
            type="text"
            placeholder="50"
            onBlur={(v) => {
              const tim = parseInt(v.target.value);
              if (isNaN(tim)) return;

              handleMaxResultChange(tim);
            }}
            onKeyDown={(v) => {
              if (v.key !== "Enter") return;
              const tim = parseInt(v.target.value);
              if (isNaN(tim)) return;
              v.target.blur();
            }}
          />
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
            {(isLoading || !componentIsRendered) && <Loading />}
            {loadingStatus === "success" &&
              paginatedTrips &&
              peakSpottingTrips && (
                <div
                  style={{
                    opacity: componentIsRendered ? 1 : 0.5,
                  }}
                >
                  {/** Der eigentliche Teil */}
                  {paginatedTrips.map((d) => (
                    <HorizontalTripDisplay
                      key={`${d.tsi.service_infos[0].train_nr}-${d.tsi.trip.time}`}
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
                </div>
              )}
          </div>
        </>

        {/** Prognose und so */}
        {selectedTrip && (
          <>
            <div
              style={{
                marginLeft: "0px",
                marginRight: "5px",
                width: width,
                opacity: componentIsRendered ? 1 : 0.5,
                cursor: componentIsRendered ? "default" : "not-allowed",
              }}
            >
              <VerticalTripDisplay trip={selectedTrip} width={width} />
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PeakSpotting;
