/** Normaliza un ref Mongoose (ObjectId o documento populado) a string id. */
export function extractDocumentId(
  ref: string | { _id?: { toString(): string } } | null | undefined,
): string | null {
  if (!ref) {
    return null;
  }

  if (typeof ref === "string") {
    return ref;
  }

  if (typeof ref === "object" && "_id" in ref && ref._id) {
    return ref._id.toString();
  }

  if (typeof ref === "object" && "toString" in ref) {
    return ref.toString();
  }

  return null;
}
