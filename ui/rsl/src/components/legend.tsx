import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/solid";
import React, { useState } from "react";

import "./legend.css";

const Legend = (): JSX.Element => {
  const [showModal, setShowModal] = useState(false);

  const [showPage1, setShowPage1] = useState(false);
  const [showPage2, setShowPage2] = useState(false);

  const optionsList = [
    {
      key: 1,
      title: "Überlastung",
      show: showPage1,
      set: setShowPage1,
      pattern: (
        <svg width="50" height="50">
          <defs>
            <pattern
              id="diagonalHash"
              patternUnits="userSpaceOnUse"
              width="10"
              height="10"
              patternTransform="rotate(45)"
            >
              <g
                style={{
                  stroke: "rgb(240, 20, 20)",
                  strokeWidth: "5px",
                }}
              >
                <line x1="5" y="0" x2="5" y2="10" />
                <animate
                  attributeName="stroke"
                  dur="5s"
                  repeatCount="indefinite"
                  keyTimes="0;0.5;1"
                  values="#ECE81A;#f01414;#ECE81A;"
                />
              </g>
            </pattern>
          </defs>
          <rect
            x="0"
            y="0"
            width="50"
            height="50"
            fill="rgb(255, 108, 0)"
            opacity="0.9"
            style={{ fill: "url('#diagonalHash')" }}
          />
        </svg>
      ),
      short: [
        `Ein blinkender und schraffierter Balken zeigt die
      Überschreitung der Zugkapazität an.`,
        <br key={1} />,
        `Die Höhe ist dabei proportional zur überschrittenen Kapazität.`,
        <br key={2} />,
        `Ist der schraffierte Balken beispielsweise halb so groß
      wie der einfarbige bedeutet das eine Auslastung von 150%`,
      ],
      imageURL: "../../public/images/station_overflow.jpg",
      long: [
        `Im tatsächlichen Gebrauch sieht das beispielsweise so aus. `,
        `Wir sehen eine 140%-ige Auslastung der Strecke 1530.`,
        <br key={3} />,
        <br key={4} />,
        `In der PeakSpotting Ansicht haben wir uns dazu entschieden das Blinken zu entfernen und eine Überlastung farblich und durch einen weißen Strick im Balken darzustellen.`,
      ],
    },
    {
      key: 2,
      title: "Normale Zugauslastung",
      show: showPage2,
      set: setShowPage2,
      pattern: (
        <svg width="50" height="50">
          <rect
            x="0"
            y="0"
            width="50"
            height="50"
            fill="#ed6755"
            opacity="1"
            cursor="pointer"
          />
          <rect x="0" y="0" width="50" height="20" fill="#d6d7d7" opacity="1" />
        </svg>
      ),
      short: [
        `Ist ein Zug nicht überlastet, zeigt ein grauer Balken die
  Kapazität des Zuges an. Der farbige Balken deutet die
  Auslastung des Zuges an.
  `,
        <br key={1} />,
        `
  Die Höhe des Balkens ist proportional zur Auslastung des
  Zuges. Ist der farbige Balken beispielsweise halb so hoch wie
  der graue zeigt das eine 50% Auslastung des Zuges an.`,
      ],
      imageURL: "https://img.pr0gramm.com/2015/03/27/e51e1d60458d6494.jpg",
      long: [
        `Die Kartoffeln in Spalten schneiden und in einer
  Schüssel mit Parmesan und Olivenöl vermischen. Die
  Gewürze in einer separaten Schüssel vermengen und dann
  zu den Kartoffeln geben. Noch einmal kräftig
  durchmischen, die Kartoffelecken dann auf einem mit
  Backpapier ausgelegten Backblech verteilen und bei 200
  °C Ober-/Unterhitze für ca. 40 Minuten backen. Hinweis:
  Heißhunger auf eine deftige Beilage oder einfach nur
  Appetit auf einen leckeren Snack? Diese Kartoffelecken
  sind genau das richtige für alle, die es gerne deftig
  mögen und etwas Neues ausprobieren wollen. Dazu schmeckt
  Sour Cream mit ein paar frischen Kräutern wirklich
  köstlich, alternativ könnt ihr die Wedges natürlich auch
  als Beilage zu einem leckeren Steak oder gebratenem
  Fisch servieren. Eurer Kreativität sind keine Grenzen
  gesetzt. `,
        <br key={2} />,
        ` Die Kartoffeln in Spalten schneiden und
  in einer Schüssel mit Parmesan und Olivenöl vermischen.
  Die Gewürze in einer separaten Schüssel vermengen und
  dann zu den Kartoffeln geben. Noch einmal kräftig
  durchmischen, die Kartoffelecken dann auf einem mit
  Backpapier ausgelegten Backblech verteilen und bei 200
  °C Ober-/Unterhitze für ca. 40 Minuten backen. Hinweis:
  Heißhunger auf eine deftige Beilage oder einfach nur
  Appetit auf einen leckeren Snack? Diese Kartoffelecken
  sind genau das richtige für alle, die es gerne deftig
  mögen und etwas Neues ausprobieren wollen. Dazu schmeckt
  Sour Cream mit ein paar frischen Kräutern wirklich
  köstlich, alternativ könnt ihr die Wedges natürlich auch
  als Beilage zu einem leckeren Steak oder gebratenem
  Fisch servieren. Eurer Kreativität sind keine Grenzen
  gesetzt.`,
      ],
    },
    {
      key: 3,
      title: "Klick auf einen Trip",
      pattern: <img src={"../../public/images/tripClicked.jpg"} alt="Test" />,
      short: [
        `Klickt man auf einen Trip im Stationsgraphen, wird man automatisch zum entsprechenden Trip im Tripgraphen geführt. 
  `,
      ],
    },
  ];

  return (
    <>
      {" "}
      {showModal && (
        <div className="legend-content-container">
          <div
            className="legend-backdrop"
            onClick={() => setShowModal(false)}
          />
          <div className="legend-modal">
            <h1 className="legend_title">Legende</h1>
            <ol className="gradient-list">
              {optionsList.map(
                ({ title, pattern, short, show, set, long, imageURL, key }) => (
                  <li key={key}>
                    <span>{pattern}</span>
                    <h2 style={{ fontSize: "1rem", color: "#ed6755" }}>
                      {title}
                    </h2>
                    <p>{short}</p>
                    {long && (
                      <div
                        className="cursor-pointer"
                        onClick={() => set(!show)}
                      >
                        {show ? (
                          <div
                            data-tooltip="Alles klar, verstanden!"
                            data-tooltip-location="top"
                          >
                            <ChevronUpIcon className="block m-auto h-4 w-4 text-gray-500" />
                          </div>
                        ) : (
                          <div
                            data-tooltip="Du willst es genauer wissen?"
                            data-tooltip-location="top"
                          >
                            <ChevronDownIcon className="block m-auto h-4 w-4 text-gray-500" />
                          </div>
                        )}
                        {show && (
                          <div style={{ overflow: "auto" }}>
                            <div>
                              <img
                                src={imageURL}
                                alt="Test"
                                style={{
                                  float: "left",
                                  margin: "5px",
                                  width: "400px",
                                }}
                              />
                            </div>
                            {long && (
                              <p style={{ textAlign: "justify" }}>{long}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </li>
                )
              )}
            </ol>
            <button className="legend_btn" onClick={() => setShowModal(false)}>
              Schließen
            </button>
            <a href="#m1-c" className="link-2" />
            <button className="close" onClick={() => setShowModal(false)} />
          </div>
        </div>
      )}
      <div
        className="legend-container  w-10 h-8 text-center bg-teal-400 mr-2"
        data-tooltip="Was bedeuten eigentlich diese ganzen Farben? :("
        data-tooltip-location="left"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 512 512"
          aria-hidden="true"
          focusable="false"
          onClick={() => setShowModal(true)}
          role="img"
          className="svg-legend"
        >
          <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256s256-114.6 256-256S397.4 0 256 0zM256 128c17.67 0 32 14.33 32 32c0 17.67-14.33 32-32 32S224 177.7 224 160C224 142.3 238.3 128 256 128zM296 384h-80C202.8 384 192 373.3 192 360s10.75-24 24-24h16v-64H224c-13.25 0-24-10.75-24-24S210.8 224 224 224h32c13.25 0 24 10.75 24 24v88h16c13.25 0 24 10.75 24 24S309.3 384 296 384z" />
        </svg>
      </div>
    </>
  );
};

export default Legend;
