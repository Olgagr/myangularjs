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
			listenerFn: listenerFn,
			last: initWatchValue	
		};
		this.$$watchers.push(watcher);
	},
	$digest: function() {
		var self = this,
				newValue, 
				oldValue;

		_.forEach(this.$$watchers, function(watcher) {
			newValue = watcher.watchFn(self);
			oldValue = watcher.last;
			if(newValue != oldValue) {
				watcher.last = newValue;
				oldValue = (oldValue === initWatchValue ? newValue : oldValue);
				watcher.listenerFn(newValue, oldValue, self);
			}
		});
	}
};