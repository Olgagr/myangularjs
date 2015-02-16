/* jshint globalstrict: true */
/* global parse: false */
"use strict";

describe('parse', function() {

	it('can parse an integer', function() {
		var fn = parse('42');
		expect(fn).toBeDefined();
		expect(fn()).toBe(42);
	});

	it('makes integers both literals and constant', function() {
		var fn = parse('42');
		expect(fn.constant).toBe(true);
		expect(fn.literal).toBe(true);
	});

	it('can parse a floating point number', function() {
		var fn = parse('4.2');
		var fn2 = parse('.4');
		expect(fn()).toBe(4.2);
		expect(fn2()).toBe(0.4);
	});

	it("can parse string in single quotes", function() {
		var fn = parse("'some string'");
		expect(fn()).toBe('some string');
	});

	it("can parse string in double quotes", function() {
		var fn = parse('"some string"');
		expect(fn()).toBe("some string");
	});

	it("does not parse string with mismatching quotes", function() {
		expect(function() { parse('"abc\'') }).toThrow();
	});

	it("makes strings both literal and constant", function() {
		var fn = parse('"abc"');
		expect(fn.constant).toBe(true);
		expect(fn.literal).toBe(true);
	});

	it("parses null", function() {
		var fn = parse('null');
		expect(fn()).toBe(null);
	});

	it("parses true", function() {
		var fn = parse('true');
		expect(fn()).toBe(true);
	});

	it("parses false", function() {
		var fn = parse('false');
		expect(fn()).toBe(false);
	});

	it("marks booleans as literal and constant", function() {
		var fn = parse('true');
		expect(fn.literal).toBe(true);
		expect(fn.constant).toBe(true);
	});

	it("marks null as literal and constant", function() {
		var fn = parse('null');
		expect(fn.literal).toBe(true);
		expect(fn.constant).toBe(true);
	});

	it("ignores white spaces", function() {
		var fn = parse(' \n42 ');
		expect(fn()).toBe(42);
	});

	it("parses empty array", function() {
		var fn = parse('[]');
		console.log(fn)
		expect(fn()).toEqual([]);
	});

	it("parses not empty arrays", function() {
		var fn = parse('[1, "two", [4]]');
		expect(fn()).toEqual([1, "two", [4]]);
	});

	it("parses arrays with trailing commas", function() {
		var fn = parse('[1,2,3,]');
		expect(fn()).toEqual([1,2,3]);
	});

	it("sets array as literal and constant", function() {
		var fn = parse('[1,2]');
		expect(fn.literal).toBe(true);
		expect(fn.literal).toBe(true);
	});

	it("parses empty object", function() {
		var fn = parse('{}');
		expect(fn()).toEqual({});
	});

	it("parses not empty object", function() {
		var fn = parse('{a: 1, b: [1,2], c: {d: 4}}');
		expect(fn()).toEqual({a: 1, b: [1,2], c: {d: 4}});
	});

	it("looks up an attribute from the scope", function() {
		var fn = parse('someKey');
		expect(fn({ someKey: 1 })).toBe(1);
		expect(fn({})).toBeUndefined();
		expect(fn()).toBeUndefined();
	});

	it("looks up a 2-part identifier path from the scope", function() {
		var fn = parse('someKey.childKey');
		expect(fn({ someKey: { childKey: 3 } })).toBe(3);
		expect(fn({ someKey: {} })).toBeUndefined();
		expect(fn()).toBeUndefined();
	});


























});