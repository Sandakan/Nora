import isLatestVersion from '../src/renderer/src/utils/isLatestVersion';

describe('App versions check', () => {
  test('Basic version checks', () => {
    expect(isLatestVersion('2.0.0', '2.0.0')).toBe(true);
    expect(isLatestVersion('2.0.0', '2.1.0')).toBe(true);
    expect(isLatestVersion('2.1.0', '2.0.0')).toBe(false);
  });

  test('Versions with same release phases', () => {
    expect(isLatestVersion('2.0.0-stable', '2.0.0-stable')).toBe(true);
    expect(isLatestVersion('2.0.0-beta', '2.0.0-beta')).toBe(true);
    expect(isLatestVersion('2.0.0-alpha', '2.0.0-alpha')).toBe(true);
  });

  test('Versions with same release phases and different build metadata', () => {
    expect(isLatestVersion('2.0.0-stable.20230515', '2.0.0-stable.20230510')).toBe(true);
    expect(isLatestVersion('2.0.0-beta20230510', '2.0.0-beta20230515')).toBe(true);
    expect(isLatestVersion('2.0.0-alpha.20250101', '2.0.0-alpha.19990509')).toBe(true);
  });

  test('Versions with different release phases', () => {
    expect(isLatestVersion('2.0.0-stable', '2.0.0-alpha')).toBe(true);
    expect(isLatestVersion('2.0.0-beta', '2.0.0-stable')).toBe(true);
    expect(isLatestVersion('2.0.0-alpha', '2.0.0-beta')).toBe(true);
  });

  test('Different major versions with same release phases', () => {
    expect(isLatestVersion('3.0.0-stable', '2.0.0-stable')).toBe(false);
    expect(isLatestVersion('2.0.0-stable', '3.0.0-stable')).toBe(true);
  });

  test('Different minor versions with same release phases', () => {
    expect(isLatestVersion('2.1.0-stable', '2.0.0-stable')).toBe(false);
    expect(isLatestVersion('2.0.0-stable', '2.1.0-stable')).toBe(true);
  });

  test('Different patch versions with same release phases', () => {
    expect(isLatestVersion('2.0.2-stable', '2.0.0-stable')).toBe(false);
    expect(isLatestVersion('2.0.0-stable', '2.0.2-stable')).toBe(true);
  });

  test('Random version checks', () => {
    expect(isLatestVersion('2.1.2-stable', '3.4.1-alpha')).toBe(true);
    expect(isLatestVersion('4.2.5-beta', '2.3.2-stable')).toBe(true);
  });
});
