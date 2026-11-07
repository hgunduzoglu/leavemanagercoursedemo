import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

// Layer rules — docs/architecture.md, "Forbidden dependencies". Proven by src/layer-rules.test.ts.
// The composition root (src/server.ts) sits outside every layer folder and is not restricted.
const forbidLayers = (...layers) =>
  layers.map((layer) => ({
    group: [`**/${layer}/**`],
    message: `Katman kuralı: bu katman src/${layer} katmanını import edemez (docs/architecture.md).`,
  }));

export default defineConfig(
  { ignores: ["dist/", "coverage/"] },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["src/data/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: forbidLayers("business", "api", "web") },
      ],
    },
  },
  {
    files: ["src/business/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            ...forbidLayers("api", "web"),
            {
              group: ["fastify", "fastify/*", "@fastify/*"],
              message:
                "Katman kuralı: iş katmanı HTTP/framework tipi import etmez (docs/architecture.md).",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "NewExpression[callee.name='Date'][arguments.length=0]",
          message:
            "Katman kuralı: iş katmanı saati doğrudan okumaz; saat dışarıdan verilir (docs/architecture.md).",
        },
        {
          selector:
            "CallExpression[callee.object.name='Date'][callee.property.name='now']",
          message:
            "Katman kuralı: iş katmanı saati doğrudan okumaz; saat dışarıdan verilir (docs/architecture.md).",
        },
      ],
    },
  },
  {
    files: ["src/api/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: forbidLayers("data", "web") },
      ],
    },
  },
  {
    files: ["src/web/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: forbidLayers("api", "business", "data") },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']",
          message:
            "dangerouslySetInnerHTML yasaktır (docs/security.md, Input & output).",
        },
      ],
    },
  },
  {
    files: ["src/shared/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        { patterns: forbidLayers("api", "business", "data", "web") },
      ],
    },
  },
);
