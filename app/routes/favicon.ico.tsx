// Rota para evitar erro 404 do favicon
export async function loader() {
  return new Response(null, { status: 204 });
}

