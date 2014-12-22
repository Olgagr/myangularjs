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
		});

		it("ends the digest when the last watch is clean", function() {
			scope.array = _.range(100);
			var watchExecution = 0;

			_.times(100, function(i) {
				scope.$watch(
					function(scope) {
						watchExecution++;
						return scope.array[i];
					},
					function(newValue, oldValue, scope) {}
				)
			});

			scope.$digest();
			expect(watchExecution).toBe(200);

			scope.array[0] = 420;
			scope.$digest();
			expect(watchExecution).toBe(301);
		});

		it("does not run digest so the new watchers are not run", function() {
			scope.someValue = 'abc';
			scope.counter = 0;

			scope.$watch(
				function(scope) {
					return scope.someValue;
				},
				function(newValue, oldValue, scope) {
					scope.$watch(
						function(scope) {
							return scope.someValue;
						},
						function(newValue, oldValue, scope) {
							scope.counter++;
						}
					)
				}
			);

			scope.$digest();
			expect(scope.counter).toBe(1);
		});

		it("does dirty checking by value if special paramater is set to true", function() {
			scope.someValue = [1,2,3],
			scope.counter = 0;

			scope.$watch(
				function() { return scope.someValue },
				function(newValue, oldValue, scope) {
					scope.counter++;
				},
				true	
			);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.someValue.push(4);
			scope.$digest();
			expect(scope.counter).toBe(2);  

		});	

		it("correctly handles NaN", function() {
			scope.number = 0/0;
			scope.counter = 0;

			scope.$watch(
				function() {
					return scope.number;
				},
				function(newValue, oldValue, scope) {
					scope.counter++;
				}
			);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.$digest();
			expect(scope.counter).toBe(1);
		});

	});

	describe("$eval", function() {
		
		var scope;

		beforeEach(function() {
			scope = new Scope();
		});

		it("executes function in context of scope and returns results", function() {
			scope.someValue = 1

			var result = scope.$eval(function(scope) {
				return scope.someValue;
			});

			expect(result).toBe(1);
		});

		it("passes second $eval argument straight through", function() {
			scope.someValue = 1;

			var result = scope.$eval(function(scope, arg) {
				return scope.someValue + arg;
			}, 2);

			expect(result).toBe(3);
		});

	});

	describe('$evalAsync', function() {

		var scope;

		beforeEach(function() {
			scope = new Scope();
		});

		it('executes $evalAsync function later in the same $digest cycle', function() {
			scope.someValue = [1,2,3];
			scope.asyncedCalled = false;
			scope.asyncedCalledImmediately = false;

			scope.$watch(function() {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.$evalAsync(function(scope) {
					scope.asyncedCalled = true;
				});
				scope.asyncedCalledImmediately = scope.asyncedCalled;	
			});

			scope.$digest();
			expect(scope.asyncedCalled).toBe(true);
			expect(scope.asyncedCalledImmediately).toBe(false);

		});

		it('has a $$phase field whose value is the current digest phrase', function() {
			scope.aValue = [1,2,3];
			scope.phaseInWatchFunction = undefined;
			scope.phaseInListenerFunction = undefined;
			scope.phaseInApplyFunction = undefined;

			scope.$watch(function(scope) {
				scope.phaseInWatchFunction = scope.$$phase;
				return scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.phaseInListenerFunction = scope.$$phase;
			});

			scope.$apply(function() {
				scope.phaseInApplyFunction = scope.$$phase;
			});

			expect(scope.phaseInWatchFunction).toBe('$digest');
			expect(scope.phaseInListenerFunction).toBe('$digest');
			expect(scope.phaseInApplyFunction).toBe('$apply');

		});

		it('schedules the digest in $evalAsync', function(done) {
			scope.someValue = 1;
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			});

			scope.$evalAsync(function(scope) {});

			expect(scope.counter).toEqual(0);
			setTimeout(function() {
				expect(scope.counter).toEqual(1);
				done();
			}, 50);

		});

	});

	describe("$apply", function() {

		var scope;

		beforeEach(function() {
			scope = new Scope();
		});
		
		it("executes $apply'ed function in context of scope and runs digest", function() {
			scope.someValue = 1;
			scope.counter = 0;

			scope.$watch(
				function(scope) {
					return scope.someValue;
				},
				function(newValue, oldValue, scope) {
					scope.counter++;
				}
			);

			scope.$digest();
			expect(scope.counter).toBe(1);

			scope.$apply(function(scope) {
				scope.someValue = 2;
			});	

			expect(scope.counter).toBe(2);
		});

	});

});