import { z } from "zod";
import { CANVAS_MAX_JSON_BYTES, CANVAS_MAX_OBJECTS } from "./limits";

// Zod schema for validating incoming canvas_data
// Fabric v7 uses different type names than v5; accept any non-empty string for type
const FabricObjectSchema = z.object({
  type: z.string().min(1),
}).passthrough();

export const CanvasDataSchema = z.object({
  // Fabric.js exports `version` as a string like "5.3.0"; we accept it but don't enforce it
  version: z.union([z.literal(1), z.string()]).optional(),
  width: z.number(),
  height: z.number(),
  objects: z.array(FabricObjectSchema).max(CANVAS_MAX_OBJECTS),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{3,8}$|^rgba?\(/).optional(),
});

export type CanvasData = z.infer<typeof CanvasDataSchema>;

export function validateCanvasData(raw: unknown): CanvasData {
  const jsonStr = JSON.stringify(raw);
  if (new TextEncoder().encode(jsonStr).length > CANVAS_MAX_JSON_BYTES) {
    throw new Error("canvas_data exceeds maximum allowed size");
  }
  return CanvasDataSchema.parse(raw);
}
