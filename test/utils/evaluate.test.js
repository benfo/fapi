import { evaluate } from "../../src/utils";
import _ from "lodash";

test("should iterate every key and recursively evaluate", () => {
  let value = {
    item1: "item1",
    item2: () => "item2",
    item3: {
      sub1: "sub1",
      sub2: () => "sub2"
    },
    items: ["one", "two"],
    item4: /value/,
    item5: 5
  };

  let expected = {
    item1: "item1",
    item2: "item2",
    item3: {
      sub1: "sub1",
      sub2: "sub2"
    },
    items: ["one", "two"],
    item4: /value/,
    item5: 5
  };

  let result = evaluate(value);

  expect(_.isEqual(result, expected)).toBe(true);
});

test("should return arrays as is", () => {
  let value = {
    items: ["one", "two"]
  };
  let expected = {
    items: ["one", "two"]
  };

  let result = evaluate(value);

  expect(_.isEqual(result, expected)).toBe(true);
});

test("should resolve simple values if it's a fn", () => {
  let value = () => "item";
  let expected = "item";

  let result = evaluate(value);

  expect(_.isEqual(result, expected)).toBe(true);
});

test("should resolve complex values if it's a fn", () => {
  let value = () => {
    return {
      item1: "item1",
      item2: () => "item2"
    };
  };
  let expected = {
    item1: "item1",
    item2: "item2"
  };

  let result = evaluate(value);

  expect(_.isEqual(result, expected)).toBe(true);
});

test("value as fn returns array", () => {
  let value = () => ["a"];
  let expected = ["a"];
  let result = evaluate(value);

  expect(_.isEqual(result, expected)).toBe(true);
});

test("should not evaluate functions when context is undefined", () => {
  let value = {
    item1: "item1",
    item2: ctx => ctx.item2
  };

  let result = evaluate(value);

  expect(_.isEqual(value, result)).toBe(true);
});

test("should  evaluate functions when context has a value", () => {
  let value = {
    item1: "item1",
    item2: ctx => ctx.item2
  };
  let expected = { item1: "item1", item2: "item2" };

  let result = evaluate(value, { item2: "item2" });

  expect(_.isEqual(expected, result)).toBe(true);
});
