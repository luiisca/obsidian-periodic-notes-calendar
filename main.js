'use strict';

var obsidian = require('obsidian');

/** @returns {void} */
function noop() {}

function run(fn) {
	return fn();
}

function blank_object() {
	return Object.create(null);
}

/**
 * @param {Function[]} fns
 * @returns {void}
 */
function run_all(fns) {
	fns.forEach(run);
}

/**
 * @param {any} thing
 * @returns {thing is Function}
 */
function is_function(thing) {
	return typeof thing === 'function';
}

/** @returns {boolean} */
function safe_not_equal(a, b) {
	return a != a ? b == b : a !== b || (a && typeof a === 'object') || typeof a === 'function';
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @returns {void}
 */
function append(target, node) {
	target.appendChild(node);
}

/**
 * @param {Node} target
 * @param {string} style_sheet_id
 * @param {string} styles
 * @returns {void}
 */
function append_styles(target, style_sheet_id, styles) {
	const append_styles_to = get_root_for_style(target);
	if (!append_styles_to.getElementById(style_sheet_id)) {
		const style = element('style');
		style.id = style_sheet_id;
		style.textContent = styles;
		append_stylesheet(append_styles_to, style);
	}
}

/**
 * @param {Node} node
 * @returns {ShadowRoot | Document}
 */
function get_root_for_style(node) {
	if (!node) return document;
	const root = node.getRootNode ? node.getRootNode() : node.ownerDocument;
	if (root && /** @type {ShadowRoot} */ (root).host) {
		return /** @type {ShadowRoot} */ (root);
	}
	return node.ownerDocument;
}

/**
 * @param {ShadowRoot | Document} node
 * @param {HTMLStyleElement} style
 * @returns {CSSStyleSheet}
 */
function append_stylesheet(node, style) {
	append(/** @type {Document} */ (node).head || node, style);
	return style.sheet;
}

/**
 * @param {Node} target
 * @param {Node} node
 * @param {Node} [anchor]
 * @returns {void}
 */
function insert(target, node, anchor) {
	target.insertBefore(node, anchor || null);
}

/**
 * @param {Node} node
 * @returns {void}
 */
function detach(node) {
	if (node.parentNode) {
		node.parentNode.removeChild(node);
	}
}

/**
 * @template {keyof HTMLElementTagNameMap} K
 * @param {K} name
 * @returns {HTMLElementTagNameMap[K]}
 */
function element(name) {
	return document.createElement(name);
}

/**
 * @param {string} data
 * @returns {Text}
 */
function text(data) {
	return document.createTextNode(data);
}

/**
 * @returns {Text} */
function space() {
	return text(' ');
}

/**
 * @param {EventTarget} node
 * @param {string} event
 * @param {EventListenerOrEventListenerObject} handler
 * @param {boolean | AddEventListenerOptions | EventListenerOptions} [options]
 * @returns {() => void}
 */
function listen(node, event, handler, options) {
	node.addEventListener(event, handler, options);
	return () => node.removeEventListener(event, handler, options);
}

/**
 * @param {Element} node
 * @param {string} attribute
 * @param {string} [value]
 * @returns {void}
 */
function attr(node, attribute, value) {
	if (value == null) node.removeAttribute(attribute);
	else if (node.getAttribute(attribute) !== value) node.setAttribute(attribute, value);
}

/**
 * @param {Element} element
 * @returns {ChildNode[]}
 */
function children(element) {
	return Array.from(element.childNodes);
}

/**
 * @param {Text} text
 * @param {unknown} data
 * @returns {void}
 */
function set_data(text, data) {
	data = '' + data;
	if (text.data === data) return;
	text.data = /** @type {string} */ (data);
}

/**
 * @typedef {Node & {
 * 	claim_order?: number;
 * 	hydrate_init?: true;
 * 	actual_end_child?: NodeEx;
 * 	childNodes: NodeListOf<NodeEx>;
 * }} NodeEx
 */

/** @typedef {ChildNode & NodeEx} ChildNodeEx */

/** @typedef {NodeEx & { claim_order: number }} NodeEx2 */

/**
 * @typedef {ChildNodeEx[] & {
 * 	claim_info?: {
 * 		last_index: number;
 * 		total_claimed: number;
 * 	};
 * }} ChildNodeArray
 */

let current_component;

/** @returns {void} */
function set_current_component(component) {
	current_component = component;
}

const dirty_components = [];
const binding_callbacks = [];

let render_callbacks = [];

const flush_callbacks = [];

const resolved_promise = /* @__PURE__ */ Promise.resolve();

let update_scheduled = false;

/** @returns {void} */
function schedule_update() {
	if (!update_scheduled) {
		update_scheduled = true;
		resolved_promise.then(flush);
	}
}

/** @returns {void} */
function add_render_callback(fn) {
	render_callbacks.push(fn);
}

// flush() calls callbacks in this order:
// 1. All beforeUpdate callbacks, in order: parents before children
// 2. All bind:this callbacks, in reverse order: children before parents.
// 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
//    for afterUpdates called during the initial onMount, which are called in
//    reverse order: children before parents.
// Since callbacks might update component values, which could trigger another
// call to flush(), the following steps guard against this:
// 1. During beforeUpdate, any updated components will be added to the
//    dirty_components array and will cause a reentrant call to flush(). Because
//    the flush index is kept outside the function, the reentrant call will pick
//    up where the earlier call left off and go through all dirty components. The
//    current_component value is saved and restored so that the reentrant call will
//    not interfere with the "parent" flush() call.
// 2. bind:this callbacks cannot trigger new flush() calls.
// 3. During afterUpdate, any updated components will NOT have their afterUpdate
//    callback called a second time; the seen_callbacks set, outside the flush()
//    function, guarantees this behavior.
const seen_callbacks = new Set();

let flushidx = 0; // Do *not* move this inside the flush() function

/** @returns {void} */
function flush() {
	// Do not reenter flush while dirty components are updated, as this can
	// result in an infinite loop. Instead, let the inner flush handle it.
	// Reentrancy is ok afterwards for bindings etc.
	if (flushidx !== 0) {
		return;
	}
	const saved_component = current_component;
	do {
		// first, call beforeUpdate functions
		// and update components
		try {
			while (flushidx < dirty_components.length) {
				const component = dirty_components[flushidx];
				flushidx++;
				set_current_component(component);
				update(component.$$);
			}
		} catch (e) {
			// reset dirty state to not end up in a deadlocked state and then rethrow
			dirty_components.length = 0;
			flushidx = 0;
			throw e;
		}
		set_current_component(null);
		dirty_components.length = 0;
		flushidx = 0;
		while (binding_callbacks.length) binding_callbacks.pop()();
		// then, once components are updated, call
		// afterUpdate functions. This may cause
		// subsequent updates...
		for (let i = 0; i < render_callbacks.length; i += 1) {
			const callback = render_callbacks[i];
			if (!seen_callbacks.has(callback)) {
				// ...so guard against infinite loops
				seen_callbacks.add(callback);
				callback();
			}
		}
		render_callbacks.length = 0;
	} while (dirty_components.length);
	while (flush_callbacks.length) {
		flush_callbacks.pop()();
	}
	update_scheduled = false;
	seen_callbacks.clear();
	set_current_component(saved_component);
}

/** @returns {void} */
function update($$) {
	if ($$.fragment !== null) {
		$$.update();
		run_all($$.before_update);
		const dirty = $$.dirty;
		$$.dirty = [-1];
		$$.fragment && $$.fragment.p($$.ctx, dirty);
		$$.after_update.forEach(add_render_callback);
	}
}

/**
 * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
 * @param {Function[]} fns
 * @returns {void}
 */
function flush_render_callbacks(fns) {
	const filtered = [];
	const targets = [];
	render_callbacks.forEach((c) => (fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c)));
	targets.forEach((c) => c());
	render_callbacks = filtered;
}

