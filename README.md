# Aligner [![Code Climate](https://codeclimate.com/github/dfcreative/aligner/badges/gpa.svg)](https://codeclimate.com/github/dfcreative/aligner) <a href="UNLICENSE"><img src="http://upload.wikimedia.org/wikipedia/commons/6/62/PD-icon.svg" width="20"/></a>

Align DOM elements just like photoshop/illustrator alignment does.

```js
npm install aligner
```

```js
var align = require('aligner');

var els = document.querySelectorAll('div');

//align all elements by the left edge.
align(els, 'left');
```


## API

`align(elements, alignment?, relativeTo?)` - align element according to the params passed.

* `elements` - a set of elements to align
* `alignment` values: `'top'`, `'bottom'`, `'left'`, `'right'`, `'center'` (centered align by x), `'middle'` (centered align by y), a number [0..1] to align by x, or array [xAlign?, yAlign?], where alignment is a number [0..1]. Default is 0 (align left).
* `relativeTo` is an element to perform alignment relative to, by default it’s the first element in elements.





[![NPM](https://nodei.co/npm/aligner.png?downloads=true&downloadRank=true&stars=true)](https://nodei.co/npm/aligner/)