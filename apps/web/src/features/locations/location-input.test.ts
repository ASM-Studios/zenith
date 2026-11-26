import { describe, expect, test } from 'vitest';
import { parseLocationFields } from './location-input.ts';

const valid = { name: 'Abisko', latitude: '68.35', longitude: '18.83' };

describe('parseLocationFields', () => {
  test('parseLocationFields returns the trimmed name and the numeric coordinates', () => {
    expect(parseLocationFields({ name: '  Abisko  ', latitude: ' 68.35 ', longitude: '18.83' })).toEqual({
      ok: true,
      value: { name: 'Abisko', latitude: 68.35, longitude: 18.83 },
    });
  });

  test('parseLocationFields rejects a blank name', () => {
    expect(parseLocationFields({ ...valid, name: '   ' })).toEqual({ ok: false, error: 'invalidName' });
  });

  test('parseLocationFields accepts a name of exactly 200 characters', () => {
    const name = 'a'.repeat(200);

    expect(parseLocationFields({ ...valid, name })).toEqual({
      ok: true,
      value: { name, latitude: 68.35, longitude: 18.83 },
    });
  });

  test('parseLocationFields rejects a name longer than 200 characters', () => {
    expect(parseLocationFields({ ...valid, name: 'a'.repeat(201) })).toEqual({ ok: false, error: 'invalidName' });
  });

  test('parseLocationFields checks the name before the coordinates', () => {
    expect(parseLocationFields({ name: '', latitude: 'x', longitude: '' })).toEqual({
      ok: false,
      error: 'invalidName',
    });
  });

  test('parseLocationFields accepts latitudes and longitudes on their boundaries', () => {
    expect(parseLocationFields({ name: 'Pole', latitude: '-90', longitude: '180' })).toEqual({
      ok: true,
      value: { name: 'Pole', latitude: -90, longitude: 180 },
    });
    expect(parseLocationFields({ name: 'Pole', latitude: '90', longitude: '-180' })).toEqual({
      ok: true,
      value: { name: 'Pole', latitude: 90, longitude: -180 },
    });
  });

  test('parseLocationFields rejects a latitude outside [-90, 90]', () => {
    expect(parseLocationFields({ ...valid, latitude: '90.1' })).toEqual({ ok: false, error: 'invalidCoordinates' });
    expect(parseLocationFields({ ...valid, latitude: '-91' })).toEqual({ ok: false, error: 'invalidCoordinates' });
  });

  test('parseLocationFields rejects a longitude outside [-180, 180]', () => {
    expect(parseLocationFields({ ...valid, longitude: '180.5' })).toEqual({ ok: false, error: 'invalidCoordinates' });
    expect(parseLocationFields({ ...valid, longitude: '-181' })).toEqual({ ok: false, error: 'invalidCoordinates' });
  });

  test('parseLocationFields rejects a coordinate left empty or blank', () => {
    expect(parseLocationFields({ ...valid, latitude: '' })).toEqual({ ok: false, error: 'invalidCoordinates' });
    expect(parseLocationFields({ ...valid, longitude: '  ' })).toEqual({ ok: false, error: 'invalidCoordinates' });
  });

  test('parseLocationFields rejects a coordinate written with a comma decimal', () => {
    expect(parseLocationFields({ ...valid, latitude: '68,35' })).toEqual({ ok: false, error: 'invalidCoordinates' });
  });

  test('parseLocationFields rejects a coordinate that is not a finite number', () => {
    expect(parseLocationFields({ ...valid, longitude: 'east' })).toEqual({ ok: false, error: 'invalidCoordinates' });
    expect(parseLocationFields({ ...valid, latitude: 'Infinity' })).toEqual({
      ok: false,
      error: 'invalidCoordinates',
    });
  });
});
