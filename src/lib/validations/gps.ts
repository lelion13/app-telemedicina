import { z } from "zod";

export const gpsRegistrationSchema = z.object({
  token: z.string().min(1),
  permisoDenegado: z.boolean(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  accuracy: z.number().min(0).optional(),
});

export type GpsRegistrationInput = z.infer<typeof gpsRegistrationSchema>;
