import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { PapelUsuario } from "@/generated/prisma/client";

const COOKIE_NAME = "afcarros_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 7;

function getSecretKey() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET não configurado no .env");
  }
  return new TextEncoder().encode(secret);
}

export type SessionPayload = {
  sub: string;
  nome: string;
  papel: PapelUsuario;
};

export async function createSession(payload: SessionPayload) {
  const token = await new SignJWT({ nome: payload.nome, papel: payload.papel })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DURATION_SECONDS}s`)
    .sign(getSecretKey());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DURATION_SECONDS,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      sub: payload.sub as string,
      nome: payload.nome as string,
      papel: payload.papel as PapelUsuario,
    };
  } catch {
    return null;
  }
}

/**
 * Exige uma sessão válida. Deve ser chamada no início de TODA server action
 * que altera dados. Defesa em profundidade: mesmo que o middleware falhe ou
 * seja contornado, a action recusa a operação sem login.
 */
export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) {
    redirect("/painel/login");
  }
  return session;
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;
