// A small JSON Schema (2020-12 subset) type and validator for tool arguments.
// The library has zero runtime dependencies, so the validator lives here; the
// subset is exactly what the tool catalogue emits — object/array/scalar types,
// enum, const, numeric bounds, required, additionalProperties, items, anyOf,
// and `$ref` into the schema's own `$defs`. Tests check every catalogue schema
// with a full validator (Ajv) and check this one agrees with it.

export type JsonSchemaType =
  'object' | 'array' | 'string' | 'number' | 'integer' | 'boolean' | 'null'

export interface JsonSchema {
  $schema?: string
  $ref?: string
  $defs?: Record<string, JsonSchema>
  type?: JsonSchemaType | JsonSchemaType[]
  description?: string
  enum?: readonly (string | number | boolean | null)[]
  const?: string | number | boolean | null
  minimum?: number
  maximum?: number
  exclusiveMinimum?: number
  exclusiveMaximum?: number
  minLength?: number
  maxLength?: number
  minItems?: number
  maxItems?: number
  properties?: Record<string, JsonSchema>
  required?: readonly string[]
  additionalProperties?: boolean | JsonSchema
  items?: JsonSchema
  anyOf?: readonly JsonSchema[]
  default?: unknown
}

export interface SchemaIssue {
  /** JSON-pointer-like path into the instance (`''` is the root). */
  path: string
  message: string
}

function typeOf(value: unknown): JsonSchemaType {
  if (value === null) return 'null'
  if (Array.isArray(value)) return 'array'
  if (typeof value === 'number') return Number.isInteger(value) ? 'integer' : 'number'
  if (typeof value === 'object') return 'object'
  if (typeof value === 'string') return 'string'
  if (typeof value === 'boolean') return 'boolean'
  return 'null'
}

function matchesType(actual: JsonSchemaType, expected: JsonSchemaType): boolean {
  return expected === actual || (expected === 'number' && actual === 'integer')
}

function resolveRef(root: JsonSchema, ref: string): JsonSchema {
  const prefix = '#/$defs/'
  if (!ref.startsWith(prefix)) throw new Error(`live-mix: unsupported $ref "${ref}"`)
  const name = ref.slice(prefix.length)
  const target = root.$defs?.[name]
  if (!target) throw new Error(`live-mix: unresolved $ref "${ref}"`)
  return target
}

function describeValue(value: unknown): string {
  return value === undefined ? 'undefined' : JSON.stringify(value)
}

