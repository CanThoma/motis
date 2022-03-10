import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";

import "./index.css";
import SankeyPicker from "./components/SankeyPicker";
import { QueryClient, QueryClientProvider } from "react-query";
import TimeControl from "./components/TimeControl";
import UniverseControl from "./components/UniverseControl";

import { TripId } from "./api/protocol/motis";
import getQueryParameters from "./util/queryParameters";
import TripDetails from "./components/TripDetails";
import SankeyStationGraph from "./components/SankeyStationGraph";

//import "antd/dist/antd.css";
import "./global-styles.css";
//import "./components/common/styles/tooltip.css";

import "./components/Modal.styles.css";
import ScrollToUpdate from "./components/common/scrollToUpdate";

import TimeInput from "./components/measures/TimeInput";
import InputSlider from "./components/common/inputSlider";
import Navbar from "./components/common/navbar";
import Legend from "./components/legend";
import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";
import StationPage from "./components/StationPage";
import TripPage from "./components/TripPage";

import {
  SankeyContextProvider,
  useSankeyContext,
} from "./components/context/SankeyContext";
import TripPage2 from "./components/TripPage2";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});

const allowForwarding = getQueryParameters()["allowForwarding"] === "yes";

const App = (): JSX.Element => {
  const [data, setDate] = useState(null);
  const [width, setWidth] = useState(1000);
  const [height, setHeight] = useState(600);
  const [hedline, setHeadline] = useState("");
  const [subhedline, setSubHeadline] = useState("");
  //const[target, setTarget] = useState(true)
  const [key, setKey] = useState(1);
  const [selectedTrip, setSelectedTrip] = useState(null);
  //  const [selectedStation, setSelectedStation] = useState("");
  //  const [stationName, setStationName] = useState("");
  const [tripName, setTripName] = useState("");
  const [activePage, setActivePage] = useState(3); // TODO: 0 oder 1
  const [showStationControls, setShowStationControls] = useState(false);
  const [simActive, setSimActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showControls, setShowControls] = useState(true);
  //  const [startTime, setStartTime] = useState(new Date());
  //  const [endTime, setEndTime] = useState(new Date());
  const [startTmpTime, setStartTmpTime] = useState(new Date());
  const [endTmpTime, setEndTmpTime] = useState(new Date());
  const [factor, setFactor] = useState(15);

  const pages = ["Trip Graph", "Station Graph", "🫀", "Peak Spotting"];

  const svgRef = React.createRef();

  const valueRef = React.createRef();

  const { selectedStation, setSelectedStation, stationName, setStationName } =
    useSankeyContext();

  /*
  toggleTarget(target: boolean, key: number) {
    this.setState({ target: false });
  }
  */

  useEffect(() => {
    window.addEventListener("keydown", handleKeyboardNavigation);

    return () => {
      window.removeEventListener("keydown", handleKeyboardNavigation);
    };
  }, [activePage]);

  const handleKeyboardNavigation = (e) => {
    if (e.key === "ArrowLeft") {
      setActivePage(activePage === 0 ? pages.length - 1 : activePage - 1);
    } else if (e.key === "ArrowRight") {
      setActivePage(activePage === pages.length - 1 ? 0 : activePage + 1);
    }
  };

  const changeWidth = (width, height = 600) => {
    setHeight(height);
    setWidth(width);
  };

  const handleChange = (evt) => {
    const newWidth = evt.target.validity.valid ? evt.target.value : width;

    setWidth({ newWidth });
  };

  const handleFactorChange = (i) => {
    console.log(i.target.value);
    setFactor(i.target.value);
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
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          </div>
        )}
        {activePage === 0 && (
          <TripPage
            tripName={tripName}
            width={width}
            selectedTrip={selectedTrip}
            onTripPicked={(trip) => {
              setSelectedTrip(trip);
              setTripName(trip?.train_nr);
            }}
            onStationSelected={handleStationSelect}
          />
        )}
        {activePage === 1 && (
          <StationPage
            selectedStation={selectedStation}
            onStationPicked={(station) => {
              setSelectedStation(station?.id);
              setStationName(station?.name);
            }}
            onLoad={(b) => {
              console.log("HAlihalo – " + b);
              setLoading(b);
            }}
            onTripSelected={handleTripSelect}
          />
        )}
        {activePage === 2 && (
          <>
            <img
              className="m-auto"
              src="https://img.pr0gramm.com/2021/10/15/2b2b32f223adaf2b.jpg"
              alt="Bahn"
            />
            <img
              className="m-auto"
              src="https://img.pr0gramm.com/2022/02/17/0d69eeb925d5d070.jpg"
              alt="Bahn"
            />
            <img
              className="m-auto"
              src="https://img.pr0gramm.com/2022/02/07/0e3af3882f0a2091.png"
              alt="Bahn"
            />

            <img
              className="m-auto"
              src="https://img.pr0gramm.com/2021/11/05/49c162d9523a7954.jpg"
              alt="Bahn"
            />
          </>
        )}
        {activePage === 3 && (
          <>
            <TripPage2 />
          </>
        )}
      </SankeyContextProvider>
    </QueryClientProvider>
  );
};

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
