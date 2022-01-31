type Node = {
  name: string;
  id: string;
  offset?: number;
  colour?: string;
  biggerNodeTotalValue?: number;
  totalNodeValue?: number;
  backdropHeight?: number;
  nodeHeight?: number;
  y0_backdrop?: number;
  y1_backdrop?: number;
  x0?: number;
  x1?: number;
  y0?: number;
  y1?: number;
  sourceLinks?: Link[];
  targetLinks?: Link[];
};

type Link = {
  id: string | number;
  source: string;
  target: string;
  value: number;
  index?: number;
  colour?: string;
  oppacityScale?: number;
  y0?: number;
  y1?: number;
  width?: number;
};

interface SankeyInterface {
  nodes: Node[];
  links: Link[];
}

interface SankeyInterfaceMinimal {
  nodes: NodeMinimal[];
  links: LinkMinimal[];
}

type NodeMinimal = {
  id: string;
  sId: string;
  name: string;
  arrival_time: number;
  departure_time: number;
  capacity: number;
};

type LinkMinimal = {
  id: string | number;
  source: string;
  target: string;
  value: number;
};

const stationGraphDefault: SankeyInterfaceMinimal = {
  nodes: [
    { name: "S3 Bad Soden(Taunus) - 8890",arrival_time: 1639487100,departure_time: 1639487100, capacity: 600, id: "4",sId:"TBI" },
    { name: "ICE 1576 - 6489", arrival_time: 1639488240,departure_time: 1639488240, capacity: 900, id: "2",sId:"TBI" },
    { name: "S3 Bad Soden(Taunus) - 7832", arrival_time: 1639488900, departure_time: 1639488900, capacity: 600, id: "3",sId:"TBI" }
  ],
  links: [
    { source: "boarding", target: "4", value: 150, id: "link5" },
    { source: "boarding", target: "2", value: 200, id: "link10" },
    { source: "boarding", target: "3", value: 189, id: "link11" },

    { source: "4", target: "4", value: 0, id: "link51" },
    { source: "4", target: "4", value: 0, id: "link6" },
    { source: "4", target: "2", value: 40, id: "link7" },
    { source: "4", target: "3", value: 0, id: "link8" },

    { source: "2", target: "2", value: 380, id: "link16" },
    { source: "2", target: "3", value: 180, id: "link165" },

    { source: "4", target: "exiting", value: 300, id: "link50" },
    { source: "2", target: "exiting", value: 210, id: "link60" },
    { source: "3", target: "exiting", value: 110, id: "link161" },
  ],
};

const graphDefault: SankeyInterfaceMinimal = {
  nodes: [
    { id: "8503000", name: "Zürich HB" },
    { id: "8500218", name: "Olten" },
    { id: "8500212", name: "Oensingen" },
    { id: "8500207", name: "Solothurn" },
    { id: "9999999", name: "---------" },
    { id: "888888", name: "---------" },
    { id: "7", name: "---------" },
    { id: "77", name: "---------" },
    { id: "777", name: "---------" },
    { id: "7777", name: "---------" },
    { id: "6", name: "---------" },
    { id: "66", name: "---------" },
    { id: "666", name: "---------" },
    { id: "6666", name: "---------" },
    { id: "5", name: "---------" },
    { id: "55", name: "---------" },
    { id: "555", name: "---------" },
    { id: "5555", name: "---------" },
    { id: "4", name: "---------" },
    { id: "44", name: "---------" },
    { id: "444", name: "---------" },
    { id: "4444", name: "---------" },
    { id: "3", name: "---------" },
    { id: "44", name: "---------" },
    { id: "8500202", name: "Grenchen Süd" },
    { id: "8504300", name: "Biel/Bienne" },
    { id: "8504221", name: "Neuchâtel" },
    { id: "8504200", name: "Yverdon-les-Bains" },
    { id: "8501120", name: "Lausanne" },
    { name: "S3 Bad Soden(Taunus) - 8890",arrival_time: 1639487100,departure_time: 1639487100, capacity: 600, id: "4",sId:"TBI" },
    { name: "ICE 1576 - 6489", arrival_time: 1639488240,departure_time: 1639488240, capacity: 900, id: "2",sId:"TBI" },
    { name: "S3 Bad Soden(Taunus) - 7832", arrival_time: 1639488900, departure_time: 1639488900, capacity: 600, id: "3",sId:"TBI" }
  ],
  links: [
    { source: "boarding", target: "4", value: 150, id: "link5" },
    { source: "boarding", target: "2", value: 200, id: "link10" },
    { source: "boarding", target: "3", value: 189, id: "link11" },

    { source: "4", target: "4", value: 0, id: "link51" },
    { source: "4", target: "4", value: 0, id: "link6" },
    { source: "4", target: "2", value: 40, id: "link7" },
    { source: "4", target: "3", value: 0, id: "link8" },

    { source: "2", target: "2", value: 380, id: "link16" },
    { source: "2", target: "3", value: 180, id: "link165" },

    { source: "4", target: "exiting", value: 300, id: "link50" },
    { source: "2", target: "exiting", value: 210, id: "link60" },
    { source: "3", target: "exiting", value: 110, id: "link161" },
  ],
};
interface createGraphInterface {
  nodes: NodeMinimal[];
  links: LinkMinimal[];
  onSvgResize(newSvgSize: number): void;
  width: number;
  nodeWidth: number;
  nodePadding: number;
}

export type {
  Link,
  Node,
  SankeyInterface,
  createGraphInterface,
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
};
