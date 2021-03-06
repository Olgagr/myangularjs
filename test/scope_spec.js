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

		it('catches exceptions in watch function and continues', function() {
			scope.someValue = 1;
			scope.counter = 0;

			scope.$watch(function(scope) {
				throw 'Error';
			}, function() {})

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter++;
			});

			scope.$digest();
			expect(scope.counter).toEqual(1);

		});

		it('catches exceptions in listener function and continues', function() {
			scope.someValue = 1;
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function() {
				throw 'Error';
			});

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter++;
			});

			scope.$digest();
			expect(scope.counter).toEqual(1);
		});

		it('allows removing watchers', function() {
			scope.someValue = 1;
			scope.counter = 0;

			var removeWatcher = scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			});

			scope.$digest()
			expect(scope.counter).toEqual(1);

			scope.someValue = 2;
			scope.$digest();
			expect(scope.counter).toEqual(2);

			removeWatcher();
			scope.someValue = 3;
			scope.$digest();
			expect(scope.counter).toEqual(2);
		});

		it('allows removing watchers during digest', function() {
			scope.someValue = 0;
			var calledWatchers = [];

			scope.$watch(function(scope) {
				calledWatchers.push('first');
				return scope.someValue;
			});

			var removeWatcher = scope.$watch(function(scope) {
				calledWatchers.push('second');
				removeWatcher();
			});

			scope.$watch(function(scope) {
				calledWatchers.push('third');
				return scope.someValue;
			});

			scope.$digest();
			expect(calledWatchers).toEqual(['first', 'second', 'third', 'first', 'third']);

		});

		it('allows $watch to remove other during digest', function() {
			scope.someValue = 1;
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				removeWatcher();
			});

			var removeWatcher = scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {});

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue,oldValue, scope) {
				scope.counter += 1;
			});	

			scope.$digest();
			expect(scope.counter).toEqual(1);

		});

		it('allows removing several watchers during digest', function() {
			scope.someValue = 1;
			scope.counter = 0;

			var removeWatcher1 = scope.$watch(function(scope) {
				removeWatcher1();
				removeWatcher2();
			});

			var removeWatcher2 = scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			});

			scope.$digest();
			expect(scope.counter).toEqual(0);
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

		it('catches exceptions in $evalAsync', function(done) {
			scope.someValue = 1;
			scope.counter = 0;

			scope.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter++;
			});

			scope.$evalAsync(function(scope) {
				throw 'Error';
			});

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

	describe('inheritance', function() {

		var parent;

		beforeEach(function() {
			parent = new Scope();
		})

		it('inherits properties from the parent', function() {
			parent.someValue = 1;

			var child = parent.$new();
			expect(child.someValue).toEqual(1);
		});

		it('does not share properties with parent', function() {
			var child = parent.$new();

			child.someValue = 1;
			expect(parent.someValue).toBeUndefined();
		});

		it('can change parent properties', function() {
			var child = parent.$new();

			parent.someValue = [1,2,3];
			child.someValue.push(4);

			expect(parent.someValue).toEqual([1,2,3,4]);
		});

		it('watches properties in the parent', function() {
			var child = parent.$new();
			var counter = 0;

			parent.someValue = [1,2,3];

			child.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				counter += 1;
			}, true);

			child.$digest();
			expect(counter).toEqual(1);

			parent.someValue.push(4);
			child.$digest();
			expect(counter).toEqual(2);

		});

		it('shadows parent\'s primitive properties', function() {
			var child = parent.$new();
			parent.someValue = 1;
			child.someValue = 2;

			expect(parent.someValue).toEqual(1);
			expect(child.someValue).toEqual(2);

		});

		it('does not shadow parent\'s property if this is an object', function() {
			var child = parent.$new();
			parent.someValue = { number: 1 };
			child.someValue.number = 2;

			expect(parent.someValue.number).toEqual(2);
			expect(child.someValue.number).toEqual(2);
		});

		it('does not digests its ancestors', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.aValue = 1;
			parent.$watch(function(scope) {
				scope.aValue;
			}, function(newValue, oldValue, scope) {
				scope.aValue = 2;
			});

			child.$digest();
			expect(parent.aValue).toBe(1);
		});

		it('keeps track of its children', function() {
			var parent = new Scope();
			var child_1 = parent.$new();
			var child_2 = parent.$new();
			var child_1_2 = child_1.$new();

			expect(parent.$$children.length).toEqual(2);
			expect(parent.$$children[0]).toBe(child_1);
			expect(parent.$$children[1]).toBe(child_2);

			expect(child_1.$$children.length).toEqual(1);
			expect(child_1.$$children[0]).toBe(child_1_2); 
		});

		it('digests its children', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.someValue = 1;
			child.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.someValue = 2;
			});

			parent.$digest();
			expect(child.someValue).toEqual(2);
		});

		it('digests the parent when call $apply', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.someValue = 1;
			parent.counter = 0;

			parent.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			});

			child.$apply(function(scope) {});
			expect(parent.counter).toEqual(1);
		});

		it('digests from the root in $evalAsync', function() {
			var parent = new Scope();
			var child = parent.$new();

			parent.someValue = 1;
			parent.counter = 0;

			parent.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			});

			child.$evalAsync(function(scope) {});

			setTimeout(function() {
				expect(parent.counter).toEqual(1);
				done();
			}, 50);
		});

		it('does not have access to parent attributes when isolated', function() {
			var parent = new Scope();
			var child = parent.$new(true);

			parent.someValue = 1;
			expect(child.someValue).toBeUndefined();
		});

		it('cannot watch parent attributes when isolated', function() {
			var parent = new Scope();
			var child = parent.$new(true);

			parent.someValue = 1;
			child.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.someValue = newValue;
			});

			child.$digest();
			expect(child.someValue).toBeUndefined();
		});

		it('digests its isolated children', function() {
			var parent = new Scope();
			var child = parent.$new(true);

			child.someValue = 1;
			child.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.someValue = 2;
			});

			parent.$digest();
			expect(child.someValue).toEqual(2);
		});

		it('digests from root in $apply when isolated', function() {
			var parent = new Scope();
			var child = parent.$new(true);
			var child_2 = child.$new();

			parent.someValue = 1;
			parent.counter = 0;

			parent.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			}); 

			child_2.$apply(function(scope) {});

			expect(parent.counter).toEqual(1);
		});

		it('digests from root in $evalAsync when isolated', function() {
			var parent = new Scope();
			var child = parent.$new(true);
			var child_2 = child.$new();

			parent.someValue = 1;
			parent.counter = 0;

			parent.$watch(function(scope) {
				return scope.someValue;
			}, function(newValue, oldValue, scope) {
				scope.counter += 1;
			}); 

			child_2.$evalAsync(function(scope) {});

			setTimeout(function() {
				expect(parent.counter).toEqual(1);
				done();
			}, 50);
		});

	});

	describe('Events', function(){

		var parent, scope, child, isolatedChild;

		beforeEach(function() {
			parent = new Scope();
			scope = parent.$new();
			child = scope.$new();
			isolatedChild = scope.$new(true);
		});

		it('allows registering listeners for particular events', function() {
			var listener_1 = function() {};
			var listener_2 = function() {};
			var listener_3 = function() {};

			scope.$on('event1', listener_1);
			scope.$on('event1', listener_2);
			scope.$on('event2', listener_3);

			expect(scope.$$listeners).toEqual({
				event1: [listener_1, listener_2],
				event2: [listener_3]
			});
		});

		it('has separated $$listeners from it children and parent', function() {
			var listener_1 = function() {};
			var listener_2 = function() {};
			var listener_3 = function() {};

			scope.$on('event', listener_1);
			child.$on('event', listener_2);
			isolatedChild.$on('event', listener_3);

			expect(scope.$$listeners.event).toEqual([listener_1]);
			expect(child.$$listeners.event).toEqual([listener_2]);
			expect(isolatedChild.$$listeners.event).toEqual([listener_3]);
		});

		_.each(['$emit', '$broadcast'], function(method) {

			describe('when event was ' + method, function() {

				it('calls listeners registered for given event', function() {
					var listener_1 = jasmine.createSpy();
					var listener_2 = jasmine.createSpy();

					scope.$on('event1', listener_1);
					scope.$on('event2', listener_2);

					scope[method]('event1');
					expect(listener_1).toHaveBeenCalled();
					expect(listener_2).not.toHaveBeenCalled();
				});

				it('passes an event object with a name to listener', function() {
					var listener = jasmine.createSpy();
					scope.$on('event', listener);

					scope[method]('event');
					expect(listener).toHaveBeenCalled();
					expect(listener.calls.mostRecent().args[0].name).toEqual('event');
				});

				it('passes the same object to each listener', function() {
					var listener_1 = jasmine.createSpy();
					var listener_2 = jasmine.createSpy();
					
					scope.$on('event', listener_1);
					scope.$on('event', listener_2);

					scope[method]('event');
					var event_1 = listener_1.calls.mostRecent().args[0];
					var event_2 = listener_2.calls.mostRecent().args[0];

					expect(event_1).toBe(event_2);
				});

				it('passes additional arguments to listener', function() {
					var listener = jasmine.createSpy();
					scope.$on('event', listener);

					scope[method]('event', 'and', ['some', 'arguments'], '!');

					expect(listener.calls.mostRecent().args[1]).toEqual('and');
					expect(listener.calls.mostRecent().args[2]).toEqual(['some', 'arguments']);
					expect(listener.calls.mostRecent().args[3]).toEqual('!');
				});

				it('returns event object', function() {
					var obj = scope[method]('event');

					expect(obj).toBeDefined();
					expect(obj.name).toEqual('event');
				});

				it('can be deregistered', function() {
					var listener = jasmine.createSpy();
					var deregister = scope.$on('event', listener);

					deregister();
					scope[method]('event');

					expect(listener).not.toHaveBeenCalled();

				});

				it('sets defaultPrevented when defaultPrevent was called', function() {
					var listener = function(event) {
						event.defaultPrevent();
					};

					scope.$on('event', listener);
					var event = scope[method]('event');
					expect(event.defaultPrevented).toBe(true);
				});

			});

		});

		it('propagates up the scope hierarchy on $emit', function() {
			var parentListener = jasmine.createSpy();
			var childListener = jasmine.createSpy();

			parent.$on('event', parentListener);
			scope.$on('event', childListener);

			scope.$emit('event');

			expect(parentListener).toHaveBeenCalled();
			expect(childListener).toHaveBeenCalled();
		});

		it('propagates down the scope hierarchy on $broadcast', function() {
			var parentListener = jasmine.createSpy();
			var childListener = jasmine.createSpy();

			parent.$on('event', parentListener);
			scope.$on('event', childListener);

			parent.$broadcast('event');

			expect(parentListener).toHaveBeenCalled();
			expect(childListener).toHaveBeenCalled();
		});

		it('contains the scope the event was originated in target scope on $emit', function() {
			var parentListener = jasmine.createSpy();
			var childListener = jasmine.createSpy();

			parent.$on('event', parentListener);
			scope.$on('event', childListener);

			scope.$emit('event');
			
			expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
			expect(childListener.calls.mostRecent().args[0].targetScope).toBe(scope);	
		});

		it('contains the scope the event was originated in target scope on $broadcast', function() {
			var parentListener = jasmine.createSpy();
			var childListener = jasmine.createSpy();

			scope.$on('event', parentListener);
			child.$on('event', childListener);

			scope.$broadcast('event');
			
			expect(parentListener.calls.mostRecent().args[0].targetScope).toBe(scope);
			expect(childListener.calls.mostRecent().args[0].targetScope).toBe(scope);	
		});

		it('attaches currentScope on $emit', function() {
			var currentScopeOnParent, currentScopeOnChild;

			var parentListener = function(event) {
				currentScopeOnParent = event.currentScope;
			};

			var childListener = function(event) {
				currentScopeOnChild = event.currentScope;
			};

			parent.$on('event', parentListener);
			scope.$on('event', childListener);

			scope.$emit('event');

			expect(currentScopeOnParent).toBe(parent);
			expect(currentScopeOnChild).toBe(scope);
		});

		it('attaches currentScope on $broadcast', function() {
			var currentScopeOnParent, currentScopeOnChild;

			var parentListener = function(event) {
				currentScopeOnParent = event.currentScope;
			};

			var childListener = function(event) {
				currentScopeOnChild = event.currentScope;
			};

			parent.$on('event', parentListener);
			scope.$on('event', childListener);

			parent.$broadcast('event');

			expect(currentScopeOnParent).toBe(parent);
			expect(currentScopeOnChild).toBe(scope);
		});		

		it('stops event propagation on $emit', function() {

			var childListener = function(event) {
				event.stopPropagation();
			};

			var parentListener = jasmine.createSpy();

			scope.$on('event', childListener);
			parent.$on('event', parentListener);

			scope.$emit('event');

			expect(parentListener).not.toHaveBeenCalled();
		});

		it('propagates $destoy when distroyed', function() {
			var listener = jasmine.createSpy();
			var childListener = jasmine.createSpy();

			scope.$on('$distroy', listener);
			child.$on('$distroy', childListener);

			scope.$distroy();

			expect(listener).toHaveBeenCalled();
			expect(childListener).toHaveBeenCalled();
		});


	});

});