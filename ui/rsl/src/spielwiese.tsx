import React, {useState} from "react";
import ReactDOM from "react-dom";

import "./index.css";
import SankeyGraph from "./components/SankeyGraph";
import SankeyPicker from "./components/SankeyPicker";
import { graphDefault } from "./components/SankeyTypes";
import {QueryClient, QueryClientProvider} from "react-query";
import TimeControl from "./components/TimeControl";
import UniverseControl from "./components/UniverseControl";
import MeasureInput from "./components/measures/MeasureInput";
import TripPicker from "./components/TripPicker";
import {TripId} from "./api/protocol/motis";
import getQueryParameters from "./util/queryParameters";
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
    headline: "und ich bin eine weitere, spezifizierende, Überschrift.",
    subHeadline: "Ich bin ein tolles Diagramm",
    target: true,
    targetText: "Ich kann momentan nichts. :(",
    key: 1,
    selectedTrip: null,
    simActive: false
  };
  svgRef = React.createRef();

  changeData(data: TripId | undefined) {
    console.log("change data happens");
    this.setState({ data });
  }
  toggleTarget(target: boolean, key: number) {
    this.setState({ target: false });
    this.setState({ targetText: "Giraffik auffrischen" });
  }
  changeHeadline(headline: { text: string; link: string; headline: string }) {
    this.setState({ headline: headline.headline, subHeadline: headline.text });
  }

  componentDidMount() {
    // Wichtig, data ist ein Object { nodes: (48) […], links: (68) […] }
    // nodes und links sind arrays aus Objects index: 0
    // ==> diese gilt es anschließend dynamisch zu erstellen.
    //     Bzw einfach die json (oder eine ähnliche Funktion) von d3 zu nutzen.

    this.setState({ data: graphDefault });
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
      targetText,
      key,
      selectedTrip,
      simActive
    } = this.state;
    const sankeyDisplay = selectedTrip !== null? <SankeyPicker tripId={selectedTrip}
                                                               onTripPicked={(trip) => this.changeData(trip)}
                                                               onTripPickedHeadline={(headline) => this.changeHeadline(headline)}
                                                               className="w-96"/>:null;
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
              onClick={() => this.setState({simActive: !simActive})}
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
              <span>Trip:</span>
              <TripPicker
                onTripPicked={(trip ) => this.setState({selectedTrip: trip})}
                clearOnPick={false}
                longDistanceOnly={true}
                className="w-96"
              />
            </div>
          </div>
        </div>
        <div className="App mt-16 text-center">
          <h1>{subHeadline}</h1>
          <h2 className="text-gray-500">{headline}</h2>
          <div className="mb-6 mt-6 flex items-center justify-center gap-2">
            <button
              className="bg-db-red-500 px-3 py-1 rounded text-white text-sm hover:bg-db-red-600"
              onClick={() => this.toggleTarget(target, key)}
            >
              {targetText}
            </button>
            {sankeyDisplay}
            <input
              type="text"
              pattern="[0-9]*"
              onInput={(zz) => this.handleChange(zz)}
              value={this.state.width}
              className="w-96 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
            />
          </div>

          {data && <SankeyGraph data={data} width={width} />}
        </div>
      </QueryClientProvider>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
