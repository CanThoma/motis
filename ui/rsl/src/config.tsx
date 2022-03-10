const config = {
  station_startDate: "Mon, 25 Oct 2021 09:15:00 GMT+2",
  station_timeInterval: 30, // In Minuten

  font_family: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"`,

  timeFrame: 25, //  wenn zum Beispiel ein Node über 0:00uhr fährt. Man müsste also nicht durch 24 Stunden teilen sondern durch 25?!
  horizontalCapacityScale: 13, // Skalierung für die horizontale Tripdarstellung
  horizontalLeftPadding: 150, // Breite für die Anzeige vom Zugnamen, etc.
  horizontalRightPadding: 50, //
};

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

export { colorSchema };

export default config;
