import { interpolateRgb, scaleLinear } from "d3";
import { PaxMonFilteredTripInfo } from "../../api/protocol/motis/paxmon";
import { peakSpottingConfig as config } from "../../config";
import { initCommonEdgeInfo, TripEdge } from "./TripDisplayUtils";

const calcMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

const color = scaleLinear<string>()
  .domain([0, 0.4, 0.8, 0.99, 1])
  .range(["#dfe3e7", "#c1d5d7", "#ffc700", "#f04b4a", "#dd4141"])
  .interpolate(interpolateRgb.gamma(2.2));

const prepareTimeEdges = (trip: PaxMonFilteredTripInfo): TripEdge[] => {
  const finalEdges = [];

  let offset = config.verticalInitialOffset;

  for (let i = 0; i < trip.edges.length; i++) {
    const [tmpEdge, leftValue, rightValue] = initCommonEdgeInfo(trip.edges[i]);

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

    tmpEdge.leftWidth =
      leftValue *
      config.temporaryLeftSideScalarBecauseNoProbabilityData *
      config.verticalWidthMultiplier;
    tmpEdge.color = color(Math.min(1, rightValue / tmpEdge.capacity));

    tmpEdge.y = offset + config.verticalBallPadding;

    offset += tmpEdge.height + config.verticalBallPadding;
    finalEdges.push(tmpEdge);
  }
  return finalEdges;
};

export { prepareTimeEdges };
