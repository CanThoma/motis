import React, { useState, useEffect } from "react";
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

type PeakSpottingProps = {
  width: number;
};

const PeakSpotting = ({
  width = Math.max(config.minWidth, window.screen.availWidth / 2) -
    config.globalPadding,
}: PeakSpottingProps): JSX.Element => {
  const [universe] = useAtom(universeAtom);
  const { data: status } = usePaxMonStatusQuery(universe);

  const [pageSize] = useState(config.pageSize);
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
  const handleSelect = async ({
    label,
    value,
  }: {
    label: string;
    value: "MostCritical" | "ExpectedPax" | "FirstDeparture";
  }) => {
    await setRefetchFlag(true);
    await setComponentIsRendered(false);
    if (setSortBy) await setSortBy({ label, value });
    setShowDropDown(false);

    refetch();
  };

  /**
   * Passt den MaxResults-parameter an und setzt ein paar Frontendflags zur Darstellung der Ladeanimation
   *
   * @param num Wie viele Züge sollen maximal angezeigt werden können?
   */
  const handleMaxResultChange = async (num: number) => {
    await setComponentIsRendered(false);
    await setRefetchFlag(true);
    await setMaxResults(num);

    refetch();
  };

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
              {sortBy.label}
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
                      label: "den Erwarteten Passagieren",
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
                      label: "der Kritikalität der Fahrten",
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
                      label: "der Abfahrtszeit",
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
            Anzahl Züge (bin nur ein Provisorium)
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
              const target = v.target as HTMLTextAreaElement;
              const tim = parseInt(target.value);
              if (isNaN(tim)) return;
              target.blur();
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
                      trip={d}
                      width={width}
                      selectedTrip={selectedTrip}
                      onClick={() => {
                        if (setSelectedTrip) setSelectedTrip(d);
                      }}
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