const outroing = new Set();

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} [local]
 * @returns {void}
 */
function transition_in(block, local) {
	if (block && block.i) {
		outroing.delete(block);
		block.i(local);
	}
}

/** @typedef {1} INTRO */
/** @typedef {0} OUTRO */
/** @typedef {{ direction: 'in' | 'out' | 'both' }} TransitionOptions */
/** @typedef {(node: Element, params: any, options: TransitionOptions) => import('../transition/public.js').TransitionConfig} TransitionFn */

/**
 * @typedef {Object} Outro
 * @property {number} r
 * @property {Function[]} c
 * @property {Object} p
 */

/**
 * @typedef {Object} PendingProgram
 * @property {number} start
 * @property {INTRO|OUTRO} b
 * @property {Outro} [group]
 */

/**
 * @typedef {Object} Program
 * @property {number} a
 * @property {INTRO|OUTRO} b
 * @property {1|-1} d
 * @property {number} duration
 * @property {number} start
 * @property {number} end
 * @property {Outro} [group]
 */

/** @returns {void} */
function mount_component(component, target, anchor) {
	const { fragment, after_update } = component.$$;
	fragment && fragment.m(target, anchor);
	// onMount happens before the initial afterUpdate
	add_render_callback(() => {
		const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
		// if the component was destroyed immediately
		// it will update the `$$.on_destroy` reference to `null`.
		// the destructured on_destroy may still reference to the old array
		if (component.$$.on_destroy) {
			component.$$.on_destroy.push(...new_on_destroy);
		} else {
			// Edge case - component was destroyed immediately,
			// most likely as a result of a binding initialising
			run_all(new_on_destroy);
		}
		component.$$.on_mount = [];
	});
	after_update.forEach(add_render_callback);
}

