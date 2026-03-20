import { Link, Form, useNavigation } from "@remix-run/react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  nomeNegocio: string;
  usuarioSlug: string;
  offsetSemana: number;
  infoSemana: { inicioFormatado: string; fimFormatado: string };
  navegarSemana: (offset: number) => void;
  showUserMenu: boolean;
  setShowUserMenu: (v: boolean) => void;
};

export function DashboardHeader({
  nomeNegocio,
  usuarioSlug,
  offsetSemana,
  infoSemana,
  navegarSemana,
  showUserMenu,
  setShowUserMenu,
}: Props) {
  const initials = nomeNegocio.slice(0, 2).toUpperCase();
  const navigation = useNavigation();
  const [isChangingWeek, setIsChangingWeek] = useState(false);

  const handleNavegarSemana = (offset: number) => {
    setIsChangingWeek(true);
    navegarSemana(offset);
  };

  useEffect(() => {
    if (navigation.state === "idle") {
      setIsChangingWeek(false);
    }
  }, [navigation.state]);

  const isLoading = isChangingWeek && navigation.state === "loading";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 bg-deep border-b border-subtle"
      style={{ borderColor: "rgba(255,255,255,0.07)" }}
    >
      <div className="flex items-center justify-between px-4 h-14 max-w-[1200px] mx-auto">
        <span className="font-display font-bold text-sm tracking-tight truncate max-w-[140px]">
          {nomeNegocio || "Lava Jato"}
        </span>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleNavegarSemana(offsetSemana + 1)}
            className="text-tertiary hover-item px-1 py-1 text-sm"
            aria-label="Semana anterior"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <span
            className="font-mono-app text-xs tracking-[0.08em] text-secondary"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            {infoSemana.inicioFormatado} — {infoSemana.fimFormatado}
          </span>
          <button
            type="button"
            onClick={() => handleNavegarSemana(Math.max(0, offsetSemana - 1))}
            disabled={offsetSemana === 0}
            className="text-tertiary hover-item px-1 py-1 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Próxima semana"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.5}
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>

        <div className="relative" data-user-menu>
          <button
            type="button"
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono-app"
            style={{ border: "1px solid rgba(255,255,255,0.15)" }}
            aria-label="Menu do usuário"
          >
            {initials}
          </button>
          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-48 rounded-md py-1 z-20"
              style={{
                background: "#1A1A1A",
                border: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <Link
                to={`/${usuarioSlug || "publico"}`}
                onClick={() => setShowUserMenu(false)}
                className="block px-4 py-2 text-sm hover-item"
                style={{ color: "rgba(255,255,255,0.8)" }}
              >
                Página Pública
              </Link>
              <Form method="post">
                <input type="hidden" name="intent" value="logout" />
                <button
                  type="submit"
                  className="w-full text-left px-4 py-2 text-sm hover-item"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                >
                  Sair
                </button>
              </Form>
            </div>
          )}
        </div>
      </div>

      {isLoading &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-deep/90"
            style={{ backdropFilter: "blur(4px)" }}
            aria-live="polite"
            aria-busy="true"
          >
            <div className="flex flex-col items-center gap-4">
              <div
                className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
                style={{
                  borderColor: "rgba(255,255,255,0.15)",
                  borderTopColor: "var(--color-accent)",
                }}
              />
              <span
                className="font-mono-app text-xs tracking-wider uppercase"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Carregando...
              </span>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
