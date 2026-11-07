import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

// AC-8 (spec 0001): every forbidden dependency of docs/architecture.md fails the lint step.
// Each case lints a snippet as if it lived at `filePath`, with the project's eslint.config.js.
const eslint = new ESLint({
  cwd: fileURLToPath(new URL("..", import.meta.url)),
});

async function lintRuleIds(filePath: string, code: string): Promise<string[]> {
  const [result] = await eslint.lintText(code, { filePath });
  return (result?.messages ?? [])
    .filter((message) => message.severity === 2)
    .map((message) => message.ruleId ?? "parse-error");
}

describe("layer rules (docs/architecture.md, Forbidden dependencies)", () => {
  it.each([
    {
      rule: "1 — data must not import business",
      filePath: "src/data/fixture.ts",
      code: 'import { createHealthService } from "../business/health-service.ts";\nexport { createHealthService };\n',
      ruleId: "no-restricted-imports",
    },
    {
      rule: "1 — business must not import api",
      filePath: "src/business/fixture.ts",
      code: 'import { buildApp } from "../api/app.ts";\nexport { buildApp };\n',
      ruleId: "no-restricted-imports",
    },
    {
      rule: "2 — api must not skip business and import data",
      filePath: "src/api/fixture.ts",
      code: 'import { openDatabase } from "../data/database.ts";\nexport { openDatabase };\n',
      ruleId: "no-restricted-imports",
    },
    {
      rule: "3 — web must not import a server layer",
      filePath: "src/web/fixture.ts",
      code: 'import { createHealthService } from "../business/health-service.ts";\nexport { createHealthService };\n',
      ruleId: "no-restricted-imports",
    },
    {
      rule: "4 — business must not import fastify",
      filePath: "src/business/fixture.ts",
      code: 'import Fastify from "fastify";\nexport { Fastify };\n',
      ruleId: "no-restricted-imports",
    },
    {
      rule: "4 — business must not call new Date()",
      filePath: "src/business/fixture.ts",
      code: "export const today = new Date();\n",
      ruleId: "no-restricted-syntax",
    },
    {
      rule: "4 — business must not call Date.now()",
      filePath: "src/business/fixture.ts",
      code: "export const now = Date.now();\n",
      ruleId: "no-restricted-syntax",
    },
    {
      rule: "5 — shared must not import any layer",
      filePath: "src/shared/fixture.ts",
      code: 'import { createHealthService } from "../business/health-service.ts";\nexport { createHealthService };\n',
      ruleId: "no-restricted-imports",
    },
  ])(
    "reports the forbidden dependency: $rule",
    async ({ filePath, code, ruleId }) => {
      expect(await lintRuleIds(filePath, code)).toContain(ruleId);
    },
  );

  it.each([
    {
      direction: "api → business",
      filePath: "src/api/fixture.ts",
      code: 'import { createHealthService } from "../business/health-service.ts";\nexport { createHealthService };\n',
    },
    {
      direction: "business → data",
      filePath: "src/business/fixture.ts",
      code: 'import { openDatabase } from "../data/database.ts";\nexport { openDatabase };\n',
    },
    {
      direction: "web → shared",
      filePath: "src/web/fixture.ts",
      code: 'import type { HealthResponse } from "../shared/health.ts";\nexport type { HealthResponse };\n',
    },
    {
      direction: "business parses a given date",
      filePath: "src/business/fixture.ts",
      code: 'export const parsed = new Date("2026-11-07");\n',
    },
  ])("allows the permitted imports: $direction", async ({ filePath, code }) => {
    expect(await lintRuleIds(filePath, code)).toEqual([]);
  });

  it("rejects dangerouslySetInnerHTML in web (docs/security.md)", async () => {
    const code =
      'export const Unsafe = () => <div dangerouslySetInnerHTML={{ __html: "x" }} />;\n';
    expect(await lintRuleIds("src/web/Fixture.tsx", code)).toContain(
      "no-restricted-syntax",
    );
  });
});
