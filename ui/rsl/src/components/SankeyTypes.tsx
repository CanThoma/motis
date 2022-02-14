type Node = {
  name: string;
  id: string;
  sId: string;
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
};

type LinkMinimal = {
  id: string | number;
  source: string;
  target: string;
  value: number;
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
