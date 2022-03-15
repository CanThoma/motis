import { interpolateRgb, scaleLinear } from "d3";

const calcMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

const colour = scaleLinear<string>()
  .domain([0, 0.4, 0.8, 0.99, 1])
  .range(["#dfe3e7", "#c1d5d7", "#ffc700", "#f04b4a", "#dd4141"])
  .interpolate(interpolateRgb.gamma(2.2));

const prepareTimeEdges = (trip: any): any[] => {
  const finalEdges = [];

  let offset = 20;
  const minHeight = 30;
  const minWidth = 5;
  const ballPadding = 4;
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

    tmpEdge.capWidth = Math.max(minWidth, tmpEdge.capacity * widthMultiplier);
    tmpEdge.rightWidth = tmpEdge.expected_passengers * widthMultiplier;

    // TODO: Was soll links jetzt genau angezeigt werden?
    tmpEdge.leftWidth = tmpEdge.expected_passengers * 0.3 * widthMultiplier;
    tmpEdge.color = colour(
      Math.min(1, tmpEdge.expected_passengers / tmpEdge.capacity)
    );

    tmpEdge.y = offset + ballPadding;

    offset += tmpEdge.height + ballPadding;
    finalEdges.push(tmpEdge);
  }
  return finalEdges;
};

export { prepareTimeEdges };
