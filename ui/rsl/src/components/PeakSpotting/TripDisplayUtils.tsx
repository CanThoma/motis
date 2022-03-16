import { PaxMonEdgeLoadInfo } from "../../api/protocol/motis/paxmon";

export interface TripEdge extends PaxMonEdgeLoadInfo {
  departureTime: Date;
  arrivalTime: Date;
  departureHours: number;
  departureMinutes: number;
  arrivalHours: number;
  arrivalMinutes: number;
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

/**
 * Initalize TripEdge shared info for vertical and horizontal trip display
 * @param edge
 */
export function initCommonEdgeInfo(
  edge: PaxMonEdgeLoadInfo
): [goalEdge: TripEdge, leftPax: number, rightPax: number] {
  const departureTime = new Date(edge.departure_current_time * 1000);
  const arrivalTime = new Date(edge.arrival_current_time * 1000);

  const leftValue = edge.passenger_cdf[0].passengers;
  const rightValue = edge.expected_passengers;

  const goalEdge: TripEdge = {
    ...edge,
    departureTime: departureTime,
    arrivalTime: arrivalTime,

    departureHours: departureTime.getHours(),
    departureMinutes: departureTime.getMinutes(),
    arrivalHours: arrivalTime.getHours(),
    arrivalMinutes: arrivalTime.getMinutes(),
  };

  return [goalEdge, leftValue, rightValue];
}
