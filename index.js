var css = require('mucss');
var m = require('mumath');

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
	var toRect = css.offsets(relativeTo);
	for (var i = els.length, el, s; i--;){
		el = els[i];

		//ignore self
		if (el === relativeTo) continue;

		s = getComputedStyle(el);

		//ensure element is at least relative, if it is static
		if (s.position === 'static') css(el, 'position', 'relative');


		//include margins
		var placeeMargins = css.margins(el);

		//get relativeTo & parent rectangles
		var parent = el.offsetParent || win;
		var parentRect = css.offsets(parent);
		var parentPaddings = css.paddings(parent);
		var parentBorders = css.borders(parent);

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