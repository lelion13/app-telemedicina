import { describe, expect, it } from "vitest";
import { extractDocumentId } from "@/lib/mongoose/ref-id";

describe("extractDocumentId", () => {
  it("extrae _id de documento populado", () => {
    const id = extractDocumentId({
      _id: { toString: () => "507f1f77bcf86cd799439011" },
      nombre: "Ana",
    });
    expect(id).toBe("507f1f77bcf86cd799439011");
  });

  it("devuelve string directo", () => {
    expect(extractDocumentId("507f1f77bcf86cd799439011")).toBe(
      "507f1f77bcf86cd799439011",
    );
  });

  it("devuelve null si no hay ref", () => {
    expect(extractDocumentId(null)).toBeNull();
  });
});
