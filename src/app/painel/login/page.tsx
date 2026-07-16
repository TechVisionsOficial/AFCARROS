"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login, type LoginState } from "./actions";

const initialState: LoginState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-screen flex-1 items-center justify-center bg-brand-graphite px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex justify-center">
          <Image
            src="/branding/logo-fundo-escuro.png"
            alt="AFCARROS"
            width={280}
            height={77}
            className="h-auto w-auto max-w-full"
            priority
          />
        </div>

        <form action={formAction} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="email" className="text-sm text-white/70">
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="h-11 rounded-md border border-white/15 bg-white/5 px-3 text-white outline-none focus:border-brand-red"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="senha" className="text-sm text-white/70">
              Senha
            </label>
            <input
              id="senha"
              name="senha"
              type="password"
              autoComplete="current-password"
              required
              className="h-11 rounded-md border border-white/15 bg-white/5 px-3 text-white outline-none focus:border-brand-red"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-400">{state.error}</p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-2 h-11 rounded-md bg-brand-red font-medium text-white transition-opacity disabled:opacity-60"
          >
            {pending ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}
