/**
 * Die angepasste Version der SankeyUtils für die komplett Absolute Darstellung
 *
 * Die Höhe der Nodes entspricht dem Ergebnis der skalierungsfunktion.
 * Im standard 1/5.
 *
 * Nutze diese Komponente, falls die AGs sich für eine komplett absolute Darstellung entscheiden
 */
import { interpolateRainbow, Selection } from "d3";
import {
  Node,
  Link,
  SankeyInterface,
  createGraphInterface,
  LinkMinimal,
} from "./SankeyTripTypes";

import config from "./SankeyTripConfig";

/**
 * Erstellt eine Liste aus den Elementen eines Arrays in dem sie nach ihrem Wert im Feld K sortiert sind.
 * Benötigt um Links nach ihren Quellen und Zielen zu sortieren
 * @param list
 * @param getKey
 */
const groupBy = <T, K extends string>(
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

/**
 * Berrechnet Summe der Ein- oder Aussteigert aller Links einer Node
 * benötigt um die höhe der Node zu berechnen
 * @param nodeID Id der Node dessen Summe berechnet werden soll
 * @param links Link Array
 * @param selector Name des Feldes das aufaddiert werden soll
 */
const calcLinkSum = (
  nodeID: string,
  links: LinkMinimal[],
  selector: "source" | "target"
): number => {
  return links
    .filter((link: LinkMinimal) => link[selector] === nodeID)
    .reduce((sum, current) => sum + current.value, 0);
};

/**
 * Erstellt einen String aus der zeit damit er im Graphen angezeigt werden kann
 * der string wird im 'de' format angezeigt
 * @param time Ankunfts-/Abfahrtszeit
 */
export const renderTime = (time: number): string => {
  const aDate = new Date(time * 1000);
  const dateString = aDate.toLocaleTimeString("de");
  return dateString.substr(0, dateString.length - 3) + " Uhr"; // -3 um Sekunden zu entfernen
};

/**
 * Zeit Unterschied in Minuten
 * @param time reale zeit
 * @param sTime geplante Ankunftszeit (scheduled time)
 */
const renderTimeDifference = (time: number, sTime: number): number => {
  return Math.floor((time - sTime) / 60);
};

/**
 * Erstellt einen String der den Zeitunterschied zur geplanten Ankunfts-/Abfahrtszeit darstellt
 * @param tmp Eine Referenz an ein SVG Textelement
 * @param selector "arrival" oder "departure"
 */
export const renderDelay = (
  tmp: Selection<SVGTextElement, Node, SVGGElement, unknown>,
  selector: "arrival" | "departure"
): string | void => {
  tmp
    .append("tspan")
    .text((d: Node) => {
      const timeCurr =
        selector === "arrival"
          ? d.arrival_schedule_time // Umgedreht, da es bei der Ankunft besser ist früh dran zu sein
          : d.departure_current_time;
      const timeSchedule =
        selector === "arrival"
          ? d.arrival_current_time
          : d.departure_schedule_time;

      const diff = renderTimeDifference(timeCurr, timeSchedule);

      if (diff === 0) return "";
      if (diff > 0) return ` +${diff}min`;
      return ` ${diff}min`;
    })
    .attr("fill", (d: Node) => {
      const timeCurr =
        selector === "arrival"
          ? d.arrival_schedule_time
          : d.departure_current_time;
      const timeSchedule =
        selector === "arrival"
          ? d.arrival_current_time
          : d.departure_schedule_time;

      const diff = renderTimeDifference(timeCurr, timeSchedule);

      if (diff === 0) return "";
      if (diff > 0) return "red";
      return "green";
    })
    .attr("font-weight", "bold");
};

/**
 * Berechnen der Höhe eines Knotens basierend auf der Pasagieranzahl.
 * @param nodeValue Anzahl der Passagiere
 */
const calcNodeHeight = (nodeValue: number): number => {
  if (config.scaleFactor != 0) {
    const height = nodeValue / config.scaleFactor;
    return height > 0 ? Math.max(height, config.minNodeHeight) : 0;
  } else {
    return nodeValue > 0 ? Math.max(nodeValue, config.minNodeHeight) : 0;
  }
};

/**
 * gibt die Skalierte höhe eines Links zurück.
 * @param linkValue Anzahl der Passagiere
 */
const calcLinkHeight = (linkValue: number): number => {
  if (config.scaleFactor != 0) return linkValue / config.scaleFactor;
  else return linkValue;
};

/**
 * Konvertiert einen Link in einen Pfad-String
 *
 * +++++++++ Kurz +++++++++
 * Beispielpfad: d="M20,461.58662092624354C300,461.58662092624354,300,337.6243567753003,580,337.6243567753003"
 * Das Muster ist folgendes:
 * M nodeWidth, y0 C Width/2, y0 , Width/2, y1, Width-nodeWidth, y1
 *
 *  ++++++ Ausführlich +++++
 * M (x,y) = Move the current point to the coordinate x,y. Any subsequent coordinate pair(s) are interpreted as
 * parameter(s) for implicit absolute LineTo (L) command(s) (see below).
 * C ((x1,y1, x2,y2, x,y)+= Draw a cubic Bézier curve from the current point to the end point specified by x,y.
 * The start control point is specified by x1,y1 and the end control point is specified by x2,y2.
 * Any subsequent triplet(s) of coordinate pairs are interpreted as parameter(s) for implicit absolute cubic Bézier curve (C) command(s).
 *
 * @param nodeWidth Basisbreite der Nodes (Konstante in create Graph)
 * @param width Breite des Graphen
 * @param y0 linker y Wert des Links
 * @param y1 rechter y Wert des Links
 * @param leftOffset offset in dem die Zeit angezeigt wird (Konstante in create Graph)
 */
export const createSankeyLink = (
  nodeWidth: number,
  width: number,
  y0: number,
  y1: number,
  leftOffset: number
): string => {
  return `M${nodeWidth + leftOffset},${y0}C${width / 2},${y0},${
    width / 2
  },${y1},${width - nodeWidth - leftOffset},${y1}`; // Hab mich entschieden auch auf der rechten Seite was einzublenden
};

/**
 * Formatiert einen String der beim hovern über die Nodes angezeigt wird
 * @param name Name der Station
 * @param nodeValue Anzahl der Passagiere
 */
export const formatTextNode = (name: string, nodeValue: number): string => {
  return `${name}\n${nodeValue} Passagiere an der Station`;
};

/**
 * Formatiert einen String der beim hovern über die Links angezeigt wird
 * @param sourceName Name der quell Station
 * @param targetName Name der ziel Station
 * @param value Anzahl der Passagiere
 */
export const formatTextLink = (
  sourceName: string,
  targetName: string,
  value: number
): string => {
  return `${sourceName} \u2192 ${targetName}\n${value} Passagiere`;
};

/**
 * Berechnet die Koordinaten aller Nodes und der dazugehörigen Links
 * @param nodes Array von Knotenpunkten
 * @param links Array von Links
 * @param onSvgResize Funktion zur Übergabe der finalen Höhe des Graphen
 * @param width Breite des Graphen
 * @param nodeWidth Breite der Knotenpunkte
 * @param nodePadding Basisabstand zwischen Knotenpunkten
 * @param leftTimeOffset Abstand zum Rand des Graphen um Platz für Zeitanzeige zu schaffen
 */
export const createGraph = ({
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
    const leftLinkSum = calcLinkSum(nodes[i].id, links, "source");
    const rightLinkSum = calcLinkSum(nodes[i].id, links, "target");
    const biggerNodeTotalValue = Math.max(
      leftLinkSum,
      rightLinkSum,
      1 // minNodeHeight
    );

    const linkColour = interpolateRainbow(i / nodes.length);

    // TODO Zeiten müssen noch übergeben werden
    leftNodes.push({
      id: nodes[i].id,
      sId: nodes[i].sId,
      name: nodes[i].name,
      arrival_current_time: nodes[i].arrival_current_time,
      arrival_schedule_time: nodes[i].arrival_schedule_time,
      departure_current_time: nodes[i].departure_current_time,
      departure_schedule_time: nodes[i].departure_schedule_time,
      color: linkColour,
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
      color: linkColour,
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
      calcNodeHeight(leftNodes[i].biggerNodeTotalValue || 0),
      config.minNodeHeight
    );
    leftNodes[i].backdropHeight = rightNodes[i].backdropHeight;

    rightNodes[i].nodeHeight = calcNodeHeight(
      rightNodes[i].totalNodeValue || 0
    );

    leftNodes[i].nodeHeight = calcNodeHeight(leftNodes[i].totalNodeValue || 0);

    const lDif = Math.max(
      calcNodeHeight(leftNodes[i].biggerNodeTotalValue || 0) -
        calcNodeHeight(leftNodes[i].totalNodeValue || 0),
      0
    );
    const rDif = Math.max(
      calcNodeHeight(rightNodes[i].biggerNodeTotalValue || 0) -
        calcNodeHeight(rightNodes[i].totalNodeValue || 0),
      0
    );

    // Beginn des neuen Nodes ist das Ende des vorrangegangen oder 5 (damit text nicht abgeschnitten wird)
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
      (rightNodes[i].y0_backdrop || calcNodeHeight(1)) +
      (rightNodes[i].nodeHeight || calcNodeHeight(1));
    // Die y-Koordinaten beider Backdrops sind identisch
    leftNodes[i].y0_backdrop = y1_start + nodePadding + lDif / 2;
    leftNodes[i].y1_backdrop =
      (leftNodes[i].y0_backdrop || calcNodeHeight(1)) +
      (leftNodes[i].nodeHeight || calcNodeHeight(1));

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
    (sum, current) => sum + calcNodeHeight(current.biggerNodeTotalValue || 0),
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
  const groupedLinksMinimal = groupBy(links, (l) => l.source);

  // Bestimmen der Dicke der Links, sowie die dazugehörige y0-Koordinate
  for (const key in groupedLinksMinimal) {
    const currentLinks = groupedLinksMinimal[key];
    const currentNodeIndex = leftNodes.findIndex((n) => n.id === key);
    const currentNode = leftNodes[currentNodeIndex];

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

      l.width = calcLinkHeight(currentLink.value);

      // Die linke Position des Linkes bestimmen
      // Startpunkt ist der Ausgangspunkt des Knotens
      // plus die vorangekommenen Knoten und die Hälte der
      // Breite des Knotens
      l.y0 = (currentNode.y0 || 0) + offset + l.width / 2;
      offset += l.width;

      // Start bestimmt die Farbe der Knoten
      l.color = currentNode.color;
      calculatedlinks.push(l);

      // Dieses or-Statement ist leider nur nötig, wegen dem Linter
      // sonst kreidet er mir das als angeblichen "possibly undefined"-Fehler an. :(
      (leftNodes[currentNodeIndex].sourceLinks || []).push(l);
    }
  }

  // Sortieren der Links für eine einheitliche Ordnung.
  calculatedlinks.sort((a, b) => (a.id as number) - (b.id as number));

  // Gruppieren nach target und anpassen der y1-Koordinate
  const groupedLinks = groupBy(calculatedlinks, (l) => l.target);
  calculatedlinks = [];

  for (const key in groupedLinks) {
    const currentLinks = groupedLinks[key];
    const currentNodeIndex = rightNodes.findIndex((n) => n.id === key);
    const currentNode = rightNodes[currentNodeIndex];

    // Nur nötig, wenn in der Datengenerierung etwas schief gelaufen ist
    if (!currentNode) continue;

    // initialisieren des sourceLink arrays, da vorher undefined
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
