type Node = {
  name: string;
  id: string;
  sId: string;
  arrival_current_time: number;
  arrival_schedule_time: number;
  departure_current_time: number;
  departure_schedule_time: number;
  offset?: number;
  color?: string;
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
  color?: string;
  opacityScale?: number;
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
  arrival_current_time: number;
  arrival_schedule_time: number;
  departure_current_time: number;
  departure_schedule_time: number;
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
  nodeWidth: number;
  nodePadding: number;
  leftTimeOffset: number;
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
