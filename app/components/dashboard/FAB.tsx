import { useState } from "react";
import { Link } from "@remix-run/react";

const options = [
  { label: "Lavagem de Carro", to: "/funcionarios/publico" },
  { label: "Lavagem de Moto", to: "/funcionarios/publico" },
  { label: "Lavagem de Tapete", to: "/funcionarios/publico" },
  { label: "Registrar Despesa", to: "/despesas/novo" },
];

export function FAB() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(0,0,0,0.6)" }}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
            style={{
              background: "#141414",
              borderTopLeftRadius: 12,
              borderTopRightRadius: 12,
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <div
              className="w-10 h-1 mx-auto mt-3 rounded-full"
              style={{ background: "rgba(255,255,255,0.15)" }}
            />
            <div className="py-4">
              {options.map((opt, i) => (
                <Link
                  key={opt.label}
                  to={opt.to}
                  className="block w-full text-left px-6 py-3.5 font-mono-app text-sm hover-item"
                  style={{
                    borderTop: i > 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
                  }}
                  onClick={() => setOpen(false)}
                >
                  {opt.label}
                </Link>
              ))}
            </div>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed z-40 md:hidden flex items-center gap-2 px-4 py-3 font-mono-app uppercase tracking-[0.08em]"
        style={{
          bottom: "5rem",
          right: "1rem",
          background: "#4D7C5F",
          color: "#0C0C0C",
          borderRadius: 6,
          fontSize: "0.7rem",
          fontWeight: 500,
        }}
      >
        <span>+</span>
        <span>REGISTRAR</span>
      </button>
    </>
  );
}
