const sankeyConfig = {
  linkOpacity: 0.4,
  linkOpacityFocus: 0.7,
  linkOpacityClear: 0.05,
  nodeOpacity: 0.9,
  backdropOpacity: 0.7,
  rowBackgroundColor: "#cacaca",
};

const tripConfig = {
  ...sankeyConfig,
  leftTimeOffset: 100,
  width: 1200,
  minNodeHeight: 6, // Angabe in Pixeln.
  scaleFactor: 4, // Die "Stauchung des Graphen". Je höher der StretchFactor, destor geringer ist der Höhenunterschied zwischen beispielsweise 100 und 200 Passagieren.
};

const stationConfig = {
  ...sankeyConfig,
  width: 1200,
  minNodeHeight: 2, // Angabe in Pixeln.
  timeOffset: 70, // Abstand von Rand zu den Nodes um Platz für die Zeit zu lassen
  yPadding: 10,
  station_startDate: "Mon, 25 Oct 2021 09:15:00 GMT+2",
  station_timeInterval: 30, // In Minuten
};

const umsteigerConfig = {
  ...sankeyConfig,
  width: 600,
  minNodeHeight: 2.5,
  timeOffset: 50, // Abstand von Rand zu den Nodes um Platz für die Zeit zu lassen
  yPadding: 10,
  scaleFactor: 10,
};

const peakSpottingConfig = {
  timeFrame: 25, //  wenn zum Beispiel ein Node über 0:00uhr fährt. Man müsste also nicht durch 24 Stunden teilen sondern durch 25?!
  horizontalCapacityScale: 21, // Skalierung für die horizontale Tripdarstellung
  horizontalLeftPadding: 150, // Breite für die Anzeige vom Zugnamen, etc.
  horizontalRightPadding: 50, //
};

const font_family = `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`;

const factor = 15; // default scale factor 1/factor für Stationsgraphen

const colorSchema = {
  lightGrey: "#e9ecef",
  lighterGrey: "#ebeef0",
  bluishGrey: "#ced4da",
  darkBluishGrey: "#b6bec5",
  grey: "#85898e",
  darkGrey: "#757778",
  black: "#343a40",
  white: "#fff",
};

export {
  colorSchema,
  factor,
  tripConfig,
  stationConfig,
  umsteigerConfig,
  peakSpottingConfig,
  font_family,
};
