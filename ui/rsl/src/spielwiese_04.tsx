import React from "react";
import ReactDOM from "react-dom";
import * as d3 from "d3";

import "./index.css";
import Teetasse from "./components/Teetasse";
import TeetassenPicker from "./components/TeetassenSelect";
import { graphDefault } from "./components/TeetassenTypes";

class App extends React.Component {
  state = {
    timeStart: 1639486800,
    timeStop: 1639488600,
    data: null,
    width: 600,
    height: 600,
    headline: "Ein und Ausfahrten in Darmstadt HBF zwischen 14:00 und 14:30",
    subHeadline: "Station graph",
    target: true,
    targetText: "temp",
    key: 1,
  };
  svgRef = React.createRef();

  changeData(data: string | undefined) {
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
      timeStart,
      timeStop,
      data,
      width,
      height,
      headline,
      subHeadline,
      target,
      targetText,
      key,
    } = this.state;

    return (
      <div className="App mt-16 text-center">
        <h1>{subHeadline}</h1>
        <h2 className="text-gray-500">{headline}</h2>
        <div className="mb-6 mt-6 flex items-center justify-center gap-2">
          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onClick={() => this.toggleTarget(target, key)}
          >
            {targetText}
          </button>
          <TeetassenPicker
            onTripPicked={(data) => this.changeData(data)}
            onTripPickedHeadline={(headline) => this.changeHeadline(headline)}
            className="w-96"
          />
          <input
            type="text"
            pattern="[0-9]*"
            onInput={(zz) => this.handleChange(zz)}
            value={this.state.width}
            className="w-96 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
        </div>

        {data && <Teetasse data={data} width={width} />}
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
