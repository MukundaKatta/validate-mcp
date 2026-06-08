# validate-mcp

[![npm](https://img.shields.io/npm/v/@mukundakatta/validate-mcp.svg)](https://www.npmjs.com/package/@mukundakatta/validate-mcp)
[![mcp](https://img.shields.io/badge/protocol-MCP-blue.svg)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

MCP server: validate JSON data against a JSON Schema. Backed by ajv +
ajv-formats. Returns every error (not just the first) with a JSON-pointer
path so the model can fix the offending field.

## Tool

### `validate`

```json
{
  "schema": {
    "type": "object",
    "properties": { "name": { "type": "string" }, "age": { "type": "integer" } },
    "required": ["name"]
  },
  "data": { "age": "thirty" }
}
```

→

```json
{
  "valid": false,
  "errors": [
    { "path": "/",    "keyword": "required", "message": "must have required property 'name'", "schema_path": "#/required" },
    { "path": "/age", "keyword": "type",     "message": "must be integer",                     "schema_path": "#/properties/age/type" }
  ]
}
```

Supports draft-07 / 2019-09 / 2020-12 schemas and the standard formats
(`email`, `uri`, `uuid`, `date-time`, etc.) via ajv-formats.

## Configure

```json
{ "mcpServers": { "validate": { "command": "npx", "args": ["-y", "@mukundakatta/validate-mcp"] } } }
```

## License

MIT.
