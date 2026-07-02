export class TurnoValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TurnoValidationError";
  }
}
