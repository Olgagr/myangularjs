/* jshint globalstrict: true */
"use strict";

function initWatchValue() {}

function Scope () {
	this.$$watchers = [];
}

Scope.prototype = {
	$watch: function(watchFn, listenerFn) {
		var watcher = {
			watchFn: watchFn,
			listenerFn: listenerFn || function() {},
			last: initWatchValue	
		};
		this.$$watchers.push(watcher);
	},
	$$digestOnce: function() {
		var self = this,
				newValue, 
				oldValue,
				dirty;

		_.forEach(this.$$watchers, function(watcher) {
			newValue = watcher.watchFn(self);
			oldValue = watcher.last;
			if(newValue != oldValue) {
				watcher.last = newValue;
				oldValue = (oldValue === initWatchValue ? newValue : oldValue);
				watcher.listenerFn(newValue, oldValue, self);
				dirty = true;
			}
		});
		return dirty;
	},
	$digest: function() {
		var ttl = 10, 
				dirty;
		do {
			dirty = this.$$digestOnce();
			if(dirty && !(ttl--)){
				throw '!) digest itereations reached!';
			}
		} while (dirty);
	}
};