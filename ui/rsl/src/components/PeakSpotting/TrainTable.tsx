import React from "react";
import {
  PaxMonFilteredTripInfo,
  PaxMonEdgeLoadInfo,
} from "../../api/protocol/motis/paxmon";
import { formatDateTime } from "../../util/dateFormat";

type Props = {
  trip: PaxMonFilteredTripInfo;
};

/**
 * Reduziert ein Array aus Edges auf die darin vorkommenden Kapazitäten
 * @param edges Ein Array aus Edges
 * @returns Einen String aller einzigartigen Kapazitäten im Edges-Array
 */
const findCapacities = (edges: PaxMonEdgeLoadInfo[]): string => {
  const uniqueCapacities = edges.map((e) => {
    return e.capacity;
  });

  return uniqueCapacities.filter((v, i, a) => a.indexOf(v) === i).toString();
};

/**
 * Erstellt eine Tabelle mit Informationen zum übergebenen Zug.
 * @param trip
 * @constructor
 */
const TrainTable = ({ trip }: Props): JSX.Element => {
  const infos: { label: string; info: string }[] = [];

  infos.push({ label: "Name", info: trip.tsi.service_infos[0].name });
  infos.push({
    label: "Von",
    info: trip.tsi.primary_station.name,
  });
  infos.push({
    label: "",
    info: `${formatDateTime(trip.tsi.trip.time)}`,
  });
  infos.push({
    label: "Bis",
    info: trip.tsi.secondary_station.name,
  });
  infos.push({
    label: " ",
    info: `${formatDateTime(trip.tsi.trip.target_time)}`,
  });
  infos.push({ label: "ZugNr", info: trip.tsi.trip.train_nr.toString() });
  infos.push({ label: "Kategorie", info: trip.tsi.service_infos[0].category });

  if (trip.tsi.service_infos[0].line)
    infos.push({ label: "Linie", info: trip.tsi.service_infos[0].line });
  infos.push({ label: "Anbieter", info: trip.tsi.service_infos[0].provider });
  infos.push({ label: "Kapazität", info: findCapacities(trip.edges) });

  return (
    <table className="table">
      <tbody>
        {infos.map((info) => (
          <tr key={info.label}>
            <th>{info.label}</th>
            <td>{info.info}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default TrainTable;
