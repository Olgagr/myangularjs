/* jshint globalstrict: true */
"use strict";

function initWatchValue() {}

function Scope () {
	this.$$watchers = [];
	this.$$lastDirtyWatch = null;
	this.$$asyncQueue = [];
	this.$$phase = null;
	this.$$children = [];
	this.$$root = this;
	this.$$listeners = {};
}

Scope.prototype = {
	$beginPhase: function(phase) {
		if(this.$$phase) {
			throw this.$$phase + ' already in progress';
		} else {
			this.$$phase = phase;
		}
	},
	$clearPhase: function() {
		this.$$phase = null;
	},
	$eval: function(expr, locals) {
		return expr(this, locals);
	},
	$evalAsync: function(expr) {
		var self = this;
		if(!self.$$phase && !self.$$asyncQueue.length) {
			setTimeout(function() {
				if(self.$$asyncQueue.length) {
					self.$$root.$digest();
				}
			},0);
		}
		this.$$asyncQueue.push({ scope: this, expr: expr });
	},
	$apply: function(expr) {
		try {
			this.$beginPhase('$apply');
			return this.$eval(expr);
		} finally {
			this.$clearPhase();
			this.$$root.$digest();
		}
	},
	$$areEqual: function(newValue, oldValue, valueCheck) {
		if(valueCheck) {
			return _.isEqual(newValue, oldValue);
		} else {
			return newValue === oldValue || (typeof newValue === 'number' && typeof oldValue === 'number' && isNaN(newValue) && isNaN(oldValue));
		}
	},
	$watch: function(watchFn, listenerFn, valueCheck) {
		var self = this;
		var watcher = {
			watchFn: watchFn,
			listenerFn: listenerFn || function() {},
			valueCheck: !!valueCheck,
			last: initWatchValue	
		};
		this.$$watchers.unshift(watcher);
		this.$$root.$$lastDirtyWatch = null;
		return function() {
			var index = self.$$watchers.indexOf(watcher);
			if(index >= 0) self.$$watchers.splice(index, 1);
			self.$$root.$$lastDirtyWatch = null;
		};
	},
	$$digestOnce: function() {
		var self = this,
				dirty, 
				continueLoop = true;

		this.$$everyScope(function(scope) {
			var newValue, oldValue;
			_.forEachRight(scope.$$watchers, function(watcher) {
				if(watcher) {
					try {
						newValue = watcher.watchFn(scope);
						oldValue = watcher.last;

						if(!scope.$$areEqual(newValue, oldValue, watcher.valueCheck)) {
							self.$$root.$$lastDirtyWatch = watcher;
							watcher.last = (watcher.valueCheck ? _.cloneDeep(newValue) : newValue);
							oldValue = (oldValue === initWatchValue ? newValue : oldValue);
							watcher.listenerFn(newValue, oldValue, scope);
							dirty = true;
						} else if(self.$$root.$$lastDirtyWatch === watcher) {
							continueLoop = false;
							return false;
						}
					} catch(e) {
						console.error(e);
					}
				}
			});
			return continueLoop;
		});
		return dirty;
	},
	$digest: function() {
		var ttl = 10, 
				dirty;
		this.$$root.$$lastDirtyWatch = null;		
		this.$beginPhase('$digest');	
		do {
			while(this.$$asyncQueue.length) {
				try {
					var asyncTask = this.$$asyncQueue.shift();
					asyncTask.scope.$eval(asyncTask.expr);
				} catch(e) {
					console.error(e);
				}
			}
			dirty = this.$$digestOnce();
			if((dirty || this.$$asyncQueue.length) && !(ttl--)){
				throw '!) digest itereations reached!';
			}
		} while (dirty || this.$$asyncQueue.length);
		this.$clearPhase();
	},
	$new: function(isIsolated) {
		var child; 
		if(isIsolated) {
			child = new Scope();
			child.$$root = this.$$root;
			child.$$asyncQueue = this.$$asyncQueue;
		} else {
			child = Object.create(this); 
		}
		this.$$children.push(child);
		child.$$watchers = [];
		child.$$children = [];
		child.$$listeners = {};
		return child;
	},
	$$everyScope: function(fn) {
		if (fn(this)) {
			return this.$$children.every(function(child) {
				return child.$$everyScope(fn);
			});
		} else {
			return false;
		}
	},
	$on: function(eventName, callback) {
		this.$$listeners[eventName] = this.$$listeners[eventName] || [];
		this.$$listeners[eventName].push(callback); 
	},
	$$fireEvent: function(eventName) {
		var eventObject = {
			name: eventName
		};
		_.each(this.$$listeners[eventName] || [], function(callback) {
			callback(eventObject);
		});
	},
	$emit: function(eventName) {
		this.$$fireEvent(eventName);
	},
	$broadcast: function(eventName) {
		this.$$fireEvent(eventName);
	} 







};