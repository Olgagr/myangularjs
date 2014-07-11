/* jshint globalstrict: true */
"use strict";

function initWatchValue() {}

function Scope () {
	this.$$watchers = [];
	this.$$lastDirtyWatch = null;
}

Scope.prototype = {
	$$areEqual: function(newValue, oldValue, valueCheck) {
		if(valueCheck) {
			return _.isEqual(newValue, oldValue);
		} else {
			return newValue === oldValue;
		}
	},
	$watch: function(watchFn, listenerFn, valueCheck) {
		var watcher = {
			watchFn: watchFn,
			listenerFn: listenerFn || function() {},
			valueCheck: !!valueCheck,
			last: initWatchValue	
		};
		this.$$watchers.push(watcher);
		this.$$lastDirtyWatch = null;
	},
	$$digestOnce: function() {
		var self = this,
				newValue, 
				oldValue,
				dirty;

		_.forEach(this.$$watchers, function(watcher) {
			newValue = watcher.watchFn(self);
			oldValue = watcher.last;

			if(!self.$$areEqual(newValue, oldValue, watcher.valueCheck)) {
				self.$$lastDirtyWatch = watcher;
				watcher.last = (watcher.valueCheck ? _.cloneDeep(newValue) : newValue);
				oldValue = (oldValue === initWatchValue ? newValue : oldValue);
				watcher.listenerFn(newValue, oldValue, self);
				dirty = true;
			} else if(self.$$lastDirtyWatch === watcher) {
				return false;
			}
		});
		return dirty;
	},
	$digest: function() {
		var ttl = 10, 
				dirty;
		this.$$lastDirtyWatch = null;			
		do {
			dirty = this.$$digestOnce();
			if(dirty && !(ttl--)){
				throw '!) digest itereations reached!';
			}
		} while (dirty);
	}
};