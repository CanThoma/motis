import {
  select as d3Select,
  interpolateRainbow,
  interpolateRgb,
  scaleLinear,
  interpolateHsl,
} from "d3";

const calcMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

const colour = scaleLinear()
  .domain([0, 0.4, 0.8, 0.99, 1])
  .range(["#dfe3e7", "#c1d5d7", "#ffc700", "#f04b4a", "#dd4141"])
  .interpolate(interpolateRgb.gamma(2.2));

const prepareEdges = (trip) => {};

const prepareTimeEdges = (trip) => {
  const finalEdges = [];

  let offset = 20;
  const minHeight = 30;
  const ballpadding = 4;
  const heightMultiplier = 3;
  const widthMultiplier = 0.15;

  for (let i = 0; i < trip.edges.length; i++) {
    const edge = trip.edges[i];

    const tmpEdge = { ...edge };

    const departureTime = new Date(edge.departure_current_time * 1000);
    const arrivalTime = new Date(edge.arrival_current_time * 1000);

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
      minHeight,
      tmpEdge.traveledMinutes * heightMultiplier
    );

    tmpEdge.capWidth = Math.max(minHeight, tmpEdge.capacity * widthMultiplier);
    tmpEdge.rightWidth = tmpEdge.max_pax * widthMultiplier;
    tmpEdge.leftWidth = tmpEdge.max_pax * widthMultiplier;
    tmpEdge.color = colour(Math.min(1, tmpEdge.max_pax / tmpEdge.capacity));

    tmpEdge.y = offset + ballpadding;

    offset += tmpEdge.height + ballpadding;
    finalEdges.push(tmpEdge);
  }
  return finalEdges;
};

export { prepareEdges, prepareTimeEdges };
