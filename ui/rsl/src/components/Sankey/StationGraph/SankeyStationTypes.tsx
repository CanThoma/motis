import { TripId } from "../../../api/protocol/motis";

type Node = {
  id: TripId | string;
  name: string;
  pax: number;
  cap: number;
  time: number;

  color?: string;
  backdropHeight?: number;
  nodeHeight?: number;
  y0_backdrop?: number;
  y1_backdrop?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  full?: boolean;
  linkPaxSum?: number;
};

type Link = {
  id: number;
  fNId: TripId | string;
  tNId: TripId | string;
  value: number;

  index?: number;
  color?: string;
  opacityScale?: number;
  y0?: number;
  y1?: number;
  width?: number;
};

interface SankeyInterface {
  fromNodes: Node[];
  toNodes: Node[];
  links: Link[];
}

interface SankeyInterfaceMinimal {
  fromNodes: NodeMinimal[];
  toNodes: NodeMinimal[];
  links: LinkMinimal[];
}

interface createGraphInterface {
  fNodes: NodeMinimal[];
  tNodes: NodeMinimal[];
  links: LinkMinimal[];
  onSvgResize(newSvgSize: number): void;
  nodeWidth: number;
  nodePadding: number;
  factor?: number;
  filteredTripId?: TripId;
}

type NodeMinimal = {
  id: TripId | string;
  name: string;
  pax: number;
  cap: number;
  time: number;
};

type LinkMinimal = {
  id: number;
  fNId: TripId | string; // fromNodeID
  tNId: TripId | string; // toNodeID
  value: number;
};

export type {
  Link,
  Node,
  SankeyInterface,
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
  createGraphInterface,
};
