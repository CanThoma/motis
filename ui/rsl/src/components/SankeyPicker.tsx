import React from "react";
import { useCombobox } from "downshift";
import { ChevronDownIcon, XIcon } from "@heroicons/react/solid";

import {
  LinkMinimal,
  NodeMinimal,
  SankeyInterface,
  SankeyInterfaceMinimal,
} from "./SankeyTripTypes";
import { TripId } from "../api/protocol/motis";
import { useAtom } from "jotai";
import { universeAtom } from "../data/simulation";
import {
  usePaxMonFindTripsQuery,
  usePaxMonGroupsInTripQuery,
} from "../api/paxmon";
interface InfoRenameThis {
  enterStationID: string;
  exitStationID: string;
  passengers: number;
}
const graph2: SankeyInterfaceMinimal = {
  nodes: [
    { name: "Wiesbaden Hbf Bussteige und so halt", id: "node9" },
    { name: "Wiesbaden Hbf", id: "node8" },
    { name: "Mainz Hbf", id: "node7" },
    { name: "Mainz Römisches Theater", id: "node6" },
    { name: "Mainz-Bischofsheim", id: "node5" },
    { name: "Nauheim(b Gr.Gerau)", id: "node4" },
    { name: "Groß Gerau", id: "node3" },
    { name: "Klein Gerau", id: "node2" },
    { name: "Weiterstadt", id: "node1" },
    { name: "Darmstadt Hbf", id: "node0" },
  ],
  links: [
    { target: "node7", source: "node9", value: 7, id: "link39" },
    { target: "node5", source: "node9", value: 20, id: "link38" },
    { target: "node0", source: "node9", value: 12, id: "link37" },
    { target: "node7", source: "node8", value: 70, id: "link36" },
    { target: "node6", source: "node8", value: 35, id: "link35" },
    { target: "node6", source: "node7", value: 30, id: "link34" },
    { target: "node5", source: "node8", value: 1, id: "link33" },
    { target: "node5", source: "node7", value: 7, id: "link32" },
    { target: "node5", source: "node6", value: 3, id: "link31" },
    { target: "node4", source: "node8", value: 2, id: "link30" },
    { target: "node4", source: "node7", value: 1, id: "link29" },
    { target: "node4", source: "node6", value: 0, id: "link28" },
    { target: "node4", source: "node5", value: 2, id: "link27" },
    { target: "node3", source: "node8", value: 30, id: "link26" },
    { target: "node3", source: "node7", value: 30, id: "link25" },
    { target: "node3", source: "node6", value: 24, id: "link24" },
    { target: "node3", source: "node5", value: 8, id: "link23" },
    { target: "node3", source: "node4", value: 9, id: "link22" },
    { target: "node2", source: "node8", value: 14, id: "link21" },
    { target: "node2", source: "node7", value: 12, id: "link20" },
    { target: "node2", source: "node6", value: 10, id: "link19" },
    { target: "node2", source: "node5", value: 2, id: "link18" },
    { target: "node2", source: "node4", value: 1, id: "link17" },
    { target: "node2", source: "node3", value: 5, id: "link16" },
    { target: "node1", source: "node8", value: 10, id: "link15" },
    { target: "node1", source: "node7", value: 7, id: "link14" },
    { target: "node1", source: "node6", value: 6, id: "link13" },
    { target: "node1", source: "node5", value: 2, id: "link12" },
    { target: "node1", source: "node4", value: 0, id: "link11" },
    { target: "node1", source: "node3", value: 4, id: "link10" },
    { target: "node1", source: "node2", value: 2, id: "link9" },
    { target: "node0", source: "node8", value: 93, id: "link8" },
    { target: "node0", source: "node7", value: 84, id: "link7" },
    { target: "node0", source: "node6", value: 34, id: "link6" },
    { target: "node0", source: "node5", value: 12, id: "link5" },
    { target: "node0", source: "node4", value: 7, id: "link4" },
    { target: "node0", source: "node3", value: 15, id: "link3" },
    { target: "node0", source: "node2", value: 6, id: "link2" },
    { target: "node0", source: "node1", value: 5, id: "link1" },
  ],
};

const graph1: SankeyInterfaceMinimal = {
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

type TripPickerProps = {
  tripId: TripId;
  onTripPicked: (trip: TripId | undefined) => void;
  className?: string;
  onTripPickedHeadline: (
    trip: { text: string; link: string; headline: string } | undefined
  ) => void;
};

function SankeyPicker({
  tripId,
  onTripPicked,
  onTripPickedHeadline,
  className,
}: TripPickerProps): JSX.Element {
  const graph = ExtractGroupInfoForThisTrain(tripId);
  const tripList = [
    {
      text: "Rückfahrt HLB RB75 (61962)",
      link: graph,
      headline:
        'Die Strecke von Aschaffenburg Hbf nach Wiesbaden Hbf. Meine "Lieblingsstrecke". Zu sehen ist nur der Teilabschnitt Darmstadt Hbf – Wiesbaden Hbf',
    },
    {
      text: "Hinfahrt HLB RB75 (61962)",
      link: graph,
      headline:
        'Die Strecke von Aschaffenburg Hbf nach Wiesbaden Hbf. Meine "Lieblingsstrecke".',
    },
  ];

  const {
    isOpen,
    getToggleButtonProps,
    getMenuProps,
    getInputProps,
    getComboboxProps,
    highlightedIndex,
    getItemProps,
    selectedItem,
    reset,
  } = useCombobox({
    items: tripList.map((trip) => trip.text),
    initialInputValue: "Darmstadt --> Wiesbaden",
    itemToString: (item: string | null) => (item !== null ? item : ""),

    onSelectedItemChange: (changes) => {
      const nina = changes.selectedItem;
      if (nina != null) {
        onTripPicked(
          tripList.filter((item) =>
            item.text.toLowerCase().startsWith(nina.toLowerCase())
          )[0].link
        );
        onTripPickedHeadline(
          tripList.filter((item) =>
            item.text.toLowerCase().startsWith(nina.toLowerCase())
          )[0]
        );
      }
    },
  });

  return (
    <div className={`relative flex ${className ?? ""}`}>
      {/* <label {...getLabelProps()}>Trip:</label> */}
      <div {...getComboboxProps()} className="relative w-full">
        <input
          {...getInputProps()}
          type="text"
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
        />
        {
          <button
            type="button"
            {...getToggleButtonProps()}
            aria-label="toggle menu"
            className="absolute top-0 right-0 h-full px-2 flex items-center justify-center"
          >
            <ChevronDownIcon className="h-4 w-4 text-gray-500" />
          </button>
        }
      </div>
      <ul
        {...getMenuProps()}
        className={`${
          isOpen && tripList.length > 0 ? "" : "hidden"
        } absolute w-96 z-50 top-12 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none p-2`}
      >
        {isOpen &&
          tripList
            .map((item) => item.text)
            .map((item, index) => (
              <li
                className={`${
                  highlightedIndex === index
                    ? "bg-blue-500 text-white"
                    : "text-gray-900"
                } group flex items-center w-full p-2 rounded-md text-sm select-none cursor-pointer`}
                key={index}
                {...getItemProps({ item, index })}
              >
                {item}
              </li>
            ))}
      </ul>
    </div>
  );
}

export default SankeyPicker;
