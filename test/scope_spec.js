/* jshint globalstrict: true */
/* global Scope: false */
"use strict";

describe("Scope", function() {

	it("can be constructed and used as an object", function() {
		var scope = new Scope();
		scope.aProperty = 1;

		expect(scope.aProperty).toBe(1);
	});

	describe('digest', function() {
		var scope;

		beforeEach(function() {
			scope = new Scope();
		});

		it("calls listener function of a watcher on first $digest", function() {
			var watchFn = function() { return 'something' },
					listenerFn = jasmine.createSpy();

			scope.$watch(watchFn, listenerFn);
			scope.$digest();		

			expect(listenerFn).toHaveBeenCalled();
		});

		it("calls the watch function with scope as an argument", function() {
			var watchFn = jasmine.createSpy(),
					listenerFn = function() {};

			scope.$watch(watchFn, listenerFn);
			scope.$digest();

			expect(watchFn).toHaveBeenCalledWith(scope); 		
		});

		it("calls listener function when the value of the watcher changed", function() {
			scope.someValue = 'a';
			scope.counter = 0;

			scope.$watch(
				function(scope) {
					return scope.someValue;
				},
				function(newValue, oldValue, scope) {
					scope.counter++;
				});

			expect(scope.counter).toBe(0);

			scope.$digest()
			expect(scope.counter).toBe(1); 

			scope.$digest()
			expect(scope.counter).toBe(1); 

			scope.someValue = 'b';
			expect(scope.counter).toBe(1); 

			scope.$digest();
			expect(scope.counter).toBe(2); 

		});

		it("calls listener when watch value is first undefined", function() {
			scope.watchValue = undefined;
			scope.counter = 0;

			scope.$watch(
				function(scope) {
					return scope.watchValue;
			},
				function() {
					scope.counter++;
			});

			scope.$digest();
			expect(scope.counter).toBe(1);
		});

		it("calls listener with new value as old value the first time", function() {
			scope.watchValue = 123;
			var oldValueTest;

			scope.$watch(
				function() {
					return scope.watchValue;
				},
				function(newValue, oldValue, self) {
					oldValueTest = oldValue;
				}
			);

			scope.$digest();
			expect(oldValueTest).toBe(123);
		});

		it("may have watchers that don't have listener function", function() {
			scope.watchFn = jasmine.createSpy().and.returnValue('something');
			scope.$watch(scope.watchFn);

			scope.$digest();
			expect(scope.watchFn).toHaveBeenCalled();
		});

		it("stays in digests until all watchers are not dirty", function() {
			scope.name = 'Jane';

			scope.$watch(
				function(scope) {
					return scope.upperName;
				},
				function(newValue, oldValue, scope) {
					if (newValue) {
						scope.firstLetter = newValue.substring(0,1) + '.';
					}
				}
			)

			scope.$watch(
				function(scope) {
					return scope.name;
				},
				function(newValue, oldValue, scope) {
					scope.upperName = scope.name.toUpperCase();
				}
			)

			scope.$digest();
			expect(scope.firstLetter).toBe('J.');

			scope.name = 'Bob';
			scope.$digest();
			expect(scope.firstLetter).toBe('B.');
		});

		it("throws an error after 10 iterations if there are still changes", function() {
			scope.counterOne = 0;
			scope.counterTwo = 0;

			scope.$watch(
				function(scope) {
					return scope.counterOne;
				},
				function(newValue, oldValue, scope) {
					scope.counterTwo++;
				}
			)

			scope.$watch(
				function(scope) {
					return scope.counterTwo
				},
				function(newValue, oldValue, scope) {
					scope.counterOne++;
				}
			)

			expect((function() {scope.$digest()})).toThrow();
		})






















	});

});