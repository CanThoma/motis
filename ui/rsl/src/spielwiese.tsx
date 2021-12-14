import React from "react";
import ReactDOM from "react-dom";

import "./index.css";
import SankeyGraph from "./components/SankeyGraph";
import SankeyPicker from "./components/SankeyPicker";
import { graphDefault } from "./components/SankeyTypes";

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
          <SankeyPicker
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

        {data && <SankeyGraph data={data} width={width} />}
      </div>
    );
  }
}

const rootElement = document.getElementById("root");
ReactDOM.render(<App />, rootElement);
