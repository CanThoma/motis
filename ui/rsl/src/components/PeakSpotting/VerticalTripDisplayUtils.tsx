import { interpolateRgb, scaleLinear } from "d3";
import {
  PaxMonEdgeLoadInfo,
  PaxMonFilteredTripInfo,
} from "../../api/protocol/motis/paxmon";
import { peakSpottingConfig as config } from "../../config";

const calcMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

const color = scaleLinear<string>()
  .domain([0, 0.4, 0.8, 0.99, 1])
  .range(["#dfe3e7", "#c1d5d7", "#ffc700", "#f04b4a", "#dd4141"])
  .interpolate(interpolateRgb.gamma(2.2));

export interface tripEdge extends PaxMonEdgeLoadInfo {
  departureTime?: Date;
  arrivalTime?: Date;
  departureHours?: number;
  departureMinutes?: number;
  arrivalHours?: number;
  arrivalMinutes?: number;
  traveledMinutes?: number;
  height?: number;
  capWidth?: number;
  capHeight?: number;
  horizontalWidth?: number;
  rightWidth?: number;
  leftWidth?: number;
  color?: string;
  noCap?: boolean;
  opacity?: number;
  y?: number;
  x?: number;
}

const prepareTimeEdges = (trip: PaxMonFilteredTripInfo): tripEdge[] => {
  const finalEdges = [];

  let offset = config.verticalInitialOffset;

  for (let i = 0; i < trip.edges.length; i++) {
    const edge = trip.edges[i];

    const tmpEdge: tripEdge = { ...edge };

    const departureTime = new Date(edge.departure_current_time * 1000);
    const arrivalTime = new Date(edge.arrival_current_time * 1000);

    const leftValue = edge.passenger_cdf[0].passengers;
    const rightValue = edge.expected_passengers;

    tmpEdge.departureTime = departureTime;
    tmpEdge.arrivalTime = arrivalTime;

    tmpEdge.departureHours = departureTime.getHours();
    tmpEdge.departureMinutes = departureTime.getMinutes();
    tmpEdge.arrivalHours = arrivalTime.getHours();
    tmpEdge.arrivalMinutes = arrivalTime.getMinutes();

    tmpEdge.traveledMinutes =
      calcMinutes(tmpEdge.arrivalHours, tmpEdge.arrivalMinutes) -
      calcMinutes(tmpEdge.departureHours, tmpEdge.departureMinutes);

    tmpEdge.height = Math.max(
      config.verticalMinHeight,
      tmpEdge.traveledMinutes * config.verticalHeightMultiplier
    );

    tmpEdge.capWidth = Math.max(
      config.verticalMinWidth,
      tmpEdge.capacity * config.verticalWidthMultiplier
    );
    tmpEdge.rightWidth = rightValue * config.verticalWidthMultiplier;

    // TODO: Sollen wir hier noch die Wahrscheinlichkeit irgendwie mit einbeziehen?
    tmpEdge.leftWidth =
      leftValue * config.testMultiplier * config.verticalWidthMultiplier;
    tmpEdge.color = color(Math.min(1, rightValue / tmpEdge.capacity));

    tmpEdge.y = offset + config.verticalBallPadding;

    offset += tmpEdge.height + config.verticalBallPadding;
    finalEdges.push(tmpEdge);
  }
  return finalEdges;
};

export { prepareTimeEdges };
