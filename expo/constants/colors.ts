/**
 * SOVR Bridge palette — institutional vault aesthetic.
 * Deep ink navy field, archival paper, and engraved brass accents.
 * Status colors are intentionally muted; this is a treasury tool, not a trading app.
 */
const palette = {
  // Field
  ink: "#0B1220",
  inkDeep: "#070C16",
  inkRaised: "#101A2C",
  inkLine: "#1B2740",
  inkSoft: "#243352",

  // Brass / accents
  brass: "#C9A24A",
  brassDeep: "#8C6B27",
  brassLight: "#E5C77A",

  // Paper
  paper: "#F4EFE3",
  paperWarm: "#EAE3D0",
  paperLine: "#D9CFB6",

  // Text
  textHigh: "#F4EFE3",
  textMid: "#A9B0BF",
  textLow: "#6B7388",
  textInk: "#0B1220",

  // Status (muted, archival)
  verified: "#6FA68A",
  verifiedDeep: "#3F6E58",
  pending: "#C9A24A",
  failed: "#B45757",
};

const Colors = {
  ...palette,
  light: {
    text: palette.textHigh,
    background: palette.ink,
    tint: palette.brass,
    tabIconDefault: palette.textLow,
    tabIconSelected: palette.brass,
  },
};

export default Colors;