/** @returns {void} */
function destroy_component(component, detaching) {
	const $$ = component.$$;
	if ($$.fragment !== null) {
		flush_render_callbacks($$.after_update);
		run_all($$.on_destroy);
		$$.fragment && $$.fragment.d(detaching);
		// TODO null out other refs, including component.$$ (but need to
		// preserve final state?)
		$$.on_destroy = $$.fragment = null;
		$$.ctx = [];
	}
}

/** @returns {void} */
function make_dirty(component, i) {
	if (component.$$.dirty[0] === -1) {
		dirty_components.push(component);
		schedule_update();
		component.$$.dirty.fill(0);
	}
	component.$$.dirty[(i / 31) | 0] |= 1 << i % 31;
}

/** @returns {void} */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles,
	dirty = [-1]
) {
	const parent_component = current_component;
	set_current_component(component);
	/** @type {import('./private.js').T$$} */
	const $$ = (component.$$ = {
		fragment: null,
		ctx: [],
		// state
		props,
		update: noop,
		not_equal,
		bound: blank_object(),
		// lifecycle
		on_mount: [],
		on_destroy: [],
		on_disconnect: [],
		before_update: [],
		after_update: [],
		context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
		// everything else
		callbacks: blank_object(),
		dirty,
		skip_bound: false,
		root: options.target || parent_component.$$.root
	});
	append_styles && append_styles($$.root);
	let ready = false;
	$$.ctx = instance
		? instance(component, options.props || {}, (i, ret, ...rest) => {
				const value = rest.length ? rest[0] : ret;
				if ($$.ctx && not_equal($$.ctx[i], ($$.ctx[i] = value))) {
					if (!$$.skip_bound && $$.bound[i]) $$.bound[i](value);
					if (ready) make_dirty(component, i);
				}
				return ret;
		  })
		: [];
	$$.update();
	ready = true;
	run_all($$.before_update);
	// `false` as a special case of no DOM component
	$$.fragment = create_fragment ? create_fragment($$.ctx) : false;
	if (options.target) {
		if (options.hydrate) {
			const nodes = children(options.target);
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.l(nodes);
			nodes.forEach(detach);
		} else {
			// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
			$$.fragment && $$.fragment.c();
		}
		if (options.intro) transition_in(component.$$.fragment);
		mount_component(component, options.target, options.anchor);
		flush();
	}
	set_current_component(parent_component);
}

/**
 * Base class for Svelte components. Used when dev=false.
 *
 * @template {Record<string, any>} [Props=any]
 * @template {Record<string, any>} [Events=any]
 */
class SvelteComponent {
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$ = undefined;
	/**
	 * ### PRIVATE API
	 *
	 * Do not use, may change at any time
	 *
	 * @type {any}
	 */
	$$set = undefined;

	/** @returns {void} */
	$destroy() {
		destroy_component(this, 1);
		this.$destroy = noop;
	}

