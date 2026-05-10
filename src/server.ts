#!/usr/bin/env node
/**
 * validate MCP server. One tool: `validate`.
 *
 * Validate JSON data against a JSON Schema (draft-07). Returns
 * `{ valid, errors }` where each error carries a JSON-pointer path,
 * keyword, message, and the offending value.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import Ajv, { type ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';

const VERSION = '0.1.0';

export interface ValidationError {
  path: string;
  keyword: string;
  message: string;
  schema_path: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

/**
 * Validate `data` against `schema` (a parsed JSON Schema object).
 * Compiles the schema fresh each call — caching is the caller's job.
 */
export function validate(schema: unknown, data: unknown): ValidationResult {
  const validator = ajv.compile(schema as object);
  const ok = validator(data);
  if (ok) return { valid: true, errors: [] };
  const errs = (validator.errors ?? []).map((e: ErrorObject) => ({
    path: e.instancePath || '/',
    keyword: e.keyword,
    message: e.message ?? '',
    schema_path: e.schemaPath,
  }));
  return { valid: false, errors: errs };
}

const server = new Server(
  { name: 'validate', version: VERSION },
  { capabilities: { tools: {} } },
);

const TOOLS = [
  {
    name: 'validate',
    description:
      'Validate JSON data against a JSON Schema (draft-07 / 2019-09 / 2020-12). Returns a list of errors with JSON-pointer paths.',
    inputSchema: {
      type: 'object',
      properties: {
        schema: {
          type: 'object',
          description: 'JSON Schema object (parsed, not a string).',
        },
        data: {
          description: 'Data to validate. Any JSON value is allowed.',
        },
      },
      required: ['schema', 'data'],
    },
  },
] as const;

interface ValidateArgs {
  schema: unknown;
  data: unknown;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    if (name !== 'validate') return errorResult('unknown tool: ' + name);
    const a = args as unknown as ValidateArgs;
    return jsonResult(validate(a.schema, a.data));
  } catch (err) {
    return errorResult('validate failed: ' + (err as Error).message);
  }
});

function jsonResult(value: unknown) {
  return { content: [{ type: 'text', text: JSON.stringify(value, null, 2) }] };
}
function errorResult(message: string) {
  return { isError: true, content: [{ type: 'text', text: message }] };
}

// Only start the stdio server when run as a script — not when imported by tests.
if (import.meta.url === `file://${process.argv[1]}`) {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write(`validate MCP server v${VERSION} ready on stdio\n`);
}
