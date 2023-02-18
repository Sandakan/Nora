import calculateElapsedTime from '../src/renderer/utils/calculateElapsedTime';

test('calculateElapsedTime', () => {
  expect(calculateElapsedTime('2003-04-29')).toBe({});
});
