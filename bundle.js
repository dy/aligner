require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"aligner":[function(require,module,exports){
var m = require('mumath');
var margins = require('mucss/margin');
var paddings = require('mucss/padding');
var offsets = require('mucss/offset');
var borders = require('mucss/border');
var css = require('mucss/css');

/**
 * @module
 */
module.exports = align;
module.exports.numerify = numerify;


var doc = document, win = window, root = doc.documentElement;



/**
 * Align set of elements by the side
 *
 * @param {NodeList|Array} els A list of elements
 * @param {string|number|Array} alignment Alignment param
 * @param {Element|Rectangle} relativeTo An area or element to calc off
 */
function align(els, alignment, relativeTo){
	if (!els || els.length < 2) throw Error('At least one element should be passed');

	//default alignment is left
	if (!alignment) alignment = 0;

	//default key element is the first one
	if (!relativeTo) relativeTo = els[0];


	//figure out x/y
	var xAlign, yAlign;
	if (alignment instanceof Array) {
		xAlign = numerify(alignment[0]);
		yAlign = numerify(alignment[1]);
	}
	//catch y values
	else if (/top|middle|bottom/.test(alignment)) {
		yAlign = numerify(alignment);
	}
	else {
		xAlign = numerify(alignment);
	}


	//apply alignment
	var toRect = offsets(relativeTo);
	for (var i = els.length, el, s; i--;){
		el = els[i];

		//ignore self
		if (el === relativeTo) continue;

		s = getComputedStyle(el);

		//ensure element is at least relative, if it is static
		if (s.position === 'static') css(el, 'position', 'relative');


		//include margins
		var placeeMargins = margins(el);

		//get relativeTo & parent rectangles
		var parent = el.offsetParent || win;
		var parentRect = offsets(parent);
		var parentPaddings = paddings(parent);
		var parentBorders = borders(parent);

		//correct parentRect
		if (parent === doc.body || parent === root && getComputedStyle(parent).position === 'static') {
			parentRect.left = 0;
			parentRect.top = 0;
		}
		parentRect = m.sub(parentRect, parentBorders);
		parentRect = m.add(parentRect, placeeMargins);
		parentRect = m.add(parentRect, parentPaddings);


		alignX(els[i], toRect, parentRect, xAlign);
		alignY(els[i], toRect, parentRect, yAlign);
	}
}




/**
 * Place horizontally
 */
function alignX ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute left
	var desirableLeft = placerRect.left + placerRect.width*align - placee.offsetWidth*align - parentRect.left;

	css(placee, {
		left: desirableLeft,
		right: 'auto'
	});
}


/**
 * Place vertically
 */
function alignY ( placee, placerRect, parentRect, align ){
	if (typeof align !== 'number') return;

	//desirable absolute top
	var desirableTop = placerRect.top + placerRect.height*align - placee.offsetHeight*align - parentRect.top;

	css(placee, {
		top: desirableTop,
		bottom: 'auto'
	});
}



/**
 * @param {string|number} value Convert any value passed to float 0..1
 */
function numerify(value){
	if (typeof value === 'string') {
		//else parse single-value
		switch (value) {
			case 'left':
			case 'top':
				return 0;
			case 'right':
			case 'bottom':
				return 1;
			case 'center':
			case 'middle':
				return 0.5;
		}
		return parseFloat(value);
	}

	return value;
}
},{"mucss/border":2,"mucss/css":3,"mucss/margin":7,"mucss/offset":8,"mucss/padding":9,"mumath":22}],1:[function(require,module,exports){
/**
 * Simple rect constructor.
 * It is just faster and smaller than constructing an object.
 *
 * @module mucss/Rect
 *
 * @param {number} l left
 * @param {number} t top
 * @param {number} r right
 * @param {number} b bottom
 * @param {number}? w width
 * @param {number}? h height
 *
 * @return {Rect} A rectangle object
 */
module.exports = function Rect (l,t,r,b,w,h) {
	this.top=t||0;
	this.bottom=b||0;
	this.left=l||0;
	this.right=r||0;
	if (w!==undefined) this.width=w||this.right-this.left;
	if (h!==undefined) this.height=h||this.bottom-this.top;
};
},{}],2:[function(require,module,exports){
/**
 * Parse element’s borders
 *
 * @module mucss/borders
 */

var Rect = require('./Rect');
var parse = require('./parse-value');

/**
 * Return border widths of an element
 */
module.exports = function(el){
	if (el === window) return new Rect;

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return new Rect(
		parse(style.borderLeftWidth),
		parse(style.borderTopWidth),
		parse(style.borderRightWidth),
		parse(style.borderBottomWidth)
	);
};
},{"./Rect":1,"./parse-value":10}],3:[function(require,module,exports){
/**
 * Get or set element’s style, prefix-agnostic.
 *
 * @module  mucss/css
 */
var fakeStyle = require('./fake-element').style;
var prefix = require('./prefix').lowercase;


/**
 * Apply styles to an element.
 *
 * @param    {Element}   el   An element to apply styles.
 * @param    {Object|string}   obj   Set of style rules or string to get style rule.
 */
module.exports = function(el, obj){
	if (!el || !obj) return;

	var name, value;

	//return value, if string passed
	if (typeof obj === 'string') {
		name = obj;

		//return value, if no value passed
		if (arguments.length < 3) {
			return el.style[prefixize(name)];
		}

		//set style, if value passed
		value = arguments[2] || '';
		obj = {};
		obj[name] = value;
	}

	for (name in obj){
		//convert numbers to px
		if (typeof obj[name] === 'number' && /left|right|bottom|top|width|height/i.test(name)) obj[name] += 'px';

		value = obj[name] || '';

		el.style[prefixize(name)] = value;
	}
};


/**
 * Return prefixized prop name, if needed.
 *
 * @param    {string}   name   A property name.
 * @return   {string}   Prefixed property name.
 */
function prefixize(name){
	var uName = name[0].toUpperCase() + name.slice(1);
	if (fakeStyle[name] !== undefined) return name;
	if (fakeStyle[prefix + uName] !== undefined) return prefix + uName;
	return '';
}

},{"./fake-element":4,"./prefix":11}],4:[function(require,module,exports){
/** Just a fake element to test styles
 * @module mucss/fake-element
 */

module.exports = document.createElement('div');
},{}],5:[function(require,module,exports){
/**
 * Window scrollbar detector.
 *
 * @module mucss/has-scroll
 */
exports.x = function () {
	return window.innerHeight > document.documentElement.clientHeight;
};
exports.y = function () {
	return window.innerWidth > document.documentElement.clientWidth;
};
},{}],6:[function(require,module,exports){
/**
 * Detect whether element is placed to fixed container or is fixed itself.
 *
 * @module mucss/is-fixed
 *
 * @param {(Element|Object)} el Element to detect fixedness.
 *
 * @return {boolean} Whether element is nested.
 */
module.exports = function (el) {
	var parentEl = el;

	//window is fixed, btw
	if (el === window) return true;

	//unlike the doc
	if (el === document) return false;

	while (parentEl) {
		if (getComputedStyle(parentEl).position === 'fixed') return true;
		parentEl = parentEl.offsetParent;
	}
	return false;
};
},{}],7:[function(require,module,exports){
/**
 * Get margins of an element.
 * @module mucss/margins
 */

var parse = require('./parse-value');
var Rect = require('./Rect');

/**
 * Return margins of an element.
 *
 * @param    {Element}   el   An element which to calc margins.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function(el){
	if (el === window) return new Rect();

	if (!(el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle(el);

	return new Rect(
		parse(style.marginLeft),
		parse(style.marginTop),
		parse(style.marginRight),
		parse(style.marginBottom)
	);
};

},{"./Rect":1,"./parse-value":10}],8:[function(require,module,exports){
/**
 * Calculate absolute offsets of an element, relative to the document.
 *
 * @module mucss/offsets
 *
 */
var win = window;
var doc = document;
var Rect = require('./Rect');
var hasScroll = require('./has-scroll');
var scrollbar = require('./scrollbar');
var isFixedEl = require('./is-fixed');
var getTranslate = require('./translate');


/**
 * Return absolute offsets of any target passed
 *
 * @param    {Element|window}   el   A target. Pass window to calculate viewport offsets
 * @return   {Object}   Offsets object with trbl.
 */
module.exports = offsets;

function offsets (el) {
	if (!el) throw Error('Bad argument');

	//calc client rect
	var cRect, result;

	//return vp offsets
	if (el === win) {
		result = new Rect(
			win.pageXOffset,
			win.pageYOffset
		);

		result.width = win.innerWidth - (hasScroll.y() ? scrollbar : 0),
		result.height = win.innerHeight - (hasScroll.x() ? scrollbar : 0)
		result.right = result.left + result.width;
		result.bottom = result.top + result.height;

		return result;
	}

	//return absolute offsets if document requested
	else if (el === doc) {
		var res = offsets(doc.documentElement);
		res.bottom = Math.max(window.innerHeight, res.bottom);
		res.right = Math.max(window.innerWidth, res.right);
		if (hasScroll.y(doc.documentElement)) res.right -= scrollbar;
		if (hasScroll.x(doc.documentElement)) res.bottom -= scrollbar;
		return res;
	}

	//FIXME: why not every element has getBoundingClientRect method?
	try {
		cRect = el.getBoundingClientRect();
	} catch (e) {
		cRect = new Rect(
			el.clientLeft,
			el.clientTop
		);
	}

	//whether element is or is in fixed
	var isFixed = isFixedEl(el);
	var xOffset = isFixed ? 0 : win.pageXOffset;
	var yOffset = isFixed ? 0 : win.pageYOffset;

	result = new Rect(
		cRect.left + xOffset,
		cRect.top + yOffset,
		cRect.left + xOffset + el.offsetWidth,
		cRect.top + yOffset + el.offsetHeight,
		el.offsetWidth,
		el.offsetHeight
	);

	return result;
};
},{"./Rect":1,"./has-scroll":5,"./is-fixed":6,"./scrollbar":12,"./translate":13}],9:[function(require,module,exports){
/**
 * Caclulate paddings of an element.
 * @module  mucss/paddings
 */


var Rect = require('./Rect');
var parse = require('./parse-value');


/**
 * Return paddings of an element.
 *
 * @param    {Element}   $el   An element to calc paddings.
 * @return   {Object}   Paddings object `{top:n, bottom:n, left:n, right:n}`.
 */
module.exports = function($el){
	if ($el === window) return new Rect();

	if (!($el instanceof Element)) throw Error('Argument is not an element');

	var style = window.getComputedStyle($el);

	return new Rect(
		parse(style.paddingLeft),
		parse(style.paddingTop),
		parse(style.paddingRight),
		parse(style.paddingBottom)
	);
};
},{"./Rect":1,"./parse-value":10}],10:[function(require,module,exports){
/**
 * Returns parsed css value.
 *
 * @module mucss/parse-value
 *
 * @param {string} str A string containing css units value
 *
 * @return {number} Parsed number value
 */
module.exports = function (str){
	str += '';
	return parseFloat(str.slice(0,-2)) || 0;
};

//FIXME: add parsing units
},{}],11:[function(require,module,exports){
/**
 * Vendor prefixes
 * Method of http://davidwalsh.name/vendor-prefix
 * @module mucss/prefix
 */

var styles = getComputedStyle(document.documentElement, '');

var pre = (Array.prototype.slice.call(styles)
	.join('')
	.match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
)[1];

dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1];

module.exports = {
	dom: dom,
	lowercase: pre,
	css: '-' + pre + '-',
	js: pre[0].toUpperCase() + pre.substr(1)
};
},{}],12:[function(require,module,exports){
/**
 * Calculate scrollbar width.
 *
 * @module mucss/scrollbar
 */

// Create the measurement node
var scrollDiv = document.createElement("div");

var style = scrollDiv.style;

style.width = '100px';
style.height = '100px';
style.overflow = 'scroll';
style.position = 'absolute';
style.top = '-9999px';

document.documentElement.appendChild(scrollDiv);

// the scrollbar width
module.exports = scrollDiv.offsetWidth - scrollDiv.clientWidth;

// Delete fake DIV
document.documentElement.removeChild(scrollDiv);
},{}],13:[function(require,module,exports){
/**
 * Parse translate3d
 *
 * @module mucss/translate
 */

var css = require('./css');
var parseValue = require('./parse-value');

module.exports = function (el) {
	var translateStr = css(el, 'transform');

	//find translate token, retrieve comma-enclosed values
	//translate3d(1px, 2px, 2) → 1px, 2px, 2
	//FIXME: handle nested calcs
	var match = /translate(?:3d)?\s*\(([^\)]*)\)/.exec(translateStr);

	if (!match) return [0, 0];
	var values = match[1].split(/\s*,\s*/);

	//parse values
	//FIXME: nested values are not necessarily pixels
	return values.map(function (value) {
		return parseValue(value);
	});
};
},{"./css":3,"./parse-value":10}],14:[function(require,module,exports){
/**
 * @module  mumath/add
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result += arguments[i];
	}
	return result;
});
},{"./wrap":37}],15:[function(require,module,exports){
/**
 * Clamper.
 * Detects proper clamp min/max.
 *
 * @param {number} a Current value to cut off
 * @param {number} min One side limit
 * @param {number} max Other side limit
 *
 * @return {number} Clamped value
 */

module.exports = require('./wrap')(function(a, min, max){
	return max > min ? Math.max(Math.min(a,max),min) : Math.max(Math.min(a,min),max);
});
},{"./wrap":37}],16:[function(require,module,exports){

},{}],17:[function(require,module,exports){
/**
 * @module mumath/div
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result /= arguments[i];
	}
	return result;
});
},{"./wrap":37}],18:[function(require,module,exports){
/**
 * @module mumath/eq
 */
module.exports = require('./wrap')(function (a, b) {
	return a === b;
});
},{"./wrap":37}],19:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],20:[function(require,module,exports){
/**
 * @module mumath/gt
 */
module.exports = require('./wrap')(function (a, b) {
	return a > b;
});
},{"./wrap":37}],21:[function(require,module,exports){
/**
 * @module mumath/gte
 */
module.exports = require('./wrap')(function (a, b) {
	return a >= b;
});
},{"./wrap":37}],22:[function(require,module,exports){
/**
 * Composed set of all math utils
 *
 * @module  mumath
 */
module.exports = {
	between: require('./between'),
	isBetween: require('./is-between'),
	round: require('./round'),
	precision: require('./precision'),
	loop: require('./loop'),
	add: require('./add'),
	sub: require('./sub'),
	min: require('./min'),
	max: require('./max'),
	div: require('./div'),
	lg: require('./lg'),
	log: require('./log'),
	mult: require('./mult'),
	mod: require('./mod'),
	floor: require('./floor'),
	ceil: require('./ceil'),

	gt: require('./gt'),
	gte: require('./gte'),
	lt: require('./lt'),
	lte: require('./lte'),
	eq: require('./eq'),
	ne: require('./ne'),
};
},{"./add":14,"./between":15,"./ceil":16,"./div":17,"./eq":18,"./floor":19,"./gt":20,"./gte":21,"./is-between":23,"./lg":24,"./log":25,"./loop":26,"./lt":27,"./lte":28,"./max":29,"./min":30,"./mod":31,"./mult":32,"./ne":33,"./precision":34,"./round":35,"./sub":36}],23:[function(require,module,exports){
/**
 * Whether element is between left & right including
 *
 * @param {number} a
 * @param {number} left
 * @param {number} right
 *
 * @return {Boolean}
 */
module.exports = require('./wrap')(function(a, left, right){
	if (a <= right && a >= left) return true;
	return false;
});
},{"./wrap":37}],24:[function(require,module,exports){
/**
 * Base 10 logarithm
 *
 * @module mumath/lg
 */
module.exports = require('./wrap')(function (a) {
	return Math.log(a) / Math.log(10);
});
},{"./wrap":37}],25:[function(require,module,exports){
/**
 * Natural logarithm
 *
 * @module mumath/log
 */
module.exports = require('./wrap')(function (a) {
	return Math.log(a);
});
},{"./wrap":37}],26:[function(require,module,exports){
/**
 * @module  mumath/loop
 *
 * Looping function for any framesize
 */

module.exports = require('./wrap')(function (value, left, right) {
	//detect single-arg case, like mod-loop
	if (right === undefined) {
		right = left;
		left = 0;
	}

	//swap frame order
	if (left > right) {
		var tmp = right;
		right = left;
		left = tmp;
	}

	var frame = right - left;

	value = ((value + left) % frame) - left;
	if (value < left) value += frame;
	if (value > right) value -= frame;

	return value;
});
},{"./wrap":37}],27:[function(require,module,exports){
/**
 * @module mumath/lt
 */
module.exports = require('./wrap')(function (a, b) {
	return a < b;
});
},{"./wrap":37}],28:[function(require,module,exports){
/**
 * @module mumath/lte
 */
module.exports = require('./wrap')(function (a, b) {
	return a <= b;
});
},{"./wrap":37}],29:[function(require,module,exports){
/** @module mumath/max */
module.exports = require('./wrap')(Math.max);
},{"./wrap":37}],30:[function(require,module,exports){
/**
 * @module mumath/min
 */
module.exports = require('./wrap')(Math.min);
},{"./wrap":37}],31:[function(require,module,exports){
/**
 * @module mumath/mod
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result %= arguments[i];
	}
	return result;
});
},{"./wrap":37}],32:[function(require,module,exports){
/**
 * @module mumath/mult
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result *= arguments[i];
	}
	return result;
});
},{"./wrap":37}],33:[function(require,module,exports){
/**
 * @module mumath/ne
 */
module.exports = require('./wrap')(function (a, b) {
	return a !== b;
});
},{"./wrap":37}],34:[function(require,module,exports){
/**
 * @module  mumath/precision
 *
 * Get precision from float:
 *
 * @example
 * 1.1 → 1, 1234 → 0, .1234 → 4
 *
 * @param {number} n
 *
 * @return {number} decimap places
 */

module.exports = require('./wrap')(function(n){
	var s = n + '',
		d = s.indexOf('.') + 1;

	return !d ? 0 : s.length - d;
});
},{"./wrap":37}],35:[function(require,module,exports){
/**
 * Precision round
 *
 * @param {number} value
 * @param {number} step Minimal discrete to round
 *
 * @return {number}
 *
 * @example
 * toPrecision(213.34, 1) == 213
 * toPrecision(213.34, .1) == 213.3
 * toPrecision(213.34, 10) == 210
 */
var precision = require('./precision');

module.exports = require('./wrap')(function(value, step) {
	if (step === 0) return value;
	if (!step) return Math.round(value);
	step = parseFloat(step);
	value = Math.round(value / step) * step;
	return parseFloat(value.toFixed(precision(step)));
});
},{"./precision":34,"./wrap":37}],36:[function(require,module,exports){
/**
 * @module mumath/sub
 */
module.exports = require('./wrap')(function () {
	var result = arguments[0];
	for (var i = 1, l = arguments.length; i < l; i++) {
		result -= arguments[i];
	}
	return result;
});
},{"./wrap":37}],37:[function(require,module,exports){
/**
 * Get fn wrapped with array/object attrs recognition
 *
 * @return {Function} Target function
 */
module.exports = function(fn){
	return function(a){
		var args = arguments;
		if (a instanceof Array) {
			var result = new Array(a.length), slice;
			for (var i = 0; i < a.length; i++){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = args[j] instanceof Array ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else if (typeof a === 'object') {
			var result = {}, slice;
			for (var i in a){
				slice = [];
				for (var j = 0, l = args.length, val; j < l; j++){
					val = typeof args[j] === 'object' ? args[j][i] : args[j];
					val = val;
					slice.push(val);
				}
				result[i] = fn.apply(this, slice);
			}
			return result;
		}
		else {
			return fn.apply(this, args);
		}
	};
};
},{}]},{},[])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy93YXRjaGlmeS9ub2RlX21vZHVsZXMvYnJvd3NlcmlmeS9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiaW5kZXguanMiLCJub2RlX21vZHVsZXMvbXVjc3MvUmVjdC5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9ib3JkZXIuanMiLCJub2RlX21vZHVsZXMvbXVjc3MvY3NzLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL2Zha2UtZWxlbWVudC5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9oYXMtc2Nyb2xsLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL2lzLWZpeGVkLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL21hcmdpbi5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9vZmZzZXQuanMiLCJub2RlX21vZHVsZXMvbXVjc3MvcGFkZGluZy5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9wYXJzZS12YWx1ZS5qcyIsIm5vZGVfbW9kdWxlcy9tdWNzcy9wcmVmaXguanMiLCJub2RlX21vZHVsZXMvbXVjc3Mvc2Nyb2xsYmFyLmpzIiwibm9kZV9tb2R1bGVzL211Y3NzL3RyYW5zbGF0ZS5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvYWRkLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9iZXR3ZWVuLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9jZWlsLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9kaXYuanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL2VxLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9ndC5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvZ3RlLmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9pbmRleC5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvaXMtYmV0d2Vlbi5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvbGcuanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL2xvZy5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvbG9vcC5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvbHQuanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL2x0ZS5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvbWF4LmpzIiwibm9kZV9tb2R1bGVzL211bWF0aC9taW4uanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL21vZC5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvbXVsdC5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvbmUuanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL3ByZWNpc2lvbi5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvcm91bmQuanMiLCJub2RlX21vZHVsZXMvbXVtYXRoL3N1Yi5qcyIsIm5vZGVfbW9kdWxlcy9tdW1hdGgvd3JhcC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakpBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMURBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNwQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3ZCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBOztBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7OztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNaQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1BBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNMQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTs7QUNEQTtBQUNBO0FBQ0E7QUFDQTs7QUNIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDTEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIG0gPSByZXF1aXJlKCdtdW1hdGgnKTtcclxudmFyIG1hcmdpbnMgPSByZXF1aXJlKCdtdWNzcy9tYXJnaW4nKTtcclxudmFyIHBhZGRpbmdzID0gcmVxdWlyZSgnbXVjc3MvcGFkZGluZycpO1xyXG52YXIgb2Zmc2V0cyA9IHJlcXVpcmUoJ211Y3NzL29mZnNldCcpO1xyXG52YXIgYm9yZGVycyA9IHJlcXVpcmUoJ211Y3NzL2JvcmRlcicpO1xyXG52YXIgY3NzID0gcmVxdWlyZSgnbXVjc3MvY3NzJyk7XHJcblxyXG4vKipcclxuICogQG1vZHVsZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBhbGlnbjtcclxubW9kdWxlLmV4cG9ydHMubnVtZXJpZnkgPSBudW1lcmlmeTtcclxuXHJcblxyXG52YXIgZG9jID0gZG9jdW1lbnQsIHdpbiA9IHdpbmRvdywgcm9vdCA9IGRvYy5kb2N1bWVudEVsZW1lbnQ7XHJcblxyXG5cclxuXHJcbi8qKlxyXG4gKiBBbGlnbiBzZXQgb2YgZWxlbWVudHMgYnkgdGhlIHNpZGVcclxuICpcclxuICogQHBhcmFtIHtOb2RlTGlzdHxBcnJheX0gZWxzIEEgbGlzdCBvZiBlbGVtZW50c1xyXG4gKiBAcGFyYW0ge3N0cmluZ3xudW1iZXJ8QXJyYXl9IGFsaWdubWVudCBBbGlnbm1lbnQgcGFyYW1cclxuICogQHBhcmFtIHtFbGVtZW50fFJlY3RhbmdsZX0gcmVsYXRpdmVUbyBBbiBhcmVhIG9yIGVsZW1lbnQgdG8gY2FsYyBvZmZcclxuICovXHJcbmZ1bmN0aW9uIGFsaWduKGVscywgYWxpZ25tZW50LCByZWxhdGl2ZVRvKXtcclxuXHRpZiAoIWVscyB8fCBlbHMubGVuZ3RoIDwgMikgdGhyb3cgRXJyb3IoJ0F0IGxlYXN0IG9uZSBlbGVtZW50IHNob3VsZCBiZSBwYXNzZWQnKTtcclxuXHJcblx0Ly9kZWZhdWx0IGFsaWdubWVudCBpcyBsZWZ0XHJcblx0aWYgKCFhbGlnbm1lbnQpIGFsaWdubWVudCA9IDA7XHJcblxyXG5cdC8vZGVmYXVsdCBrZXkgZWxlbWVudCBpcyB0aGUgZmlyc3Qgb25lXHJcblx0aWYgKCFyZWxhdGl2ZVRvKSByZWxhdGl2ZVRvID0gZWxzWzBdO1xyXG5cclxuXHJcblx0Ly9maWd1cmUgb3V0IHgveVxyXG5cdHZhciB4QWxpZ24sIHlBbGlnbjtcclxuXHRpZiAoYWxpZ25tZW50IGluc3RhbmNlb2YgQXJyYXkpIHtcclxuXHRcdHhBbGlnbiA9IG51bWVyaWZ5KGFsaWdubWVudFswXSk7XHJcblx0XHR5QWxpZ24gPSBudW1lcmlmeShhbGlnbm1lbnRbMV0pO1xyXG5cdH1cclxuXHQvL2NhdGNoIHkgdmFsdWVzXHJcblx0ZWxzZSBpZiAoL3RvcHxtaWRkbGV8Ym90dG9tLy50ZXN0KGFsaWdubWVudCkpIHtcclxuXHRcdHlBbGlnbiA9IG51bWVyaWZ5KGFsaWdubWVudCk7XHJcblx0fVxyXG5cdGVsc2Uge1xyXG5cdFx0eEFsaWduID0gbnVtZXJpZnkoYWxpZ25tZW50KTtcclxuXHR9XHJcblxyXG5cclxuXHQvL2FwcGx5IGFsaWdubWVudFxyXG5cdHZhciB0b1JlY3QgPSBvZmZzZXRzKHJlbGF0aXZlVG8pO1xyXG5cdGZvciAodmFyIGkgPSBlbHMubGVuZ3RoLCBlbCwgczsgaS0tOyl7XHJcblx0XHRlbCA9IGVsc1tpXTtcclxuXHJcblx0XHQvL2lnbm9yZSBzZWxmXHJcblx0XHRpZiAoZWwgPT09IHJlbGF0aXZlVG8pIGNvbnRpbnVlO1xyXG5cclxuXHRcdHMgPSBnZXRDb21wdXRlZFN0eWxlKGVsKTtcclxuXHJcblx0XHQvL2Vuc3VyZSBlbGVtZW50IGlzIGF0IGxlYXN0IHJlbGF0aXZlLCBpZiBpdCBpcyBzdGF0aWNcclxuXHRcdGlmIChzLnBvc2l0aW9uID09PSAnc3RhdGljJykgY3NzKGVsLCAncG9zaXRpb24nLCAncmVsYXRpdmUnKTtcclxuXHJcblxyXG5cdFx0Ly9pbmNsdWRlIG1hcmdpbnNcclxuXHRcdHZhciBwbGFjZWVNYXJnaW5zID0gbWFyZ2lucyhlbCk7XHJcblxyXG5cdFx0Ly9nZXQgcmVsYXRpdmVUbyAmIHBhcmVudCByZWN0YW5nbGVzXHJcblx0XHR2YXIgcGFyZW50ID0gZWwub2Zmc2V0UGFyZW50IHx8IHdpbjtcclxuXHRcdHZhciBwYXJlbnRSZWN0ID0gb2Zmc2V0cyhwYXJlbnQpO1xyXG5cdFx0dmFyIHBhcmVudFBhZGRpbmdzID0gcGFkZGluZ3MocGFyZW50KTtcclxuXHRcdHZhciBwYXJlbnRCb3JkZXJzID0gYm9yZGVycyhwYXJlbnQpO1xyXG5cclxuXHRcdC8vY29ycmVjdCBwYXJlbnRSZWN0XHJcblx0XHRpZiAocGFyZW50ID09PSBkb2MuYm9keSB8fCBwYXJlbnQgPT09IHJvb3QgJiYgZ2V0Q29tcHV0ZWRTdHlsZShwYXJlbnQpLnBvc2l0aW9uID09PSAnc3RhdGljJykge1xyXG5cdFx0XHRwYXJlbnRSZWN0LmxlZnQgPSAwO1xyXG5cdFx0XHRwYXJlbnRSZWN0LnRvcCA9IDA7XHJcblx0XHR9XHJcblx0XHRwYXJlbnRSZWN0ID0gbS5zdWIocGFyZW50UmVjdCwgcGFyZW50Qm9yZGVycyk7XHJcblx0XHRwYXJlbnRSZWN0ID0gbS5hZGQocGFyZW50UmVjdCwgcGxhY2VlTWFyZ2lucyk7XHJcblx0XHRwYXJlbnRSZWN0ID0gbS5hZGQocGFyZW50UmVjdCwgcGFyZW50UGFkZGluZ3MpO1xyXG5cclxuXHJcblx0XHRhbGlnblgoZWxzW2ldLCB0b1JlY3QsIHBhcmVudFJlY3QsIHhBbGlnbik7XHJcblx0XHRhbGlnblkoZWxzW2ldLCB0b1JlY3QsIHBhcmVudFJlY3QsIHlBbGlnbik7XHJcblx0fVxyXG59XHJcblxyXG5cclxuXHJcblxyXG4vKipcclxuICogUGxhY2UgaG9yaXpvbnRhbGx5XHJcbiAqL1xyXG5mdW5jdGlvbiBhbGlnblggKCBwbGFjZWUsIHBsYWNlclJlY3QsIHBhcmVudFJlY3QsIGFsaWduICl7XHJcblx0aWYgKHR5cGVvZiBhbGlnbiAhPT0gJ251bWJlcicpIHJldHVybjtcclxuXHJcblx0Ly9kZXNpcmFibGUgYWJzb2x1dGUgbGVmdFxyXG5cdHZhciBkZXNpcmFibGVMZWZ0ID0gcGxhY2VyUmVjdC5sZWZ0ICsgcGxhY2VyUmVjdC53aWR0aCphbGlnbiAtIHBsYWNlZS5vZmZzZXRXaWR0aCphbGlnbiAtIHBhcmVudFJlY3QubGVmdDtcclxuXHJcblx0Y3NzKHBsYWNlZSwge1xyXG5cdFx0bGVmdDogZGVzaXJhYmxlTGVmdCxcclxuXHRcdHJpZ2h0OiAnYXV0bydcclxuXHR9KTtcclxufVxyXG5cclxuXHJcbi8qKlxyXG4gKiBQbGFjZSB2ZXJ0aWNhbGx5XHJcbiAqL1xyXG5mdW5jdGlvbiBhbGlnblkgKCBwbGFjZWUsIHBsYWNlclJlY3QsIHBhcmVudFJlY3QsIGFsaWduICl7XHJcblx0aWYgKHR5cGVvZiBhbGlnbiAhPT0gJ251bWJlcicpIHJldHVybjtcclxuXHJcblx0Ly9kZXNpcmFibGUgYWJzb2x1dGUgdG9wXHJcblx0dmFyIGRlc2lyYWJsZVRvcCA9IHBsYWNlclJlY3QudG9wICsgcGxhY2VyUmVjdC5oZWlnaHQqYWxpZ24gLSBwbGFjZWUub2Zmc2V0SGVpZ2h0KmFsaWduIC0gcGFyZW50UmVjdC50b3A7XHJcblxyXG5cdGNzcyhwbGFjZWUsIHtcclxuXHRcdHRvcDogZGVzaXJhYmxlVG9wLFxyXG5cdFx0Ym90dG9tOiAnYXV0bydcclxuXHR9KTtcclxufVxyXG5cclxuXHJcblxyXG4vKipcclxuICogQHBhcmFtIHtzdHJpbmd8bnVtYmVyfSB2YWx1ZSBDb252ZXJ0IGFueSB2YWx1ZSBwYXNzZWQgdG8gZmxvYXQgMC4uMVxyXG4gKi9cclxuZnVuY3Rpb24gbnVtZXJpZnkodmFsdWUpe1xyXG5cdGlmICh0eXBlb2YgdmFsdWUgPT09ICdzdHJpbmcnKSB7XHJcblx0XHQvL2Vsc2UgcGFyc2Ugc2luZ2xlLXZhbHVlXHJcblx0XHRzd2l0Y2ggKHZhbHVlKSB7XHJcblx0XHRcdGNhc2UgJ2xlZnQnOlxyXG5cdFx0XHRjYXNlICd0b3AnOlxyXG5cdFx0XHRcdHJldHVybiAwO1xyXG5cdFx0XHRjYXNlICdyaWdodCc6XHJcblx0XHRcdGNhc2UgJ2JvdHRvbSc6XHJcblx0XHRcdFx0cmV0dXJuIDE7XHJcblx0XHRcdGNhc2UgJ2NlbnRlcic6XHJcblx0XHRcdGNhc2UgJ21pZGRsZSc6XHJcblx0XHRcdFx0cmV0dXJuIDAuNTtcclxuXHRcdH1cclxuXHRcdHJldHVybiBwYXJzZUZsb2F0KHZhbHVlKTtcclxuXHR9XHJcblxyXG5cdHJldHVybiB2YWx1ZTtcclxufSIsIi8qKlxyXG4gKiBTaW1wbGUgcmVjdCBjb25zdHJ1Y3Rvci5cclxuICogSXQgaXMganVzdCBmYXN0ZXIgYW5kIHNtYWxsZXIgdGhhbiBjb25zdHJ1Y3RpbmcgYW4gb2JqZWN0LlxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL1JlY3RcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IGwgbGVmdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gdCB0b3BcclxuICogQHBhcmFtIHtudW1iZXJ9IHIgcmlnaHRcclxuICogQHBhcmFtIHtudW1iZXJ9IGIgYm90dG9tXHJcbiAqIEBwYXJhbSB7bnVtYmVyfT8gdyB3aWR0aFxyXG4gKiBAcGFyYW0ge251bWJlcn0/IGggaGVpZ2h0XHJcbiAqXHJcbiAqIEByZXR1cm4ge1JlY3R9IEEgcmVjdGFuZ2xlIG9iamVjdFxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiBSZWN0IChsLHQscixiLHcsaCkge1xyXG5cdHRoaXMudG9wPXR8fDA7XHJcblx0dGhpcy5ib3R0b209Ynx8MDtcclxuXHR0aGlzLmxlZnQ9bHx8MDtcclxuXHR0aGlzLnJpZ2h0PXJ8fDA7XHJcblx0aWYgKHchPT11bmRlZmluZWQpIHRoaXMud2lkdGg9d3x8dGhpcy5yaWdodC10aGlzLmxlZnQ7XHJcblx0aWYgKGghPT11bmRlZmluZWQpIHRoaXMuaGVpZ2h0PWh8fHRoaXMuYm90dG9tLXRoaXMudG9wO1xyXG59OyIsIi8qKlxyXG4gKiBQYXJzZSBlbGVtZW504oCZcyBib3JkZXJzXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvYm9yZGVyc1xyXG4gKi9cclxuXHJcbnZhciBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0Jyk7XHJcbnZhciBwYXJzZSA9IHJlcXVpcmUoJy4vcGFyc2UtdmFsdWUnKTtcclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gYm9yZGVyIHdpZHRocyBvZiBhbiBlbGVtZW50XHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsKXtcclxuXHRpZiAoZWwgPT09IHdpbmRvdykgcmV0dXJuIG5ldyBSZWN0O1xyXG5cclxuXHRpZiAoIShlbCBpbnN0YW5jZW9mIEVsZW1lbnQpKSB0aHJvdyBFcnJvcignQXJndW1lbnQgaXMgbm90IGFuIGVsZW1lbnQnKTtcclxuXHJcblx0dmFyIHN0eWxlID0gd2luZG93LmdldENvbXB1dGVkU3R5bGUoZWwpO1xyXG5cclxuXHRyZXR1cm4gbmV3IFJlY3QoXHJcblx0XHRwYXJzZShzdHlsZS5ib3JkZXJMZWZ0V2lkdGgpLFxyXG5cdFx0cGFyc2Uoc3R5bGUuYm9yZGVyVG9wV2lkdGgpLFxyXG5cdFx0cGFyc2Uoc3R5bGUuYm9yZGVyUmlnaHRXaWR0aCksXHJcblx0XHRwYXJzZShzdHlsZS5ib3JkZXJCb3R0b21XaWR0aClcclxuXHQpO1xyXG59OyIsIi8qKlxyXG4gKiBHZXQgb3Igc2V0IGVsZW1lbnTigJlzIHN0eWxlLCBwcmVmaXgtYWdub3N0aWMuXHJcbiAqXHJcbiAqIEBtb2R1bGUgIG11Y3NzL2Nzc1xyXG4gKi9cclxudmFyIGZha2VTdHlsZSA9IHJlcXVpcmUoJy4vZmFrZS1lbGVtZW50Jykuc3R5bGU7XHJcbnZhciBwcmVmaXggPSByZXF1aXJlKCcuL3ByZWZpeCcpLmxvd2VyY2FzZTtcclxuXHJcblxyXG4vKipcclxuICogQXBwbHkgc3R5bGVzIHRvIGFuIGVsZW1lbnQuXHJcbiAqXHJcbiAqIEBwYXJhbSAgICB7RWxlbWVudH0gICBlbCAgIEFuIGVsZW1lbnQgdG8gYXBwbHkgc3R5bGVzLlxyXG4gKiBAcGFyYW0gICAge09iamVjdHxzdHJpbmd9ICAgb2JqICAgU2V0IG9mIHN0eWxlIHJ1bGVzIG9yIHN0cmluZyB0byBnZXQgc3R5bGUgcnVsZS5cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZWwsIG9iail7XHJcblx0aWYgKCFlbCB8fCAhb2JqKSByZXR1cm47XHJcblxyXG5cdHZhciBuYW1lLCB2YWx1ZTtcclxuXHJcblx0Ly9yZXR1cm4gdmFsdWUsIGlmIHN0cmluZyBwYXNzZWRcclxuXHRpZiAodHlwZW9mIG9iaiA9PT0gJ3N0cmluZycpIHtcclxuXHRcdG5hbWUgPSBvYmo7XHJcblxyXG5cdFx0Ly9yZXR1cm4gdmFsdWUsIGlmIG5vIHZhbHVlIHBhc3NlZFxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPCAzKSB7XHJcblx0XHRcdHJldHVybiBlbC5zdHlsZVtwcmVmaXhpemUobmFtZSldO1xyXG5cdFx0fVxyXG5cclxuXHRcdC8vc2V0IHN0eWxlLCBpZiB2YWx1ZSBwYXNzZWRcclxuXHRcdHZhbHVlID0gYXJndW1lbnRzWzJdIHx8ICcnO1xyXG5cdFx0b2JqID0ge307XHJcblx0XHRvYmpbbmFtZV0gPSB2YWx1ZTtcclxuXHR9XHJcblxyXG5cdGZvciAobmFtZSBpbiBvYmope1xyXG5cdFx0Ly9jb252ZXJ0IG51bWJlcnMgdG8gcHhcclxuXHRcdGlmICh0eXBlb2Ygb2JqW25hbWVdID09PSAnbnVtYmVyJyAmJiAvbGVmdHxyaWdodHxib3R0b218dG9wfHdpZHRofGhlaWdodC9pLnRlc3QobmFtZSkpIG9ialtuYW1lXSArPSAncHgnO1xyXG5cclxuXHRcdHZhbHVlID0gb2JqW25hbWVdIHx8ICcnO1xyXG5cclxuXHRcdGVsLnN0eWxlW3ByZWZpeGl6ZShuYW1lKV0gPSB2YWx1ZTtcclxuXHR9XHJcbn07XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybiBwcmVmaXhpemVkIHByb3AgbmFtZSwgaWYgbmVlZGVkLlxyXG4gKlxyXG4gKiBAcGFyYW0gICAge3N0cmluZ30gICBuYW1lICAgQSBwcm9wZXJ0eSBuYW1lLlxyXG4gKiBAcmV0dXJuICAge3N0cmluZ30gICBQcmVmaXhlZCBwcm9wZXJ0eSBuYW1lLlxyXG4gKi9cclxuZnVuY3Rpb24gcHJlZml4aXplKG5hbWUpe1xyXG5cdHZhciB1TmFtZSA9IG5hbWVbMF0udG9VcHBlckNhc2UoKSArIG5hbWUuc2xpY2UoMSk7XHJcblx0aWYgKGZha2VTdHlsZVtuYW1lXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gbmFtZTtcclxuXHRpZiAoZmFrZVN0eWxlW3ByZWZpeCArIHVOYW1lXSAhPT0gdW5kZWZpbmVkKSByZXR1cm4gcHJlZml4ICsgdU5hbWU7XHJcblx0cmV0dXJuICcnO1xyXG59XHJcbiIsIi8qKiBKdXN0IGEgZmFrZSBlbGVtZW50IHRvIHRlc3Qgc3R5bGVzXHJcbiAqIEBtb2R1bGUgbXVjc3MvZmFrZS1lbGVtZW50XHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdkaXYnKTsiLCIvKipcclxuICogV2luZG93IHNjcm9sbGJhciBkZXRlY3Rvci5cclxuICpcclxuICogQG1vZHVsZSBtdWNzcy9oYXMtc2Nyb2xsXHJcbiAqL1xyXG5leHBvcnRzLnggPSBmdW5jdGlvbiAoKSB7XHJcblx0cmV0dXJuIHdpbmRvdy5pbm5lckhlaWdodCA+IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5jbGllbnRIZWlnaHQ7XHJcbn07XHJcbmV4cG9ydHMueSA9IGZ1bmN0aW9uICgpIHtcclxuXHRyZXR1cm4gd2luZG93LmlubmVyV2lkdGggPiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuY2xpZW50V2lkdGg7XHJcbn07IiwiLyoqXHJcbiAqIERldGVjdCB3aGV0aGVyIGVsZW1lbnQgaXMgcGxhY2VkIHRvIGZpeGVkIGNvbnRhaW5lciBvciBpcyBmaXhlZCBpdHNlbGYuXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvaXMtZml4ZWRcclxuICpcclxuICogQHBhcmFtIHsoRWxlbWVudHxPYmplY3QpfSBlbCBFbGVtZW50IHRvIGRldGVjdCBmaXhlZG5lc3MuXHJcbiAqXHJcbiAqIEByZXR1cm4ge2Jvb2xlYW59IFdoZXRoZXIgZWxlbWVudCBpcyBuZXN0ZWQuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlbCkge1xyXG5cdHZhciBwYXJlbnRFbCA9IGVsO1xyXG5cclxuXHQvL3dpbmRvdyBpcyBmaXhlZCwgYnR3XHJcblx0aWYgKGVsID09PSB3aW5kb3cpIHJldHVybiB0cnVlO1xyXG5cclxuXHQvL3VubGlrZSB0aGUgZG9jXHJcblx0aWYgKGVsID09PSBkb2N1bWVudCkgcmV0dXJuIGZhbHNlO1xyXG5cclxuXHR3aGlsZSAocGFyZW50RWwpIHtcclxuXHRcdGlmIChnZXRDb21wdXRlZFN0eWxlKHBhcmVudEVsKS5wb3NpdGlvbiA9PT0gJ2ZpeGVkJykgcmV0dXJuIHRydWU7XHJcblx0XHRwYXJlbnRFbCA9IHBhcmVudEVsLm9mZnNldFBhcmVudDtcclxuXHR9XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59OyIsIi8qKlxyXG4gKiBHZXQgbWFyZ2lucyBvZiBhbiBlbGVtZW50LlxyXG4gKiBAbW9kdWxlIG11Y3NzL21hcmdpbnNcclxuICovXHJcblxyXG52YXIgcGFyc2UgPSByZXF1aXJlKCcuL3BhcnNlLXZhbHVlJyk7XHJcbnZhciBSZWN0ID0gcmVxdWlyZSgnLi9SZWN0Jyk7XHJcblxyXG4vKipcclxuICogUmV0dXJuIG1hcmdpbnMgb2YgYW4gZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtICAgIHtFbGVtZW50fSAgIGVsICAgQW4gZWxlbWVudCB3aGljaCB0byBjYWxjIG1hcmdpbnMuXHJcbiAqIEByZXR1cm4gICB7T2JqZWN0fSAgIFBhZGRpbmdzIG9iamVjdCBge3RvcDpuLCBib3R0b206biwgbGVmdDpuLCByaWdodDpufWAuXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKGVsKXtcclxuXHRpZiAoZWwgPT09IHdpbmRvdykgcmV0dXJuIG5ldyBSZWN0KCk7XHJcblxyXG5cdGlmICghKGVsIGluc3RhbmNlb2YgRWxlbWVudCkpIHRocm93IEVycm9yKCdBcmd1bWVudCBpcyBub3QgYW4gZWxlbWVudCcpO1xyXG5cclxuXHR2YXIgc3R5bGUgPSB3aW5kb3cuZ2V0Q29tcHV0ZWRTdHlsZShlbCk7XHJcblxyXG5cdHJldHVybiBuZXcgUmVjdChcclxuXHRcdHBhcnNlKHN0eWxlLm1hcmdpbkxlZnQpLFxyXG5cdFx0cGFyc2Uoc3R5bGUubWFyZ2luVG9wKSxcclxuXHRcdHBhcnNlKHN0eWxlLm1hcmdpblJpZ2h0KSxcclxuXHRcdHBhcnNlKHN0eWxlLm1hcmdpbkJvdHRvbSlcclxuXHQpO1xyXG59O1xyXG4iLCIvKipcclxuICogQ2FsY3VsYXRlIGFic29sdXRlIG9mZnNldHMgb2YgYW4gZWxlbWVudCwgcmVsYXRpdmUgdG8gdGhlIGRvY3VtZW50LlxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL29mZnNldHNcclxuICpcclxuICovXHJcbnZhciB3aW4gPSB3aW5kb3c7XHJcbnZhciBkb2MgPSBkb2N1bWVudDtcclxudmFyIFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKTtcclxudmFyIGhhc1Njcm9sbCA9IHJlcXVpcmUoJy4vaGFzLXNjcm9sbCcpO1xyXG52YXIgc2Nyb2xsYmFyID0gcmVxdWlyZSgnLi9zY3JvbGxiYXInKTtcclxudmFyIGlzRml4ZWRFbCA9IHJlcXVpcmUoJy4vaXMtZml4ZWQnKTtcclxudmFyIGdldFRyYW5zbGF0ZSA9IHJlcXVpcmUoJy4vdHJhbnNsYXRlJyk7XHJcblxyXG5cclxuLyoqXHJcbiAqIFJldHVybiBhYnNvbHV0ZSBvZmZzZXRzIG9mIGFueSB0YXJnZXQgcGFzc2VkXHJcbiAqXHJcbiAqIEBwYXJhbSAgICB7RWxlbWVudHx3aW5kb3d9ICAgZWwgICBBIHRhcmdldC4gUGFzcyB3aW5kb3cgdG8gY2FsY3VsYXRlIHZpZXdwb3J0IG9mZnNldHNcclxuICogQHJldHVybiAgIHtPYmplY3R9ICAgT2Zmc2V0cyBvYmplY3Qgd2l0aCB0cmJsLlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBvZmZzZXRzO1xyXG5cclxuZnVuY3Rpb24gb2Zmc2V0cyAoZWwpIHtcclxuXHRpZiAoIWVsKSB0aHJvdyBFcnJvcignQmFkIGFyZ3VtZW50Jyk7XHJcblxyXG5cdC8vY2FsYyBjbGllbnQgcmVjdFxyXG5cdHZhciBjUmVjdCwgcmVzdWx0O1xyXG5cclxuXHQvL3JldHVybiB2cCBvZmZzZXRzXHJcblx0aWYgKGVsID09PSB3aW4pIHtcclxuXHRcdHJlc3VsdCA9IG5ldyBSZWN0KFxyXG5cdFx0XHR3aW4ucGFnZVhPZmZzZXQsXHJcblx0XHRcdHdpbi5wYWdlWU9mZnNldFxyXG5cdFx0KTtcclxuXHJcblx0XHRyZXN1bHQud2lkdGggPSB3aW4uaW5uZXJXaWR0aCAtIChoYXNTY3JvbGwueSgpID8gc2Nyb2xsYmFyIDogMCksXHJcblx0XHRyZXN1bHQuaGVpZ2h0ID0gd2luLmlubmVySGVpZ2h0IC0gKGhhc1Njcm9sbC54KCkgPyBzY3JvbGxiYXIgOiAwKVxyXG5cdFx0cmVzdWx0LnJpZ2h0ID0gcmVzdWx0LmxlZnQgKyByZXN1bHQud2lkdGg7XHJcblx0XHRyZXN1bHQuYm90dG9tID0gcmVzdWx0LnRvcCArIHJlc3VsdC5oZWlnaHQ7XHJcblxyXG5cdFx0cmV0dXJuIHJlc3VsdDtcclxuXHR9XHJcblxyXG5cdC8vcmV0dXJuIGFic29sdXRlIG9mZnNldHMgaWYgZG9jdW1lbnQgcmVxdWVzdGVkXHJcblx0ZWxzZSBpZiAoZWwgPT09IGRvYykge1xyXG5cdFx0dmFyIHJlcyA9IG9mZnNldHMoZG9jLmRvY3VtZW50RWxlbWVudCk7XHJcblx0XHRyZXMuYm90dG9tID0gTWF0aC5tYXgod2luZG93LmlubmVySGVpZ2h0LCByZXMuYm90dG9tKTtcclxuXHRcdHJlcy5yaWdodCA9IE1hdGgubWF4KHdpbmRvdy5pbm5lcldpZHRoLCByZXMucmlnaHQpO1xyXG5cdFx0aWYgKGhhc1Njcm9sbC55KGRvYy5kb2N1bWVudEVsZW1lbnQpKSByZXMucmlnaHQgLT0gc2Nyb2xsYmFyO1xyXG5cdFx0aWYgKGhhc1Njcm9sbC54KGRvYy5kb2N1bWVudEVsZW1lbnQpKSByZXMuYm90dG9tIC09IHNjcm9sbGJhcjtcclxuXHRcdHJldHVybiByZXM7XHJcblx0fVxyXG5cclxuXHQvL0ZJWE1FOiB3aHkgbm90IGV2ZXJ5IGVsZW1lbnQgaGFzIGdldEJvdW5kaW5nQ2xpZW50UmVjdCBtZXRob2Q/XHJcblx0dHJ5IHtcclxuXHRcdGNSZWN0ID0gZWwuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XHJcblx0fSBjYXRjaCAoZSkge1xyXG5cdFx0Y1JlY3QgPSBuZXcgUmVjdChcclxuXHRcdFx0ZWwuY2xpZW50TGVmdCxcclxuXHRcdFx0ZWwuY2xpZW50VG9wXHJcblx0XHQpO1xyXG5cdH1cclxuXHJcblx0Ly93aGV0aGVyIGVsZW1lbnQgaXMgb3IgaXMgaW4gZml4ZWRcclxuXHR2YXIgaXNGaXhlZCA9IGlzRml4ZWRFbChlbCk7XHJcblx0dmFyIHhPZmZzZXQgPSBpc0ZpeGVkID8gMCA6IHdpbi5wYWdlWE9mZnNldDtcclxuXHR2YXIgeU9mZnNldCA9IGlzRml4ZWQgPyAwIDogd2luLnBhZ2VZT2Zmc2V0O1xyXG5cclxuXHRyZXN1bHQgPSBuZXcgUmVjdChcclxuXHRcdGNSZWN0LmxlZnQgKyB4T2Zmc2V0LFxyXG5cdFx0Y1JlY3QudG9wICsgeU9mZnNldCxcclxuXHRcdGNSZWN0LmxlZnQgKyB4T2Zmc2V0ICsgZWwub2Zmc2V0V2lkdGgsXHJcblx0XHRjUmVjdC50b3AgKyB5T2Zmc2V0ICsgZWwub2Zmc2V0SGVpZ2h0LFxyXG5cdFx0ZWwub2Zmc2V0V2lkdGgsXHJcblx0XHRlbC5vZmZzZXRIZWlnaHRcclxuXHQpO1xyXG5cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59OyIsIi8qKlxyXG4gKiBDYWNsdWxhdGUgcGFkZGluZ3Mgb2YgYW4gZWxlbWVudC5cclxuICogQG1vZHVsZSAgbXVjc3MvcGFkZGluZ3NcclxuICovXHJcblxyXG5cclxudmFyIFJlY3QgPSByZXF1aXJlKCcuL1JlY3QnKTtcclxudmFyIHBhcnNlID0gcmVxdWlyZSgnLi9wYXJzZS12YWx1ZScpO1xyXG5cclxuXHJcbi8qKlxyXG4gKiBSZXR1cm4gcGFkZGluZ3Mgb2YgYW4gZWxlbWVudC5cclxuICpcclxuICogQHBhcmFtICAgIHtFbGVtZW50fSAgICRlbCAgIEFuIGVsZW1lbnQgdG8gY2FsYyBwYWRkaW5ncy5cclxuICogQHJldHVybiAgIHtPYmplY3R9ICAgUGFkZGluZ3Mgb2JqZWN0IGB7dG9wOm4sIGJvdHRvbTpuLCBsZWZ0Om4sIHJpZ2h0Om59YC5cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oJGVsKXtcclxuXHRpZiAoJGVsID09PSB3aW5kb3cpIHJldHVybiBuZXcgUmVjdCgpO1xyXG5cclxuXHRpZiAoISgkZWwgaW5zdGFuY2VvZiBFbGVtZW50KSkgdGhyb3cgRXJyb3IoJ0FyZ3VtZW50IGlzIG5vdCBhbiBlbGVtZW50Jyk7XHJcblxyXG5cdHZhciBzdHlsZSA9IHdpbmRvdy5nZXRDb21wdXRlZFN0eWxlKCRlbCk7XHJcblxyXG5cdHJldHVybiBuZXcgUmVjdChcclxuXHRcdHBhcnNlKHN0eWxlLnBhZGRpbmdMZWZ0KSxcclxuXHRcdHBhcnNlKHN0eWxlLnBhZGRpbmdUb3ApLFxyXG5cdFx0cGFyc2Uoc3R5bGUucGFkZGluZ1JpZ2h0KSxcclxuXHRcdHBhcnNlKHN0eWxlLnBhZGRpbmdCb3R0b20pXHJcblx0KTtcclxufTsiLCIvKipcclxuICogUmV0dXJucyBwYXJzZWQgY3NzIHZhbHVlLlxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL3BhcnNlLXZhbHVlXHJcbiAqXHJcbiAqIEBwYXJhbSB7c3RyaW5nfSBzdHIgQSBzdHJpbmcgY29udGFpbmluZyBjc3MgdW5pdHMgdmFsdWVcclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfSBQYXJzZWQgbnVtYmVyIHZhbHVlXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChzdHIpe1xyXG5cdHN0ciArPSAnJztcclxuXHRyZXR1cm4gcGFyc2VGbG9hdChzdHIuc2xpY2UoMCwtMikpIHx8IDA7XHJcbn07XHJcblxyXG4vL0ZJWE1FOiBhZGQgcGFyc2luZyB1bml0cyIsIi8qKlxyXG4gKiBWZW5kb3IgcHJlZml4ZXNcclxuICogTWV0aG9kIG9mIGh0dHA6Ly9kYXZpZHdhbHNoLm5hbWUvdmVuZG9yLXByZWZpeFxyXG4gKiBAbW9kdWxlIG11Y3NzL3ByZWZpeFxyXG4gKi9cclxuXHJcbnZhciBzdHlsZXMgPSBnZXRDb21wdXRlZFN0eWxlKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCwgJycpO1xyXG5cclxudmFyIHByZSA9IChBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChzdHlsZXMpXHJcblx0LmpvaW4oJycpXHJcblx0Lm1hdGNoKC8tKG1venx3ZWJraXR8bXMpLS8pIHx8IChzdHlsZXMuT0xpbmsgPT09ICcnICYmIFsnJywgJ28nXSlcclxuKVsxXTtcclxuXHJcbmRvbSA9ICgnV2ViS2l0fE1venxNU3xPJykubWF0Y2gobmV3IFJlZ0V4cCgnKCcgKyBwcmUgKyAnKScsICdpJykpWzFdO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcblx0ZG9tOiBkb20sXHJcblx0bG93ZXJjYXNlOiBwcmUsXHJcblx0Y3NzOiAnLScgKyBwcmUgKyAnLScsXHJcblx0anM6IHByZVswXS50b1VwcGVyQ2FzZSgpICsgcHJlLnN1YnN0cigxKVxyXG59OyIsIi8qKlxyXG4gKiBDYWxjdWxhdGUgc2Nyb2xsYmFyIHdpZHRoLlxyXG4gKlxyXG4gKiBAbW9kdWxlIG11Y3NzL3Njcm9sbGJhclxyXG4gKi9cclxuXHJcbi8vIENyZWF0ZSB0aGUgbWVhc3VyZW1lbnQgbm9kZVxyXG52YXIgc2Nyb2xsRGl2ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcclxuXHJcbnZhciBzdHlsZSA9IHNjcm9sbERpdi5zdHlsZTtcclxuXHJcbnN0eWxlLndpZHRoID0gJzEwMHB4Jztcclxuc3R5bGUuaGVpZ2h0ID0gJzEwMHB4Jztcclxuc3R5bGUub3ZlcmZsb3cgPSAnc2Nyb2xsJztcclxuc3R5bGUucG9zaXRpb24gPSAnYWJzb2x1dGUnO1xyXG5zdHlsZS50b3AgPSAnLTk5OTlweCc7XHJcblxyXG5kb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuYXBwZW5kQ2hpbGQoc2Nyb2xsRGl2KTtcclxuXHJcbi8vIHRoZSBzY3JvbGxiYXIgd2lkdGhcclxubW9kdWxlLmV4cG9ydHMgPSBzY3JvbGxEaXYub2Zmc2V0V2lkdGggLSBzY3JvbGxEaXYuY2xpZW50V2lkdGg7XHJcblxyXG4vLyBEZWxldGUgZmFrZSBESVZcclxuZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlbW92ZUNoaWxkKHNjcm9sbERpdik7IiwiLyoqXHJcbiAqIFBhcnNlIHRyYW5zbGF0ZTNkXHJcbiAqXHJcbiAqIEBtb2R1bGUgbXVjc3MvdHJhbnNsYXRlXHJcbiAqL1xyXG5cclxudmFyIGNzcyA9IHJlcXVpcmUoJy4vY3NzJyk7XHJcbnZhciBwYXJzZVZhbHVlID0gcmVxdWlyZSgnLi9wYXJzZS12YWx1ZScpO1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWwpIHtcclxuXHR2YXIgdHJhbnNsYXRlU3RyID0gY3NzKGVsLCAndHJhbnNmb3JtJyk7XHJcblxyXG5cdC8vZmluZCB0cmFuc2xhdGUgdG9rZW4sIHJldHJpZXZlIGNvbW1hLWVuY2xvc2VkIHZhbHVlc1xyXG5cdC8vdHJhbnNsYXRlM2QoMXB4LCAycHgsIDIpIOKGkiAxcHgsIDJweCwgMlxyXG5cdC8vRklYTUU6IGhhbmRsZSBuZXN0ZWQgY2FsY3NcclxuXHR2YXIgbWF0Y2ggPSAvdHJhbnNsYXRlKD86M2QpP1xccypcXCgoW15cXCldKilcXCkvLmV4ZWModHJhbnNsYXRlU3RyKTtcclxuXHJcblx0aWYgKCFtYXRjaCkgcmV0dXJuIFswLCAwXTtcclxuXHR2YXIgdmFsdWVzID0gbWF0Y2hbMV0uc3BsaXQoL1xccyosXFxzKi8pO1xyXG5cclxuXHQvL3BhcnNlIHZhbHVlc1xyXG5cdC8vRklYTUU6IG5lc3RlZCB2YWx1ZXMgYXJlIG5vdCBuZWNlc3NhcmlseSBwaXhlbHNcclxuXHRyZXR1cm4gdmFsdWVzLm1hcChmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdHJldHVybiBwYXJzZVZhbHVlKHZhbHVlKTtcclxuXHR9KTtcclxufTsiLCIvKipcclxuICogQG1vZHVsZSAgbXVtYXRoL2FkZFxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHJlc3VsdCA9IGFyZ3VtZW50c1swXTtcclxuXHRmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdHJlc3VsdCArPSBhcmd1bWVudHNbaV07XHJcblx0fVxyXG5cdHJldHVybiByZXN1bHQ7XHJcbn0pOyIsIi8qKlxyXG4gKiBDbGFtcGVyLlxyXG4gKiBEZXRlY3RzIHByb3BlciBjbGFtcCBtaW4vbWF4LlxyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0gYSBDdXJyZW50IHZhbHVlIHRvIGN1dCBvZmZcclxuICogQHBhcmFtIHtudW1iZXJ9IG1pbiBPbmUgc2lkZSBsaW1pdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gbWF4IE90aGVyIHNpZGUgbGltaXRcclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfSBDbGFtcGVkIHZhbHVlXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbihhLCBtaW4sIG1heCl7XHJcblx0cmV0dXJuIG1heCA+IG1pbiA/IE1hdGgubWF4KE1hdGgubWluKGEsbWF4KSxtaW4pIDogTWF0aC5tYXgoTWF0aC5taW4oYSxtaW4pLG1heCk7XHJcbn0pOyIsbnVsbCwiLyoqXHJcbiAqIEBtb2R1bGUgbXVtYXRoL2RpdlxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHJlc3VsdCA9IGFyZ3VtZW50c1swXTtcclxuXHRmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdHJlc3VsdCAvPSBhcmd1bWVudHNbaV07XHJcblx0fVxyXG5cdHJldHVybiByZXN1bHQ7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9lcVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbiAoYSwgYikge1xyXG5cdHJldHVybiBhID09PSBiO1xyXG59KTsiLCIvKipcclxuICogQG1vZHVsZSBtdW1hdGgvZ3RcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRyZXR1cm4gYSA+IGI7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9ndGVcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRyZXR1cm4gYSA+PSBiO1xyXG59KTsiLCIvKipcbiAqIENvbXBvc2VkIHNldCBvZiBhbGwgbWF0aCB1dGlsc1xuICpcbiAqIEBtb2R1bGUgIG11bWF0aFxuICovXG5tb2R1bGUuZXhwb3J0cyA9IHtcblx0YmV0d2VlbjogcmVxdWlyZSgnLi9iZXR3ZWVuJyksXG5cdGlzQmV0d2VlbjogcmVxdWlyZSgnLi9pcy1iZXR3ZWVuJyksXG5cdHJvdW5kOiByZXF1aXJlKCcuL3JvdW5kJyksXG5cdHByZWNpc2lvbjogcmVxdWlyZSgnLi9wcmVjaXNpb24nKSxcblx0bG9vcDogcmVxdWlyZSgnLi9sb29wJyksXG5cdGFkZDogcmVxdWlyZSgnLi9hZGQnKSxcblx0c3ViOiByZXF1aXJlKCcuL3N1YicpLFxuXHRtaW46IHJlcXVpcmUoJy4vbWluJyksXG5cdG1heDogcmVxdWlyZSgnLi9tYXgnKSxcblx0ZGl2OiByZXF1aXJlKCcuL2RpdicpLFxuXHRsZzogcmVxdWlyZSgnLi9sZycpLFxuXHRsb2c6IHJlcXVpcmUoJy4vbG9nJyksXG5cdG11bHQ6IHJlcXVpcmUoJy4vbXVsdCcpLFxuXHRtb2Q6IHJlcXVpcmUoJy4vbW9kJyksXG5cdGZsb29yOiByZXF1aXJlKCcuL2Zsb29yJyksXG5cdGNlaWw6IHJlcXVpcmUoJy4vY2VpbCcpLFxuXG5cdGd0OiByZXF1aXJlKCcuL2d0JyksXG5cdGd0ZTogcmVxdWlyZSgnLi9ndGUnKSxcblx0bHQ6IHJlcXVpcmUoJy4vbHQnKSxcblx0bHRlOiByZXF1aXJlKCcuL2x0ZScpLFxuXHRlcTogcmVxdWlyZSgnLi9lcScpLFxuXHRuZTogcmVxdWlyZSgnLi9uZScpLFxufTsiLCIvKipcclxuICogV2hldGhlciBlbGVtZW50IGlzIGJldHdlZW4gbGVmdCAmIHJpZ2h0IGluY2x1ZGluZ1xyXG4gKlxyXG4gKiBAcGFyYW0ge251bWJlcn0gYVxyXG4gKiBAcGFyYW0ge251bWJlcn0gbGVmdFxyXG4gKiBAcGFyYW0ge251bWJlcn0gcmlnaHRcclxuICpcclxuICogQHJldHVybiB7Qm9vbGVhbn1cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24oYSwgbGVmdCwgcmlnaHQpe1xyXG5cdGlmIChhIDw9IHJpZ2h0ICYmIGEgPj0gbGVmdCkgcmV0dXJuIHRydWU7XHJcblx0cmV0dXJuIGZhbHNlO1xyXG59KTsiLCIvKipcclxuICogQmFzZSAxMCBsb2dhcml0aG1cclxuICpcclxuICogQG1vZHVsZSBtdW1hdGgvbGdcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKGEpIHtcclxuXHRyZXR1cm4gTWF0aC5sb2coYSkgLyBNYXRoLmxvZygxMCk7XHJcbn0pOyIsIi8qKlxyXG4gKiBOYXR1cmFsIGxvZ2FyaXRobVxyXG4gKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9sb2dcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKGEpIHtcclxuXHRyZXR1cm4gTWF0aC5sb2coYSk7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlICBtdW1hdGgvbG9vcFxyXG4gKlxyXG4gKiBMb29waW5nIGZ1bmN0aW9uIGZvciBhbnkgZnJhbWVzaXplXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbiAodmFsdWUsIGxlZnQsIHJpZ2h0KSB7XHJcblx0Ly9kZXRlY3Qgc2luZ2xlLWFyZyBjYXNlLCBsaWtlIG1vZC1sb29wXHJcblx0aWYgKHJpZ2h0ID09PSB1bmRlZmluZWQpIHtcclxuXHRcdHJpZ2h0ID0gbGVmdDtcclxuXHRcdGxlZnQgPSAwO1xyXG5cdH1cclxuXHJcblx0Ly9zd2FwIGZyYW1lIG9yZGVyXHJcblx0aWYgKGxlZnQgPiByaWdodCkge1xyXG5cdFx0dmFyIHRtcCA9IHJpZ2h0O1xyXG5cdFx0cmlnaHQgPSBsZWZ0O1xyXG5cdFx0bGVmdCA9IHRtcDtcclxuXHR9XHJcblxyXG5cdHZhciBmcmFtZSA9IHJpZ2h0IC0gbGVmdDtcclxuXHJcblx0dmFsdWUgPSAoKHZhbHVlICsgbGVmdCkgJSBmcmFtZSkgLSBsZWZ0O1xyXG5cdGlmICh2YWx1ZSA8IGxlZnQpIHZhbHVlICs9IGZyYW1lO1xyXG5cdGlmICh2YWx1ZSA+IHJpZ2h0KSB2YWx1ZSAtPSBmcmFtZTtcclxuXHJcblx0cmV0dXJuIHZhbHVlO1xyXG59KTsiLCIvKipcclxuICogQG1vZHVsZSBtdW1hdGgvbHRcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRyZXR1cm4gYSA8IGI7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9sdGVcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKGEsIGIpIHtcclxuXHRyZXR1cm4gYSA8PSBiO1xyXG59KTsiLCIvKiogQG1vZHVsZSBtdW1hdGgvbWF4ICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoTWF0aC5tYXgpOyIsIi8qKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9taW5cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoTWF0aC5taW4pOyIsIi8qKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9tb2RcclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24gKCkge1xyXG5cdHZhciByZXN1bHQgPSBhcmd1bWVudHNbMF07XHJcblx0Zm9yICh2YXIgaSA9IDEsIGwgPSBhcmd1bWVudHMubGVuZ3RoOyBpIDwgbDsgaSsrKSB7XHJcblx0XHRyZXN1bHQgJT0gYXJndW1lbnRzW2ldO1xyXG5cdH1cclxuXHRyZXR1cm4gcmVzdWx0O1xyXG59KTsiLCIvKipcclxuICogQG1vZHVsZSBtdW1hdGgvbXVsdFxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbiAoKSB7XHJcblx0dmFyIHJlc3VsdCA9IGFyZ3VtZW50c1swXTtcclxuXHRmb3IgKHZhciBpID0gMSwgbCA9IGFyZ3VtZW50cy5sZW5ndGg7IGkgPCBsOyBpKyspIHtcclxuXHRcdHJlc3VsdCAqPSBhcmd1bWVudHNbaV07XHJcblx0fVxyXG5cdHJldHVybiByZXN1bHQ7XHJcbn0pOyIsIi8qKlxyXG4gKiBAbW9kdWxlIG11bWF0aC9uZVxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSByZXF1aXJlKCcuL3dyYXAnKShmdW5jdGlvbiAoYSwgYikge1xyXG5cdHJldHVybiBhICE9PSBiO1xyXG59KTsiLCIvKipcclxuICogQG1vZHVsZSAgbXVtYXRoL3ByZWNpc2lvblxyXG4gKlxyXG4gKiBHZXQgcHJlY2lzaW9uIGZyb20gZmxvYXQ6XHJcbiAqXHJcbiAqIEBleGFtcGxlXHJcbiAqIDEuMSDihpIgMSwgMTIzNCDihpIgMCwgLjEyMzQg4oaSIDRcclxuICpcclxuICogQHBhcmFtIHtudW1iZXJ9IG5cclxuICpcclxuICogQHJldHVybiB7bnVtYmVyfSBkZWNpbWFwIHBsYWNlc1xyXG4gKi9cclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24obil7XHJcblx0dmFyIHMgPSBuICsgJycsXHJcblx0XHRkID0gcy5pbmRleE9mKCcuJykgKyAxO1xyXG5cclxuXHRyZXR1cm4gIWQgPyAwIDogcy5sZW5ndGggLSBkO1xyXG59KTsiLCIvKipcclxuICogUHJlY2lzaW9uIHJvdW5kXHJcbiAqXHJcbiAqIEBwYXJhbSB7bnVtYmVyfSB2YWx1ZVxyXG4gKiBAcGFyYW0ge251bWJlcn0gc3RlcCBNaW5pbWFsIGRpc2NyZXRlIHRvIHJvdW5kXHJcbiAqXHJcbiAqIEByZXR1cm4ge251bWJlcn1cclxuICpcclxuICogQGV4YW1wbGVcclxuICogdG9QcmVjaXNpb24oMjEzLjM0LCAxKSA9PSAyMTNcclxuICogdG9QcmVjaXNpb24oMjEzLjM0LCAuMSkgPT0gMjEzLjNcclxuICogdG9QcmVjaXNpb24oMjEzLjM0LCAxMCkgPT0gMjEwXHJcbiAqL1xyXG52YXIgcHJlY2lzaW9uID0gcmVxdWlyZSgnLi9wcmVjaXNpb24nKTtcclxuXHJcbm1vZHVsZS5leHBvcnRzID0gcmVxdWlyZSgnLi93cmFwJykoZnVuY3Rpb24odmFsdWUsIHN0ZXApIHtcclxuXHRpZiAoc3RlcCA9PT0gMCkgcmV0dXJuIHZhbHVlO1xyXG5cdGlmICghc3RlcCkgcmV0dXJuIE1hdGgucm91bmQodmFsdWUpO1xyXG5cdHN0ZXAgPSBwYXJzZUZsb2F0KHN0ZXApO1xyXG5cdHZhbHVlID0gTWF0aC5yb3VuZCh2YWx1ZSAvIHN0ZXApICogc3RlcDtcclxuXHRyZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZS50b0ZpeGVkKHByZWNpc2lvbihzdGVwKSkpO1xyXG59KTsiLCIvKipcclxuICogQG1vZHVsZSBtdW1hdGgvc3ViXHJcbiAqL1xyXG5tb2R1bGUuZXhwb3J0cyA9IHJlcXVpcmUoJy4vd3JhcCcpKGZ1bmN0aW9uICgpIHtcclxuXHR2YXIgcmVzdWx0ID0gYXJndW1lbnRzWzBdO1xyXG5cdGZvciAodmFyIGkgPSAxLCBsID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xyXG5cdFx0cmVzdWx0IC09IGFyZ3VtZW50c1tpXTtcclxuXHR9XHJcblx0cmV0dXJuIHJlc3VsdDtcclxufSk7IiwiLyoqXHJcbiAqIEdldCBmbiB3cmFwcGVkIHdpdGggYXJyYXkvb2JqZWN0IGF0dHJzIHJlY29nbml0aW9uXHJcbiAqXHJcbiAqIEByZXR1cm4ge0Z1bmN0aW9ufSBUYXJnZXQgZnVuY3Rpb25cclxuICovXHJcbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oZm4pe1xyXG5cdHJldHVybiBmdW5jdGlvbihhKXtcclxuXHRcdHZhciBhcmdzID0gYXJndW1lbnRzO1xyXG5cdFx0aWYgKGEgaW5zdGFuY2VvZiBBcnJheSkge1xyXG5cdFx0XHR2YXIgcmVzdWx0ID0gbmV3IEFycmF5KGEubGVuZ3RoKSwgc2xpY2U7XHJcblx0XHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYS5sZW5ndGg7IGkrKyl7XHJcblx0XHRcdFx0c2xpY2UgPSBbXTtcclxuXHRcdFx0XHRmb3IgKHZhciBqID0gMCwgbCA9IGFyZ3MubGVuZ3RoLCB2YWw7IGogPCBsOyBqKyspe1xyXG5cdFx0XHRcdFx0dmFsID0gYXJnc1tqXSBpbnN0YW5jZW9mIEFycmF5ID8gYXJnc1tqXVtpXSA6IGFyZ3Nbal07XHJcblx0XHRcdFx0XHR2YWwgPSB2YWw7XHJcblx0XHRcdFx0XHRzbGljZS5wdXNoKHZhbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJlc3VsdFtpXSA9IGZuLmFwcGx5KHRoaXMsIHNsaWNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSBpZiAodHlwZW9mIGEgPT09ICdvYmplY3QnKSB7XHJcblx0XHRcdHZhciByZXN1bHQgPSB7fSwgc2xpY2U7XHJcblx0XHRcdGZvciAodmFyIGkgaW4gYSl7XHJcblx0XHRcdFx0c2xpY2UgPSBbXTtcclxuXHRcdFx0XHRmb3IgKHZhciBqID0gMCwgbCA9IGFyZ3MubGVuZ3RoLCB2YWw7IGogPCBsOyBqKyspe1xyXG5cdFx0XHRcdFx0dmFsID0gdHlwZW9mIGFyZ3Nbal0gPT09ICdvYmplY3QnID8gYXJnc1tqXVtpXSA6IGFyZ3Nbal07XHJcblx0XHRcdFx0XHR2YWwgPSB2YWw7XHJcblx0XHRcdFx0XHRzbGljZS5wdXNoKHZhbCk7XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJlc3VsdFtpXSA9IGZuLmFwcGx5KHRoaXMsIHNsaWNlKTtcclxuXHRcdFx0fVxyXG5cdFx0XHRyZXR1cm4gcmVzdWx0O1xyXG5cdFx0fVxyXG5cdFx0ZWxzZSB7XHJcblx0XHRcdHJldHVybiBmbi5hcHBseSh0aGlzLCBhcmdzKTtcclxuXHRcdH1cclxuXHR9O1xyXG59OyJdfQ==
