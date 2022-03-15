import React, { useState, useEffect, useRef } from "react";
import { useQuery } from "react-query";
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
import { colorSchema, peakSpottingConfig as config } from "../../config";
import HorizontalTripDisplay from "./HorizontalTripDisplay";
import HorizontalTripDisplayTitle from "./HorizontalTripDisplayTitle";
import VerticalTripDisplay from "./VerticalTripDiplay";

import "./HorizontalTripDisplay.css";

const PeakSpotting = (): JSX.Element => {
  const width =
    Math.max(config.minWidth, window.screen.availWidth / 2) -
    config.globalPadding;
  const [universe] = useAtom(universeAtom);
  const { data: status } = usePaxMonStatusQuery(universe);

  const containerRef = useRef<HTMLDivElement>(null);
  const [pageSize, setPageSize] = useState(1);

  const [refetchFlag, setRefetchFlag] = useState(false);
  const [maxResults, setMaxResults] = useState(config.initialSearchResults);
  const [showDropDown, setShowDropDown] = useState(false);
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
    peakSpottingsortBy: sortBy,
    setPeakSpottingSortBy: setSortBy,
  } = useSankeyContext();

  const filterTripRequest: PaxMonFilterTripsRequest = {
    universe,
    ignore_past_sections: config.initialIgnorePastSections,
    include_load_threshold: config.initialIncludeLoadThreshold,
    critical_load_threshold: config.initialCriticalLoadThreshold,
    crowded_load_threshold: config.initialCrowdedLoad_threshold,
    include_edges: true, // Muss gesetzt sein, da die edges wichtig für die Darstellung sind.
    sort_by: sortBy.value,
    max_results: maxResults,
    skip_first: config.initialSkipFirst,
  };

  /**
   * Läd die Fahrten entsprechend der in filterTripRequest gesetzten Parameter
   * @param filterTripRequest Suchfilterparamter
   * @returns
   */
  async function loadAndProcessTripInfo(
    filterTripRequest: PaxMonFilterTripsRequest
  ) {
    if (peakSpottingTrips && !refetchFlag) return;
    console.log(window.innerHeight);
    setPageSize(Math.floor((window.innerHeight - 246.4) / 85));

    const res = await sendPaxMonFilterTripsRequest(filterTripRequest);

    if (!res.trips) return;

    if (setPaginatedTrips) setPaginatedTrips(paginate(res.trips, 1, pageSize));

    if (setSelectedTrip) setSelectedTrip(res.trips[0]);

    if (setPeakSpottingTrips) setPeakSpottingTrips(res.trips);

    if (setCurrentPage) setCurrentPage(1);
    setRefetchFlag(false);
  }

  /**
   * Teilt die Liste aller Züge in Seiten ein und zeigt die entsprechende an.
   * @param page Welche Seite soll angezeigt werden?
   */
  const handlePageChange = (page: number) => {
    if (setCurrentPage) setCurrentPage(page);

    if (setPaginatedTrips)
      setPaginatedTrips(paginate(peakSpottingTrips, page, pageSize));
  };

  const {
    status: loadingStatus,
    isLoading,
    refetch,
  } = useQuery(
    queryKeys.filterTrips(filterTripRequest),
    async () => loadAndProcessTripInfo(filterTripRequest),
    {
      enabled: !!status,
    }
  );

  /**
   * Passt den Sortierparameter an und setzt ein paar Frontendflags zur Darstellung der Ladeanimation
   *
   * @param param0 Ein Objekt zur Sortierung der Trips.
   * Label ist der Anzeigetext und value der eigentliche Sortierparameter
   */
  const handleSelect = ({
    label,
    value,
  }: {
    label: string;
    value: "MostCritical" | "ExpectedPax" | "FirstDeparture";
  }) => {
    setShowDropDown(false);
    setComponentIsRendered(false);
    setRefetchFlag(true);
    if (setSortBy) setSortBy({ label, value });
  };

  useEffect(() => {
    refetch();
  }, [refetchFlag, refetch]);

  useEffect(() => {
    if (setPaginatedTrips)
      setPaginatedTrips(paginate(peakSpottingTrips, 1, pageSize));
  }, [pageSize, setPaginatedTrips, peakSpottingTrips]);

  window.addEventListener("resize", () =>
    setPageSize(Math.floor((window.innerHeight - 246.4) / 85))
  );

  /**
   * Passt den MaxResults-parameter an und setzt ein paar Frontendflags zur Darstellung der Ladeanimation
   *
   * @param num Wie viele Züge sollen maximal angezeigt werden können?
   */
  const handleMaxResultChange = (num: number) => {
    setComponentIsRendered(false);
    setMaxResults(num);
    setRefetchFlag(true);
  };

  useEffect(() => {
    setPageSize(Math.floor((window.innerHeight - 352.4) / 85));
  }, []);

  useEffect(() => {
    setComponentIsRendered(true);
  }, [peakSpottingTrips]);

  return (
    <div className="flex flex-col h-full">
      {/*menus leiste*/}
      <div className="flex-initial py-[1.5rem] flex justify-center items-center">
        <h3 className="text-base px-2 text-db-cool-gray-800">Sortierung: </h3>
        <div className="dropdown">
          <button
            className="btn btn-primary dropdown-toggle relative w-60"
            type="button"
            id="dropdownMenuButton"
            data-mdb-toggle="dropdown"
            aria-expanded="false"
            onClick={() => setShowDropDown(!showDropDown)}
          >
            {sortBy.label}
          </button>
          <ul
            className={`${
              showDropDown ? "dropdown-menu show" : "dropdown-menu"
            } w-60`}
            aria-labelledby="dropdownMenuButton"
          >
            <li>
              {" "}
              {/*TODO fix handleselect*/}
              <button
                className="dropdown-item"
                onClick={() =>
                  handleSelect({
                    label: "Erwartete Passagiere",
                    value: "ExpectedPax",
                  })
                }
              >
                Erwartete Passagiere
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() =>
                  handleSelect({
                    label: "Kritikalität der Fahrten",
                    value: "MostCritical",
                  })
                }
              >
                Kritikalität der Fahrten
              </button>
            </li>
            <li>
              <button
                className="dropdown-item"
                onClick={() =>
                  handleSelect({
                    label: "Abfahrtszeiten",
                    value: "FirstDeparture",
                  })
                }
              >
                Abfahrtszeiten
              </button>
            </li>
          </ul>
        </div>
        <h3 className="text-base px-2 text-db-cool-gray-800">Anzahl Züge:</h3>
        <input
          className="form-control form-control-sm mr-10"
          type="text"
          placeholder="50"
          onBlur={(input) => {
            const maxPax = parseInt(input.target.value);
            if (isNaN(maxPax)) return;

            handleMaxResultChange(maxPax);
          }}
          onKeyDown={(input) => {
            if (input.key !== "Enter") return;
            const target = input.target as HTMLInputElement;

            target.blur();
          }}
        />
      </div>
      {/*Körper*/}
      <div className="flex-auto flex flex-row justify items-top overflow-x-scroll hide-scrollbar mb-5">
        {/*horizontal*/}
        <div
          className="mx-1 px-2 border-2 border-db-cool-gray-200 flex flex-col"
          style={{ backgroundColor: colorSchema.lightGrey }}
          ref={containerRef}
        >
          {/* Der Titel Teil */}
          <div className="flex-initial">
            <HorizontalTripDisplayTitle
              width={width}
              title={`Alle Züge (${
                peakSpottingTrips ? peakSpottingTrips.length : 0
              })`}
            />
          </div>
          {/* der Graph */}
          <div className="flex-auto">
            {(isLoading || !componentIsRendered) && <Loading />}
            {loadingStatus === "success" &&
              paginatedTrips &&
              peakSpottingTrips && (
                <div
                  className="flex flex-col h-full"
                  style={{
                    opacity: componentIsRendered ? 1 : 0.5,
                  }}
                >
                  {/** Der eigentliche Teil */}
                  <div className="flex-auto">
                    {paginatedTrips.map((d) => (
                      <HorizontalTripDisplay
                        key={`${d.tsi.service_infos[0].train_nr}-${d.tsi.trip.time}`}
                        trip={d}
                        width={width}
                        selectedTrip={selectedTrip}
                        onClick={() => {
                          if (setSelectedTrip) setSelectedTrip(d);
                        }}
                      />
                    ))}
                  </div>
                  <div className="">
                    <Pagination
                      itemsCount={peakSpottingTrips.length}
                      pageSize={pageSize}
                      onPageChange={handlePageChange}
                      currentPage={currentPage}
                    />
                  </div>
                </div>
              )}
          </div>
        </div>
        {/* vertical/  Prognose und so */}
        <div
          className="mx-1 border-2 border-db-cool-gray-200 h-full"
          style={{ backgroundColor: colorSchema.lightGrey }}
        >
          {selectedTrip && (
            <div
              className="mx-1 h-full"
              style={{
                opacity: componentIsRendered ? 1 : 0.5,
                cursor: componentIsRendered ? "default" : "not-allowed",
              }}
            >
              <VerticalTripDisplay trip={selectedTrip} width={width} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PeakSpotting;
