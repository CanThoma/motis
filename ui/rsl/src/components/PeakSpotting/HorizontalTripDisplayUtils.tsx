import {
  select as d3Select,
  interpolateRainbow,
  interpolateRgb,
  scaleLinear,
  interpolateHsl,
} from "d3";
import config, { colorSchema } from "../../config";
import { interpolateRgb, scaleLinear, interpolateHsl } from "d3";
import { peakSpottingConfig as config } from "../../config";

/**
 * Der Grundgedanke ist den prozentualen Anteil der Zeit
 * zu errechnen, um damit die x-achsen variable zu errechnen
 * und damit das Rechteck zu zeichnen.
 */
const calcTimePercentage = (hours: number, minutes: number): number => {
  const percentage =
    hours / config.timeFrame + minutes / (60 * config.timeFrame);
  return percentage;
};

const calcXCoordinate = (
  width: number,
  hours: number,
  minutes: number
): number => {
  const percentage = calcTimePercentage(hours, minutes);
  return width * percentage;
};

const calcTripWidth = (
  width: number,
  departureHours: number,
  departureMinutes: number,
  arrivalHours: number,
  arrivalMinutes: number
): number => {
  const x1 = width * calcTimePercentage(arrivalHours, arrivalMinutes);
  const x2 = width * calcTimePercentage(departureHours, departureMinutes);
  return x1 - x2;
};

const addXandWidth = (width, edge) => {
  edge.x = calcXCoordinate(width, edge.departureHours, edge.departureMinutes);
  edge.width = calcTripWidth(
    width,
    edge.departureHours,
    edge.departureMinutes,
    edge.arrivalHours,
    edge.arrivalMinutes
  );
  return edge;
};

const paginate = (items, pageNumber, pageSize) => {
  const startIndex = (pageNumber - 1) * pageSize;
  return items.slice(startIndex, startIndex + pageSize);
};

const prepareEdges = ({ data, width, height, onOverflow }) => {
  const finalEdges = [];
  let overflow = false;

  for (const edge of data.edges) {
    const tmpEdge = {};

    const departureTime = new Date(edge.departure_current_time * 1000);
    const arrivalTime = new Date(edge.arrival_current_time * 1000);

    tmpEdge.departureTime = departureTime;
    tmpEdge.arrivalTime = arrivalTime;

    tmpEdge.departureHours = departureTime.getHours();
    tmpEdge.departureMinutes = departureTime.getMinutes();
    tmpEdge.arrivalHours = arrivalTime.getHours();
    tmpEdge.arrivalMinutes = arrivalTime.getMinutes();

    tmpEdge.maxPax = edge.max_pax;
    tmpEdge.capacity = edge.capacity;
    tmpEdge.expectedPassengers = edge.expected_passengers;
    tmpEdge.from = edge.from;
    tmpEdge.to = edge.to;

    // Muss ne Zahl zwischen 0 u 1 sein
    tmpEdge.colour = colour(
      Math.min(1, edge.expected_passengers / edge.capacity)
    );

    // Höhe berechnen
    tmpEdge.capHeight = edge.capacity / config.horizontalCapacityScale;
    tmpEdge.height = edge.expected_passengers / config.horizontalCapacityScale;

    tmpEdge.y =
      height - tmpEdge.expectedPassengers / config.horizontalCapacityScale;

    let overflowTmpEdge = null;

    // Haben wir nen overflow?
    if (tmpEdge.capacity < tmpEdge.expectedPassengers) {
      overflow = true;
      overflowTmpEdge = { ...tmpEdge };

      tmpEdge.y = height - tmpEdge.capacity / config.horizontalCapacityScale;
      tmpEdge.height = tmpEdge.capacity / config.horizontalCapacityScale;

      overflowTmpEdge.height =
        (tmpEdge.expectedPassengers - tmpEdge.capacity) /
          config.horizontalCapacityScale -
        1.5;
      overflowTmpEdge.y =
        height - tmpEdge.height - overflowTmpEdge.height - 1.5;
    }

    // z.B. 23:00 abgefahren und 00:30 angekommen
    if (tmpEdge.departureHours > tmpEdge.arrivalHours) {
      // kopiere die erste Strecke, sodass der zeitliche Überlauf
      // wieder von links (0:00Uhr) anfängt.
      let timeWrapOverflowTmpEdge = null;
      if (overflowTmpEdge) {
        timeWrapOverflowTmpEdge = { ...overflowTmpEdge };
      }

      let timeWrapTmpEdge = { ...tmpEdge };

      tmpEdge.arrivalHours = 24;
      tmpEdge.arrivalMinutes = 0;

      if (overflowTmpEdge) {
        overflowTmpEdge.arrivalHours = 24;
        overflowTmpEdge.arrivalMinutes = 0;
      }
      timeWrapTmpEdge.departureHours = 0;
      timeWrapTmpEdge.departureMinutes = 0;

      timeWrapTmpEdge = addXandWidth(width, { ...timeWrapTmpEdge });

      if (timeWrapOverflowTmpEdge) {
        timeWrapOverflowTmpEdge.departureMinutes = 0;
        timeWrapOverflowTmpEdge.departureHours = 0;
        timeWrapOverflowTmpEdge = addXandWidth(width, {
          ...timeWrapOverflowTmpEdge,
        });
        finalEdges.push(timeWrapOverflowTmpEdge);
      }
      finalEdges.push(timeWrapTmpEdge);
    }

    if (overflowTmpEdge) {
      overflowTmpEdge = addXandWidth(width, { ...overflowTmpEdge });
      finalEdges.push(overflowTmpEdge);
      overflowTmpEdge = null;
    }

    tmpEdge.x = calcXCoordinate(
      width,
      tmpEdge.departureHours,
      tmpEdge.departureMinutes
    );

    tmpEdge.width = calcTripWidth(
      width,
      tmpEdge.departureHours,
      tmpEdge.departureMinutes,
      tmpEdge.arrivalHours,
      tmpEdge.arrivalMinutes
    );

    finalEdges.push(tmpEdge);
  }

  onOverflow(overflow);
  return finalEdges;
};

const colour = scaleLinear<string>()
  .domain([0, 0.4, 0.8, 0.99, 1])
  .range(["#dfe3e7", "#c1d5d7", "#ffc700", "#f04b4a", "#dd4141"])
  .interpolate(interpolateRgb.gamma(2.2));

const colour2 = scaleLinear<string>()
  .domain([0, 0.5, 1])
  .range(["grey", "yellow", "red"])
  .interpolate(interpolateHsl);

const formatTime = (time: Date): string => {
  let hours = time.getHours();
  let minutes = time.getMinutes();

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;

  return `${hours}:${minutes}Uhr`;
};

const formatEdgeInfo = (edge) => {
  return `${edge.from.name} \u279E ${edge.to.name}\n${formatTime(
    edge.departureTime
  )}  \u279E ${formatTime(edge.arrivalTime)}\n\n${
    edge.expectedPassengers
  } erwartete Passagiere\n${edge.capacity} Kapazität`;
};

export { prepareEdges, calcTripWidth, formatEdgeInfo, paginate };
