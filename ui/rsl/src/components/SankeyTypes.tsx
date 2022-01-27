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
  time: number;
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
    { name: "S3 Bad Soden(Taunus) - 8890",time: 1639487100, capacity: 600, id: "node1" },
    { name: "ICE 1576 - 6489", time: 1639488240, capacity: 900, id: "node2" },
    { name: "S3 Bad Soden(Taunus) - 7832", time: 1639488900, capacity: 600, id: "node3" }
  ],
  links: [
    { source: "boarding", target: "node1", value: 150, id: "link5" },
    { source: "boarding", target: "node2", value: 200, id: "link10" },
    { source: "boarding", target: "node3", value: 189, id: "link11" },

    { source: "node1", target: "node1", value: 0, id: "link51" },
    { source: "node1", target: "node1", value: 0, id: "link6" },
    { source: "node1", target: "node2", value: 40, id: "link7" },
    { source: "node1", target: "node3", value: 0, id: "link8" },

    { source: "node2", target: "node2", value: 380, id: "link16" },
    { source: "node2", target: "node3", value: 180, id: "link165" },

    { source: "node1", target: "exiting", value: 300, id: "link50" },
    { source: "node2", target: "exiting", value: 210, id: "link60" },
    { source: "node3", target: "exiting", value: 110, id: "link161" },
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
  ],
  links: [
    { id: "link0", source: "8503000", target: "8500218", value: 80 },
    { id: "link1", source: "8503000", target: "8500212", value: 80 },
    { id: "link2", source: "8503000", target: "8504300", value: 80 },
    { id: "link3", source: "8503000", target: "8504221", value: 80 },
    { id: "link4", source: "8503000", target: "8504200", value: 80 },
    { id: "link5", source: "8503000", target: "8501120", value: 80 },
    { id: "link6", source: "8500218", target: "8504221", value: 80 },
    { id: "link7", source: "8500218", target: "8504200", value: 80 },
    { id: "link8", source: "8500218", target: "8501120", value: 80 },
    { id: "link9", source: "8500212", target: "8500207", value: 80 },
    { id: "link10", source: "8500207", target: "8504200", value: 80 },
    { id: "link11", source: "8500207", target: "8501120", value: 80 },
    { id: "link12", source: "8500202", target: "8501120", value: 80 },
    { id: "link13", source: "8504300", target: "8504200", value: 80 },
    { id: "link14", source: "8504300", target: "8501120", value: 80 },
    { id: "link15", source: "8504221", target: "8504200", value: 80 },
    { id: "link16", source: "8504221", target: "8501120", value: 80 },
    { id: "link17", source: "8504200", target: "8501120", value: 80 },
  ],
};

export { graphDefault, stationGraphDefault };
export type {
  Link,
  Node,
  SankeyInterface,
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
};
