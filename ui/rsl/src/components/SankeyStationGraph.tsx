import React, { MouseEvent } from "react";
import * as d3 from "d3";
import { select as d3Select, easeLinear } from "d3";
// Wenn die Imports nicht erkannt werden -> pnpm install -D @types/d3-sankey

import {Node, Link, SankeyInterfaceMinimal, NodeMinimal, LinkMinimal} from "./SankeyTypes";
import Utils from "./SankeyStationUtils";
import {TripId} from "../api/protocol/motis";
import {useAtom} from "jotai";
import {universeAtom} from "../data/simulation";
import {usePaxMonGetInterchangesQuery, usePaxMonGroupsInTripQuery} from "../api/paxmon";
import {PaxMonGetInterchangesRequest} from "../api/protocol/motis/paxmon";

type Props = {
  stationId:string;
  startTime: number;
  endTime: number;
  maxCount: number;
  width?: number;
  height?: number;
  nodeWidth?: number;
  nodePadding?: number;
  duration?: number;
};

export type StationInterchangeParameters = {
  stationId:string;
  startTime: number;
  endTime: number;
  maxCount: number;
};
type ExtTripId = TripId & {arrival_time: number|null; departure_time: number|null};
function ToExtTripId(tripId: TripId) : ExtTripId {
  let extTripId :ExtTripId= {
    time: tripId.time,
    train_nr: tripId.train_nr,
    target_station_id: tripId.target_station_id,
    station_id: tripId.station_id,
    line_id : tripId.line_id,
    target_time: tripId.target_time,
    arrival_time: null,
    departure_time: null,
  }
  return extTripId;
};
function ExtractStationData(params:StationInterchangeParameters) : SankeyInterfaceMinimal {
  let graph :SankeyInterfaceMinimal = {
    nodes: [],
    links: []
  };
  const [universe] = useAtom(universeAtom);
  const interchangeRequest : PaxMonGetInterchangesRequest = {
    start_time: params.startTime, // 25.10.2021 - 9:00
    end_time: params.endTime, // 25.10.2021 - 9:30
    station: params.stationId, // Lausanne
    include_meta_stations: false,
    include_group_infos: true,
    max_count: params.maxCount,
    universe: universe
  };
  const {data} = usePaxMonGetInterchangesQuery(interchangeRequest);
  let interchangingTripsInStation : ExtTripId[] = [];
  let sameTripId = (tripIdA : ExtTripId,tripIdB : ExtTripId) => {
    return tripIdA.time == tripIdB.time &&
      tripIdA.train_nr == tripIdB.train_nr &&
      tripIdA.target_station_id == tripIdB.target_station_id &&
      tripIdA.station_id == tripIdB.station_id &&
      tripIdA.line_id == tripIdB.line_id &&
      tripIdA.target_time == tripIdB.target_time;
  }
  if(data) {
    for(let interchange of data.interchanges)
    {
      console.log("arrival: " + interchange.arrival.length + " | departure: " + interchange.departure.length)

      let arrivingStationIndex = -1;
      let departureStationIndex = -1;

      if(interchange.arrival.length == 0 && interchange.departure.length == 0)
      {
        // error message? interchange has NO arrival or departure
        continue;
      }
      /* Get arrival point */
      if(interchange.arrival.length < 1)
      {
        // edge case if motis ever bugs, starting trip here => arrival stays "boarding"
      }
      else if(interchange.arrival.length == 1)
      {
        // zwischenstop/endstop
        let arrivalInfo = interchange.arrival[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if(arrivalInfo.trips.length != 1)
          continue;
        //"boarding" group, when arrival train is out of time range
        /*if(arrivalInfo.schedule_time < params.startTime)
          continue;
        else */{
          let trip = arrivalInfo.trips[0];
          arrivingStationIndex = interchangingTripsInStation.findIndex((tripId) => {return sameTripId(tripId,ToExtTripId(trip.trip));});
          let foundTripsInStation = interchangingTripsInStation[arrivingStationIndex];
          if(!foundTripsInStation)
          {
            let exttid = ToExtTripId(trip.trip);
            exttid.arrival_time = arrivalInfo.schedule_time;
            interchangingTripsInStation.push(exttid);
          }
          else {
            foundTripsInStation.arrival_time = arrivalInfo.schedule_time;
          }
        }
      }
      else {
        // error!! this shouldnt happen
        continue;
      }

      /* Get departure point */

      if(interchange.departure.length < 1)
      {
        // edge case if motis ever bugs, endstation => "target" = exiting
      }
      else if(interchange.departure.length == 1)
      {
        //zwischenstop/start
        let departureInfo = interchange.departure[0];
        // assume error if length != null (all cases seemed to fulfil this property)
        if(departureInfo.trips.length != 1)
          continue;
        //"exiting" group, when arrival train is out of time range. this shouldn't happen from how the query works though
        /*if(departureInfo.schedule_time > params.endTime) {
          //console.log("schedule time of departure train is outside of end time. This shouldn't happen from how the query functions. departureInfo.schedule_time " +
          // formatLongDateTime(departureInfo.schedule_time) + " params.endTime " + formatLongDateTime(params.endTime));
          continue;
        }
        else */{
          let trip = departureInfo.trips[0];
          departureStationIndex = interchangingTripsInStation.findIndex((tripId) => {return sameTripId(tripId,ToExtTripId(trip.trip));});
          let foundTripsInStation = interchangingTripsInStation[departureStationIndex];
          if(!foundTripsInStation)
          {
            let exttid = ToExtTripId(trip.trip);
            exttid.departure_time = departureInfo.schedule_time;
            interchangingTripsInStation.push(exttid);
          }
          else {
            foundTripsInStation.departure_time = departureInfo.schedule_time;
          }
        }
      }
      else {
        // error!!
        continue;
      }

      /* take care of the links from the data we now gained */
      let link : LinkMinimal = {
        id: graph.links.length,
        value: interchange.groups.max_passenger_count*10,
        source: arrivingStationIndex === -1 ? "boarding" : arrivingStationIndex.toString(),
        target: departureStationIndex === -1 ? "exiting" : departureStationIndex.toString()
      };
      graph.links.push(link);
    }
  }


  for(let trips of interchangingTripsInStation) {
    let node :NodeMinimal = {
      id: graph.nodes.length.toString(),
      name: trips.train_nr.toString(),
      sId: "TBI",
      arrival_time:trips.arrival_time?trips.arrival_time:0,
      departure_time:trips.departure_time?trips.departure_time:0,
      capacity: 1000 // TODO: TBI
    };
    graph.nodes.push(node);
  }

  graph.nodes.sort((a,b)=>{
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if(a.departure_time == null && b.departure_time == null)
      return 0;
    else if(a.departure_time == null)
      return -1;
    else if(b.departure_time == null)
      return 1;
    /* number comparators */
    else if(a.departure_time < b.departure_time)
      return -1;
    else if(a.departure_time > b.departure_time)
      return 1;
    else
      return 0;
  });
  graph.nodes.sort((a,b)=>{
    /* null comparators (out of time range of search) / new arriving/just exiting journey */
    if(a.arrival_time == null && b.arrival_time == null)
      return 0;
    else if(a.arrival_time == null)
      return -1;
    else if(b.arrival_time == null)
      return 1;
    /* number comparators */
    else if(a.arrival_time < b.arrival_time)
      return -1;
    else if(a.arrival_time > b.arrival_time)
      return 1;
    else
      return 0;
  });
  return graph;
}
const SankeyStationGraph = ({
                    stationId,
                    startTime,
                    endTime,
                    maxCount,
                    width = 600,
                    height = 600,
                    nodeWidth = 25,
                    nodePadding = 15,
                    duration = 250,
                  }: Props): JSX.Element => {
  // Sollte man nur im Notfall nutzen, in diesem ist es aber denke ich gerechtfretigt.
  const svgRef = React.useRef(null);

  //const bahnRot = "#f01414";
  const rowBackgroundColour = "#cacaca";

  const linkOppacity = 0.25;
  const linkOppacityFocus = 0.7;
  const linkOppacityClear = 0.01;

  const nodeOppacity = 0.9;
  const backdropOppacity = 0.7;
  const rowBackgroundOppacity = 0.0; // AG wollte nicht die 0.2 die vom Team bevorzugt werden


  let data = ExtractStationData({stationId:stationId,startTime:startTime,endTime:endTime,maxCount:0});
  console.log(data.nodes.length + " "+ data.links.length + " ");
  for(let node of data.nodes)
  {
    console.log("<node id=" + node.id + " name="+node.name +" arrival_time="+node.arrival_time +" departure_time="+node.departure_time+ " capacity="+ node.capacity + ">")
  }
  for(let link of data.links)
  {
    console.log("<link id=" + link.id + " source="+link.source +" target="+link.target +" value="+link.value + ">")
  }

  React.useEffect(() => {
    const graph = Utils.createGraph(
      data.nodes,
      data.links,
      height,
      width,
      nodeWidth,
      nodePadding
    );

    const svg = d3.select(svgRef.current);
    // Säubern von potentiellen svg Inhalt
    svg.selectAll("*").remove();

    const defs = svg.append("defs");

    // Add definitions for all of the linear gradients.
    const gradients = defs
      .selectAll("linearGradient")
      .data(graph.links)
      .join("linearGradient")
      .attr("id", (d) => "gradient_" + d.id);
    gradients.append("stop").attr("offset", 0.0);
    gradients.append("stop").attr("offset", 1.0);

    // Add a g.view for holding the sankey diagram.
    const view = svg.append("g").classed("view", true);

    // Define the row backgrounds of every row
    view
      .selectAll("rect.rowBackground")
      .data(graph.nodes)
      .join("rect")
      .classed("rowBackground", true)
      .filter((d) => (d.x0 || width) < width)
      .attr("id", (d) => d.id + "_background")
      .attr("x", 0)
      .attr("y", (d) => d.y0_backdrop || 0)
      .attr("width", width)
      .attr("height", (d) =>
        Math.max(10, (d.y1_backdrop || 0) - (d.y0_backdrop || 0))
      )
      .attr("fill", rowBackgroundColour)
      .attr("opacity", rowBackgroundOppacity);

    // Define the BACKDROPS – Die grauen Balken hinter den nicht "vollen" Haltestellen.
    view
      .selectAll("rect.nodeBackdrop")
      .data(graph.nodes)
      .join("rect")
      .classed("backdrop", true)
      .attr("id", (d) => d.id + "_backdrop")
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0_backdrop || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) =>
        Math.max(0, (d.y1_backdrop || 0) - (d.y0_backdrop || 0))
      )
      .attr("fill", rowBackgroundColour)
      .attr("opacity", backdropOppacity);

    // Define the nodes.
    const nodes = view
      .selectAll("rect.node")
      .data(graph.nodes)
      .join("rect")
      .classed("node", true)
      .attr("id", (d) => d.id)
      .attr("x", (d) => d.x0 || 0)
      .attr("y", (d) => d.y0 || 0)
      .attr("width", (d) => (d.x1 || 0) - (d.x0 || 0))
      .attr("height", (d) => Math.max(0, (d.y1 || 0) - (d.y0 || 0)))
      .attr("fill", (d) => d.colour || rowBackgroundColour)
      .attr("opacity", nodeOppacity);

    // Add titles for node hover effects.
    nodes
      .append("title")
      .text((d) => Utils.formatTextNode(d.name, d.totalNodeValue || 0));

    // Define the links.
    const links = view
      .selectAll("path.link")
      .data(graph.links)
      .join("path")
      .classed("link", true)
      .attr("d", (d) =>
        Utils.createSankeyLink(nodeWidth, width, d.y0 || 0, d.y1 || 0)
      )
      .attr("stroke", (d) => d.colour || rowBackgroundColour)
      .attr("stroke-opacity", linkOppacity)
      .attr("stroke-width", (d) => d.width || 1)
      .attr("fill", "none");

    const gradientLinks = view
      .selectAll("path.gradient-link")
      .data(graph.links)
      .join("path")
      .classed("gradient-link", true)
      .attr("id", (d) => "path_" + d.id)
      .attr("d", (d) =>
        Utils.createSankeyLink(nodeWidth, width, d.y0 || 0, d.y1 || 0)
      )
      .attr("stroke", (d) => d.colour || rowBackgroundColour)
      .attr("stroke-opacity", linkOppacityFocus)
      .attr("stroke-width", (d) => d.width || 1)
      .attr("fill", "none")
      .each(setDash);

    // Add text labels.
    view
      .selectAll("text.node")
      .data(graph.nodes)
      .join("text")
      .classed("node", true)
      .attr("x", (d) => d.x1 || -1)
      .attr("dx", 6)
      .attr(
        "y",
        (d) =>
          (d.y0_backdrop || 0) +
          ((d.y1_backdrop || 0) - (d.y0_backdrop || 0)) / 2
      )
      .attr("dy", "0.35em")
      .attr("fill", "black")
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("font-family", "Arial, sans-serif")
      .text((d) => d.name)
      .filter((d) => (d.x1 || 0) > width / 2)
      .attr("x", (d) => d.x0 || 0)
      .attr("dx", -6)
      .attr("text-anchor", "end");

    // Add <title> hover effect on links.
    links.append("title").text((d) => {
      const sourceName = graph.nodes.find((n) => n.id == d.source)?.name;
      const targetName = graph.nodes.find((n) => n.id == d.target)?.name;
      return Utils.formatTextLink(
        sourceName || " – ",
        targetName || " – ",
        d.value
      );
    });

    // Define the default dash behavior for colored gradients.
    function setDash(link: Link) {
      const path = view.select(`#path_${link.id}`);
      const length = (path.node() as SVGGeometryElement).getTotalLength();
      path
        .attr("stroke-dasharray", `${length} ${length}`)
        .attr("stroke-dashoffset", length);

      /* Das brauche ich eigentlich nicht, ist unnötig, oder?
      path
        .append("title")
        .text((d) => `${d.source.name} -> ${d.target.name}\n${d.value}`);
        */
    }

    // der erste Parameter ist das Event, wird hier allerdings nicht gebraucht.
    // eigentlich ist der Import von dem Interface auch unnötig, aber nun ja...
    function branchAnimate(_: MouseEvent, node: Node) {
      view
        .selectAll("path.link")
        .transition()
        .duration(duration)
        .ease(d3.easeLinear)
        .attr("stroke-opacity", linkOppacityClear);

      let links: d3.Selection<d3.BaseType, unknown, SVGElement, unknown>;

      if (node.sourceLinks && node.sourceLinks.length > 0) {
        links = view.selectAll("path.gradient-link").filter((link) => {
          return (node.sourceLinks || []).indexOf(link as Link) !== -1;
        });

        links
          .attr("stroke-opacity", linkOppacityFocus)
          .transition()
          .duration(duration)
          .ease(d3.easeLinear)
          .attr("stroke-dashoffset", 0);
      } else if (node.sourceLinks && node.sourceLinks.length === 0) {
        links = view.selectAll("path.gradient-link").filter((link) => {
          return (node.targetLinks || []).indexOf(link as Link) !== -1;
        });

        links
          .attr("stroke-opacity", linkOppacityFocus)
          .transition()
          .duration(duration)
          .ease((t) => -t)
          .attr("stroke-dashoffset", 0);
      }
    }

    function branchClear() {
      gradientLinks.transition();
      gradientLinks.attr("stroke-opactiy", 0).each(setDash);
      view.selectAll("path.link").attr("stroke-opacity", linkOppacity);
    }

    nodes.on("mouseover", branchAnimate).on("mouseout", branchClear);

    function linkAnimate(_: MouseEvent, link: Link) {
      const links = view.selectAll("path.link").filter((l) => {
        return (l as Link).id === link.id;
      });

      links.attr("stroke-opacity", linkOppacityFocus);
    }
    function linkClear() {
      links.attr("stroke-opacity", linkOppacity);
    }

    links.on("mouseover", linkAnimate).on("mouseout", linkClear);
  }, [data, height, width, nodeWidth, nodePadding, duration]);

  return <svg ref={svgRef} width={width} height={height+150} className="m-auto" />;
};

export default SankeyStationGraph;
