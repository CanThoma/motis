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
  width: number;
  nodeWidth: number;
  nodePadding: number;
  factor: number;
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

const tempID0: TripId = {
  station_id: "0",
  train_nr: 0,
  time: 0,
  target_station_id: "",
  target_time: 0,
  line_id: "",
};
const tempID1: TripId = {
  station_id: "1",
  train_nr: 0,
  time: 0,
  target_station_id: "",
  target_time: 0,
  line_id: "",
};
const tempID2: TripId = {
  station_id: "2",
  train_nr: 0,
  time: 0,
  target_station_id: "",
  target_time: 0,
  line_id: "",
};

const stationGraphDefault: SankeyInterfaceMinimal = {
  fromNodes: [
    { name: "", id: "boarding", pax: 596, cap: 596, time: 0 },
    { name: "", id: "previous", pax: 44, cap: 44, time: 1 },
    {
      name: "S3 Bad Soden(Taunus) - 8890",
      id: tempID0,
      pax: 220,
      cap: 600,
      time: 1639487100,
    },
    {
      name: "ICE 1576 - 6489",
      id: tempID1,
      pax: 600,
      cap: 900 + 300,
      time: 1639488240,
    },
    {
      name: "S3 Bad Soden(Taunus) - 7832",
      id: tempID2,
      pax: 900,
      cap: 600,
      time: 1639488900,
    },
  ],
  toNodes: [
    {
      name: "S3 Bad Soden(Taunus) - 8890",
      id: tempID0,
      pax: 120 + 96,
      cap: 600,
      time: 1639487100 + 300000,
    },
    {
      name: "ICE 1576 - 6489",
      id: tempID1,
      pax: 600 + 104,
      cap: 900,
      time: 1639488240 + 300000,
    },
    {
      name: "S3 Bad Soden(Taunus) - 7832",
      id: tempID2,
      pax: 740,
      cap: 600 + 300,
      time: 1639488900 + 300000,
    },
    { name: "", id: "future", pax: 100, cap: 100, time: 9999999998 },
    { name: "", id: "exiting", pax: 0, cap: 0, time: 9999999999 },
  ],
  links: [
    { id: 0, fNId: "boarding", tNId: tempID0, value: 196 },
    { id: 1, fNId: "boarding", tNId: tempID2, value: 400 },
    { id: 3, fNId: tempID0, tNId: tempID1, value: 100 },
    { id: 5, fNId: tempID0, tNId: tempID2, value: 100 },
    { id: 4, fNId: tempID2, tNId: "future", value: 100 },
    { id: 2, fNId: "previous", tNId: tempID1, value: 4 },
    { id: 6, fNId: "previous", tNId: tempID2, value: 40 },
  ],
};

export { stationGraphDefault };

export type {
  Link,
  Node,
  SankeyInterface,
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
  createGraphInterface,
};
