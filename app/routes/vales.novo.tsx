import { json, redirect } from "@remix-run/node";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import {
  Form,
  Link,
  useActionData,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from "@remix-run/react";
import { useEffect, useState, type ChangeEvent } from "react";
import { requererUsuario } from "~/utils/session.server";
import { listarFuncionarios } from "~/utils/funcionarios.server";
import { criarVale } from "~/utils/vales.server";
import { obterInfoSemana } from "~/utils/lavagens.server";
import { pageTitle } from "~/utils/meta";
import { Toast } from "~/components/Toast";
import { DashboardHeader } from "~/components/dashboard/DashboardHeader";
import { BottomNav } from "~/components/dashboard/BottomNav";

export const meta = () => [
  { title: pageTitle("Novo Vale") },
  {
    name: "description",
    content: "Registrar adiantamento (vale) para funcionário - X Lava Jato",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const usuario = await requererUsuario(request);
  const funcionarios = await listarFuncionarios(usuario.id, true);
  const url = new URL(request.url);
  const offsetSemana = parseInt(url.searchParams.get("semana") || "0", 10) || 0;
  const funcionarioPreSelecionado = url.searchParams.get("funcionario") || null;
  const infoSemana = obterInfoSemana(offsetSemana);

  return json({
    funcionarios,
    funcionarioPreSelecionado,
    usuario,
    usuarioSlug: usuario.slug || "",
    offsetSemana,
    infoSemana,
  });
}

export async function action({ request }: ActionFunctionArgs) {
  const usuario = await requererUsuario(request);
  const formData = await request.formData();
  const funcionarioId = formData.get("funcionario_id") as string;
  const valor = formData.get("valor") as string;
  const dataVale = formData.get("data_vale") as string;
  const observacoes = (formData.get("observacoes") as string) || null;

  if (!funcionarioId || !valor || !dataVale) {
    return json(
      { erro: "Funcionário, valor e data são obrigatórios" },
      { status: 400 }
    );
  }

  const valorNum = parseFloat(valor);
  if (isNaN(valorNum) || valorNum <= 0) {
    return json({ erro: "Valor inválido" }, { status: 400 });
  }

  try {
    await criarVale(
      funcionarioId,
      valorNum,
      dataVale,
      observacoes,
      usuario.id
    );
    return redirect("/vales/novo?toast=ok");
  } catch (error) {
    return json(
      { erro: "Erro ao registrar vale. Tente novamente." },
      { status: 500 }
    );
  }
}

const inputStyle = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.1)",
};

export default function NovoVale() {
  const { funcionarios, funcionarioPreSelecionado, usuario, usuarioSlug, offsetSemana, infoSemana } =
    useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [valorFormatado, setValorFormatado] = useState("");
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isSubmitting = navigation.state === "submitting";
  const hoje = new Date().toISOString().split("T")[0];

  const formatarMoeda = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, "");
    if (apenasDigitos === "") return "";
    const valorNumerico = parseFloat(apenasDigitos) / 100;
    return valorNumerico.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const desformatarMoeda = (valor: string): string => {
    const apenasDigitos = valor.replace(/\D/g, "");
    if (apenasDigitos === "") return "";
    const valorNumerico = parseFloat(apenasDigitos) / 100;
    return valorNumerico.toFixed(2);
  };

  const handleValorChange = (e: ChangeEvent<HTMLInputElement>) => {
    setValorFormatado(formatarMoeda(e.target.value));
  };

  useEffect(() => {
    if (!showUserMenu) return;
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) setShowUserMenu(false);
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showUserMenu]);

  const navegarSemana = (novoOffset: number) => {
    const params = new URLSearchParams(searchParams);
    if (novoOffset === 0) params.delete("semana");
    else params.set("semana", novoOffset.toString());
    setSearchParams(params);
  };

  const mostrarToast = searchParams.get("toast") === "ok";
  const fecharToast = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="min-h-screen bg-deep pb-24 md:pb-8">
      {mostrarToast && (
        <Toast message="Vale registrado com sucesso!" onClose={fecharToast} />
      )}
      <DashboardHeader
        nomeNegocio={usuario.nome_negocio || "Lava Jato Gestão"}
        usuarioSlug={usuarioSlug || ""}
        offsetSemana={offsetSemana}
        infoSemana={infoSemana}
        navegarSemana={navegarSemana}
        showUserMenu={showUserMenu}
        setShowUserMenu={setShowUserMenu}
      />

      <main className="pt-20 px-4 max-w-[1200px] mx-auto space-y-4">
        <div className="mb-2">
          <h1 className="font-display font-extrabold text-xl tracking-tight">
            Novo Vale
          </h1>
          <p
            className="font-mono-app mt-1"
            style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)" }}
          >
            Registre um adiantamento para o funcionário (descontado da comissão no fechamento)
          </p>
        </div>

        <div
          className="rounded-xl p-4 overflow-hidden max-w-xl"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Form method="post" className="space-y-4">
            {actionData?.erro && (
              <div
                className="px-3 py-2 rounded text-sm"
                style={{
                  background: "rgba(248,113,113,0.15)",
                  border: "1px solid rgba(248,113,113,0.3)",
                  color: "#fca5a5",
                }}
              >
                {actionData.erro}
              </div>
            )}

            <div>
              <label
                htmlFor="funcionario_id"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Funcionário *
              </label>
              <select
                id="funcionario_id"
                name="funcionario_id"
                required
                defaultValue={funcionarioPreSelecionado || ""}
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
              >
                <option value="">Selecione o funcionário</option>
                {funcionarios.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.nome}
                  </option>
                ))}
              </select>
              {funcionarios.length === 0 && (
                <p className="font-mono-app text-xs mt-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                  Nenhum funcionário ativo. Cadastre funcionários primeiro.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="valor"
                  className="block font-mono-app text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Valor (R$) *
                </label>
                <div className="relative">
                  <span
                    className="absolute left-3 top-1/2 -translate-y-1/2 font-mono-app text-sm"
                    style={{ color: "rgba(255,255,255,0.4)" }}
                  >
                    R$
                  </span>
                  <input
                    type="text"
                    id="valor"
                    value={valorFormatado}
                    onChange={handleValorChange}
                    required
                    placeholder="0,00"
                    inputMode="numeric"
                    className="w-full pl-9 pr-3 py-2 rounded font-mono-app text-sm"
                    style={inputStyle}
                  />
                  <input
                    type="hidden"
                    name="valor"
                    value={desformatarMoeda(valorFormatado)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="data_vale"
                  className="block font-mono-app text-xs mb-1"
                  style={{ color: "rgba(255,255,255,0.5)" }}
                >
                  Data *
                </label>
                <input
                  type="date"
                  id="data_vale"
                  name="data_vale"
                  required
                  defaultValue={hoje}
                  className="w-full px-3 py-2 rounded font-mono-app text-sm"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="observacoes"
                className="block font-mono-app text-xs mb-1"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                Observações
              </label>
              <input
                type="text"
                id="observacoes"
                name="observacoes"
                placeholder="Ex: Vale segunda, Almoço..."
                className="w-full px-3 py-2 rounded font-mono-app text-sm"
                style={inputStyle}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Link
                to="/dashboard"
                className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm text-center"
                style={{ border: "1px solid rgba(255,255,255,0.2)" }}
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting || funcionarios.length === 0}
                className="flex-1 px-4 py-2.5 rounded font-mono-app text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: "#4D7C5F", color: "#0C0C0C" }}
              >
                {isSubmitting ? "Registrando..." : "Registrar Vale"}
              </button>
            </div>
          </Form>
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
