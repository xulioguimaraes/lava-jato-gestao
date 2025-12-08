import { createRequestHandler } from "@remix-run/netlify";
// @ts-ignore - build file is generated
import * as build from "../../build/index.js";

export const handler = createRequestHandler({
  build: build as any,
  mode: process.env.NODE_ENV,
});