	/**
	 * @template {Extract<keyof Events, string>} K
	 * @param {K} type
	 * @param {((e: Events[K]) => void) | null | undefined} callback
	 * @returns {() => void}
	 */
	$on(type, callback) {
		if (!is_function(callback)) {
			return noop;
		}
		const callbacks = this.$$.callbacks[type] || (this.$$.callbacks[type] = []);
		callbacks.push(callback);
		return () => {
			const index = callbacks.indexOf(callback);
			if (index !== -1) callbacks.splice(index, 1);
		};
	}

	/**
	 * @param {Partial<Props>} props
	 * @returns {void}
	 */
	$set(props) {
		if (this.$$set && !is_empty(props)) {
			this.$$.skip_bound = true;
			this.$$set(props);
			this.$$.skip_bound = false;
		}
	}
}

/**
 * @typedef {Object} CustomElementPropDefinition
 * @property {string} [attribute]
 * @property {boolean} [reflect]
 * @property {'String'|'Boolean'|'Number'|'Array'|'Object'} [type]
 */

// generated during release, do not modify

const PUBLIC_VERSION = '4';

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

/* src/ui/Component.svelte generated by Svelte v4.2.0 */

function add_css(target) {
	append_styles(target, "svelte-1ku5wee", ".svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee,.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::before,.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::before,.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::after{--tw-content:''}button.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;color:inherit;margin:0;padding:0}button.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{text-transform:none}button.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee:-moz-focusring{outline:auto}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee:-moz-ui-invalid{box-shadow:none}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::-webkit-inner-spin-button,.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::-webkit-outer-spin-button{height:auto}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::-webkit-search-decoration{-webkit-appearance:none}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}p.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{margin:0}button.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{cursor:pointer}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee:disabled{cursor:default}.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee,.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::before,.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  }.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  }.space-x-2.svelte-1ku5wee>.svelte-1ku5wee:not([hidden])~.svelte-1ku5wee:not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.5rem * var(--tw-space-x-reverse));margin-left:calc(0.5rem * calc(1 - var(--tw-space-x-reverse)))}.space-y-2.svelte-1ku5wee>.svelte-1ku5wee:not([hidden])~.svelte-1ku5wee:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.5rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.5rem * var(--tw-space-y-reverse))}.space-y-4.svelte-1ku5wee>.svelte-1ku5wee:not([hidden])~.svelte-1ku5wee:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(1rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(1rem * var(--tw-space-y-reverse))}.px-4.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{padding-left:1rem;padding-right:1rem}.py-1.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{padding-top:0.25rem;padding-bottom:0.25rem}.text-2xl.svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{font-size:1.5rem;line-height:2rem}.text-\\[--text-accent\\].svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{color:var(--text-accent)}.text-\\[--text-muted\\].svelte-1ku5wee.svelte-1ku5wee.svelte-1ku5wee{color:var(--text-muted)}");
}

function create_fragment(ctx) {
	let div2;
	let div0;
	let p0;
	let t0;
	let t1;
	let t2;
	let t3;
	let p1;
	let t5;
	let div1;
	let button0;
	let t7;
	let button1;
	let mounted;
	let dispose;

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			p0 = element("p");
			t0 = text("My number is ");
			t1 = text(/*variable*/ ctx[0]);
			t2 = text("!");
			t3 = space();
			p1 = element("p");
			p1.textContent = "Hello calendar!";
			t5 = space();
			div1 = element("div");
			button0 = element("button");
			button0.textContent = "-";
			t7 = space();
			button1 = element("button");
			button1.textContent = "+";
			attr(p0, "class", "text-2xl text-[--text-accent] svelte-1ku5wee");
			attr(p1, "class", "text-[--text-muted] svelte-1ku5wee");
			attr(div0, "class", "space-y-2 svelte-1ku5wee");
			attr(button0, "class", "px-4 py-1 svelte-1ku5wee");
			attr(button1, "class", "px-4 py-1 svelte-1ku5wee");
			attr(div1, "class", "space-x-2 svelte-1ku5wee");
			attr(div2, "class", "space-y-4 svelte-1ku5wee");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, p0);
			append(p0, t0);
			append(p0, t1);
			append(p0, t2);
			append(div0, t3);
			append(div0, p1);
			append(div2, t5);
			append(div2, div1);
			append(div1, button0);
			append(div1, t7);
			append(div1, button1);

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[1]),
					listen(button1, "click", /*click_handler_1*/ ctx[2])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*variable*/ 1) set_data(t1, /*variable*/ ctx[0]);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let { variable } = $$props;
	const click_handler = () => $$invalidate(0, variable -= 1);
	const click_handler_1 = () => $$invalidate(0, variable += 1);

	$$self.$$set = $$props => {
		if ('variable' in $$props) $$invalidate(0, variable = $$props.variable);
	};

	return [variable, click_handler, click_handler_1];
}

