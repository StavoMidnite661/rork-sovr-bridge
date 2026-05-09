import { Platform, TextStyle } from "react-native";

/**
 * Three families: serif headlines (institutional), sans body (legible),
 * mono numerics (auditable). Uses system fonts to avoid bundle weight.
 */
export const fonts = {
  serif: Platform.select({
    ios: "Hoefler Text",
    android: "serif",
    default: "Georgia",
  }) as string,
  serifAlt: Platform.select({
    ios: "Georgia",
    android: "serif",
    default: "Georgia",
  }) as string,
  sans: Platform.select({
    ios: "System",
    android: "sans-serif",
    default: "System",
  }) as string,
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "Menlo",
  }) as string,
};

export const type = {
  display: {
    fontFamily: fonts.serif,
    fontSize: 34,
    lineHeight: 40,
    letterSpacing: -0.5,
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 22,
    lineHeight: 28,
    letterSpacing: -0.2,
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  sectionLabel: {
    fontFamily: fonts.sans,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    fontWeight: "600" as TextStyle["fontWeight"],
    textTransform: "uppercase" as TextStyle["textTransform"],
  },
  body: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  bodyStrong: {
    fontFamily: fonts.sans,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: "600" as TextStyle["fontWeight"],
  },
  caption: {
    fontFamily: fonts.sans,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500" as TextStyle["fontWeight"],
  },
  mono: {
    fontFamily: fonts.mono,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0.2,
    fontWeight: "400" as TextStyle["fontWeight"],
  },
  monoLg: {
    fontFamily: fonts.mono,
    fontSize: 28,
    lineHeight: 32,
    letterSpacing: -0.5,
    fontWeight: "500" as TextStyle["fontWeight"],
  },
};
