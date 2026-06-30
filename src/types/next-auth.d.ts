import type { DefaultSession } from "next-auth";
import type { Rol } from "@/models/types";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      rol: Rol;
      empresaId?: string;
    };
  }

  interface User {
    id: string;
    rol: Rol;
    empresaId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    rol?: Rol;
    empresaId?: string;
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    rol?: Rol;
    empresaId?: string;
  }
}
