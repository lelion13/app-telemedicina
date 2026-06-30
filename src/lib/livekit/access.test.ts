import { describe, expect, it } from "vitest";
import {
  buildParticipantVideoGrant,
  canPatientJoinVideo,
  canProfesionalJoinVideo,
  sanitizeLiveKitTokenResponse,
} from "@/lib/livekit/access";
import { getLiveKitHttpUrl } from "@/lib/livekit/config";

describe("livekit access", () => {
  it("permite al paciente unirse salvo estados terminales", () => {
    expect(canPatientJoinVideo("pendiente")).toBe(true);
    expect(canPatientJoinVideo("confirmado")).toBe(true);
    expect(canPatientJoinVideo("en_curso")).toBe(true);
    expect(canPatientJoinVideo("finalizado")).toBe(false);
    expect(canPatientJoinVideo("cancelado")).toBe(false);
  });

  it("restringe al profesional asignado en confirmado o en_curso", () => {
    expect(canProfesionalJoinVideo("confirmado", true)).toBe(true);
    expect(canProfesionalJoinVideo("en_curso", true)).toBe(true);
    expect(canProfesionalJoinVideo("pendiente", true)).toBe(false);
    expect(canProfesionalJoinVideo("en_curso", false)).toBe(false);
  });

  it("no otorga permisos de grabación ni administración", () => {
    const grant = buildParticipantVideoGrant("turno-abc");
    expect(grant.roomRecord).toBe(false);
    expect(grant.roomAdmin).toBe(false);
    expect(grant.roomCreate).toBe(false);
    expect(grant.roomJoin).toBe(true);
    expect(grant.room).toBe("turno-abc");
  });

  it("no expone secrets en la respuesta al cliente", () => {
    const response = sanitizeLiveKitTokenResponse({
      token: "jwt-token",
      serverUrl: "wss://livekit.example.com",
      roomName: "turno-abc",
    });

    expect(response).toEqual({
      token: "jwt-token",
      serverUrl: "wss://livekit.example.com",
      roomName: "turno-abc",
    });
    expect(response).not.toHaveProperty("apiSecret");
    expect(response).not.toHaveProperty("apiKey");
  });

  it("convierte LIVEKIT_URL ws a http para RoomServiceClient", () => {
    expect(getLiveKitHttpUrl("wss://livekit.test.cloud")).toBe(
      "https://livekit.test.cloud",
    );
    expect(getLiveKitHttpUrl("ws://localhost:7880")).toBe(
      "http://localhost:7880",
    );
  });
});
