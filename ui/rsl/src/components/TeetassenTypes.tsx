type Node = {
  name: string;
  id: string | number;
  time: number;       // Abfahrtszeit der Züge
  capacity: number;   // maximale auslastung der Züge
  offset?: number;
  colour?: string;
  biggerNodeTotalValue?: number;
  totalNodeValue?: number;
  backdropHeight?: number;
  nodeHeight?: number;
  referenceID?: string; // unnötig, bzw. nicht mehr genutzt.
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
  id: string;
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
  id: string | number;
  name: string;
  time: number;
  capacity: number;
};

type LinkMinimal = {
  id: string | number;
  source: string | number;
  target: string | number;
  value: number;
};

const graphDefault: SankeyInterfaceMinimal = {
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

export { graphDefault };
export type {
  Link,
  Node,
  SankeyInterface,
  LinkMinimal,
  NodeMinimal,
  SankeyInterfaceMinimal,
};
