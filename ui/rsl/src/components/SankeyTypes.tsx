type Node = {
    name: string;
    id: string | number;
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
  };
  
  type LinkMinimal = {
    id: string | number;
    source: string | number;
    target: string | number;
    value: number;
  };
  
  const graphDefault: SankeyInterfaceMinimal = {
    nodes: [
      { name: "Darmstadt Hbf", id: "node0" },
      { name: "Weiterstadt", id: "node1" },
      { name: "Klein Gerau", id: "node2" },
      { name: "Groß Gerau", id: "node3" },
      { name: "Nauheim(b Gr.Gerau)", id: "node4" },
      { name: "Mainz-Bischofsheim", id: "node5" },
      { name: "Mainz Römisches Theater", id: "node6" },
      { name: "Mainz Hbf", id: "node7" },
      { name: "Wiesbaden Hbf", id: "node8" },
    ],
    links: [
      { source: "node0", target: "node1", value: 5, id: "link1" },
      { source: "node0", target: "node2", value: 6, id: "link2" },
      { source: "node0", target: "node3", value: 15, id: "link3" },
      { source: "node0", target: "node4", value: 7, id: "link4" },
      { source: "node0", target: "node5", value: 12, id: "link5" },
      { source: "node0", target: "node6", value: 34, id: "link6" },
      { source: "node0", target: "node7", value: 84, id: "link7" },
      { source: "node0", target: "node8", value: 93, id: "link8" },
      { source: "node1", target: "node2", value: 2, id: "link9" },
      { source: "node1", target: "node3", value: 4, id: "link10" },
      { source: "node1", target: "node4", value: 0, id: "link11" },
      { source: "node1", target: "node5", value: 2, id: "link12" },
      { source: "node1", target: "node6", value: 6, id: "link13" },
      { source: "node1", target: "node7", value: 7, id: "link14" },
      { source: "node1", target: "node8", value: 10, id: "link15" },
      { source: "node2", target: "node3", value: 5, id: "link16" },
      { source: "node2", target: "node4", value: 1, id: "link17" },
      { source: "node2", target: "node5", value: 2, id: "link18" },
      { source: "node2", target: "node6", value: 10, id: "link19" },
      { source: "node2", target: "node7", value: 12, id: "link20" },
      { source: "node2", target: "node8", value: 14, id: "link21" },
      { source: "node3", target: "node4", value: 9, id: "link22" },
      { source: "node3", target: "node5", value: 8, id: "link23" },
      { source: "node3", target: "node6", value: 24, id: "link24" },
      { source: "node3", target: "node7", value: 30, id: "link25" },
      { source: "node3", target: "node8", value: 30, id: "link26" },
      { source: "node4", target: "node5", value: 2, id: "link27" },
      { source: "node4", target: "node6", value: 0, id: "link28" },
      { source: "node4", target: "node7", value: 1, id: "link29" },
      { source: "node4", target: "node8", value: 2, id: "link30" },
      { source: "node5", target: "node6", value: 3, id: "link31" },
      { source: "node5", target: "node7", value: 7, id: "link32" },
      { source: "node5", target: "node8", value: 1, id: "link33" },
      { source: "node6", target: "node7", value: 30, id: "link34" },
      { source: "node6", target: "node8", value: 35, id: "link35" },
      { source: "node7", target: "node8", value: 70, id: "link36" },
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
  