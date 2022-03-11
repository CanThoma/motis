import React, { useState } from "react";
import ReactDOM from "react-dom";

import "./index.css";
import SankeyStationGraph from "./components/SankeyStationGraph";
import { stationGraphDefault } from "./components/SankeyStationTypes";
import { QueryClient, QueryClientProvider } from "react-query";
import TimeControl from "./components/TimeControl";
import UniverseControl from "./components/UniverseControl";
import MeasureInput from "./components/measures/MeasureInput";
import { TripId } from "./api/protocol/motis";
import getQueryParameters from "./util/queryParameters";
import TripDetails from "./components/TripDetails";
import StationPicker from "./components/StationPicker";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});
const allowForwarding = getQueryParameters()["allowForwarding"] === "yes";
class App extends React.Component {
  state = {
    data: null,
    width: 1200,
    height: 600,
    headline: "",
    subHeadline: "",
    target: true,
    key: 1,
    selectedStation: null,
    startTime: 0,
    endTime: 0,
    simActive: false,
  };
  svgRef = React.createRef();

  changeData(data: TripId | undefined) {
    this.setState({ data });
  }
  toggleTarget(target: boolean, key: number) {
    this.setState({ target: false });
  }
  changeHeadline(headline: { text: string; link: string; headline: string }) {
    this.setState({ headline: headline.headline, subHeadline: headline.text });
  }

  componentDidMount() {
    // Wichtig, data ist ein Object { nodes: (48) […], links: (68) […] }
    // nodes und links sind arrays aus Objects index: 0
    // ==> diese gilt es anschließend dynamisch zu erstellen.
    //     Bzw einfach die json (oder eine ähnliche Funktion) von d3 zu nutzen.

    this.setState({ data: stationGraphDefault });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.measureSVG);
  }

  changeWidth = (width, height = 600) => {
    this.setState({
      width,
      height,
    });
  };

  handleChange(evt) {
    const width = evt.target.validity.valid
      ? evt.target.value
      : this.state.width;

    this.setState({ width });
  }

  render() {
    const {
      data,
      width,
      height,
      headline,
      subHeadline,
      target,
      key,
      selectedStation,
      simActive,
    } = this.state;
    const someDate = new Date("Mon, 25 Oct 2021 09:15:00 GMT+2");
    const theUnixTime = someDate.getTime() / 1000;
    const startTime = theUnixTime - (theUnixTime % 1800); // dd-mm-yy 9:19 -> dd-mm-yy 9:00 ( this example timestamp 25-10-2021 9:15)
    const endTime = startTime + 0.5 * 60 * 60; // dd-mm-yy 9:30
    const sankeyDisplay = null;
    return (
      <QueryClientProvider client={queryClient}>
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
              onClick={() => this.setState({ simActive: !simActive })}
            >
              Maßnahmensimulation
            </button>
          </div>
        </div>

        <div className="flex justify-between w-full mt-10">
          {simActive && (
            <div
              className="h-screen sticky top-0 pt-10 flex flex-col w-full bg-db-cool-gray-200
              w-80 p-2 shadow-md overflow-visible"
            >
              <MeasureInput />
            </div>
          )}
          <div className="flex-grow">
            <div className="mt-6 flex items-center justify-center gap-2">
              <span>Station:</span>
              <StationPicker
                onStationPicked={(station) =>
                  this.setState({ selectedStation: station?.id })
                }
                clearOnPick={false}
              />
            </div>
          </div>
        </div>
        <div className="App mt-16 text-center">
          <h1>{subHeadline}</h1>
          <h2 className="text-gray-500">{headline}</h2>
          {selectedStation && (
            <SankeyStationGraph
              stationId={selectedStation}
              startTime={startTime}
              endTime={endTime}
              width={width}
            />
          )}
        </div>
      </QueryClientProvider>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
