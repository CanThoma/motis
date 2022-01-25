import { interpolateRainbow } from "d3";
import {
  Node,
  Link,
  SankeyInterface,
  NodeMinimal,
  LinkMinimal,
} from "./SankeyTypes";

export default class Utils {
  static createNode = (id: string, name: string): Node => {
    return {
      id,
      name,
      x0: 0,
      x1: 0,
      y0: 0,
      y1: 0,
    };
  };

  // TODO: Gib ein Array an Keys weitä
  static groupBy = <T, K extends string>(
    list: T[],
    getKey: (item: T) => K
  ): Record<K, T[]> => {
    console.log(list);
    return list.reduce((previous, currentItem) => {
      const group = getKey(currentItem);
      if (!previous[group]) previous[group] = [];
      previous[group].push(currentItem);
      return previous;
    }, {} as Record<K, T[]>);
  };

  static colour = (value: number): string => {
    return interpolateRainbow(value);
  };

  static calcLinkSum = (
    nodeID: string,
    links: LinkMinimal[],
    selector: "source" | "target"
  ): number => {
    return links
      .filter((link: LinkMinimal) => link[selector] === nodeID)
      .reduce((sum, current) => sum + current.value, 0);
  };

  /**
   * Berechnet die relative Höhe eines Knotens basierend auf dem
   * Gesamtvalue (= gesamte Passagieranzahl),
   * dem Knotenvalue (= Passagiere am jeweiligen Bahnhof)
   * und der effektiv nutzbaren Höhe (= Gesamthöhe - NodePadding * (NodeCount - 1))
   */
  static calcNodeRelativeHeight = (
    nodeValue: number | undefined,
    totalValue: number,
    effectiveHeight: number
  ): number => {
    return ((nodeValue || 0) / totalValue) * effectiveHeight;
  };

  /**
   * Konvertiert einen Link in einen Pfad-String
   */
  static createSankeyLink = (
    nodeWidth: number,
    width: number,
    y0: number,
    y1: number
  ): string => {
    // +++++++++ Kurz +++++++++
    // Beispielpfad: d="M20,461.58662092624354C300,461.58662092624354,300,337.6243567753003,580,337.6243567753003"
    // Das Muster ist folgendes:
    // M nodeWidth, y0 C Width/2, y0 , Width/2, y1, Width-nodeWidth, y1

    /* ++++++ Ausführlich +++++
    M (x,y) = Move the current point to the coordinate x,y. Any subsequent coordinate pair(s) are interpreted as parameter(s) for implicit absolute LineTo (L) command(s) (see below). 

    C ((x1,y1, x2,y2, x,y)+= Draw a cubic Bézier curve from the current point to the end point specified by x,y. The start control point is specified by x1,y1 and the end control point is specified by x2,y2. Any subsequent triplet(s) of coordinate pairs are interpreted as parameter(s) for implicit absolute cubic Bézier curve (C) command(s). 
     */
    return `M${nodeWidth},${y0}C${width / 2},${y0},${width / 2},${y1},${
      width - nodeWidth
    },${y1}`;
  };

  static formatTextNode = (name: string, nodeValue: number): string => {
    return `${name}\n${nodeValue} Leutchen am Gleis.`;
  };
  static formatTextLink = (
    sourceName: string,
    targetName: string,
    value: number
  ): string => {
    return `${sourceName} \u2192 ${targetName}\n${value} Peoplezz`;
  };

