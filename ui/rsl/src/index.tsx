import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import "./index.old.css";
import { QueryClient, QueryClientProvider } from "react-query";
import TimeControl from "./components/TimeControl";
import UniverseControl from "./components/UniverseControl";
import getQueryParameters from "./util/queryParameters";
import "./global-styles.css";
import "./components/Sankey/TripGraph/Modal/Modal.styles.css";
import Navbar from "./components/common/navbar";
import Legend from "./components/legend";
import StationPage from "./components/Sankey/StationGraph/StationPage";
import TripPage from "./components/Sankey/TripGraph/TripPage";
import PeakSpotting from "./components/PeakSpotting/PeakSpotting";

import {
  SankeyContextProvider,
  useSankeyContext,
} from "./components/context/SankeyContext";
import { TripId } from "./api/protocol/motis";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});

const allowForwarding = getQueryParameters()["allowForwarding"] === "yes";

const App = (): JSX.Element => {
  const [selectedTrip, setSelectedTrip] = useState<TripId | null>(null);
  const [tripName, setTripName] = useState("");
  const [activePage, setActivePage] = useState(1);
  const [simActive, setSimActive] = useState(false);
  const [loading, setLoading] = useState(false);

  const pages = ["Trip Graph", "Station Graph", "Peak Spotting"];

  const { selectedStation, setSelectedStation, stationName, setStationName } =
    useSankeyContext();

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardNavigation);

    return () => {
      window.removeEventListener("keydown", handleKeyboardNavigation);
    };
  }, [activePage]);

  const handleKeyboardNavigation = (e: KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      setActivePage(activePage === 0 ? pages.length - 1 : activePage - 1);
    } else if (e.key === "ArrowRight") {
      setActivePage(activePage === pages.length - 1 ? 0 : activePage + 1);
    }
  };

  const handleStationSelect = () => {
    setActivePage(1);
  };

  const handleTripSelect = () => {
    setActivePage(0);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <SankeyContextProvider>
        <div>
          <div
            className="fixed top-0 w-full z-20 flex justify-center items-baseline space-x-4 p-2
              bg-db-cool-gray-200 text-black divide-x-2 divide-db-cool-gray-400"
          >
            <TimeControl allowForwarding={allowForwarding} />
            <UniverseControl />
            <div className="flex pl-4">
              <button
                type="button"
                className="bg-db-red-500 px-3 py-1 rounded text-white text-sm hover:bg-db-red-600"
                onClick={() => setSimActive(!simActive)}
              >
                Maßnahmensimulation
              </button>
            </div>
          </div>
          <div className="flex place-content-center mx-auto mt-20">
            <Navbar
              pages={pages}
              onChange={(page) => setActivePage(page)}
              activePage={activePage}
            />
          </div>
          <Legend />
          {loading && (
            <div className="flex justify-center max-w-sm mx-auto mt-20">
              <div className="lds-ring">
                <div />
                <div />
                <div />
                <div />
              </div>
            </div>
          )}
          {activePage === 0 && (
            <TripPage
              tripName={tripName}
              selectedTrip={selectedTrip}
              onTripPicked={(trip) => {
                if (trip) {
                  setSelectedTrip(trip);
                  setTripName(String(trip.train_nr));
                } else
                  console.warn("Internal Server Error: TripId not defined!");
              }}
              onStationSelected={handleStationSelect}
            />
          )}
          {activePage === 1 && (
            <StationPage onTripSelected={handleTripSelect} />
          )}
          {activePage === 2 && (
            <>
              <PeakSpotting />
            </>
          )}
        </div>
      </SankeyContextProvider>
    </QueryClientProvider>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