function check(
  root: JsonSchema,
  schema: JsonSchema,
  value: unknown,
  path: string,
  issues: SchemaIssue[],
): void {
  if (schema.$ref) {
    check(root, resolveRef(root, schema.$ref), value, path, issues)
    return
  }
  if (schema.anyOf) {
    const attempts = schema.anyOf.map((branch) => {
      const branchIssues: SchemaIssue[] = []
      check(root, branch, value, path, branchIssues)
      return branchIssues
    })
    if (!attempts.some((branchIssues) => branchIssues.length === 0)) {
      const best = attempts.reduce((a, b) => (a.length <= b.length ? a : b))
      issues.push({ path, message: `matches none of the alternatives (${best[0]?.message})` })
    }
    return
  }
  if (schema.const !== undefined) {
    if (value !== schema.const) {
      issues.push({ path, message: `expected ${describeValue(schema.const)}` })
    }
    return
  }
  if (schema.enum) {
    if (!schema.enum.includes(value as string)) {
      issues.push({
        path,
        message: `expected one of ${schema.enum.map(describeValue).join(', ')}, got ${describeValue(value)}`,
      })
    }
    return
  }
  const actual = typeOf(value)
  if (schema.type !== undefined) {
    const allowed = Array.isArray(schema.type) ? schema.type : [schema.type]
    if (!allowed.some((expected) => matchesType(actual, expected))) {
      issues.push({ path, message: `expected ${allowed.join(' | ')}, got ${actual}` })
      return
    }
  }
  if (actual === 'number' || actual === 'integer') {
    const number = value as number
    if (!Number.isFinite(number)) issues.push({ path, message: 'expected a finite number' })
    if (schema.minimum !== undefined && number < schema.minimum) {
      issues.push({ path, message: `expected ≥ ${schema.minimum}, got ${number}` })
    }
    if (schema.maximum !== undefined && number > schema.maximum) {
      issues.push({ path, message: `expected ≤ ${schema.maximum}, got ${number}` })
    }
    if (schema.exclusiveMinimum !== undefined && number <= schema.exclusiveMinimum) {
      issues.push({ path, message: `expected > ${schema.exclusiveMinimum}, got ${number}` })
    }
    if (schema.exclusiveMaximum !== undefined && number >= schema.exclusiveMaximum) {
      issues.push({ path, message: `expected < ${schema.exclusiveMaximum}, got ${number}` })
    }
  }
  if (actual === 'string') {
    const text = value as string
    if (schema.minLength !== undefined && text.length < schema.minLength) {
      issues.push({ path, message: `expected at least ${schema.minLength} characters` })
    }
    if (schema.maxLength !== undefined && text.length > schema.maxLength) {
      issues.push({ path, message: `expected at most ${schema.maxLength} characters` })
    }
  }
  if (actual === 'array') {
    const list = value as unknown[]
    if (schema.minItems !== undefined && list.length < schema.minItems) {
      issues.push({ path, message: `expected at least ${schema.minItems} items` })
    }
    if (schema.maxItems !== undefined && list.length > schema.maxItems) {
      issues.push({ path, message: `expected at most ${schema.maxItems} items` })
    }
    const items = schema.items
    if (items) {
      list.forEach((item, index) => check(root, items, item, `${path}[${index}]`, issues))
    }
  }
  if (actual === 'object') {
    const record = value as Record<string, unknown>
    for (const key of schema.required ?? []) {
      if (record[key] === undefined) issues.push({ path: join(path, key), message: 'is required' })
    }
    for (const [key, child] of Object.entries(record)) {
      if (child === undefined) continue
      const property = schema.properties?.[key]
      if (property) {
        check(root, property, child, join(path, key), issues)
      } else if (schema.additionalProperties === false) {
        issues.push({ path: join(path, key), message: 'is not a known property' })
      } else if (typeof schema.additionalProperties === 'object') {
        check(root, schema.additionalProperties, child, join(path, key), issues)
      }
    }
  }
}

function join(path: string, key: string): string {
  return path === '' ? key : `${path}.${key}`
}

/** Issues found validating `value` against `schema`; empty means valid. */
export function validateSchema(schema: JsonSchema, value: unknown): SchemaIssue[] {
  const issues: SchemaIssue[] = []
  check(schema, schema, value, '', issues)
  return issues
}

/** One line per issue, for a tool's error message. */
export function formatIssues(issues: readonly SchemaIssue[]): string {
  return issues
    .map((issue) => (issue.path === '' ? issue.message : `${issue.path}: ${issue.message}`))
    .join('; ')
}

/** Collect the `$defs` names a schema references (transitively), for self-contained tool schemas. */
export function collectRefs(schema: JsonSchema, defs: Record<string, JsonSchema>): Set<string> {
  const seen = new Set<string>()
  const visit = (node: JsonSchema | undefined): void => {
    if (!node) return
    if (node.$ref) {
      const name = node.$ref.slice('#/$defs/'.length)
      if (!seen.has(name)) {
        seen.add(name)
        visit(defs[name])
      }
    }
    for (const child of Object.values(node.properties ?? {})) visit(child)
    visit(node.items)
    if (typeof node.additionalProperties === 'object') visit(node.additionalProperties)
    for (const branch of node.anyOf ?? []) visit(branch)
  }
  visit(schema)
  return seen
}

/** The schema with exactly the `$defs` it references attached (a copy). */
export function withDefs(schema: JsonSchema, defs: Record<string, JsonSchema>): JsonSchema {
  const needed = collectRefs(schema, defs)
  const rest: JsonSchema = { ...schema }
  delete rest.$defs
  if (needed.size === 0) return rest
  const picked: Record<string, JsonSchema> = {}
  for (const name of [...needed].sort()) picked[name] = defs[name]
  return { ...rest, $defs: picked }
}
