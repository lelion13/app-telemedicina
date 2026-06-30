import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { GPS_ORIGENES } from "./types";

const registroGpsSchema = new Schema(
  {
    turnoId: {
      type: Schema.Types.ObjectId,
      ref: "Turno",
      required: true,
    },
    lat: { type: Number, min: -90, max: 90 },
    lng: { type: Number, min: -180, max: 180 },
    accuracy: { type: Number, min: 0 },
    origen: {
      type: String,
      required: true,
      enum: GPS_ORIGENES,
    },
    timestamp: { type: Date, default: Date.now },
    userAgent: { type: String, trim: true },
    ip: { type: String, trim: true },
  },
  { timestamps: false },
);

registroGpsSchema.index({ turnoId: 1, timestamp: -1 });

registroGpsSchema.pre("validate", function validateCoords() {
  if (this.origen === "navegador" || this.origen === "ip_fallback") {
    if (this.lat == null || this.lng == null) {
      this.invalidate(
        "lat",
        "lat y lng son obligatorios cuando origen es navegador o ip_fallback",
      );
    }
  }
});

export type IRegistroGPS = InferSchemaType<typeof registroGpsSchema>;

export const RegistroGPS: Model<IRegistroGPS> =
  models.RegistroGPS ??
  model<IRegistroGPS>("RegistroGPS", registroGpsSchema);
