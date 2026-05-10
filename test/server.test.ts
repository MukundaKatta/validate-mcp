import { strict as assert } from 'node:assert';
import { test } from 'node:test';

import { validate } from '../src/server.js';

test('returns valid=true for matching data', () => {
  const r = validate(
    { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    { name: 'Mukunda' },
  );
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, []);
});

test('returns errors with JSON-pointer paths for missing required field', () => {
  const r = validate(
    { type: 'object', properties: { name: { type: 'string' } }, required: ['name'] },
    {},
  );
  assert.equal(r.valid, false);
  assert.ok(r.errors.length >= 1);
  const required = r.errors.find((e) => e.keyword === 'required');
  assert.ok(required);
  assert.match(required.message, /name/);
});

test('reports type errors with path', () => {
  const r = validate(
    {
      type: 'object',
      properties: { age: { type: 'integer' } },
    },
    { age: 'not a number' },
  );
  assert.equal(r.valid, false);
  const typeErr = r.errors.find((e) => e.keyword === 'type');
  assert.ok(typeErr);
  assert.equal(typeErr.path, '/age');
});

test('reports all errors when allErrors is on', () => {
  const r = validate(
    {
      type: 'object',
      properties: {
        a: { type: 'integer' },
        b: { type: 'integer' },
      },
    },
    { a: 'x', b: 'y' },
  );
  assert.equal(r.valid, false);
  assert.equal(r.errors.length, 2);
});

test('format validators (e.g. email, uuid) work via ajv-formats', () => {
  const r = validate({ type: 'string', format: 'email' }, 'not-an-email');
  assert.equal(r.valid, false);
});

test('throws on malformed schema', () => {
  // type: "no-such-type" is not a valid JSON Schema type.
  assert.throws(() => validate({ type: 'no-such-type' }, 1));
});

test('arrays validate', () => {
  const schema = {
    type: 'array',
    items: { type: 'integer' },
    minItems: 2,
  };
  assert.equal(validate(schema, [1, 2, 3]).valid, true);
  assert.equal(validate(schema, [1]).valid, false);
  assert.equal(validate(schema, [1, 'two']).valid, false);
});