class Component extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { variable: 0 }, add_css);
	}
}

const VIEW_TYPE_EXAMPLE = "example-view";
class ExampleView extends obsidian.ItemView {
    component;
    constructor(leaf) {
        super(leaf);
    }
    getViewType() {
        return VIEW_TYPE_EXAMPLE;
    }
    getDisplayText() {
        return "Example view";
    }
    async onOpen() {
        this.component = new Component({
            target: this.contentEl,
            props: {
                variable: 1,
            }
        });
        console.log("On open view👐");
    }
    async onClose() {
        console.log('On close view❌');
        this.component.$destroy();
    }
}

const DEFAULT_SETTINGS = {
    mySetting: 'default'
};
class MyPlugin extends obsidian.Plugin {
    settings = DEFAULT_SETTINGS;
    view;
    onunload() {
        this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE).forEach((leaf) => leaf.detach());
    }
    async onload() {
        await this.loadSettings();
        this.handleRibbon();
        await this.handleView();
        this.addCommand({
            id: 'open-calendar-view',
            name: 'Open calendar view',
            callback: () => {
                this.toggleView();
            }
        });
    }
    async loadSettings() {
        this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    }
    async saveSettings() {
        await this.saveData(this.settings);
    }
    handleRibbon() {
        this.addRibbonIcon('dice', 'Sample Plugin', (evt) => {
            this.toggleView();
        });
    }
    async handleView() {
        // register view
        this.registerView(VIEW_TYPE_EXAMPLE, (leaf) => (this.view = new ExampleView(leaf)));
        // activate view
        await this.initView();
    }
    async initView({ active } = { active: true }) {
        this.app.workspace.detachLeavesOfType(VIEW_TYPE_EXAMPLE);
        await this.app.workspace.getLeftLeaf(false).setViewState({
            type: VIEW_TYPE_EXAMPLE,
            active
        });
    }
    revealView() {
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0]);
        this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0].setViewState({
            type: VIEW_TYPE_EXAMPLE,
            active: true
        });
    }
    async toggleView() {
        const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE_EXAMPLE)[0];
        if (!leaf) {
            await this.initView();
            this.revealView();
            return;
        }
        const ACTIVE_CLASSNAME = 'is-active';
        const WORKSPACE_SPLIT_CLASSNAME = '.workspace-split';
        // @ts-ignore
        const closestWorkspaceSplitClassName = leaf.containerEl.closest(WORKSPACE_SPLIT_CLASSNAME)
            .className;
        const leafSplit = (closestWorkspaceSplitClassName.match('right')?.[0] ||
            closestWorkspaceSplitClassName.match('left')?.[0] ||
            'root');
        // @ts-ignore
        const leafActive = leaf.tabHeaderEl.className.includes(ACTIVE_CLASSNAME);
        const leftSplit = this.app.workspace.leftSplit;
        const rightSplit = this.app.workspace.rightSplit;
        const leafSideDockOpen = leafSplit === 'left'
            ? !leftSplit.collapsed
            : leafSplit === 'right'
                ? !rightSplit.collapsed
                : false;
        // Scenarios
        if (leafSideDockOpen) {
            if (leafActive) {
                // 1. leaf sidedock open and leaf active -> close sidedock
                (leafSplit === 'left' && leftSplit.collapse()) ||
                    (leafSplit === 'right' && rightSplit.collapse());
                return;
            }
            if (!leafActive) {
                // 2. leaf sidedock open and leaf not active -> reveal view
                this.revealView();
                return;
            }
        }
        if (!leafSideDockOpen) {
            if (leafSplit === 'root' && leafActive) {
                // 4. root split open and leaf active -> close root split
                leaf.detach();
                await this.initView({ active: false });
                return;
            }
            // 3. leaf sidedock close -> open leaf sidedock and reveal view
            // 5. root split open and leaf not active -> reveal view
            this.revealView();
        }
    }
}

module.exports = MyPlugin;
