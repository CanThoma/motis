import React, { useState } from "react";
import ReactDOM from "react-dom";

import "./index.css";
import SankeyGraph from "./components/SankeyGraph";
import SankeyPicker from "./components/SankeyPicker";
import { QueryClient, QueryClientProvider } from "react-query";
import TimeControl from "./components/TimeControl";
import UniverseControl from "./components/UniverseControl";
import MeasureInput from "./components/measures/MeasureInput";
import TripPicker from "./components/TripPicker";
import { TripId } from "./api/protocol/motis";
import getQueryParameters from "./util/queryParameters";
import TripDetails from "./components/TripDetails";
import SankeyStationGraph from "./components/SankeyStationGraph";
import StationPicker from "./components/StationPicker";

import "./components/Modal.styles.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: true, staleTime: 10000 },
  },
});
const allowForwarding = getQueryParameters()["allowForwarding"] === "yes";
class App extends React.Component {
  state = {
    data: null,
    width: 600,
    height: 600,
    headline: "",
    subHeadline: "",
    target: true,
    key: 1,
    selectedTrip: null,
    selectedStation: null,
    stationName: "",
    tripName: "",
    showStation: false,
    simActive: false,
    loading: false,
  };
  svgRef = React.createRef();

  changeData(data: TripId | undefined) {
    console.log("change data happens");
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
    //this.setState({ data: graphDefault });
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

  handleStationSelect(selectedStation: string, name: string) {
    this.setState({
      selectedStation,
      stationName: name,
      showStation: true,
    });
  }

  handleTripSelect(selectedTrip: TripId | string, name: string) {
    this.setState({
      selectedTrip,
      tripName: name,
      showStation: false,
    });
  }

  toggleStationDisplay() {
    this.setState({ showStation: !this.state.showStation });
  }

  setLoading(b: boolean) {
    this.setState({ loading: b });
  }

  render() {
    const {
      data,
      width,
      headline,
      subHeadline,
      selectedTrip,
      selectedStation,
      showStation,
      simActive,
      stationName,
      tripName,
      loading,
    } = this.state;
    const sankeyDisplay = null;
    const tripDisplay =
      selectedTrip !== null ? (
        <TripDetails
          tripId={selectedTrip}
          onSectionDetailClick={(trip) => setSelectedTrip(trip)}
        />
      ) : null;

    const someDate = new Date("Mon, 25 Oct 2021 09:15:00 GMT+2");
    const theUnixTime = someDate.getTime() / 1000;
    const startTime = theUnixTime - (theUnixTime % 1800); // dd-mm-yy 9:19 -> dd-mm-yy 9:00 ( this example timestamp 25-10-2021 9:15)
    const endTime = startTime + 30 * 60; // dd-mm-yy 9:30

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

        <div className="flex justify-between max-w-sm mx-auto mt-20">
          <button
            type="button"
            //className="inline-flex items-baseline px-3 py-1 rounded text-sm bg-db-red-500 hover:bg-db-red-600 text-white"
            className={
              !showStation
                ? "inline-flex items-baseline px-3 py-1 rounded text-sm bg-db-red-500 text-white cursor-not-allowed"
                : "px-3 py-1 rounded text-sm bg-db-red-300 text-db-red-100 hover:bg-db-red-600"
            }
            disabled={!showStation}
            onClick={this.toggleStationDisplay.bind(this)}
          >
            Trip Graph
          </button>
          <button
            type="button"
            className={
              showStation
                ? "inline-flex items-baseline px-3 py-1 rounded text-sm bg-db-red-500 text-white cursor-not-allowed"
                : "px-3 py-1 rounded text-sm bg-db-red-300 text-db-red-100 hover:bg-db-red-600"
            }
            disabled={showStation}
            onClick={this.toggleStationDisplay.bind(this)}
          >
            Station Graph
          </button>
        </div>
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
        {!showStation && (
          <>
            <div className="flex justify-between w-full">
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
                  <span>Trip:</span>
                  <TripPicker
                    onTripPicked={(trip) =>
                      this.setState({
                        selectedTrip: trip,
                        tripName: trip?.train_nr,
                      })
                    }
                    clearOnPick={false}
                    longDistanceOnly={true}
                    placeHolder={tripName}
                    className="w-96"
                  />
                </div>
              </div>
            </div>
            <div className="app mt-16 text-center" >
              <h1>{subHeadline}</h1>
              <h2 className="text-gray-500">{headline}</h2>
              {selectedTrip && (
                <SankeyGraph
                  tripId={selectedTrip}
                  width={width}
                  onStationSelected={this.handleStationSelect.bind(this)}
                />
              )}
            </div>
          </>
        )}
        {showStation && (
          <>
            <div className="flex justify-between w-full">
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
                      this.setState({
                        selectedStation: station?.id,
                        stationName: station?.name,
                      })
                    }
                    clearOnPick={false}
                    placeHolder={stationName}
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
                  maxCount={0}
                  width={1200} // TODO: ist mehr son Test.
                  onTripSelected={this.handleTripSelect.bind(this)}
                  setLoading={this.setLoading.bind(this)}
                />
              )}
            </div>
          </>
        )}
      </QueryClientProvider>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
