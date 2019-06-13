import { isEqualCustomizer } from "../../src/utils";
import _ from "lodash";

function isEqual(value, other) {
  return _.isEqualWith(value, other, isEqualCustomizer);
}

test("regex for value only when other is string", () => {
  expect(isEqual(/.*/, "a")).toBe(true);
  expect(isEqual(/.*/, 1)).toBe(false);
  expect(isEqual(/.*/, true)).toBe(false);
});

test("objects", () => {
  expect(isEqual({ a: /.*/ }, { a: "any value" })).toBe(true);
});

test("complex objects", () => {
  let value = {
    a: "a",
    b: ["a", 1],
    c: true,
    d: "d",
    e: /.*/,
    f: {
      fa: [1, 2],
      fb: { x: "x" },
      fc: /.*/
    }
  };

  let other = {
    a: "a",
    b: ["a", 1],
    c: true,
    d: "d",
    e: "any-value",
    f: {
      fa: [1, 2],
      fb: { x: "x" },
      fc: "any-value"
    }
  };

  expect(isEqual(value, other)).toBe(true);
});
