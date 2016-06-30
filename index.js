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
module.exports.toFloat = toFloat;


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
		xAlign = toFloat(alignment[0]);
		yAlign = toFloat(alignment[1]);
	}
	//catch y values
	else if (/top|middle|bottom/.test(alignment)) {
		yAlign = toFloat(alignment);
	}
	else {
		xAlign = toFloat(alignment);
	}


	//apply alignment
	var toRect = offsets(relativeTo);
	for (var i = els.length, el, s; i--;){
		el = els[i];

		if (el === window) continue;

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
		if ((parent === doc.body && getComputedStyle(parent).position === 'static') || parent === root ) {
			parentRect.left = 0;
			parentRect.top = 0;
		}
		parentRect = m.sub(parentRect, parentBorders);
		parentRect = m.add(parentRect, placeeMargins);
		// parentRect = m.add(parentRect, parentPaddings);

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
function toFloat(value){
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
		// throw Error('Alignment ' + value + 'is weird');
		return parseFloat(value);
	}

	return value;
}