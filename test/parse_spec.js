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

});