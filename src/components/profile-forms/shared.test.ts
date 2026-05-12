import { describe, expect, it } from 'vitest'
import {
  parseEnvText,
  stringifyEnv,
  splitMultiline,
  joinMultiline,
  splitArgs,
  joinArgs,
} from './shared'

describe('parseEnvText', () => {
  it('parses simple key=value pairs', () => {
    const result = parseEnvText('KEY=value\nOTHER=123')
    expect(result).toEqual({ KEY: 'value', OTHER: '123' })
  })

  it('strips surrounding double quotes from values', () => {
    const result = parseEnvText('PATH="/usr/local/bin"\nDESC="hello world"')
    expect(result).toEqual({
      PATH: '/usr/local/bin',
      DESC: 'hello world',
    })
  })

  it('strips surrounding single quotes from values', () => {
    const result = parseEnvText("NAME='John Doe'\nDIR='/home/user'")
    expect(result).toEqual({
      NAME: 'John Doe',
      DIR: '/home/user',
    })
  })

  it('preserves inner quotes', () => {
    const result = parseEnvText('ARGS="--flag \'value\'"')
    expect(result).toEqual({ ARGS: "--flag 'value'" })
  })

  it('does not strip mismatched quotes', () => {
    const result = parseEnvText('KEY="unclosed')
    expect(result).toEqual({ KEY: '"unclosed' })
  })

  it('skips empty lines and lines without =', () => {
    const result = parseEnvText('\n  \nKEY=value\njust a comment\nOTHER=2\n')
    expect(result).toEqual({ KEY: 'value', OTHER: '2' })
  })

  it('trims whitespace from keys and values', () => {
    const result = parseEnvText('  KEY  =  value  ')
    expect(result).toEqual({ KEY: 'value' })
  })

  it('returns undefined for empty input', () => {
    expect(parseEnvText('')).toBeUndefined()
    expect(parseEnvText('  \n  ')).toBeUndefined()
  })
})

describe('stringifyEnv', () => {
  it('converts record to key=value lines', () => {
    const result = stringifyEnv({ KEY: 'value', OTHER: '123' })
    expect(result).toBe('KEY=value\nOTHER=123')
  })

  it('returns empty string for empty/undefined', () => {
    expect(stringifyEnv({})).toBe('')
    expect(stringifyEnv(undefined)).toBe('')
  })
})

describe('splitMultiline', () => {
  it('splits and trims lines', () => {
    expect(splitMultiline('a\nb\nc')).toEqual(['a', 'b', 'c'])
  })

  it('filters empty lines', () => {
    expect(splitMultiline('a\n\nb\n  \nc')).toEqual(['a', 'b', 'c'])
  })
})

describe('joinMultiline', () => {
  it('joins with newlines', () => {
    expect(joinMultiline(['a', 'b'])).toBe('a\nb')
  })

  it('returns empty string for empty/undefined', () => {
    expect(joinMultiline([])).toBe('')
    expect(joinMultiline(undefined)).toBe('')
  })
})

describe('splitArgs', () => {
  it('splits on whitespace', () => {
    expect(splitArgs('arg1 arg2  arg3')).toEqual(['arg1', 'arg2', 'arg3'])
  })
})

describe('joinArgs', () => {
  it('joins with spaces', () => {
    expect(joinArgs(['arg1', 'arg2'])).toBe('arg1 arg2')
  })

  it('returns empty string for empty/undefined', () => {
    expect(joinArgs([])).toBe('')
    expect(joinArgs(undefined)).toBe('')
  })
})
