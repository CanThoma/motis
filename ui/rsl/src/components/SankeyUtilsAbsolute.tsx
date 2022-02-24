/**
 * Die angepasste Version der SankeyUtils für die komplett Absolute Darstellung
 *
 * Die Höhe der Nodes entspricht dem Ergebnis der skalierungsfunktion.
 * Im standard 1/5.
 *
 * Nutze diese Komponente, falls die AGs sich für eine komplett absolute Darstellung entscheiden
 */
import { interpolateRainbow } from "d3";
import {
  Node,
  Link,
  SankeyInterface,
  createGraphInterface,
  LinkMinimal,
} from "./SankeyTypes";

import config from "./SankeyTripConfig";

export default class Utils {
  static groupBy = <T, K extends string>(
    list: T[],
    getKey: (item: T) => K
  ): Record<K, T[]> => {
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

  // TODO: Wie reagieren wir auf GMT+2?
  // Haben wir das immer? das wäre ne verdammt wichtige Frage :(
  static renderTime = (time) => {
    let minutes = Math.floor((time / (1000 * 60)) % 60);
    let hours = Math.floor((time / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? "0" + hours : hours;
    minutes = minutes < 10 ? "0" + minutes : minutes;

    return `${hours}:${minutes}Uhr`;
  };

  // Zeit unterschied in Minuten
  static renderTimeDifference = (arrival, schedule) => {
    return Math.floor((arrival - schedule) / (1000 * 60));
  };

  static renderDelay = (tmp) => {
    tmp
      .append("tspan")
      .text((d) => {
        const diff = Utils.renderTimeDifference(
          d.arrival_current_time,
          d.arrival_schedule_time
        );

        if (diff === 0) return "";
        if (diff > 0) return ` +${diff}min`;
        return ` ${diff}min`;
      })
      .attr("fill", (d) => {
        const diff = Utils.renderTimeDifference(
          d.arrival_current_time,
          d.arrival_schedule_time
        );

        if (diff === 0) return "";
        if (diff > 0) return "red";
        return "green";
      })
      .attr("font-weight", "bold");
  };

  /**
   * Berechnet die relative Höhe eines Knotens basierend auf dem
   * Gesamtvalue (= gesamte Passagieranzahl),
   * dem Knotenvalue (= Passagiere am jeweiligen Bahnhof)
   * und der effektiv nutzbaren Höhe (= Gesamthöhe - NodePadding * (NodeCount - 1))
   * TODO: Die beiden relativen Funktionen sind mittlerweile unnötig!
   */
  static calcNodeRelativeHeight = (
    nodeValue: number | undefined,
    totalValue: number,
    effectiveHeight: number
  ): number => {
    const height = ((nodeValue || 0) / totalValue) * effectiveHeight;
    return height > 0 ? Math.max(height, 1) : 0;
  };

  static calcLinkRelativeHeight = (
    nodeValue: number | undefined,
    totalValue: number,
    effectiveHeight: number
  ): number => {
    return ((nodeValue || 0) / totalValue) * effectiveHeight;
  };

  /**
   * Berechnen der Höhe eines Knotens basierend auf der Pasagieranzahl.
   * Das Value ist die Anzahl der Passagiere.
   * TODO: Die Funktion ist mittlerweile unnötig.
   */
  static calcLogNodeHeight = (nodeValue: number): number => {
    if (nodeValue < 1) return 0;

    /**
     * Diese Funktion ist ein erster Test. Ich bin von maximal 1000 Gästen ausgeganen
     * und diese Dann auf ein Maximum von 300px begrenzt.
     * Orientiert habe ich mich an dieser Formel:
     * https://math.stackexchange.com/questions/970094/convert-a-linear-scale-to-a-logarithmic-scale
     *
     * Danach noch die Kurve für einen flacheren Verlauf ein wenig verschoben.
     * Daher die + 100, - 200 und + 4
     *
     * Sicherlich ist das etwas zu viel Berechnung, aber eine lineare Steigung sah scheiße aus.
     * TODO: es gilt also noch etwas zu experimentieren.
     */
    // Die "blaue Funktion"
    //return Math.ceil(100 * Math.log10(nodeValue + 100) - 200) + 4; // Na, das lässt sich aber noch vereinfachen.

    // Die "rote Funktion"
    //return Math.ceil(25 * Math.log2(nodeValue + 20) - 110) + 4;

    // Der orangene Funktion™
    /**
     * Die AGs wollten einen linaren Verlauf.
     * Die jetzige Funktion ist eine Gerade, bei der 1 Passagier 5 Pixeln entspricht
     * und 1000 Passagiere 200 Pixeln.
     * TODO: Das ist auch nicht, was die AGs wollen... Die wollen sehen Doppelt so hoch == Doppelt so viele Peoplezz
     */
    //return Math.ceil(0.1952 * nodeValue + 4.8);

    return Math.max(Math.ceil(nodeValue / 5), config.minNodeHeight);
  };

  /**
   * Berechnen der Höhe eines Knotens basierend auf der Pasagieranzahl.
   * Das Value ist die Anzahl der Passagiere.
   */
  static calcNodeHeight = (nodeValue: number): number => {
    const height = nodeValue / config.scaleFactor;
    return height > 0 ? Math.max(height, config.minNodeHeight) : 0;
  };

  static calcLinkHeight = (linkValue: number): number => {
    return linkValue / config.scaleFactor;
  };

  /**
   * Konvertiert einen Link in einen Pfad-String
   */
  static createSankeyLink = (
    nodeWidth: number,
    width: number,
    y0: number,
    y1: number,
    leftOffset: number
  ): string => {
    // +++++++++ Kurz +++++++++
    // Beispielpfad: d="M20,461.58662092624354C300,461.58662092624354,300,337.6243567753003,580,337.6243567753003"
    // Das Muster ist folgendes:
    // M nodeWidth, y0 C Width/2, y0 , Width/2, y1, Width-nodeWidth, y1

    /* ++++++ Ausführlich +++++
      M (x,y) = Move the current point to the coordinate x,y. Any subsequent coordinate pair(s) are interpreted as parameter(s) for implicit absolute LineTo (L) command(s) (see below). 
  
      C ((x1,y1, x2,y2, x,y)+= Draw a cubic Bézier curve from the current point to the end point specified by x,y. The start control point is specified by x1,y1 and the end control point is specified by x2,y2. Any subsequent triplet(s) of coordinate pairs are interpreted as parameter(s) for implicit absolute cubic Bézier curve (C) command(s). 
       */
    return `M${nodeWidth + leftOffset},${y0}C${width / 2},${y0},${
      width / 2
    },${y1},${width - nodeWidth - leftOffset},${y1}`; // Hab mich entschieden auch auf der rechten Seite was einzublenden
  };

  static formatTextNode = (name: string, nodeValue: number): string => {
    return `${name}\n${nodeValue} Leutchen am Gleis.`;
  };
  static formatTextLink = (
    sourceName: string,
    targetName: string,
    value: number
  ): string => {
    return `${sourceName} \u2192 ${targetName}\n${value} Personen`;
  };

  /**
   * Berechnet die Koordinaten aller Nodes und der dazugehörigen Links
   */
  static createGraph = ({
    nodes,
    links,
    onSvgResize,
    width, // TODO: Ist hier die Übergabe die richtige Wahl oder die Config Datei?!
    nodeWidth,
    nodePadding,
    leftTimeOffset,
  }: createGraphInterface): SankeyInterface => {
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
        1 // minNodeHeight
      );

      const colour = this.colour(i / nodes.length);

      leftNodes.push({
        id: nodes[i].id,
        sId: nodes[i].sId,
        name: nodes[i].name,
        arrival_current_time: nodes[i].arrival_current_time,
        arrival_schedule_time: nodes[i].arrival_schedule_time,
        departure_current_time: nodes[i].departure_current_time,
        departure_schedule_time: nodes[i].departure_schedule_time,
        colour,
        biggerNodeTotalValue,
        totalNodeValue: leftLinkSum,
      });
      rightNodes.push({
        id: nodes[i].id,
        sId: nodes[i].sId,
        name: nodes[i].name,
        arrival_current_time: nodes[i].arrival_current_time,
        arrival_schedule_time: nodes[i].arrival_schedule_time,
        departure_current_time: nodes[i].departure_current_time,
        departure_schedule_time: nodes[i].departure_schedule_time,
        colour,
        biggerNodeTotalValue,
        totalNodeValue: rightLinkSum,
      });
    }

    // Eigentliche Nutzfläche für die Nodes.
    // const effectiveHeight = height - (leftNodes.length - 1) * nodePadding;

    // Berechnen des prozentualen Anteils der einzelnen Stationen
    // und Zuweisung der entsprechenden Koordinaten
    for (let i = 0; i < nodes.length; i++) {
      rightNodes[i].backdropHeight = Math.max(
        this.calcNodeHeight(leftNodes[i].biggerNodeTotalValue || 0),
        config.minNodeHeight
      );
      leftNodes[i].backdropHeight = rightNodes[i].backdropHeight;

      rightNodes[i].nodeHeight = this.calcNodeHeight(
        rightNodes[i].totalNodeValue || 0
      );

      leftNodes[i].nodeHeight = this.calcNodeHeight(
        leftNodes[i].totalNodeValue || 0
      );

      const lDif = Math.max(
        this.calcNodeHeight(leftNodes[i].biggerNodeTotalValue || 0) -
          this.calcNodeHeight(leftNodes[i].totalNodeValue || 0),
        0
      );
      const rDif = Math.max(
        this.calcNodeHeight(rightNodes[i].biggerNodeTotalValue || 0) -
          this.calcNodeHeight(rightNodes[i].totalNodeValue || 0),
        0
      );

      // Beginn des neuen Nodes ist das Ende des vorrangegangen oder 0
      const y1_start = Math.max(
        leftNodes[Math.max(0, i - 1)].y1_backdrop || 5,
        rightNodes[Math.max(0, i - 1)].y1_backdrop || 5
      );

      // Start des neuen Backdrops ist das Ende des Vorgänger Knotens plus das Passing
      // rightNodes[i].y0_backdrop = y1_start + (i === 0 ? 0 : nodePadding);
      // beginne auch schon beim ersten Node mit Padding, da sonst bei leeren Ersthaltestellen
      // die Schrift abgehackt ist.
      rightNodes[i].y0_backdrop = y1_start + nodePadding + rDif / 2;

      // Ende des neuen Backdrops ist der Anfang plus die Knotenhöhe
      rightNodes[i].y1_backdrop =
        (rightNodes[i].y0_backdrop || this.calcNodeHeight(1)) +
        (rightNodes[i].nodeHeight || this.calcNodeHeight(1));
      // Die y-Koordinaten beider Backdrops sind identisch
      leftNodes[i].y0_backdrop = y1_start + nodePadding + lDif / 2;
      leftNodes[i].y1_backdrop =
        (leftNodes[i].y0_backdrop || this.calcNodeHeight(1)) +
        (leftNodes[i].nodeHeight || this.calcNodeHeight(1));

      // Das untere Ende von Backdrop und dem eigentlich Knoten stimmen überein
      rightNodes[i].y1 = rightNodes[i].y1_backdrop;
      // Das obere Ende des eigentlichen Knotens ist das untere Ende plus die Knotenhöhe
      rightNodes[i].y0 =
        (rightNodes[i].y1 || 0) - (rightNodes[i].nodeHeight || 0);

      // Das gleiche nochmal für die linke Seite
      leftNodes[i].y1 = leftNodes[i].y1_backdrop;
      leftNodes[i].y0 = (leftNodes[i].y1 || 0) - (leftNodes[i].nodeHeight || 0);

      leftNodes[i].x0 = leftTimeOffset; // AAAAAAAh , hiäär
      leftNodes[i].x1 = leftTimeOffset + nodeWidth;

      rightNodes[i].x0 = width - nodeWidth - leftTimeOffset;
      rightNodes[i].x1 = width - leftTimeOffset;
    }

    // Berechnung der Gesamthöhe, um die Höhe der .svg anzupassen
    const totalNodeHeight = leftNodes.reduce(
      (sum, current) =>
        sum + this.calcNodeHeight(current.biggerNodeTotalValue || 0),
      0
    );

    // Setzen der .svg-Höhe in der aufrufenden Koponenten
    onSvgResize(totalNodeHeight + (leftNodes.length + 1) * nodePadding);

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

        l.width = this.calcLinkHeight(currentLink.value);

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
