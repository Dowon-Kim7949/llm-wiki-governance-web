"use client";

import { useRef } from "react";
import type { Dictionary } from "@/content/types";
import { World } from "../world/World";
import { useSequence, type SequenceOptions } from "./useSequence";

type Props = Omit<SequenceOptions, "world"> & { t: Dictionary["world"] };

/**
 * A scene's drawing and its scroll motion, in a chunk of its own (./Motion.tsx).
 * The drawing is decorative and only visible once its renderer runs, so it is
 * not in the server HTML at all: the first paint lays out text only.
 */
export default function SequenceMotion({ t, ...options }: Props) {
  const world = useRef<HTMLDivElement>(null);
  useSequence({ ...options, world });
  return <World ref={world} t={t} />;
}
