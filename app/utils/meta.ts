import type { MetaDescriptor, MetaFunction } from "@remix-run/node";

const SITE_NAME = "X Lava Jato";

export function pageTitle(title?: string): string {
  return title ? `${title} | ${SITE_NAME}` : SITE_NAME;
}

export const siteMeta: MetaFunction = () => {
  return [
    { title: SITE_NAME },
    { name: "description", content: "Gestão de lava jato - X Lava Jato" },
  ] satisfies MetaDescriptor[];
};

