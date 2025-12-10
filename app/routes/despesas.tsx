import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet } from "@remix-run/react";
import { requererUsuario } from "~/utils/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
  await requererUsuario(request);
  return null;
}

export default function DespesasLayout() {
  return <Outlet />;
}
