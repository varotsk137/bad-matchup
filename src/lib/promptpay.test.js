import { describe, expect, it } from 'vitest'
import { crc16, formatPromptPayId, parsePromptPayId, promptPayPayload } from './promptpay'

describe('crc16', () => {
  it('matches the CRC-16/CCITT-FALSE check value', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
})

describe('promptPayPayload', () => {
  // expected strings come from promptpay-qr 0.5.0 (dtinth), the long-standing
  // reference implementation that Thai banking apps have scanned for years
  it('builds a mobile-number payload without an amount', () => {
    expect(promptPayPayload('000-000-0000')).toBe(
      '00020101021129370016A000000677010111011300660000000005802TH530376463048956'
    )
  })

  it('builds a mobile-number payload with an amount', () => {
    expect(promptPayPayload('000-000-0000', 422)).toBe(
      '00020101021229370016A000000677010111011300660000000005802TH530376454044.226304E469'
    )
  })

  it('builds a national-ID payload', () => {
    expect(promptPayPayload('1111111111111')).toBe(
      '00020101021129370016A000000677010111021311111111111115802TH530376463047B5A'
    )
  })

  it('turns a mobile number into 0066 plus nine digits, amount in tag 54', () => {
    expect(promptPayPayload('081-234-5678', 19167)).toBe(
      '00020101021229370016A000000677010111011300668123456785802TH53037645406191.676304D4B0'
    )
    expect(promptPayPayload('0812345678', 50000)).toBe(
      '00020101021229370016A000000677010111011300668123456785802TH53037645406500.00630416BF'
    )
  })

  it('ends with a checksum over everything before it', () => {
    const p = promptPayPayload('0812345678', 50000)
    expect(p.slice(-8, -4)).toBe('6304')
    expect(p.slice(-4)).toBe(crc16(p.slice(0, -4)))
  })

  it('leaves the amount out when there is none', () => {
    expect(promptPayPayload('0812345678', 0)).not.toContain('5406')
    expect(promptPayPayload('0812345678', 0).slice(10, 12)).toBe('11')
  })

  it('refuses anything that is not a phone number or national ID', () => {
    expect(() => promptPayPayload('12345')).toThrow()
  })
})

describe('parsePromptPayId', () => {
  it('accepts mobile numbers and national IDs, with or without dashes', () => {
    expect(parsePromptPayId('081 234 5678')).toEqual({ type: 'phone', digits: '0812345678' })
    expect(parsePromptPayId('1-2345-67890-12-3')).toEqual({
      type: 'id',
      digits: '1234567890123',
    })
  })

  it('rejects the rest', () => {
    expect(parsePromptPayId('')).toBeNull()
    expect(parsePromptPayId('8123456789')).toBeNull()
    expect(parsePromptPayId('081234567')).toBeNull()
  })
})

describe('formatPromptPayId', () => {
  it('shows a phone number in full and a national ID masked', () => {
    expect(formatPromptPayId('0812345678')).toBe('081-234-5678')
    expect(formatPromptPayId('1234567890123')).toBe('x-xxxx-xxxx0-12-3')
  })
})