  /**
   * Berechnet die Koordinaten aller Nodes und der dazugehörigen Links
   */
  static createGraph = (
    nodes: NodeMinimal[],
    links: LinkMinimal[],
    height = 600,
    width = 600,
    nodeWidth = 20,
    nodePadding = 20,
    minNodeHeight = 15
  ): SankeyInterface => {
    // #####################################################################################
    // Berechnung der Nodes
    // #####################################################################################
    const leftNodes: Node[] = [];
    const rightNodes: Node[] = [];

    // Zuordnen der Links zu den passenden Stationen
    // Gleichzeitiges Sammeln der Values – Hier die Passagieranzahl.
    for (let i = 0; i < nodes.length; i++) {
      const leftLinkSum = this.calcLinkSum(nodes[i].id, links, "source");
      const rightLinkSum = this.calcLinkSum(nodes[i].id, links, "target");
      const biggerNodeTotalValue = Math.max(
        leftLinkSum,
        rightLinkSum,
        minNodeHeight
      );

      const colour = this.colour(i / nodes.length);

      leftNodes.push({
        id: nodes[i].id,
        name: nodes[i].name,
        colour,
        biggerNodeTotalValue,
        totalNodeValue: leftLinkSum,
      });
      rightNodes.push({
        id: nodes[i].id,
        name: nodes[i].name,
        colour,
        biggerNodeTotalValue,
        totalNodeValue: rightLinkSum,
      });
    }

    // Wie viele Passagiere sind im gesamten Zug?
    const totalValue = leftNodes.reduce(
      (sum, current) => sum + (current.biggerNodeTotalValue || 0),
      0
    );

    // Eigentliche Nutzfläche für die Nodes.
    const effectiveHeight = height - (leftNodes.length - 1) * nodePadding;

    // Berechnen des prozentualen Anteils der einzelnen Stationen
    // und Zuweisung der entsprechenden Koordinaten.
    for (let i = 0; i < nodes.length; i++) {
      rightNodes[i].backdropHeight = this.calcNodeRelativeHeight(
        leftNodes[i].biggerNodeTotalValue,
        totalValue,
        effectiveHeight
      );
      leftNodes[i].backdropHeight = rightNodes[i].backdropHeight;
      rightNodes[i].nodeHeight = this.calcNodeRelativeHeight(
        rightNodes[i].totalNodeValue,
        totalValue,
        effectiveHeight
      );
      leftNodes[i].nodeHeight = this.calcNodeRelativeHeight(
        leftNodes[i].totalNodeValue,
        totalValue,
        effectiveHeight
      );

      // Beginn des neuen Nodes ist das Ende des vorrangegangen oder 0
      const y1_start = rightNodes[Math.max(0, i - 1)].y1_backdrop || 0;

      // Start des neuen Backdrops ist das Ende des Vorgänger Knotens plus das Passing
      rightNodes[i].y0_backdrop = y1_start + (i === 0 ? 0 : nodePadding);
      // Ende des neuen Backdrops ist der Anfang plus die Knotenhöhe
      rightNodes[i].y1_backdrop =
        (rightNodes[i].y0_backdrop || 0) + (rightNodes[i].backdropHeight || 0);
      // Die y-Koordinaten beider Backdrops sind identisch
      leftNodes[i].y0_backdrop = rightNodes[i].y0_backdrop;
      leftNodes[i].y1_backdrop = rightNodes[i].y1_backdrop;

      // Das untere Ende von Backdrop und dem eigentlich Knoten stimmen überein
      rightNodes[i].y1 = rightNodes[i].y1_backdrop;
      // Das obere Ende des eigentlichen Knotens ist das untere Ende plus die Knotenhöhe
      rightNodes[i].y0 =
        (rightNodes[i].y1 || 0) - (rightNodes[i].nodeHeight || 0);

      // Das gleiche nochmal für die linke Seite
      leftNodes[i].y1 = leftNodes[i].y1_backdrop;
      leftNodes[i].y0 = (leftNodes[i].y1 || 0) - (leftNodes[i].nodeHeight || 0);

      leftNodes[i].x0 = 0;
      leftNodes[i].x1 = 0 + nodeWidth;

      rightNodes[i].x0 = width - nodeWidth;
      rightNodes[i].x1 = width;
    }

    // #####################################################################################
    // Berechnung der Links für diesen Knoten, ggf später auslagern.
    // #####################################################################################
    let calculatedlinks: Link[] = [];

    // Ändern der Link ID zu Zahlen, um später eine geordnete Reihenfolgesicherstellen zu können.
    for (let i = 0; i < links.length; i++) {
      links[i].id = i;
    }

    // Gruppieren der Links nach der Quelle
    const groupedLinksMinimal = this.groupBy(links, (l) => l.source);

    // Bestimmen der Dicke der Links, sowie die dazugehörige y0-Koordinate
    for (const key in groupedLinksMinimal) {
      const currentLinks = groupedLinksMinimal[key];
      const currentNodeIndex = leftNodes.findIndex((n) => n.id === key);
      const currentNode = leftNodes[currentNodeIndex];
      //let currentNode = leftNodes.filter((n) => n.id === key)[0];

      // Nur nötig, wenn in der Datengenerierung etwas schief gelaufen ist
      if (!currentNode) continue;

      // initialisieren des sourceLink arrays, da vorher undefined
      leftNodes[currentNodeIndex].sourceLinks = [];
      leftNodes[currentNodeIndex].targetLinks = [];
      let offset = 0;
      for (let j = 0; j < currentLinks.length; j++) {
        const currentLink = currentLinks[j];
        const l: Link = {
          id: currentLink.id,
          source: currentLink.source,
          target: currentLink.target,
          value: currentLink.value,
        };

        l.width = this.calcNodeRelativeHeight(
          currentLink.value,
          currentNode.totalNodeValue || 1,
          currentNode.nodeHeight || 0
        );

        // Die linke Position des Linkes bestimmen
        // Startpunkt ist der Ausgangspunkt des Knotens
        // plus die vorangekommenen Knoten und die Hälte der
        // Breite des Knotens
        l.y0 = (currentNode.y0 || 0) + offset + l.width / 2;
        offset += l.width;

        // Start bestimmt die Farbe der Knoten
        l.colour = currentNode.colour;
        calculatedlinks.push(l);

        // Dieses or-Statement ist leider nur nötig, wegen dem Linter
        // sonst kreidet er mir das als angeblichen "possibly undefined"-Fehler an. :(
        (leftNodes[currentNodeIndex].sourceLinks || []).push(l);
      }
    }

    // Sortieren der Links für eine einheitliche Ordnung.
    calculatedlinks.sort((a, b) => (a.id as number) - (b.id as number));

    // Gruppieren nach target und anpassen der y1-Koordinate
    const groupedLinks = this.groupBy(calculatedlinks, (l) => l.target);
    calculatedlinks = [];

    for (const key in groupedLinks) {
      console.log(groupedLinks[key]);
      const currentLinks = groupedLinks[key];
      const currentNodeIndex = rightNodes.findIndex((n) => n.id === key);
      const currentNode = rightNodes[currentNodeIndex];

      // Nur nötig, wenn in der Datengenerierung etwas schief gelaufen ist
      if (!currentNode) continue;

      rightNodes[currentNodeIndex].sourceLinks = [];
      rightNodes[currentNodeIndex].targetLinks = [];
      let offset = 0;
      for (let j = 0; j < currentLinks.length; j++) {
        const currentLink = currentLinks[j];

        currentLink.y1 =
          (currentNode.y0 || 0) + offset + (currentLink.width || 0) / 2;
        offset += currentLink.width || 0;

        // Alle 0-Links entfernen
        if (currentLink.width) {
          calculatedlinks.push(currentLink);
          (rightNodes[currentNodeIndex].targetLinks || []).push(currentLink);
        }
      }
    }

    // Na, wenn die AGs das wollen ...
    // entfernen der "unmöglichen" Ein- und Ausstiege
    leftNodes.pop();
    rightNodes.shift();

    return { nodes: [...leftNodes, ...rightNodes], links: calculatedlinks };
  };
}
