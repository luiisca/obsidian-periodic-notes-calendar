'use strict';

var obsidian = require('obsidian');

/******************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */
/* global Reflect, Promise, SuppressedError, Symbol, Iterator */


function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

typeof SuppressedError === "function" ? SuppressedError : function (error, suppressed, message) {
    var e = new Error(message);
    return e.name = "SuppressedError", e.error = error, e.suppressed = suppressed, e;
};

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
function not_equal(a, b) {
	return a != a ? b == b : a !== b;
}

/** @returns {boolean} */
function is_empty(obj) {
	return Object.keys(obj).length === 0;
}

function subscribe(store, ...callbacks) {
	if (store == null) {
		for (const callback of callbacks) {
			callback(undefined);
		}
		return noop;
	}
	const unsub = store.subscribe(...callbacks);
	return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}

/**
 * Get the current value from a store by subscribing and immediately unsubscribing.
 *
 * https://svelte.dev/docs/svelte-store#get
 * @template T
 * @param {import('../store/public.js').Readable<T>} store
 * @returns {T}
 */
function get_store_value(store) {
	let value;
	subscribe(store, (_) => (value = _))();
	return value;
}

/** @returns {void} */
function component_subscribe(component, store, callback) {
	component.$$.on_destroy.push(subscribe(store, callback));
}

function null_to_empty(value) {
	return value == null ? '' : value;
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
 * @returns {void} */
function destroy_each(iterations, detaching) {
	for (let i = 0; i < iterations.length; i += 1) {
		if (iterations[i]) iterations[i].d(detaching);
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
 * @template {keyof SVGElementTagNameMap} K
 * @param {K} name
 * @returns {SVGElement}
 */
function svg_element(name) {
	return document.createElementNS('http://www.w3.org/2000/svg', name);
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
 * @returns {Text} */
function empty() {
	return text('');
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
 * @returns {void} */
function set_input_value(input, value) {
	input.value = value == null ? '' : value;
}

/**
 * @returns {void} */
function select_option(select, value, mounting) {
	for (let i = 0; i < select.options.length; i += 1) {
		const option = select.options[i];
		if (option.__value === value) {
			option.selected = true;
			return;
		}
	}
	if (!mounting || value !== undefined) {
		select.selectedIndex = -1; // no option should be selected
	}
}

function select_value(select) {
	const selected_option = select.querySelector(':checked');
	return selected_option && selected_option.__value;
}

/**
 * @returns {void} */
function toggle_class(element, name, toggle) {
	// The `!!` is required because an `undefined` flag means flipping the current state.
	element.classList.toggle(name, !!toggle);
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

function get_current_component() {
	if (!current_component) throw new Error('Function called outside component initialization');
	return current_component;
}

/**
 * The `onMount` function schedules a callback to run as soon as the component has been mounted to the DOM.
 * It must be called during the component's initialisation (but doesn't need to live *inside* the component;
 * it can be called from an external module).
 *
 * If a function is returned _synchronously_ from `onMount`, it will be called when the component is unmounted.
 *
 * `onMount` does not run inside a [server-side component](https://svelte.dev/docs#run-time-server-side-component-api).
 *
 * https://svelte.dev/docs/svelte#onmount
 * @template T
 * @param {() => import('./private.js').NotFunction<T> | Promise<import('./private.js').NotFunction<T>> | (() => any)} fn
 * @returns {void}
 */
function onMount(fn) {
	get_current_component().$$.on_mount.push(fn);
}

/**
 * Schedules a callback to run immediately before the component is unmounted.
 *
 * Out of `onMount`, `beforeUpdate`, `afterUpdate` and `onDestroy`, this is the
 * only one that runs inside a server-side component.
 *
 * https://svelte.dev/docs/svelte#ondestroy
 * @param {() => any} fn
 * @returns {void}
 */
function onDestroy(fn) {
	get_current_component().$$.on_destroy.push(fn);
}

/**
 * Associates an arbitrary `context` object with the current component and the specified `key`
 * and returns that object. The context is then available to children of the component
 * (including slotted content) with `getContext`.
 *
 * Like lifecycle functions, this must be called during component initialisation.
 *
 * https://svelte.dev/docs/svelte#setcontext
 * @template T
 * @param {any} key
 * @param {T} context
 * @returns {T}
 */
function setContext(key, context) {
	get_current_component().$$.context.set(key, context);
	return context;
}

/**
 * Retrieves the context that belongs to the closest parent component with the specified `key`.
 * Must be called during component initialisation.
 *
 * https://svelte.dev/docs/svelte#getcontext
 * @template T
 * @param {any} key
 * @returns {T}
 */
function getContext(key) {
	return get_current_component().$$.context.get(key);
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
 * @type {Outro}
 */
let outros;

/**
 * @returns {void} */
function group_outros() {
	outros = {
		r: 0,
		c: [],
		p: outros // parent group
	};
}

/**
 * @returns {void} */
function check_outros() {
	if (!outros.r) {
		run_all(outros.c);
	}
	outros = outros.p;
}

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

/**
 * @param {import('./private.js').Fragment} block
 * @param {0 | 1} local
 * @param {0 | 1} [detach]
 * @param {() => void} [callback]
 * @returns {void}
 */
function transition_out(block, local, detach, callback) {
	if (block && block.o) {
		if (outroing.has(block)) return;
		outroing.add(block);
		outros.c.push(() => {
			outroing.delete(block);
			if (callback) {
				if (detach) block.d(1);
				callback();
			}
		});
		block.o(local);
	} else if (callback) {
		callback();
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

// general each functions:

function ensure_array_like(array_like_or_iterator) {
	return array_like_or_iterator?.length !== undefined
		? array_like_or_iterator
		: Array.from(array_like_or_iterator);
}

/** @returns {void} */
function outro_and_destroy_block(block, lookup) {
	transition_out(block, 1, 1, () => {
		lookup.delete(block.key);
	});
}

/** @returns {any[]} */
function update_keyed_each(
	old_blocks,
	dirty,
	get_key,
	dynamic,
	ctx,
	list,
	lookup,
	node,
	destroy,
	create_each_block,
	next,
	get_context
) {
	let o = old_blocks.length;
	let n = list.length;
	let i = o;
	const old_indexes = {};
	while (i--) old_indexes[old_blocks[i].key] = i;
	const new_blocks = [];
	const new_lookup = new Map();
	const deltas = new Map();
	const updates = [];
	i = n;
	while (i--) {
		const child_ctx = get_context(ctx, list, i);
		const key = get_key(child_ctx);
		let block = lookup.get(key);
		if (!block) {
			block = create_each_block(key, child_ctx);
			block.c();
		} else if (dynamic) {
			// defer updates until all the DOM shuffling is done
			updates.push(() => block.p(child_ctx, dirty));
		}
		new_lookup.set(key, (new_blocks[i] = block));
		if (key in old_indexes) deltas.set(key, Math.abs(i - old_indexes[key]));
	}
	const will_move = new Set();
	const did_move = new Set();
	/** @returns {void} */
	function insert(block) {
		transition_in(block, 1);
		block.m(node, next);
		lookup.set(block.key, block);
		next = block.first;
		n--;
	}
	while (o && n) {
		const new_block = new_blocks[n - 1];
		const old_block = old_blocks[o - 1];
		const new_key = new_block.key;
		const old_key = old_block.key;
		if (new_block === old_block) {
			// do nothing
			next = new_block.first;
			o--;
			n--;
		} else if (!new_lookup.has(old_key)) {
			// remove old block
			destroy(old_block, lookup);
			o--;
		} else if (!lookup.has(new_key) || will_move.has(new_key)) {
			insert(new_block);
		} else if (did_move.has(old_key)) {
			o--;
		} else if (deltas.get(new_key) > deltas.get(old_key)) {
			did_move.add(new_key);
			insert(new_block);
		} else {
			will_move.add(old_key);
			o--;
		}
	}
	while (o--) {
		const old_block = old_blocks[o];
		if (!new_lookup.has(old_block.key)) destroy(old_block, lookup);
	}
	while (n) insert(new_blocks[n - 1]);
	run_all(updates);
	return new_blocks;
}

/** @returns {void} */
function create_component(block) {
	block && block.c();
}

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

// TODO: Document the other params
/**
 * @param {SvelteComponent} component
 * @param {import('./public.js').ComponentConstructorOptions} options
 *
 * @param {import('./utils.js')['not_equal']} not_equal Used to compare props and state values.
 * @param {(target: Element | ShadowRoot) => void} [append_styles] Function that appends styles to the DOM when the component is first initialised.
 * This will be the `add_css` function from the compiled component.
 *
 * @returns {void}
 */
function init(
	component,
	options,
	instance,
	create_fragment,
	not_equal,
	props,
	append_styles = null,
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
			// TODO: what is the correct type here?
			// @ts-expect-error
			const nodes = children(options.target);
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

const subscriber_queue = [];

/**
 * Create a `Writable` store that allows both updating and reading by subscription.
 *
 * https://svelte.dev/docs/svelte-store#writable
 * @template T
 * @param {T} [value] initial value
 * @param {import('./public.js').StartStopNotifier<T>} [start]
 * @returns {import('./public.js').Writable<T>}
 */
function writable(value, start = noop) {
	/** @type {import('./public.js').Unsubscriber} */
	let stop;
	/** @type {Set<import('./private.js').SubscribeInvalidateTuple<T>>} */
	const subscribers = new Set();
	/** @param {T} new_value
	 * @returns {void}
	 */
	function set(new_value) {
		if (safe_not_equal(value, new_value)) {
			value = new_value;
			if (stop) {
				// store is ready
				const run_queue = !subscriber_queue.length;
				for (const subscriber of subscribers) {
					subscriber[1]();
					subscriber_queue.push(subscriber, value);
				}
				if (run_queue) {
					for (let i = 0; i < subscriber_queue.length; i += 2) {
						subscriber_queue[i][0](subscriber_queue[i + 1]);
					}
					subscriber_queue.length = 0;
				}
			}
		}
	}

	/**
	 * @param {import('./public.js').Updater<T>} fn
	 * @returns {void}
	 */
	function update(fn) {
		set(fn(value));
	}

	/**
	 * @param {import('./public.js').Subscriber<T>} run
	 * @param {import('./private.js').Invalidator<T>} [invalidate]
	 * @returns {import('./public.js').Unsubscriber}
	 */
	function subscribe(run, invalidate = noop) {
		/** @type {import('./private.js').SubscribeInvalidateTuple<T>} */
		const subscriber = [run, invalidate];
		subscribers.add(subscriber);
		if (subscribers.size === 1) {
			stop = start(set, update) || noop;
		}
		run(value);
		return () => {
			subscribers.delete(subscriber);
			if (subscribers.size === 0 && stop) {
				stop();
				stop = null;
			}
		};
	}
	return { set, update, subscribe };
}

const VIEW_TYPE = 'periodic-notes-calendar-view';
const granularities = ['day', 'week', 'month', 'quarter', 'year'];
const togglePeriods = ['days', 'months', 'years'];
const monthsIndexesInQuarters = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [9, 10, 11]
];
const YEARS_RANGE_SIZE = 12;
const STICKER_TAG_PREFIX = '#sticker-';
const CALENDAR_POPOVER_ID = 'calendar-popover';
const STICKER_POPOVER_ID = 'sticker-popover';
const FILE_MENU_POPOVER_ID = 'file-menu-popover';
const MODAL_CLASS = 'modal';
const DEFAULT_DAILY_NOTE_FORMAT = "YYYY-MM-DD";
const DEFAULT_WEEKLY_NOTE_FORMAT = "gggg-[W]ww";
const DEFAULT_MONTHLY_NOTE_FORMAT = "YYYY-MM";
const DEFAULT_QUARTERLY_NOTE_FORMAT = "YYYY-[Q]Q";
const DEFAULT_YEARLY_NOTE_FORMAT = "YYYY";
const DEFAULT_FORMATS = {
    daily: DEFAULT_DAILY_NOTE_FORMAT,
    weekly: DEFAULT_WEEKLY_NOTE_FORMAT,
    monthly: DEFAULT_MONTHLY_NOTE_FORMAT,
    quarterly: DEFAULT_QUARTERLY_NOTE_FORMAT,
    yearly: DEFAULT_YEARLY_NOTE_FORMAT,
};
const PERIODIC_NOTES_PLUGIN_ID = 'periodic-notes';
const DAILY_NOTES_PLUGIN_ID = 'daily-notes';
const NLDATES_PLUGIN_ID = 'nldates-obsidian';

const localesMap = new Map();
const locales = [
    { key: 'af', name: 'Afrikaans' },
    { key: 'am', name: 'Amharic' },
    { key: 'ar-dz', name: 'Arabic (Algeria)' },
    { key: 'ar-iq', name: ' Arabic (Iraq)' },
    { key: 'ar-kw', name: 'Arabic (Kuwait)' },
    { key: 'ar-ly', name: 'Arabic (Lybia)' },
    { key: 'ar-ma', name: 'Arabic (Morocco)' },
    { key: 'ar-sa', name: 'Arabic (Saudi Arabia)' },
    { key: 'ar-tn', name: ' Arabic (Tunisia)' },
    { key: 'ar', name: 'Arabic' },
    { key: 'az', name: 'Azerbaijani' },
    { key: 'be', name: 'Belarusian' },
    { key: 'bg', name: 'Bulgarian' },
    { key: 'bi', name: 'Bislama' },
    { key: 'bm', name: 'Bambara' },
    { key: 'bn-bd', name: 'Bengali (Bangladesh)' },
    { key: 'bn', name: 'Bengali' },
    { key: 'bo', name: 'Tibetan' },
    { key: 'br', name: 'Breton' },
    { key: 'bs', name: 'Bosnian' },
    { key: 'ca', name: 'Catalan' },
    { key: 'cs', name: 'Czech' },
    { key: 'cv', name: 'Chuvash' },
    { key: 'cy', name: 'Welsh' },
    { key: 'da', name: 'Danish' },
    { key: 'de-at', name: 'German (Austria)' },
    { key: 'de-ch', name: 'German (Switzerland)' },
    { key: 'de', name: 'German' },
    { key: 'dv', name: 'Maldivian' },
    { key: 'el', name: 'Greek' },
    { key: 'en-au', name: 'English (Australia)' },
    { key: 'en-ca', name: 'English (Canada)' },
    { key: 'en-gb', name: 'English (United Kingdom)' },
    { key: 'en-ie', name: 'English (Ireland)' },
    { key: 'en-il', name: 'English (Israel)' },
    { key: 'en-in', name: 'English (India)' },
    { key: 'en-nz', name: 'English (New Zealand)' },
    { key: 'en-sg', name: 'English (Singapore)' },
    { key: 'en-tt', name: 'English (Trinidad & Tobago)' },
    { key: 'en', name: 'English' },
    { key: 'eo', name: 'Esperanto' },
    { key: 'es-do', name: 'Spanish (Dominican Republic)' },
    { key: 'es-mx', name: 'Spanish (Mexico)' },
    { key: 'es-pr', name: 'Spanish (Puerto Rico)' },
    { key: 'es-us', name: 'Spanish (United States)' },
    { key: 'es', name: 'Spanish' },
    { key: 'et', name: 'Estonian' },
    { key: 'eu', name: 'Basque' },
    { key: 'fa', name: 'Persian' },
    { key: 'fi', name: 'Finnish' },
    { key: 'fo', name: 'Faroese' },
    { key: 'fr-ca', name: 'French (Canada)' },
    { key: 'fr-ch', name: 'French (Switzerland)' },
    { key: 'fr', name: 'French' },
    { key: 'fy', name: 'Frisian' },
    { key: 'ga', name: 'Irish or Irish Gaelic' },
    { key: 'gd', name: 'Scottish Gaelic' },
    { key: 'gl', name: 'Galician' },
    { key: 'gom-latn', name: 'Konkani Latin script' },
    { key: 'gu', name: 'Gujarati' },
    { key: 'he', name: 'Hebrew' },
    { key: 'hi', name: 'Hindi' },
    { key: 'hr', name: 'Croatian' },
    { key: 'ht', name: 'Haitian Creole (Haiti)' },
    { key: 'hu', name: 'Hungarian' },
    { key: 'hy-am', name: 'Armenian' },
    { key: 'id', name: 'Indonesian' },
    { key: 'is', name: 'Icelandic' },
    { key: 'it-ch', name: 'Italian (Switzerland)' },
    { key: 'it', name: 'Italian' },
    { key: 'ja', name: 'Japanese' },
    { key: 'jv', name: 'Javanese' },
    { key: 'ka', name: 'Georgian' },
    { key: 'kk', name: 'Kazakh' },
    { key: 'km', name: 'Cambodian' },
    { key: 'kn', name: 'Kannada' },
    { key: 'ko', name: 'Korean' },
    { key: 'ku', name: 'Kurdish' },
    { key: 'ky', name: 'Kyrgyz' },
    { key: 'lb', name: 'Luxembourgish' },
    { key: 'lo', name: 'Lao' },
    { key: 'lt', name: 'Lithuanian' },
    { key: 'lv', name: 'Latvian' },
    { key: 'me', name: 'Montenegrin' },
    { key: 'mi', name: 'Maori' },
    { key: 'mk', name: 'Macedonian' },
    { key: 'ml', name: 'Malayalam' },
    { key: 'mn', name: 'Mongolian' },
    { key: 'mr', name: 'Marathi' },
    { key: 'ms-my', name: 'Malay' },
    { key: 'ms', name: 'Malay' },
    { key: 'mt', name: 'Maltese (Malta)' },
    { key: 'my', name: 'Burmese' },
    { key: 'nb', name: 'Norwegian Bokmål' },
    { key: 'ne', name: 'Nepalese' },
    { key: 'nl-be', name: 'Dutch (Belgium)' },
    { key: 'nl', name: 'Dutch' },
    { key: 'nn', name: 'Nynorsk' },
    { key: 'oc-lnc', name: 'Occitan, lengadocian dialecte' },
    { key: 'pa-in', name: 'Punjabi (India)' },
    { key: 'pl', name: 'Polish' },
    { key: 'pt-br', name: 'Portuguese (Brazil)' },
    { key: 'pt', name: 'Portuguese' },
    { key: 'rn', name: 'Kirundi' },
    { key: 'sd', name: 'Sindhi' },
    { key: 'se', name: 'Northern Sami' },
    { key: 'si', name: 'Sinhalese' },
    { key: 'sk', name: 'Slovak' },
    { key: 'sl', name: 'Slovenian' },
    { key: 'sq', name: 'Albanian' },
    { key: 'sr-cyrl', name: 'Serbian Cyrillic' },
    { key: 'sr', name: 'Serbian' },
    { key: 'ss', name: 'siSwati' },
    { key: 'sv-fi', name: 'Finland Swedish' },
    { key: 'sv', name: 'Swedish' },
    { key: 'sw', name: 'Swahili' },
    { key: 'ta', name: 'Tamil' },
    { key: 'te', name: 'Telugu' },
    { key: 'tet', name: 'Tetun Dili (East Timor)' },
    { key: 'tg', name: 'Tajik' },
    { key: 'th', name: 'Thai' },
    { key: 'tk', name: 'Turkmen' },
    { key: 'tl-ph', name: 'Tagalog (Philippines)' },
    { key: 'tlh', name: 'Klingon' },
    { key: 'tr', name: 'Turkish' },
    { key: 'tzl', name: 'Talossan' },
    { key: 'tzm-latn', name: 'Central Atlas Tamazight Latin' },
    { key: 'tzm', name: 'Central Atlas Tamazight' },
    { key: 'ug-cn', name: 'Uyghur (China)' },
    { key: 'uk', name: 'Ukrainian' },
    { key: 'ur', name: 'Urdu' },
    { key: 'uz-latn', name: 'Uzbek Latin' },
    { key: 'uz', name: 'Uzbek' },
    { key: 'vi', name: 'Vietnamese' },
    { key: 'x-pseudo', name: 'Pseudo' },
    { key: 'yo', name: 'Yoruba Nigeria' },
    { key: 'zh-cn', name: 'Chinese (China)' },
    { key: 'zh-hk', name: 'Chinese (Hong Kong)' },
    { key: 'zh-tw', name: 'Chinese (Taiwan)' },
    { key: 'zh', name: 'Chinese' },
    { key: 'rw', name: 'Kinyarwanda (Rwanda)' },
    { key: 'ru', name: 'Russian' },
    { key: 'ro', name: 'Romanian' }
];
locales.forEach((obj) => {
    localesMap.set(obj.key, obj.name);
});

const defaultWeekdays = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday'
];
const defaultWeekdaysShort = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const sysLocaleKey = navigator.languages.find((locale) => localesMap.has(locale.toLocaleLowerCase())) ||
    navigator.languages[0];
const sysLocaleMoment = window.moment().clone().locale(sysLocaleKey);
const sysWeekStartId = sysLocaleMoment.localeData().firstDayOfWeek();
defaultWeekdays[sysWeekStartId];

const DEFAULT_SETTINGS = Object.freeze({
    viewLeafPosition: 'Left',
    leafViewEnabled: false,
    shouldConfirmBeforeCreate: true,
    yearsRangesStart: 2020,
    autoHoverPreview: false,
    openPopoverOnRibbonHover: false,
    crrNldModalGranularity: 'day',
    localeSettings: {
        showWeekNums: false,
        showQuarterNums: false,
        localeOverride: sysLocaleKey,
        weekStartId: sysWeekStartId
    },
    popoversClosing: {
        closePopoversOneByOneOnClickOut: false,
        closePopoversOneByOneOnEscKeydown: true,
        closeOnEscStickerSearchInput: true
    },
    validFormats: {
        day: [DEFAULT_FORMATS.daily],
        week: [DEFAULT_FORMATS.weekly],
        month: [DEFAULT_FORMATS.monthly],
        quarter: [DEFAULT_FORMATS.quarterly],
        year: [DEFAULT_FORMATS.yearly],
    },
    allowLocalesSwitchFromCommandPalette: false,
    // formats: DEFAULT_FORMATS_SETTINGS
});

/**
 * Custom positioning reference element.
 * @see https://floating-ui.com/docs/virtual-elements
 */

const min = Math.min;
const max = Math.max;
const round = Math.round;
const floor = Math.floor;
const createCoords = v => ({
  x: v,
  y: v
});
const oppositeSideMap = {
  left: 'right',
  right: 'left',
  bottom: 'top',
  top: 'bottom'
};
const oppositeAlignmentMap = {
  start: 'end',
  end: 'start'
};
function clamp(start, value, end) {
  return max(start, min(value, end));
}
function evaluate(value, param) {
  return typeof value === 'function' ? value(param) : value;
}
function getSide(placement) {
  return placement.split('-')[0];
}
function getAlignment(placement) {
  return placement.split('-')[1];
}
function getOppositeAxis(axis) {
  return axis === 'x' ? 'y' : 'x';
}
function getAxisLength(axis) {
  return axis === 'y' ? 'height' : 'width';
}
function getSideAxis(placement) {
  return ['top', 'bottom'].includes(getSide(placement)) ? 'y' : 'x';
}
function getAlignmentAxis(placement) {
  return getOppositeAxis(getSideAxis(placement));
}
function getAlignmentSides(placement, rects, rtl) {
  if (rtl === void 0) {
    rtl = false;
  }
  const alignment = getAlignment(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const length = getAxisLength(alignmentAxis);
  let mainAlignmentSide = alignmentAxis === 'x' ? alignment === (rtl ? 'end' : 'start') ? 'right' : 'left' : alignment === 'start' ? 'bottom' : 'top';
  if (rects.reference[length] > rects.floating[length]) {
    mainAlignmentSide = getOppositePlacement(mainAlignmentSide);
  }
  return [mainAlignmentSide, getOppositePlacement(mainAlignmentSide)];
}
function getExpandedPlacements(placement) {
  const oppositePlacement = getOppositePlacement(placement);
  return [getOppositeAlignmentPlacement(placement), oppositePlacement, getOppositeAlignmentPlacement(oppositePlacement)];
}
function getOppositeAlignmentPlacement(placement) {
  return placement.replace(/start|end/g, alignment => oppositeAlignmentMap[alignment]);
}
function getSideList(side, isStart, rtl) {
  const lr = ['left', 'right'];
  const rl = ['right', 'left'];
  const tb = ['top', 'bottom'];
  const bt = ['bottom', 'top'];
  switch (side) {
    case 'top':
    case 'bottom':
      if (rtl) return isStart ? rl : lr;
      return isStart ? lr : rl;
    case 'left':
    case 'right':
      return isStart ? tb : bt;
    default:
      return [];
  }
}
function getOppositeAxisPlacements(placement, flipAlignment, direction, rtl) {
  const alignment = getAlignment(placement);
  let list = getSideList(getSide(placement), direction === 'start', rtl);
  if (alignment) {
    list = list.map(side => side + "-" + alignment);
    if (flipAlignment) {
      list = list.concat(list.map(getOppositeAlignmentPlacement));
    }
  }
  return list;
}
function getOppositePlacement(placement) {
  return placement.replace(/left|right|bottom|top/g, side => oppositeSideMap[side]);
}
function expandPaddingObject(padding) {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    ...padding
  };
}
function getPaddingObject(padding) {
  return typeof padding !== 'number' ? expandPaddingObject(padding) : {
    top: padding,
    right: padding,
    bottom: padding,
    left: padding
  };
}
function rectToClientRect(rect) {
  const {
    x,
    y,
    width,
    height
  } = rect;
  return {
    width,
    height,
    top: y,
    left: x,
    right: x + width,
    bottom: y + height,
    x,
    y
  };
}

function computeCoordsFromPlacement(_ref, placement, rtl) {
  let {
    reference,
    floating
  } = _ref;
  const sideAxis = getSideAxis(placement);
  const alignmentAxis = getAlignmentAxis(placement);
  const alignLength = getAxisLength(alignmentAxis);
  const side = getSide(placement);
  const isVertical = sideAxis === 'y';
  const commonX = reference.x + reference.width / 2 - floating.width / 2;
  const commonY = reference.y + reference.height / 2 - floating.height / 2;
  const commonAlign = reference[alignLength] / 2 - floating[alignLength] / 2;
  let coords;
  switch (side) {
    case 'top':
      coords = {
        x: commonX,
        y: reference.y - floating.height
      };
      break;
    case 'bottom':
      coords = {
        x: commonX,
        y: reference.y + reference.height
      };
      break;
    case 'right':
      coords = {
        x: reference.x + reference.width,
        y: commonY
      };
      break;
    case 'left':
      coords = {
        x: reference.x - floating.width,
        y: commonY
      };
      break;
    default:
      coords = {
        x: reference.x,
        y: reference.y
      };
  }
  switch (getAlignment(placement)) {
    case 'start':
      coords[alignmentAxis] -= commonAlign * (rtl && isVertical ? -1 : 1);
      break;
    case 'end':
      coords[alignmentAxis] += commonAlign * (rtl && isVertical ? -1 : 1);
      break;
  }
  return coords;
}

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 *
 * This export does not have any `platform` interface logic. You will need to
 * write one for the platform you are using Floating UI with.
 */
const computePosition$1 = async (reference, floating, config) => {
  const {
    placement = 'bottom',
    strategy = 'absolute',
    middleware = [],
    platform
  } = config;
  const validMiddleware = middleware.filter(Boolean);
  const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(floating));
  let rects = await platform.getElementRects({
    reference,
    floating,
    strategy
  });
  let {
    x,
    y
  } = computeCoordsFromPlacement(rects, placement, rtl);
  let statefulPlacement = placement;
  let middlewareData = {};
  let resetCount = 0;
  for (let i = 0; i < validMiddleware.length; i++) {
    const {
      name,
      fn
    } = validMiddleware[i];
    const {
      x: nextX,
      y: nextY,
      data,
      reset
    } = await fn({
      x,
      y,
      initialPlacement: placement,
      placement: statefulPlacement,
      strategy,
      middlewareData,
      rects,
      platform,
      elements: {
        reference,
        floating
      }
    });
    x = nextX != null ? nextX : x;
    y = nextY != null ? nextY : y;
    middlewareData = {
      ...middlewareData,
      [name]: {
        ...middlewareData[name],
        ...data
      }
    };
    if (reset && resetCount <= 50) {
      resetCount++;
      if (typeof reset === 'object') {
        if (reset.placement) {
          statefulPlacement = reset.placement;
        }
        if (reset.rects) {
          rects = reset.rects === true ? await platform.getElementRects({
            reference,
            floating,
            strategy
          }) : reset.rects;
        }
        ({
          x,
          y
        } = computeCoordsFromPlacement(rects, statefulPlacement, rtl));
      }
      i = -1;
    }
  }
  return {
    x,
    y,
    placement: statefulPlacement,
    strategy,
    middlewareData
  };
};

/**
 * Resolves with an object of overflow side offsets that determine how much the
 * element is overflowing a given clipping boundary on each side.
 * - positive = overflowing the boundary by that number of pixels
 * - negative = how many pixels left before it will overflow
 * - 0 = lies flush with the boundary
 * @see https://floating-ui.com/docs/detectOverflow
 */
async function detectOverflow(state, options) {
  var _await$platform$isEle;
  if (options === void 0) {
    options = {};
  }
  const {
    x,
    y,
    platform,
    rects,
    elements,
    strategy
  } = state;
  const {
    boundary = 'clippingAncestors',
    rootBoundary = 'viewport',
    elementContext = 'floating',
    altBoundary = false,
    padding = 0
  } = evaluate(options, state);
  const paddingObject = getPaddingObject(padding);
  const altContext = elementContext === 'floating' ? 'reference' : 'floating';
  const element = elements[altBoundary ? altContext : elementContext];
  const clippingClientRect = rectToClientRect(await platform.getClippingRect({
    element: ((_await$platform$isEle = await (platform.isElement == null ? void 0 : platform.isElement(element))) != null ? _await$platform$isEle : true) ? element : element.contextElement || (await (platform.getDocumentElement == null ? void 0 : platform.getDocumentElement(elements.floating))),
    boundary,
    rootBoundary,
    strategy
  }));
  const rect = elementContext === 'floating' ? {
    x,
    y,
    width: rects.floating.width,
    height: rects.floating.height
  } : rects.reference;
  const offsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(elements.floating));
  const offsetScale = (await (platform.isElement == null ? void 0 : platform.isElement(offsetParent))) ? (await (platform.getScale == null ? void 0 : platform.getScale(offsetParent))) || {
    x: 1,
    y: 1
  } : {
    x: 1,
    y: 1
  };
  const elementClientRect = rectToClientRect(platform.convertOffsetParentRelativeRectToViewportRelativeRect ? await platform.convertOffsetParentRelativeRectToViewportRelativeRect({
    elements,
    rect,
    offsetParent,
    strategy
  }) : rect);
  return {
    top: (clippingClientRect.top - elementClientRect.top + paddingObject.top) / offsetScale.y,
    bottom: (elementClientRect.bottom - clippingClientRect.bottom + paddingObject.bottom) / offsetScale.y,
    left: (clippingClientRect.left - elementClientRect.left + paddingObject.left) / offsetScale.x,
    right: (elementClientRect.right - clippingClientRect.right + paddingObject.right) / offsetScale.x
  };
}

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow$1 = options => ({
  name: 'arrow',
  options,
  async fn(state) {
    const {
      x,
      y,
      placement,
      rects,
      platform,
      elements,
      middlewareData
    } = state;
    // Since `element` is required, we don't Partial<> the type.
    const {
      element,
      padding = 0
    } = evaluate(options, state) || {};
    if (element == null) {
      return {};
    }
    const paddingObject = getPaddingObject(padding);
    const coords = {
      x,
      y
    };
    const axis = getAlignmentAxis(placement);
    const length = getAxisLength(axis);
    const arrowDimensions = await platform.getDimensions(element);
    const isYAxis = axis === 'y';
    const minProp = isYAxis ? 'top' : 'left';
    const maxProp = isYAxis ? 'bottom' : 'right';
    const clientProp = isYAxis ? 'clientHeight' : 'clientWidth';
    const endDiff = rects.reference[length] + rects.reference[axis] - coords[axis] - rects.floating[length];
    const startDiff = coords[axis] - rects.reference[axis];
    const arrowOffsetParent = await (platform.getOffsetParent == null ? void 0 : platform.getOffsetParent(element));
    let clientSize = arrowOffsetParent ? arrowOffsetParent[clientProp] : 0;

    // DOM platform can return `window` as the `offsetParent`.
    if (!clientSize || !(await (platform.isElement == null ? void 0 : platform.isElement(arrowOffsetParent)))) {
      clientSize = elements.floating[clientProp] || rects.floating[length];
    }
    const centerToReference = endDiff / 2 - startDiff / 2;

    // If the padding is large enough that it causes the arrow to no longer be
    // centered, modify the padding so that it is centered.
    const largestPossiblePadding = clientSize / 2 - arrowDimensions[length] / 2 - 1;
    const minPadding = min(paddingObject[minProp], largestPossiblePadding);
    const maxPadding = min(paddingObject[maxProp], largestPossiblePadding);

    // Make sure the arrow doesn't overflow the floating element if the center
    // point is outside the floating element's bounds.
    const min$1 = minPadding;
    const max = clientSize - arrowDimensions[length] - maxPadding;
    const center = clientSize / 2 - arrowDimensions[length] / 2 + centerToReference;
    const offset = clamp(min$1, center, max);

    // If the reference is small enough that the arrow's padding causes it to
    // to point to nothing for an aligned placement, adjust the offset of the
    // floating element itself. To ensure `shift()` continues to take action,
    // a single reset is performed when this is true.
    const shouldAddOffset = !middlewareData.arrow && getAlignment(placement) != null && center !== offset && rects.reference[length] / 2 - (center < min$1 ? minPadding : maxPadding) - arrowDimensions[length] / 2 < 0;
    const alignmentOffset = shouldAddOffset ? center < min$1 ? center - min$1 : center - max : 0;
    return {
      [axis]: coords[axis] + alignmentOffset,
      data: {
        [axis]: offset,
        centerOffset: center - offset - alignmentOffset,
        ...(shouldAddOffset && {
          alignmentOffset
        })
      },
      reset: shouldAddOffset
    };
  }
});

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip$1 = function (options) {
  if (options === void 0) {
    options = {};
  }
  return {
    name: 'flip',
    options,
    async fn(state) {
      var _middlewareData$arrow, _middlewareData$flip;
      const {
        placement,
        middlewareData,
        rects,
        initialPlacement,
        platform,
        elements
      } = state;
      const {
        mainAxis: checkMainAxis = true,
        crossAxis: checkCrossAxis = true,
        fallbackPlacements: specifiedFallbackPlacements,
        fallbackStrategy = 'bestFit',
        fallbackAxisSideDirection = 'none',
        flipAlignment = true,
        ...detectOverflowOptions
      } = evaluate(options, state);

      // If a reset by the arrow was caused due to an alignment offset being
      // added, we should skip any logic now since `flip()` has already done its
      // work.
      // https://github.com/floating-ui/floating-ui/issues/2549#issuecomment-1719601643
      if ((_middlewareData$arrow = middlewareData.arrow) != null && _middlewareData$arrow.alignmentOffset) {
        return {};
      }
      const side = getSide(placement);
      const initialSideAxis = getSideAxis(initialPlacement);
      const isBasePlacement = getSide(initialPlacement) === initialPlacement;
      const rtl = await (platform.isRTL == null ? void 0 : platform.isRTL(elements.floating));
      const fallbackPlacements = specifiedFallbackPlacements || (isBasePlacement || !flipAlignment ? [getOppositePlacement(initialPlacement)] : getExpandedPlacements(initialPlacement));
      const hasFallbackAxisSideDirection = fallbackAxisSideDirection !== 'none';
      if (!specifiedFallbackPlacements && hasFallbackAxisSideDirection) {
        fallbackPlacements.push(...getOppositeAxisPlacements(initialPlacement, flipAlignment, fallbackAxisSideDirection, rtl));
      }
      const placements = [initialPlacement, ...fallbackPlacements];
      const overflow = await detectOverflow(state, detectOverflowOptions);
      const overflows = [];
      let overflowsData = ((_middlewareData$flip = middlewareData.flip) == null ? void 0 : _middlewareData$flip.overflows) || [];
      if (checkMainAxis) {
        overflows.push(overflow[side]);
      }
      if (checkCrossAxis) {
        const sides = getAlignmentSides(placement, rects, rtl);
        overflows.push(overflow[sides[0]], overflow[sides[1]]);
      }
      overflowsData = [...overflowsData, {
        placement,
        overflows
      }];

      // One or more sides is overflowing.
      if (!overflows.every(side => side <= 0)) {
        var _middlewareData$flip2, _overflowsData$filter;
        const nextIndex = (((_middlewareData$flip2 = middlewareData.flip) == null ? void 0 : _middlewareData$flip2.index) || 0) + 1;
        const nextPlacement = placements[nextIndex];
        if (nextPlacement) {
          // Try next placement and re-run the lifecycle.
          return {
            data: {
              index: nextIndex,
              overflows: overflowsData
            },
            reset: {
              placement: nextPlacement
            }
          };
        }

        // First, find the candidates that fit on the mainAxis side of overflow,
        // then find the placement that fits the best on the main crossAxis side.
        let resetPlacement = (_overflowsData$filter = overflowsData.filter(d => d.overflows[0] <= 0).sort((a, b) => a.overflows[1] - b.overflows[1])[0]) == null ? void 0 : _overflowsData$filter.placement;

        // Otherwise fallback.
        if (!resetPlacement) {
          switch (fallbackStrategy) {
            case 'bestFit':
              {
                var _overflowsData$filter2;
                const placement = (_overflowsData$filter2 = overflowsData.filter(d => {
                  if (hasFallbackAxisSideDirection) {
                    const currentSideAxis = getSideAxis(d.placement);
                    return currentSideAxis === initialSideAxis ||
                    // Create a bias to the `y` side axis due to horizontal
                    // reading directions favoring greater width.
                    currentSideAxis === 'y';
                  }
                  return true;
                }).map(d => [d.placement, d.overflows.filter(overflow => overflow > 0).reduce((acc, overflow) => acc + overflow, 0)]).sort((a, b) => a[1] - b[1])[0]) == null ? void 0 : _overflowsData$filter2[0];
                if (placement) {
                  resetPlacement = placement;
                }
                break;
              }
            case 'initialPlacement':
              resetPlacement = initialPlacement;
              break;
          }
        }
        if (placement !== resetPlacement) {
          return {
            reset: {
              placement: resetPlacement
            }
          };
        }
      }
      return {};
    }
  };
};

function getNodeName(node) {
  if (isNode(node)) {
    return (node.nodeName || '').toLowerCase();
  }
  // Mocked nodes in testing environments may not be instances of Node. By
  // returning `#document` an infinite loop won't occur.
  // https://github.com/floating-ui/floating-ui/issues/2317
  return '#document';
}
function getWindow(node) {
  var _node$ownerDocument;
  return (node == null || (_node$ownerDocument = node.ownerDocument) == null ? void 0 : _node$ownerDocument.defaultView) || window;
}
function getDocumentElement(node) {
  var _ref;
  return (_ref = (isNode(node) ? node.ownerDocument : node.document) || window.document) == null ? void 0 : _ref.documentElement;
}
function isNode(value) {
  return value instanceof Node || value instanceof getWindow(value).Node;
}
function isElement(value) {
  return value instanceof Element || value instanceof getWindow(value).Element;
}
function isHTMLElement(value) {
  return value instanceof HTMLElement || value instanceof getWindow(value).HTMLElement;
}
function isShadowRoot(value) {
  // Browsers without `ShadowRoot` support.
  if (typeof ShadowRoot === 'undefined') {
    return false;
  }
  return value instanceof ShadowRoot || value instanceof getWindow(value).ShadowRoot;
}
function isOverflowElement(element) {
  const {
    overflow,
    overflowX,
    overflowY,
    display
  } = getComputedStyle(element);
  return /auto|scroll|overlay|hidden|clip/.test(overflow + overflowY + overflowX) && !['inline', 'contents'].includes(display);
}
function isTableElement(element) {
  return ['table', 'td', 'th'].includes(getNodeName(element));
}
function isTopLayer(element) {
  return [':popover-open', ':modal'].some(selector => {
    try {
      return element.matches(selector);
    } catch (e) {
      return false;
    }
  });
}
function isContainingBlock(elementOrCss) {
  const webkit = isWebKit();
  const css = isElement(elementOrCss) ? getComputedStyle(elementOrCss) : elementOrCss;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  return css.transform !== 'none' || css.perspective !== 'none' || (css.containerType ? css.containerType !== 'normal' : false) || !webkit && (css.backdropFilter ? css.backdropFilter !== 'none' : false) || !webkit && (css.filter ? css.filter !== 'none' : false) || ['transform', 'perspective', 'filter'].some(value => (css.willChange || '').includes(value)) || ['paint', 'layout', 'strict', 'content'].some(value => (css.contain || '').includes(value));
}
function getContainingBlock(element) {
  let currentNode = getParentNode(element);
  while (isHTMLElement(currentNode) && !isLastTraversableNode(currentNode)) {
    if (isContainingBlock(currentNode)) {
      return currentNode;
    } else if (isTopLayer(currentNode)) {
      return null;
    }
    currentNode = getParentNode(currentNode);
  }
  return null;
}
function isWebKit() {
  if (typeof CSS === 'undefined' || !CSS.supports) return false;
  return CSS.supports('-webkit-backdrop-filter', 'none');
}
function isLastTraversableNode(node) {
  return ['html', 'body', '#document'].includes(getNodeName(node));
}
function getComputedStyle(element) {
  return getWindow(element).getComputedStyle(element);
}
function getNodeScroll(element) {
  if (isElement(element)) {
    return {
      scrollLeft: element.scrollLeft,
      scrollTop: element.scrollTop
    };
  }
  return {
    scrollLeft: element.scrollX,
    scrollTop: element.scrollY
  };
}
function getParentNode(node) {
  if (getNodeName(node) === 'html') {
    return node;
  }
  const result =
  // Step into the shadow DOM of the parent of a slotted node.
  node.assignedSlot ||
  // DOM Element detected.
  node.parentNode ||
  // ShadowRoot detected.
  isShadowRoot(node) && node.host ||
  // Fallback.
  getDocumentElement(node);
  return isShadowRoot(result) ? result.host : result;
}
function getNearestOverflowAncestor(node) {
  const parentNode = getParentNode(node);
  if (isLastTraversableNode(parentNode)) {
    return node.ownerDocument ? node.ownerDocument.body : node.body;
  }
  if (isHTMLElement(parentNode) && isOverflowElement(parentNode)) {
    return parentNode;
  }
  return getNearestOverflowAncestor(parentNode);
}
function getOverflowAncestors(node, list, traverseIframes) {
  var _node$ownerDocument2;
  if (list === void 0) {
    list = [];
  }
  if (traverseIframes === void 0) {
    traverseIframes = true;
  }
  const scrollableAncestor = getNearestOverflowAncestor(node);
  const isBody = scrollableAncestor === ((_node$ownerDocument2 = node.ownerDocument) == null ? void 0 : _node$ownerDocument2.body);
  const win = getWindow(scrollableAncestor);
  if (isBody) {
    const frameElement = getFrameElement(win);
    return list.concat(win, win.visualViewport || [], isOverflowElement(scrollableAncestor) ? scrollableAncestor : [], frameElement && traverseIframes ? getOverflowAncestors(frameElement) : []);
  }
  return list.concat(scrollableAncestor, getOverflowAncestors(scrollableAncestor, [], traverseIframes));
}
function getFrameElement(win) {
  return win.parent && Object.getPrototypeOf(win.parent) ? win.frameElement : null;
}

function getCssDimensions(element) {
  const css = getComputedStyle(element);
  // In testing environments, the `width` and `height` properties are empty
  // strings for SVG elements, returning NaN. Fallback to `0` in this case.
  let width = parseFloat(css.width) || 0;
  let height = parseFloat(css.height) || 0;
  const hasOffset = isHTMLElement(element);
  const offsetWidth = hasOffset ? element.offsetWidth : width;
  const offsetHeight = hasOffset ? element.offsetHeight : height;
  const shouldFallback = round(width) !== offsetWidth || round(height) !== offsetHeight;
  if (shouldFallback) {
    width = offsetWidth;
    height = offsetHeight;
  }
  return {
    width,
    height,
    $: shouldFallback
  };
}

function unwrapElement(element) {
  return !isElement(element) ? element.contextElement : element;
}

function getScale(element) {
  const domElement = unwrapElement(element);
  if (!isHTMLElement(domElement)) {
    return createCoords(1);
  }
  const rect = domElement.getBoundingClientRect();
  const {
    width,
    height,
    $
  } = getCssDimensions(domElement);
  let x = ($ ? round(rect.width) : rect.width) / width;
  let y = ($ ? round(rect.height) : rect.height) / height;

  // 0, NaN, or Infinity should always fallback to 1.

  if (!x || !Number.isFinite(x)) {
    x = 1;
  }
  if (!y || !Number.isFinite(y)) {
    y = 1;
  }
  return {
    x,
    y
  };
}

const noOffsets = /*#__PURE__*/createCoords(0);
function getVisualOffsets(element) {
  const win = getWindow(element);
  if (!isWebKit() || !win.visualViewport) {
    return noOffsets;
  }
  return {
    x: win.visualViewport.offsetLeft,
    y: win.visualViewport.offsetTop
  };
}
function shouldAddVisualOffsets(element, isFixed, floatingOffsetParent) {
  if (isFixed === void 0) {
    isFixed = false;
  }
  if (!floatingOffsetParent || isFixed && floatingOffsetParent !== getWindow(element)) {
    return false;
  }
  return isFixed;
}

function getBoundingClientRect(element, includeScale, isFixedStrategy, offsetParent) {
  if (includeScale === void 0) {
    includeScale = false;
  }
  if (isFixedStrategy === void 0) {
    isFixedStrategy = false;
  }
  const clientRect = element.getBoundingClientRect();
  const domElement = unwrapElement(element);
  let scale = createCoords(1);
  if (includeScale) {
    if (offsetParent) {
      if (isElement(offsetParent)) {
        scale = getScale(offsetParent);
      }
    } else {
      scale = getScale(element);
    }
  }
  const visualOffsets = shouldAddVisualOffsets(domElement, isFixedStrategy, offsetParent) ? getVisualOffsets(domElement) : createCoords(0);
  let x = (clientRect.left + visualOffsets.x) / scale.x;
  let y = (clientRect.top + visualOffsets.y) / scale.y;
  let width = clientRect.width / scale.x;
  let height = clientRect.height / scale.y;
  if (domElement) {
    const win = getWindow(domElement);
    const offsetWin = offsetParent && isElement(offsetParent) ? getWindow(offsetParent) : offsetParent;
    let currentWin = win;
    let currentIFrame = getFrameElement(currentWin);
    while (currentIFrame && offsetParent && offsetWin !== currentWin) {
      const iframeScale = getScale(currentIFrame);
      const iframeRect = currentIFrame.getBoundingClientRect();
      const css = getComputedStyle(currentIFrame);
      const left = iframeRect.left + (currentIFrame.clientLeft + parseFloat(css.paddingLeft)) * iframeScale.x;
      const top = iframeRect.top + (currentIFrame.clientTop + parseFloat(css.paddingTop)) * iframeScale.y;
      x *= iframeScale.x;
      y *= iframeScale.y;
      width *= iframeScale.x;
      height *= iframeScale.y;
      x += left;
      y += top;
      currentWin = getWindow(currentIFrame);
      currentIFrame = getFrameElement(currentWin);
    }
  }
  return rectToClientRect({
    width,
    height,
    x,
    y
  });
}

function convertOffsetParentRelativeRectToViewportRelativeRect(_ref) {
  let {
    elements,
    rect,
    offsetParent,
    strategy
  } = _ref;
  const isFixed = strategy === 'fixed';
  const documentElement = getDocumentElement(offsetParent);
  const topLayer = elements ? isTopLayer(elements.floating) : false;
  if (offsetParent === documentElement || topLayer && isFixed) {
    return rect;
  }
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  let scale = createCoords(1);
  const offsets = createCoords(0);
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isHTMLElement(offsetParent)) {
      const offsetRect = getBoundingClientRect(offsetParent);
      scale = getScale(offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    }
  }
  return {
    width: rect.width * scale.x,
    height: rect.height * scale.y,
    x: rect.x * scale.x - scroll.scrollLeft * scale.x + offsets.x,
    y: rect.y * scale.y - scroll.scrollTop * scale.y + offsets.y
  };
}

function getClientRects(element) {
  return Array.from(element.getClientRects());
}

function getWindowScrollBarX(element) {
  // If <html> has a CSS width greater than the viewport, then this will be
  // incorrect for RTL.
  return getBoundingClientRect(getDocumentElement(element)).left + getNodeScroll(element).scrollLeft;
}

// Gets the entire size of the scrollable document area, even extending outside
// of the `<html>` and `<body>` rect bounds if horizontally scrollable.
function getDocumentRect(element) {
  const html = getDocumentElement(element);
  const scroll = getNodeScroll(element);
  const body = element.ownerDocument.body;
  const width = max(html.scrollWidth, html.clientWidth, body.scrollWidth, body.clientWidth);
  const height = max(html.scrollHeight, html.clientHeight, body.scrollHeight, body.clientHeight);
  let x = -scroll.scrollLeft + getWindowScrollBarX(element);
  const y = -scroll.scrollTop;
  if (getComputedStyle(body).direction === 'rtl') {
    x += max(html.clientWidth, body.clientWidth) - width;
  }
  return {
    width,
    height,
    x,
    y
  };
}

function getViewportRect(element, strategy) {
  const win = getWindow(element);
  const html = getDocumentElement(element);
  const visualViewport = win.visualViewport;
  let width = html.clientWidth;
  let height = html.clientHeight;
  let x = 0;
  let y = 0;
  if (visualViewport) {
    width = visualViewport.width;
    height = visualViewport.height;
    const visualViewportBased = isWebKit();
    if (!visualViewportBased || visualViewportBased && strategy === 'fixed') {
      x = visualViewport.offsetLeft;
      y = visualViewport.offsetTop;
    }
  }
  return {
    width,
    height,
    x,
    y
  };
}

// Returns the inner client rect, subtracting scrollbars if present.
function getInnerBoundingClientRect(element, strategy) {
  const clientRect = getBoundingClientRect(element, true, strategy === 'fixed');
  const top = clientRect.top + element.clientTop;
  const left = clientRect.left + element.clientLeft;
  const scale = isHTMLElement(element) ? getScale(element) : createCoords(1);
  const width = element.clientWidth * scale.x;
  const height = element.clientHeight * scale.y;
  const x = left * scale.x;
  const y = top * scale.y;
  return {
    width,
    height,
    x,
    y
  };
}
function getClientRectFromClippingAncestor(element, clippingAncestor, strategy) {
  let rect;
  if (clippingAncestor === 'viewport') {
    rect = getViewportRect(element, strategy);
  } else if (clippingAncestor === 'document') {
    rect = getDocumentRect(getDocumentElement(element));
  } else if (isElement(clippingAncestor)) {
    rect = getInnerBoundingClientRect(clippingAncestor, strategy);
  } else {
    const visualOffsets = getVisualOffsets(element);
    rect = {
      ...clippingAncestor,
      x: clippingAncestor.x - visualOffsets.x,
      y: clippingAncestor.y - visualOffsets.y
    };
  }
  return rectToClientRect(rect);
}
function hasFixedPositionAncestor(element, stopNode) {
  const parentNode = getParentNode(element);
  if (parentNode === stopNode || !isElement(parentNode) || isLastTraversableNode(parentNode)) {
    return false;
  }
  return getComputedStyle(parentNode).position === 'fixed' || hasFixedPositionAncestor(parentNode, stopNode);
}

// A "clipping ancestor" is an `overflow` element with the characteristic of
// clipping (or hiding) child elements. This returns all clipping ancestors
// of the given element up the tree.
function getClippingElementAncestors(element, cache) {
  const cachedResult = cache.get(element);
  if (cachedResult) {
    return cachedResult;
  }
  let result = getOverflowAncestors(element, [], false).filter(el => isElement(el) && getNodeName(el) !== 'body');
  let currentContainingBlockComputedStyle = null;
  const elementIsFixed = getComputedStyle(element).position === 'fixed';
  let currentNode = elementIsFixed ? getParentNode(element) : element;

  // https://developer.mozilla.org/en-US/docs/Web/CSS/Containing_block#identifying_the_containing_block
  while (isElement(currentNode) && !isLastTraversableNode(currentNode)) {
    const computedStyle = getComputedStyle(currentNode);
    const currentNodeIsContaining = isContainingBlock(currentNode);
    if (!currentNodeIsContaining && computedStyle.position === 'fixed') {
      currentContainingBlockComputedStyle = null;
    }
    const shouldDropCurrentNode = elementIsFixed ? !currentNodeIsContaining && !currentContainingBlockComputedStyle : !currentNodeIsContaining && computedStyle.position === 'static' && !!currentContainingBlockComputedStyle && ['absolute', 'fixed'].includes(currentContainingBlockComputedStyle.position) || isOverflowElement(currentNode) && !currentNodeIsContaining && hasFixedPositionAncestor(element, currentNode);
    if (shouldDropCurrentNode) {
      // Drop non-containing blocks.
      result = result.filter(ancestor => ancestor !== currentNode);
    } else {
      // Record last containing block for next iteration.
      currentContainingBlockComputedStyle = computedStyle;
    }
    currentNode = getParentNode(currentNode);
  }
  cache.set(element, result);
  return result;
}

// Gets the maximum area that the element is visible in due to any number of
// clipping ancestors.
function getClippingRect(_ref) {
  let {
    element,
    boundary,
    rootBoundary,
    strategy
  } = _ref;
  const elementClippingAncestors = boundary === 'clippingAncestors' ? isTopLayer(element) ? [] : getClippingElementAncestors(element, this._c) : [].concat(boundary);
  const clippingAncestors = [...elementClippingAncestors, rootBoundary];
  const firstClippingAncestor = clippingAncestors[0];
  const clippingRect = clippingAncestors.reduce((accRect, clippingAncestor) => {
    const rect = getClientRectFromClippingAncestor(element, clippingAncestor, strategy);
    accRect.top = max(rect.top, accRect.top);
    accRect.right = min(rect.right, accRect.right);
    accRect.bottom = min(rect.bottom, accRect.bottom);
    accRect.left = max(rect.left, accRect.left);
    return accRect;
  }, getClientRectFromClippingAncestor(element, firstClippingAncestor, strategy));
  return {
    width: clippingRect.right - clippingRect.left,
    height: clippingRect.bottom - clippingRect.top,
    x: clippingRect.left,
    y: clippingRect.top
  };
}

function getDimensions(element) {
  const {
    width,
    height
  } = getCssDimensions(element);
  return {
    width,
    height
  };
}

function getRectRelativeToOffsetParent(element, offsetParent, strategy) {
  const isOffsetParentAnElement = isHTMLElement(offsetParent);
  const documentElement = getDocumentElement(offsetParent);
  const isFixed = strategy === 'fixed';
  const rect = getBoundingClientRect(element, true, isFixed, offsetParent);
  let scroll = {
    scrollLeft: 0,
    scrollTop: 0
  };
  const offsets = createCoords(0);
  if (isOffsetParentAnElement || !isOffsetParentAnElement && !isFixed) {
    if (getNodeName(offsetParent) !== 'body' || isOverflowElement(documentElement)) {
      scroll = getNodeScroll(offsetParent);
    }
    if (isOffsetParentAnElement) {
      const offsetRect = getBoundingClientRect(offsetParent, true, isFixed, offsetParent);
      offsets.x = offsetRect.x + offsetParent.clientLeft;
      offsets.y = offsetRect.y + offsetParent.clientTop;
    } else if (documentElement) {
      offsets.x = getWindowScrollBarX(documentElement);
    }
  }
  const x = rect.left + scroll.scrollLeft - offsets.x;
  const y = rect.top + scroll.scrollTop - offsets.y;
  return {
    x,
    y,
    width: rect.width,
    height: rect.height
  };
}

function isStaticPositioned(element) {
  return getComputedStyle(element).position === 'static';
}

function getTrueOffsetParent(element, polyfill) {
  if (!isHTMLElement(element) || getComputedStyle(element).position === 'fixed') {
    return null;
  }
  if (polyfill) {
    return polyfill(element);
  }
  return element.offsetParent;
}

// Gets the closest ancestor positioned element. Handles some edge cases,
// such as table ancestors and cross browser bugs.
function getOffsetParent(element, polyfill) {
  const win = getWindow(element);
  if (isTopLayer(element)) {
    return win;
  }
  if (!isHTMLElement(element)) {
    let svgOffsetParent = getParentNode(element);
    while (svgOffsetParent && !isLastTraversableNode(svgOffsetParent)) {
      if (isElement(svgOffsetParent) && !isStaticPositioned(svgOffsetParent)) {
        return svgOffsetParent;
      }
      svgOffsetParent = getParentNode(svgOffsetParent);
    }
    return win;
  }
  let offsetParent = getTrueOffsetParent(element, polyfill);
  while (offsetParent && isTableElement(offsetParent) && isStaticPositioned(offsetParent)) {
    offsetParent = getTrueOffsetParent(offsetParent, polyfill);
  }
  if (offsetParent && isLastTraversableNode(offsetParent) && isStaticPositioned(offsetParent) && !isContainingBlock(offsetParent)) {
    return win;
  }
  return offsetParent || getContainingBlock(element) || win;
}

const getElementRects = async function (data) {
  const getOffsetParentFn = this.getOffsetParent || getOffsetParent;
  const getDimensionsFn = this.getDimensions;
  const floatingDimensions = await getDimensionsFn(data.floating);
  return {
    reference: getRectRelativeToOffsetParent(data.reference, await getOffsetParentFn(data.floating), data.strategy),
    floating: {
      x: 0,
      y: 0,
      width: floatingDimensions.width,
      height: floatingDimensions.height
    }
  };
};

function isRTL(element) {
  return getComputedStyle(element).direction === 'rtl';
}

const platform = {
  convertOffsetParentRelativeRectToViewportRelativeRect,
  getDocumentElement,
  getClippingRect,
  getOffsetParent,
  getElementRects,
  getClientRects,
  getDimensions,
  getScale,
  isElement,
  isRTL
};

// https://samthor.au/2021/observing-dom/
function observeMove(element, onMove) {
  let io = null;
  let timeoutId;
  const root = getDocumentElement(element);
  function cleanup() {
    var _io;
    clearTimeout(timeoutId);
    (_io = io) == null || _io.disconnect();
    io = null;
  }
  function refresh(skip, threshold) {
    if (skip === void 0) {
      skip = false;
    }
    if (threshold === void 0) {
      threshold = 1;
    }
    cleanup();
    const {
      left,
      top,
      width,
      height
    } = element.getBoundingClientRect();
    if (!skip) {
      onMove();
    }
    if (!width || !height) {
      return;
    }
    const insetTop = floor(top);
    const insetRight = floor(root.clientWidth - (left + width));
    const insetBottom = floor(root.clientHeight - (top + height));
    const insetLeft = floor(left);
    const rootMargin = -insetTop + "px " + -insetRight + "px " + -insetBottom + "px " + -insetLeft + "px";
    const options = {
      rootMargin,
      threshold: max(0, min(1, threshold)) || 1
    };
    let isFirstUpdate = true;
    function handleObserve(entries) {
      const ratio = entries[0].intersectionRatio;
      if (ratio !== threshold) {
        if (!isFirstUpdate) {
          return refresh();
        }
        if (!ratio) {
          // If the reference is clipped, the ratio is 0. Throttle the refresh
          // to prevent an infinite loop of updates.
          timeoutId = setTimeout(() => {
            refresh(false, 1e-7);
          }, 1000);
        } else {
          refresh(false, ratio);
        }
      }
      isFirstUpdate = false;
    }

    // Older browsers don't support a `document` as the root and will throw an
    // error.
    try {
      io = new IntersectionObserver(handleObserve, {
        ...options,
        // Handle <iframe>s
        root: root.ownerDocument
      });
    } catch (e) {
      io = new IntersectionObserver(handleObserve, options);
    }
    io.observe(element);
  }
  refresh(true);
  return cleanup;
}

/**
 * Automatically updates the position of the floating element when necessary.
 * Should only be called when the floating element is mounted on the DOM or
 * visible on the screen.
 * @returns cleanup function that should be invoked when the floating element is
 * removed from the DOM or hidden from the screen.
 * @see https://floating-ui.com/docs/autoUpdate
 */
function autoUpdate(reference, floating, update, options) {
  if (options === void 0) {
    options = {};
  }
  const {
    ancestorScroll = true,
    ancestorResize = true,
    elementResize = typeof ResizeObserver === 'function',
    layoutShift = typeof IntersectionObserver === 'function',
    animationFrame = false
  } = options;
  const referenceEl = unwrapElement(reference);
  const ancestors = ancestorScroll || ancestorResize ? [...(referenceEl ? getOverflowAncestors(referenceEl) : []), ...getOverflowAncestors(floating)] : [];
  ancestors.forEach(ancestor => {
    ancestorScroll && ancestor.addEventListener('scroll', update, {
      passive: true
    });
    ancestorResize && ancestor.addEventListener('resize', update);
  });
  const cleanupIo = referenceEl && layoutShift ? observeMove(referenceEl, update) : null;
  let reobserveFrame = -1;
  let resizeObserver = null;
  if (elementResize) {
    resizeObserver = new ResizeObserver(_ref => {
      let [firstEntry] = _ref;
      if (firstEntry && firstEntry.target === referenceEl && resizeObserver) {
        // Prevent update loops when using the `size` middleware.
        // https://github.com/floating-ui/floating-ui/issues/1740
        resizeObserver.unobserve(floating);
        cancelAnimationFrame(reobserveFrame);
        reobserveFrame = requestAnimationFrame(() => {
          var _resizeObserver;
          (_resizeObserver = resizeObserver) == null || _resizeObserver.observe(floating);
        });
      }
      update();
    });
    if (referenceEl && !animationFrame) {
      resizeObserver.observe(referenceEl);
    }
    resizeObserver.observe(floating);
  }
  let frameId;
  let prevRefRect = animationFrame ? getBoundingClientRect(reference) : null;
  if (animationFrame) {
    frameLoop();
  }
  function frameLoop() {
    const nextRefRect = getBoundingClientRect(reference);
    if (prevRefRect && (nextRefRect.x !== prevRefRect.x || nextRefRect.y !== prevRefRect.y || nextRefRect.width !== prevRefRect.width || nextRefRect.height !== prevRefRect.height)) {
      update();
    }
    prevRefRect = nextRefRect;
    frameId = requestAnimationFrame(frameLoop);
  }
  update();
  return () => {
    var _resizeObserver2;
    ancestors.forEach(ancestor => {
      ancestorScroll && ancestor.removeEventListener('scroll', update);
      ancestorResize && ancestor.removeEventListener('resize', update);
    });
    cleanupIo == null || cleanupIo();
    (_resizeObserver2 = resizeObserver) == null || _resizeObserver2.disconnect();
    resizeObserver = null;
    if (animationFrame) {
      cancelAnimationFrame(frameId);
    }
  };
}

/**
 * Optimizes the visibility of the floating element by flipping the `placement`
 * in order to keep it in view when the preferred placement(s) will overflow the
 * clipping boundary. Alternative to `autoPlacement`.
 * @see https://floating-ui.com/docs/flip
 */
const flip = flip$1;

/**
 * Provides data to position an inner element of the floating element so that it
 * appears centered to the reference element.
 * @see https://floating-ui.com/docs/arrow
 */
const arrow = arrow$1;

/**
 * Computes the `x` and `y` coordinates that will place the floating element
 * next to a given reference element.
 */
const computePosition = (reference, floating, options) => {
  // This caches the expensive `getClippingElementAncestors` function so that
  // multiple lifecycle resets re-use the same result. It only lives for a
  // single call. If other functions become expensive, we can add them as well.
  const cache = new Map();
  const mergedOptions = {
    platform,
    ...options
  };
  const platformWithCache = {
    ...mergedOptions.platform,
    _c: cache
  };
  return computePosition$1(reference, floating, {
    ...mergedOptions,
    platform: platformWithCache
  });
};

class BaseComponentBehavior {
    constructor(id, view, refHtmlEl) {
        this.id = id;
        this.refHtmlEl = refHtmlEl;
        this.component = new view.Component({
            target: document.body,
            props: Object.assign({ popover: true, close: this.close }, view.props)
        });
        this.componentHtmlEl = document.querySelector(`#${id}[data-popover="true"]`);
    }
    open() {
        // close all popovers when a new modal is displayed to prevent overlapping
        if (!Popover.mutationObserverStarted) {
            const cb = (mutationRecords) => {
                mutationRecords.forEach((record) => {
                    const modalFound = [...record.addedNodes].find((node) => {
                        if (node instanceof HTMLElement) {
                            return node.className.contains(MODAL_CLASS);
                        }
                    });
                    if (modalFound) {
                        Popover.instances.forEach((instance) => instance === null || instance === void 0 ? void 0 : instance.close());
                        mutationObserver.disconnect();
                        Popover.mutationObserverStarted = false;
                    }
                });
            };
            const mutationObserver = new MutationObserver(cb);
            mutationObserver.observe(document.querySelector('body'), {
                childList: true
            });
        }
        this.show();
        this.setInteractivity(true);
        this.positionComponent({ refHtmlEl: this.refHtmlEl });
        this.autoUpdateCleanup = autoUpdate(this.refHtmlEl, this.componentHtmlEl, () => {
            this.positionComponent({ refHtmlEl: this.refHtmlEl });
        });
    }
    close() {
        var _a;
        this.hide();
        this.setInteractivity(false);
        (_a = this.autoUpdateCleanup) === null || _a === void 0 ? void 0 : _a.call(this);
        this.autoUpdateCleanup = null;
    }
    cleanup() {
    }
    positionComponent({ refHtmlEl, customX, customY }) {
        const arrowEl = document.querySelector(`#${this.id}-arrow`);
        computePosition(refHtmlEl, this.componentHtmlEl, {
            placement: 'right',
            middleware: [flip(), arrow({ element: arrowEl })]
        }).then(({ x, y, placement, middlewareData }) => {
            Object.assign(this.componentHtmlEl.style, {
                left: `${customX || x} px`,
                top: `${customY || y} px`
            });
            // Handle Arrow Placement:
            // https://floating-ui.com/docs/arrow
            if (arrowEl && middlewareData.arrow) {
                const { x: arrowX, y: arrowY } = middlewareData.arrow;
                const staticSide = {
                    top: 'bottom',
                    right: 'left',
                    bottom: 'top',
                    left: 'right'
                }[placement.split('-')[0]];
                staticSide &&
                    Object.assign(arrowEl.style, {
                        left: arrowX != null ? `${arrowX} px` : '',
                        top: arrowY != null ? `${arrowY} px` : '',
                        right: '',
                        bottom: '',
                        [staticSide]: '9px'
                    });
            }
        });
    }
    addWindowListeners(windowEvents) {
        Object.entries(windowEvents).forEach(([evName, cb]) => {
            if (cb) {
                if (evName === 'mouseover' && !get_store_value(settingsStore).openPopoverOnRibbonHover) {
                    return;
                }
                window.addEventListener(evName, cb);
            }
        });
    }
    removeWindowListeners(windowEvents) {
        Object.entries(windowEvents).forEach(([evName, cb]) => {
            if (cb) {
                window.removeEventListener(evName, cb);
            }
        });
    }
    show() {
        this.componentHtmlEl.style.display = 'block';
        this.componentHtmlEl.style.opacity = '1';
        this.componentHtmlEl.style.pointerEvents = 'auto';
    }
    hide() {
        this.componentHtmlEl.style.opacity = '0';
    }
    setInteractivity(enabled = true) {
        if (enabled) {
            this.componentHtmlEl.removeAttribute('inert');
        }
        else {
            this.componentHtmlEl.setAttribute('inert', '');
        }
    }
}

function getRefHtmlEl() {
    return document.querySelector(`[id=${CALENDAR_POPOVER_ID}-ribbon-ref-el]`);
}
class CalendarPopoverBehavior extends BaseComponentBehavior {
    constructor(params) {
        super(params.id, params.view, getRefHtmlEl());
        this.params = params;
        if (get_store_value(settingsStore).openPopoverOnRibbonHover) {
            this.refHtmlEl.addEventListener('mouseover', this.handleReferenceElHover);
        }
    }
    open() {
        super.open();
        this.addWindowListeners(this.getWindowEvents());
    }
    close() {
        super.close();
        this.removeWindowListeners(this.getWindowEvents());
    }
    cleanup() {
        this.close();
        this.refHtmlEl.removeEventListener('mouseover', this.handleReferenceElHover);
        this.component.$destroy();
    }
    getWindowEvents() {
        return {
            click: this.handleWindowClick,
            auxclick: this.handleWindowClick,
            keydown: this.handleWindowKeydown,
            mouseover: this.handleWindowMouseover
        };
    }
    handleWindowClick(event) {
        var _a, _b, _c, _d, _e;
        const ev = event;
        const settings = get_store_value(settingsStore);
        const menuEl = document.querySelector('.menu');
        const stickerEl = document.querySelector(`#${STICKER_POPOVER_ID}[data-popover="true"]`);
        const calendarElTouched = this.componentHtmlEl.contains(ev.target) ||
            ((_a = ev.target) === null || _a === void 0 ? void 0 : _a.id.includes(CALENDAR_POPOVER_ID));
        const stickerElTouched = (stickerEl === null || stickerEl === void 0 ? void 0 : stickerEl.contains(ev.target)) ||
            ((_b = ev.target) === null || _b === void 0 ? void 0 : _b.id.includes(STICKER_POPOVER_ID));
        const menuElTouched = (menuEl === null || menuEl === void 0 ? void 0 : menuEl.contains(ev.target)) || ((_c = ev.target) === null || _c === void 0 ? void 0 : _c.className.includes('menu'));
        const targetOut = !calendarElTouched && !menuElTouched && !stickerElTouched;
        // avoids closing calendar if sticker is open too 
        if (((_d = getPopoverInstance(this.params.id)) === null || _d === void 0 ? void 0 : _d.opened) &&
            ((_e = getPopoverInstance(STICKER_POPOVER_ID)) === null || _e === void 0 ? void 0 : _e.opened) &&
            settings.popoversClosing.closePopoversOneByOneOnClickOut) {
            return;
        }
        // close calendar popover if user clicked anywhere but either calendar popover, context menu or SP
        if (targetOut) {
            this.close();
        }
    }
    ;
    handleWindowKeydown(event) {
        var _a, _b, _c, _d;
        const settings = get_store_value(settingsStore);
        const focusableSelectors = ':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';
        const focusablePopoverElements = Array.from(this.componentHtmlEl.querySelectorAll(focusableSelectors));
        const referenceElFocused = (((_a = getPopoverInstance(this.params.id)) === null || _a === void 0 ? void 0 : _a.opened) && document.activeElement === this.refHtmlEl) || false;
        // When the user focuses on 'referenceEl' and then presses the Tab or ArrowDown key, the first element inside the view should receive focus.
        // TODO: make it work!
        if (referenceElFocused &&
            (event.key === 'ArrowDown' || event.key === 'Tab') &&
            focusablePopoverElements.length > 0) {
            focusablePopoverElements[0].focus();
            return;
        }
        // avoids closing calendar if sticker is open too 
        if (((_b = getPopoverInstance(this.params.id)) === null || _b === void 0 ? void 0 : _b.opened) &&
            ((_c = getPopoverInstance(STICKER_POPOVER_ID)) === null || _c === void 0 ? void 0 : _c.opened) &&
            settings.popoversClosing.closePopoversOneByOneOnEscKeydown) {
            return;
        }
        if (event.key === 'Escape') {
            (_d = this.refHtmlEl) === null || _d === void 0 ? void 0 : _d.focus();
            this.close();
            return;
        }
    }
    ;
    handleWindowMouseover(event) {
        var _a, _b, _c;
        if (get_store_value(settingsStore).openPopoverOnRibbonHover) {
            const ev = event;
            const calendarPopover = getPopoverInstance(CALENDAR_POPOVER_ID);
            const stickerPopover = getPopoverInstance(STICKER_POPOVER_ID);
            const fileMenuPopover = getPopoverInstance(FILE_MENU_POPOVER_ID);
            const menuEl = document.querySelector('.menu');
            const stickerEl = document.querySelector(`#${STICKER_POPOVER_ID}[data-popover="true"]`);
            const calendarElTouched = this.componentHtmlEl.contains(ev.target) ||
                ((_a = ev.target) === null || _a === void 0 ? void 0 : _a.id.includes(CALENDAR_POPOVER_ID));
            const stickerElTouched = (stickerEl === null || stickerEl === void 0 ? void 0 : stickerEl.contains(ev.target)) ||
                ((_b = ev.target) === null || _b === void 0 ? void 0 : _b.id.includes(STICKER_POPOVER_ID));
            const menuElTouched = (menuEl === null || menuEl === void 0 ? void 0 : menuEl.contains(ev.target)) || ((_c = ev.target) === null || _c === void 0 ? void 0 : _c.className.includes('menu'));
            const referenceElTouched = this.refHtmlEl.contains(event.target);
            const targetOut = !calendarElTouched && !menuElTouched && !stickerElTouched;
            if (referenceElTouched)
                return;
            const isOnlyCalendarPopoverOpen = (calendarPopover === null || calendarPopover === void 0 ? void 0 : calendarPopover.opened) && !(stickerPopover === null || stickerPopover === void 0 ? void 0 : stickerPopover.opened) && !(fileMenuPopover === null || fileMenuPopover === void 0 ? void 0 : fileMenuPopover.opened);
            // close calendar popover if opened and user hovered anywhere but calendar popover
            if (isOnlyCalendarPopoverOpen && targetOut) {
                this.close();
            }
        }
    }
    ;
    handleReferenceElHover() {
        var _a;
        console.log('🖱️🖱️🖱️handleReferenceElHover()!!! 🤯🤯🤯');
        if (!((_a = getPopoverInstance(this.params.id)) === null || _a === void 0 ? void 0 : _a.opened)) {
            this.open();
        }
    }
}

if (typeof window !== 'undefined')
	// @ts-ignore
	(window.__svelte || (window.__svelte = { v: new Set() })).v.add(PUBLIC_VERSION);

function $parcel$interopDefault(a) {
  return a && a.__esModule ? a.default : a;
}
function $c770c458706daa72$export$2e2bcd8739ae039(obj, key, value) {
    if (key in obj) Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
    });
    else obj[key] = value;
    return obj;
}


var $fb96b826c0c5f37a$var$n, $fb96b826c0c5f37a$export$41c562ebe57d11e2, $fb96b826c0c5f37a$var$u, $fb96b826c0c5f37a$var$t, $fb96b826c0c5f37a$var$r, $fb96b826c0c5f37a$var$o, $fb96b826c0c5f37a$var$e = {}, $fb96b826c0c5f37a$var$c = [], $fb96b826c0c5f37a$var$s = /acit|ex(?:s|g|n|p|$)|rph|grid|ows|mnc|ntw|ine[ch]|zoo|^ord|itera/i;
function $fb96b826c0c5f37a$var$a(n1, l1) {
    for(var u1 in l1)n1[u1] = l1[u1];
    return n1;
}
function $fb96b826c0c5f37a$var$h(n2) {
    var l2 = n2.parentNode;
    l2 && l2.removeChild(n2);
}
function $fb96b826c0c5f37a$export$c8a8987d4410bf2d(l3, u2, i1) {
    var t1, r1, o1, f1 = {};
    for(o1 in u2)"key" == o1 ? t1 = u2[o1] : "ref" == o1 ? r1 = u2[o1] : f1[o1] = u2[o1];
    if (arguments.length > 2 && (f1.children = arguments.length > 3 ? $fb96b826c0c5f37a$var$n.call(arguments, 2) : i1), "function" == typeof l3 && null != l3.defaultProps) for(o1 in l3.defaultProps)void 0 === f1[o1] && (f1[o1] = l3.defaultProps[o1]);
    return $fb96b826c0c5f37a$var$y(l3, f1, t1, r1, null);
}
function $fb96b826c0c5f37a$var$y(n3, i2, t2, r2, o2) {
    var f2 = {
        type: n3,
        props: i2,
        key: t2,
        ref: r2,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __d: void 0,
        __c: null,
        __h: null,
        constructor: void 0,
        __v: null == o2 ? ++$fb96b826c0c5f37a$var$u : o2
    };
    return null == o2 && null != $fb96b826c0c5f37a$export$41c562ebe57d11e2.vnode && $fb96b826c0c5f37a$export$41c562ebe57d11e2.vnode(f2), f2;
}
function $fb96b826c0c5f37a$export$7d1e3a5e95ceca43() {
    return {
        current: null
    };
}
function $fb96b826c0c5f37a$export$ffb0004e005737fa(n4) {
    return n4.children;
}
function $fb96b826c0c5f37a$export$16fa2f45be04daa8(n5, l4) {
    this.props = n5, this.context = l4;
}
function $fb96b826c0c5f37a$var$k(n6, l5) {
    if (null == l5) return n6.__ ? $fb96b826c0c5f37a$var$k(n6.__, n6.__.__k.indexOf(n6) + 1) : null;
    for(var u3; l5 < n6.__k.length; l5++)if (null != (u3 = n6.__k[l5]) && null != u3.__e) return u3.__e;
    return "function" == typeof n6.type ? $fb96b826c0c5f37a$var$k(n6) : null;
}
function $fb96b826c0c5f37a$var$b(n7) {
    var l6, u4;
    if (null != (n7 = n7.__) && null != n7.__c) {
        for(n7.__e = n7.__c.base = null, l6 = 0; l6 < n7.__k.length; l6++)if (null != (u4 = n7.__k[l6]) && null != u4.__e) {
            n7.__e = n7.__c.base = u4.__e;
            break;
        }
        return $fb96b826c0c5f37a$var$b(n7);
    }
}
function $fb96b826c0c5f37a$var$m(n8) {
    (!n8.__d && (n8.__d = !0) && $fb96b826c0c5f37a$var$t.push(n8) && !$fb96b826c0c5f37a$var$g.__r++ || $fb96b826c0c5f37a$var$o !== $fb96b826c0c5f37a$export$41c562ebe57d11e2.debounceRendering) && (($fb96b826c0c5f37a$var$o = $fb96b826c0c5f37a$export$41c562ebe57d11e2.debounceRendering) || $fb96b826c0c5f37a$var$r)($fb96b826c0c5f37a$var$g);
}
function $fb96b826c0c5f37a$var$g() {
    for(var n9; $fb96b826c0c5f37a$var$g.__r = $fb96b826c0c5f37a$var$t.length;)n9 = $fb96b826c0c5f37a$var$t.sort(function(n10, l7) {
        return n10.__v.__b - l7.__v.__b;
    }), $fb96b826c0c5f37a$var$t = [], n9.some(function(n11) {
        var l8, u5, i3, t3, r3, o3;
        n11.__d && (r3 = (t3 = (l8 = n11).__v).__e, (o3 = l8.__P) && (u5 = [], (i3 = $fb96b826c0c5f37a$var$a({}, t3)).__v = t3.__v + 1, $fb96b826c0c5f37a$var$j(o3, t3, i3, l8.__n, void 0 !== o3.ownerSVGElement, null != t3.__h ? [
            r3
        ] : null, u5, null == r3 ? $fb96b826c0c5f37a$var$k(t3) : r3, t3.__h), $fb96b826c0c5f37a$var$z(u5, t3), t3.__e != r3 && $fb96b826c0c5f37a$var$b(t3)));
    });
}
function $fb96b826c0c5f37a$var$w(n12, l9, u6, i4, t4, r4, o4, f3, s1, a1) {
    var h1, v1, p1, _1, b1, m1, g1, w1 = i4 && i4.__k || $fb96b826c0c5f37a$var$c, A1 = w1.length;
    for(u6.__k = [], h1 = 0; h1 < l9.length; h1++)if (null != (_1 = u6.__k[h1] = null == (_1 = l9[h1]) || "boolean" == typeof _1 ? null : "string" == typeof _1 || "number" == typeof _1 || "bigint" == typeof _1 ? $fb96b826c0c5f37a$var$y(null, _1, null, null, _1) : Array.isArray(_1) ? $fb96b826c0c5f37a$var$y($fb96b826c0c5f37a$export$ffb0004e005737fa, {
        children: _1
    }, null, null, null) : _1.__b > 0 ? $fb96b826c0c5f37a$var$y(_1.type, _1.props, _1.key, null, _1.__v) : _1)) {
        if (_1.__ = u6, _1.__b = u6.__b + 1, null === (p1 = w1[h1]) || p1 && _1.key == p1.key && _1.type === p1.type) w1[h1] = void 0;
        else for(v1 = 0; v1 < A1; v1++){
            if ((p1 = w1[v1]) && _1.key == p1.key && _1.type === p1.type) {
                w1[v1] = void 0;
                break;
            }
            p1 = null;
        }
        $fb96b826c0c5f37a$var$j(n12, _1, p1 = p1 || $fb96b826c0c5f37a$var$e, t4, r4, o4, f3, s1, a1), b1 = _1.__e, (v1 = _1.ref) && p1.ref != v1 && (g1 || (g1 = []), p1.ref && g1.push(p1.ref, null, _1), g1.push(v1, _1.__c || b1, _1)), null != b1 ? (null == m1 && (m1 = b1), "function" == typeof _1.type && _1.__k === p1.__k ? _1.__d = s1 = $fb96b826c0c5f37a$var$x(_1, s1, n12) : s1 = $fb96b826c0c5f37a$var$P(n12, _1, p1, w1, b1, s1), "function" == typeof u6.type && (u6.__d = s1)) : s1 && p1.__e == s1 && s1.parentNode != n12 && (s1 = $fb96b826c0c5f37a$var$k(p1));
    }
    for(u6.__e = m1, h1 = A1; h1--;)null != w1[h1] && ("function" == typeof u6.type && null != w1[h1].__e && w1[h1].__e == u6.__d && (u6.__d = $fb96b826c0c5f37a$var$k(i4, h1 + 1)), $fb96b826c0c5f37a$var$N(w1[h1], w1[h1]));
    if (g1) for(h1 = 0; h1 < g1.length; h1++)$fb96b826c0c5f37a$var$M(g1[h1], g1[++h1], g1[++h1]);
}
function $fb96b826c0c5f37a$var$x(n13, l10, u7) {
    for(var i5, t5 = n13.__k, r5 = 0; t5 && r5 < t5.length; r5++)(i5 = t5[r5]) && (i5.__ = n13, l10 = "function" == typeof i5.type ? $fb96b826c0c5f37a$var$x(i5, l10, u7) : $fb96b826c0c5f37a$var$P(u7, i5, i5, t5, i5.__e, l10));
    return l10;
}
function $fb96b826c0c5f37a$export$47e4c5b300681277(n14, l11) {
    return l11 = l11 || [], null == n14 || "boolean" == typeof n14 || (Array.isArray(n14) ? n14.some(function(n15) {
        $fb96b826c0c5f37a$export$47e4c5b300681277(n15, l11);
    }) : l11.push(n14)), l11;
}
function $fb96b826c0c5f37a$var$P(n16, l12, u8, i6, t6, r6) {
    var o5, f4, e1;
    if (void 0 !== l12.__d) o5 = l12.__d, l12.__d = void 0;
    else if (null == u8 || t6 != r6 || null == t6.parentNode) n: if (null == r6 || r6.parentNode !== n16) n16.appendChild(t6), o5 = null;
    else {
        for(f4 = r6, e1 = 0; (f4 = f4.nextSibling) && e1 < i6.length; e1 += 2)if (f4 == t6) break n;
        n16.insertBefore(t6, r6), o5 = r6;
    }
    return void 0 !== o5 ? o5 : t6.nextSibling;
}
function $fb96b826c0c5f37a$var$C(n17, l13, u9, i7, t7) {
    var r7;
    for(r7 in u9)"children" === r7 || "key" === r7 || r7 in l13 || $fb96b826c0c5f37a$var$H(n17, r7, null, u9[r7], i7);
    for(r7 in l13)t7 && "function" != typeof l13[r7] || "children" === r7 || "key" === r7 || "value" === r7 || "checked" === r7 || u9[r7] === l13[r7] || $fb96b826c0c5f37a$var$H(n17, r7, l13[r7], u9[r7], i7);
}
function $fb96b826c0c5f37a$var$$(n18, l14, u10) {
    "-" === l14[0] ? n18.setProperty(l14, u10) : n18[l14] = null == u10 ? "" : "number" != typeof u10 || $fb96b826c0c5f37a$var$s.test(l14) ? u10 : u10 + "px";
}
function $fb96b826c0c5f37a$var$H(n19, l15, u11, i8, t8) {
    var r8;
    n: if ("style" === l15) {
        if ("string" == typeof u11) n19.style.cssText = u11;
        else {
            if ("string" == typeof i8 && (n19.style.cssText = i8 = ""), i8) for(l15 in i8)u11 && l15 in u11 || $fb96b826c0c5f37a$var$$(n19.style, l15, "");
            if (u11) for(l15 in u11)i8 && u11[l15] === i8[l15] || $fb96b826c0c5f37a$var$$(n19.style, l15, u11[l15]);
        }
    } else if ("o" === l15[0] && "n" === l15[1]) r8 = l15 !== (l15 = l15.replace(/Capture$/, "")), l15 = l15.toLowerCase() in n19 ? l15.toLowerCase().slice(2) : l15.slice(2), n19.l || (n19.l = {}), n19.l[l15 + r8] = u11, u11 ? i8 || n19.addEventListener(l15, r8 ? $fb96b826c0c5f37a$var$T : $fb96b826c0c5f37a$var$I, r8) : n19.removeEventListener(l15, r8 ? $fb96b826c0c5f37a$var$T : $fb96b826c0c5f37a$var$I, r8);
    else if ("dangerouslySetInnerHTML" !== l15) {
        if (t8) l15 = l15.replace(/xlink[H:h]/, "h").replace(/sName$/, "s");
        else if ("href" !== l15 && "list" !== l15 && "form" !== l15 && "tabIndex" !== l15 && "download" !== l15 && l15 in n19) try {
            n19[l15] = null == u11 ? "" : u11;
            break n;
        } catch (n) {}
        "function" == typeof u11 || (null != u11 && (!1 !== u11 || "a" === l15[0] && "r" === l15[1]) ? n19.setAttribute(l15, u11) : n19.removeAttribute(l15));
    }
}
function $fb96b826c0c5f37a$var$I(n20) {
    this.l[n20.type + !1]($fb96b826c0c5f37a$export$41c562ebe57d11e2.event ? $fb96b826c0c5f37a$export$41c562ebe57d11e2.event(n20) : n20);
}
function $fb96b826c0c5f37a$var$T(n21) {
    this.l[n21.type + !0]($fb96b826c0c5f37a$export$41c562ebe57d11e2.event ? $fb96b826c0c5f37a$export$41c562ebe57d11e2.event(n21) : n21);
}
function $fb96b826c0c5f37a$var$j(n22, u12, i9, t9, r9, o6, f5, e2, c1) {
    var s2, h2, v2, y1, p2, k1, b2, m2, g2, x1, A2, P1 = u12.type;
    if (void 0 !== u12.constructor) return null;
    null != i9.__h && (c1 = i9.__h, e2 = u12.__e = i9.__e, u12.__h = null, o6 = [
        e2
    ]), (s2 = $fb96b826c0c5f37a$export$41c562ebe57d11e2.__b) && s2(u12);
    try {
        n: if ("function" == typeof P1) {
            if (m2 = u12.props, g2 = (s2 = P1.contextType) && t9[s2.__c], x1 = s2 ? g2 ? g2.props.value : s2.__ : t9, i9.__c ? b2 = (h2 = u12.__c = i9.__c).__ = h2.__E : ("prototype" in P1 && P1.prototype.render ? u12.__c = h2 = new P1(m2, x1) : (u12.__c = h2 = new $fb96b826c0c5f37a$export$16fa2f45be04daa8(m2, x1), h2.constructor = P1, h2.render = $fb96b826c0c5f37a$var$O), g2 && g2.sub(h2), h2.props = m2, h2.state || (h2.state = {}), h2.context = x1, h2.__n = t9, v2 = h2.__d = !0, h2.__h = []), null == h2.__s && (h2.__s = h2.state), null != P1.getDerivedStateFromProps && (h2.__s == h2.state && (h2.__s = $fb96b826c0c5f37a$var$a({}, h2.__s)), $fb96b826c0c5f37a$var$a(h2.__s, P1.getDerivedStateFromProps(m2, h2.__s))), y1 = h2.props, p2 = h2.state, v2) null == P1.getDerivedStateFromProps && null != h2.componentWillMount && h2.componentWillMount(), null != h2.componentDidMount && h2.__h.push(h2.componentDidMount);
            else {
                if (null == P1.getDerivedStateFromProps && m2 !== y1 && null != h2.componentWillReceiveProps && h2.componentWillReceiveProps(m2, x1), !h2.__e && null != h2.shouldComponentUpdate && !1 === h2.shouldComponentUpdate(m2, h2.__s, x1) || u12.__v === i9.__v) {
                    h2.props = m2, h2.state = h2.__s, u12.__v !== i9.__v && (h2.__d = !1), h2.__v = u12, u12.__e = i9.__e, u12.__k = i9.__k, u12.__k.forEach(function(n23) {
                        n23 && (n23.__ = u12);
                    }), h2.__h.length && f5.push(h2);
                    break n;
                }
                null != h2.componentWillUpdate && h2.componentWillUpdate(m2, h2.__s, x1), null != h2.componentDidUpdate && h2.__h.push(function() {
                    h2.componentDidUpdate(y1, p2, k1);
                });
            }
            h2.context = x1, h2.props = m2, h2.state = h2.__s, (s2 = $fb96b826c0c5f37a$export$41c562ebe57d11e2.__r) && s2(u12), h2.__d = !1, h2.__v = u12, h2.__P = n22, s2 = h2.render(h2.props, h2.state, h2.context), h2.state = h2.__s, null != h2.getChildContext && (t9 = $fb96b826c0c5f37a$var$a($fb96b826c0c5f37a$var$a({}, t9), h2.getChildContext())), v2 || null == h2.getSnapshotBeforeUpdate || (k1 = h2.getSnapshotBeforeUpdate(y1, p2)), A2 = null != s2 && s2.type === $fb96b826c0c5f37a$export$ffb0004e005737fa && null == s2.key ? s2.props.children : s2, $fb96b826c0c5f37a$var$w(n22, Array.isArray(A2) ? A2 : [
                A2
            ], u12, i9, t9, r9, o6, f5, e2, c1), h2.base = u12.__e, u12.__h = null, h2.__h.length && f5.push(h2), b2 && (h2.__E = h2.__ = null), h2.__e = !1;
        } else null == o6 && u12.__v === i9.__v ? (u12.__k = i9.__k, u12.__e = i9.__e) : u12.__e = $fb96b826c0c5f37a$var$L(i9.__e, u12, i9, t9, r9, o6, f5, c1);
        (s2 = $fb96b826c0c5f37a$export$41c562ebe57d11e2.diffed) && s2(u12);
    } catch (n24) {
        u12.__v = null, (c1 || null != o6) && (u12.__e = e2, u12.__h = !!c1, o6[o6.indexOf(e2)] = null), $fb96b826c0c5f37a$export$41c562ebe57d11e2.__e(n24, u12, i9);
    }
}
function $fb96b826c0c5f37a$var$z(n25, u13) {
    $fb96b826c0c5f37a$export$41c562ebe57d11e2.__c && $fb96b826c0c5f37a$export$41c562ebe57d11e2.__c(u13, n25), n25.some(function(u14) {
        try {
            n25 = u14.__h, u14.__h = [], n25.some(function(n26) {
                n26.call(u14);
            });
        } catch (n27) {
            $fb96b826c0c5f37a$export$41c562ebe57d11e2.__e(n27, u14.__v);
        }
    });
}
function $fb96b826c0c5f37a$var$L(l16, u15, i10, t10, r10, o7, f6, c2) {
    var s3, a2, v3, y2 = i10.props, p3 = u15.props, d1 = u15.type, _2 = 0;
    if ("svg" === d1 && (r10 = !0), null != o7) {
        for(; _2 < o7.length; _2++)if ((s3 = o7[_2]) && "setAttribute" in s3 == !!d1 && (d1 ? s3.localName === d1 : 3 === s3.nodeType)) {
            l16 = s3, o7[_2] = null;
            break;
        }
    }
    if (null == l16) {
        if (null === d1) return document.createTextNode(p3);
        l16 = r10 ? document.createElementNS("http://www.w3.org/2000/svg", d1) : document.createElement(d1, p3.is && p3), o7 = null, c2 = !1;
    }
    if (null === d1) y2 === p3 || c2 && l16.data === p3 || (l16.data = p3);
    else {
        if (o7 = o7 && $fb96b826c0c5f37a$var$n.call(l16.childNodes), a2 = (y2 = i10.props || $fb96b826c0c5f37a$var$e).dangerouslySetInnerHTML, v3 = p3.dangerouslySetInnerHTML, !c2) {
            if (null != o7) for(y2 = {}, _2 = 0; _2 < l16.attributes.length; _2++)y2[l16.attributes[_2].name] = l16.attributes[_2].value;
            (v3 || a2) && (v3 && (a2 && v3.__html == a2.__html || v3.__html === l16.innerHTML) || (l16.innerHTML = v3 && v3.__html || ""));
        }
        if ($fb96b826c0c5f37a$var$C(l16, p3, y2, r10, c2), v3) u15.__k = [];
        else if (_2 = u15.props.children, $fb96b826c0c5f37a$var$w(l16, Array.isArray(_2) ? _2 : [
            _2
        ], u15, i10, t10, r10 && "foreignObject" !== d1, o7, f6, o7 ? o7[0] : i10.__k && $fb96b826c0c5f37a$var$k(i10, 0), c2), null != o7) for(_2 = o7.length; _2--;)null != o7[_2] && $fb96b826c0c5f37a$var$h(o7[_2]);
        c2 || ("value" in p3 && void 0 !== (_2 = p3.value) && (_2 !== y2.value || _2 !== l16.value || "progress" === d1 && !_2) && $fb96b826c0c5f37a$var$H(l16, "value", _2, y2.value, !1), "checked" in p3 && void 0 !== (_2 = p3.checked) && _2 !== l16.checked && $fb96b826c0c5f37a$var$H(l16, "checked", _2, y2.checked, !1));
    }
    return l16;
}
function $fb96b826c0c5f37a$var$M(n28, u16, i11) {
    try {
        "function" == typeof n28 ? n28(u16) : n28.current = u16;
    } catch (n29) {
        $fb96b826c0c5f37a$export$41c562ebe57d11e2.__e(n29, i11);
    }
}
function $fb96b826c0c5f37a$var$N(n30, u17, i12) {
    var t11, r11;
    if ($fb96b826c0c5f37a$export$41c562ebe57d11e2.unmount && $fb96b826c0c5f37a$export$41c562ebe57d11e2.unmount(n30), (t11 = n30.ref) && (t11.current && t11.current !== n30.__e || $fb96b826c0c5f37a$var$M(t11, null, u17)), null != (t11 = n30.__c)) {
        if (t11.componentWillUnmount) try {
            t11.componentWillUnmount();
        } catch (n31) {
            $fb96b826c0c5f37a$export$41c562ebe57d11e2.__e(n31, u17);
        }
        t11.base = t11.__P = null;
    }
    if (t11 = n30.__k) for(r11 = 0; r11 < t11.length; r11++)t11[r11] && $fb96b826c0c5f37a$var$N(t11[r11], u17, "function" != typeof n30.type);
    i12 || null == n30.__e || $fb96b826c0c5f37a$var$h(n30.__e), n30.__e = n30.__d = void 0;
}
function $fb96b826c0c5f37a$var$O(n32, l, u18) {
    return this.constructor(n32, u18);
}
function $fb96b826c0c5f37a$export$b3890eb0ae9dca99(u19, i13, t12) {
    var r12, o8, f7;
    $fb96b826c0c5f37a$export$41c562ebe57d11e2.__ && $fb96b826c0c5f37a$export$41c562ebe57d11e2.__(u19, i13), o8 = (r12 = "function" == typeof t12) ? null : t12 && t12.__k || i13.__k, f7 = [], $fb96b826c0c5f37a$var$j(i13, u19 = (!r12 && t12 || i13).__k = $fb96b826c0c5f37a$export$c8a8987d4410bf2d($fb96b826c0c5f37a$export$ffb0004e005737fa, null, [
        u19
    ]), o8 || $fb96b826c0c5f37a$var$e, $fb96b826c0c5f37a$var$e, void 0 !== i13.ownerSVGElement, !r12 && t12 ? [
        t12
    ] : o8 ? null : i13.firstChild ? $fb96b826c0c5f37a$var$n.call(i13.childNodes) : null, f7, !r12 && t12 ? t12 : o8 ? o8.__e : i13.firstChild, r12), $fb96b826c0c5f37a$var$z(f7, u19);
}
$fb96b826c0c5f37a$var$n = $fb96b826c0c5f37a$var$c.slice, $fb96b826c0c5f37a$export$41c562ebe57d11e2 = {
    __e: function(n39, l22) {
        for(var u23, i16, t14; l22 = l22.__;)if ((u23 = l22.__c) && !u23.__) try {
            if ((i16 = u23.constructor) && null != i16.getDerivedStateFromError && (u23.setState(i16.getDerivedStateFromError(n39)), t14 = u23.__d), null != u23.componentDidCatch && (u23.componentDidCatch(n39), t14 = u23.__d), t14) return u23.__E = u23;
        } catch (l23) {
            n39 = l23;
        }
        throw n39;
    }
}, $fb96b826c0c5f37a$var$u = 0, $fb96b826c0c5f37a$export$16fa2f45be04daa8.prototype.setState = function(n41, l24) {
    var u24;
    u24 = null != this.__s && this.__s !== this.state ? this.__s : this.__s = $fb96b826c0c5f37a$var$a({}, this.state), "function" == typeof n41 && (n41 = n41($fb96b826c0c5f37a$var$a({}, u24), this.props)), n41 && $fb96b826c0c5f37a$var$a(u24, n41), null != n41 && this.__v && (l24 && this.__h.push(l24), $fb96b826c0c5f37a$var$m(this));
}, $fb96b826c0c5f37a$export$16fa2f45be04daa8.prototype.forceUpdate = function(n42) {
    this.__v && (this.__e = !0, n42 && this.__h.push(n42), $fb96b826c0c5f37a$var$m(this));
}, $fb96b826c0c5f37a$export$16fa2f45be04daa8.prototype.render = $fb96b826c0c5f37a$export$ffb0004e005737fa, $fb96b826c0c5f37a$var$t = [], $fb96b826c0c5f37a$var$r = "function" == typeof Promise ? Promise.prototype.then.bind(Promise.resolve()) : setTimeout, $fb96b826c0c5f37a$var$g.__r = 0;



var $bd9dd35321b03dd4$var$o = 0;
function $bd9dd35321b03dd4$export$34b9dba7ce09269b(_1, e1, n, t, f) {
    var l, s, u = {};
    for(s in e1)"ref" == s ? l = e1[s] : u[s] = e1[s];
    var a = {
        type: _1,
        props: u,
        key: n,
        ref: l,
        __k: null,
        __: null,
        __b: 0,
        __e: null,
        __d: void 0,
        __c: null,
        __h: null,
        constructor: void 0,
        __v: --$bd9dd35321b03dd4$var$o,
        __source: t,
        __self: f
    };
    if ("function" == typeof _1 && (l = _1.defaultProps)) for(s in l)void 0 === u[s] && (u[s] = l[s]);
    return ($fb96b826c0c5f37a$export$41c562ebe57d11e2).vnode && ($fb96b826c0c5f37a$export$41c562ebe57d11e2).vnode(a), a;
}



function $f72b75cf796873c7$var$set(key, value) {
    try {
        window.localStorage[`emoji-mart.${key}`] = JSON.stringify(value);
    } catch (error) {}
}
function $f72b75cf796873c7$var$get(key) {
    try {
        const value = window.localStorage[`emoji-mart.${key}`];
        if (value) return JSON.parse(value);
    } catch (error) {}
}
var $f72b75cf796873c7$export$2e2bcd8739ae039 = {
    set: $f72b75cf796873c7$var$set,
    get: $f72b75cf796873c7$var$get
};


const $c84d045dcc34faf5$var$CACHE = new Map();
const $c84d045dcc34faf5$var$VERSIONS = [
    {
        v: 15,
        emoji: "\uD83E\uDEE8"
    },
    {
        v: 14,
        emoji: "\uD83E\uDEE0"
    },
    {
        v: 13.1,
        emoji: "\uD83D\uDE36\u200D\uD83C\uDF2B\uFE0F"
    },
    {
        v: 13,
        emoji: "\uD83E\uDD78"
    },
    {
        v: 12.1,
        emoji: "\uD83E\uDDD1\u200D\uD83E\uDDB0"
    },
    {
        v: 12,
        emoji: "\uD83E\uDD71"
    },
    {
        v: 11,
        emoji: "\uD83E\uDD70"
    },
    {
        v: 5,
        emoji: "\uD83E\uDD29"
    },
    {
        v: 4,
        emoji: "\uD83D\uDC71\u200D\u2640\uFE0F"
    },
    {
        v: 3,
        emoji: "\uD83E\uDD23"
    },
    {
        v: 2,
        emoji: "\uD83D\uDC4B\uD83C\uDFFB"
    },
    {
        v: 1,
        emoji: "\uD83D\uDE43"
    }, 
];
function $c84d045dcc34faf5$var$latestVersion() {
    for (const { v: v , emoji: emoji  } of $c84d045dcc34faf5$var$VERSIONS){
        if ($c84d045dcc34faf5$var$isSupported(emoji)) return v;
    }
}
function $c84d045dcc34faf5$var$noCountryFlags() {
    if ($c84d045dcc34faf5$var$isSupported("\uD83C\uDDE8\uD83C\uDDE6")) return false;
    return true;
}
function $c84d045dcc34faf5$var$isSupported(emoji) {
    if ($c84d045dcc34faf5$var$CACHE.has(emoji)) return $c84d045dcc34faf5$var$CACHE.get(emoji);
    const supported = $c84d045dcc34faf5$var$isEmojiSupported(emoji);
    $c84d045dcc34faf5$var$CACHE.set(emoji, supported);
    return supported;
}
// https://github.com/koala-interactive/is-emoji-supported
const $c84d045dcc34faf5$var$isEmojiSupported = (()=>{
    let ctx = null;
    try {
        if (!navigator.userAgent.includes("jsdom")) ctx = document.createElement("canvas").getContext("2d", {
            willReadFrequently: true
        });
    } catch  {}
    // Not in browser env
    if (!ctx) return ()=>false;
    const CANVAS_HEIGHT = 25;
    const CANVAS_WIDTH = 20;
    const textSize = Math.floor(CANVAS_HEIGHT / 2);
    // Initialize convas context
    ctx.font = textSize + "px Arial, Sans-Serif";
    ctx.textBaseline = "top";
    ctx.canvas.width = CANVAS_WIDTH * 2;
    ctx.canvas.height = CANVAS_HEIGHT;
    return (unicode)=>{
        ctx.clearRect(0, 0, CANVAS_WIDTH * 2, CANVAS_HEIGHT);
        // Draw in red on the left
        ctx.fillStyle = "#FF0000";
        ctx.fillText(unicode, 0, 22);
        // Draw in blue on right
        ctx.fillStyle = "#0000FF";
        ctx.fillText(unicode, CANVAS_WIDTH, 22);
        const a = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT).data;
        const count = a.length;
        let i = 0;
        // Search the first visible pixel
        for(; i < count && !a[i + 3]; i += 4);
        // No visible pixel
        if (i >= count) return false;
        // Emoji has immutable color, so we check the color of the emoji in two different colors
        // the result show be the same.
        const x = CANVAS_WIDTH + i / 4 % CANVAS_WIDTH;
        const y = Math.floor(i / 4 / CANVAS_WIDTH);
        const b = ctx.getImageData(x, y, 1, 1).data;
        if (a[i] !== b[0] || a[i + 2] !== b[2]) return false;
        // Some emojis are a contraction of different ones, so if it's not
        // supported, it will show multiple characters
        if (ctx.measureText(unicode).width >= CANVAS_WIDTH) return false;
        // Supported
        return true;
    };
})();
var $c84d045dcc34faf5$export$2e2bcd8739ae039 = {
    latestVersion: $c84d045dcc34faf5$var$latestVersion,
    noCountryFlags: $c84d045dcc34faf5$var$noCountryFlags
};



const $b22cfd0a55410b4f$var$DEFAULTS = [
    "+1",
    "grinning",
    "kissing_heart",
    "heart_eyes",
    "laughing",
    "stuck_out_tongue_winking_eye",
    "sweat_smile",
    "joy",
    "scream",
    "disappointed",
    "unamused",
    "weary",
    "sob",
    "sunglasses",
    "heart", 
];
let $b22cfd0a55410b4f$var$Index = null;
function $b22cfd0a55410b4f$var$add(emoji) {
    $b22cfd0a55410b4f$var$Index || ($b22cfd0a55410b4f$var$Index = ($f72b75cf796873c7$export$2e2bcd8739ae039).get("frequently") || {});
    const emojiId = emoji.id || emoji;
    if (!emojiId) return;
    $b22cfd0a55410b4f$var$Index[emojiId] || ($b22cfd0a55410b4f$var$Index[emojiId] = 0);
    $b22cfd0a55410b4f$var$Index[emojiId] += 1;
    ($f72b75cf796873c7$export$2e2bcd8739ae039).set("last", emojiId);
    ($f72b75cf796873c7$export$2e2bcd8739ae039).set("frequently", $b22cfd0a55410b4f$var$Index);
}
function $b22cfd0a55410b4f$var$get({ maxFrequentRows: maxFrequentRows , perLine: perLine  }) {
    if (!maxFrequentRows) return [];
    $b22cfd0a55410b4f$var$Index || ($b22cfd0a55410b4f$var$Index = ($f72b75cf796873c7$export$2e2bcd8739ae039).get("frequently"));
    let emojiIds = [];
    if (!$b22cfd0a55410b4f$var$Index) {
        $b22cfd0a55410b4f$var$Index = {};
        for(let i in $b22cfd0a55410b4f$var$DEFAULTS.slice(0, perLine)){
            const emojiId = $b22cfd0a55410b4f$var$DEFAULTS[i];
            $b22cfd0a55410b4f$var$Index[emojiId] = perLine - i;
            emojiIds.push(emojiId);
        }
        return emojiIds;
    }
    const max = maxFrequentRows * perLine;
    const last = ($f72b75cf796873c7$export$2e2bcd8739ae039).get("last");
    for(let emojiId in $b22cfd0a55410b4f$var$Index)emojiIds.push(emojiId);
    emojiIds.sort((a, b)=>{
        const aScore = $b22cfd0a55410b4f$var$Index[b];
        const bScore = $b22cfd0a55410b4f$var$Index[a];
        if (aScore == bScore) return a.localeCompare(b);
        return aScore - bScore;
    });
    if (emojiIds.length > max) {
        const removedIds = emojiIds.slice(max);
        emojiIds = emojiIds.slice(0, max);
        for (let removedId of removedIds){
            if (removedId == last) continue;
            delete $b22cfd0a55410b4f$var$Index[removedId];
        }
        if (last && emojiIds.indexOf(last) == -1) {
            delete $b22cfd0a55410b4f$var$Index[emojiIds[emojiIds.length - 1]];
            emojiIds.splice(-1, 1, last);
        }
        ($f72b75cf796873c7$export$2e2bcd8739ae039).set("frequently", $b22cfd0a55410b4f$var$Index);
    }
    return emojiIds;
}
var $b22cfd0a55410b4f$export$2e2bcd8739ae039 = {
    add: $b22cfd0a55410b4f$var$add,
    get: $b22cfd0a55410b4f$var$get,
    DEFAULTS: $b22cfd0a55410b4f$var$DEFAULTS
};


var $8d50d93417ef682a$exports = {};
$8d50d93417ef682a$exports = JSON.parse('{"search":"Search","search_no_results_1":"Oh no!","search_no_results_2":"That emoji couldn\u2019t be found","pick":"Pick an emoji\u2026","add_custom":"Add custom emoji","categories":{"activity":"Activity","custom":"Custom","flags":"Flags","foods":"Food & Drink","frequent":"Frequently used","nature":"Animals & Nature","objects":"Objects","people":"Smileys & People","places":"Travel & Places","search":"Search Results","symbols":"Symbols"},"skins":{"1":"Default","2":"Light","3":"Medium-Light","4":"Medium","5":"Medium-Dark","6":"Dark","choose":"Choose default skin tone"}}');


var $b247ea80b67298d5$export$2e2bcd8739ae039 = {
    autoFocus: {
        value: false
    },
    dynamicWidth: {
        value: false
    },
    emojiButtonColors: {
        value: null
    },
    emojiButtonRadius: {
        value: "100%"
    },
    emojiButtonSize: {
        value: 36
    },
    emojiSize: {
        value: 24
    },
    emojiVersion: {
        value: 15,
        choices: [
            1,
            2,
            3,
            4,
            5,
            11,
            12,
            12.1,
            13,
            13.1,
            14,
            15
        ]
    },
    exceptEmojis: {
        value: []
    },
    icons: {
        value: "auto",
        choices: [
            "auto",
            "outline",
            "solid"
        ]
    },
    locale: {
        value: "en",
        choices: [
            "en",
            "ar",
            "be",
            "cs",
            "de",
            "es",
            "fa",
            "fi",
            "fr",
            "hi",
            "it",
            "ja",
            "ko",
            "nl",
            "pl",
            "pt",
            "ru",
            "sa",
            "tr",
            "uk",
            "vi",
            "zh", 
        ]
    },
    maxFrequentRows: {
        value: 4
    },
    navPosition: {
        value: "top",
        choices: [
            "top",
            "bottom",
            "none"
        ]
    },
    noCountryFlags: {
        value: false
    },
    noResultsEmoji: {
        value: null
    },
    perLine: {
        value: 9
    },
    previewEmoji: {
        value: null
    },
    previewPosition: {
        value: "bottom",
        choices: [
            "top",
            "bottom",
            "none"
        ]
    },
    searchPosition: {
        value: "sticky",
        choices: [
            "sticky",
            "static",
            "none"
        ]
    },
    set: {
        value: "native",
        choices: [
            "native",
            "apple",
            "facebook",
            "google",
            "twitter"
        ]
    },
    skin: {
        value: 1,
        choices: [
            1,
            2,
            3,
            4,
            5,
            6
        ]
    },
    skinTonePosition: {
        value: "preview",
        choices: [
            "preview",
            "search",
            "none"
        ]
    },
    theme: {
        value: "auto",
        choices: [
            "auto",
            "light",
            "dark"
        ]
    },
    // Data
    categories: null,
    categoryIcons: null,
    custom: null,
    data: null,
    i18n: null,
    // Callbacks
    getImageURL: null,
    getSpritesheetURL: null,
    onAddCustomEmoji: null,
    onClickOutside: null,
    onEmojiSelect: null,
    // Deprecated
    stickySearch: {
        deprecated: true,
        value: true
    }
};



let $7adb23b0109cc36a$export$dbe3113d60765c1a = null;
let $7adb23b0109cc36a$export$2d0294657ab35f1b = null;
const $7adb23b0109cc36a$var$fetchCache = {};
async function $7adb23b0109cc36a$var$fetchJSON(src) {
    if ($7adb23b0109cc36a$var$fetchCache[src]) return $7adb23b0109cc36a$var$fetchCache[src];
    const response = await fetch(src);
    const json = await response.json();
    $7adb23b0109cc36a$var$fetchCache[src] = json;
    return json;
}
let $7adb23b0109cc36a$var$promise = null;
let $7adb23b0109cc36a$var$initCallback = null;
let $7adb23b0109cc36a$var$initialized = false;
function $7adb23b0109cc36a$export$2cd8252107eb640b(options, { caller: caller  } = {}) {
    $7adb23b0109cc36a$var$promise || ($7adb23b0109cc36a$var$promise = new Promise((resolve)=>{
        $7adb23b0109cc36a$var$initCallback = resolve;
    }));
    if (options) $7adb23b0109cc36a$var$_init(options);
    else if (caller && !$7adb23b0109cc36a$var$initialized) console.warn(`\`${caller}\` requires data to be initialized first. Promise will be pending until \`init\` is called.`);
    return $7adb23b0109cc36a$var$promise;
}
async function $7adb23b0109cc36a$var$_init(props) {
    $7adb23b0109cc36a$var$initialized = true;
    let { emojiVersion: emojiVersion , set: set , locale: locale  } = props;
    emojiVersion || (emojiVersion = ($b247ea80b67298d5$export$2e2bcd8739ae039).emojiVersion.value);
    set || (set = ($b247ea80b67298d5$export$2e2bcd8739ae039).set.value);
    locale || (locale = ($b247ea80b67298d5$export$2e2bcd8739ae039).locale.value);
    if (!$7adb23b0109cc36a$export$2d0294657ab35f1b) {
        $7adb23b0109cc36a$export$2d0294657ab35f1b = (typeof props.data === "function" ? await props.data() : props.data) || await $7adb23b0109cc36a$var$fetchJSON(`https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/sets/${emojiVersion}/${set}.json`);
        $7adb23b0109cc36a$export$2d0294657ab35f1b.emoticons = {};
        $7adb23b0109cc36a$export$2d0294657ab35f1b.natives = {};
        $7adb23b0109cc36a$export$2d0294657ab35f1b.categories.unshift({
            id: "frequent",
            emojis: []
        });
        for(const alias in $7adb23b0109cc36a$export$2d0294657ab35f1b.aliases){
            const emojiId = $7adb23b0109cc36a$export$2d0294657ab35f1b.aliases[alias];
            const emoji = $7adb23b0109cc36a$export$2d0294657ab35f1b.emojis[emojiId];
            if (!emoji) continue;
            emoji.aliases || (emoji.aliases = []);
            emoji.aliases.push(alias);
        }
        $7adb23b0109cc36a$export$2d0294657ab35f1b.originalCategories = $7adb23b0109cc36a$export$2d0294657ab35f1b.categories;
    } else $7adb23b0109cc36a$export$2d0294657ab35f1b.categories = $7adb23b0109cc36a$export$2d0294657ab35f1b.categories.filter((c)=>{
        const isCustom = !!c.name;
        if (!isCustom) return true;
        return false;
    });
    $7adb23b0109cc36a$export$dbe3113d60765c1a = (typeof props.i18n === "function" ? await props.i18n() : props.i18n) || (locale == "en" ? ((/*@__PURE__*/$parcel$interopDefault($8d50d93417ef682a$exports))) : await $7adb23b0109cc36a$var$fetchJSON(`https://cdn.jsdelivr.net/npm/@emoji-mart/data@latest/i18n/${locale}.json`));
    if (props.custom) for(let i in props.custom){
        i = parseInt(i);
        const category = props.custom[i];
        const prevCategory = props.custom[i - 1];
        if (!category.emojis || !category.emojis.length) continue;
        category.id || (category.id = `custom_${i + 1}`);
        category.name || (category.name = $7adb23b0109cc36a$export$dbe3113d60765c1a.categories.custom);
        if (prevCategory && !category.icon) category.target = prevCategory.target || prevCategory;
        $7adb23b0109cc36a$export$2d0294657ab35f1b.categories.push(category);
        for (const emoji of category.emojis)$7adb23b0109cc36a$export$2d0294657ab35f1b.emojis[emoji.id] = emoji;
    }
    if (props.categories) $7adb23b0109cc36a$export$2d0294657ab35f1b.categories = $7adb23b0109cc36a$export$2d0294657ab35f1b.originalCategories.filter((c)=>{
        return props.categories.indexOf(c.id) != -1;
    }).sort((c1, c2)=>{
        const i1 = props.categories.indexOf(c1.id);
        const i2 = props.categories.indexOf(c2.id);
        return i1 - i2;
    });
    let latestVersionSupport = null;
    let noCountryFlags = null;
    if (set == "native") {
        latestVersionSupport = ($c84d045dcc34faf5$export$2e2bcd8739ae039).latestVersion();
        noCountryFlags = props.noCountryFlags || ($c84d045dcc34faf5$export$2e2bcd8739ae039).noCountryFlags();
    }
    let categoryIndex = $7adb23b0109cc36a$export$2d0294657ab35f1b.categories.length;
    let resetSearchIndex = false;
    while(categoryIndex--){
        const category = $7adb23b0109cc36a$export$2d0294657ab35f1b.categories[categoryIndex];
        if (category.id == "frequent") {
            let { maxFrequentRows: maxFrequentRows , perLine: perLine  } = props;
            maxFrequentRows = maxFrequentRows >= 0 ? maxFrequentRows : ($b247ea80b67298d5$export$2e2bcd8739ae039).maxFrequentRows.value;
            perLine || (perLine = ($b247ea80b67298d5$export$2e2bcd8739ae039).perLine.value);
            category.emojis = ($b22cfd0a55410b4f$export$2e2bcd8739ae039).get({
                maxFrequentRows: maxFrequentRows,
                perLine: perLine
            });
        }
        if (!category.emojis || !category.emojis.length) {
            $7adb23b0109cc36a$export$2d0294657ab35f1b.categories.splice(categoryIndex, 1);
            continue;
        }
        const { categoryIcons: categoryIcons  } = props;
        if (categoryIcons) {
            const icon = categoryIcons[category.id];
            if (icon && !category.icon) category.icon = icon;
        }
        let emojiIndex = category.emojis.length;
        while(emojiIndex--){
            const emojiId = category.emojis[emojiIndex];
            const emoji = emojiId.id ? emojiId : $7adb23b0109cc36a$export$2d0294657ab35f1b.emojis[emojiId];
            const ignore = ()=>{
                category.emojis.splice(emojiIndex, 1);
            };
            if (!emoji || props.exceptEmojis && props.exceptEmojis.includes(emoji.id)) {
                ignore();
                continue;
            }
            if (latestVersionSupport && emoji.version > latestVersionSupport) {
                ignore();
                continue;
            }
            if (noCountryFlags && category.id == "flags") {
                if (!($e6eae5155b87f591$export$bcb25aa587e9cb13).includes(emoji.id)) {
                    ignore();
                    continue;
                }
            }
            if (!emoji.search) {
                resetSearchIndex = true;
                emoji.search = "," + [
                    [
                        emoji.id,
                        false
                    ],
                    [
                        emoji.name,
                        true
                    ],
                    [
                        emoji.keywords,
                        false
                    ],
                    [
                        emoji.emoticons,
                        false
                    ], 
                ].map(([strings, split])=>{
                    if (!strings) return;
                    return (Array.isArray(strings) ? strings : [
                        strings
                    ]).map((string)=>{
                        return (split ? string.split(/[-|_|\s]+/) : [
                            string
                        ]).map((s)=>s.toLowerCase());
                    }).flat();
                }).flat().filter((a)=>a && a.trim()).join(",");
                if (emoji.emoticons) for (const emoticon of emoji.emoticons){
                    if ($7adb23b0109cc36a$export$2d0294657ab35f1b.emoticons[emoticon]) continue;
                    $7adb23b0109cc36a$export$2d0294657ab35f1b.emoticons[emoticon] = emoji.id;
                }
                let skinIndex = 0;
                for (const skin of emoji.skins){
                    if (!skin) continue;
                    skinIndex++;
                    const { native: native  } = skin;
                    if (native) {
                        $7adb23b0109cc36a$export$2d0294657ab35f1b.natives[native] = emoji.id;
                        emoji.search += `,${native}`;
                    }
                    const skinShortcodes = skinIndex == 1 ? "" : `:skin-tone-${skinIndex}:`;
                    skin.shortcodes = `:${emoji.id}:${skinShortcodes}`;
                }
            }
        }
    }
    if (resetSearchIndex) ($c4d155af13ad4d4b$export$2e2bcd8739ae039).reset();
    $7adb23b0109cc36a$var$initCallback();
}
function $7adb23b0109cc36a$export$75fe5f91d452f94b(props, defaultProps, element) {
    props || (props = {});
    const _props = {};
    for(let k in defaultProps)_props[k] = $7adb23b0109cc36a$export$88c9ddb45cea7241(k, props, defaultProps, element);
    return _props;
}
function $7adb23b0109cc36a$export$88c9ddb45cea7241(propName, props, defaultProps, element) {
    const defaults = defaultProps[propName];
    let value = element && element.getAttribute(propName) || (props[propName] != null && props[propName] != undefined ? props[propName] : null);
    if (!defaults) return value;
    if (value != null && defaults.value && typeof defaults.value != typeof value) {
        if (typeof defaults.value == "boolean") value = value == "false" ? false : true;
        else value = defaults.value.constructor(value);
    }
    if (defaults.transform && value) value = defaults.transform(value);
    if (value == null || defaults.choices && defaults.choices.indexOf(value) == -1) value = defaults.value;
    return value;
}


const $c4d155af13ad4d4b$var$SHORTCODES_REGEX = /^(?:\:([^\:]+)\:)(?:\:skin-tone-(\d)\:)?$/;
let $c4d155af13ad4d4b$var$Pool = null;
function $c4d155af13ad4d4b$var$get(emojiId) {
    if (emojiId.id) return emojiId;
    return ($7adb23b0109cc36a$export$2d0294657ab35f1b).emojis[emojiId] || ($7adb23b0109cc36a$export$2d0294657ab35f1b).emojis[($7adb23b0109cc36a$export$2d0294657ab35f1b).aliases[emojiId]] || ($7adb23b0109cc36a$export$2d0294657ab35f1b).emojis[($7adb23b0109cc36a$export$2d0294657ab35f1b).natives[emojiId]];
}
function $c4d155af13ad4d4b$var$reset() {
    $c4d155af13ad4d4b$var$Pool = null;
}
async function $c4d155af13ad4d4b$var$search(value, { maxResults: maxResults , caller: caller  } = {}) {
    if (!value || !value.trim().length) return null;
    maxResults || (maxResults = 90);
    await ($7adb23b0109cc36a$export$2cd8252107eb640b)(null, {
        caller: caller || "SearchIndex.search"
    });
    const values = value.toLowerCase().replace(/(\w)-/, "$1 ").split(/[\s|,]+/).filter((word, i, words)=>{
        return word.trim() && words.indexOf(word) == i;
    });
    if (!values.length) return;
    let pool = $c4d155af13ad4d4b$var$Pool || ($c4d155af13ad4d4b$var$Pool = Object.values(($7adb23b0109cc36a$export$2d0294657ab35f1b).emojis));
    let results, scores;
    for (const value1 of values){
        if (!pool.length) break;
        results = [];
        scores = {};
        for (const emoji of pool){
            if (!emoji.search) continue;
            const score = emoji.search.indexOf(`,${value1}`);
            if (score == -1) continue;
            results.push(emoji);
            scores[emoji.id] || (scores[emoji.id] = 0);
            scores[emoji.id] += emoji.id == value1 ? 0 : score + 1;
        }
        pool = results;
    }
    if (results.length < 2) return results;
    results.sort((a, b)=>{
        const aScore = scores[a.id];
        const bScore = scores[b.id];
        if (aScore == bScore) return a.id.localeCompare(b.id);
        return aScore - bScore;
    });
    if (results.length > maxResults) results = results.slice(0, maxResults);
    return results;
}
var $c4d155af13ad4d4b$export$2e2bcd8739ae039 = {
    search: $c4d155af13ad4d4b$var$search,
    get: $c4d155af13ad4d4b$var$get,
    reset: $c4d155af13ad4d4b$var$reset,
    SHORTCODES_REGEX: $c4d155af13ad4d4b$var$SHORTCODES_REGEX
};


const $e6eae5155b87f591$export$bcb25aa587e9cb13 = [
    "checkered_flag",
    "crossed_flags",
    "pirate_flag",
    "rainbow-flag",
    "transgender_flag",
    "triangular_flag_on_post",
    "waving_black_flag",
    "waving_white_flag", 
];


function $693b183b0a78708f$export$9cb4719e2e525b7a(a, b) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((val, index)=>val == b[index]);
}
async function $693b183b0a78708f$export$e772c8ff12451969(frames = 1) {
    for(let _ in [
        ...Array(frames).keys()
    ])await new Promise(requestAnimationFrame);
}
function $693b183b0a78708f$export$d10ac59fbe52a745(emoji, { skinIndex: skinIndex = 0  } = {}) {
    const skin = emoji.skins[skinIndex] || (()=>{
        skinIndex = 0;
        return emoji.skins[skinIndex];
    })();
    const emojiData = {
        id: emoji.id,
        name: emoji.name,
        native: skin.native,
        unified: skin.unified,
        keywords: emoji.keywords,
        shortcodes: skin.shortcodes || emoji.shortcodes
    };
    if (emoji.skins.length > 1) emojiData.skin = skinIndex + 1;
    if (skin.src) emojiData.src = skin.src;
    if (emoji.aliases && emoji.aliases.length) emojiData.aliases = emoji.aliases;
    if (emoji.emoticons && emoji.emoticons.length) emojiData.emoticons = emoji.emoticons;
    return emojiData;
}





const $fcccfb36ed0cde68$var$categories = {
    activity: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M12 0C5.373 0 0 5.372 0 12c0 6.627 5.373 12 12 12 6.628 0 12-5.373 12-12 0-6.628-5.372-12-12-12m9.949 11H17.05c.224-2.527 1.232-4.773 1.968-6.113A9.966 9.966 0 0 1 21.949 11M13 11V2.051a9.945 9.945 0 0 1 4.432 1.564c-.858 1.491-2.156 4.22-2.392 7.385H13zm-2 0H8.961c-.238-3.165-1.536-5.894-2.393-7.385A9.95 9.95 0 0 1 11 2.051V11zm0 2v8.949a9.937 9.937 0 0 1-4.432-1.564c.857-1.492 2.155-4.221 2.393-7.385H11zm4.04 0c.236 3.164 1.534 5.893 2.392 7.385A9.92 9.92 0 0 1 13 21.949V13h2.04zM4.982 4.887C5.718 6.227 6.726 8.473 6.951 11h-4.9a9.977 9.977 0 0 1 2.931-6.113M2.051 13h4.9c-.226 2.527-1.233 4.771-1.969 6.113A9.972 9.972 0 0 1 2.051 13m16.967 6.113c-.735-1.342-1.744-3.586-1.968-6.113h4.899a9.961 9.961 0 0 1-2.931 6.113"
            })
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M16.17 337.5c0 44.98 7.565 83.54 13.98 107.9C35.22 464.3 50.46 496 174.9 496c9.566 0 19.59-.4707 29.84-1.271L17.33 307.3C16.53 317.6 16.17 327.7 16.17 337.5zM495.8 174.5c0-44.98-7.565-83.53-13.98-107.9c-4.688-17.54-18.34-31.23-36.04-35.95C435.5 27.91 392.9 16 337 16c-9.564 0-19.59 .4707-29.84 1.271l187.5 187.5C495.5 194.4 495.8 184.3 495.8 174.5zM26.77 248.8l236.3 236.3c142-36.1 203.9-150.4 222.2-221.1L248.9 26.87C106.9 62.96 45.07 177.2 26.77 248.8zM256 335.1c0 9.141-7.474 16-16 16c-4.094 0-8.188-1.564-11.31-4.689L164.7 283.3C161.6 280.2 160 276.1 160 271.1c0-8.529 6.865-16 16-16c4.095 0 8.189 1.562 11.31 4.688l64.01 64C254.4 327.8 256 331.9 256 335.1zM304 287.1c0 9.141-7.474 16-16 16c-4.094 0-8.188-1.564-11.31-4.689L212.7 235.3C209.6 232.2 208 228.1 208 223.1c0-9.141 7.473-16 16-16c4.094 0 8.188 1.562 11.31 4.688l64.01 64.01C302.5 279.8 304 283.9 304 287.1zM256 175.1c0-9.141 7.473-16 16-16c4.094 0 8.188 1.562 11.31 4.688l64.01 64.01c3.125 3.125 4.688 7.219 4.688 11.31c0 9.133-7.468 16-16 16c-4.094 0-8.189-1.562-11.31-4.688l-64.01-64.01C257.6 184.2 256 180.1 256 175.1z"
            })
        })
    },
    custom: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 448 512",
        children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
            d: "M417.1 368c-5.937 10.27-16.69 16-27.75 16c-5.422 0-10.92-1.375-15.97-4.281L256 311.4V448c0 17.67-14.33 32-31.1 32S192 465.7 192 448V311.4l-118.3 68.29C68.67 382.6 63.17 384 57.75 384c-11.06 0-21.81-5.734-27.75-16c-8.828-15.31-3.594-34.88 11.72-43.72L159.1 256L41.72 187.7C26.41 178.9 21.17 159.3 29.1 144C36.63 132.5 49.26 126.7 61.65 128.2C65.78 128.7 69.88 130.1 73.72 132.3L192 200.6V64c0-17.67 14.33-32 32-32S256 46.33 256 64v136.6l118.3-68.29c3.838-2.213 7.939-3.539 12.07-4.051C398.7 126.7 411.4 132.5 417.1 144c8.828 15.31 3.594 34.88-11.72 43.72L288 256l118.3 68.28C421.6 333.1 426.8 352.7 417.1 368z"
        })
    }),
    flags: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M0 0l6.084 24H8L1.916 0zM21 5h-4l-1-4H4l3 12h3l1 4h13L21 5zM6.563 3h7.875l2 8H8.563l-2-8zm8.832 10l-2.856 1.904L12.063 13h3.332zM19 13l-1.5-6h1.938l2 8H16l3-2z"
            })
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M64 496C64 504.8 56.75 512 48 512h-32C7.25 512 0 504.8 0 496V32c0-17.75 14.25-32 32-32s32 14.25 32 32V496zM476.3 0c-6.365 0-13.01 1.35-19.34 4.233c-45.69 20.86-79.56 27.94-107.8 27.94c-59.96 0-94.81-31.86-163.9-31.87C160.9 .3055 131.6 4.867 96 15.75v350.5c32-9.984 59.87-14.1 84.85-14.1c73.63 0 124.9 31.78 198.6 31.78c31.91 0 68.02-5.971 111.1-23.09C504.1 355.9 512 344.4 512 332.1V30.73C512 11.1 495.3 0 476.3 0z"
            })
        })
    },
    foods: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M17 4.978c-1.838 0-2.876.396-3.68.934.513-1.172 1.768-2.934 4.68-2.934a1 1 0 0 0 0-2c-2.921 0-4.629 1.365-5.547 2.512-.064.078-.119.162-.18.244C11.73 1.838 10.798.023 9.207.023 8.579.022 7.85.306 7 .978 5.027 2.54 5.329 3.902 6.492 4.999 3.609 5.222 0 7.352 0 12.969c0 4.582 4.961 11.009 9 11.009 1.975 0 2.371-.486 3-1 .629.514 1.025 1 3 1 4.039 0 9-6.418 9-11 0-5.953-4.055-8-7-8M8.242 2.546c.641-.508.943-.523.965-.523.426.169.975 1.405 1.357 3.055-1.527-.629-2.741-1.352-2.98-1.846.059-.112.241-.356.658-.686M15 21.978c-1.08 0-1.21-.109-1.559-.402l-.176-.146c-.367-.302-.816-.452-1.266-.452s-.898.15-1.266.452l-.176.146c-.347.292-.477.402-1.557.402-2.813 0-7-5.389-7-9.009 0-5.823 4.488-5.991 5-5.991 1.939 0 2.484.471 3.387 1.251l.323.276a1.995 1.995 0 0 0 2.58 0l.323-.276c.902-.78 1.447-1.251 3.387-1.251.512 0 5 .168 5 6 0 3.617-4.187 9-7 9"
            })
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M481.9 270.1C490.9 279.1 496 291.3 496 304C496 316.7 490.9 328.9 481.9 337.9C472.9 346.9 460.7 352 448 352H64C51.27 352 39.06 346.9 30.06 337.9C21.06 328.9 16 316.7 16 304C16 291.3 21.06 279.1 30.06 270.1C39.06 261.1 51.27 256 64 256H448C460.7 256 472.9 261.1 481.9 270.1zM475.3 388.7C478.3 391.7 480 395.8 480 400V416C480 432.1 473.3 449.3 461.3 461.3C449.3 473.3 432.1 480 416 480H96C79.03 480 62.75 473.3 50.75 461.3C38.74 449.3 32 432.1 32 416V400C32 395.8 33.69 391.7 36.69 388.7C39.69 385.7 43.76 384 48 384H464C468.2 384 472.3 385.7 475.3 388.7zM50.39 220.8C45.93 218.6 42.03 215.5 38.97 211.6C35.91 207.7 33.79 203.2 32.75 198.4C31.71 193.5 31.8 188.5 32.99 183.7C54.98 97.02 146.5 32 256 32C365.5 32 457 97.02 479 183.7C480.2 188.5 480.3 193.5 479.2 198.4C478.2 203.2 476.1 207.7 473 211.6C469.1 215.5 466.1 218.6 461.6 220.8C457.2 222.9 452.3 224 447.3 224H64.67C59.73 224 54.84 222.9 50.39 220.8zM372.7 116.7C369.7 119.7 368 123.8 368 128C368 131.2 368.9 134.3 370.7 136.9C372.5 139.5 374.1 141.6 377.9 142.8C380.8 143.1 384 144.3 387.1 143.7C390.2 143.1 393.1 141.6 395.3 139.3C397.6 137.1 399.1 134.2 399.7 131.1C400.3 128 399.1 124.8 398.8 121.9C397.6 118.1 395.5 116.5 392.9 114.7C390.3 112.9 387.2 111.1 384 111.1C379.8 111.1 375.7 113.7 372.7 116.7V116.7zM244.7 84.69C241.7 87.69 240 91.76 240 96C240 99.16 240.9 102.3 242.7 104.9C244.5 107.5 246.1 109.6 249.9 110.8C252.8 111.1 256 112.3 259.1 111.7C262.2 111.1 265.1 109.6 267.3 107.3C269.6 105.1 271.1 102.2 271.7 99.12C272.3 96.02 271.1 92.8 270.8 89.88C269.6 86.95 267.5 84.45 264.9 82.7C262.3 80.94 259.2 79.1 256 79.1C251.8 79.1 247.7 81.69 244.7 84.69V84.69zM116.7 116.7C113.7 119.7 112 123.8 112 128C112 131.2 112.9 134.3 114.7 136.9C116.5 139.5 118.1 141.6 121.9 142.8C124.8 143.1 128 144.3 131.1 143.7C134.2 143.1 137.1 141.6 139.3 139.3C141.6 137.1 143.1 134.2 143.7 131.1C144.3 128 143.1 124.8 142.8 121.9C141.6 118.1 139.5 116.5 136.9 114.7C134.3 112.9 131.2 111.1 128 111.1C123.8 111.1 119.7 113.7 116.7 116.7L116.7 116.7z"
            })
        })
    },
    frequent: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M13 4h-2l-.001 7H9v2h2v2h2v-2h4v-2h-4z"
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"
                })
            ]
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M256 512C114.6 512 0 397.4 0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512zM232 256C232 264 236 271.5 242.7 275.1L338.7 339.1C349.7 347.3 364.6 344.3 371.1 333.3C379.3 322.3 376.3 307.4 365.3 300L280 243.2V120C280 106.7 269.3 96 255.1 96C242.7 96 231.1 106.7 231.1 120L232 256z"
            })
        })
    },
    nature: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M15.5 8a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 15.5 8M8.5 8a1.5 1.5 0 1 0 .001 3.001A1.5 1.5 0 0 0 8.5 8"
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M18.933 0h-.027c-.97 0-2.138.787-3.018 1.497-1.274-.374-2.612-.51-3.887-.51-1.285 0-2.616.133-3.874.517C7.245.79 6.069 0 5.093 0h-.027C3.352 0 .07 2.67.002 7.026c-.039 2.479.276 4.238 1.04 5.013.254.258.882.677 1.295.882.191 3.177.922 5.238 2.536 6.38.897.637 2.187.949 3.2 1.102C8.04 20.6 8 20.795 8 21c0 1.773 2.35 3 4 3 1.648 0 4-1.227 4-3 0-.201-.038-.393-.072-.586 2.573-.385 5.435-1.877 5.925-7.587.396-.22.887-.568 1.104-.788.763-.774 1.079-2.534 1.04-5.013C23.929 2.67 20.646 0 18.933 0M3.223 9.135c-.237.281-.837 1.155-.884 1.238-.15-.41-.368-1.349-.337-3.291.051-3.281 2.478-4.972 3.091-5.031.256.015.731.27 1.265.646-1.11 1.171-2.275 2.915-2.352 5.125-.133.546-.398.858-.783 1.313M12 22c-.901 0-1.954-.693-2-1 0-.654.475-1.236 1-1.602V20a1 1 0 1 0 2 0v-.602c.524.365 1 .947 1 1.602-.046.307-1.099 1-2 1m3-3.48v.02a4.752 4.752 0 0 0-1.262-1.02c1.092-.516 2.239-1.334 2.239-2.217 0-1.842-1.781-2.195-3.977-2.195-2.196 0-3.978.354-3.978 2.195 0 .883 1.148 1.701 2.238 2.217A4.8 4.8 0 0 0 9 18.539v-.025c-1-.076-2.182-.281-2.973-.842-1.301-.92-1.838-3.045-1.853-6.478l.023-.041c.496-.826 1.49-1.45 1.804-3.102 0-2.047 1.357-3.631 2.362-4.522C9.37 3.178 10.555 3 11.948 3c1.447 0 2.685.192 3.733.57 1 .9 2.316 2.465 2.316 4.48.313 1.651 1.307 2.275 1.803 3.102.035.058.068.117.102.178-.059 5.967-1.949 7.01-4.902 7.19m6.628-8.202c-.037-.065-.074-.13-.113-.195a7.587 7.587 0 0 0-.739-.987c-.385-.455-.648-.768-.782-1.313-.076-2.209-1.241-3.954-2.353-5.124.531-.376 1.004-.63 1.261-.647.636.071 3.044 1.764 3.096 5.031.027 1.81-.347 3.218-.37 3.235"
                })
            ]
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 576 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M332.7 19.85C334.6 8.395 344.5 0 356.1 0C363.6 0 370.6 3.52 375.1 9.502L392 32H444.1C456.8 32 469.1 37.06 478.1 46.06L496 64H552C565.3 64 576 74.75 576 88V112C576 156.2 540.2 192 496 192H426.7L421.6 222.5L309.6 158.5L332.7 19.85zM448 64C439.2 64 432 71.16 432 80C432 88.84 439.2 96 448 96C456.8 96 464 88.84 464 80C464 71.16 456.8 64 448 64zM416 256.1V480C416 497.7 401.7 512 384 512H352C334.3 512 320 497.7 320 480V364.8C295.1 377.1 268.8 384 240 384C211.2 384 184 377.1 160 364.8V480C160 497.7 145.7 512 128 512H96C78.33 512 64 497.7 64 480V249.8C35.23 238.9 12.64 214.5 4.836 183.3L.9558 167.8C-3.331 150.6 7.094 133.2 24.24 128.1C41.38 124.7 58.76 135.1 63.05 152.2L66.93 167.8C70.49 182 83.29 191.1 97.97 191.1H303.8L416 256.1z"
            })
        })
    },
    objects: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M12 0a9 9 0 0 0-5 16.482V21s2.035 3 5 3 5-3 5-3v-4.518A9 9 0 0 0 12 0zm0 2c3.86 0 7 3.141 7 7s-3.14 7-7 7-7-3.141-7-7 3.14-7 7-7zM9 17.477c.94.332 1.946.523 3 .523s2.06-.19 3-.523v.834c-.91.436-1.925.689-3 .689a6.924 6.924 0 0 1-3-.69v-.833zm.236 3.07A8.854 8.854 0 0 0 12 21c.965 0 1.888-.167 2.758-.451C14.155 21.173 13.153 22 12 22c-1.102 0-2.117-.789-2.764-1.453z"
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M14.745 12.449h-.004c-.852-.024-1.188-.858-1.577-1.824-.421-1.061-.703-1.561-1.182-1.566h-.009c-.481 0-.783.497-1.235 1.537-.436.982-.801 1.811-1.636 1.791l-.276-.043c-.565-.171-.853-.691-1.284-1.794-.125-.313-.202-.632-.27-.913-.051-.213-.127-.53-.195-.634C7.067 9.004 7.039 9 6.99 9A1 1 0 0 1 7 7h.01c1.662.017 2.015 1.373 2.198 2.134.486-.981 1.304-2.058 2.797-2.075 1.531.018 2.28 1.153 2.731 2.141l.002-.008C14.944 8.424 15.327 7 16.979 7h.032A1 1 0 1 1 17 9h-.011c-.149.076-.256.474-.319.709a6.484 6.484 0 0 1-.311.951c-.429.973-.79 1.789-1.614 1.789"
                })
            ]
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 384 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M112.1 454.3c0 6.297 1.816 12.44 5.284 17.69l17.14 25.69c5.25 7.875 17.17 14.28 26.64 14.28h61.67c9.438 0 21.36-6.401 26.61-14.28l17.08-25.68c2.938-4.438 5.348-12.37 5.348-17.7L272 415.1h-160L112.1 454.3zM191.4 .0132C89.44 .3257 16 82.97 16 175.1c0 44.38 16.44 84.84 43.56 115.8c16.53 18.84 42.34 58.23 52.22 91.45c.0313 .25 .0938 .5166 .125 .7823h160.2c.0313-.2656 .0938-.5166 .125-.7823c9.875-33.22 35.69-72.61 52.22-91.45C351.6 260.8 368 220.4 368 175.1C368 78.61 288.9-.2837 191.4 .0132zM192 96.01c-44.13 0-80 35.89-80 79.1C112 184.8 104.8 192 96 192S80 184.8 80 176c0-61.76 50.25-111.1 112-111.1c8.844 0 16 7.159 16 16S200.8 96.01 192 96.01z"
            })
        })
    },
    people: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0m0 22C6.486 22 2 17.514 2 12S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10"
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M8 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 8 7M16 7a2 2 0 1 0-.001 3.999A2 2 0 0 0 16 7M15.232 15c-.693 1.195-1.87 2-3.349 2-1.477 0-2.655-.805-3.347-2H15m3-2H6a6 6 0 1 0 12 0"
                })
            ]
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M0 256C0 114.6 114.6 0 256 0C397.4 0 512 114.6 512 256C512 397.4 397.4 512 256 512C114.6 512 0 397.4 0 256zM256 432C332.1 432 396.2 382 415.2 314.1C419.1 300.4 407.8 288 393.6 288H118.4C104.2 288 92.92 300.4 96.76 314.1C115.8 382 179.9 432 256 432V432zM176.4 160C158.7 160 144.4 174.3 144.4 192C144.4 209.7 158.7 224 176.4 224C194 224 208.4 209.7 208.4 192C208.4 174.3 194 160 176.4 160zM336.4 224C354 224 368.4 209.7 368.4 192C368.4 174.3 354 160 336.4 160C318.7 160 304.4 174.3 304.4 192C304.4 209.7 318.7 224 336.4 224z"
            })
        })
    },
    places: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M6.5 12C5.122 12 4 13.121 4 14.5S5.122 17 6.5 17 9 15.879 9 14.5 7.878 12 6.5 12m0 3c-.275 0-.5-.225-.5-.5s.225-.5.5-.5.5.225.5.5-.225.5-.5.5M17.5 12c-1.378 0-2.5 1.121-2.5 2.5s1.122 2.5 2.5 2.5 2.5-1.121 2.5-2.5-1.122-2.5-2.5-2.5m0 3c-.275 0-.5-.225-.5-.5s.225-.5.5-.5.5.225.5.5-.225.5-.5.5"
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                    d: "M22.482 9.494l-1.039-.346L21.4 9h.6c.552 0 1-.439 1-.992 0-.006-.003-.008-.003-.008H23c0-1-.889-2-1.984-2h-.642l-.731-1.717C19.262 3.012 18.091 2 16.764 2H7.236C5.909 2 4.738 3.012 4.357 4.283L3.626 6h-.642C1.889 6 1 7 1 8h.003S1 8.002 1 8.008C1 8.561 1.448 9 2 9h.6l-.043.148-1.039.346a2.001 2.001 0 0 0-1.359 2.097l.751 7.508a1 1 0 0 0 .994.901H3v1c0 1.103.896 2 2 2h2c1.104 0 2-.897 2-2v-1h6v1c0 1.103.896 2 2 2h2c1.104 0 2-.897 2-2v-1h1.096a.999.999 0 0 0 .994-.901l.751-7.508a2.001 2.001 0 0 0-1.359-2.097M6.273 4.857C6.402 4.43 6.788 4 7.236 4h9.527c.448 0 .834.43.963.857L19.313 9H4.688l1.585-4.143zM7 21H5v-1h2v1zm12 0h-2v-1h2v1zm2.189-3H2.811l-.662-6.607L3 11h18l.852.393L21.189 18z"
                })
            ]
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M39.61 196.8L74.8 96.29C88.27 57.78 124.6 32 165.4 32H346.6C387.4 32 423.7 57.78 437.2 96.29L472.4 196.8C495.6 206.4 512 229.3 512 256V448C512 465.7 497.7 480 480 480H448C430.3 480 416 465.7 416 448V400H96V448C96 465.7 81.67 480 64 480H32C14.33 480 0 465.7 0 448V256C0 229.3 16.36 206.4 39.61 196.8V196.8zM109.1 192H402.9L376.8 117.4C372.3 104.6 360.2 96 346.6 96H165.4C151.8 96 139.7 104.6 135.2 117.4L109.1 192zM96 256C78.33 256 64 270.3 64 288C64 305.7 78.33 320 96 320C113.7 320 128 305.7 128 288C128 270.3 113.7 256 96 256zM416 320C433.7 320 448 305.7 448 288C448 270.3 433.7 256 416 256C398.3 256 384 270.3 384 288C384 305.7 398.3 320 416 320z"
            })
        })
    },
    symbols: {
        outline: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 24 24",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M0 0h11v2H0zM4 11h3V6h4V4H0v2h4zM15.5 17c1.381 0 2.5-1.116 2.5-2.493s-1.119-2.493-2.5-2.493S13 13.13 13 14.507 14.119 17 15.5 17m0-2.986c.276 0 .5.222.5.493 0 .272-.224.493-.5.493s-.5-.221-.5-.493.224-.493.5-.493M21.5 19.014c-1.381 0-2.5 1.116-2.5 2.493S20.119 24 21.5 24s2.5-1.116 2.5-2.493-1.119-2.493-2.5-2.493m0 2.986a.497.497 0 0 1-.5-.493c0-.271.224-.493.5-.493s.5.222.5.493a.497.497 0 0 1-.5.493M22 13l-9 9 1.513 1.5 8.99-9.009zM17 11c2.209 0 4-1.119 4-2.5V2s.985-.161 1.498.949C23.01 4.055 23 6 23 6s1-1.119 1-3.135C24-.02 21 0 21 0h-2v6.347A5.853 5.853 0 0 0 17 6c-2.209 0-4 1.119-4 2.5s1.791 2.5 4 2.5M10.297 20.482l-1.475-1.585a47.54 47.54 0 0 1-1.442 1.129c-.307-.288-.989-1.016-2.045-2.183.902-.836 1.479-1.466 1.729-1.892s.376-.871.376-1.336c0-.592-.273-1.178-.818-1.759-.546-.581-1.329-.871-2.349-.871-1.008 0-1.79.293-2.344.879-.556.587-.832 1.181-.832 1.784 0 .813.419 1.748 1.256 2.805-.847.614-1.444 1.208-1.794 1.784a3.465 3.465 0 0 0-.523 1.833c0 .857.308 1.56.924 2.107.616.549 1.423.823 2.42.823 1.173 0 2.444-.379 3.813-1.137L8.235 24h2.819l-2.09-2.383 1.333-1.135zm-6.736-6.389a1.02 1.02 0 0 1 .73-.286c.31 0 .559.085.747.254a.849.849 0 0 1 .283.659c0 .518-.419 1.112-1.257 1.784-.536-.651-.805-1.231-.805-1.742a.901.901 0 0 1 .302-.669M3.74 22c-.427 0-.778-.116-1.057-.349-.279-.232-.418-.487-.418-.766 0-.594.509-1.288 1.527-2.083.968 1.134 1.717 1.946 2.248 2.438-.921.507-1.686.76-2.3.76"
            })
        }),
        solid: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
            xmlns: "http://www.w3.org/2000/svg",
            viewBox: "0 0 512 512",
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
                d: "M500.3 7.251C507.7 13.33 512 22.41 512 31.1V175.1C512 202.5 483.3 223.1 447.1 223.1C412.7 223.1 383.1 202.5 383.1 175.1C383.1 149.5 412.7 127.1 447.1 127.1V71.03L351.1 90.23V207.1C351.1 234.5 323.3 255.1 287.1 255.1C252.7 255.1 223.1 234.5 223.1 207.1C223.1 181.5 252.7 159.1 287.1 159.1V63.1C287.1 48.74 298.8 35.61 313.7 32.62L473.7 .6198C483.1-1.261 492.9 1.173 500.3 7.251H500.3zM74.66 303.1L86.5 286.2C92.43 277.3 102.4 271.1 113.1 271.1H174.9C185.6 271.1 195.6 277.3 201.5 286.2L213.3 303.1H239.1C266.5 303.1 287.1 325.5 287.1 351.1V463.1C287.1 490.5 266.5 511.1 239.1 511.1H47.1C21.49 511.1-.0019 490.5-.0019 463.1V351.1C-.0019 325.5 21.49 303.1 47.1 303.1H74.66zM143.1 359.1C117.5 359.1 95.1 381.5 95.1 407.1C95.1 434.5 117.5 455.1 143.1 455.1C170.5 455.1 191.1 434.5 191.1 407.1C191.1 381.5 170.5 359.1 143.1 359.1zM440.3 367.1H496C502.7 367.1 508.6 372.1 510.1 378.4C513.3 384.6 511.6 391.7 506.5 396L378.5 508C372.9 512.1 364.6 513.3 358.6 508.9C352.6 504.6 350.3 496.6 353.3 489.7L391.7 399.1H336C329.3 399.1 323.4 395.9 321 389.6C318.7 383.4 320.4 376.3 325.5 371.1L453.5 259.1C459.1 255 467.4 254.7 473.4 259.1C479.4 263.4 481.6 271.4 478.7 278.3L440.3 367.1zM116.7 219.1L19.85 119.2C-8.112 90.26-6.614 42.31 24.85 15.34C51.82-8.137 93.26-3.642 118.2 21.83L128.2 32.32L137.7 21.83C162.7-3.642 203.6-8.137 231.6 15.34C262.6 42.31 264.1 90.26 236.1 119.2L139.7 219.1C133.2 225.6 122.7 225.6 116.7 219.1H116.7z"
            })
        })
    }
};
const $fcccfb36ed0cde68$var$search = {
    loupe: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
            d: "M12.9 14.32a8 8 0 1 1 1.41-1.41l5.35 5.33-1.42 1.42-5.33-5.34zM8 14A6 6 0 1 0 8 2a6 6 0 0 0 0 12z"
        })
    }),
    delete: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("svg", {
        xmlns: "http://www.w3.org/2000/svg",
        viewBox: "0 0 20 20",
        children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("path", {
            d: "M10 8.586L2.929 1.515 1.515 2.929 8.586 10l-7.071 7.071 1.414 1.414L10 11.414l7.071 7.071 1.414-1.414L11.414 10l7.071-7.071-1.414-1.414L10 8.586z"
        })
    })
};
var $fcccfb36ed0cde68$export$2e2bcd8739ae039 = {
    categories: $fcccfb36ed0cde68$var$categories,
    search: $fcccfb36ed0cde68$var$search
};





function $254755d3f438722f$export$2e2bcd8739ae039(props) {
    let { id: id , skin: skin , emoji: emoji  } = props;
    if (props.shortcodes) {
        const matches = props.shortcodes.match(($c4d155af13ad4d4b$export$2e2bcd8739ae039).SHORTCODES_REGEX);
        if (matches) {
            id = matches[1];
            if (matches[2]) skin = matches[2];
        }
    }
    emoji || (emoji = ($c4d155af13ad4d4b$export$2e2bcd8739ae039).get(id || props.native));
    if (!emoji) return props.fallback;
    const emojiSkin = emoji.skins[skin - 1] || emoji.skins[0];
    const imageSrc = emojiSkin.src || (props.set != "native" && !props.spritesheet ? typeof props.getImageURL === "function" ? props.getImageURL(props.set, emojiSkin.unified) : `https://cdn.jsdelivr.net/npm/emoji-datasource-${props.set}@15.0.1/img/${props.set}/64/${emojiSkin.unified}.png` : undefined);
    const spritesheetSrc = typeof props.getSpritesheetURL === "function" ? props.getSpritesheetURL(props.set) : `https://cdn.jsdelivr.net/npm/emoji-datasource-${props.set}@15.0.1/img/${props.set}/sheets-256/64.png`;
    return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
        class: "emoji-mart-emoji",
        "data-emoji-set": props.set,
        children: imageSrc ? /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("img", {
            style: {
                maxWidth: props.size || "1em",
                maxHeight: props.size || "1em",
                display: "inline-block"
            },
            alt: emojiSkin.native || emojiSkin.shortcodes,
            src: imageSrc
        }) : props.set == "native" ? /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
            style: {
                fontSize: props.size,
                fontFamily: '"EmojiMart", "Segoe UI Emoji", "Segoe UI Symbol", "Segoe UI", "Apple Color Emoji", "Twemoji Mozilla", "Noto Color Emoji", "Android Emoji"'
            },
            children: emojiSkin.native
        }) : /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
            style: {
                display: "block",
                width: props.size,
                height: props.size,
                backgroundImage: `url(${spritesheetSrc})`,
                backgroundSize: `${100 * ($7adb23b0109cc36a$export$2d0294657ab35f1b).sheet.cols}% ${100 * ($7adb23b0109cc36a$export$2d0294657ab35f1b).sheet.rows}%`,
                backgroundPosition: `${100 / (($7adb23b0109cc36a$export$2d0294657ab35f1b).sheet.cols - 1) * emojiSkin.x}% ${100 / (($7adb23b0109cc36a$export$2d0294657ab35f1b).sheet.rows - 1) * emojiSkin.y}%`
            }
        })
    });
}







const $6f57cc9cd54c5aaa$var$WindowHTMLElement = typeof window !== "undefined" && window.HTMLElement ? window.HTMLElement : Object;
class $6f57cc9cd54c5aaa$export$2e2bcd8739ae039 extends $6f57cc9cd54c5aaa$var$WindowHTMLElement {
    static get observedAttributes() {
        return Object.keys(this.Props);
    }
    update(props = {}) {
        for(let k in props)this.attributeChangedCallback(k, null, props[k]);
    }
    attributeChangedCallback(attr, _, newValue) {
        if (!this.component) return;
        const value = ($7adb23b0109cc36a$export$88c9ddb45cea7241)(attr, {
            [attr]: newValue
        }, this.constructor.Props, this);
        if (this.component.componentWillReceiveProps) this.component.componentWillReceiveProps({
            [attr]: value
        });
        else {
            this.component.props[attr] = value;
            this.component.forceUpdate();
        }
    }
    disconnectedCallback() {
        this.disconnected = true;
        if (this.component && this.component.unregister) this.component.unregister();
    }
    constructor(props = {}){
        super();
        this.props = props;
        if (props.parent || props.ref) {
            let ref = null;
            const parent = props.parent || (ref = props.ref && props.ref.current);
            if (ref) ref.innerHTML = "";
            if (parent) parent.appendChild(this);
        }
    }
}



class $26f27c338a96b1a6$export$2e2bcd8739ae039 extends ($6f57cc9cd54c5aaa$export$2e2bcd8739ae039) {
    setShadow() {
        this.attachShadow({
            mode: "open"
        });
    }
    injectStyles(styles) {
        if (!styles) return;
        const style = document.createElement("style");
        style.textContent = styles;
        this.shadowRoot.insertBefore(style, this.shadowRoot.firstChild);
    }
    constructor(props, { styles: styles  } = {}){
        super(props);
        this.setShadow();
        this.injectStyles(styles);
    }
}






var $3d90f6e46fb2dd47$export$2e2bcd8739ae039 = {
    fallback: "",
    id: "",
    native: "",
    shortcodes: "",
    size: {
        value: "",
        transform: (value)=>{
            // If the value is a number, then we assume it’s a pixel value.
            if (!/\D/.test(value)) return `${value}px`;
            return value;
        }
    },
    // Shared
    set: ($b247ea80b67298d5$export$2e2bcd8739ae039).set,
    skin: ($b247ea80b67298d5$export$2e2bcd8739ae039).skin
};


class $331b4160623139bf$export$2e2bcd8739ae039 extends ($6f57cc9cd54c5aaa$export$2e2bcd8739ae039) {
    async connectedCallback() {
        const props = ($7adb23b0109cc36a$export$75fe5f91d452f94b)(this.props, ($3d90f6e46fb2dd47$export$2e2bcd8739ae039), this);
        props.element = this;
        props.ref = (component)=>{
            this.component = component;
        };
        await ($7adb23b0109cc36a$export$2cd8252107eb640b)();
        if (this.disconnected) return;
        ($fb96b826c0c5f37a$export$b3890eb0ae9dca99)(/*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)(($254755d3f438722f$export$2e2bcd8739ae039), {
            ...props
        }), this);
    }
    constructor(props){
        super(props);
    }
}
($c770c458706daa72$export$2e2bcd8739ae039)($331b4160623139bf$export$2e2bcd8739ae039, "Props", ($3d90f6e46fb2dd47$export$2e2bcd8739ae039));
if (typeof customElements !== "undefined" && !customElements.get("em-emoji")) customElements.define("em-emoji", $331b4160623139bf$export$2e2bcd8739ae039);






var $1a9a8ef576b7773d$var$r, $1a9a8ef576b7773d$var$i = [], $1a9a8ef576b7773d$var$c = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__b, $1a9a8ef576b7773d$var$f = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__r, $1a9a8ef576b7773d$var$e = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).diffed, $1a9a8ef576b7773d$var$a = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__c, $1a9a8ef576b7773d$var$v = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).unmount;
function $1a9a8ef576b7773d$var$x() {
    var t6;
    for($1a9a8ef576b7773d$var$i.sort(function(n11, t7) {
        return n11.__v.__b - t7.__v.__b;
    }); t6 = $1a9a8ef576b7773d$var$i.pop();)if (t6.__P) try {
        t6.__H.__h.forEach($1a9a8ef576b7773d$var$g), t6.__H.__h.forEach($1a9a8ef576b7773d$var$j), t6.__H.__h = [];
    } catch (u4) {
        t6.__H.__h = [], ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__e(u4, t6.__v);
    }
}
($fb96b826c0c5f37a$export$41c562ebe57d11e2).__b = function(n12) {
    $1a9a8ef576b7773d$var$c && $1a9a8ef576b7773d$var$c(n12);
}, ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__r = function(n13) {
    $1a9a8ef576b7773d$var$f && $1a9a8ef576b7773d$var$f(n13);
    var r8 = (n13.__c).__H;
    r8 && (r8.__h.forEach($1a9a8ef576b7773d$var$g), r8.__h.forEach($1a9a8ef576b7773d$var$j), r8.__h = []);
}, ($fb96b826c0c5f37a$export$41c562ebe57d11e2).diffed = function(t8) {
    $1a9a8ef576b7773d$var$e && $1a9a8ef576b7773d$var$e(t8);
    var o6 = t8.__c;
    o6 && o6.__H && o6.__H.__h.length && (1 !== $1a9a8ef576b7773d$var$i.push(o6) && $1a9a8ef576b7773d$var$r === ($fb96b826c0c5f37a$export$41c562ebe57d11e2).requestAnimationFrame || (($1a9a8ef576b7773d$var$r = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).requestAnimationFrame) || function(n14) {
        var t9, u5 = function() {
            clearTimeout(r9), $1a9a8ef576b7773d$var$b && cancelAnimationFrame(t9), setTimeout(n14);
        }, r9 = setTimeout(u5, 100);
        $1a9a8ef576b7773d$var$b && (t9 = requestAnimationFrame(u5));
    })($1a9a8ef576b7773d$var$x));
}, ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__c = function(t10, u6) {
    u6.some(function(t11) {
        try {
            t11.__h.forEach($1a9a8ef576b7773d$var$g), t11.__h = t11.__h.filter(function(n15) {
                return !n15.__ || $1a9a8ef576b7773d$var$j(n15);
            });
        } catch (r10) {
            u6.some(function(n16) {
                n16.__h && (n16.__h = []);
            }), u6 = [], ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__e(r10, t11.__v);
        }
    }), $1a9a8ef576b7773d$var$a && $1a9a8ef576b7773d$var$a(t10, u6);
}, ($fb96b826c0c5f37a$export$41c562ebe57d11e2).unmount = function(t12) {
    $1a9a8ef576b7773d$var$v && $1a9a8ef576b7773d$var$v(t12);
    var u7, r11 = t12.__c;
    r11 && r11.__H && (r11.__H.__.forEach(function(n17) {
        try {
            $1a9a8ef576b7773d$var$g(n17);
        } catch (n18) {
            u7 = n18;
        }
    }), u7 && ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__e(u7, r11.__v));
};
var $1a9a8ef576b7773d$var$b = "function" == typeof requestAnimationFrame;
function $1a9a8ef576b7773d$var$g(n19) {
    var r12 = n19.__c;
    "function" == typeof r12 && (n19.__c = void 0, r12());
}
function $1a9a8ef576b7773d$var$j(n20) {
    n20.__c = n20.__();
}





function $dc040a17866866fa$var$S(n1, t1) {
    for(var e1 in t1)n1[e1] = t1[e1];
    return n1;
}
function $dc040a17866866fa$var$C(n2, t2) {
    for(var e2 in n2)if ("__source" !== e2 && !(e2 in t2)) return !0;
    for(var r1 in t2)if ("__source" !== r1 && n2[r1] !== t2[r1]) return !0;
    return !1;
}
function $dc040a17866866fa$export$221d75b3f55bb0bd(n3) {
    this.props = n3;
}
($dc040a17866866fa$export$221d75b3f55bb0bd.prototype = new ($fb96b826c0c5f37a$export$16fa2f45be04daa8)).isPureReactComponent = !0, $dc040a17866866fa$export$221d75b3f55bb0bd.prototype.shouldComponentUpdate = function(n6, t5) {
    return $dc040a17866866fa$var$C(this.props, n6) || $dc040a17866866fa$var$C(this.state, t5);
};
var $dc040a17866866fa$var$w = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__b;
($fb96b826c0c5f37a$export$41c562ebe57d11e2).__b = function(n7) {
    n7.type && n7.type.__f && n7.ref && (n7.props.ref = n7.ref, n7.ref = null), $dc040a17866866fa$var$w && $dc040a17866866fa$var$w(n7);
};
var $dc040a17866866fa$var$A = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__e;
($fb96b826c0c5f37a$export$41c562ebe57d11e2).__e = function(n12, t10, e6) {
    if (n12.then) {
        for(var r5, u1 = t10; u1 = u1.__;)if ((r5 = u1.__c) && r5.__c) return null == t10.__e && (t10.__e = e6.__e, t10.__k = e6.__k), r5.__c(n12, t10);
    }
    $dc040a17866866fa$var$A(n12, t10, e6);
};
var $dc040a17866866fa$var$O = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).unmount;
function $dc040a17866866fa$export$74bf444e3cd11ea5() {
    this.__u = 0, this.t = null, this.__b = null;
}
function $dc040a17866866fa$var$U(n13) {
    var t11 = n13.__.__c;
    return t11 && t11.__e && t11.__e(n13);
}
function $dc040a17866866fa$export$998bcd577473dd93() {
    this.u = null, this.o = null;
}
($fb96b826c0c5f37a$export$41c562ebe57d11e2).unmount = function(n17) {
    var t13 = n17.__c;
    t13 && t13.__R && t13.__R(), t13 && !0 === n17.__h && (n17.type = null), $dc040a17866866fa$var$O && $dc040a17866866fa$var$O(n17);
}, ($dc040a17866866fa$export$74bf444e3cd11ea5.prototype = new ($fb96b826c0c5f37a$export$16fa2f45be04daa8)).__c = function(n18, t14) {
    var e8 = t14.__c, r7 = this;
    null == r7.t && (r7.t = []), r7.t.push(e8);
    var u4 = $dc040a17866866fa$var$U(r7.__v), o1 = !1, i1 = function() {
        o1 || (o1 = !0, e8.__R = null, u4 ? u4(l1) : l1());
    };
    e8.__R = i1;
    var l1 = function() {
        if (!--r7.__u) {
            if (r7.state.__e) {
                var n19 = r7.state.__e;
                r7.__v.__k[0] = function n22(t17, e9, r8) {
                    return t17 && (t17.__v = null, t17.__k = t17.__k && t17.__k.map(function(t18) {
                        return n22(t18, e9, r8);
                    }), t17.__c && t17.__c.__P === e9 && (t17.__e && r8.insertBefore(t17.__e, t17.__d), t17.__c.__e = !0, t17.__c.__P = r8)), t17;
                }(n19, n19.__c.__P, n19.__c.__O);
            }
            var t15;
            for(r7.setState({
                __e: r7.__b = null
            }); t15 = r7.t.pop();)t15.forceUpdate();
        }
    }, c1 = !0 === t14.__h;
    (r7.__u++) || c1 || r7.setState({
        __e: r7.__b = r7.__v.__k[0]
    }), n18.then(i1, i1);
}, $dc040a17866866fa$export$74bf444e3cd11ea5.prototype.componentWillUnmount = function() {
    this.t = [];
}, $dc040a17866866fa$export$74bf444e3cd11ea5.prototype.render = function(n23, t19) {
    if (this.__b) {
        if (this.__v.__k) {
            var e10 = document.createElement("div"), r9 = this.__v.__k[0].__c;
            this.__v.__k[0] = function n24(t20, e13, r12) {
                return t20 && (t20.__c && t20.__c.__H && (t20.__c.__H.__.forEach(function(n25) {
                    "function" == typeof n25.__c && n25.__c();
                }), t20.__c.__H = null), null != (t20 = $dc040a17866866fa$var$S({}, t20)).__c && (t20.__c.__P === r12 && (t20.__c.__P = e13), t20.__c = null), t20.__k = t20.__k && t20.__k.map(function(t21) {
                    return n24(t21, e13, r12);
                })), t20;
            }(this.__b, e10, r9.__O = r9.__P);
        }
        this.__b = null;
    }
    var u5 = t19.__e && ($fb96b826c0c5f37a$export$c8a8987d4410bf2d)(($fb96b826c0c5f37a$export$ffb0004e005737fa), null, n23.fallback);
    return u5 && (u5.__h = null), [
        ($fb96b826c0c5f37a$export$c8a8987d4410bf2d)(($fb96b826c0c5f37a$export$ffb0004e005737fa), null, t19.__e ? null : n23.children),
        u5
    ];
};
var $dc040a17866866fa$var$T = function(n26, t22, e14) {
    if (++e14[1] === e14[0] && n26.o.delete(t22), n26.props.revealOrder && ("t" !== n26.props.revealOrder[0] || !n26.o.size)) for(e14 = n26.u; e14;){
        for(; e14.length > 3;)e14.pop()();
        if (e14[1] < e14[0]) break;
        n26.u = e14 = e14[2];
    }
};
($dc040a17866866fa$export$998bcd577473dd93.prototype = new ($fb96b826c0c5f37a$export$16fa2f45be04daa8)).__e = function(n33) {
    var t25 = this, e16 = $dc040a17866866fa$var$U(t25.__v), r13 = t25.o.get(n33);
    return r13[0]++, function(u6) {
        var o2 = function() {
            t25.props.revealOrder ? (r13.push(u6), $dc040a17866866fa$var$T(t25, n33, r13)) : u6();
        };
        e16 ? e16(o2) : o2();
    };
}, $dc040a17866866fa$export$998bcd577473dd93.prototype.render = function(n34) {
    this.u = null, this.o = new Map;
    var t26 = ($fb96b826c0c5f37a$export$47e4c5b300681277)(n34.children);
    n34.revealOrder && "b" === n34.revealOrder[0] && t26.reverse();
    for(var e17 = t26.length; e17--;)this.o.set(t26[e17], this.u = [
        1,
        0,
        this.u
    ]);
    return n34.children;
}, $dc040a17866866fa$export$998bcd577473dd93.prototype.componentDidUpdate = $dc040a17866866fa$export$998bcd577473dd93.prototype.componentDidMount = function() {
    var n35 = this;
    this.o.forEach(function(t27, e18) {
        $dc040a17866866fa$var$T(n35, e18, t27);
    });
};
var $dc040a17866866fa$var$j = "undefined" != typeof Symbol && Symbol.for && Symbol.for("react.element") || 60103, $dc040a17866866fa$var$P = /^(?:accent|alignment|arabic|baseline|cap|clip(?!PathU)|color|dominant|fill|flood|font|glyph(?!R)|horiz|marker(?!H|W|U)|overline|paint|stop|strikethrough|stroke|text(?!L)|underline|unicode|units|v|vector|vert|word|writing|x(?!C))[A-Z]/, $dc040a17866866fa$var$V = "undefined" != typeof document, $dc040a17866866fa$var$z = function(n36) {
    return ("undefined" != typeof Symbol && "symbol" == typeof Symbol() ? /fil|che|rad/i : /fil|che|ra/i).test(n36);
};
($fb96b826c0c5f37a$export$16fa2f45be04daa8).prototype.isReactComponent = {}, [
    "componentWillMount",
    "componentWillReceiveProps",
    "componentWillUpdate"
].forEach(function(n39) {
    Object.defineProperty(($fb96b826c0c5f37a$export$16fa2f45be04daa8).prototype, n39, {
        configurable: !0,
        get: function() {
            return this["UNSAFE_" + n39];
        },
        set: function(t30) {
            Object.defineProperty(this, n39, {
                configurable: !0,
                writable: !0,
                value: t30
            });
        }
    });
});
var $dc040a17866866fa$var$H = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).event;
function $dc040a17866866fa$var$Z() {}
function $dc040a17866866fa$var$Y() {
    return this.cancelBubble;
}
function $dc040a17866866fa$var$q() {
    return this.defaultPrevented;
}
($fb96b826c0c5f37a$export$41c562ebe57d11e2).event = function(n40) {
    return $dc040a17866866fa$var$H && (n40 = $dc040a17866866fa$var$H(n40)), n40.persist = $dc040a17866866fa$var$Z, n40.isPropagationStopped = $dc040a17866866fa$var$Y, n40.isDefaultPrevented = $dc040a17866866fa$var$q, n40.nativeEvent = n40;
};
var $dc040a17866866fa$var$J = {
    configurable: !0,
    get: function() {
        return this.class;
    }
}, $dc040a17866866fa$var$K = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).vnode;
($fb96b826c0c5f37a$export$41c562ebe57d11e2).vnode = function(n41) {
    var t31 = n41.type, e21 = n41.props, r14 = e21;
    if ("string" == typeof t31) {
        var u7 = -1 === t31.indexOf("-");
        for(var o3 in r14 = {}, e21){
            var i2 = e21[o3];
            $dc040a17866866fa$var$V && "children" === o3 && "noscript" === t31 || "value" === o3 && "defaultValue" in e21 && null == i2 || ("defaultValue" === o3 && "value" in e21 && null == e21.value ? o3 = "value" : "download" === o3 && !0 === i2 ? i2 = "" : /ondoubleclick/i.test(o3) ? o3 = "ondblclick" : /^onchange(textarea|input)/i.test(o3 + t31) && !$dc040a17866866fa$var$z(e21.type) ? o3 = "oninput" : /^onfocus$/i.test(o3) ? o3 = "onfocusin" : /^onblur$/i.test(o3) ? o3 = "onfocusout" : /^on(Ani|Tra|Tou|BeforeInp)/.test(o3) ? o3 = o3.toLowerCase() : u7 && $dc040a17866866fa$var$P.test(o3) ? o3 = o3.replace(/[A-Z0-9]/, "-$&").toLowerCase() : null === i2 && (i2 = void 0), r14[o3] = i2);
        }
        "select" == t31 && r14.multiple && Array.isArray(r14.value) && (r14.value = ($fb96b826c0c5f37a$export$47e4c5b300681277)(e21.children).forEach(function(n42) {
            n42.props.selected = -1 != r14.value.indexOf(n42.props.value);
        })), "select" == t31 && null != r14.defaultValue && (r14.value = ($fb96b826c0c5f37a$export$47e4c5b300681277)(e21.children).forEach(function(n43) {
            n43.props.selected = r14.multiple ? -1 != r14.defaultValue.indexOf(n43.props.value) : r14.defaultValue == n43.props.value;
        })), n41.props = r14, e21.class != e21.className && ($dc040a17866866fa$var$J.enumerable = "className" in e21, null != e21.className && (r14.class = e21.className), Object.defineProperty(r14, "className", $dc040a17866866fa$var$J));
    }
    n41.$$typeof = $dc040a17866866fa$var$j, $dc040a17866866fa$var$K && $dc040a17866866fa$var$K(n41);
};
var $dc040a17866866fa$var$Q = ($fb96b826c0c5f37a$export$41c562ebe57d11e2).__r;
($fb96b826c0c5f37a$export$41c562ebe57d11e2).__r = function(n44) {
    $dc040a17866866fa$var$Q && $dc040a17866866fa$var$Q(n44), n44.__c;
};




const $ec8c39fdad15601a$var$THEME_ICONS = {
    light: "outline",
    dark: "solid"
};
class $ec8c39fdad15601a$export$2e2bcd8739ae039 extends ($dc040a17866866fa$export$221d75b3f55bb0bd) {
    renderIcon(category) {
        const { icon: icon  } = category;
        if (icon) {
            if (icon.svg) return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
                class: "flex",
                dangerouslySetInnerHTML: {
                    __html: icon.svg
                }
            });
            if (icon.src) return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("img", {
                src: icon.src
            });
        }
        const categoryIcons = ($fcccfb36ed0cde68$export$2e2bcd8739ae039).categories[category.id] || ($fcccfb36ed0cde68$export$2e2bcd8739ae039).categories.custom;
        const style = this.props.icons == "auto" ? $ec8c39fdad15601a$var$THEME_ICONS[this.props.theme] : this.props.icons;
        return categoryIcons[style] || categoryIcons;
    }
    render() {
        let selectedCategoryIndex = null;
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("nav", {
            id: "nav",
            class: "padding",
            "data-position": this.props.position,
            dir: this.props.dir,
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                class: "flex relative",
                children: [
                    this.categories.map((category, i)=>{
                        const title = category.name || ($7adb23b0109cc36a$export$dbe3113d60765c1a).categories[category.id];
                        const selected = !this.props.unfocused && category.id == this.state.categoryId;
                        if (selected) selectedCategoryIndex = i;
                        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("button", {
                            "aria-label": title,
                            "aria-selected": selected || undefined,
                            title: title,
                            type: "button",
                            class: "flex flex-grow flex-center",
                            onMouseDown: (e)=>e.preventDefault(),
                            onClick: ()=>{
                                this.props.onClick({
                                    category: category,
                                    i: i
                                });
                            },
                            children: this.renderIcon(category)
                        });
                    }),
                    /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                        class: "bar",
                        style: {
                            width: `${100 / this.categories.length}%`,
                            opacity: selectedCategoryIndex == null ? 0 : 1,
                            transform: this.props.dir === "rtl" ? `scaleX(-1) translateX(${selectedCategoryIndex * 100}%)` : `translateX(${selectedCategoryIndex * 100}%)`
                        }
                    })
                ]
            })
        });
    }
    constructor(){
        super();
        this.categories = ($7adb23b0109cc36a$export$2d0294657ab35f1b).categories.filter((category)=>{
            return !category.target;
        });
        this.state = {
            categoryId: this.categories[0].id
        };
    }
}





class $e0d4dda61265ff1e$export$2e2bcd8739ae039 extends ($dc040a17866866fa$export$221d75b3f55bb0bd) {
    shouldComponentUpdate(nextProps) {
        for(let k in nextProps){
            if (k == "children") continue;
            if (nextProps[k] != this.props[k]) return true;
        }
        return false;
    }
    render() {
        return this.props.children;
    }
}




const $89bd6bb200cc8fef$var$Performance = {
    rowsPerRender: 10
};
class $89bd6bb200cc8fef$export$2e2bcd8739ae039 extends ($fb96b826c0c5f37a$export$16fa2f45be04daa8) {
    getInitialState(props = this.props) {
        return {
            skin: ($f72b75cf796873c7$export$2e2bcd8739ae039).get("skin") || props.skin,
            theme: this.initTheme(props.theme)
        };
    }
    componentWillMount() {
        this.dir = ($7adb23b0109cc36a$export$dbe3113d60765c1a).rtl ? "rtl" : "ltr";
        this.refs = {
            menu: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
            navigation: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
            scroll: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
            search: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
            searchInput: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
            skinToneButton: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
            skinToneRadio: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)()
        };
        this.initGrid();
        if (this.props.stickySearch == false && this.props.searchPosition == "sticky") {
            console.warn("[EmojiMart] Deprecation warning: `stickySearch` has been renamed `searchPosition`.");
            this.props.searchPosition = "static";
        }
    }
    componentDidMount() {
        this.register();
        this.shadowRoot = this.base.parentNode;
        if (this.props.autoFocus) {
            const { searchInput: searchInput  } = this.refs;
            if (searchInput.current) searchInput.current.focus();
        }
    }
    componentWillReceiveProps(nextProps) {
        this.nextState || (this.nextState = {});
        for(const k1 in nextProps)this.nextState[k1] = nextProps[k1];
        clearTimeout(this.nextStateTimer);
        this.nextStateTimer = setTimeout(()=>{
            let requiresGridReset = false;
            for(const k in this.nextState){
                this.props[k] = this.nextState[k];
                if (k === "custom" || k === "categories") requiresGridReset = true;
            }
            delete this.nextState;
            const nextState = this.getInitialState();
            if (requiresGridReset) return this.reset(nextState);
            this.setState(nextState);
        });
    }
    componentWillUnmount() {
        this.unregister();
    }
    async reset(nextState = {}) {
        await ($7adb23b0109cc36a$export$2cd8252107eb640b)(this.props);
        this.initGrid();
        this.unobserve();
        this.setState(nextState, ()=>{
            this.observeCategories();
            this.observeRows();
        });
    }
    register() {
        document.addEventListener("click", this.handleClickOutside);
        this.observe();
    }
    unregister() {
        document.removeEventListener("click", this.handleClickOutside);
        this.darkMedia?.removeEventListener("change", this.darkMediaCallback);
        this.unobserve();
    }
    observe() {
        this.observeCategories();
        this.observeRows();
    }
    unobserve({ except: except = []  } = {}) {
        if (!Array.isArray(except)) except = [
            except
        ];
        for (const observer of this.observers){
            if (except.includes(observer)) continue;
            observer.disconnect();
        }
        this.observers = [].concat(except);
    }
    initGrid() {
        const { categories: categories  } = ($7adb23b0109cc36a$export$2d0294657ab35f1b);
        this.refs.categories = new Map();
        const navKey = ($7adb23b0109cc36a$export$2d0294657ab35f1b).categories.map((category)=>category.id).join(",");
        if (this.navKey && this.navKey != navKey) this.refs.scroll.current && (this.refs.scroll.current.scrollTop = 0);
        this.navKey = navKey;
        this.grid = [];
        this.grid.setsize = 0;
        const addRow = (rows, category)=>{
            const row = [];
            row.__categoryId = category.id;
            row.__index = rows.length;
            this.grid.push(row);
            const rowIndex = this.grid.length - 1;
            const rowRef = rowIndex % $89bd6bb200cc8fef$var$Performance.rowsPerRender ? {} : ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)();
            rowRef.index = rowIndex;
            rowRef.posinset = this.grid.setsize + 1;
            rows.push(rowRef);
            return row;
        };
        for (let category1 of categories){
            const rows = [];
            let row = addRow(rows, category1);
            for (let emoji of category1.emojis){
                if (row.length == this.getPerLine()) row = addRow(rows, category1);
                this.grid.setsize += 1;
                row.push(emoji);
            }
            this.refs.categories.set(category1.id, {
                root: ($fb96b826c0c5f37a$export$7d1e3a5e95ceca43)(),
                rows: rows
            });
        }
    }
    initTheme(theme) {
        if (theme != "auto") return theme;
        if (!this.darkMedia) {
            this.darkMedia = matchMedia("(prefers-color-scheme: dark)");
            if (this.darkMedia.media.match(/^not/)) return "light";
            this.darkMedia.addEventListener("change", this.darkMediaCallback);
        }
        return this.darkMedia.matches ? "dark" : "light";
    }
    initDynamicPerLine(props = this.props) {
        if (!props.dynamicWidth) return;
        const { element: element , emojiButtonSize: emojiButtonSize  } = props;
        const calculatePerLine = ()=>{
            const { width: width  } = element.getBoundingClientRect();
            return Math.floor(width / emojiButtonSize);
        };
        const observer = new ResizeObserver(()=>{
            this.unobserve({
                except: observer
            });
            this.setState({
                perLine: calculatePerLine()
            }, ()=>{
                this.initGrid();
                this.forceUpdate(()=>{
                    this.observeCategories();
                    this.observeRows();
                });
            });
        });
        observer.observe(element);
        this.observers.push(observer);
        return calculatePerLine();
    }
    getPerLine() {
        return this.state.perLine || this.props.perLine;
    }
    getEmojiByPos([p1, p2]) {
        const grid = this.state.searchResults || this.grid;
        const emoji = grid[p1] && grid[p1][p2];
        if (!emoji) return;
        return ($c4d155af13ad4d4b$export$2e2bcd8739ae039).get(emoji);
    }
    observeCategories() {
        const navigation = this.refs.navigation.current;
        if (!navigation) return;
        const visibleCategories = new Map();
        const setFocusedCategory = (categoryId)=>{
            if (categoryId != navigation.state.categoryId) navigation.setState({
                categoryId: categoryId
            });
        };
        const observerOptions = {
            root: this.refs.scroll.current,
            threshold: [
                0.0,
                1.0
            ]
        };
        const observer = new IntersectionObserver((entries)=>{
            for (const entry of entries){
                const id = entry.target.dataset.id;
                visibleCategories.set(id, entry.intersectionRatio);
            }
            const ratios = [
                ...visibleCategories
            ];
            for (const [id, ratio] of ratios)if (ratio) {
                setFocusedCategory(id);
                break;
            }
        }, observerOptions);
        for (const { root: root  } of this.refs.categories.values())observer.observe(root.current);
        this.observers.push(observer);
    }
    observeRows() {
        const visibleRows = {
            ...this.state.visibleRows
        };
        const observer = new IntersectionObserver((entries)=>{
            for (const entry of entries){
                const index = parseInt(entry.target.dataset.index);
                if (entry.isIntersecting) visibleRows[index] = true;
                else delete visibleRows[index];
            }
            this.setState({
                visibleRows: visibleRows
            });
        }, {
            root: this.refs.scroll.current,
            rootMargin: `${this.props.emojiButtonSize * ($89bd6bb200cc8fef$var$Performance.rowsPerRender + 5)}px 0px ${this.props.emojiButtonSize * $89bd6bb200cc8fef$var$Performance.rowsPerRender}px`
        });
        for (const { rows: rows  } of this.refs.categories.values()){
            for (const row of rows)if (row.current) observer.observe(row.current);
        }
        this.observers.push(observer);
    }
    preventDefault(e) {
        e.preventDefault();
    }
    unfocusSearch() {
        const input = this.refs.searchInput.current;
        if (!input) return;
        input.blur();
    }
    navigate({ e: e , input: input , left: left , right: right , up: up , down: down  }) {
        const grid = this.state.searchResults || this.grid;
        if (!grid.length) return;
        let [p1, p2] = this.state.pos;
        const pos = (()=>{
            if (p1 == 0) {
                if (p2 == 0 && !e.repeat && (left || up)) return null;
            }
            if (p1 == -1) {
                if (!e.repeat && (right || down) && input.selectionStart == input.value.length) return [
                    0,
                    0
                ];
                return null;
            }
            if (left || right) {
                let row = grid[p1];
                const increment = left ? -1 : 1;
                p2 += increment;
                if (!row[p2]) {
                    p1 += increment;
                    row = grid[p1];
                    if (!row) {
                        p1 = left ? 0 : grid.length - 1;
                        p2 = left ? 0 : grid[p1].length - 1;
                        return [
                            p1,
                            p2
                        ];
                    }
                    p2 = left ? row.length - 1 : 0;
                }
                return [
                    p1,
                    p2
                ];
            }
            if (up || down) {
                p1 += up ? -1 : 1;
                const row = grid[p1];
                if (!row) {
                    p1 = up ? 0 : grid.length - 1;
                    p2 = up ? 0 : grid[p1].length - 1;
                    return [
                        p1,
                        p2
                    ];
                }
                if (!row[p2]) p2 = row.length - 1;
                return [
                    p1,
                    p2
                ];
            }
        })();
        if (pos) e.preventDefault();
        else {
            if (this.state.pos[0] > -1) this.setState({
                pos: [
                    -1,
                    -1
                ]
            });
            return;
        }
        this.setState({
            pos: pos,
            keyboard: true
        }, ()=>{
            this.scrollTo({
                row: pos[0]
            });
        });
    }
    scrollTo({ categoryId: categoryId , row: row  }) {
        const grid = this.state.searchResults || this.grid;
        if (!grid.length) return;
        const scroll = this.refs.scroll.current;
        const scrollRect = scroll.getBoundingClientRect();
        let scrollTop = 0;
        if (row >= 0) categoryId = grid[row].__categoryId;
        if (categoryId) {
            const ref = this.refs[categoryId] || this.refs.categories.get(categoryId).root;
            const categoryRect = ref.current.getBoundingClientRect();
            scrollTop = categoryRect.top - (scrollRect.top - scroll.scrollTop) + 1;
        }
        if (row >= 0) {
            if (!row) scrollTop = 0;
            else {
                const rowIndex = grid[row].__index;
                const rowTop = scrollTop + rowIndex * this.props.emojiButtonSize;
                const rowBot = rowTop + this.props.emojiButtonSize + this.props.emojiButtonSize * 0.88;
                if (rowTop < scroll.scrollTop) scrollTop = rowTop;
                else if (rowBot > scroll.scrollTop + scrollRect.height) scrollTop = rowBot - scrollRect.height;
                else return;
            }
        }
        this.ignoreMouse();
        scroll.scrollTop = scrollTop;
    }
    ignoreMouse() {
        this.mouseIsIgnored = true;
        clearTimeout(this.ignoreMouseTimer);
        this.ignoreMouseTimer = setTimeout(()=>{
            delete this.mouseIsIgnored;
        }, 100);
    }
    handleEmojiOver(pos) {
        if (this.mouseIsIgnored || this.state.showSkins) return;
        this.setState({
            pos: pos || [
                -1,
                -1
            ],
            keyboard: false
        });
    }
    handleEmojiClick({ e: e , emoji: emoji , pos: pos  }) {
        if (!this.props.onEmojiSelect) return;
        if (!emoji && pos) emoji = this.getEmojiByPos(pos);
        if (emoji) {
            const emojiData = ($693b183b0a78708f$export$d10ac59fbe52a745)(emoji, {
                skinIndex: this.state.skin - 1
            });
            if (this.props.maxFrequentRows) ($b22cfd0a55410b4f$export$2e2bcd8739ae039).add(emojiData, this.props);
            this.props.onEmojiSelect(emojiData, e);
        }
    }
    closeSkins() {
        if (!this.state.showSkins) return;
        this.setState({
            showSkins: null,
            tempSkin: null
        });
        this.base.removeEventListener("click", this.handleBaseClick);
        this.base.removeEventListener("keydown", this.handleBaseKeydown);
    }
    handleSkinMouseOver(tempSkin) {
        this.setState({
            tempSkin: tempSkin
        });
    }
    handleSkinClick(skin) {
        this.ignoreMouse();
        this.closeSkins();
        this.setState({
            skin: skin,
            tempSkin: null
        });
        ($f72b75cf796873c7$export$2e2bcd8739ae039).set("skin", skin);
    }
    renderNav() {
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)(($ec8c39fdad15601a$export$2e2bcd8739ae039), {
            ref: this.refs.navigation,
            icons: this.props.icons,
            theme: this.state.theme,
            dir: this.dir,
            unfocused: !!this.state.searchResults,
            position: this.props.navPosition,
            onClick: this.handleCategoryClick
        }, this.navKey);
    }
    renderPreview() {
        const emoji = this.getEmojiByPos(this.state.pos);
        const noSearchResults = this.state.searchResults && !this.state.searchResults.length;
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            id: "preview",
            class: "flex flex-middle",
            dir: this.dir,
            "data-position": this.props.previewPosition,
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    class: "flex flex-middle flex-grow",
                    children: [
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                            class: "flex flex-auto flex-middle flex-center",
                            style: {
                                height: this.props.emojiButtonSize,
                                fontSize: this.props.emojiButtonSize
                            },
                            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)(($254755d3f438722f$export$2e2bcd8739ae039), {
                                emoji: emoji,
                                id: noSearchResults ? this.props.noResultsEmoji || "cry" : this.props.previewEmoji || (this.props.previewPosition == "top" ? "point_down" : "point_up"),
                                set: this.props.set,
                                size: this.props.emojiButtonSize,
                                skin: this.state.tempSkin || this.state.skin,
                                spritesheet: true,
                                getSpritesheetURL: this.props.getSpritesheetURL
                            })
                        }),
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                            class: `margin-${this.dir[0]}`,
                            children: emoji || noSearchResults ? /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                                class: `padding-${this.dir[2]} align-${this.dir[0]}`,
                                children: [
                                    /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                                        class: "preview-title ellipsis",
                                        children: emoji ? emoji.name : ($7adb23b0109cc36a$export$dbe3113d60765c1a).search_no_results_1
                                    }),
                                    /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                                        class: "preview-subtitle ellipsis color-c",
                                        children: emoji ? emoji.skins[0].shortcodes : ($7adb23b0109cc36a$export$dbe3113d60765c1a).search_no_results_2
                                    })
                                ]
                            }) : /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                                class: "preview-placeholder color-c",
                                children: ($7adb23b0109cc36a$export$dbe3113d60765c1a).pick
                            })
                        })
                    ]
                }),
                !emoji && this.props.skinTonePosition == "preview" && this.renderSkinToneButton()
            ]
        });
    }
    renderEmojiButton(emoji, { pos: pos , posinset: posinset , grid: grid  }) {
        const size = this.props.emojiButtonSize;
        const skin = this.state.tempSkin || this.state.skin;
        const emojiSkin = emoji.skins[skin - 1] || emoji.skins[0];
        const native = emojiSkin.native;
        const selected = ($693b183b0a78708f$export$9cb4719e2e525b7a)(this.state.pos, pos);
        const key = pos.concat(emoji.id).join("");
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)(($e0d4dda61265ff1e$export$2e2bcd8739ae039), {
            selected: selected,
            skin: skin,
            size: size,
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("button", {
                "aria-label": native,
                "aria-selected": selected || undefined,
                "aria-posinset": posinset,
                "aria-setsize": grid.setsize,
                "data-keyboard": this.state.keyboard,
                title: this.props.previewPosition == "none" ? emoji.name : undefined,
                type: "button",
                class: "flex flex-center flex-middle",
                tabindex: "-1",
                onClick: (e)=>this.handleEmojiClick({
                        e: e,
                        emoji: emoji
                    }),
                onMouseEnter: ()=>this.handleEmojiOver(pos),
                onMouseLeave: ()=>this.handleEmojiOver(),
                style: {
                    width: this.props.emojiButtonSize,
                    height: this.props.emojiButtonSize,
                    fontSize: this.props.emojiSize,
                    lineHeight: 0
                },
                children: [
                    /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                        "aria-hidden": "true",
                        class: "background",
                        style: {
                            borderRadius: this.props.emojiButtonRadius,
                            backgroundColor: this.props.emojiButtonColors ? this.props.emojiButtonColors[(posinset - 1) % this.props.emojiButtonColors.length] : undefined
                        }
                    }),
                    /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)(($254755d3f438722f$export$2e2bcd8739ae039), {
                        emoji: emoji,
                        set: this.props.set,
                        size: this.props.emojiSize,
                        skin: skin,
                        spritesheet: true,
                        getSpritesheetURL: this.props.getSpritesheetURL
                    })
                ]
            })
        }, key);
    }
    renderSearch() {
        const renderSkinTone = this.props.previewPosition == "none" || this.props.skinTonePosition == "search";
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    class: "spacer"
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    class: "flex flex-middle",
                    children: [
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                            class: "search relative flex-grow",
                            children: [
                                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("input", {
                                    type: "search",
                                    ref: this.refs.searchInput,
                                    placeholder: ($7adb23b0109cc36a$export$dbe3113d60765c1a).search,
                                    onClick: this.handleSearchClick,
                                    onInput: this.handleSearchInput,
                                    onKeyDown: this.handleSearchKeyDown,
                                    autoComplete: "off"
                                }),
                                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
                                    class: "icon loupe flex",
                                    children: ($fcccfb36ed0cde68$export$2e2bcd8739ae039).search.loupe
                                }),
                                this.state.searchResults && /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("button", {
                                    title: "Clear",
                                    "aria-label": "Clear",
                                    type: "button",
                                    class: "icon delete flex",
                                    onClick: this.clearSearch,
                                    onMouseDown: this.preventDefault,
                                    children: ($fcccfb36ed0cde68$export$2e2bcd8739ae039).search.delete
                                })
                            ]
                        }),
                        renderSkinTone && this.renderSkinToneButton()
                    ]
                })
            ]
        });
    }
    renderSearchResults() {
        const { searchResults: searchResults  } = this.state;
        if (!searchResults) return null;
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            class: "category",
            ref: this.refs.search,
            children: [
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    class: `sticky padding-small align-${this.dir[0]}`,
                    children: ($7adb23b0109cc36a$export$dbe3113d60765c1a).categories.search
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    children: !searchResults.length ? /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                        class: `padding-small align-${this.dir[0]}`,
                        children: this.props.onAddCustomEmoji && /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("a", {
                            onClick: this.props.onAddCustomEmoji,
                            children: ($7adb23b0109cc36a$export$dbe3113d60765c1a).add_custom
                        })
                    }) : searchResults.map((row, i)=>{
                        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                            class: "flex",
                            children: row.map((emoji, ii)=>{
                                return this.renderEmojiButton(emoji, {
                                    pos: [
                                        i,
                                        ii
                                    ],
                                    posinset: i * this.props.perLine + ii + 1,
                                    grid: searchResults
                                });
                            })
                        });
                    })
                })
            ]
        });
    }
    renderCategories() {
        const { categories: categories  } = ($7adb23b0109cc36a$export$2d0294657ab35f1b);
        const hidden = !!this.state.searchResults;
        const perLine = this.getPerLine();
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            style: {
                visibility: hidden ? "hidden" : undefined,
                display: hidden ? "none" : undefined,
                height: "100%"
            },
            children: categories.map((category)=>{
                const { root: root , rows: rows  } = this.refs.categories.get(category.id);
                return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    "data-id": category.target ? category.target.id : category.id,
                    class: "category",
                    ref: root,
                    children: [
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                            class: `sticky padding-small align-${this.dir[0]}`,
                            children: category.name || ($7adb23b0109cc36a$export$dbe3113d60765c1a).categories[category.id]
                        }),
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                            class: "relative",
                            style: {
                                height: rows.length * this.props.emojiButtonSize
                            },
                            children: rows.map((row, i)=>{
                                const targetRow = row.index - row.index % $89bd6bb200cc8fef$var$Performance.rowsPerRender;
                                const visible = this.state.visibleRows[targetRow];
                                const ref = "current" in row ? row : undefined;
                                if (!visible && !ref) return null;
                                const start = i * perLine;
                                const end = start + perLine;
                                const emojiIds = category.emojis.slice(start, end);
                                if (emojiIds.length < perLine) emojiIds.push(...new Array(perLine - emojiIds.length));
                                return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                                    "data-index": row.index,
                                    ref: ref,
                                    class: "flex row",
                                    style: {
                                        top: i * this.props.emojiButtonSize
                                    },
                                    children: visible && emojiIds.map((emojiId, ii)=>{
                                        if (!emojiId) return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                                            style: {
                                                width: this.props.emojiButtonSize,
                                                height: this.props.emojiButtonSize
                                            }
                                        });
                                        const emoji = ($c4d155af13ad4d4b$export$2e2bcd8739ae039).get(emojiId);
                                        return this.renderEmojiButton(emoji, {
                                            pos: [
                                                row.index,
                                                ii
                                            ],
                                            posinset: row.posinset + ii,
                                            grid: this.grid
                                        });
                                    })
                                }, row.index);
                            })
                        })
                    ]
                });
            })
        });
    }
    renderSkinToneButton() {
        if (this.props.skinTonePosition == "none") return null;
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            class: "flex flex-auto flex-center flex-middle",
            style: {
                position: "relative",
                width: this.props.emojiButtonSize,
                height: this.props.emojiButtonSize
            },
            children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("button", {
                type: "button",
                ref: this.refs.skinToneButton,
                class: "skin-tone-button flex flex-auto flex-center flex-middle",
                "aria-selected": this.state.showSkins ? "" : undefined,
                "aria-label": ($7adb23b0109cc36a$export$dbe3113d60765c1a).skins.choose,
                title: ($7adb23b0109cc36a$export$dbe3113d60765c1a).skins.choose,
                onClick: this.openSkins,
                style: {
                    width: this.props.emojiSize,
                    height: this.props.emojiSize
                },
                children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
                    class: `skin-tone skin-tone-${this.state.skin}`
                })
            })
        });
    }
    renderLiveRegion() {
        const emoji = this.getEmojiByPos(this.state.pos);
        const contents = emoji ? emoji.name : "";
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            "aria-live": "polite",
            class: "sr-only",
            children: contents
        });
    }
    renderSkins() {
        const skinToneButton = this.refs.skinToneButton.current;
        const skinToneButtonRect = skinToneButton.getBoundingClientRect();
        const baseRect = this.base.getBoundingClientRect();
        const position = {};
        if (this.dir == "ltr") position.right = baseRect.right - skinToneButtonRect.right - 3;
        else position.left = skinToneButtonRect.left - baseRect.left - 3;
        if (this.props.previewPosition == "bottom" && this.props.skinTonePosition == "preview") position.bottom = baseRect.bottom - skinToneButtonRect.top + 6;
        else {
            position.top = skinToneButtonRect.bottom - baseRect.top + 3;
            position.bottom = "auto";
        }
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
            ref: this.refs.menu,
            role: "radiogroup",
            dir: this.dir,
            "aria-label": ($7adb23b0109cc36a$export$dbe3113d60765c1a).skins.choose,
            class: "menu hidden",
            "data-position": position.top ? "top" : "bottom",
            style: position,
            children: [
                ...Array(6).keys()
            ].map((i)=>{
                const skin = i + 1;
                const checked = this.state.skin == skin;
                return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    children: [
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("input", {
                            type: "radio",
                            name: "skin-tone",
                            value: skin,
                            "aria-label": ($7adb23b0109cc36a$export$dbe3113d60765c1a).skins[skin],
                            ref: checked ? this.refs.skinToneRadio : null,
                            defaultChecked: checked,
                            onChange: ()=>this.handleSkinMouseOver(skin),
                            onKeyDown: (e)=>{
                                if (e.code == "Enter" || e.code == "Space" || e.code == "Tab") {
                                    e.preventDefault();
                                    this.handleSkinClick(skin);
                                }
                            }
                        }),
                        /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("button", {
                            "aria-hidden": "true",
                            tabindex: "-1",
                            onClick: ()=>this.handleSkinClick(skin),
                            onMouseEnter: ()=>this.handleSkinMouseOver(skin),
                            onMouseLeave: ()=>this.handleSkinMouseOver(),
                            class: "option flex flex-grow flex-middle",
                            children: [
                                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
                                    class: `skin-tone skin-tone-${skin}`
                                }),
                                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("span", {
                                    class: "margin-small-lr",
                                    children: ($7adb23b0109cc36a$export$dbe3113d60765c1a).skins[skin]
                                })
                            ]
                        })
                    ]
                });
            })
        });
    }
    render() {
        const lineWidth = this.props.perLine * this.props.emojiButtonSize;
        return /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("section", {
            id: "root",
            class: "flex flex-column",
            dir: this.dir,
            style: {
                width: this.props.dynamicWidth ? "100%" : `calc(${lineWidth}px + (var(--padding) + var(--sidebar-width)))`
            },
            "data-emoji-set": this.props.set,
            "data-theme": this.state.theme,
            "data-menu": this.state.showSkins ? "" : undefined,
            children: [
                this.props.previewPosition == "top" && this.renderPreview(),
                this.props.navPosition == "top" && this.renderNav(),
                this.props.searchPosition == "sticky" && /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    class: "padding-lr",
                    children: this.renderSearch()
                }),
                /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                    ref: this.refs.scroll,
                    class: "scroll flex-grow padding-lr",
                    children: /*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)("div", {
                        style: {
                            width: this.props.dynamicWidth ? "100%" : lineWidth,
                            height: "100%"
                        },
                        children: [
                            this.props.searchPosition == "static" && this.renderSearch(),
                            this.renderSearchResults(),
                            this.renderCategories()
                        ]
                    })
                }),
                this.props.navPosition == "bottom" && this.renderNav(),
                this.props.previewPosition == "bottom" && this.renderPreview(),
                this.state.showSkins && this.renderSkins(),
                this.renderLiveRegion()
            ]
        });
    }
    constructor(props){
        super();
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "darkMediaCallback", ()=>{
            if (this.props.theme != "auto") return;
            this.setState({
                theme: this.darkMedia.matches ? "dark" : "light"
            });
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleClickOutside", (e)=>{
            const { element: element  } = this.props;
            if (e.target != element) {
                if (this.state.showSkins) this.closeSkins();
                if (this.props.onClickOutside) this.props.onClickOutside(e);
            }
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleBaseClick", (e)=>{
            if (!this.state.showSkins) return;
            if (!e.target.closest(".menu")) {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeSkins();
            }
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleBaseKeydown", (e)=>{
            if (!this.state.showSkins) return;
            if (e.key == "Escape") {
                e.preventDefault();
                e.stopImmediatePropagation();
                this.closeSkins();
            }
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleSearchClick", ()=>{
            const emoji = this.getEmojiByPos(this.state.pos);
            if (!emoji) return;
            this.setState({
                pos: [
                    -1,
                    -1
                ]
            });
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleSearchInput", async ()=>{
            const input = this.refs.searchInput.current;
            if (!input) return;
            const { value: value  } = input;
            const searchResults = await ($c4d155af13ad4d4b$export$2e2bcd8739ae039).search(value);
            const afterRender = ()=>{
                if (!this.refs.scroll.current) return;
                this.refs.scroll.current.scrollTop = 0;
            };
            if (!searchResults) return this.setState({
                searchResults: searchResults,
                pos: [
                    -1,
                    -1
                ]
            }, afterRender);
            const pos = input.selectionStart == input.value.length ? [
                0,
                0
            ] : [
                -1,
                -1
            ];
            const grid = [];
            grid.setsize = searchResults.length;
            let row = null;
            for (let emoji of searchResults){
                if (!grid.length || row.length == this.getPerLine()) {
                    row = [];
                    row.__categoryId = "search";
                    row.__index = grid.length;
                    grid.push(row);
                }
                row.push(emoji);
            }
            this.ignoreMouse();
            this.setState({
                searchResults: grid,
                pos: pos
            }, afterRender);
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleSearchKeyDown", (e)=>{
            // const specialKey = e.altKey || e.ctrlKey || e.metaKey
            const input = e.currentTarget;
            e.stopImmediatePropagation();
            switch(e.key){
                case "ArrowLeft":
                    // if (specialKey) return
                    // e.preventDefault()
                    this.navigate({
                        e: e,
                        input: input,
                        left: true
                    });
                    break;
                case "ArrowRight":
                    // if (specialKey) return
                    // e.preventDefault()
                    this.navigate({
                        e: e,
                        input: input,
                        right: true
                    });
                    break;
                case "ArrowUp":
                    // if (specialKey) return
                    // e.preventDefault()
                    this.navigate({
                        e: e,
                        input: input,
                        up: true
                    });
                    break;
                case "ArrowDown":
                    // if (specialKey) return
                    // e.preventDefault()
                    this.navigate({
                        e: e,
                        input: input,
                        down: true
                    });
                    break;
                case "Enter":
                    e.preventDefault();
                    this.handleEmojiClick({
                        e: e,
                        pos: this.state.pos
                    });
                    break;
                case "Escape":
                    e.preventDefault();
                    if (this.state.searchResults) this.clearSearch();
                    else this.unfocusSearch();
                    break;
            }
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "clearSearch", ()=>{
            const input = this.refs.searchInput.current;
            if (!input) return;
            input.value = "";
            input.focus();
            this.handleSearchInput();
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "handleCategoryClick", ({ category: category , i: i  })=>{
            this.scrollTo(i == 0 ? {
                row: -1
            } : {
                categoryId: category.id
            });
        });
        ($c770c458706daa72$export$2e2bcd8739ae039)(this, "openSkins", (e)=>{
            const { currentTarget: currentTarget  } = e;
            const rect = currentTarget.getBoundingClientRect();
            this.setState({
                showSkins: rect
            }, async ()=>{
                // Firefox requires 2 frames for the transition to consistenly work
                await ($693b183b0a78708f$export$e772c8ff12451969)(2);
                const menu = this.refs.menu.current;
                if (!menu) return;
                menu.classList.remove("hidden");
                this.refs.skinToneRadio.current.focus();
                this.base.addEventListener("click", this.handleBaseClick, true);
                this.base.addEventListener("keydown", this.handleBaseKeydown, true);
            });
        });
        this.observers = [];
        this.state = {
            pos: [
                -1,
                -1
            ],
            perLine: this.initDynamicPerLine(props),
            visibleRows: {
                0: true
            },
            ...this.getInitialState(props)
        };
    }
}









class $efa000751917694d$export$2e2bcd8739ae039 extends ($26f27c338a96b1a6$export$2e2bcd8739ae039) {
    async connectedCallback() {
        const props = ($7adb23b0109cc36a$export$75fe5f91d452f94b)(this.props, ($b247ea80b67298d5$export$2e2bcd8739ae039), this);
        props.element = this;
        props.ref = (component)=>{
            this.component = component;
        };
        await ($7adb23b0109cc36a$export$2cd8252107eb640b)(props);
        if (this.disconnected) return;
        ($fb96b826c0c5f37a$export$b3890eb0ae9dca99)(/*#__PURE__*/ ($bd9dd35321b03dd4$export$34b9dba7ce09269b)(($89bd6bb200cc8fef$export$2e2bcd8739ae039), {
            ...props
        }), this.shadowRoot);
    }
    constructor(props){
        super(props, {
            styles: ((/*@__PURE__*/$parcel$interopDefault($329d53ba9fd7125f$exports)))
        });
    }
}
($c770c458706daa72$export$2e2bcd8739ae039)($efa000751917694d$export$2e2bcd8739ae039, "Props", ($b247ea80b67298d5$export$2e2bcd8739ae039));
if (typeof customElements !== "undefined" && !customElements.get("em-emoji-picker")) customElements.define("em-emoji-picker", $efa000751917694d$export$2e2bcd8739ae039);


var $329d53ba9fd7125f$exports = {};
$329d53ba9fd7125f$exports = ":host {\n  width: min-content;\n  height: 435px;\n  min-height: 230px;\n  border-radius: var(--border-radius);\n  box-shadow: var(--shadow);\n  --border-radius: 10px;\n  --category-icon-size: 18px;\n  --font-family: -apple-system, BlinkMacSystemFont, \"Helvetica Neue\", sans-serif;\n  --font-size: 15px;\n  --preview-placeholder-size: 21px;\n  --preview-title-size: 1.1em;\n  --preview-subtitle-size: .9em;\n  --shadow-color: 0deg 0% 0%;\n  --shadow: .3px .5px 2.7px hsl(var(--shadow-color) / .14), .4px .8px 1px -3.2px hsl(var(--shadow-color) / .14), 1px 2px 2.5px -4.5px hsl(var(--shadow-color) / .14);\n  display: flex;\n}\n\n[data-theme=\"light\"] {\n  --em-rgb-color: var(--rgb-color, 34, 36, 39);\n  --em-rgb-accent: var(--rgb-accent, 34, 102, 237);\n  --em-rgb-background: var(--rgb-background, 255, 255, 255);\n  --em-rgb-input: var(--rgb-input, 255, 255, 255);\n  --em-color-border: var(--color-border, rgba(0, 0, 0, .05));\n  --em-color-border-over: var(--color-border-over, rgba(0, 0, 0, .1));\n}\n\n[data-theme=\"dark\"] {\n  --em-rgb-color: var(--rgb-color, 222, 222, 221);\n  --em-rgb-accent: var(--rgb-accent, 58, 130, 247);\n  --em-rgb-background: var(--rgb-background, 21, 22, 23);\n  --em-rgb-input: var(--rgb-input, 0, 0, 0);\n  --em-color-border: var(--color-border, rgba(255, 255, 255, .1));\n  --em-color-border-over: var(--color-border-over, rgba(255, 255, 255, .2));\n}\n\n#root {\n  --color-a: rgb(var(--em-rgb-color));\n  --color-b: rgba(var(--em-rgb-color), .65);\n  --color-c: rgba(var(--em-rgb-color), .45);\n  --padding: 12px;\n  --padding-small: calc(var(--padding) / 2);\n  --sidebar-width: 16px;\n  --duration: 225ms;\n  --duration-fast: 125ms;\n  --duration-instant: 50ms;\n  --easing: cubic-bezier(.4, 0, .2, 1);\n  width: 100%;\n  text-align: left;\n  border-radius: var(--border-radius);\n  background-color: rgb(var(--em-rgb-background));\n  position: relative;\n}\n\n@media (prefers-reduced-motion) {\n  #root {\n    --duration: 0;\n    --duration-fast: 0;\n    --duration-instant: 0;\n  }\n}\n\n#root[data-menu] button {\n  cursor: auto;\n}\n\n#root[data-menu] .menu button {\n  cursor: pointer;\n}\n\n:host, #root, input, button {\n  color: rgb(var(--em-rgb-color));\n  font-family: var(--font-family);\n  font-size: var(--font-size);\n  -webkit-font-smoothing: antialiased;\n  -moz-osx-font-smoothing: grayscale;\n  line-height: normal;\n}\n\n*, :before, :after {\n  box-sizing: border-box;\n  min-width: 0;\n  margin: 0;\n  padding: 0;\n}\n\n.relative {\n  position: relative;\n}\n\n.flex {\n  display: flex;\n}\n\n.flex-auto {\n  flex: none;\n}\n\n.flex-center {\n  justify-content: center;\n}\n\n.flex-column {\n  flex-direction: column;\n}\n\n.flex-grow {\n  flex: auto;\n}\n\n.flex-middle {\n  align-items: center;\n}\n\n.flex-wrap {\n  flex-wrap: wrap;\n}\n\n.padding {\n  padding: var(--padding);\n}\n\n.padding-t {\n  padding-top: var(--padding);\n}\n\n.padding-lr {\n  padding-left: var(--padding);\n  padding-right: var(--padding);\n}\n\n.padding-r {\n  padding-right: var(--padding);\n}\n\n.padding-small {\n  padding: var(--padding-small);\n}\n\n.padding-small-b {\n  padding-bottom: var(--padding-small);\n}\n\n.padding-small-lr {\n  padding-left: var(--padding-small);\n  padding-right: var(--padding-small);\n}\n\n.margin {\n  margin: var(--padding);\n}\n\n.margin-r {\n  margin-right: var(--padding);\n}\n\n.margin-l {\n  margin-left: var(--padding);\n}\n\n.margin-small-l {\n  margin-left: var(--padding-small);\n}\n\n.margin-small-lr {\n  margin-left: var(--padding-small);\n  margin-right: var(--padding-small);\n}\n\n.align-l {\n  text-align: left;\n}\n\n.align-r {\n  text-align: right;\n}\n\n.color-a {\n  color: var(--color-a);\n}\n\n.color-b {\n  color: var(--color-b);\n}\n\n.color-c {\n  color: var(--color-c);\n}\n\n.ellipsis {\n  white-space: nowrap;\n  max-width: 100%;\n  width: auto;\n  text-overflow: ellipsis;\n  overflow: hidden;\n}\n\n.sr-only {\n  width: 1px;\n  height: 1px;\n  position: absolute;\n  top: auto;\n  left: -10000px;\n  overflow: hidden;\n}\n\na {\n  cursor: pointer;\n  color: rgb(var(--em-rgb-accent));\n}\n\na:hover {\n  text-decoration: underline;\n}\n\n.spacer {\n  height: 10px;\n}\n\n[dir=\"rtl\"] .scroll {\n  padding-left: 0;\n  padding-right: var(--padding);\n}\n\n.scroll {\n  padding-right: 0;\n  overflow-x: hidden;\n  overflow-y: auto;\n}\n\n.scroll::-webkit-scrollbar {\n  width: var(--sidebar-width);\n  height: var(--sidebar-width);\n}\n\n.scroll::-webkit-scrollbar-track {\n  border: 0;\n}\n\n.scroll::-webkit-scrollbar-button {\n  width: 0;\n  height: 0;\n  display: none;\n}\n\n.scroll::-webkit-scrollbar-corner {\n  background-color: rgba(0, 0, 0, 0);\n}\n\n.scroll::-webkit-scrollbar-thumb {\n  min-height: 20%;\n  min-height: 65px;\n  border: 4px solid rgb(var(--em-rgb-background));\n  border-radius: 8px;\n}\n\n.scroll::-webkit-scrollbar-thumb:hover {\n  background-color: var(--em-color-border-over) !important;\n}\n\n.scroll:hover::-webkit-scrollbar-thumb {\n  background-color: var(--em-color-border);\n}\n\n.sticky {\n  z-index: 1;\n  background-color: rgba(var(--em-rgb-background), .9);\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  font-weight: 500;\n  position: sticky;\n  top: -1px;\n}\n\n[dir=\"rtl\"] .search input[type=\"search\"] {\n  padding: 10px 2.2em 10px 2em;\n}\n\n[dir=\"rtl\"] .search .loupe {\n  left: auto;\n  right: .7em;\n}\n\n[dir=\"rtl\"] .search .delete {\n  left: .7em;\n  right: auto;\n}\n\n.search {\n  z-index: 2;\n  position: relative;\n}\n\n.search input, .search button {\n  font-size: calc(var(--font-size)  - 1px);\n}\n\n.search input[type=\"search\"] {\n  width: 100%;\n  background-color: var(--em-color-border);\n  transition-duration: var(--duration);\n  transition-property: background-color, box-shadow;\n  transition-timing-function: var(--easing);\n  border: 0;\n  border-radius: 10px;\n  outline: 0;\n  padding: 10px 2em 10px 2.2em;\n  display: block;\n}\n\n.search input[type=\"search\"]::-ms-input-placeholder {\n  color: inherit;\n  opacity: .6;\n}\n\n.search input[type=\"search\"]::placeholder {\n  color: inherit;\n  opacity: .6;\n}\n\n.search input[type=\"search\"], .search input[type=\"search\"]::-webkit-search-decoration, .search input[type=\"search\"]::-webkit-search-cancel-button, .search input[type=\"search\"]::-webkit-search-results-button, .search input[type=\"search\"]::-webkit-search-results-decoration {\n  -webkit-appearance: none;\n  -ms-appearance: none;\n  appearance: none;\n}\n\n.search input[type=\"search\"]:focus {\n  background-color: rgb(var(--em-rgb-input));\n  box-shadow: inset 0 0 0 1px rgb(var(--em-rgb-accent)), 0 1px 3px rgba(65, 69, 73, .2);\n}\n\n.search .icon {\n  z-index: 1;\n  color: rgba(var(--em-rgb-color), .7);\n  position: absolute;\n  top: 50%;\n  transform: translateY(-50%);\n}\n\n.search .loupe {\n  pointer-events: none;\n  left: .7em;\n}\n\n.search .delete {\n  right: .7em;\n}\n\nsvg {\n  fill: currentColor;\n  width: 1em;\n  height: 1em;\n}\n\nbutton {\n  -webkit-appearance: none;\n  -ms-appearance: none;\n  appearance: none;\n  cursor: pointer;\n  color: currentColor;\n  background-color: rgba(0, 0, 0, 0);\n  border: 0;\n}\n\n#nav {\n  z-index: 2;\n  padding-top: 12px;\n  padding-bottom: 12px;\n  padding-right: var(--sidebar-width);\n  position: relative;\n}\n\n#nav button {\n  color: var(--color-b);\n  transition: color var(--duration) var(--easing);\n}\n\n#nav button:hover {\n  color: var(--color-a);\n}\n\n#nav svg, #nav img {\n  width: var(--category-icon-size);\n  height: var(--category-icon-size);\n}\n\n#nav[dir=\"rtl\"] .bar {\n  left: auto;\n  right: 0;\n}\n\n#nav .bar {\n  width: 100%;\n  height: 3px;\n  background-color: rgb(var(--em-rgb-accent));\n  transition: transform var(--duration) var(--easing);\n  border-radius: 3px 3px 0 0;\n  position: absolute;\n  bottom: -12px;\n  left: 0;\n}\n\n#nav button[aria-selected] {\n  color: rgb(var(--em-rgb-accent));\n}\n\n#preview {\n  z-index: 2;\n  padding: calc(var(--padding)  + 4px) var(--padding);\n  padding-right: var(--sidebar-width);\n  position: relative;\n}\n\n#preview .preview-placeholder {\n  font-size: var(--preview-placeholder-size);\n}\n\n#preview .preview-title {\n  font-size: var(--preview-title-size);\n}\n\n#preview .preview-subtitle {\n  font-size: var(--preview-subtitle-size);\n}\n\n#nav:before, #preview:before {\n  content: \"\";\n  height: 2px;\n  position: absolute;\n  left: 0;\n  right: 0;\n}\n\n#nav[data-position=\"top\"]:before, #preview[data-position=\"top\"]:before {\n  background: linear-gradient(to bottom, var(--em-color-border), transparent);\n  top: 100%;\n}\n\n#nav[data-position=\"bottom\"]:before, #preview[data-position=\"bottom\"]:before {\n  background: linear-gradient(to top, var(--em-color-border), transparent);\n  bottom: 100%;\n}\n\n.category:last-child {\n  min-height: calc(100% + 1px);\n}\n\n.category button {\n  font-family: -apple-system, BlinkMacSystemFont, Helvetica Neue, sans-serif;\n  position: relative;\n}\n\n.category button > * {\n  position: relative;\n}\n\n.category button .background {\n  opacity: 0;\n  background-color: var(--em-color-border);\n  transition: opacity var(--duration-fast) var(--easing) var(--duration-instant);\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n}\n\n.category button:hover .background {\n  transition-duration: var(--duration-instant);\n  transition-delay: 0s;\n}\n\n.category button[aria-selected] .background {\n  opacity: 1;\n}\n\n.category button[data-keyboard] .background {\n  transition: none;\n}\n\n.row {\n  width: 100%;\n  position: absolute;\n  top: 0;\n  left: 0;\n}\n\n.skin-tone-button {\n  border: 1px solid rgba(0, 0, 0, 0);\n  border-radius: 100%;\n}\n\n.skin-tone-button:hover {\n  border-color: var(--em-color-border);\n}\n\n.skin-tone-button:active .skin-tone {\n  transform: scale(.85) !important;\n}\n\n.skin-tone-button .skin-tone {\n  transition: transform var(--duration) var(--easing);\n}\n\n.skin-tone-button[aria-selected] {\n  background-color: var(--em-color-border);\n  border-top-color: rgba(0, 0, 0, .05);\n  border-bottom-color: rgba(0, 0, 0, 0);\n  border-left-width: 0;\n  border-right-width: 0;\n}\n\n.skin-tone-button[aria-selected] .skin-tone {\n  transform: scale(.9);\n}\n\n.menu {\n  z-index: 2;\n  white-space: nowrap;\n  border: 1px solid var(--em-color-border);\n  background-color: rgba(var(--em-rgb-background), .9);\n  -webkit-backdrop-filter: blur(4px);\n  backdrop-filter: blur(4px);\n  transition-property: opacity, transform;\n  transition-duration: var(--duration);\n  transition-timing-function: var(--easing);\n  border-radius: 10px;\n  padding: 4px;\n  position: absolute;\n  box-shadow: 1px 1px 5px rgba(0, 0, 0, .05);\n}\n\n.menu.hidden {\n  opacity: 0;\n}\n\n.menu[data-position=\"bottom\"] {\n  transform-origin: 100% 100%;\n}\n\n.menu[data-position=\"bottom\"].hidden {\n  transform: scale(.9)rotate(-3deg)translateY(5%);\n}\n\n.menu[data-position=\"top\"] {\n  transform-origin: 100% 0;\n}\n\n.menu[data-position=\"top\"].hidden {\n  transform: scale(.9)rotate(3deg)translateY(-5%);\n}\n\n.menu input[type=\"radio\"] {\n  clip: rect(0 0 0 0);\n  width: 1px;\n  height: 1px;\n  border: 0;\n  margin: 0;\n  padding: 0;\n  position: absolute;\n  overflow: hidden;\n}\n\n.menu input[type=\"radio\"]:checked + .option {\n  box-shadow: 0 0 0 2px rgb(var(--em-rgb-accent));\n}\n\n.option {\n  width: 100%;\n  border-radius: 6px;\n  padding: 4px 6px;\n}\n\n.option:hover {\n  color: #fff;\n  background-color: rgb(var(--em-rgb-accent));\n}\n\n.skin-tone {\n  width: 16px;\n  height: 16px;\n  border-radius: 100%;\n  display: inline-block;\n  position: relative;\n  overflow: hidden;\n}\n\n.skin-tone:after {\n  content: \"\";\n  mix-blend-mode: overlay;\n  background: linear-gradient(rgba(255, 255, 255, .2), rgba(0, 0, 0, 0));\n  border: 1px solid rgba(0, 0, 0, .8);\n  border-radius: 100%;\n  position: absolute;\n  top: 0;\n  bottom: 0;\n  left: 0;\n  right: 0;\n  box-shadow: inset 0 -2px 3px #000, inset 0 1px 2px #fff;\n}\n\n.skin-tone-1 {\n  background-color: #ffc93a;\n}\n\n.skin-tone-2 {\n  background-color: #ffdab7;\n}\n\n.skin-tone-3 {\n  background-color: #e7b98f;\n}\n\n.skin-tone-4 {\n  background-color: #c88c61;\n}\n\n.skin-tone-5 {\n  background-color: #a46134;\n}\n\n.skin-tone-6 {\n  background-color: #5d4437;\n}\n\n[data-index] {\n  justify-content: space-between;\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone:after {\n  box-shadow: none;\n  border-color: rgba(0, 0, 0, .5);\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone-1 {\n  background-color: #fade72;\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone-2 {\n  background-color: #f3dfd0;\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone-3 {\n  background-color: #eed3a8;\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone-4 {\n  background-color: #cfad8d;\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone-5 {\n  background-color: #a8805d;\n}\n\n[data-emoji-set=\"twitter\"] .skin-tone-6 {\n  background-color: #765542;\n}\n\n[data-emoji-set=\"google\"] .skin-tone:after {\n  box-shadow: inset 0 0 2px 2px rgba(0, 0, 0, .4);\n}\n\n[data-emoji-set=\"google\"] .skin-tone-1 {\n  background-color: #f5c748;\n}\n\n[data-emoji-set=\"google\"] .skin-tone-2 {\n  background-color: #f1d5aa;\n}\n\n[data-emoji-set=\"google\"] .skin-tone-3 {\n  background-color: #d4b48d;\n}\n\n[data-emoji-set=\"google\"] .skin-tone-4 {\n  background-color: #aa876b;\n}\n\n[data-emoji-set=\"google\"] .skin-tone-5 {\n  background-color: #916544;\n}\n\n[data-emoji-set=\"google\"] .skin-tone-6 {\n  background-color: #61493f;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone:after {\n  border-color: rgba(0, 0, 0, .4);\n  box-shadow: inset 0 -2px 3px #000, inset 0 1px 4px #fff;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone-1 {\n  background-color: #f5c748;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone-2 {\n  background-color: #f1d5aa;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone-3 {\n  background-color: #d4b48d;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone-4 {\n  background-color: #aa876b;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone-5 {\n  background-color: #916544;\n}\n\n[data-emoji-set=\"facebook\"] .skin-tone-6 {\n  background-color: #61493f;\n}\n\n";

function initializePicker(container, stickerComponentProps, pluginClass) {
    const { note, date, granularity } = stickerComponentProps;
    const noteStore = granularity !== null ? notesStores[granularity] : null;
    const noteDateUID = date !== null && granularity != null ? getDateUID({ date, granularity }) : null;
    const theme = pluginClass.getTheme() === 'moonstone' ? 'light' : 'dark';
    const pickerOptions = {
        // TODO: test pickerData offline
        onEmojiSelect: (emoji) => {
            close();
            if (noteStore && noteDateUID) {
                console.log('💔<StickerPopover /> onEmojiSelect > noteStore: ', noteStore);
                // update store with new emoji
                noteStore.update((values) => (Object.assign(Object.assign({}, values), { [noteDateUID]: {
                        file: values[noteDateUID].file,
                        sticker: emoji.native
                    } })));
                // update note with new emoji tag
                const file = get_store_value(noteStore)[noteDateUID].file;
                window.app.vault.process(file, (data) => {
                    // TODO: simplify match with EmojiMart.getEmojiDataFromNative check
                    // to allow user to add a new emoji by just doing: #✅
                    const newTag = `${STICKER_TAG_PREFIX}${emoji.native}`;
                    const prevStickerTag = data.match(/#sticker-[^\s]+/);
                    if (prevStickerTag) {
                        let firstMatched = false;
                        return data
                            .replace(/#sticker-[^\s]+/g, () => {
                            if (!firstMatched) {
                                firstMatched = true;
                                return newTag;
                            }
                            return '';
                        })
                            .replace(/\s+/g, ' ');
                    }
                    else {
                        return `${newTag} ${data}`;
                    }
                });
            }
        },
        autoFocus: true,
        theme,
    };
    const pickerEl = new $efa000751917694d$export$2e2bcd8739ae039(pickerOptions);
    // add custom styles
    pickerEl.injectStyles(`
      section#root {
        font-family: inherit;
        background-color: pink;
      }
    `);
    if (container) {
        const pickerHtmlEl = pickerEl;
        container.appendChild(pickerHtmlEl);
        handleMutationObserver(pickerHtmlEl.shadowRoot);
    }
}
function handleMutationObserver(shadowRoot) {
    const observer = new MutationObserver((mutations) => {
        mutations.forEach(() => {
            const input = shadowRoot === null || shadowRoot === void 0 ? void 0 : shadowRoot.querySelector('input');
            if (input) {
                // input.focus();
                // TODO: may not be needed, since a global keydown handler might take care of bluring focus on escape
                // input.addEventListener('keydown', get(spInputKeydownHandlerStore), true);
                input.addEventListener('keydown', console.log, true);
                // Stop observing once the element is found
                observer.disconnect();
            }
        });
    });
    // Start observing changes in the shadow DOM
    shadowRoot && observer.observe(shadowRoot, { subtree: true, childList: true });
}

function isMacOS() {
    return navigator.appVersion.indexOf('Mac') !== -1;
}
function isControlPressed(e) {
    return isMacOS() ? e.metaKey : e.ctrlKey;
}
function isWeekend(date) {
    return date.isoWeekday() === 6 || date.isoWeekday() === 7;
}
function getStartOfWeek(days) {
    return days[0].weekday(0);
}
/**
 * Generate a 2D array of daily information to power
 * the calendar view.
 */
function getMonth(displayedDate) {
    const locale = displayedDate.locale();
    const month = [];
    let week = { days: [], weekNum: 0 };
    const startOfMonth = displayedDate.clone().locale(locale).date(1);
    const startOffset = get_store_value(localeDataStore).weekdays.indexOf(startOfMonth.format('dddd'));
    let date = startOfMonth.clone().subtract(startOffset, 'days');
    for (let _day = 0; _day < 42; _day++) {
        if (_day % 7 === 0) {
            week = {
                days: [],
                weekNum: date.week()
            };
            month.push(week);
        }
        week.days.push(date);
        date = date.clone().add(1, 'days');
    }
    return month;
}
function getYears({ startRangeYear }) {
    let crrRangeYear = startRangeYear;
    const COLUMNS = 3;
    const ROWS = 4;
    const years = Array.from({ length: ROWS }, () => Array(COLUMNS).fill(0));
    for (let rowIndex = 0; rowIndex < ROWS; rowIndex++) {
        for (let colIndex = 0; colIndex < COLUMNS; colIndex++) {
            years[rowIndex][colIndex] = crrRangeYear;
            crrRangeYear++;
        }
    }
    return years;
}

/* src/ui/components/StickerPopover.svelte generated by Svelte v4.2.19 */

function add_css$f(target) {
	append_styles(target, "svelte-ll27r7", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.pointer-events-none.svelte-ll27r7{pointer-events:none}.absolute.svelte-ll27r7{position:absolute}.left-0.svelte-ll27r7{left:0px}.top-0.svelte-ll27r7{top:0px}.z-20.svelte-ll27r7{z-index:20}.w-max.svelte-ll27r7{width:-moz-max-content;width:max-content}.bg-transparent.svelte-ll27r7{background-color:transparent}.opacity-0.svelte-ll27r7{opacity:0}#emoji-modal.svelte-ll27r7{padding:0px;min-width:unset;width:unset !important}");
}

function create_fragment$f(ctx) {
	let div1;
	let div0;

	return {
		c() {
			div1 = element("div");
			div0 = element("div");
			attr(div1, "class", "bg-transparent z-20 w-max opacity-0 pointer-events-none absolute top-0 left-0 svelte-ll27r7");
			attr(div1, "data-popover", true);
			attr(div1, "id", STICKER_POPOVER_ID);
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);
			/*div0_binding*/ ctx[4](div0);
		},
		p: noop,
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			/*div0_binding*/ ctx[4](null);
		}
	};
}

function instance$f($$self, $$props, $$invalidate) {
	let $pluginClassStore;
	let $stickerComponentPropsStore;
	component_subscribe($$self, pluginClassStore, $$value => $$invalidate(2, $pluginClassStore = $$value));
	component_subscribe($$self, stickerComponentPropsStore, $$value => $$invalidate(3, $stickerComponentPropsStore = $$value));
	let { close } = $$props;
	let pickerContainerEl = null;

	function div0_binding($$value) {
		binding_callbacks[$$value ? 'unshift' : 'push'](() => {
			pickerContainerEl = $$value;
			$$invalidate(0, pickerContainerEl);
		});
	}

	$$self.$$set = $$props => {
		if ('close' in $$props) $$invalidate(1, close = $$props.close);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*pickerContainerEl, $stickerComponentPropsStore, $pluginClassStore*/ 13) {
			initializePicker(pickerContainerEl, $stickerComponentPropsStore, $pluginClassStore);
		}
	};

	return [
		pickerContainerEl,
		close,
		$pluginClassStore,
		$stickerComponentPropsStore,
		div0_binding
	];
}

class StickerPopover extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$f, create_fragment$f, safe_not_equal, { close: 1 }, add_css$f);
	}
}

const stickerComponentPropsStore = writable({
    note: null,
    date: null,
    granularity: null
});

class FileMenuPopoverBehavior {
    constructor({ note, event, date, granularity }) {
        this.note = note;
        this.menu = new obsidian.Menu();
        this.menu.addItem((item) => item.setTitle('Add Sticker').setIcon('smile-plus').onClick(() => {
            Popover.create({
                id: STICKER_POPOVER_ID,
                view: {
                    Component: StickerPopover,
                },
                refHtmlEl: event.target
            }).open();
            stickerComponentPropsStore.set({
                note,
                date,
                granularity
            });
        }));
        this.menu.addItem((item) => item
            .setTitle('Delete')
            .setIcon('trash')
            .onClick(() => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.app.fileManager.promptForFileDeletion(note);
        }));
        this.menu.showAtPosition({
            x: event.pageX,
            y: event.pageY
        });
    }
    open() {
        window.app.workspace.trigger('file-menu', this.menu, this.note, 'calendar-context-menu', null);
    }
    close() {
        this.menu.close();
    }
    cleanup() {
        this.close();
        this.menu.unload();
    }
}

class StickerPopoverBehavior extends BaseComponentBehavior {
    constructor(params) {
        super(params.id, params.view, params.refHtmlEl);
        this.params = params;
    }
    open() {
        var _a;
        super.open();
        (_a = this.getSearchInput()) === null || _a === void 0 ? void 0 : _a.focus();
        // TODO: is it neccessary? or would window event listener be enough
        // // ensure event is fired in the capturing phase
        // searchInput?.addEventListener('keydown', get(spInputKeydownHandlerStore), true);
        this.addWindowListeners(this.getWindowEvents());
    }
    close() {
        var _a;
        super.close();
        (_a = this.getSearchInput()) === null || _a === void 0 ? void 0 : _a.blur();
        // TODO: solve this.open's TODO first
        // spInput?.removeEventListener('keydown', get(spInputKeydownHandlerStore), true);
        this.removeWindowListeners(this.getWindowEvents());
    }
    cleanup() {
        this.close();
        this.component.$destroy();
    }
    getWindowEvents() {
        return {
            click: this.handleWindowClick,
            auxclick: this.handleWindowClick,
            keydown: this.handleWindowKeydown
        };
    }
    handleWindowClick(event) {
        var _a, _b, _c;
        const ev = event;
        const menuEl = document.querySelector('.menu');
        const stickerElTouched = this.componentHtmlEl.contains(ev.target) ||
            ((_a = ev.target) === null || _a === void 0 ? void 0 : _a.id.includes(STICKER_POPOVER_ID));
        const menuElTouched = (menuEl === null || menuEl === void 0 ? void 0 : menuEl.contains(ev.target)) || ((_b = ev.target) === null || _b === void 0 ? void 0 : _b.className.includes('menu'));
        // close SP if user clicks anywhere but SP
        // && !menuElTouched is only relevant for first call
        if (((_c = getPopoverInstance(this.params.id)) === null || _c === void 0 ? void 0 : _c.opened) && !stickerElTouched && !menuElTouched) {
            this.close();
            return;
        }
    }
    ;
    handleWindowKeydown(event) {
        var _a, _b, _c;
        const settings = get_store_value(settingsStore);
        const focusableSelectors = ':is(a[href], button, input, textarea, select, details, [tabindex]):not([tabindex="-1"])';
        const focusablePopoverElements = Array.from(this.componentHtmlEl.querySelectorAll(focusableSelectors));
        const referenceElFocused = (((_a = getPopoverInstance(this.params.id)) === null || _a === void 0 ? void 0 : _a.opened) && document.activeElement === this.refHtmlEl) || false;
        // When the user focuses on 'referenceEl' and then presses the Tab or ArrowDown key, the first element inside the view should receive focus.
        // TODO: make it work!
        if (referenceElFocused &&
            (event.key === 'ArrowDown' || event.key === 'Tab') &&
            focusablePopoverElements.length > 0) {
            focusablePopoverElements[0].focus();
            return;
        }
        if (event.key === 'Escape') {
            const searchInput = (_c = (_b = document.querySelector('em-emoji-picker')) === null || _b === void 0 ? void 0 : _b.shadowRoot) === null || _c === void 0 ? void 0 : _c.querySelector('input');
            if (searchInput &&
                searchInput.isActiveElement()) {
                searchInput.blur();
                if (settings.popoversClosing.closeOnEscStickerSearchInput) {
                    this.close();
                }
                return;
            }
            if (settings.popoversClosing.closePopoversOneByOneOnEscKeydown) {
                this.close();
            }
            else {
                Popover.instances.forEach((instance) => instance === null || instance === void 0 ? void 0 : instance.close());
            }
            this.refHtmlEl.focus();
            return;
        }
    }
    ;
    getSearchInput() {
        var _a, _b;
        return (_b = (_a = document.querySelector('em-emoji-picker')) === null || _a === void 0 ? void 0 : _a.shadowRoot) === null || _b === void 0 ? void 0 : _b.querySelector('input');
    }
}

class Popover {
    constructor(id, behavior) {
        this.id = id;
        this.behavior = behavior;
        this.opened = false;
    }
    static create(params) {
        let popover = getPopoverInstance(params.id);
        if (!popover) {
            const behavior = createBehavior(params);
            popover = new Popover(params.id, behavior);
            Popover.instances.set(params.id, popover);
            Popover.behaviorInstances.set(params.id, behavior);
        }
        return popover;
    }
    static cleanup() {
        Popover.instances.forEach((popover) => popover.cleanup());
        Popover.instances.clear();
        Popover.mutationObserverStarted = false;
    }
    toggle() {
        if (this.opened) {
            this.close();
        }
        else {
            this.open();
        }
    }
    open() {
        this.opened = true;
        this.behavior.open();
    }
    close() {
        this.opened = false;
        this.behavior.close();
    }
    cleanup() {
        this.behavior.cleanup();
    }
}
Popover.instances = new Map();
Popover.behaviorInstances = new Map();
Popover.mutationObserverStarted = false;
function createBehavior(params) {
    switch (params.id) {
        case CALENDAR_POPOVER_ID:
            return new CalendarPopoverBehavior(params);
        case STICKER_POPOVER_ID:
            return new StickerPopoverBehavior(params);
        case FILE_MENU_POPOVER_ID:
            return new FileMenuPopoverBehavior(params);
    }
}
function getPopoverInstance(id) {
    return Popover.instances.get(id);
}

function r(e){var t,f,n="";if("string"==typeof e||"number"==typeof e)n+=e;else if("object"==typeof e)if(Array.isArray(e)){var o=e.length;for(t=0;t<o;t++)e[t]&&(f=r(e[t]))&&(n&&(n+=" "),n+=f);}else for(f in e)e[f]&&(n&&(n+=" "),n+=f);return n}function clsx(){for(var e,t,f=0,n="",o=arguments.length;f<o;f++)(e=arguments[f])&&(t=r(e))&&(n&&(n+=" "),n+=t);return n}

/**
 * Read user settings from periodic-notes and daily-notes plugins
 * to keep behavior of creating a new note in-sync.
 * @note only call after periodic notes plugin is fully loaded
 */
function getNoteSettingsByPeriodicity(periodicity) {
    var _a, _b, _c, _d, _e, _f;
    let pluginSettings = null;
    const plugins = window.app.plugins;
    const internalPlugins = window.app.internalPlugins;
    const pnSettingsByPeriodicity = (_b = (_a = plugins.getPlugin(PERIODIC_NOTES_PLUGIN_ID)) === null || _a === void 0 ? void 0 : _a.settings) === null || _b === void 0 ? void 0 : _b[periodicity];
    if (pnSettingsByPeriodicity === null || pnSettingsByPeriodicity === void 0 ? void 0 : pnSettingsByPeriodicity.enabled) {
        pluginSettings = pnSettingsByPeriodicity;
    }
    else if (periodicity === 'daily') {
        const dailyNotesPlugin = internalPlugins === null || internalPlugins === void 0 ? void 0 : internalPlugins.getPluginById(DAILY_NOTES_PLUGIN_ID);
        pluginSettings = (_c = dailyNotesPlugin === null || dailyNotesPlugin === void 0 ? void 0 : dailyNotesPlugin.instance) === null || _c === void 0 ? void 0 : _c.options;
    }
    if (pluginSettings) {
        console.log("using plugin settings", pluginSettings);
        return {
            format: ((_d = pluginSettings.format) === null || _d === void 0 ? void 0 : _d.trim()) || DEFAULT_FORMATS[periodicity],
            folder: ((_e = pluginSettings.folder) === null || _e === void 0 ? void 0 : _e.trim()) || '/',
            template: ((_f = pluginSettings.template) === null || _f === void 0 ? void 0 : _f.trim()) || ''
        };
    }
    else {
        console.log("using default settings", DEFAULT_FORMATS[periodicity]);
        return {
            format: DEFAULT_FORMATS[periodicity],
            folder: '/',
            template: ''
        };
    }
}

// Credit: @creationix/path.js
function join(...partSegments) {
    // Split the inputs into a list of path commands.
    let parts = [];
    for (let i = 0, l = partSegments.length; i < l; i++) {
        parts = parts.concat(partSegments[i].split("/"));
    }
    // Interpret the path commands to get the new resolved path.
    const newParts = [];
    for (let i = 0, l = parts.length; i < l; i++) {
        const part = parts[i];
        // Remove leading and trailing slashes
        // Also remove "." segments
        if (!part || part === ".")
            continue;
        // Push new path segments.
        else
            newParts.push(part);
    }
    // Preserve the initial slash if there was one.
    if (parts[0] === "")
        newParts.unshift("");
    // Turn back into a single string path.
    return newParts.join("/");
}
function basename(fullPath) {
    let base = fullPath.substring(fullPath.lastIndexOf("/") + 1);
    if (base.lastIndexOf(".") != -1)
        base = base.substring(0, base.lastIndexOf("."));
    return base;
}
function ensureFolderExists(path) {
    return __awaiter(this, void 0, void 0, function* () {
        const dirs = path.replace(/\\/g, "/").split("/");
        dirs.pop(); // remove basename
        if (dirs.length) {
            const dir = join(...dirs);
            if (!window.app.vault.getAbstractFileByPath(dir)) {
                yield window.app.vault.createFolder(dir);
            }
        }
    });
}
function getNotePath(directory, filename) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!filename.endsWith(".md")) {
            filename += ".md";
        }
        const path = obsidian.normalizePath(join(directory, filename));
        yield ensureFolderExists(path);
        return path;
    });
}
function getTemplateInfo(template) {
    return __awaiter(this, void 0, void 0, function* () {
        const { metadataCache, vault } = window.app;
        const templatePath = obsidian.normalizePath(template);
        if (templatePath === "/") {
            return Promise.resolve(["", null]);
        }
        try {
            // get First file matching given templatePath
            const templateFile = metadataCache.getFirstLinkpathDest(templatePath, "");
            const contents = yield vault.cachedRead(templateFile);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const IFoldInfo = window.app.foldManager.load(templateFile);
            return [contents, IFoldInfo];
        }
        catch (err) {
            console.error(`Failed to read the daily note template '${templatePath}'`, err);
            new obsidian.Notice("Failed to read the daily note template");
            return ["", null];
        }
    });
}

/**
 * dateUID is a way of identifying periodic notes.
 * They are prefixed with the given granularity to avoid ambiguity.
 * e.g.: "day-2022/01/01", "week-20"
 */
function getDateUID({ date, granularity, localeAware }) {
    return `${granularity}-${date
        .startOf(granularity || 'day')
        .clone()
        .locale(localeAware ? window.moment.locale() : 'en')
        .format()}`;
}
function removeEscapedCharacters(format) {
    return format.replace(/\[[^\]]*\]/g, ''); // remove everything within brackets
}
/**
 * XXX: When parsing dates that contain both week numbers and months,
 * Moment choses to ignore the week numbers. For the week dateUID, we
 * want the opposite behavior. Strip the MMM from the format to patch.
 */
function isWeekFormatAmbiguous(format) {
    const cleanFormat = removeEscapedCharacters(format);
    return /w{1,2}/i.test(cleanFormat) && (/M{1,4}/.test(cleanFormat) || /D{1,4}/.test(cleanFormat));
}
function getDateFromFile(file, granularity, useCrrFormat = false) {
    return getDateFromFilename(file.basename, granularity, useCrrFormat);
}
function getDateFromPath(path, granularity, useCrrFormat = false) {
    return getDateFromFilename(basename(path), granularity, useCrrFormat);
}
function getDateFromFilename(filename, granularity, useCrrFormat = false) {
    let noteDate = null;
    let validFormat;
    if (useCrrFormat) {
        const { format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
        logger("[io-parse]", granularity, format);
        const date = window.moment(filename, format, true);
        if (date.isValid()) {
            noteDate = date;
            validFormat = format;
        }
    }
    else {
        for (const format of get_store_value(settingsStore).validFormats[granularity]) {
            const date = window.moment(filename, format, true);
            // if date is valid and date represents the exact date described by filename 
            if (date.isValid() && date.format(format) === filename) {
                noteDate = date;
                validFormat = format;
                break;
            }
        }
    }
    if (!noteDate) {
        return null;
    }
    if (granularity === 'week') {
        if (validFormat && isWeekFormatAmbiguous(validFormat)) {
            const cleanFormat = removeEscapedCharacters(validFormat);
            if (/w{1,2}/i.test(cleanFormat)) {
                return window.moment(filename, 
                // If format contains week, remove day & month formatting
                validFormat.replace(/M{1,4}/g, '').replace(/D{1,4}/g, ''), false);
            }
        }
    }
    return noteDate;
}
function getPeriodicityFromGranularity(granularity) {
    return granularity === 'day' ? 'daily' : `${granularity}ly`;
}

function capitalize(string) {
    return string[0].toUpperCase() + string.slice(1).toLowerCase();
}
function getOnCreateNoteDialogNoteFromGranularity(granularity) {
    var _a;
    const periodicity = getPeriodicityFromGranularity(granularity);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const periodicNotesPlugin = window.app.plugins.getPlugin(PERIODIC_NOTES_PLUGIN_ID);
    const noteSettingsFromPeriodicNotesPlugin = periodicNotesPlugin === null || periodicNotesPlugin === void 0 ? void 0 : periodicNotesPlugin.settings[periodicity].enabled;
    if (granularity === 'day') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const dailyNotesPlugin = (_a = window.app.internalPlugins.plugins[DAILY_NOTES_PLUGIN_ID]) === null || _a === void 0 ? void 0 : _a.enabled;
        if (periodicNotesPlugin) {
            if (noteSettingsFromPeriodicNotesPlugin) {
                return 'Note: Using Daily notes config from Periodic Notes plugin.';
            }
            else {
                if (dailyNotesPlugin) {
                    return 'Note: Daily notes from Periodic Notes plugin are disabled. Using Daily Notes plugin config for now.';
                }
                else {
                    return 'Note: Daily notes from Periodic Notes plugin and Daily Notes plugin are disabled. Using default config for now.';
                }
            }
        }
        else {
            if (dailyNotesPlugin) {
                return 'Note: Missing Periodic Notes plugin! Please install or activate. Using Daily Notes plugin config for now.';
            }
            else {
                return 'Note: Missing Periodic Notes and Daily Notes plugin! Please install or activate. Using default config for now.';
            }
        }
    }
    if (periodicNotesPlugin) {
        if (noteSettingsFromPeriodicNotesPlugin) {
            return `Note: Using ${capitalize(periodicity)} notes config from Periodic Notes plugin.`;
        }
        else {
            return `Note: ${capitalize(periodicity)} notes from Periodic Notes plugin are disabled. Using default config for now.`;
        }
    }
    else {
        return 'Note: Missing Periodic Notes plugin! Please install or activate. Defaults will be used for now.';
    }
}
function logger(module, ...messages) {
    const prefix = `[${module}]`;
    messages.forEach((message) => {
        console.log(prefix, " ", message);
        console.log("-".repeat(20));
    });
}
function getPlugin(pluginId) {
    return __awaiter(this, void 0, void 0, function* () {
        const plugins = window.app.plugins;
        const enabledPlugins = plugins === null || plugins === void 0 ? void 0 : plugins.enabledPlugins;
        if (!enabledPlugins.has(pluginId)) {
            yield (plugins === null || plugins === void 0 ? void 0 : plugins.enablePluginAndSave(pluginId));
        }
        return plugins === null || plugins === void 0 ? void 0 : plugins.getPlugin(pluginId);
    });
}
function getDailyNotesPlugin() {
    return __awaiter(this, void 0, void 0, function* () {
        const internalPlugins = window.app.internalPlugins;
        const dailyNotesPlugin = internalPlugins === null || internalPlugins === void 0 ? void 0 : internalPlugins.getPluginById(DAILY_NOTES_PLUGIN_ID);
        if (!(dailyNotesPlugin === null || dailyNotesPlugin === void 0 ? void 0 : dailyNotesPlugin.enabled)) {
            yield dailyNotesPlugin.enable();
        }
    });
}

/* src/ui/components/Dot.svelte generated by Svelte v4.2.19 */

function add_css$e(target) {
	append_styles(target, "svelte-1yh895v", ".dot.svelte-1yh895v{display:inline-block;height:6px;width:6px;margin:0 1px;fill:none}.isVisible.svelte-1yh895v{stroke:var(--color-dot)}.isActive.svelte-1yh895v{stroke:var(--text-on-accent)}.isFilled.svelte-1yh895v{fill:var(--color-dot)}.isActive.isFilled.svelte-1yh895v{fill:var(--text-on-accent)}");
}

function create_fragment$e(ctx) {
	let svg;
	let circle;
	let svg_class_value;

	return {
		c() {
			svg = svg_element("svg");
			circle = svg_element("circle");
			attr(circle, "cx", "3");
			attr(circle, "cy", "3");
			attr(circle, "r", "2");
			attr(svg, "class", svg_class_value = "" + (null_to_empty(`dot ${/*className*/ ctx[0]}`) + " svelte-1yh895v"));
			attr(svg, "viewBox", "0 0 6 6");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			toggle_class(svg, "isVisible", /*isVisible*/ ctx[1]);
			toggle_class(svg, "isFilled", /*isFilled*/ ctx[2]);
			toggle_class(svg, "isActive", /*isActive*/ ctx[3]);
		},
		m(target, anchor) {
			insert(target, svg, anchor);
			append(svg, circle);
		},
		p(ctx, [dirty]) {
			if (dirty & /*className*/ 1 && svg_class_value !== (svg_class_value = "" + (null_to_empty(`dot ${/*className*/ ctx[0]}`) + " svelte-1yh895v"))) {
				attr(svg, "class", svg_class_value);
			}

			if (dirty & /*className, isVisible*/ 3) {
				toggle_class(svg, "isVisible", /*isVisible*/ ctx[1]);
			}

			if (dirty & /*className, isFilled*/ 5) {
				toggle_class(svg, "isFilled", /*isFilled*/ ctx[2]);
			}

			if (dirty & /*className, isActive*/ 9) {
				toggle_class(svg, "isActive", /*isActive*/ ctx[3]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(svg);
			}
		}
	};
}

function instance$e($$self, $$props, $$invalidate) {
	let { className = '' } = $$props;
	let { isVisible = true } = $$props;
	let { isFilled = false } = $$props;
	let { isActive = false } = $$props;

	$$self.$$set = $$props => {
		if ('className' in $$props) $$invalidate(0, className = $$props.className);
		if ('isVisible' in $$props) $$invalidate(1, isVisible = $$props.isVisible);
		if ('isFilled' in $$props) $$invalidate(2, isFilled = $$props.isFilled);
		if ('isActive' in $$props) $$invalidate(3, isActive = $$props.isActive);
	};

	return [className, isVisible, isFilled, isActive];
}

class Dot extends SvelteComponent {
	constructor(options) {
		super();

		init(
			this,
			options,
			instance$e,
			create_fragment$e,
			safe_not_equal,
			{
				className: 0,
				isVisible: 1,
				isFilled: 2,
				isActive: 3
			},
			add_css$e
		);
	}
}

const VIEW = Symbol('view');

/* src/ui/components/Sticker.svelte generated by Svelte v4.2.19 */

function add_css$d(target) {
	append_styles(target, "svelte-pms10b", ".svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-pms10b::before,.svelte-pms10b::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}.svelte-pms10b:-moz-focusring{outline:auto}.svelte-pms10b:-moz-ui-invalid{box-shadow:none}.svelte-pms10b::-webkit-inner-spin-button,.svelte-pms10b::-webkit-outer-spin-button{height:auto}.svelte-pms10b::-webkit-search-decoration{-webkit-appearance:none}.svelte-pms10b::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}.svelte-pms10b:disabled{cursor:default}.svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-pms10b::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.absolute.svelte-pms10b{position:absolute}.left-full.svelte-pms10b{left:100%}.top-0.svelte-pms10b{top:0px}.-translate-x-1\\/2.svelte-pms10b{--tw-translate-x:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-translate-y-1\\/2.svelte-pms10b{--tw-translate-y:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-12.svelte-pms10b{--tw-rotate:12deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}");
}

// (4:0) {#if sticker}
function create_if_block$3(ctx) {
	let div;
	let t;

	return {
		c() {
			div = element("div");
			t = text(/*sticker*/ ctx[0]);
			attr(div, "class", "rotate-12 absolute top-0 left-full -translate-x-1/2 -translate-y-1/2 svelte-pms10b");
			attr(div, "id", "sticker");
		},
		m(target, anchor) {
			insert(target, div, anchor);
			append(div, t);
		},
		p(ctx, dirty) {
			if (dirty & /*sticker*/ 1) set_data(t, /*sticker*/ ctx[0]);
		},
		d(detaching) {
			if (detaching) {
				detach(div);
			}
		}
	};
}

function create_fragment$d(ctx) {
	let if_block_anchor;
	let if_block = /*sticker*/ ctx[0] && create_if_block$3(ctx);

	return {
		c() {
			if (if_block) if_block.c();
			if_block_anchor = empty();
		},
		m(target, anchor) {
			if (if_block) if_block.m(target, anchor);
			insert(target, if_block_anchor, anchor);
		},
		p(ctx, [dirty]) {
			if (/*sticker*/ ctx[0]) {
				if (if_block) {
					if_block.p(ctx, dirty);
				} else {
					if_block = create_if_block$3(ctx);
					if_block.c();
					if_block.m(if_block_anchor.parentNode, if_block_anchor);
				}
			} else if (if_block) {
				if_block.d(1);
				if_block = null;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(if_block_anchor);
			}

			if (if_block) if_block.d(detaching);
		}
	};
}

function instance$d($$self, $$props, $$invalidate) {
	let { sticker } = $$props;

	$$self.$$set = $$props => {
		if ('sticker' in $$props) $$invalidate(0, sticker = $$props.sticker);
	};

	return [sticker];
}

class Sticker extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$d, create_fragment$d, safe_not_equal, { sticker: 0 }, add_css$d);
	}
}

/* src/ui/components/Day.svelte generated by Svelte v4.2.19 */

function add_css$c(target) {
	append_styles(target, "svelte-q04m77", ".svelte-q04m77,.svelte-q04m77::before,.svelte-q04m77::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-q04m77::before,.svelte-q04m77::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-q04m77{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-q04m77{text-transform:none}button.svelte-q04m77{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-q04m77:-moz-focusring{outline:auto}.svelte-q04m77:-moz-ui-invalid{box-shadow:none}.svelte-q04m77::-webkit-inner-spin-button,.svelte-q04m77::-webkit-outer-spin-button{height:auto}.svelte-q04m77::-webkit-search-decoration{-webkit-appearance:none}.svelte-q04m77::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-q04m77{cursor:pointer}.svelte-q04m77:disabled{cursor:default}.svelte-q04m77,.svelte-q04m77::before,.svelte-q04m77::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-q04m77::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.relative.svelte-q04m77{position:relative}.flex.svelte-q04m77{display:flex}.\\!h-auto.svelte-q04m77{height:auto !important}.w-full.svelte-q04m77{width:100%}.flex-col.svelte-q04m77{flex-direction:column}.rounded-\\[--radius-s\\].svelte-q04m77{border-radius:var(--radius-s)}.px-1.svelte-q04m77{padding-left:0.25rem;padding-right:0.25rem}.py-3.svelte-q04m77{padding-top:0.75rem;padding-bottom:0.75rem}.text-center.svelte-q04m77{text-align:center}.text-sm.svelte-q04m77{font-size:0.875rem;line-height:1.25rem}.font-semibold.svelte-q04m77{font-weight:600}.tabular-nums.svelte-q04m77{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.transition-colors.svelte-q04m77{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.day.svelte-q04m77{color:var(--text-normal)}.day.svelte-q04m77:hover{background-color:var(--interactive-hover)}.day.active.svelte-q04m77{background-color:var(--interactive-accent);color:var(--text-on-accent)}.day.active.svelte-q04m77:hover{background-color:var(--interactive-accent-hover)}.day.today.svelte-q04m77{color:var(--color-text-today)}.day.active.today.svelte-q04m77{color:var(--text-on-accent)}.day.adjacent-month.svelte-q04m77{opacity:0.25}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-q04m77:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

function create_fragment$c(ctx) {
	let td;
	let button;
	let t0_value = /*date*/ ctx[0].format('D') + "";
	let t0;
	let t1;
	let dot;
	let t2;
	let sticker_1;
	let current;
	let mounted;
	let dispose;

	dot = new Dot({
			props: {
				className: "absolute bottom-1",
				isVisible: !!/*file*/ ctx[5],
				isFilled: !!/*file*/ ctx[5],
				isActive: !!/*file*/ ctx[5]
			}
		});

	sticker_1 = new Sticker({ props: { sticker: /*sticker*/ ctx[4] } });

	return {
		c() {
			td = element("td");
			button = element("button");
			t0 = text(t0_value);
			t1 = space();
			create_component(dot.$$.fragment);
			t2 = space();
			create_component(sticker_1.$$.fragment);
			attr(button, "class", "[&:not(:focus-visible)]:shadow-none !h-auto w-full flex flex-col font-semibold rounded-[--radius-s] text-sm px-1 py-3 relative text-center tabular-nums transition-colors day svelte-q04m77");
			attr(button, "id", "day");
			toggle_class(button, "active", /*isActive*/ ctx[3]);
			toggle_class(button, "today", /*isToday*/ ctx[2]);
			toggle_class(button, "adjacent-month", /*isAdjacentMonth*/ ctx[1]);
			attr(td, "class", "relative svelte-q04m77");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t0);
			append(button, t1);
			mount_component(dot, button, null);
			append(td, t2);
			mount_component(sticker_1, td, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[14]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[15]),
					listen(button, "pointerenter", /*pointerenter_handler*/ ctx[16])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*date*/ 1) && t0_value !== (t0_value = /*date*/ ctx[0].format('D') + "")) set_data(t0, t0_value);
			const dot_changes = {};
			if (dirty & /*file*/ 32) dot_changes.isVisible = !!/*file*/ ctx[5];
			if (dirty & /*file*/ 32) dot_changes.isFilled = !!/*file*/ ctx[5];
			if (dirty & /*file*/ 32) dot_changes.isActive = !!/*file*/ ctx[5];
			dot.$set(dot_changes);

			if (!current || dirty & /*isActive*/ 8) {
				toggle_class(button, "active", /*isActive*/ ctx[3]);
			}

			if (!current || dirty & /*isToday*/ 4) {
				toggle_class(button, "today", /*isToday*/ ctx[2]);
			}

			if (!current || dirty & /*isAdjacentMonth*/ 2) {
				toggle_class(button, "adjacent-month", /*isAdjacentMonth*/ ctx[1]);
			}

			const sticker_1_changes = {};
			if (dirty & /*sticker*/ 16) sticker_1_changes.sticker = /*sticker*/ ctx[4];
			sticker_1.$set(sticker_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(dot.$$.fragment, local);
			transition_in(sticker_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dot.$$.fragment, local);
			transition_out(sticker_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(dot);
			destroy_component(sticker_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$c($$self, $$props, $$invalidate) {
	let file;
	let sticker;
	let isActive;
	let isToday;
	let isAdjacentMonth;
	let $displayedDateStore;
	let $activeFileIdStore;
	let $notesStore;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(11, $displayedDateStore = $$value));
	component_subscribe($$self, activeFileIdStore, $$value => $$invalidate(12, $activeFileIdStore = $$value));
	var _a, _b;
	let { date } = $$props;
	const { eventHandlers } = getContext(VIEW);

	// update today value in case the displayed date changes and the current date is no longer today
	let today;

	const notesStore = notesStores['day'];
	component_subscribe($$self, notesStore, value => $$invalidate(13, $notesStore = value));
	const dateUID = getDateUID({ date, granularity: 'day' });

	const click_handler = event => eventHandlers.onClick({
		date,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'day'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({ date, event, granularity: 'day' });

	const pointerenter_handler = event => {
		eventHandlers.onHover({
			date,
			targetEl: event.target,
			isControlPressed: isControlPressed(event),
			granularity: 'day'
		});
	};

	$$self.$$set = $$props => {
		if ('date' in $$props) $$invalidate(0, date = $$props.date);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore*/ 2048) {
			($$invalidate(10, today = window.moment()));
		}

		if ($$self.$$.dirty & /*$notesStore, _a*/ 8448) {
			$$invalidate(5, file = $$invalidate(8, _a = $notesStore[dateUID]) === null || _a === void 0
			? void 0
			: _a.file);
		}

		if ($$self.$$.dirty & /*$notesStore, _b*/ 8704) {
			$$invalidate(4, sticker = $$invalidate(9, _b = $notesStore[dateUID]) === null || _b === void 0
			? void 0
			: _b.sticker);
		}

		if ($$self.$$.dirty & /*$activeFileIdStore*/ 4096) {
			$$invalidate(3, isActive = $activeFileIdStore === dateUID);
		}

		if ($$self.$$.dirty & /*date, today*/ 1025) {
			$$invalidate(2, isToday = date.isSame(today, 'day'));
		}

		if ($$self.$$.dirty & /*date, $displayedDateStore*/ 2049) {
			$$invalidate(1, isAdjacentMonth = !date.isSame($displayedDateStore, 'month'));
		}
	};

	return [
		date,
		isAdjacentMonth,
		isToday,
		isActive,
		sticker,
		file,
		eventHandlers,
		notesStore,
		_a,
		_b,
		today,
		$displayedDateStore,
		$activeFileIdStore,
		$notesStore,
		click_handler,
		contextmenu_handler,
		pointerenter_handler
	];
}

class Day extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$c, create_fragment$c, not_equal, { date: 0 }, add_css$c);
	}
}

/* src/ui/components/Month.svelte generated by Svelte v4.2.19 */

function add_css$b(target) {
	append_styles(target, "svelte-pms10b", ".svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-pms10b::before,.svelte-pms10b::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-pms10b{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-pms10b{text-transform:none}button.svelte-pms10b{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-pms10b:-moz-focusring{outline:auto}.svelte-pms10b:-moz-ui-invalid{box-shadow:none}.svelte-pms10b::-webkit-inner-spin-button,.svelte-pms10b::-webkit-outer-spin-button{height:auto}.svelte-pms10b::-webkit-search-decoration{-webkit-appearance:none}.svelte-pms10b::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-pms10b{cursor:pointer}.svelte-pms10b:disabled{cursor:default}.svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-pms10b::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.relative.svelte-pms10b{position:relative}");
}

function create_fragment$b(ctx) {
	let td;
	let button;
	let t0_value = /*$displayedDateStore*/ ctx[2].clone().month(/*monthIndex*/ ctx[0]).format('MMMM') + "";
	let t0;
	let t1;
	let dot;
	let t2;
	let sticker_1;
	let current;
	let mounted;
	let dispose;

	dot = new Dot({
			props: {
				isFilled: !!/*file*/ ctx[4],
				isActive: !!/*file*/ ctx[4]
			}
		});

	sticker_1 = new Sticker({ props: { sticker: /*sticker*/ ctx[3] } });

	return {
		c() {
			td = element("td");
			button = element("button");
			t0 = text(t0_value);
			t1 = space();
			create_component(dot.$$.fragment);
			t2 = space();
			create_component(sticker_1.$$.fragment);
			attr(button, "id", "month");
			attr(button, "class", "svelte-pms10b");
			attr(td, "class", "relative svelte-pms10b");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t0);
			append(button, t1);
			mount_component(dot, button, null);
			append(td, t2);
			mount_component(sticker_1, td, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[11]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[12]),
					listen(button, "pointerenter", /*pointerenter_handler*/ ctx[13])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$displayedDateStore, monthIndex*/ 5) && t0_value !== (t0_value = /*$displayedDateStore*/ ctx[2].clone().month(/*monthIndex*/ ctx[0]).format('MMMM') + "")) set_data(t0, t0_value);
			const dot_changes = {};
			if (dirty & /*file*/ 16) dot_changes.isFilled = !!/*file*/ ctx[4];
			if (dirty & /*file*/ 16) dot_changes.isActive = !!/*file*/ ctx[4];
			dot.$set(dot_changes);
			const sticker_1_changes = {};
			if (dirty & /*sticker*/ 8) sticker_1_changes.sticker = /*sticker*/ ctx[3];
			sticker_1.$set(sticker_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(dot.$$.fragment, local);
			transition_in(sticker_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dot.$$.fragment, local);
			transition_out(sticker_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(dot);
			destroy_component(sticker_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$b($$self, $$props, $$invalidate) {
	let date;
	let dateUID;
	let file;
	let sticker;
	let $notesStore;
	let $displayedDateStore;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(2, $displayedDateStore = $$value));
	var _a, _b;
	let { monthIndex } = $$props;
	const { eventHandlers } = getContext(VIEW);
	const notesStore = notesStores['month'];
	component_subscribe($$self, notesStore, value => $$invalidate(10, $notesStore = value));

	const click_handler = event => eventHandlers.onClick({
		date,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'month'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({ date, event, granularity: 'month' });

	const pointerenter_handler = event => eventHandlers.onHover({
		date,
		targetEl: event.target,
		isControlPressed: isControlPressed(event),
		granularity: 'month'
	});

	$$self.$$set = $$props => {
		if ('monthIndex' in $$props) $$invalidate(0, monthIndex = $$props.monthIndex);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore, monthIndex*/ 5) {
			$$invalidate(1, date = $displayedDateStore.clone().month(monthIndex).startOf('month'));
		}

		if ($$self.$$.dirty & /*date*/ 2) {
			$$invalidate(9, dateUID = getDateUID({ date, granularity: 'month' }));
		}

		if ($$self.$$.dirty & /*$notesStore, dateUID, _a*/ 1664) {
			$$invalidate(4, file = $$invalidate(7, _a = $notesStore[dateUID]) === null || _a === void 0
			? void 0
			: _a.file);
		}

		if ($$self.$$.dirty & /*$notesStore, dateUID, _b*/ 1792) {
			$$invalidate(3, sticker = $$invalidate(8, _b = $notesStore[dateUID]) === null || _b === void 0
			? void 0
			: _b.sticker);
		}
	};

	return [
		monthIndex,
		date,
		$displayedDateStore,
		sticker,
		file,
		eventHandlers,
		notesStore,
		_a,
		_b,
		dateUID,
		$notesStore,
		click_handler,
		contextmenu_handler,
		pointerenter_handler
	];
}

class Month extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$b, create_fragment$b, not_equal, { monthIndex: 0 }, add_css$b);
	}
}

/* src/ui/components/Arrow.svelte generated by Svelte v4.2.19 */

function add_css$a(target) {
	append_styles(target, "svelte-47i02w", ".svelte-47i02w,.svelte-47i02w::before,.svelte-47i02w::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-47i02w::before,.svelte-47i02w::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-47i02w{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-47i02w{text-transform:none}button.svelte-47i02w{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-47i02w:-moz-focusring{outline:auto}.svelte-47i02w:-moz-ui-invalid{box-shadow:none}.svelte-47i02w::-webkit-inner-spin-button,.svelte-47i02w::-webkit-outer-spin-button{height:auto}.svelte-47i02w::-webkit-search-decoration{-webkit-appearance:none}.svelte-47i02w::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-47i02w{cursor:pointer}.svelte-47i02w:disabled{cursor:default}svg.svelte-47i02w{display:block;vertical-align:middle}.svelte-47i02w,.svelte-47i02w::before,.svelte-47i02w::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-47i02w::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.container.svelte-47i02w{width:100%}@media(min-width: 640px){.container.svelte-47i02w{max-width:640px}}@media(min-width: 768px){.container.svelte-47i02w{max-width:768px}}@media(min-width: 1024px){.container.svelte-47i02w{max-width:1024px}}@media(min-width: 1280px){.container.svelte-47i02w{max-width:1280px}}@media(min-width: 1536px){.container.svelte-47i02w{max-width:1536px}}.pointer-events-none.svelte-47i02w{pointer-events:none}.collapse.svelte-47i02w{visibility:collapse}.static.svelte-47i02w{position:static}.absolute.svelte-47i02w{position:absolute}.relative.svelte-47i02w{position:relative}.bottom-1.svelte-47i02w{bottom:0.25rem}.left-0.svelte-47i02w{left:0px}.left-full.svelte-47i02w{left:100%}.top-0.svelte-47i02w{top:0px}.z-10.svelte-47i02w{z-index:10}.z-20.svelte-47i02w{z-index:20}.m-0.svelte-47i02w{margin:0px}.-ml-1.svelte-47i02w{margin-left:-0.25rem}.mb-1\\.5.svelte-47i02w{margin-bottom:0.375rem}.ml-\\[5px\\].svelte-47i02w{margin-left:5px}.ml-auto.svelte-47i02w{margin-left:auto}.mt-2.svelte-47i02w{margin-top:0.5rem}.mt-2\\.5.svelte-47i02w{margin-top:0.625rem}.mt-3.svelte-47i02w{margin-top:0.75rem}.mt-7.svelte-47i02w{margin-top:1.75rem}.block.svelte-47i02w{display:block}.flex.svelte-47i02w{display:flex}.table.svelte-47i02w{display:table}.contents.svelte-47i02w{display:contents}.\\!h-4.svelte-47i02w{height:1rem !important}.\\!h-auto.svelte-47i02w{height:auto !important}.h-2\\.5.svelte-47i02w{height:0.625rem}.h-\\[8px\\].svelte-47i02w{height:8px}.h-auto.svelte-47i02w{height:auto}.\\!w-4.svelte-47i02w{width:1rem !important}.\\!w-6.svelte-47i02w{width:1.5rem !important}.\\!w-8.svelte-47i02w{width:2rem !important}.w-2\\.5.svelte-47i02w{width:0.625rem}.w-\\[8px\\].svelte-47i02w{width:8px}.w-full.svelte-47i02w{width:100%}.w-max.svelte-47i02w{width:-moz-max-content;width:max-content}.max-w-xs.svelte-47i02w{max-width:20rem}.flex-grow.svelte-47i02w{flex-grow:1}.border-collapse.svelte-47i02w{border-collapse:collapse}.-translate-x-1\\/2.svelte-47i02w{--tw-translate-x:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-translate-y-1\\/2.svelte-47i02w{--tw-translate-y:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-12.svelte-47i02w{--tw-rotate:12deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-180.svelte-47i02w{--tw-rotate:180deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-45.svelte-47i02w{--tw-rotate:45deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.cursor-not-allowed.svelte-47i02w{cursor:not-allowed}.cursor-pointer.svelte-47i02w{cursor:pointer}.flex-col.svelte-47i02w{flex-direction:column}.items-end.svelte-47i02w{align-items:flex-end}.items-center.svelte-47i02w{align-items:center}.justify-between.svelte-47i02w{justify-content:space-between}.rounded-\\[--radius-s\\].svelte-47i02w{border-radius:var(--radius-s)}.rounded-\\[--tab-curve\\].svelte-47i02w{border-radius:var(--tab-curve)}.rounded-sm.svelte-47i02w{border-radius:0.125rem}.border-0.svelte-47i02w{border-width:0px}.bg-\\[--background-modifier-hover\\].svelte-47i02w{background-color:var(--background-modifier-hover)}.bg-\\[--interactive-accent\\].svelte-47i02w{background-color:var(--interactive-accent)}.bg-slate-500.svelte-47i02w{--tw-bg-opacity:1;background-color:rgb(100 116 139 / var(--tw-bg-opacity))}.bg-transparent.svelte-47i02w{background-color:transparent}.p-1.svelte-47i02w{padding:0.25rem}.p-2.svelte-47i02w{padding:0.5rem}.px-1.svelte-47i02w{padding-left:0.25rem;padding-right:0.25rem}.px-2.svelte-47i02w{padding-left:0.5rem;padding-right:0.5rem}.px-4.svelte-47i02w{padding-left:1rem;padding-right:1rem}.py-2.svelte-47i02w{padding-top:0.5rem;padding-bottom:0.5rem}.py-3.svelte-47i02w{padding-top:0.75rem;padding-bottom:0.75rem}.\\!pt-2.svelte-47i02w{padding-top:0.5rem !important}.pt-4.svelte-47i02w{padding-top:1rem}.text-center.svelte-47i02w{text-align:center}.font-\\[\\'Inter\\'\\].svelte-47i02w{font-family:'Inter'}.text-7xl.svelte-47i02w{font-size:4.5rem;line-height:1}.text-lg.svelte-47i02w{font-size:1.125rem;line-height:1.75rem}.text-sm.svelte-47i02w{font-size:0.875rem;line-height:1.25rem}.text-xs.svelte-47i02w{font-size:0.75rem;line-height:1rem}.font-medium.svelte-47i02w{font-weight:500}.font-semibold.svelte-47i02w{font-weight:600}.uppercase.svelte-47i02w{text-transform:uppercase}.capitalize.svelte-47i02w{text-transform:capitalize}.tabular-nums.svelte-47i02w{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.text-\\[--color-arrow\\].svelte-47i02w{color:var(--color-arrow)}.text-\\[--color-text-title\\].svelte-47i02w{color:var(--color-text-title)}.text-\\[--color-text-today\\].svelte-47i02w{color:var(--color-text-today)}.text-\\[--interactive-accent\\].svelte-47i02w{color:var(--interactive-accent)}.text-\\[--tab-text-color\\].svelte-47i02w{color:var(--tab-text-color)}.text-\\[--text-muted\\].svelte-47i02w{color:var(--text-muted)}.text-\\[--text-normal\\].svelte-47i02w{color:var(--text-normal)}.text-\\[--text-on-accent\\].svelte-47i02w{color:var(--text-on-accent)}.opacity-0.svelte-47i02w{opacity:0}.opacity-100.svelte-47i02w{opacity:1}.opacity-50.svelte-47i02w{opacity:0.5}.opacity-60.svelte-47i02w{opacity:0.6}.shadow.svelte-47i02w{--tw-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.blur.svelte-47i02w{--tw-blur:blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition.svelte-47i02w{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.transition-colors.svelte-47i02w{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}button.svelte-47i02w{background-color:transparent}.hover\\:cursor-pointer.svelte-47i02w:hover{cursor:pointer}.hover\\:bg-\\[--interactive-accent-hover\\].svelte-47i02w:hover{background-color:var(--interactive-accent-hover)}.hover\\:bg-\\[--interactive-hover\\].svelte-47i02w:hover{background-color:var(--interactive-hover)}.hover\\:text-\\[--text-on-accent\\].svelte-47i02w:hover{color:var(--text-on-accent)}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-47i02w:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

function create_fragment$a(ctx) {
	let button;
	let svg;
	let path;
	let button_class_value;
	let mounted;
	let dispose;

	return {
		c() {
			button = element("button");
			svg = svg_element("svg");
			path = svg_element("path");
			attr(path, "fill", "currentColor");
			attr(path, "d", "M34.52 239.03L228.87 44.69c9.37-9.37 24.57-9.37 33.94 0l22.67 22.67c9.36 9.36 9.37 24.52.04 33.9L131.49 256l154.02 154.75c9.34 9.38 9.32 24.54-.04 33.9l-22.67 22.67c-9.37 9.37-24.57 9.37-33.94 0L34.52 272.97c-9.37-9.37-9.37-24.57 0-33.94z");
			attr(path, "class", "svelte-47i02w");
			attr(svg, "class", "!h-4 !w-4 text-[--color-arrow] svelte-47i02w");
			attr(svg, "focusable", "false");
			attr(svg, "role", "img");
			attr(svg, "xmlns", "http://www.w3.org/2000/svg");
			attr(svg, "viewBox", "0 0 320 512");
			attr(button, "class", button_class_value = "" + (null_to_empty(clsx('[&:not(:focus-visible)]:shadow-none flex items-center', /*direction*/ ctx[2] === 'right' && 'rotate-180', /*isMobile*/ ctx[3] ? '!w-8' : '!w-6')) + " svelte-47i02w"));
			attr(button, "id", "arrow");
			attr(button, "aria-label", /*tooltip*/ ctx[1]);
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, svg);
			append(svg, path);

			if (!mounted) {
				dispose = listen(button, "click", function () {
					if (is_function(/*onClick*/ ctx[0])) /*onClick*/ ctx[0].apply(this, arguments);
				});

				mounted = true;
			}
		},
		p(new_ctx, [dirty]) {
			ctx = new_ctx;

			if (dirty & /*direction*/ 4 && button_class_value !== (button_class_value = "" + (null_to_empty(clsx('[&:not(:focus-visible)]:shadow-none flex items-center', /*direction*/ ctx[2] === 'right' && 'rotate-180', /*isMobile*/ ctx[3] ? '!w-8' : '!w-6')) + " svelte-47i02w"))) {
				attr(button, "class", button_class_value);
			}

			if (dirty & /*tooltip*/ 2) {
				attr(button, "aria-label", /*tooltip*/ ctx[1]);
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

function instance$a($$self, $$props, $$invalidate) {
	let { onClick } = $$props;
	let { tooltip } = $$props;
	let { direction } = $$props;

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	let isMobile = window.app.isMobile;

	$$self.$$set = $$props => {
		if ('onClick' in $$props) $$invalidate(0, onClick = $$props.onClick);
		if ('tooltip' in $$props) $$invalidate(1, tooltip = $$props.tooltip);
		if ('direction' in $$props) $$invalidate(2, direction = $$props.direction);
	};

	return [onClick, tooltip, direction, isMobile];
}

class Arrow extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$a, create_fragment$a, safe_not_equal, { onClick: 0, tooltip: 1, direction: 2 }, add_css$a);
	}
}

/* src/ui/components/MonthNav.svelte generated by Svelte v4.2.19 */

function add_css$9(target) {
	append_styles(target, "svelte-47i02w", ".svelte-47i02w.svelte-47i02w.svelte-47i02w,.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{text-transform:none}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w:-moz-focusring{outline:auto}.svelte-47i02w.svelte-47i02w.svelte-47i02w:-moz-ui-invalid{box-shadow:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-inner-spin-button,.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-outer-spin-button{height:auto}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-search-decoration{-webkit-appearance:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{cursor:pointer}.svelte-47i02w.svelte-47i02w.svelte-47i02w:disabled{cursor:default}.svelte-47i02w.svelte-47i02w.svelte-47i02w,.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-47i02w.svelte-47i02w.svelte-47i02w::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.-ml-1.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-left:-0.25rem}.mb-1\\.5.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-bottom:0.375rem}.mt-3.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-top:0.75rem}.flex.svelte-47i02w.svelte-47i02w.svelte-47i02w{display:flex}.h-auto.svelte-47i02w.svelte-47i02w.svelte-47i02w{height:auto}.flex-col.svelte-47i02w.svelte-47i02w.svelte-47i02w{flex-direction:column}.items-end.svelte-47i02w.svelte-47i02w.svelte-47i02w{align-items:flex-end}.items-center.svelte-47i02w.svelte-47i02w.svelte-47i02w{align-items:center}.justify-between.svelte-47i02w.svelte-47i02w.svelte-47i02w{justify-content:space-between}.space-y-1.svelte-47i02w>.svelte-47i02w:not([hidden])~.svelte-47i02w:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.25rem * var(--tw-space-y-reverse))}.p-2.svelte-47i02w.svelte-47i02w.svelte-47i02w{padding:0.5rem}.px-2.svelte-47i02w.svelte-47i02w.svelte-47i02w{padding-left:0.5rem;padding-right:0.5rem}.text-7xl.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-size:4.5rem;line-height:1}.text-lg.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-size:1.125rem;line-height:1.75rem}.font-medium.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-weight:500}.font-semibold.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-weight:600}.text-\\[--color-arrow\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--color-arrow)}.text-\\[--color-text-title\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--color-text-title)}.text-\\[--interactive-accent\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--interactive-accent)}.opacity-100.svelte-47i02w.svelte-47i02w.svelte-47i02w{opacity:1}.opacity-60.svelte-47i02w.svelte-47i02w.svelte-47i02w{opacity:0.6}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{background-color:transparent}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-47i02w.svelte-47i02w.svelte-47i02w:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

function create_fragment$9(ctx) {
	let div2;
	let div0;
	let button0;
	let t0_value = /*$displayedDateStore*/ ctx[0].format('MMM') + "";
	let t0;
	let t1;
	let button1;
	let t2_value = /*$displayedDateStore*/ ctx[0].format('YYYY') + "";
	let t2;
	let t3;
	let div1;
	let arrow0;
	let t4;
	let button2;
	let dot;
	let button2_class_value;
	let button2_aria_label_value;
	let t5;
	let arrow1;
	let current;
	let mounted;
	let dispose;

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementdisplayedDate*/ ctx[3],
				tooltip: "Previous Month"
			}
		});

	dot = new Dot({
			props: {
				className: "h-[8px] w-[8px]",
				isFilled: /*showingCurrentMonth*/ ctx[1]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementdisplayedDate*/ ctx[4],
				tooltip: "Next Month"
			}
		});

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			button0 = element("button");
			t0 = text(t0_value);
			t1 = space();
			button1 = element("button");
			t2 = text(t2_value);
			t3 = space();
			div1 = element("div");
			create_component(arrow0.$$.fragment);
			t4 = space();
			button2 = element("button");
			create_component(dot.$$.fragment);
			t5 = space();
			create_component(arrow1.$$.fragment);
			attr(button0, "class", "h-auto text-7xl [&:not(:focus-visible)]:shadow-none font-semibold svelte-47i02w");
			attr(button0, "id", "month");
			attr(button1, "class", "[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium text-lg svelte-47i02w");
			attr(button1, "id", "year");
			attr(div0, "class", "flex justify-between items-end text-[--color-text-title] svelte-47i02w");
			attr(div0, "id", "title");

			attr(button2, "class", button2_class_value = "[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 " + (/*showingCurrentMonth*/ ctx[1]
			? 'opacity-100'
			: 'opacity-60 ') + " svelte-47i02w");

			attr(button2, "id", "reset-button");
			attr(button2, "aria-label", button2_aria_label_value = !/*showingCurrentMonth*/ ctx[1] ? 'Current Month' : null);
			attr(div1, "class", "flex items-center -ml-1 svelte-47i02w");
			attr(div1, "id", "bottom-nav");
			attr(div2, "class", "flex flex-col space-y-1 mt-3 mb-1.5 px-2 svelte-47i02w");
			attr(div2, "id", "nav");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, button0);
			append(button0, t0);
			append(div0, t1);
			append(div0, button1);
			append(button1, t2);
			append(div2, t3);
			append(div2, div1);
			mount_component(arrow0, div1, null);
			append(div1, t4);
			append(div1, button2);
			mount_component(dot, button2, null);
			append(div1, t5);
			mount_component(arrow1, div1, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[7]),
					listen(button0, "contextmenu", /*contextmenu_handler*/ ctx[8]),
					listen(button0, "pointerenter", /*pointerenter_handler*/ ctx[9]),
					listen(button1, "click", /*click_handler_1*/ ctx[10]),
					listen(button1, "contextmenu", /*contextmenu_handler_1*/ ctx[11]),
					listen(button1, "pointerenter", /*pointerenter_handler_1*/ ctx[12]),
					listen(button2, "click", /*resetdisplayedDate*/ ctx[5])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$displayedDateStore*/ 1) && t0_value !== (t0_value = /*$displayedDateStore*/ ctx[0].format('MMM') + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*$displayedDateStore*/ 1) && t2_value !== (t2_value = /*$displayedDateStore*/ ctx[0].format('YYYY') + "")) set_data(t2, t2_value);
			const dot_changes = {};
			if (dirty & /*showingCurrentMonth*/ 2) dot_changes.isFilled = /*showingCurrentMonth*/ ctx[1];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentMonth*/ 2 && button2_class_value !== (button2_class_value = "[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 " + (/*showingCurrentMonth*/ ctx[1]
			? 'opacity-100'
			: 'opacity-60 ') + " svelte-47i02w")) {
				attr(button2, "class", button2_class_value);
			}

			if (!current || dirty & /*showingCurrentMonth*/ 2 && button2_aria_label_value !== (button2_aria_label_value = !/*showingCurrentMonth*/ ctx[1] ? 'Current Month' : null)) {
				attr(button2, "aria-label", button2_aria_label_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$9($$self, $$props, $$invalidate) {
	let $displayedDateStore;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(0, $displayedDateStore = $$value));
	let today;
	const { eventHandlers } = getContext(VIEW);

	function decrementdisplayedDate() {
		displayedDateStore.update(date => date.clone().subtract(1, 'month'));
	}

	function incrementdisplayedDate() {
		displayedDateStore.update(date => date.clone().add(1, 'month'));
	}

	function resetdisplayedDate() {
		yearsRanges.update(values => Object.assign(Object.assign({}, values), {
			crrRangeIndex: values.ranges.findIndex(range => range === values.todayRange)
		}));

		displayedDateStore.set(today.clone());
	}

	let showingCurrentMonth;

	const click_handler = event => eventHandlers.onClick({
		date: $displayedDateStore,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'month'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({
		date: $displayedDateStore,
		event,
		granularity: 'month'
	});

	const pointerenter_handler = event => {
		eventHandlers.onHover({
			date: $displayedDateStore,
			targetEl: event.target,
			isControlPressed: isControlPressed(event),
			granularity: 'month'
		});
	};

	const click_handler_1 = event => eventHandlers.onClick({
		date: $displayedDateStore.clone().startOf('year'),
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'year'
	});

	const contextmenu_handler_1 = event => eventHandlers.onContextMenu({
		date: $displayedDateStore.clone().startOf('year'),
		event,
		granularity: 'year'
	});

	const pointerenter_handler_1 = event => {
		eventHandlers.onHover({
			date: $displayedDateStore.clone().startOf('year'),
			targetEl: event.target,
			isControlPressed: isControlPressed(event),
			granularity: 'year'
		});
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore*/ 1) {
			($$invalidate(6, today = window.moment()));
		}

		if ($$self.$$.dirty & /*$displayedDateStore, today*/ 65) {
			$$invalidate(1, showingCurrentMonth = $displayedDateStore.isSame(today, 'month'));
		}
	};

	return [
		$displayedDateStore,
		showingCurrentMonth,
		eventHandlers,
		decrementdisplayedDate,
		incrementdisplayedDate,
		resetdisplayedDate,
		today,
		click_handler,
		contextmenu_handler,
		pointerenter_handler,
		click_handler_1,
		contextmenu_handler_1,
		pointerenter_handler_1
	];
}

class MonthNav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$9, create_fragment$9, safe_not_equal, {}, add_css$9);
	}
}

/* src/ui/components/QuarterNum.svelte generated by Svelte v4.2.19 */

function add_css$8(target) {
	append_styles(target, "svelte-pms10b", ".svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-pms10b::before,.svelte-pms10b::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-pms10b{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-pms10b{text-transform:none}button.svelte-pms10b{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-pms10b:-moz-focusring{outline:auto}.svelte-pms10b:-moz-ui-invalid{box-shadow:none}.svelte-pms10b::-webkit-inner-spin-button,.svelte-pms10b::-webkit-outer-spin-button{height:auto}.svelte-pms10b::-webkit-search-decoration{-webkit-appearance:none}.svelte-pms10b::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-pms10b{cursor:pointer}.svelte-pms10b:disabled{cursor:default}.svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-pms10b::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.relative.svelte-pms10b{position:relative}");
}

function create_fragment$8(ctx) {
	let td;
	let button;
	let t0;
	let t1;
	let t2;
	let dot;
	let t3;
	let sticker_1;
	let current;
	let mounted;
	let dispose;

	dot = new Dot({
			props: {
				isFilled: !!/*file*/ ctx[3],
				isActive: !!/*file*/ ctx[3]
			}
		});

	sticker_1 = new Sticker({ props: { sticker: /*sticker*/ ctx[2] } });

	return {
		c() {
			td = element("td");
			button = element("button");
			t0 = text("Q");
			t1 = text(/*quarterNum*/ ctx[0]);
			t2 = space();
			create_component(dot.$$.fragment);
			t3 = space();
			create_component(sticker_1.$$.fragment);
			attr(button, "id", "period-num");
			attr(button, "class", "svelte-pms10b");
			attr(td, "class", "relative svelte-pms10b");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t0);
			append(button, t1);
			append(button, t2);
			mount_component(dot, button, null);
			append(td, t3);
			mount_component(sticker_1, td, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[11]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[12]),
					listen(button, "pointerenter", /*pointerenter_handler*/ ctx[13])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*quarterNum*/ 1) set_data(t1, /*quarterNum*/ ctx[0]);
			const dot_changes = {};
			if (dirty & /*file*/ 8) dot_changes.isFilled = !!/*file*/ ctx[3];
			if (dirty & /*file*/ 8) dot_changes.isActive = !!/*file*/ ctx[3];
			dot.$set(dot_changes);
			const sticker_1_changes = {};
			if (dirty & /*sticker*/ 4) sticker_1_changes.sticker = /*sticker*/ ctx[2];
			sticker_1.$set(sticker_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(dot.$$.fragment, local);
			transition_in(sticker_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dot.$$.fragment, local);
			transition_out(sticker_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(dot);
			destroy_component(sticker_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$8($$self, $$props, $$invalidate) {
	let date;
	let dateUID;
	let file;
	let sticker;
	let $notesStore;
	let $displayedDateStore;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(10, $displayedDateStore = $$value));
	var _a, _b;
	let { quarterNum } = $$props;
	const { eventHandlers } = getContext(VIEW);
	const notesStore = notesStores['quarter'];
	component_subscribe($$self, notesStore, value => $$invalidate(9, $notesStore = value));

	const click_handler = event => eventHandlers.onClick({
		date,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'quarter'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({ date, event, granularity: 'quarter' });

	const pointerenter_handler = event => eventHandlers.onHover({
		date,
		targetEl: event.target,
		isControlPressed: isControlPressed(event),
		granularity: 'quarter'
	});

	$$self.$$set = $$props => {
		if ('quarterNum' in $$props) $$invalidate(0, quarterNum = $$props.quarterNum);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore, quarterNum*/ 1025) {
			$$invalidate(1, date = $displayedDateStore.clone().quarter(quarterNum).startOf('quarter'));
		}

		if ($$self.$$.dirty & /*date*/ 2) {
			$$invalidate(8, dateUID = getDateUID({ date, granularity: 'quarter' }));
		}

		if ($$self.$$.dirty & /*$notesStore, dateUID, _a*/ 832) {
			$$invalidate(3, file = $$invalidate(6, _a = $notesStore[dateUID]) === null || _a === void 0
			? void 0
			: _a.file);
		}

		if ($$self.$$.dirty & /*$notesStore, dateUID, _b*/ 896) {
			$$invalidate(2, sticker = $$invalidate(7, _b = $notesStore[dateUID]) === null || _b === void 0
			? void 0
			: _b.sticker);
		}
	};

	return [
		quarterNum,
		date,
		sticker,
		file,
		eventHandlers,
		notesStore,
		_a,
		_b,
		dateUID,
		$notesStore,
		$displayedDateStore,
		click_handler,
		contextmenu_handler,
		pointerenter_handler
	];
}

class QuarterNum extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$8, create_fragment$8, not_equal, { quarterNum: 0 }, add_css$8);
	}
}

/* src/ui/components/WeekNum.svelte generated by Svelte v4.2.19 */

function add_css$7(target) {
	append_styles(target, "svelte-1uu720e", ".svelte-1uu720e,.svelte-1uu720e::before,.svelte-1uu720e::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-1uu720e::before,.svelte-1uu720e::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-1uu720e{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-1uu720e{text-transform:none}button.svelte-1uu720e{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-1uu720e:-moz-focusring{outline:auto}.svelte-1uu720e:-moz-ui-invalid{box-shadow:none}.svelte-1uu720e::-webkit-inner-spin-button,.svelte-1uu720e::-webkit-outer-spin-button{height:auto}.svelte-1uu720e::-webkit-search-decoration{-webkit-appearance:none}.svelte-1uu720e::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-1uu720e{cursor:pointer}.svelte-1uu720e:disabled{cursor:default}.svelte-1uu720e,.svelte-1uu720e::before,.svelte-1uu720e::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-1uu720e::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.relative.svelte-1uu720e{position:relative}td.svelte-1uu720e{border-right:1px solid var(--background-modifier-border)}");
}

function create_fragment$7(ctx) {
	let td;
	let button;
	let t0;
	let t1;
	let dot;
	let t2;
	let sticker_1;
	let current;
	let mounted;
	let dispose;

	dot = new Dot({
			props: {
				isFilled: !!/*file*/ ctx[3],
				isActive: !!/*file*/ ctx[3]
			}
		});

	sticker_1 = new Sticker({ props: { sticker: /*sticker*/ ctx[2] } });

	return {
		c() {
			td = element("td");
			button = element("button");
			t0 = text(/*weekNum*/ ctx[0]);
			t1 = space();
			create_component(dot.$$.fragment);
			t2 = space();
			create_component(sticker_1.$$.fragment);
			attr(button, "id", "period-num");
			attr(button, "class", "svelte-1uu720e");
			attr(td, "class", "relative svelte-1uu720e");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t0);
			append(button, t1);
			mount_component(dot, button, null);
			append(td, t2);
			mount_component(sticker_1, td, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[9]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[10]),
					listen(button, "pointerenter", /*pointerenter_handler*/ ctx[11])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*weekNum*/ 1) set_data(t0, /*weekNum*/ ctx[0]);
			const dot_changes = {};
			if (dirty & /*file*/ 8) dot_changes.isFilled = !!/*file*/ ctx[3];
			if (dirty & /*file*/ 8) dot_changes.isActive = !!/*file*/ ctx[3];
			dot.$set(dot_changes);
			const sticker_1_changes = {};
			if (dirty & /*sticker*/ 4) sticker_1_changes.sticker = /*sticker*/ ctx[2];
			sticker_1.$set(sticker_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(dot.$$.fragment, local);
			transition_in(sticker_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dot.$$.fragment, local);
			transition_out(sticker_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(dot);
			destroy_component(sticker_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$7($$self, $$props, $$invalidate) {
	let file;
	let sticker;
	let $notesStore;
	var _a, _b;
	let { weekNum } = $$props;
	let { startOfWeekDate } = $$props;
	const { eventHandlers } = getContext(VIEW);
	const notesStore = notesStores['week'];
	component_subscribe($$self, notesStore, value => $$invalidate(8, $notesStore = value));

	const dateUID = getDateUID({
		date: startOfWeekDate,
		granularity: 'week'
	});

	const click_handler = event => eventHandlers.onClick({
		date: startOfWeekDate,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'week'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({
		date: startOfWeekDate,
		event,
		granularity: 'week'
	});

	const pointerenter_handler = event => {
		eventHandlers.onHover({
			date: startOfWeekDate,
			targetEl: event.target,
			isControlPressed: isControlPressed(event),
			granularity: 'week'
		});
	};

	$$self.$$set = $$props => {
		if ('weekNum' in $$props) $$invalidate(0, weekNum = $$props.weekNum);
		if ('startOfWeekDate' in $$props) $$invalidate(1, startOfWeekDate = $$props.startOfWeekDate);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$notesStore, _a*/ 320) {
			$$invalidate(3, file = $$invalidate(6, _a = $notesStore[dateUID]) === null || _a === void 0
			? void 0
			: _a.file);
		}

		if ($$self.$$.dirty & /*$notesStore, _b*/ 384) {
			$$invalidate(2, sticker = $$invalidate(7, _b = $notesStore[dateUID]) === null || _b === void 0
			? void 0
			: _b.sticker);
		}
	};

	return [
		weekNum,
		startOfWeekDate,
		sticker,
		file,
		eventHandlers,
		notesStore,
		_a,
		_b,
		$notesStore,
		click_handler,
		contextmenu_handler,
		pointerenter_handler
	];
}

class WeekNum extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$7, create_fragment$7, not_equal, { weekNum: 0, startOfWeekDate: 1 }, add_css$7);
	}
}

/* src/ui/components/Year.svelte generated by Svelte v4.2.19 */

function add_css$6(target) {
	append_styles(target, "svelte-pms10b", ".svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-pms10b::before,.svelte-pms10b::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-pms10b{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-pms10b{text-transform:none}button.svelte-pms10b{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-pms10b:-moz-focusring{outline:auto}.svelte-pms10b:-moz-ui-invalid{box-shadow:none}.svelte-pms10b::-webkit-inner-spin-button,.svelte-pms10b::-webkit-outer-spin-button{height:auto}.svelte-pms10b::-webkit-search-decoration{-webkit-appearance:none}.svelte-pms10b::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-pms10b{cursor:pointer}.svelte-pms10b:disabled{cursor:default}.svelte-pms10b,.svelte-pms10b::before,.svelte-pms10b::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-pms10b::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.relative.svelte-pms10b{position:relative}");
}

function create_fragment$6(ctx) {
	let td;
	let button;
	let t0;
	let t1;
	let dot;
	let t2;
	let sticker_1;
	let current;
	let mounted;
	let dispose;

	dot = new Dot({
			props: {
				isFilled: !!/*file*/ ctx[3],
				isActive: !!/*file*/ ctx[3]
			}
		});

	sticker_1 = new Sticker({ props: { sticker: /*sticker*/ ctx[2] } });

	return {
		c() {
			td = element("td");
			button = element("button");
			t0 = text(/*year*/ ctx[0]);
			t1 = space();
			create_component(dot.$$.fragment);
			t2 = space();
			create_component(sticker_1.$$.fragment);
			attr(button, "id", "year");
			attr(button, "class", "svelte-pms10b");
			attr(td, "class", "relative svelte-pms10b");
		},
		m(target, anchor) {
			insert(target, td, anchor);
			append(td, button);
			append(button, t0);
			append(button, t1);
			mount_component(dot, button, null);
			append(td, t2);
			mount_component(sticker_1, td, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button, "click", /*click_handler*/ ctx[11]),
					listen(button, "contextmenu", /*contextmenu_handler*/ ctx[12]),
					listen(button, "pointerenter", /*pointerenter_handler*/ ctx[13])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (!current || dirty & /*year*/ 1) set_data(t0, /*year*/ ctx[0]);
			const dot_changes = {};
			if (dirty & /*file*/ 8) dot_changes.isFilled = !!/*file*/ ctx[3];
			if (dirty & /*file*/ 8) dot_changes.isActive = !!/*file*/ ctx[3];
			dot.$set(dot_changes);
			const sticker_1_changes = {};
			if (dirty & /*sticker*/ 4) sticker_1_changes.sticker = /*sticker*/ ctx[2];
			sticker_1.$set(sticker_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(dot.$$.fragment, local);
			transition_in(sticker_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(dot.$$.fragment, local);
			transition_out(sticker_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(td);
			}

			destroy_component(dot);
			destroy_component(sticker_1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$6($$self, $$props, $$invalidate) {
	let date;
	let dateUID;
	let file;
	let sticker;
	let $notesStore;
	let $displayedDateStore;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(10, $displayedDateStore = $$value));
	var _a, _b;
	let { year } = $$props;
	const { eventHandlers } = getContext(VIEW);
	const notesStore = notesStores['year'];
	component_subscribe($$self, notesStore, value => $$invalidate(9, $notesStore = value));

	const click_handler = event => eventHandlers.onClick({
		date,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'year'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({ date, event, granularity: 'year' });

	const pointerenter_handler = event => {
		eventHandlers.onHover({
			date,
			targetEl: event.target,
			isControlPressed: isControlPressed(event),
			granularity: 'year'
		});
	};

	$$self.$$set = $$props => {
		if ('year' in $$props) $$invalidate(0, year = $$props.year);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore, year*/ 1025) {
			$$invalidate(1, date = $displayedDateStore.clone().year(year).startOf('year'));
		}

		if ($$self.$$.dirty & /*date*/ 2) {
			$$invalidate(8, dateUID = getDateUID({ date, granularity: 'year' }));
		}

		if ($$self.$$.dirty & /*$notesStore, dateUID, _a*/ 832) {
			$$invalidate(3, file = $$invalidate(6, _a = $notesStore[dateUID]) === null || _a === void 0
			? void 0
			: _a.file);
		}

		if ($$self.$$.dirty & /*$notesStore, dateUID, _b*/ 896) {
			$$invalidate(2, sticker = $$invalidate(7, _b = $notesStore[dateUID]) === null || _b === void 0
			? void 0
			: _b.sticker);
		}
	};

	return [
		year,
		date,
		sticker,
		file,
		eventHandlers,
		notesStore,
		_a,
		_b,
		dateUID,
		$notesStore,
		$displayedDateStore,
		click_handler,
		contextmenu_handler,
		pointerenter_handler
	];
}

class Year extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$6, create_fragment$6, not_equal, { year: 0 }, add_css$6);
	}
}

/* src/ui/components/YearNav.svelte generated by Svelte v4.2.19 */

function add_css$5(target) {
	append_styles(target, "svelte-47i02w", ".svelte-47i02w.svelte-47i02w.svelte-47i02w,.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{text-transform:none}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w:-moz-focusring{outline:auto}.svelte-47i02w.svelte-47i02w.svelte-47i02w:-moz-ui-invalid{box-shadow:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-inner-spin-button,.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-outer-spin-button{height:auto}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-search-decoration{-webkit-appearance:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{cursor:pointer}.svelte-47i02w.svelte-47i02w.svelte-47i02w:disabled{cursor:default}.svelte-47i02w.svelte-47i02w.svelte-47i02w,.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-47i02w.svelte-47i02w.svelte-47i02w::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.-ml-1.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-left:-0.25rem}.mt-2\\.5.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-top:0.625rem}.flex.svelte-47i02w.svelte-47i02w.svelte-47i02w{display:flex}.h-auto.svelte-47i02w.svelte-47i02w.svelte-47i02w{height:auto}.flex-col.svelte-47i02w.svelte-47i02w.svelte-47i02w{flex-direction:column}.items-end.svelte-47i02w.svelte-47i02w.svelte-47i02w{align-items:flex-end}.items-center.svelte-47i02w.svelte-47i02w.svelte-47i02w{align-items:center}.justify-between.svelte-47i02w.svelte-47i02w.svelte-47i02w{justify-content:space-between}.space-y-1.svelte-47i02w>.svelte-47i02w:not([hidden])~.svelte-47i02w:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.25rem * var(--tw-space-y-reverse))}.p-2.svelte-47i02w.svelte-47i02w.svelte-47i02w{padding:0.5rem}.px-2.svelte-47i02w.svelte-47i02w.svelte-47i02w{padding-left:0.5rem;padding-right:0.5rem}.text-7xl.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-size:4.5rem;line-height:1}.font-medium.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-weight:500}.font-semibold.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-weight:600}.text-\\[--color-arrow\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--color-arrow)}.text-\\[--color-text-title\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--color-text-title)}.text-\\[--interactive-accent\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--interactive-accent)}.opacity-100.svelte-47i02w.svelte-47i02w.svelte-47i02w{opacity:1}.opacity-60.svelte-47i02w.svelte-47i02w.svelte-47i02w{opacity:0.6}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{background-color:transparent}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-47i02w.svelte-47i02w.svelte-47i02w:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

function create_fragment$5(ctx) {
	let div2;
	let div0;
	let button0;
	let t0_value = /*$displayedDateStore*/ ctx[0].format('YYYY') + "";
	let t0;
	let t1;
	let button1;
	let t2_value = /*$yearsRanges*/ ctx[2].ranges[/*$yearsRanges*/ ctx[2].crrRangeIndex] + "";
	let t2;
	let t3;
	let div1;
	let arrow0;
	let t4;
	let button2;
	let dot;
	let button2_class_value;
	let button2_aria_label_value;
	let t5;
	let arrow1;
	let current;
	let mounted;
	let dispose;

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementdisplayedDate*/ ctx[4],
				tooltip: "Previous Year"
			}
		});

	dot = new Dot({
			props: {
				className: "h-[8px] w-[8px]",
				isFilled: /*showingCurrentYear*/ ctx[1]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementdisplayedDate*/ ctx[5],
				tooltip: "Next Year"
			}
		});

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			button0 = element("button");
			t0 = text(t0_value);
			t1 = space();
			button1 = element("button");
			t2 = text(t2_value);
			t3 = space();
			div1 = element("div");
			create_component(arrow0.$$.fragment);
			t4 = space();
			button2 = element("button");
			create_component(dot.$$.fragment);
			t5 = space();
			create_component(arrow1.$$.fragment);
			attr(button0, "class", "h-auto text-7xl [&:not(:focus-visible)]:shadow-none font-semibold svelte-47i02w");
			attr(button0, "id", "year");
			attr(button1, "class", "[&:not(:focus-visible)]:shadow-none text-[--interactive-accent] font-medium opacity-60 svelte-47i02w");
			attr(button1, "id", "years-range");
			attr(div0, "class", "flex justify-between items-end text-[--color-text-title] svelte-47i02w");
			attr(div0, "id", "title");

			attr(button2, "class", button2_class_value = "[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 " + (/*showingCurrentYear*/ ctx[1]
			? 'opacity-100'
			: 'opacity-60 ') + " svelte-47i02w");

			attr(button2, "id", "reset-button");

			attr(button2, "aria-label", button2_aria_label_value = !/*showingCurrentYear*/ ctx[1]
			? 'Reset to current year'
			: null);

			attr(div1, "class", "flex items-center -ml-1 svelte-47i02w");
			attr(div1, "id", "bottom-nav");
			attr(div2, "class", "flex flex-col space-y-1 mt-2.5 px-2 svelte-47i02w");
			attr(div2, "id", "nav");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, button0);
			append(button0, t0);
			append(div0, t1);
			append(div0, button1);
			append(button1, t2);
			append(div2, t3);
			append(div2, div1);
			mount_component(arrow0, div1, null);
			append(div1, t4);
			append(div1, button2);
			mount_component(dot, button2, null);
			append(div1, t5);
			mount_component(arrow1, div1, null);
			current = true;

			if (!mounted) {
				dispose = [
					listen(button0, "click", /*click_handler*/ ctx[8]),
					listen(button0, "contextmenu", /*contextmenu_handler*/ ctx[9]),
					listen(button0, "pointerenter", /*pointerenter_handler*/ ctx[10]),
					listen(button2, "click", /*resetdisplayedDate*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*$displayedDateStore*/ 1) && t0_value !== (t0_value = /*$displayedDateStore*/ ctx[0].format('YYYY') + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*$yearsRanges*/ 4) && t2_value !== (t2_value = /*$yearsRanges*/ ctx[2].ranges[/*$yearsRanges*/ ctx[2].crrRangeIndex] + "")) set_data(t2, t2_value);
			const dot_changes = {};
			if (dirty & /*showingCurrentYear*/ 2) dot_changes.isFilled = /*showingCurrentYear*/ ctx[1];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentYear*/ 2 && button2_class_value !== (button2_class_value = "[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 " + (/*showingCurrentYear*/ ctx[1]
			? 'opacity-100'
			: 'opacity-60 ') + " svelte-47i02w")) {
				attr(button2, "class", button2_class_value);
			}

			if (!current || dirty & /*showingCurrentYear*/ 2 && button2_aria_label_value !== (button2_aria_label_value = !/*showingCurrentYear*/ ctx[1]
			? 'Reset to current year'
			: null)) {
				attr(button2, "aria-label", button2_aria_label_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$5($$self, $$props, $$invalidate) {
	let $displayedDateStore;
	let $yearsRanges;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(0, $displayedDateStore = $$value));
	component_subscribe($$self, yearsRanges, $$value => $$invalidate(2, $yearsRanges = $$value));
	let today;
	const { eventHandlers } = getContext(VIEW);

	function decrementdisplayedDate() {
		displayedDateStore.update(date => date.clone().subtract(1, 'year'));
	}

	function incrementdisplayedDate() {
		displayedDateStore.update(date => date.clone().add(1, 'year'));
	}

	function resetdisplayedDate() {
		yearsRanges.update(values => Object.assign(Object.assign({}, values), {
			crrRangeIndex: values.ranges.findIndex(range => range === values.todayRange)
		}));

		displayedDateStore.set(today.clone());
	}

	let showingCurrentYear;

	const click_handler = event => eventHandlers.onClick({
		date: $displayedDateStore,
		createNewSplitLeaf: isControlPressed(event),
		granularity: 'year'
	});

	const contextmenu_handler = event => eventHandlers.onContextMenu({
		date: $displayedDateStore,
		event,
		granularity: 'year'
	});

	const pointerenter_handler = event => {
		eventHandlers.onHover({
			date: $displayedDateStore,
			targetEl: event.target,
			isControlPressed: isControlPressed(event),
			granularity: 'year'
		});
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore*/ 1) {
			($$invalidate(7, today = window.moment()));
		}

		if ($$self.$$.dirty & /*$displayedDateStore, today*/ 129) {
			((() => {
				$$invalidate(1, showingCurrentYear = $displayedDateStore.isSame(today, 'year'));

				// add new ranges or update existing ones every time displayed date changes
				yearsRanges.selectOrCreateRanges();
			})());
		}
	};

	return [
		$displayedDateStore,
		showingCurrentYear,
		$yearsRanges,
		eventHandlers,
		decrementdisplayedDate,
		incrementdisplayedDate,
		resetdisplayedDate,
		today,
		click_handler,
		contextmenu_handler,
		pointerenter_handler
	];
}

class YearNav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$5, create_fragment$5, safe_not_equal, {}, add_css$5);
	}
}

/* src/ui/components/YearsNav.svelte generated by Svelte v4.2.19 */

function add_css$4(target) {
	append_styles(target, "svelte-47i02w", ".svelte-47i02w.svelte-47i02w.svelte-47i02w,.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{text-transform:none}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w:-moz-focusring{outline:auto}.svelte-47i02w.svelte-47i02w.svelte-47i02w:-moz-ui-invalid{box-shadow:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-inner-spin-button,.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-outer-spin-button{height:auto}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-search-decoration{-webkit-appearance:none}.svelte-47i02w.svelte-47i02w.svelte-47i02w::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{cursor:pointer}.svelte-47i02w.svelte-47i02w.svelte-47i02w:disabled{cursor:default}.svelte-47i02w.svelte-47i02w.svelte-47i02w,.svelte-47i02w.svelte-47i02w.svelte-47i02w::before,.svelte-47i02w.svelte-47i02w.svelte-47i02w::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-47i02w.svelte-47i02w.svelte-47i02w::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.-ml-1.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-left:-0.25rem}.mb-1\\.5.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-bottom:0.375rem}.mt-3.svelte-47i02w.svelte-47i02w.svelte-47i02w{margin-top:0.75rem}.flex.svelte-47i02w.svelte-47i02w.svelte-47i02w{display:flex}.flex-col.svelte-47i02w.svelte-47i02w.svelte-47i02w{flex-direction:column}.items-center.svelte-47i02w.svelte-47i02w.svelte-47i02w{align-items:center}.space-y-1.svelte-47i02w>.svelte-47i02w:not([hidden])~.svelte-47i02w:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.25rem * var(--tw-space-y-reverse))}.p-2.svelte-47i02w.svelte-47i02w.svelte-47i02w{padding:0.5rem}.px-2.svelte-47i02w.svelte-47i02w.svelte-47i02w{padding-left:0.5rem;padding-right:0.5rem}.text-7xl.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-size:4.5rem;line-height:1}.font-semibold.svelte-47i02w.svelte-47i02w.svelte-47i02w{font-weight:600}.text-\\[--color-arrow\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--color-arrow)}.text-\\[--color-text-title\\].svelte-47i02w.svelte-47i02w.svelte-47i02w{color:var(--color-text-title)}.opacity-100.svelte-47i02w.svelte-47i02w.svelte-47i02w{opacity:1}.opacity-60.svelte-47i02w.svelte-47i02w.svelte-47i02w{opacity:0.6}button.svelte-47i02w.svelte-47i02w.svelte-47i02w{background-color:transparent}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-47i02w.svelte-47i02w.svelte-47i02w:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

function create_fragment$4(ctx) {
	let div2;
	let div0;
	let t0_value = /*crrRange*/ ctx[1][0] + "";
	let t0;
	let t1;
	let t2_value = /*crrRange*/ ctx[1][1].slice(2) + "";
	let t2;
	let t3;
	let div1;
	let arrow0;
	let t4;
	let button;
	let dot;
	let button_class_value;
	let button_aria_label_value;
	let t5;
	let arrow1;
	let current;
	let mounted;
	let dispose;

	arrow0 = new Arrow({
			props: {
				direction: "left",
				onClick: /*decrementdisplayedYearRange*/ ctx[2],
				tooltip: "Previous Range"
			}
		});

	dot = new Dot({
			props: {
				className: "h-[8px] w-[8px]",
				isFilled: /*showingCurrentRange*/ ctx[0]
			}
		});

	arrow1 = new Arrow({
			props: {
				direction: "right",
				onClick: /*incrementdisplayedDate*/ ctx[3],
				tooltip: "Next Range"
			}
		});

	return {
		c() {
			div2 = element("div");
			div0 = element("div");
			t0 = text(t0_value);
			t1 = text(" - ");
			t2 = text(t2_value);
			t3 = space();
			div1 = element("div");
			create_component(arrow0.$$.fragment);
			t4 = space();
			button = element("button");
			create_component(dot.$$.fragment);
			t5 = space();
			create_component(arrow1.$$.fragment);
			attr(div0, "class", "text-[--color-text-title] text-7xl [&:not(:focus-visible)]:shadow-none font-semibold svelte-47i02w");
			attr(div0, "id", "title");

			attr(button, "class", button_class_value = "[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 " + (/*showingCurrentRange*/ ctx[0]
			? 'opacity-100'
			: 'opacity-60 ') + " svelte-47i02w");

			attr(button, "id", "reset-button");
			attr(button, "aria-label", button_aria_label_value = !/*showingCurrentRange*/ ctx[0] ? 'Current Range' : null);
			attr(div1, "class", "flex items-center -ml-1 svelte-47i02w");
			attr(div1, "id", "bottom-nav");
			attr(div2, "class", "flex flex-col space-y-1 mt-3 mb-1.5 px-2 svelte-47i02w");
			attr(div2, "id", "nav");
		},
		m(target, anchor) {
			insert(target, div2, anchor);
			append(div2, div0);
			append(div0, t0);
			append(div0, t1);
			append(div0, t2);
			append(div2, t3);
			append(div2, div1);
			mount_component(arrow0, div1, null);
			append(div1, t4);
			append(div1, button);
			mount_component(dot, button, null);
			append(div1, t5);
			mount_component(arrow1, div1, null);
			current = true;

			if (!mounted) {
				dispose = listen(button, "click", /*resetdisplayedDate*/ ctx[4]);
				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if ((!current || dirty & /*crrRange*/ 2) && t0_value !== (t0_value = /*crrRange*/ ctx[1][0] + "")) set_data(t0, t0_value);
			if ((!current || dirty & /*crrRange*/ 2) && t2_value !== (t2_value = /*crrRange*/ ctx[1][1].slice(2) + "")) set_data(t2, t2_value);
			const dot_changes = {};
			if (dirty & /*showingCurrentRange*/ 1) dot_changes.isFilled = /*showingCurrentRange*/ ctx[0];
			dot.$set(dot_changes);

			if (!current || dirty & /*showingCurrentRange*/ 1 && button_class_value !== (button_class_value = "[&:not(:focus-visible)]:shadow-none text-[--color-arrow] flex items-center p-2 " + (/*showingCurrentRange*/ ctx[0]
			? 'opacity-100'
			: 'opacity-60 ') + " svelte-47i02w")) {
				attr(button, "class", button_class_value);
			}

			if (!current || dirty & /*showingCurrentRange*/ 1 && button_aria_label_value !== (button_aria_label_value = !/*showingCurrentRange*/ ctx[0] ? 'Current Range' : null)) {
				attr(button, "aria-label", button_aria_label_value);
			}
		},
		i(local) {
			if (current) return;
			transition_in(arrow0.$$.fragment, local);
			transition_in(dot.$$.fragment, local);
			transition_in(arrow1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(arrow0.$$.fragment, local);
			transition_out(dot.$$.fragment, local);
			transition_out(arrow1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div2);
			}

			destroy_component(arrow0);
			destroy_component(dot);
			destroy_component(arrow1);
			mounted = false;
			dispose();
		}
	};
}

function instance$4($$self, $$props, $$invalidate) {
	let crrRange;
	let $yearsRanges;
	let $displayedDateStore;
	component_subscribe($$self, yearsRanges, $$value => $$invalidate(5, $yearsRanges = $$value));
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(6, $displayedDateStore = $$value));
	const todayMoment = window.moment();

	function decrementdisplayedYearRange() {
		console.log('decrementdisplayedYearRange() > yearsRanges store: ', $yearsRanges);

		yearsRanges.updateRanges({
			action: 'decrement',
			displayedDateModifier: -YEARS_RANGE_SIZE
		});
	}

	function incrementdisplayedDate() {
		console.log('incrementedisplayedDate() > yearsRanges store: ', $yearsRanges);
		yearsRanges.updateRanges({ action: 'increment' });
	}

	function resetdisplayedDate() {
		yearsRanges.update(values => Object.assign(Object.assign({}, values), {
			crrRangeIndex: values.ranges.findIndex(range => range === values.todayRange)
		}));

		displayedDateStore.set(todayMoment.clone());
	}

	let showingCurrentRange;

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*$displayedDateStore, $yearsRanges*/ 96) {
			((() => {
				$$invalidate(0, showingCurrentRange = $yearsRanges.todayRange === $yearsRanges.ranges[$yearsRanges.crrRangeIndex]);

				// add new ranges or update existing ones every time displayed date changes
				yearsRanges.selectOrCreateRanges();
			})());
		}

		if ($$self.$$.dirty & /*$yearsRanges*/ 32) {
			$$invalidate(1, crrRange = $yearsRanges.ranges[$yearsRanges.crrRangeIndex].split('-'));
		}
	};

	return [
		showingCurrentRange,
		crrRange,
		decrementdisplayedYearRange,
		incrementdisplayedDate,
		resetdisplayedDate,
		$yearsRanges,
		$displayedDateStore
	];
}

class YearsNav extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$4, create_fragment$4, safe_not_equal, {}, add_css$4);
	}
}

/* src/ui/components/Calendar.svelte generated by Svelte v4.2.19 */

function add_css$3(target) {
	append_styles(target, "svelte-1x11e4z", ".svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z,.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::before,.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::before,.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}table.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{text-indent:0;border-color:inherit;border-collapse:collapse}button.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-family:inherit;font-feature-settings:inherit;font-variation-settings:inherit;font-size:100%;font-weight:inherit;line-height:inherit;letter-spacing:inherit;color:inherit;margin:0;padding:0}button.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{text-transform:none}button.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{-webkit-appearance:button;background-color:transparent;background-image:none}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:-moz-focusring{outline:auto}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:-moz-ui-invalid{box-shadow:none}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::-webkit-inner-spin-button,.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::-webkit-outer-spin-button{height:auto}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::-webkit-search-decoration{-webkit-appearance:none}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}button.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{cursor:pointer}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:disabled{cursor:default}.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z,.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::before,.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:100%}@media(min-width: 640px){.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{max-width:640px}}@media(min-width: 768px){.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{max-width:768px}}@media(min-width: 1024px){.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{max-width:1024px}}@media(min-width: 1280px){.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{max-width:1280px}}@media(min-width: 1536px){.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{max-width:1536px}}.pointer-events-none.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{pointer-events:none}.collapse.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{visibility:collapse}.static.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{position:static}.absolute.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{position:absolute}.relative.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{position:relative}.bottom-1.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{bottom:0.25rem}.left-0.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{left:0px}.left-full.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{left:100%}.top-0.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{top:0px}.z-10.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{z-index:10}.z-20.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{z-index:20}.m-0.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin:0px}.-ml-1.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-left:-0.25rem}.mb-1\\.5.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-bottom:0.375rem}.ml-\\[5px\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-left:5px}.ml-auto.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-left:auto}.mt-2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-top:0.5rem}.mt-2\\.5.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-top:0.625rem}.mt-3.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-top:0.75rem}.mt-7.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{margin-top:1.75rem}.block.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{display:block}.flex.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{display:flex}.table.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{display:table}.contents.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{display:contents}.\\!h-4.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{height:1rem !important}.\\!h-auto.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{height:auto !important}.h-2\\.5.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{height:0.625rem}.h-\\[8px\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{height:8px}.h-auto.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{height:auto}.\\!w-4.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:1rem !important}.\\!w-6.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:1.5rem !important}.\\!w-8.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:2rem !important}.w-2\\.5.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:0.625rem}.w-\\[8px\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:8px}.w-full.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:100%}.w-max.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{width:-moz-max-content;width:max-content}.max-w-xs.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{max-width:20rem}.flex-grow.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{flex-grow:1}.border-collapse.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{border-collapse:collapse}.-translate-x-1\\/2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-translate-x:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-translate-y-1\\/2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-translate-y:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-12.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-rotate:12deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-180.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-rotate:180deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-45.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-rotate:45deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.cursor-not-allowed.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{cursor:not-allowed}.cursor-pointer.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{cursor:pointer}.flex-col.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{flex-direction:column}.items-end.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{align-items:flex-end}.items-center.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{align-items:center}.justify-between.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{justify-content:space-between}.space-x-1.svelte-1x11e4z>.svelte-1x11e4z:not([hidden])~.svelte-1x11e4z:not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.25rem * var(--tw-space-x-reverse));margin-left:calc(0.25rem * calc(1 - var(--tw-space-x-reverse)))}.rounded-\\[--radius-s\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{border-radius:var(--radius-s)}.rounded-\\[--tab-curve\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{border-radius:var(--tab-curve)}.rounded-sm.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{border-radius:0.125rem}.border-0.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{border-width:0px}.bg-\\[--background-modifier-hover\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{background-color:var(--background-modifier-hover)}.bg-\\[--interactive-accent\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{background-color:var(--interactive-accent)}.bg-slate-500.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-bg-opacity:1;background-color:rgb(100 116 139 / var(--tw-bg-opacity))}.bg-transparent.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{background-color:transparent}.p-1.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding:0.25rem}.p-2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding:0.5rem}.px-1.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-left:0.25rem;padding-right:0.25rem}.px-2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-left:0.5rem;padding-right:0.5rem}.px-4.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-left:1rem;padding-right:1rem}.py-2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-top:0.5rem;padding-bottom:0.5rem}.py-3.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-top:0.75rem;padding-bottom:0.75rem}.\\!pt-2.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-top:0.5rem !important}.pt-4.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{padding-top:1rem}.text-center.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{text-align:center}.font-\\[\\'Inter\\'\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-family:'Inter'}.text-7xl.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-size:4.5rem;line-height:1}.text-lg.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-size:1.125rem;line-height:1.75rem}.text-sm.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-size:0.875rem;line-height:1.25rem}.text-xs.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-size:0.75rem;line-height:1rem}.font-medium.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-weight:500}.font-semibold.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{font-weight:600}.uppercase.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{text-transform:uppercase}.capitalize.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{text-transform:capitalize}.tabular-nums.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.text-\\[--color-arrow\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--color-arrow)}.text-\\[--color-text-title\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--color-text-title)}.text-\\[--color-text-today\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--color-text-today)}.text-\\[--interactive-accent\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--interactive-accent)}.text-\\[--tab-text-color\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--tab-text-color)}.text-\\[--text-muted\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--text-muted)}.text-\\[--text-normal\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--text-normal)}.text-\\[--text-on-accent\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{color:var(--text-on-accent)}.opacity-0.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{opacity:0}.opacity-100.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{opacity:1}.opacity-50.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{opacity:0.5}.opacity-60.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{opacity:0.6}.shadow.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.blur.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--tw-blur:blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.transition-colors.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.container.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{--color-background-heading:transparent;--color-background-day:transparent;--color-background-weeknum:transparent;--color-background-weekend:transparent;--color-dot:var(--text-muted);--color-arrow:var(--text-muted);--color-button:var(--text-muted);--color-text-title:var(--text-normal);--color-text-heading:var(--text-muted);--color-text-day:var(--text-normal);--color-text-today:var(--interactive-accent);--color-text-weeknum:var(--text-muted)}.weekend.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{background-color:var(--color-background-weekend)}.calendar.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{border-collapse:collapse;width:100%;min-width:100%}th.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z{background-color:var(--color-background-heading);color:var(--color-text-heading);font-size:0.6em;letter-spacing:1px;padding:4px;text-align:center;text-transform:uppercase}.hover\\:cursor-pointer.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:hover{cursor:pointer}.hover\\:bg-\\[--interactive-accent-hover\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:hover{background-color:var(--interactive-accent-hover)}.hover\\:bg-\\[--interactive-hover\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:hover{background-color:var(--interactive-hover)}.hover\\:text-\\[--text-on-accent\\].svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:hover{color:var(--text-on-accent)}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-1x11e4z.svelte-1x11e4z.svelte-1x11e4z:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

function get_each_context$1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[10] = list[i];
	return child_ctx;
}

function get_each_context_1(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[13] = list[i];
	return child_ctx;
}

function get_each_context_2(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[16] = list[i];
	child_ctx[18] = i;
	return child_ctx;
}

function get_each_context_3(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[19] = list[i];
	return child_ctx;
}

function get_each_context_4(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[22] = list[i];
	return child_ctx;
}

function get_each_context_5(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[25] = list[i];
	return child_ctx;
}

function get_each_context_6(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[28] = list[i];
	return child_ctx;
}

function get_each_context_7(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[31] = list[i];
	return child_ctx;
}

function get_each_context_8(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[34] = list[i];
	return child_ctx;
}

// (28:2) {#each togglePeriods as period}
function create_each_block_8(ctx) {
	let button;
	let t_value = capitalize(/*period*/ ctx[34]) + "";
	let t;
	let button_class_value;
	let mounted;
	let dispose;

	function click_handler() {
		return /*click_handler*/ ctx[9](/*period*/ ctx[34]);
	}

	return {
		c() {
			button = element("button");
			t = text(t_value);

			attr(button, "class", button_class_value = "" + (null_to_empty(clsx('[&:not(:focus-visible)]:shadow-none w-full rounded-[--radius-s] py-2 transition', /*crrView*/ ctx[0] === /*period*/ ctx[34]
			? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
			: 'text-[--tab-text-color] hover:text-[--text-on-accent]')) + " svelte-1x11e4z"));

			attr(button, "id", "period");
		},
		m(target, anchor) {
			insert(target, button, anchor);
			append(button, t);

			if (!mounted) {
				dispose = listen(button, "click", click_handler);
				mounted = true;
			}
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (dirty[0] & /*crrView*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(clsx('[&:not(:focus-visible)]:shadow-none w-full rounded-[--radius-s] py-2 transition', /*crrView*/ ctx[0] === /*period*/ ctx[34]
			? 'text-[--text-on-accent] bg-[--interactive-accent] hover:bg-[--interactive-accent-hover]'
			: 'text-[--tab-text-color] hover:text-[--text-on-accent]')) + " svelte-1x11e4z"))) {
				attr(button, "class", button_class_value);
			}
		},
		d(detaching) {
			if (detaching) {
				detach(button);
			}

			mounted = false;
			dispose();
		}
	};
}

// (41:1) {#if crrView === 'days'}
function create_if_block_3(ctx) {
	let monthnav;
	let t0;
	let table;
	let colgroup;
	let t1;
	let t2;
	let thead;
	let tr;
	let t3;
	let t4;
	let tbody;
	let each_blocks = [];
	let each2_lookup = new Map();
	let current;
	monthnav = new MonthNav({});
	let if_block0 = /*showWeekNums*/ ctx[4] && create_if_block_6();
	let each_value_7 = ensure_array_like(/*month*/ ctx[1][1].days);
	let each_blocks_2 = [];

	for (let i = 0; i < each_value_7.length; i += 1) {
		each_blocks_2[i] = create_each_block_7(get_each_context_7(ctx, each_value_7, i));
	}

	let if_block1 = /*showWeekNums*/ ctx[4] && create_if_block_5();
	let each_value_6 = ensure_array_like(/*weekdaysShort*/ ctx[2]);
	let each_blocks_1 = [];

	for (let i = 0; i < each_value_6.length; i += 1) {
		each_blocks_1[i] = create_each_block_6(get_each_context_6(ctx, each_value_6, i));
	}

	let each_value_4 = ensure_array_like(/*month*/ ctx[1]);
	const get_key = ctx => /*week*/ ctx[22].weekNum;

	for (let i = 0; i < each_value_4.length; i += 1) {
		let child_ctx = get_each_context_4(ctx, each_value_4, i);
		let key = get_key(child_ctx);
		each2_lookup.set(key, each_blocks[i] = create_each_block_4(key, child_ctx));
	}

	return {
		c() {
			create_component(monthnav.$$.fragment);
			t0 = space();
			table = element("table");
			colgroup = element("colgroup");
			if (if_block0) if_block0.c();
			t1 = space();

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				each_blocks_2[i].c();
			}

			t2 = space();
			thead = element("thead");
			tr = element("tr");
			if (if_block1) if_block1.c();
			t3 = space();

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				each_blocks_1[i].c();
			}

			t4 = space();
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(colgroup, "class", "svelte-1x11e4z");
			attr(tr, "class", "svelte-1x11e4z");
			attr(thead, "class", "svelte-1x11e4z");
			attr(tbody, "class", "svelte-1x11e4z");
			attr(table, "class", "calendar svelte-1x11e4z");
			attr(table, "id", "calendar");
		},
		m(target, anchor) {
			mount_component(monthnav, target, anchor);
			insert(target, t0, anchor);
			insert(target, table, anchor);
			append(table, colgroup);
			if (if_block0) if_block0.m(colgroup, null);
			append(colgroup, t1);

			for (let i = 0; i < each_blocks_2.length; i += 1) {
				if (each_blocks_2[i]) {
					each_blocks_2[i].m(colgroup, null);
				}
			}

			append(table, t2);
			append(table, thead);
			append(thead, tr);
			if (if_block1) if_block1.m(tr, null);
			append(tr, t3);

			for (let i = 0; i < each_blocks_1.length; i += 1) {
				if (each_blocks_1[i]) {
					each_blocks_1[i].m(tr, null);
				}
			}

			append(table, t4);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (/*showWeekNums*/ ctx[4]) {
				if (if_block0) ; else {
					if_block0 = create_if_block_6();
					if_block0.c();
					if_block0.m(colgroup, t1);
				}
			} else if (if_block0) {
				if_block0.d(1);
				if_block0 = null;
			}

			if (dirty[0] & /*month*/ 2) {
				each_value_7 = ensure_array_like(/*month*/ ctx[1][1].days);
				let i;

				for (i = 0; i < each_value_7.length; i += 1) {
					const child_ctx = get_each_context_7(ctx, each_value_7, i);

					if (each_blocks_2[i]) {
						each_blocks_2[i].p(child_ctx, dirty);
					} else {
						each_blocks_2[i] = create_each_block_7(child_ctx);
						each_blocks_2[i].c();
						each_blocks_2[i].m(colgroup, null);
					}
				}

				for (; i < each_blocks_2.length; i += 1) {
					each_blocks_2[i].d(1);
				}

				each_blocks_2.length = each_value_7.length;
			}

			if (/*showWeekNums*/ ctx[4]) {
				if (if_block1) ; else {
					if_block1 = create_if_block_5();
					if_block1.c();
					if_block1.m(tr, t3);
				}
			} else if (if_block1) {
				if_block1.d(1);
				if_block1 = null;
			}

			if (dirty[0] & /*weekdaysShort*/ 4) {
				each_value_6 = ensure_array_like(/*weekdaysShort*/ ctx[2]);
				let i;

				for (i = 0; i < each_value_6.length; i += 1) {
					const child_ctx = get_each_context_6(ctx, each_value_6, i);

					if (each_blocks_1[i]) {
						each_blocks_1[i].p(child_ctx, dirty);
					} else {
						each_blocks_1[i] = create_each_block_6(child_ctx);
						each_blocks_1[i].c();
						each_blocks_1[i].m(tr, null);
					}
				}

				for (; i < each_blocks_1.length; i += 1) {
					each_blocks_1[i].d(1);
				}

				each_blocks_1.length = each_value_6.length;
			}

			if (dirty[0] & /*month, showWeekNums*/ 18) {
				each_value_4 = ensure_array_like(/*month*/ ctx[1]);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_4, each2_lookup, tbody, outro_and_destroy_block, create_each_block_4, null, get_each_context_4);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(monthnav.$$.fragment, local);

			for (let i = 0; i < each_value_4.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(monthnav.$$.fragment, local);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t0);
				detach(table);
			}

			destroy_component(monthnav, detaching);
			if (if_block0) if_block0.d();
			destroy_each(each_blocks_2, detaching);
			if (if_block1) if_block1.d();
			destroy_each(each_blocks_1, detaching);

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

// (45:4) {#if showWeekNums}
function create_if_block_6(ctx) {
	let col;

	return {
		c() {
			col = element("col");
			attr(col, "class", "svelte-1x11e4z");
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(col);
			}
		}
	};
}

// (48:4) {#each month[1].days as date}
function create_each_block_7(ctx) {
	let col;

	return {
		c() {
			col = element("col");
			attr(col, "class", "svelte-1x11e4z");
			toggle_class(col, "weekend", isWeekend(/*date*/ ctx[31]));
		},
		m(target, anchor) {
			insert(target, col, anchor);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*month*/ 2) {
				toggle_class(col, "weekend", isWeekend(/*date*/ ctx[31]));
			}
		},
		d(detaching) {
			if (detaching) {
				detach(col);
			}
		}
	};
}

// (54:5) {#if showWeekNums}
function create_if_block_5(ctx) {
	let th;

	return {
		c() {
			th = element("th");
			th.textContent = "W";
			attr(th, "class", "svelte-1x11e4z");
		},
		m(target, anchor) {
			insert(target, th, anchor);
		},
		d(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (57:5) {#each weekdaysShort as dayOfWeek}
function create_each_block_6(ctx) {
	let th;
	let t_value = /*dayOfWeek*/ ctx[28] + "";
	let t;

	return {
		c() {
			th = element("th");
			t = text(t_value);
			attr(th, "class", "svelte-1x11e4z");
		},
		m(target, anchor) {
			insert(target, th, anchor);
			append(th, t);
		},
		p(ctx, dirty) {
			if (dirty[0] & /*weekdaysShort*/ 4 && t_value !== (t_value = /*dayOfWeek*/ ctx[28] + "")) set_data(t, t_value);
		},
		d(detaching) {
			if (detaching) {
				detach(th);
			}
		}
	};
}

// (65:6) {#if showWeekNums}
function create_if_block_4(ctx) {
	let weeknum;
	let current;

	weeknum = new WeekNum({
			props: {
				weekNum: /*week*/ ctx[22].weekNum,
				startOfWeekDate: getStartOfWeek(/*week*/ ctx[22].days)
			}
		});

	return {
		c() {
			create_component(weeknum.$$.fragment);
		},
		m(target, anchor) {
			mount_component(weeknum, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const weeknum_changes = {};
			if (dirty[0] & /*month*/ 2) weeknum_changes.weekNum = /*week*/ ctx[22].weekNum;
			if (dirty[0] & /*month*/ 2) weeknum_changes.startOfWeekDate = getStartOfWeek(/*week*/ ctx[22].days);
			weeknum.$set(weeknum_changes);
		},
		i(local) {
			if (current) return;
			transition_in(weeknum.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(weeknum.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(weeknum, detaching);
		}
	};
}

// (70:6) {#each week.days as day (day.format())}
function create_each_block_5(key_1, ctx) {
	let first;
	let day_1;
	let current;
	day_1 = new Day({ props: { date: /*day*/ ctx[25] } });

	return {
		key: key_1,
		first: null,
		c() {
			first = empty();
			create_component(day_1.$$.fragment);
			this.first = first;
		},
		m(target, anchor) {
			insert(target, first, anchor);
			mount_component(day_1, target, anchor);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;
			const day_1_changes = {};
			if (dirty[0] & /*month*/ 2) day_1_changes.date = /*day*/ ctx[25];
			day_1.$set(day_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(day_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(day_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(first);
			}

			destroy_component(day_1, detaching);
		}
	};
}

// (63:4) {#each month as week (week.weekNum)}
function create_each_block_4(key_1, ctx) {
	let tr;
	let t0;
	let each_blocks = [];
	let each_1_lookup = new Map();
	let t1;
	let current;
	let if_block = /*showWeekNums*/ ctx[4] && create_if_block_4(ctx);
	let each_value_5 = ensure_array_like(/*week*/ ctx[22].days);
	const get_key = ctx => /*day*/ ctx[25].format();

	for (let i = 0; i < each_value_5.length; i += 1) {
		let child_ctx = get_each_context_5(ctx, each_value_5, i);
		let key = get_key(child_ctx);
		each_1_lookup.set(key, each_blocks[i] = create_each_block_5(key, child_ctx));
	}

	return {
		key: key_1,
		first: null,
		c() {
			tr = element("tr");
			if (if_block) if_block.c();
			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			attr(tr, "class", "svelte-1x11e4z");
			this.first = tr;
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			if (if_block) if_block.m(tr, null);
			append(tr, t0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tr, null);
				}
			}

			append(tr, t1);
			current = true;
		},
		p(new_ctx, dirty) {
			ctx = new_ctx;

			if (/*showWeekNums*/ ctx[4]) {
				if (if_block) {
					if_block.p(ctx, dirty);

					if (dirty[0] & /*showWeekNums*/ 16) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_4(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(tr, t0);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}

			if (dirty[0] & /*month*/ 2) {
				each_value_5 = ensure_array_like(/*week*/ ctx[22].days);
				group_outros();
				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_5, each_1_lookup, tr, outro_and_destroy_block, create_each_block_5, t1, get_each_context_5);
				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value_5.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(if_block);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			if (if_block) if_block.d();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].d();
			}
		}
	};
}

// (78:1) {#if crrView === 'months'}
function create_if_block_1$1(ctx) {
	let yearnav;
	let t;
	let table;
	let tbody;
	let current;
	yearnav = new YearNav({});
	let each_value_2 = ensure_array_like(monthsIndexesInQuarters);
	let each_blocks = [];

	for (let i = 0; i < each_value_2.length; i += 1) {
		each_blocks[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			create_component(yearnav.$$.fragment);
			t = space();
			table = element("table");
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(tbody, "class", "svelte-1x11e4z");
			attr(table, "class", "calendar svelte-1x11e4z");
			attr(table, "id", "calendar");
		},
		m(target, anchor) {
			mount_component(yearnav, target, anchor);
			insert(target, t, anchor);
			insert(target, table, anchor);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*showQuarterNums*/ 8) {
				each_value_2 = ensure_array_like(monthsIndexesInQuarters);
				let i;

				for (i = 0; i < each_value_2.length; i += 1) {
					const child_ctx = get_each_context_2(ctx, each_value_2, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_2(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();

				for (i = each_value_2.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(yearnav.$$.fragment, local);

			for (let i = 0; i < each_value_2.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(yearnav.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t);
				detach(table);
			}

			destroy_component(yearnav, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (84:6) {#if showQuarterNums}
function create_if_block_2(ctx) {
	let quarternum;
	let current;
	quarternum = new QuarterNum({ props: { quarterNum: /*i*/ ctx[18] + 1 } });

	return {
		c() {
			create_component(quarternum.$$.fragment);
		},
		m(target, anchor) {
			mount_component(quarternum, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(quarternum.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(quarternum.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(quarternum, detaching);
		}
	};
}

// (87:6) {#each quarterMonthsIndexes as monthIndex}
function create_each_block_3(ctx) {
	let month_1;
	let current;

	month_1 = new Month({
			props: { monthIndex: /*monthIndex*/ ctx[19] }
		});

	return {
		c() {
			create_component(month_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(month_1, target, anchor);
			current = true;
		},
		p: noop,
		i(local) {
			if (current) return;
			transition_in(month_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(month_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(month_1, detaching);
		}
	};
}

// (82:4) {#each monthsIndexesInQuarters as quarterMonthsIndexes, i}
function create_each_block_2(ctx) {
	let tr;
	let t0;
	let t1;
	let current;
	let if_block = /*showQuarterNums*/ ctx[3] && create_if_block_2(ctx);
	let each_value_3 = ensure_array_like(/*quarterMonthsIndexes*/ ctx[16]);
	let each_blocks = [];

	for (let i = 0; i < each_value_3.length; i += 1) {
		each_blocks[i] = create_each_block_3(get_each_context_3(ctx, each_value_3, i));
	}

	return {
		c() {
			tr = element("tr");
			if (if_block) if_block.c();
			t0 = space();

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t1 = space();
			attr(tr, "class", "svelte-1x11e4z");
		},
		m(target, anchor) {
			insert(target, tr, anchor);
			if (if_block) if_block.m(tr, null);
			append(tr, t0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tr, null);
				}
			}

			append(tr, t1);
			current = true;
		},
		p(ctx, dirty) {
			if (/*showQuarterNums*/ ctx[3]) {
				if (if_block) {
					if (dirty[0] & /*showQuarterNums*/ 8) {
						transition_in(if_block, 1);
					}
				} else {
					if_block = create_if_block_2(ctx);
					if_block.c();
					transition_in(if_block, 1);
					if_block.m(tr, t0);
				}
			} else if (if_block) {
				group_outros();

				transition_out(if_block, 1, 1, () => {
					if_block = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block);

			for (let i = 0; i < each_value_3.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(if_block);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			if (if_block) if_block.d();
			destroy_each(each_blocks, detaching);
		}
	};
}

// (95:1) {#if crrView === 'years'}
function create_if_block$2(ctx) {
	let yearsnav;
	let t;
	let table;
	let tbody;
	let current;
	yearsnav = new YearsNav({});

	let each_value = ensure_array_like(getYears({
		startRangeYear: +/*$yearsRanges*/ ctx[5].ranges[/*$yearsRanges*/ ctx[5].crrRangeIndex].split('-')[0]
	}));

	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			create_component(yearsnav.$$.fragment);
			t = space();
			table = element("table");
			tbody = element("tbody");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			attr(tbody, "class", "svelte-1x11e4z");
			attr(table, "class", "calendar svelte-1x11e4z");
			attr(table, "id", "calendar");
		},
		m(target, anchor) {
			mount_component(yearsnav, target, anchor);
			insert(target, t, anchor);
			insert(target, table, anchor);
			append(table, tbody);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tbody, null);
				}
			}

			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$yearsRanges*/ 32) {
				each_value = ensure_array_like(getYears({
					startRangeYear: +/*$yearsRanges*/ ctx[5].ranges[/*$yearsRanges*/ ctx[5].crrRangeIndex].split('-')[0]
				}));

				let i;

				for (i = 0; i < each_value.length; i += 1) {
					const child_ctx = get_each_context$1(ctx, each_value, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block$1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tbody, null);
					}
				}

				group_outros();

				for (i = each_value.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(yearsnav.$$.fragment, local);

			for (let i = 0; i < each_value.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			transition_out(yearsnav.$$.fragment, local);
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t);
				detach(table);
			}

			destroy_component(yearsnav, detaching);
			destroy_each(each_blocks, detaching);
		}
	};
}

// (101:6) {#each rowYearsRange as year}
function create_each_block_1(ctx) {
	let year_1;
	let current;
	year_1 = new Year({ props: { year: /*year*/ ctx[13] } });

	return {
		c() {
			create_component(year_1.$$.fragment);
		},
		m(target, anchor) {
			mount_component(year_1, target, anchor);
			current = true;
		},
		p(ctx, dirty) {
			const year_1_changes = {};
			if (dirty[0] & /*$yearsRanges*/ 32) year_1_changes.year = /*year*/ ctx[13];
			year_1.$set(year_1_changes);
		},
		i(local) {
			if (current) return;
			transition_in(year_1.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(year_1.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(year_1, detaching);
		}
	};
}

// (99:4) {#each getYears( { startRangeYear: +$yearsRanges.ranges[$yearsRanges.crrRangeIndex].split('-')[0] } ) as rowYearsRange}
function create_each_block$1(ctx) {
	let tr;
	let t;
	let current;
	let each_value_1 = ensure_array_like(/*rowYearsRange*/ ctx[10]);
	let each_blocks = [];

	for (let i = 0; i < each_value_1.length; i += 1) {
		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
	}

	const out = i => transition_out(each_blocks[i], 1, 1, () => {
		each_blocks[i] = null;
	});

	return {
		c() {
			tr = element("tr");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t = space();
			attr(tr, "class", "svelte-1x11e4z");
		},
		m(target, anchor) {
			insert(target, tr, anchor);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(tr, null);
				}
			}

			append(tr, t);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*$yearsRanges*/ 32) {
				each_value_1 = ensure_array_like(/*rowYearsRange*/ ctx[10]);
				let i;

				for (i = 0; i < each_value_1.length; i += 1) {
					const child_ctx = get_each_context_1(ctx, each_value_1, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
						transition_in(each_blocks[i], 1);
					} else {
						each_blocks[i] = create_each_block_1(child_ctx);
						each_blocks[i].c();
						transition_in(each_blocks[i], 1);
						each_blocks[i].m(tr, t);
					}
				}

				group_outros();

				for (i = each_value_1.length; i < each_blocks.length; i += 1) {
					out(i);
				}

				check_outros();
			}
		},
		i(local) {
			if (current) return;

			for (let i = 0; i < each_value_1.length; i += 1) {
				transition_in(each_blocks[i]);
			}

			current = true;
		},
		o(local) {
			each_blocks = each_blocks.filter(Boolean);

			for (let i = 0; i < each_blocks.length; i += 1) {
				transition_out(each_blocks[i]);
			}

			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(tr);
			}

			destroy_each(each_blocks, detaching);
		}
	};
}

function create_fragment$3(ctx) {
	let div1;
	let div0;
	let t0;
	let t1;
	let t2;
	let current;
	let each_value_8 = ensure_array_like(togglePeriods);
	let each_blocks = [];

	for (let i = 0; i < each_value_8.length; i += 1) {
		each_blocks[i] = create_each_block_8(get_each_context_8(ctx, each_value_8, i));
	}

	let if_block0 = /*crrView*/ ctx[0] === 'days' && create_if_block_3(ctx);
	let if_block1 = /*crrView*/ ctx[0] === 'months' && create_if_block_1$1(ctx);
	let if_block2 = /*crrView*/ ctx[0] === 'years' && create_if_block$2(ctx);

	return {
		c() {
			div1 = element("div");
			div0 = element("div");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t0 = space();
			if (if_block0) if_block0.c();
			t1 = space();
			if (if_block1) if_block1.c();
			t2 = space();
			if (if_block2) if_block2.c();
			attr(div0, "class", "flex rounded-[--tab-curve] ml-auto w-full max-w-xs space-x-1 p-1 bg-[--background-modifier-hover] svelte-1x11e4z");
			attr(div0, "id", "periods-container");
			attr(div1, "class", "container font-['Inter'] px-4 !pt-2 svelte-1x11e4z");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, div0);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(div0, null);
				}
			}

			append(div1, t0);
			if (if_block0) if_block0.m(div1, null);
			append(div1, t1);
			if (if_block1) if_block1.m(div1, null);
			append(div1, t2);
			if (if_block2) if_block2.m(div1, null);
			current = true;
		},
		p(ctx, dirty) {
			if (dirty[0] & /*crrView*/ 1) {
				each_value_8 = ensure_array_like(togglePeriods);
				let i;

				for (i = 0; i < each_value_8.length; i += 1) {
					const child_ctx = get_each_context_8(ctx, each_value_8, i);

					if (each_blocks[i]) {
						each_blocks[i].p(child_ctx, dirty);
					} else {
						each_blocks[i] = create_each_block_8(child_ctx);
						each_blocks[i].c();
						each_blocks[i].m(div0, null);
					}
				}

				for (; i < each_blocks.length; i += 1) {
					each_blocks[i].d(1);
				}

				each_blocks.length = each_value_8.length;
			}

			if (/*crrView*/ ctx[0] === 'days') {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty[0] & /*crrView*/ 1) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_3(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(div1, t1);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (/*crrView*/ ctx[0] === 'months') {
				if (if_block1) {
					if_block1.p(ctx, dirty);

					if (dirty[0] & /*crrView*/ 1) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block_1$1(ctx);
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(div1, t2);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}

			if (/*crrView*/ ctx[0] === 'years') {
				if (if_block2) {
					if_block2.p(ctx, dirty);

					if (dirty[0] & /*crrView*/ 1) {
						transition_in(if_block2, 1);
					}
				} else {
					if_block2 = create_if_block$2(ctx);
					if_block2.c();
					transition_in(if_block2, 1);
					if_block2.m(div1, null);
				}
			} else if (if_block2) {
				group_outros();

				transition_out(if_block2, 1, 1, () => {
					if_block2 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			transition_in(if_block2);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			transition_out(if_block2);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			destroy_each(each_blocks, detaching);
			if (if_block0) if_block0.d();
			if (if_block1) if_block1.d();
			if (if_block2) if_block2.d();
		}
	};
}

function instance$3($$self, $$props, $$invalidate) {
	let showWeekNums;
	let showQuarterNums;
	let weekdaysShort;
	let month;
	let $displayedDateStore;
	let $localeDataStore;
	let $settingsStore;
	let $yearsRanges;
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(6, $displayedDateStore = $$value));
	component_subscribe($$self, localeDataStore, $$value => $$invalidate(7, $localeDataStore = $$value));
	component_subscribe($$self, settingsStore, $$value => $$invalidate(8, $settingsStore = $$value));
	component_subscribe($$self, yearsRanges, $$value => $$invalidate(5, $yearsRanges = $$value));
	let crrView = 'days';
	const click_handler = period => $$invalidate(0, crrView = period);

	$$self.$$.update = () => {
		if ($$self.$$.dirty[0] & /*$settingsStore*/ 256) {
			$$invalidate(4, { localeSettings: { showWeekNums, showQuarterNums } } = $settingsStore, showWeekNums, ($$invalidate(3, showQuarterNums), $$invalidate(8, $settingsStore)));
		}

		if ($$self.$$.dirty[0] & /*$localeDataStore*/ 128) {
			$$invalidate(2, { weekdaysShort } = $localeDataStore, weekdaysShort);
		}

		if ($$self.$$.dirty[0] & /*$displayedDateStore*/ 64) {
			$$invalidate(1, month = getMonth($displayedDateStore));
		}
	};

	return [
		crrView,
		month,
		weekdaysShort,
		showQuarterNums,
		showWeekNums,
		$yearsRanges,
		$displayedDateStore,
		$localeDataStore,
		$settingsStore,
		click_handler
	];
}

class Calendar extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$3, create_fragment$3, safe_not_equal, {}, add_css$3, [-1, -1]);
	}
}

/* src/View.svelte generated by Svelte v4.2.19 */

function add_css$2(target) {
	append_styles(target, "svelte-11j7d0h", ".svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h,.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::before,.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::before,.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::after{--tw-content:''}:host{line-height:1.5;-webkit-text-size-adjust:100%;-moz-tab-size:4;-o-tab-size:4;tab-size:4;font-family:ui-sans-serif, system-ui, sans-serif, \"Apple Color Emoji\", \"Segoe UI Emoji\", \"Segoe UI Symbol\", \"Noto Color Emoji\";font-feature-settings:normal;font-variation-settings:normal;-webkit-tap-highlight-color:transparent}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:-moz-focusring{outline:auto}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:-moz-ui-invalid{box-shadow:none}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::-webkit-inner-spin-button,.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::-webkit-outer-spin-button{height:auto}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::-webkit-search-decoration{-webkit-appearance:none}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::-webkit-file-upload-button{-webkit-appearance:button;font:inherit}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:disabled{cursor:default}.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h,.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::before,.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::after{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h::backdrop{--tw-border-spacing-x:0;--tw-border-spacing-y:0;--tw-translate-x:0;--tw-translate-y:0;--tw-rotate:0;--tw-skew-x:0;--tw-skew-y:0;--tw-scale-x:1;--tw-scale-y:1;--tw-pan-x:  ;--tw-pan-y:  ;--tw-pinch-zoom:  ;--tw-scroll-snap-strictness:proximity;--tw-gradient-from-position:  ;--tw-gradient-via-position:  ;--tw-gradient-to-position:  ;--tw-ordinal:  ;--tw-slashed-zero:  ;--tw-numeric-figure:  ;--tw-numeric-spacing:  ;--tw-numeric-fraction:  ;--tw-ring-inset:  ;--tw-ring-offset-width:0px;--tw-ring-offset-color:#fff;--tw-ring-color:rgb(59 130 246 / 0.5);--tw-ring-offset-shadow:0 0 #0000;--tw-ring-shadow:0 0 #0000;--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;--tw-blur:  ;--tw-brightness:  ;--tw-contrast:  ;--tw-grayscale:  ;--tw-hue-rotate:  ;--tw-invert:  ;--tw-saturate:  ;--tw-sepia:  ;--tw-drop-shadow:  ;--tw-backdrop-blur:  ;--tw-backdrop-brightness:  ;--tw-backdrop-contrast:  ;--tw-backdrop-grayscale:  ;--tw-backdrop-hue-rotate:  ;--tw-backdrop-invert:  ;--tw-backdrop-opacity:  ;--tw-backdrop-saturate:  ;--tw-backdrop-sepia:  ;--tw-contain-size:  ;--tw-contain-layout:  ;--tw-contain-paint:  ;--tw-contain-style:  }.container.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:100%}@media(min-width: 640px){.container.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{max-width:640px}}@media(min-width: 768px){.container.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{max-width:768px}}@media(min-width: 1024px){.container.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{max-width:1024px}}@media(min-width: 1280px){.container.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{max-width:1280px}}@media(min-width: 1536px){.container.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{max-width:1536px}}.pointer-events-none.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{pointer-events:none}.collapse.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{visibility:collapse}.static.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{position:static}.absolute.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{position:absolute}.relative.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{position:relative}.bottom-1.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{bottom:0.25rem}.left-0.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{left:0px}.left-full.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{left:100%}.top-0.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{top:0px}.z-10.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{z-index:10}.z-20.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{z-index:20}.m-0.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin:0px}.-ml-1.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-left:-0.25rem}.mb-1\\.5.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-bottom:0.375rem}.ml-\\[5px\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-left:5px}.ml-auto.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-left:auto}.mt-2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-top:0.5rem}.mt-2\\.5.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-top:0.625rem}.mt-3.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-top:0.75rem}.mt-7.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{margin-top:1.75rem}.block.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{display:block}.flex.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{display:flex}.table.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{display:table}.contents.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{display:contents}.\\!h-4.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{height:1rem !important}.\\!h-auto.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{height:auto !important}.h-2\\.5.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{height:0.625rem}.h-\\[8px\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{height:8px}.h-auto.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{height:auto}.\\!w-4.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:1rem !important}.\\!w-6.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:1.5rem !important}.\\!w-8.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:2rem !important}.w-2\\.5.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:0.625rem}.w-\\[8px\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:8px}.w-full.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:100%}.w-max.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{width:-moz-max-content;width:max-content}.max-w-xs.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{max-width:20rem}.flex-grow.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{flex-grow:1}.border-collapse.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{border-collapse:collapse}.-translate-x-1\\/2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-translate-x:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.-translate-y-1\\/2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-translate-y:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-12.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-rotate:12deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-180.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-rotate:180deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.rotate-45.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-rotate:45deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))}.cursor-not-allowed.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{cursor:not-allowed}.cursor-pointer.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{cursor:pointer}.flex-col.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{flex-direction:column}.items-end.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{align-items:flex-end}.items-center.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{align-items:center}.justify-between.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{justify-content:space-between}.space-x-1.svelte-11j7d0h>.svelte-11j7d0h:not([hidden])~.svelte-11j7d0h:not([hidden]){--tw-space-x-reverse:0;margin-right:calc(0.25rem * var(--tw-space-x-reverse));margin-left:calc(0.25rem * calc(1 - var(--tw-space-x-reverse)))}.space-y-1.svelte-11j7d0h>.svelte-11j7d0h:not([hidden])~.svelte-11j7d0h:not([hidden]){--tw-space-y-reverse:0;margin-top:calc(0.25rem * calc(1 - var(--tw-space-y-reverse)));margin-bottom:calc(0.25rem * var(--tw-space-y-reverse))}.rounded-\\[--radius-s\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{border-radius:var(--radius-s)}.rounded-\\[--tab-curve\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{border-radius:var(--tab-curve)}.rounded-sm.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{border-radius:0.125rem}.border-0.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{border-width:0px}.bg-\\[--background-modifier-hover\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{background-color:var(--background-modifier-hover)}.bg-\\[--interactive-accent\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{background-color:var(--interactive-accent)}.bg-slate-500.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-bg-opacity:1;background-color:rgb(100 116 139 / var(--tw-bg-opacity))}.bg-transparent.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{background-color:transparent}.p-1.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding:0.25rem}.p-2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding:0.5rem}.px-1.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-left:0.25rem;padding-right:0.25rem}.px-2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-left:0.5rem;padding-right:0.5rem}.px-4.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-left:1rem;padding-right:1rem}.py-2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-top:0.5rem;padding-bottom:0.5rem}.py-3.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-top:0.75rem;padding-bottom:0.75rem}.\\!pt-2.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-top:0.5rem !important}.pt-4.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{padding-top:1rem}.text-center.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{text-align:center}.font-\\[\\'Inter\\'\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-family:'Inter'}.text-7xl.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-size:4.5rem;line-height:1}.text-lg.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-size:1.125rem;line-height:1.75rem}.text-sm.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-size:0.875rem;line-height:1.25rem}.text-xs.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-size:0.75rem;line-height:1rem}.font-medium.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-weight:500}.font-semibold.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{font-weight:600}.uppercase.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{text-transform:uppercase}.capitalize.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{text-transform:capitalize}.tabular-nums.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)}.text-\\[--color-arrow\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--color-arrow)}.text-\\[--color-text-title\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--color-text-title)}.text-\\[--color-text-today\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--color-text-today)}.text-\\[--interactive-accent\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--interactive-accent)}.text-\\[--tab-text-color\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--tab-text-color)}.text-\\[--text-muted\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--text-muted)}.text-\\[--text-normal\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--text-normal)}.text-\\[--text-on-accent\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{color:var(--text-on-accent)}.opacity-0.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{opacity:0}.opacity-100.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{opacity:1}.opacity-50.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{opacity:0.5}.opacity-60.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{opacity:0.6}.shadow.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}.blur.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{--tw-blur:blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)}.transition.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.transition-colors.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms}.hover\\:cursor-pointer.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:hover{cursor:pointer}.hover\\:bg-\\[--interactive-accent-hover\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:hover{background-color:var(--interactive-accent-hover)}.hover\\:bg-\\[--interactive-hover\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:hover{background-color:var(--interactive-hover)}.hover\\:text-\\[--text-on-accent\\].svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:hover{color:var(--text-on-accent)}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-11j7d0h.svelte-11j7d0h.svelte-11j7d0h:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)}");
}

// (82:0) {#if popover}
function create_if_block_1(ctx) {
	let div3;
	let div0;
	let t;
	let div2;
	let div1;
	let calendar;
	let div3_class_value;
	let current;
	calendar = new Calendar({});

	return {
		c() {
			div3 = element("div");
			div0 = element("div");
			t = space();
			div2 = element("div");
			div1 = element("div");
			create_component(calendar.$$.fragment);
			attr(div0, "id", `${CALENDAR_POPOVER_ID}-arrow`);
			attr(div0, "class", "rotate-45 absolute w-2.5 h-2.5 bg-slate-500 svelte-11j7d0h");
			attr(div1, "class", "bg-slate-500 rounded-sm svelte-11j7d0h");
			attr(div2, "class", "ml-[5px] p-2 svelte-11j7d0h");
			attr(div3, "class", div3_class_value = "" + (null_to_empty(clsx(/*popover*/ ctx[0] && 'bg-transparent z-10 w-max opacity-0 pointer-events-none absolute top-0 left-0')) + " svelte-11j7d0h"));
			attr(div3, "data-popover", /*popover*/ ctx[0]);
			attr(div3, "id", CALENDAR_POPOVER_ID);
		},
		m(target, anchor) {
			insert(target, div3, anchor);
			append(div3, div0);
			append(div3, t);
			append(div3, div2);
			append(div2, div1);
			mount_component(calendar, div1, null);
			current = true;
		},
		p(ctx, dirty) {
			if (!current || dirty & /*popover*/ 1 && div3_class_value !== (div3_class_value = "" + (null_to_empty(clsx(/*popover*/ ctx[0] && 'bg-transparent z-10 w-max opacity-0 pointer-events-none absolute top-0 left-0')) + " svelte-11j7d0h"))) {
				attr(div3, "class", div3_class_value);
			}

			if (!current || dirty & /*popover*/ 1) {
				attr(div3, "data-popover", /*popover*/ ctx[0]);
			}
		},
		i(local) {
			if (current) return;
			transition_in(calendar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(calendar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(div3);
			}

			destroy_component(calendar);
		}
	};
}

// (98:0) {#if !popover}
function create_if_block$1(ctx) {
	let calendar;
	let current;
	calendar = new Calendar({});

	return {
		c() {
			create_component(calendar.$$.fragment);
		},
		m(target, anchor) {
			mount_component(calendar, target, anchor);
			current = true;
		},
		i(local) {
			if (current) return;
			transition_in(calendar.$$.fragment, local);
			current = true;
		},
		o(local) {
			transition_out(calendar.$$.fragment, local);
			current = false;
		},
		d(detaching) {
			destroy_component(calendar, detaching);
		}
	};
}

function create_fragment$2(ctx) {
	let t;
	let if_block1_anchor;
	let current;
	let if_block0 = /*popover*/ ctx[0] && create_if_block_1(ctx);
	let if_block1 = !/*popover*/ ctx[0] && create_if_block$1();

	return {
		c() {
			if (if_block0) if_block0.c();
			t = space();
			if (if_block1) if_block1.c();
			if_block1_anchor = empty();
		},
		m(target, anchor) {
			if (if_block0) if_block0.m(target, anchor);
			insert(target, t, anchor);
			if (if_block1) if_block1.m(target, anchor);
			insert(target, if_block1_anchor, anchor);
			current = true;
		},
		p(ctx, [dirty]) {
			if (/*popover*/ ctx[0]) {
				if (if_block0) {
					if_block0.p(ctx, dirty);

					if (dirty & /*popover*/ 1) {
						transition_in(if_block0, 1);
					}
				} else {
					if_block0 = create_if_block_1(ctx);
					if_block0.c();
					transition_in(if_block0, 1);
					if_block0.m(t.parentNode, t);
				}
			} else if (if_block0) {
				group_outros();

				transition_out(if_block0, 1, 1, () => {
					if_block0 = null;
				});

				check_outros();
			}

			if (!/*popover*/ ctx[0]) {
				if (if_block1) {
					if (dirty & /*popover*/ 1) {
						transition_in(if_block1, 1);
					}
				} else {
					if_block1 = create_if_block$1();
					if_block1.c();
					transition_in(if_block1, 1);
					if_block1.m(if_block1_anchor.parentNode, if_block1_anchor);
				}
			} else if (if_block1) {
				group_outros();

				transition_out(if_block1, 1, 1, () => {
					if_block1 = null;
				});

				check_outros();
			}
		},
		i(local) {
			if (current) return;
			transition_in(if_block0);
			transition_in(if_block1);
			current = true;
		},
		o(local) {
			transition_out(if_block0);
			transition_out(if_block1);
			current = false;
		},
		d(detaching) {
			if (detaching) {
				detach(t);
				detach(if_block1_anchor);
			}

			if (if_block0) if_block0.d(detaching);
			if (if_block1) if_block1.d(detaching);
		}
	};
}

function rerenderCalendar() {
	
} // TODO: reimplement
// rerenderStore.update((val) => ({

function instance$2($$self, $$props, $$invalidate) {
	let $settingsStore;
	let $displayedDateStore;
	component_subscribe($$self, settingsStore, $$value => $$invalidate(3, $settingsStore = $$value));
	component_subscribe($$self, displayedDateStore, $$value => $$invalidate(4, $displayedDateStore = $$value));

	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	let { popover = false } = $$props;

	// 	rerender: true
	// }));
	let today = window.moment();

	let heartbeat = setInterval(
		() => {
			// update today
			today = window.moment();

			// update displayedDateStore to new current date only if new current date is one day ahead.
			// useful to update display with new current month, year or years range automatically
			if (today.isSame($displayedDateStore.clone().add(1, 'day'))) {
				console.log('⚙⚙⚙ RERENDERING CALENdAR ⚙⚙⚙️');
				displayedDateStore.set(today);
			}
		},
		1000 * 60
	);

	// Component event handlers
	const onClick = _a => __awaiter(void 0, [_a], void 0, function* ({ date, createNewSplitLeaf, granularity }) {
		const leaf = window.app.workspace.getLeaf(createNewSplitLeaf);
		createOrOpenNote({ leaf, date, granularity });
	});

	const onHover = ({ date, targetEl, isMetaPressed, granularity }) => {
		const { format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
		const note = getNoteFromStore({ date, granularity });

		if (isMetaPressed || $settingsStore.autoHoverPreview) {
			window.app.workspace.trigger('link-hover', targetEl, date.format(format), note === null || note === void 0 ? void 0 : note.path);
		}
	};

	const onContextMenu = ({ date, event, granularity }) => {
		const note = getNoteFromStore({ date, granularity });

		if (note) {
			Popover.create({
				id: FILE_MENU_POPOVER_ID,
				note,
				event,
				date,
				granularity
			}).open();
		} else {
			// TODO: improve wording
			new obsidian.Notice('Create a note first');
		}
	};

	setContext(VIEW, {
		app: window.app,
		eventHandlers: { onClick, onHover, onContextMenu }
	});

	onDestroy(() => {
		clearInterval(heartbeat);
	});

	$$self.$$set = $$props => {
		if ('popover' in $$props) $$invalidate(0, popover = $$props.popover);
	};

	return [popover, rerenderCalendar];
}

class View extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$2, create_fragment$2, safe_not_equal, { popover: 0, rerenderCalendar: 1 }, add_css$2);
	}

	get rerenderCalendar() {
		return rerenderCalendar;
	}
}

const settingsStore = writable(DEFAULT_SETTINGS);

class SettingsTab extends obsidian.PluginSettingTab {
    constructor(app, plugin) {
        super(app, plugin);
        this.plugin = plugin;
        setupLocale();
    }
    display() {
        this.containerEl.empty();
        this.containerEl.createEl('h3', {
            text: 'General Settings'
        });
        this.addViewLeafPositionSetting();
        this.addViewTypeSetting();
        this.addOpenPopoverOnRibbonHoverSetting();
        this.addConfirmCreateSetting();
        this.addConfirmAutoHoverPreviewSetting();
        this.addShowWeeklyNoteSetting();
        this.addShowQuarterlyNoteSetting();
        if (!get_store_value(settingsStore).leafViewEnabled) {
            this.containerEl.createEl('h3', {
                text: 'Popover behavior'
            });
            this.addClosePopoversOneByOneOnClickOutSetting();
            this.addClosePopoversOneByBoneOnEscKeydownSetting();
            this.addCloseOnEscStickerSearchInputSetting();
        }
        this.containerEl.createEl('h3', {
            text: 'Localization'
        });
        this.addLocaleOverrideSetting();
        this.addWeekStartSetting();
        this.addAllowLocalesSwitchFromCommandPaletteSetting();
        // this.containerEl.createEl('h3', {
        //     text: 'Date Formats'
        // });
        // this.containerEl.createEl('p', {
        //     text: "Define moment.js formats for note creation and calendar display"
        // });
        // new FormatsSettings({ target: this.containerEl });
    }
    addViewLeafPositionSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Calendar Pane Placement')
            .setDesc('Choose which side to display the Calendar pane')
            .addDropdown((viewLeafPosition) => {
            viewLeafPosition
                .addOption('Left', 'Left')
                .addOption('Right', 'Right')
                .setValue(get_store_value(settingsStore).viewLeafPosition)
                .onChange((position) => __awaiter(this, void 0, void 0, function* () {
                var _a;
                this.app.workspace.detachLeavesOfType(VIEW_TYPE);
                yield ((_a = this.app.workspace[`get${position}Leaf`](false)) === null || _a === void 0 ? void 0 : _a.setViewState({
                    type: VIEW_TYPE,
                    active: false
                }));
                this.plugin.saveSettings(() => ({
                    viewLeafPosition: position
                }));
            }));
        });
    }
    addViewTypeSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Use Calendar Pane')
            .setDesc('Open the Calendar in a dedicated pane instead of a popover when clicking the ribbon icon')
            .addToggle((leafViewEnabled) => leafViewEnabled
            .setValue(get_store_value(settingsStore).leafViewEnabled)
            .onChange((leafViewEnabled) => {
            // TODO: use BasePopover.instances instead
            if (this.plugin.popoversCleanups.length > 0) {
                this.plugin.popoversCleanups.forEach((cleanup) => cleanup());
                this.plugin.popoversCleanups = [];
            }
            if (!leafViewEnabled) {
                Popover.create({
                    id: CALENDAR_POPOVER_ID,
                    view: {
                        Component: View
                    }
                });
            }
            this.plugin.saveSettings(() => ({
                leafViewEnabled
            }));
            this.display(); // refresh settings panel
        }));
    }
    addOpenPopoverOnRibbonHoverSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Open Calendar on Ribbon Hover')
            .setDesc('Display the Calendar popover when hovering over the ribbon icon')
            .addToggle((el) => el
            .setValue(get_store_value(settingsStore).openPopoverOnRibbonHover)
            .onChange((openPopoverOnRibbonHover) => __awaiter(this, void 0, void 0, function* () {
            console.log('setting() > popoversCleanups: 🧹🧹🧹 🌬️ ', this.plugin.popoversCleanups);
            if (this.plugin.popoversCleanups.length > 0) {
                this.plugin.popoversCleanups.forEach((cleanup) => cleanup());
                this.plugin.popoversCleanups = [];
            }
            console.log('setting() > openPopoverOnRibbonHover: ', openPopoverOnRibbonHover);
            this.plugin.saveSettings(() => ({
                openPopoverOnRibbonHover
            }));
            Popover.create({
                id: CALENDAR_POPOVER_ID,
                view: {
                    Component: View
                }
            });
        })));
    }
    addConfirmCreateSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Confirm Note Creation')
            .setDesc('Show a confirmation dialog before creating a new periodic note')
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).shouldConfirmBeforeCreate);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.saveSettings(() => ({
                    shouldConfirmBeforeCreate: value
                }));
            }));
        });
    }
    addConfirmAutoHoverPreviewSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Auto-preview on Hover')
            .setDesc('Automatically preview notes when hovering over dates (no key combination required)')
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).autoHoverPreview);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.saveSettings(() => ({
                    autoHoverPreview: value
                }));
            }));
        });
    }
    addShowWeeklyNoteSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Display Week Numbers')
            .setDesc('Add a column showing week numbers in the calendar')
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).localeSettings.showWeekNums);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.saveSettings((settings) => ({
                    localeSettings: Object.assign(Object.assign({}, settings.localeSettings), { showWeekNums: value })
                }));
            }));
        });
    }
    addShowQuarterlyNoteSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Display Quarter Numbers')
            .setDesc('Add a column showing quarter numbers in the calendar')
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).localeSettings.showQuarterNums);
            toggle.onChange((value) => __awaiter(this, void 0, void 0, function* () {
                this.plugin.saveSettings((settings) => ({
                    localeSettings: Object.assign(Object.assign({}, settings.localeSettings), { showQuarterNums: value })
                }));
            }));
        });
    }
    addLocaleOverrideSetting() {
        const localeSettings = get_store_value(settingsStore).localeSettings;
        new obsidian.Setting(this.containerEl)
            .setName('Override System Locale')
            .setDesc('Choose a specific locale for the calendar, different from your system default')
            .addDropdown((dropdown) => {
            dropdown.addOption(sysLocaleKey, `Same as system - ${localesMap.get(sysLocaleKey) || sysLocaleKey}`);
            window.moment.locales().forEach((momentLocale) => {
                // use a name like "English" when available in static locales file otherwise use localeKey
                dropdown.addOption(momentLocale, localesMap.get(momentLocale) || momentLocale);
            });
            dropdown.setValue(localeSettings.localeOverride);
            dropdown.onChange((localeKey) => {
                updateLocale(localeKey);
                updateWeekStart();
                updateWeekdays();
                this.display();
            });
        });
    }
    addWeekStartSetting() {
        const { localeSettings } = get_store_value(settingsStore);
        console.log('addWeekStartSetting() > localeSettings: ', localeSettings);
        new obsidian.Setting(this.containerEl)
            .setName('First Day of Week')
            .setDesc("Choose which day to start the week with, or use the locale's default")
            .addDropdown((dropdown) => {
            dropdown.addOption(defaultWeekdays[window.moment.localeData().firstDayOfWeek()], `Locale default - ${window.moment.localeData().weekdays()[window.moment.localeData().firstDayOfWeek()]}`);
            console.log('addWeekStartSetting() > locale weekdays: ', window.moment.localeData().weekdays());
            window.moment
                .localeData()
                .weekdays()
                .forEach((localizedDay, i) => {
                dropdown.addOption(defaultWeekdays[i], localizedDay);
            });
            console.log('addWeekStartSetting() > weekStartId: ', localeSettings.weekStartId);
            console.log('addWeekStartSetting() > defaultWeekdays: ', defaultWeekdays);
            console.log('addWeekStartSetting() > defaultWeekdays[weekStartId]: ', defaultWeekdays[localeSettings.weekStartId]);
            dropdown.setValue(defaultWeekdays[localeSettings.weekStartId]);
            dropdown.onChange((weekday) => {
                const newWeekStartId = defaultWeekdays.indexOf(weekday);
                console.log('setting() > newWeekStartId: ', newWeekStartId);
                updateWeekStart(newWeekStartId);
                updateWeekdays();
            });
        });
    }
    addAllowLocalesSwitchFromCommandPaletteSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Enable Locale Switching via Command Palette')
            .setDesc('Allow changing the calendar locale directly from the Command Palette (requires app restart)')
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).allowLocalesSwitchFromCommandPalette);
            toggle.onChange((value) => {
                this.plugin.saveSettings(() => ({
                    allowLocalesSwitchFromCommandPalette: value
                }));
            });
        });
    }
    addClosePopoversOneByOneOnClickOutSetting() {
        const settingEl = new obsidian.Setting(this.containerEl)
            .setName('Close Popovers Individually on Outside Click')
            .setDesc("Dismiss open popovers one at a time when clicking outside, instead of all at once")
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).popoversClosing.closePopoversOneByOneOnClickOut);
            toggle.onChange((value) => {
                this.plugin.saveSettings((settings) => ({
                    popoversClosing: Object.assign(Object.assign({}, settings.popoversClosing), { closePopoversOneByOneOnClickOut: value })
                }));
            });
        }).settingEl;
        settingEl.style.flexWrap = 'wrap';
    }
    addClosePopoversOneByBoneOnEscKeydownSetting() {
        new obsidian.Setting(this.containerEl)
            .setName('Close Popovers Individually with Esc Key')
            .setDesc('Dismiss open popovers one at a time when pressing Esc, instead of all at once')
            .addToggle((toggle) => {
            toggle.setValue(get_store_value(settingsStore).popoversClosing.closePopoversOneByOneOnEscKeydown);
            toggle.onChange((value) => {
                this.plugin.saveSettings((settings) => ({
                    popoversClosing: Object.assign(Object.assign({}, settings.popoversClosing), { closePopoversOneByOneOnEscKeydown: value })
                }));
                this.display();
            });
        });
    }
    addCloseOnEscStickerSearchInputSetting() {
        console.log('👟 RUNNING addCloseOnEscStickerSearchInputSetting()');
        new obsidian.Setting(this.containerEl)
            .setName('Esc Key Behavior in Sticker Popover Search')
            // TODO: rewrite
            .setDesc('Close the popover when pressing Esc in the search input instead of the default blur')
            .addToggle((enabled) => {
            enabled
                .setValue(get_store_value(settingsStore).popoversClosing.closeOnEscStickerSearchInput)
                .onChange((enabled) => {
                this.plugin.saveSettings((settings) => ({
                    popoversClosing: Object.assign(Object.assign({}, settings.popoversClosing), { closeOnEscStickerSearchInput: enabled })
                }));
            });
        });
    }
}

function createYearsRangesStore() {
    const defaultRange = `${DEFAULT_SETTINGS.yearsRangesStart}-${DEFAULT_SETTINGS.yearsRangesStart + YEARS_RANGE_SIZE - 1}`;
    const store = writable({
        ranges: [defaultRange],
        todayRange: defaultRange,
        crrRangeIndex: 0
    });
    const addNewRange = ({ startYear, action }) => {
        store.update((values) => {
            const newRanges = values.ranges;
            newRanges[action === 'increment' ? 'push' : 'unshift'](`${startYear}-${startYear + YEARS_RANGE_SIZE - 1}`);
            return Object.assign(Object.assign({}, values), { ranges: newRanges });
        });
    };
    const updateRanges = ({ action, displayedDateModifier }) => {
        const { ranges, crrRangeIndex } = get_store_value(store);
        const crrRange = ranges[crrRangeIndex];
        const [crrRangeStartYear, crrRangeEndYear] = crrRange.split('-');
        const todayMoment = window.moment().clone();
        if (action === 'decrement') {
            const prevRange = ranges[crrRangeIndex - 1];
            displayedDateStore.set(todayMoment.year(+crrRangeStartYear + (displayedDateModifier || -1)).startOf('year'));
            !prevRange &&
                addNewRange({
                    startYear: +crrRangeStartYear - YEARS_RANGE_SIZE,
                    action: 'decrement'
                });
            if (crrRangeIndex > 0) {
                updateCrrRangeIndex({ modifier: -1 });
            }
        }
        if (action === 'increment') {
            const nextRange = ranges[crrRangeIndex + 1];
            displayedDateStore.set(todayMoment.year(+crrRangeEndYear + 1).startOf('year'));
            !nextRange && addNewRange({ startYear: +crrRangeEndYear + 1, action: 'increment' });
            updateCrrRangeIndex({ modifier: +1 });
        }
    };
    const updateCrrRangeIndex = ({ modifier }) => {
        store.update((values) => (Object.assign(Object.assign({}, values), { crrRangeIndex: values.crrRangeIndex + modifier })));
    };
    const selectOrCreateRanges = () => {
        const { ranges, crrRangeIndex, todayRange } = get_store_value(store);
        const crrDisplayedYear = get_store_value(displayedDateStore).year();
        const todayYear = window.moment().clone().year();
        console.log('selectOrCreateRnages(), todayRange: ', todayRange);
        const firstRange = ranges[0];
        const lastRange = ranges[ranges.length - 1];
        const firstRangeStartYear = firstRange.split('-')[0];
        const lastRangeEndYear = lastRange.split('-')[1];
        const newRanges = [...ranges];
        let newCrrRangeIndex = crrRangeIndex;
        let newTodayRange = todayRange;
        if (+firstRangeStartYear > crrDisplayedYear) {
            // push new ranges at the start of ranges
            let newFirstRangeStartYear = +firstRangeStartYear;
            while (+newFirstRangeStartYear > crrDisplayedYear) {
                newRanges.unshift(`${newFirstRangeStartYear - YEARS_RANGE_SIZE}-${newFirstRangeStartYear - 1}`);
                newFirstRangeStartYear -= YEARS_RANGE_SIZE;
            }
            newCrrRangeIndex = 0;
        }
        // push new ranges at the end of ranges
        if (+lastRangeEndYear < crrDisplayedYear) {
            let newLastRangeEndYear = +lastRangeEndYear;
            while (+newLastRangeEndYear < crrDisplayedYear) {
                newRanges.push(`${+newLastRangeEndYear + 1}-${newLastRangeEndYear + YEARS_RANGE_SIZE}`);
                newLastRangeEndYear += YEARS_RANGE_SIZE;
            }
            newCrrRangeIndex = newRanges.length - 1;
        }
        // search for range containing crrDisplayedYear and set it as current range
        if (crrDisplayedYear >= +firstRangeStartYear && crrDisplayedYear <= +lastRangeEndYear) {
            for (const [i, range] of newRanges.entries()) {
                const [start, end] = range.split('-');
                if (crrDisplayedYear >= +start && crrDisplayedYear <= +end) {
                    newCrrRangeIndex = i;
                    break;
                }
            }
        }
        // update todayRange if it doesnt include todayYear anymore
        const [todayRangeStartYear, todayRangeEndYear] = todayRange.split('-');
        if (!(todayYear >= +todayRangeStartYear && todayYear <= +todayRangeEndYear)) {
            for (const [_, range] of newRanges.entries()) {
                const [start, end] = range.split('-');
                if (todayYear >= +start && todayYear <= +end) {
                    newTodayRange = range;
                    break;
                }
            }
        }
        // update store
        store.update((values) => (Object.assign(Object.assign({}, values), { ranges: newRanges, crrRangeIndex: newCrrRangeIndex, todayRange: newTodayRange })));
    };
    return Object.assign({ addNewRange,
        updateRanges,
        updateCrrRangeIndex,
        selectOrCreateRanges }, store);
}
const displayedDateStore = writable(window.moment());
const yearsRanges = createYearsRangesStore();

const localeDataStore = writable({
    weekdays: defaultWeekdays,
    weekdaysShort: defaultWeekdaysShort
});
function updateLocale(localeKey) {
    window.moment.locale(localeKey);
    // update settings
    get_store_value(pluginClassStore).saveSettings((settings) => ({
        localeSettings: Object.assign(Object.assign({}, settings.localeSettings), { localeOverride: localeKey })
    }));
    // update UI
    displayedDateStore.set(window.moment());
}
function updateWeekStart(weekStartId = window.moment.localeData().firstDayOfWeek()) {
    // update settings
    get_store_value(pluginClassStore).saveSettings((settings) => ({
        localeSettings: Object.assign(Object.assign({}, settings.localeSettings), { weekStartId })
    }));
    // update UI
    displayedDateStore.set(window.moment());
}
function updateWeekdays() {
    const weekStartId = get_store_value(settingsStore).localeSettings.weekStartId;
    const localizedWeekdays = window.moment.localeData().weekdays();
    const localizedWeekdaysShort = window.moment.localeData().weekdaysMin();
    const weekdays = [
        ...localizedWeekdays.slice(weekStartId),
        ...localizedWeekdays.slice(0, weekStartId)
    ];
    const weekdaysShort = [
        ...localizedWeekdaysShort.slice(weekStartId),
        ...localizedWeekdaysShort.slice(0, weekStartId)
    ];
    // update UI
    localeDataStore.update((data) => (Object.assign(Object.assign({}, data), { weekdays,
        weekdaysShort })));
    displayedDateStore.set(window.moment());
}
function setupLocale() {
    window.moment.locale(get_store_value(settingsStore).localeSettings.localeOverride);
    updateWeekdays();
}

function createNotesStore(granularity) {
    let hasError = false;
    const store = writable({});
    return Object.assign({ 
        /**
            * @note dependent on `getNoteSettingsByPeriodicity`, must only be called after periodic notes plugin is fully loaded
            */
        index: () => {
            try {
                const notes = getAllVaultNotes(granularity);
                console.log(`createNotesStore(${granularity}) > notes: `, notes);
                if (Object.keys(notes).length === 0) {
                    throw new Error('No notes found');
                }
                store.set(notes);
            }
            catch (err) {
                if (!hasError) {
                    // Avoid error being shown multiple times
                    console.warn('[Calendar] Failed to find daily notes folder', err);
                }
                store.set({});
                hasError = true;
            }
        } }, store);
}
const notesStores = {};
granularities.forEach((granularity) => {
    const notesExtStore = createNotesStore(granularity);
    notesStores[granularity] = notesExtStore;
});
function createSelectedFileIdStore() {
    const store = writable(null);
    return Object.assign({ setFile: (id) => {
            store.set(id);
            // console.log('createSelectedFileStore > setFile > activeFileUID: ', get(store));
        } }, store);
}
const activeFileIdStore = createSelectedFileIdStore();

const pluginClassStore = writable();

/* src/ui/components/ConfirmationModal.svelte generated by Svelte v4.2.19 */

function add_css$1(target) {
	append_styles(target, "svelte-1ekuxpk", "@media(min-width: 640px){}@media(min-width: 768px){}@media(min-width: 1024px){}@media(min-width: 1280px){}@media(min-width: 1536px){}.m-0.svelte-1ekuxpk{margin:0px\n}.mt-2.svelte-1ekuxpk{margin-top:0.5rem\n}.mt-3.svelte-1ekuxpk{margin-top:0.75rem\n}.mt-7.svelte-1ekuxpk{margin-top:1.75rem\n}.flex.svelte-1ekuxpk{display:flex\n}.items-center.svelte-1ekuxpk{align-items:center\n}.text-sm.svelte-1ekuxpk{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-1ekuxpk{font-size:0.75rem;line-height:1rem\n}.text-\\[--text-muted\\].svelte-1ekuxpk{color:var(--text-muted)\n}.hover\\:cursor-pointer.svelte-1ekuxpk:hover{cursor:pointer\n}");
}

// (43:1) {#if note}
function create_if_block(ctx) {
	let p;

	return {
		c() {
			p = element("p");
			p.textContent = `${/*note*/ ctx[3]}`;
			attr(p, "class", "m-0 mt-2 text-xs text-[--text-muted] svelte-1ekuxpk");
		},
		m(target, anchor) {
			insert(target, p, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(p);
			}
		}
	};
}

function create_fragment$1(ctx) {
	let div1;
	let h2;
	let t1;
	let p;
	let t3;
	let label;
	let input;
	let t4;
	let t5;
	let t6;
	let div0;
	let button0;
	let t8;
	let button1;
	let mounted;
	let dispose;
	let if_block = /*note*/ ctx[3] && create_if_block(ctx);

	return {
		c() {
			div1 = element("div");
			h2 = element("h2");
			h2.textContent = `${/*title*/ ctx[1]}`;
			t1 = space();
			p = element("p");
			p.textContent = `${/*text*/ ctx[2]}`;
			t3 = space();
			label = element("label");
			input = element("input");
			t4 = text(" Don't show\n\t\tagain");
			t5 = space();
			if (if_block) if_block.c();
			t6 = space();
			div0 = element("div");
			button0 = element("button");
			button0.textContent = "Never mind";
			t8 = space();
			button1 = element("button");
			button1.textContent = `${/*cta*/ ctx[4]}`;
			attr(input, "type", "checkbox");
			attr(input, "class", "hover:cursor-pointer svelte-1ekuxpk");
			attr(label, "class", "flex items-center hover:cursor-pointer text-sm mt-7 svelte-1ekuxpk");
			attr(button1, "class", "mod-cta");
			attr(div0, "class", "modal-button-container mt-3 svelte-1ekuxpk");
		},
		m(target, anchor) {
			insert(target, div1, anchor);
			append(div1, h2);
			append(div1, t1);
			append(div1, p);
			append(div1, t3);
			append(div1, label);
			append(label, input);
			input.checked = /*dontConfirmAgain*/ ctx[0];
			append(label, t4);
			append(div1, t5);
			if (if_block) if_block.m(div1, null);
			append(div1, t6);
			append(div1, div0);
			append(div0, button0);
			append(div0, t8);
			append(div0, button1);

			if (!mounted) {
				dispose = [
					listen(input, "change", /*input_change_handler*/ ctx[9]),
					listen(button0, "click", /*handleCancel*/ ctx[5]),
					listen(button1, "click", /*handleAccept*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*dontConfirmAgain*/ 1) {
				input.checked = /*dontConfirmAgain*/ ctx[0];
			}

			if (/*note*/ ctx[3]) if_block.p(ctx, dirty);
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div1);
			}

			if (if_block) if_block.d();
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance$1($$self, $$props, $$invalidate) {
	let $pluginClassStore;
	component_subscribe($$self, pluginClassStore, $$value => $$invalidate(10, $pluginClassStore = $$value));

	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	let { config } = $$props;
	let { modalClass } = $$props;
	const { title, text, note, cta, onAccept } = config;
	let dontConfirmAgain = false;

	const shouldConfirmBeforeCreate = () => __awaiter(void 0, void 0, void 0, function* () {
		if (dontConfirmAgain && $pluginClassStore) {
			settingsStore.update(oldSettings => {
				const newSettings = Object.assign(Object.assign({}, oldSettings), { shouldConfirmBeforeCreate: false });
				return newSettings;
			});

			yield $pluginClassStore.saveData(get_store_value(settingsStore));
		}
	});

	const handleCancel = () => __awaiter(void 0, void 0, void 0, function* () {
		modalClass.close();
	});

	const handleAccept = () => __awaiter(void 0, void 0, void 0, function* () {
		modalClass.close();
		yield onAccept();
		yield shouldConfirmBeforeCreate();
	});

	function input_change_handler() {
		dontConfirmAgain = this.checked;
		$$invalidate(0, dontConfirmAgain);
	}

	$$self.$$set = $$props => {
		if ('config' in $$props) $$invalidate(7, config = $$props.config);
		if ('modalClass' in $$props) $$invalidate(8, modalClass = $$props.modalClass);
	};

	return [
		dontConfirmAgain,
		title,
		text,
		note,
		cta,
		handleCancel,
		handleAccept,
		config,
		modalClass,
		input_change_handler
	];
}

let ConfirmationModal$1 = class ConfirmationModal extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance$1, create_fragment$1, safe_not_equal, { config: 7, modalClass: 8 }, add_css$1);
	}
};

class ConfirmationModal extends obsidian.Modal {
    constructor(config) {
        super(window.app);
        const { contentEl } = this;
        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();
        // Instantiate the Svelte component
        new ConfirmationModal$1({
            target: svelteContainer,
            props: {
                config,
                modalClass: this
            }
        });
    }
}
function createConfirmationDialog(params) {
    new ConfirmationModal(params).open();
}

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function getDefaultExportFromCjs (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function commonjsRequire(path) {
	throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}

var moment$1 = {exports: {}};

(function (module, exports) {
(function (global, factory) {
	    module.exports = factory() ;
	}(commonjsGlobal, (function () {
	    var hookCallback;

	    function hooks() {
	        return hookCallback.apply(null, arguments);
	    }

	    // This is done to register the method called with moment()
	    // without creating circular dependencies.
	    function setHookCallback(callback) {
	        hookCallback = callback;
	    }

	    function isArray(input) {
	        return (
	            input instanceof Array ||
	            Object.prototype.toString.call(input) === '[object Array]'
	        );
	    }

	    function isObject(input) {
	        // IE8 will treat undefined and null as object if it wasn't for
	        // input != null
	        return (
	            input != null &&
	            Object.prototype.toString.call(input) === '[object Object]'
	        );
	    }

	    function hasOwnProp(a, b) {
	        return Object.prototype.hasOwnProperty.call(a, b);
	    }

	    function isObjectEmpty(obj) {
	        if (Object.getOwnPropertyNames) {
	            return Object.getOwnPropertyNames(obj).length === 0;
	        } else {
	            var k;
	            for (k in obj) {
	                if (hasOwnProp(obj, k)) {
	                    return false;
	                }
	            }
	            return true;
	        }
	    }

	    function isUndefined(input) {
	        return input === void 0;
	    }

	    function isNumber(input) {
	        return (
	            typeof input === 'number' ||
	            Object.prototype.toString.call(input) === '[object Number]'
	        );
	    }

	    function isDate(input) {
	        return (
	            input instanceof Date ||
	            Object.prototype.toString.call(input) === '[object Date]'
	        );
	    }

	    function map(arr, fn) {
	        var res = [],
	            i,
	            arrLen = arr.length;
	        for (i = 0; i < arrLen; ++i) {
	            res.push(fn(arr[i], i));
	        }
	        return res;
	    }

	    function extend(a, b) {
	        for (var i in b) {
	            if (hasOwnProp(b, i)) {
	                a[i] = b[i];
	            }
	        }

	        if (hasOwnProp(b, 'toString')) {
	            a.toString = b.toString;
	        }

	        if (hasOwnProp(b, 'valueOf')) {
	            a.valueOf = b.valueOf;
	        }

	        return a;
	    }

	    function createUTC(input, format, locale, strict) {
	        return createLocalOrUTC(input, format, locale, strict, true).utc();
	    }

	    function defaultParsingFlags() {
	        // We need to deep clone this object.
	        return {
	            empty: false,
	            unusedTokens: [],
	            unusedInput: [],
	            overflow: -2,
	            charsLeftOver: 0,
	            nullInput: false,
	            invalidEra: null,
	            invalidMonth: null,
	            invalidFormat: false,
	            userInvalidated: false,
	            iso: false,
	            parsedDateParts: [],
	            era: null,
	            meridiem: null,
	            rfc2822: false,
	            weekdayMismatch: false,
	        };
	    }

	    function getParsingFlags(m) {
	        if (m._pf == null) {
	            m._pf = defaultParsingFlags();
	        }
	        return m._pf;
	    }

	    var some;
	    if (Array.prototype.some) {
	        some = Array.prototype.some;
	    } else {
	        some = function (fun) {
	            var t = Object(this),
	                len = t.length >>> 0,
	                i;

	            for (i = 0; i < len; i++) {
	                if (i in t && fun.call(this, t[i], i, t)) {
	                    return true;
	                }
	            }

	            return false;
	        };
	    }

	    function isValid(m) {
	        var flags = null,
	            parsedParts = false,
	            isNowValid = m._d && !isNaN(m._d.getTime());
	        if (isNowValid) {
	            flags = getParsingFlags(m);
	            parsedParts = some.call(flags.parsedDateParts, function (i) {
	                return i != null;
	            });
	            isNowValid =
	                flags.overflow < 0 &&
	                !flags.empty &&
	                !flags.invalidEra &&
	                !flags.invalidMonth &&
	                !flags.invalidWeekday &&
	                !flags.weekdayMismatch &&
	                !flags.nullInput &&
	                !flags.invalidFormat &&
	                !flags.userInvalidated &&
	                (!flags.meridiem || (flags.meridiem && parsedParts));
	            if (m._strict) {
	                isNowValid =
	                    isNowValid &&
	                    flags.charsLeftOver === 0 &&
	                    flags.unusedTokens.length === 0 &&
	                    flags.bigHour === undefined;
	            }
	        }
	        if (Object.isFrozen == null || !Object.isFrozen(m)) {
	            m._isValid = isNowValid;
	        } else {
	            return isNowValid;
	        }
	        return m._isValid;
	    }

	    function createInvalid(flags) {
	        var m = createUTC(NaN);
	        if (flags != null) {
	            extend(getParsingFlags(m), flags);
	        } else {
	            getParsingFlags(m).userInvalidated = true;
	        }

	        return m;
	    }

	    // Plugins that add properties should also add the key here (null value),
	    // so we can properly clone ourselves.
	    var momentProperties = (hooks.momentProperties = []),
	        updateInProgress = false;

	    function copyConfig(to, from) {
	        var i,
	            prop,
	            val,
	            momentPropertiesLen = momentProperties.length;

	        if (!isUndefined(from._isAMomentObject)) {
	            to._isAMomentObject = from._isAMomentObject;
	        }
	        if (!isUndefined(from._i)) {
	            to._i = from._i;
	        }
	        if (!isUndefined(from._f)) {
	            to._f = from._f;
	        }
	        if (!isUndefined(from._l)) {
	            to._l = from._l;
	        }
	        if (!isUndefined(from._strict)) {
	            to._strict = from._strict;
	        }
	        if (!isUndefined(from._tzm)) {
	            to._tzm = from._tzm;
	        }
	        if (!isUndefined(from._isUTC)) {
	            to._isUTC = from._isUTC;
	        }
	        if (!isUndefined(from._offset)) {
	            to._offset = from._offset;
	        }
	        if (!isUndefined(from._pf)) {
	            to._pf = getParsingFlags(from);
	        }
	        if (!isUndefined(from._locale)) {
	            to._locale = from._locale;
	        }

	        if (momentPropertiesLen > 0) {
	            for (i = 0; i < momentPropertiesLen; i++) {
	                prop = momentProperties[i];
	                val = from[prop];
	                if (!isUndefined(val)) {
	                    to[prop] = val;
	                }
	            }
	        }

	        return to;
	    }

	    // Moment prototype object
	    function Moment(config) {
	        copyConfig(this, config);
	        this._d = new Date(config._d != null ? config._d.getTime() : NaN);
	        if (!this.isValid()) {
	            this._d = new Date(NaN);
	        }
	        // Prevent infinite loop in case updateOffset creates new moment
	        // objects.
	        if (updateInProgress === false) {
	            updateInProgress = true;
	            hooks.updateOffset(this);
	            updateInProgress = false;
	        }
	    }

	    function isMoment(obj) {
	        return (
	            obj instanceof Moment || (obj != null && obj._isAMomentObject != null)
	        );
	    }

	    function warn(msg) {
	        if (
	            hooks.suppressDeprecationWarnings === false &&
	            typeof console !== 'undefined' &&
	            console.warn
	        ) {
	            console.warn('Deprecation warning: ' + msg);
	        }
	    }

	    function deprecate(msg, fn) {
	        var firstTime = true;

	        return extend(function () {
	            if (hooks.deprecationHandler != null) {
	                hooks.deprecationHandler(null, msg);
	            }
	            if (firstTime) {
	                var args = [],
	                    arg,
	                    i,
	                    key,
	                    argLen = arguments.length;
	                for (i = 0; i < argLen; i++) {
	                    arg = '';
	                    if (typeof arguments[i] === 'object') {
	                        arg += '\n[' + i + '] ';
	                        for (key in arguments[0]) {
	                            if (hasOwnProp(arguments[0], key)) {
	                                arg += key + ': ' + arguments[0][key] + ', ';
	                            }
	                        }
	                        arg = arg.slice(0, -2); // Remove trailing comma and space
	                    } else {
	                        arg = arguments[i];
	                    }
	                    args.push(arg);
	                }
	                warn(
	                    msg +
	                        '\nArguments: ' +
	                        Array.prototype.slice.call(args).join('') +
	                        '\n' +
	                        new Error().stack
	                );
	                firstTime = false;
	            }
	            return fn.apply(this, arguments);
	        }, fn);
	    }

	    var deprecations = {};

	    function deprecateSimple(name, msg) {
	        if (hooks.deprecationHandler != null) {
	            hooks.deprecationHandler(name, msg);
	        }
	        if (!deprecations[name]) {
	            warn(msg);
	            deprecations[name] = true;
	        }
	    }

	    hooks.suppressDeprecationWarnings = false;
	    hooks.deprecationHandler = null;

	    function isFunction(input) {
	        return (
	            (typeof Function !== 'undefined' && input instanceof Function) ||
	            Object.prototype.toString.call(input) === '[object Function]'
	        );
	    }

	    function set(config) {
	        var prop, i;
	        for (i in config) {
	            if (hasOwnProp(config, i)) {
	                prop = config[i];
	                if (isFunction(prop)) {
	                    this[i] = prop;
	                } else {
	                    this['_' + i] = prop;
	                }
	            }
	        }
	        this._config = config;
	        // Lenient ordinal parsing accepts just a number in addition to
	        // number + (possibly) stuff coming from _dayOfMonthOrdinalParse.
	        // TODO: Remove "ordinalParse" fallback in next major release.
	        this._dayOfMonthOrdinalParseLenient = new RegExp(
	            (this._dayOfMonthOrdinalParse.source || this._ordinalParse.source) +
	                '|' +
	                /\d{1,2}/.source
	        );
	    }

	    function mergeConfigs(parentConfig, childConfig) {
	        var res = extend({}, parentConfig),
	            prop;
	        for (prop in childConfig) {
	            if (hasOwnProp(childConfig, prop)) {
	                if (isObject(parentConfig[prop]) && isObject(childConfig[prop])) {
	                    res[prop] = {};
	                    extend(res[prop], parentConfig[prop]);
	                    extend(res[prop], childConfig[prop]);
	                } else if (childConfig[prop] != null) {
	                    res[prop] = childConfig[prop];
	                } else {
	                    delete res[prop];
	                }
	            }
	        }
	        for (prop in parentConfig) {
	            if (
	                hasOwnProp(parentConfig, prop) &&
	                !hasOwnProp(childConfig, prop) &&
	                isObject(parentConfig[prop])
	            ) {
	                // make sure changes to properties don't modify parent config
	                res[prop] = extend({}, res[prop]);
	            }
	        }
	        return res;
	    }

	    function Locale(config) {
	        if (config != null) {
	            this.set(config);
	        }
	    }

	    var keys;

	    if (Object.keys) {
	        keys = Object.keys;
	    } else {
	        keys = function (obj) {
	            var i,
	                res = [];
	            for (i in obj) {
	                if (hasOwnProp(obj, i)) {
	                    res.push(i);
	                }
	            }
	            return res;
	        };
	    }

	    var defaultCalendar = {
	        sameDay: '[Today at] LT',
	        nextDay: '[Tomorrow at] LT',
	        nextWeek: 'dddd [at] LT',
	        lastDay: '[Yesterday at] LT',
	        lastWeek: '[Last] dddd [at] LT',
	        sameElse: 'L',
	    };

	    function calendar(key, mom, now) {
	        var output = this._calendar[key] || this._calendar['sameElse'];
	        return isFunction(output) ? output.call(mom, now) : output;
	    }

	    function zeroFill(number, targetLength, forceSign) {
	        var absNumber = '' + Math.abs(number),
	            zerosToFill = targetLength - absNumber.length,
	            sign = number >= 0;
	        return (
	            (sign ? (forceSign ? '+' : '') : '-') +
	            Math.pow(10, Math.max(0, zerosToFill)).toString().substr(1) +
	            absNumber
	        );
	    }

	    var formattingTokens =
	            /(\[[^\[]*\])|(\\)?([Hh]mm(ss)?|Mo|MM?M?M?|Do|DDDo|DD?D?D?|ddd?d?|do?|w[o|w]?|W[o|W]?|Qo?|N{1,5}|YYYYYY|YYYYY|YYYY|YY|y{2,4}|yo?|gg(ggg?)?|GG(GGG?)?|e|E|a|A|hh?|HH?|kk?|mm?|ss?|S{1,9}|x|X|zz?|ZZ?|.)/g,
	        localFormattingTokens = /(\[[^\[]*\])|(\\)?(LTS|LT|LL?L?L?|l{1,4})/g,
	        formatFunctions = {},
	        formatTokenFunctions = {};

	    // token:    'M'
	    // padded:   ['MM', 2]
	    // ordinal:  'Mo'
	    // callback: function () { this.month() + 1 }
	    function addFormatToken(token, padded, ordinal, callback) {
	        var func = callback;
	        if (typeof callback === 'string') {
	            func = function () {
	                return this[callback]();
	            };
	        }
	        if (token) {
	            formatTokenFunctions[token] = func;
	        }
	        if (padded) {
	            formatTokenFunctions[padded[0]] = function () {
	                return zeroFill(func.apply(this, arguments), padded[1], padded[2]);
	            };
	        }
	        if (ordinal) {
	            formatTokenFunctions[ordinal] = function () {
	                return this.localeData().ordinal(
	                    func.apply(this, arguments),
	                    token
	                );
	            };
	        }
	    }

	    function removeFormattingTokens(input) {
	        if (input.match(/\[[\s\S]/)) {
	            return input.replace(/^\[|\]$/g, '');
	        }
	        return input.replace(/\\/g, '');
	    }

	    function makeFormatFunction(format) {
	        var array = format.match(formattingTokens),
	            i,
	            length;

	        for (i = 0, length = array.length; i < length; i++) {
	            if (formatTokenFunctions[array[i]]) {
	                array[i] = formatTokenFunctions[array[i]];
	            } else {
	                array[i] = removeFormattingTokens(array[i]);
	            }
	        }

	        return function (mom) {
	            var output = '',
	                i;
	            for (i = 0; i < length; i++) {
	                output += isFunction(array[i])
	                    ? array[i].call(mom, format)
	                    : array[i];
	            }
	            return output;
	        };
	    }

	    // format date using native date object
	    function formatMoment(m, format) {
	        if (!m.isValid()) {
	            return m.localeData().invalidDate();
	        }

	        format = expandFormat(format, m.localeData());
	        formatFunctions[format] =
	            formatFunctions[format] || makeFormatFunction(format);

	        return formatFunctions[format](m);
	    }

	    function expandFormat(format, locale) {
	        var i = 5;

	        function replaceLongDateFormatTokens(input) {
	            return locale.longDateFormat(input) || input;
	        }

	        localFormattingTokens.lastIndex = 0;
	        while (i >= 0 && localFormattingTokens.test(format)) {
	            format = format.replace(
	                localFormattingTokens,
	                replaceLongDateFormatTokens
	            );
	            localFormattingTokens.lastIndex = 0;
	            i -= 1;
	        }

	        return format;
	    }

	    var defaultLongDateFormat = {
	        LTS: 'h:mm:ss A',
	        LT: 'h:mm A',
	        L: 'MM/DD/YYYY',
	        LL: 'MMMM D, YYYY',
	        LLL: 'MMMM D, YYYY h:mm A',
	        LLLL: 'dddd, MMMM D, YYYY h:mm A',
	    };

	    function longDateFormat(key) {
	        var format = this._longDateFormat[key],
	            formatUpper = this._longDateFormat[key.toUpperCase()];

	        if (format || !formatUpper) {
	            return format;
	        }

	        this._longDateFormat[key] = formatUpper
	            .match(formattingTokens)
	            .map(function (tok) {
	                if (
	                    tok === 'MMMM' ||
	                    tok === 'MM' ||
	                    tok === 'DD' ||
	                    tok === 'dddd'
	                ) {
	                    return tok.slice(1);
	                }
	                return tok;
	            })
	            .join('');

	        return this._longDateFormat[key];
	    }

	    var defaultInvalidDate = 'Invalid date';

	    function invalidDate() {
	        return this._invalidDate;
	    }

	    var defaultOrdinal = '%d',
	        defaultDayOfMonthOrdinalParse = /\d{1,2}/;

	    function ordinal(number) {
	        return this._ordinal.replace('%d', number);
	    }

	    var defaultRelativeTime = {
	        future: 'in %s',
	        past: '%s ago',
	        s: 'a few seconds',
	        ss: '%d seconds',
	        m: 'a minute',
	        mm: '%d minutes',
	        h: 'an hour',
	        hh: '%d hours',
	        d: 'a day',
	        dd: '%d days',
	        w: 'a week',
	        ww: '%d weeks',
	        M: 'a month',
	        MM: '%d months',
	        y: 'a year',
	        yy: '%d years',
	    };

	    function relativeTime(number, withoutSuffix, string, isFuture) {
	        var output = this._relativeTime[string];
	        return isFunction(output)
	            ? output(number, withoutSuffix, string, isFuture)
	            : output.replace(/%d/i, number);
	    }

	    function pastFuture(diff, output) {
	        var format = this._relativeTime[diff > 0 ? 'future' : 'past'];
	        return isFunction(format) ? format(output) : format.replace(/%s/i, output);
	    }

	    var aliases = {
	        D: 'date',
	        dates: 'date',
	        date: 'date',
	        d: 'day',
	        days: 'day',
	        day: 'day',
	        e: 'weekday',
	        weekdays: 'weekday',
	        weekday: 'weekday',
	        E: 'isoWeekday',
	        isoweekdays: 'isoWeekday',
	        isoweekday: 'isoWeekday',
	        DDD: 'dayOfYear',
	        dayofyears: 'dayOfYear',
	        dayofyear: 'dayOfYear',
	        h: 'hour',
	        hours: 'hour',
	        hour: 'hour',
	        ms: 'millisecond',
	        milliseconds: 'millisecond',
	        millisecond: 'millisecond',
	        m: 'minute',
	        minutes: 'minute',
	        minute: 'minute',
	        M: 'month',
	        months: 'month',
	        month: 'month',
	        Q: 'quarter',
	        quarters: 'quarter',
	        quarter: 'quarter',
	        s: 'second',
	        seconds: 'second',
	        second: 'second',
	        gg: 'weekYear',
	        weekyears: 'weekYear',
	        weekyear: 'weekYear',
	        GG: 'isoWeekYear',
	        isoweekyears: 'isoWeekYear',
	        isoweekyear: 'isoWeekYear',
	        w: 'week',
	        weeks: 'week',
	        week: 'week',
	        W: 'isoWeek',
	        isoweeks: 'isoWeek',
	        isoweek: 'isoWeek',
	        y: 'year',
	        years: 'year',
	        year: 'year',
	    };

	    function normalizeUnits(units) {
	        return typeof units === 'string'
	            ? aliases[units] || aliases[units.toLowerCase()]
	            : undefined;
	    }

	    function normalizeObjectUnits(inputObject) {
	        var normalizedInput = {},
	            normalizedProp,
	            prop;

	        for (prop in inputObject) {
	            if (hasOwnProp(inputObject, prop)) {
	                normalizedProp = normalizeUnits(prop);
	                if (normalizedProp) {
	                    normalizedInput[normalizedProp] = inputObject[prop];
	                }
	            }
	        }

	        return normalizedInput;
	    }

	    var priorities = {
	        date: 9,
	        day: 11,
	        weekday: 11,
	        isoWeekday: 11,
	        dayOfYear: 4,
	        hour: 13,
	        millisecond: 16,
	        minute: 14,
	        month: 8,
	        quarter: 7,
	        second: 15,
	        weekYear: 1,
	        isoWeekYear: 1,
	        week: 5,
	        isoWeek: 5,
	        year: 1,
	    };

	    function getPrioritizedUnits(unitsObj) {
	        var units = [],
	            u;
	        for (u in unitsObj) {
	            if (hasOwnProp(unitsObj, u)) {
	                units.push({ unit: u, priority: priorities[u] });
	            }
	        }
	        units.sort(function (a, b) {
	            return a.priority - b.priority;
	        });
	        return units;
	    }

	    var match1 = /\d/, //       0 - 9
	        match2 = /\d\d/, //      00 - 99
	        match3 = /\d{3}/, //     000 - 999
	        match4 = /\d{4}/, //    0000 - 9999
	        match6 = /[+-]?\d{6}/, // -999999 - 999999
	        match1to2 = /\d\d?/, //       0 - 99
	        match3to4 = /\d\d\d\d?/, //     999 - 9999
	        match5to6 = /\d\d\d\d\d\d?/, //   99999 - 999999
	        match1to3 = /\d{1,3}/, //       0 - 999
	        match1to4 = /\d{1,4}/, //       0 - 9999
	        match1to6 = /[+-]?\d{1,6}/, // -999999 - 999999
	        matchUnsigned = /\d+/, //       0 - inf
	        matchSigned = /[+-]?\d+/, //    -inf - inf
	        matchOffset = /Z|[+-]\d\d:?\d\d/gi, // +00:00 -00:00 +0000 -0000 or Z
	        matchShortOffset = /Z|[+-]\d\d(?::?\d\d)?/gi, // +00 -00 +00:00 -00:00 +0000 -0000 or Z
	        matchTimestamp = /[+-]?\d+(\.\d{1,3})?/, // 123456789 123456789.123
	        // any word (or two) characters or numbers including two/three word month in arabic.
	        // includes scottish gaelic two word and hyphenated months
	        matchWord =
	            /[0-9]{0,256}['a-z\u00A0-\u05FF\u0700-\uD7FF\uF900-\uFDCF\uFDF0-\uFF07\uFF10-\uFFEF]{1,256}|[\u0600-\u06FF\/]{1,256}(\s*?[\u0600-\u06FF]{1,256}){1,2}/i,
	        match1to2NoLeadingZero = /^[1-9]\d?/, //         1-99
	        match1to2HasZero = /^([1-9]\d|\d)/, //           0-99
	        regexes;

	    regexes = {};

	    function addRegexToken(token, regex, strictRegex) {
	        regexes[token] = isFunction(regex)
	            ? regex
	            : function (isStrict, localeData) {
	                  return isStrict && strictRegex ? strictRegex : regex;
	              };
	    }

	    function getParseRegexForToken(token, config) {
	        if (!hasOwnProp(regexes, token)) {
	            return new RegExp(unescapeFormat(token));
	        }

	        return regexes[token](config._strict, config._locale);
	    }

	    // Code from http://stackoverflow.com/questions/3561493/is-there-a-regexp-escape-function-in-javascript
	    function unescapeFormat(s) {
	        return regexEscape(
	            s
	                .replace('\\', '')
	                .replace(
	                    /\\(\[)|\\(\])|\[([^\]\[]*)\]|\\(.)/g,
	                    function (matched, p1, p2, p3, p4) {
	                        return p1 || p2 || p3 || p4;
	                    }
	                )
	        );
	    }

	    function regexEscape(s) {
	        return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
	    }

	    function absFloor(number) {
	        if (number < 0) {
	            // -0 -> 0
	            return Math.ceil(number) || 0;
	        } else {
	            return Math.floor(number);
	        }
	    }

	    function toInt(argumentForCoercion) {
	        var coercedNumber = +argumentForCoercion,
	            value = 0;

	        if (coercedNumber !== 0 && isFinite(coercedNumber)) {
	            value = absFloor(coercedNumber);
	        }

	        return value;
	    }

	    var tokens = {};

	    function addParseToken(token, callback) {
	        var i,
	            func = callback,
	            tokenLen;
	        if (typeof token === 'string') {
	            token = [token];
	        }
	        if (isNumber(callback)) {
	            func = function (input, array) {
	                array[callback] = toInt(input);
	            };
	        }
	        tokenLen = token.length;
	        for (i = 0; i < tokenLen; i++) {
	            tokens[token[i]] = func;
	        }
	    }

	    function addWeekParseToken(token, callback) {
	        addParseToken(token, function (input, array, config, token) {
	            config._w = config._w || {};
	            callback(input, config._w, config, token);
	        });
	    }

	    function addTimeToArrayFromToken(token, input, config) {
	        if (input != null && hasOwnProp(tokens, token)) {
	            tokens[token](input, config._a, config, token);
	        }
	    }

	    function isLeapYear(year) {
	        return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
	    }

	    var YEAR = 0,
	        MONTH = 1,
	        DATE = 2,
	        HOUR = 3,
	        MINUTE = 4,
	        SECOND = 5,
	        MILLISECOND = 6,
	        WEEK = 7,
	        WEEKDAY = 8;

	    // FORMATTING

	    addFormatToken('Y', 0, 0, function () {
	        var y = this.year();
	        return y <= 9999 ? zeroFill(y, 4) : '+' + y;
	    });

	    addFormatToken(0, ['YY', 2], 0, function () {
	        return this.year() % 100;
	    });

	    addFormatToken(0, ['YYYY', 4], 0, 'year');
	    addFormatToken(0, ['YYYYY', 5], 0, 'year');
	    addFormatToken(0, ['YYYYYY', 6, true], 0, 'year');

	    // PARSING

	    addRegexToken('Y', matchSigned);
	    addRegexToken('YY', match1to2, match2);
	    addRegexToken('YYYY', match1to4, match4);
	    addRegexToken('YYYYY', match1to6, match6);
	    addRegexToken('YYYYYY', match1to6, match6);

	    addParseToken(['YYYYY', 'YYYYYY'], YEAR);
	    addParseToken('YYYY', function (input, array) {
	        array[YEAR] =
	            input.length === 2 ? hooks.parseTwoDigitYear(input) : toInt(input);
	    });
	    addParseToken('YY', function (input, array) {
	        array[YEAR] = hooks.parseTwoDigitYear(input);
	    });
	    addParseToken('Y', function (input, array) {
	        array[YEAR] = parseInt(input, 10);
	    });

	    // HELPERS

	    function daysInYear(year) {
	        return isLeapYear(year) ? 366 : 365;
	    }

	    // HOOKS

	    hooks.parseTwoDigitYear = function (input) {
	        return toInt(input) + (toInt(input) > 68 ? 1900 : 2000);
	    };

	    // MOMENTS

	    var getSetYear = makeGetSet('FullYear', true);

	    function getIsLeapYear() {
	        return isLeapYear(this.year());
	    }

	    function makeGetSet(unit, keepTime) {
	        return function (value) {
	            if (value != null) {
	                set$1(this, unit, value);
	                hooks.updateOffset(this, keepTime);
	                return this;
	            } else {
	                return get(this, unit);
	            }
	        };
	    }

	    function get(mom, unit) {
	        if (!mom.isValid()) {
	            return NaN;
	        }

	        var d = mom._d,
	            isUTC = mom._isUTC;

	        switch (unit) {
	            case 'Milliseconds':
	                return isUTC ? d.getUTCMilliseconds() : d.getMilliseconds();
	            case 'Seconds':
	                return isUTC ? d.getUTCSeconds() : d.getSeconds();
	            case 'Minutes':
	                return isUTC ? d.getUTCMinutes() : d.getMinutes();
	            case 'Hours':
	                return isUTC ? d.getUTCHours() : d.getHours();
	            case 'Date':
	                return isUTC ? d.getUTCDate() : d.getDate();
	            case 'Day':
	                return isUTC ? d.getUTCDay() : d.getDay();
	            case 'Month':
	                return isUTC ? d.getUTCMonth() : d.getMonth();
	            case 'FullYear':
	                return isUTC ? d.getUTCFullYear() : d.getFullYear();
	            default:
	                return NaN; // Just in case
	        }
	    }

	    function set$1(mom, unit, value) {
	        var d, isUTC, year, month, date;

	        if (!mom.isValid() || isNaN(value)) {
	            return;
	        }

	        d = mom._d;
	        isUTC = mom._isUTC;

	        switch (unit) {
	            case 'Milliseconds':
	                return void (isUTC
	                    ? d.setUTCMilliseconds(value)
	                    : d.setMilliseconds(value));
	            case 'Seconds':
	                return void (isUTC ? d.setUTCSeconds(value) : d.setSeconds(value));
	            case 'Minutes':
	                return void (isUTC ? d.setUTCMinutes(value) : d.setMinutes(value));
	            case 'Hours':
	                return void (isUTC ? d.setUTCHours(value) : d.setHours(value));
	            case 'Date':
	                return void (isUTC ? d.setUTCDate(value) : d.setDate(value));
	            // case 'Day': // Not real
	            //    return void (isUTC ? d.setUTCDay(value) : d.setDay(value));
	            // case 'Month': // Not used because we need to pass two variables
	            //     return void (isUTC ? d.setUTCMonth(value) : d.setMonth(value));
	            case 'FullYear':
	                break; // See below ...
	            default:
	                return; // Just in case
	        }

	        year = value;
	        month = mom.month();
	        date = mom.date();
	        date = date === 29 && month === 1 && !isLeapYear(year) ? 28 : date;
	        void (isUTC
	            ? d.setUTCFullYear(year, month, date)
	            : d.setFullYear(year, month, date));
	    }

	    // MOMENTS

	    function stringGet(units) {
	        units = normalizeUnits(units);
	        if (isFunction(this[units])) {
	            return this[units]();
	        }
	        return this;
	    }

	    function stringSet(units, value) {
	        if (typeof units === 'object') {
	            units = normalizeObjectUnits(units);
	            var prioritized = getPrioritizedUnits(units),
	                i,
	                prioritizedLen = prioritized.length;
	            for (i = 0; i < prioritizedLen; i++) {
	                this[prioritized[i].unit](units[prioritized[i].unit]);
	            }
	        } else {
	            units = normalizeUnits(units);
	            if (isFunction(this[units])) {
	                return this[units](value);
	            }
	        }
	        return this;
	    }

	    function mod(n, x) {
	        return ((n % x) + x) % x;
	    }

	    var indexOf;

	    if (Array.prototype.indexOf) {
	        indexOf = Array.prototype.indexOf;
	    } else {
	        indexOf = function (o) {
	            // I know
	            var i;
	            for (i = 0; i < this.length; ++i) {
	                if (this[i] === o) {
	                    return i;
	                }
	            }
	            return -1;
	        };
	    }

	    function daysInMonth(year, month) {
	        if (isNaN(year) || isNaN(month)) {
	            return NaN;
	        }
	        var modMonth = mod(month, 12);
	        year += (month - modMonth) / 12;
	        return modMonth === 1
	            ? isLeapYear(year)
	                ? 29
	                : 28
	            : 31 - ((modMonth % 7) % 2);
	    }

	    // FORMATTING

	    addFormatToken('M', ['MM', 2], 'Mo', function () {
	        return this.month() + 1;
	    });

	    addFormatToken('MMM', 0, 0, function (format) {
	        return this.localeData().monthsShort(this, format);
	    });

	    addFormatToken('MMMM', 0, 0, function (format) {
	        return this.localeData().months(this, format);
	    });

	    // PARSING

	    addRegexToken('M', match1to2, match1to2NoLeadingZero);
	    addRegexToken('MM', match1to2, match2);
	    addRegexToken('MMM', function (isStrict, locale) {
	        return locale.monthsShortRegex(isStrict);
	    });
	    addRegexToken('MMMM', function (isStrict, locale) {
	        return locale.monthsRegex(isStrict);
	    });

	    addParseToken(['M', 'MM'], function (input, array) {
	        array[MONTH] = toInt(input) - 1;
	    });

	    addParseToken(['MMM', 'MMMM'], function (input, array, config, token) {
	        var month = config._locale.monthsParse(input, token, config._strict);
	        // if we didn't find a month name, mark the date as invalid.
	        if (month != null) {
	            array[MONTH] = month;
	        } else {
	            getParsingFlags(config).invalidMonth = input;
	        }
	    });

	    // LOCALES

	    var defaultLocaleMonths =
	            'January_February_March_April_May_June_July_August_September_October_November_December'.split(
	                '_'
	            ),
	        defaultLocaleMonthsShort =
	            'Jan_Feb_Mar_Apr_May_Jun_Jul_Aug_Sep_Oct_Nov_Dec'.split('_'),
	        MONTHS_IN_FORMAT = /D[oD]?(\[[^\[\]]*\]|\s)+MMMM?/,
	        defaultMonthsShortRegex = matchWord,
	        defaultMonthsRegex = matchWord;

	    function localeMonths(m, format) {
	        if (!m) {
	            return isArray(this._months)
	                ? this._months
	                : this._months['standalone'];
	        }
	        return isArray(this._months)
	            ? this._months[m.month()]
	            : this._months[
	                  (this._months.isFormat || MONTHS_IN_FORMAT).test(format)
	                      ? 'format'
	                      : 'standalone'
	              ][m.month()];
	    }

	    function localeMonthsShort(m, format) {
	        if (!m) {
	            return isArray(this._monthsShort)
	                ? this._monthsShort
	                : this._monthsShort['standalone'];
	        }
	        return isArray(this._monthsShort)
	            ? this._monthsShort[m.month()]
	            : this._monthsShort[
	                  MONTHS_IN_FORMAT.test(format) ? 'format' : 'standalone'
	              ][m.month()];
	    }

	    function handleStrictParse(monthName, format, strict) {
	        var i,
	            ii,
	            mom,
	            llc = monthName.toLocaleLowerCase();
	        if (!this._monthsParse) {
	            // this is not used
	            this._monthsParse = [];
	            this._longMonthsParse = [];
	            this._shortMonthsParse = [];
	            for (i = 0; i < 12; ++i) {
	                mom = createUTC([2000, i]);
	                this._shortMonthsParse[i] = this.monthsShort(
	                    mom,
	                    ''
	                ).toLocaleLowerCase();
	                this._longMonthsParse[i] = this.months(mom, '').toLocaleLowerCase();
	            }
	        }

	        if (strict) {
	            if (format === 'MMM') {
	                ii = indexOf.call(this._shortMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._longMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        } else {
	            if (format === 'MMM') {
	                ii = indexOf.call(this._shortMonthsParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._longMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._longMonthsParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._shortMonthsParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        }
	    }

	    function localeMonthsParse(monthName, format, strict) {
	        var i, mom, regex;

	        if (this._monthsParseExact) {
	            return handleStrictParse.call(this, monthName, format, strict);
	        }

	        if (!this._monthsParse) {
	            this._monthsParse = [];
	            this._longMonthsParse = [];
	            this._shortMonthsParse = [];
	        }

	        // TODO: add sorting
	        // Sorting makes sure if one month (or abbr) is a prefix of another
	        // see sorting in computeMonthsParse
	        for (i = 0; i < 12; i++) {
	            // make the regex if we don't have it already
	            mom = createUTC([2000, i]);
	            if (strict && !this._longMonthsParse[i]) {
	                this._longMonthsParse[i] = new RegExp(
	                    '^' + this.months(mom, '').replace('.', '') + '$',
	                    'i'
	                );
	                this._shortMonthsParse[i] = new RegExp(
	                    '^' + this.monthsShort(mom, '').replace('.', '') + '$',
	                    'i'
	                );
	            }
	            if (!strict && !this._monthsParse[i]) {
	                regex =
	                    '^' + this.months(mom, '') + '|^' + this.monthsShort(mom, '');
	                this._monthsParse[i] = new RegExp(regex.replace('.', ''), 'i');
	            }
	            // test the regex
	            if (
	                strict &&
	                format === 'MMMM' &&
	                this._longMonthsParse[i].test(monthName)
	            ) {
	                return i;
	            } else if (
	                strict &&
	                format === 'MMM' &&
	                this._shortMonthsParse[i].test(monthName)
	            ) {
	                return i;
	            } else if (!strict && this._monthsParse[i].test(monthName)) {
	                return i;
	            }
	        }
	    }

	    // MOMENTS

	    function setMonth(mom, value) {
	        if (!mom.isValid()) {
	            // No op
	            return mom;
	        }

	        if (typeof value === 'string') {
	            if (/^\d+$/.test(value)) {
	                value = toInt(value);
	            } else {
	                value = mom.localeData().monthsParse(value);
	                // TODO: Another silent failure?
	                if (!isNumber(value)) {
	                    return mom;
	                }
	            }
	        }

	        var month = value,
	            date = mom.date();

	        date = date < 29 ? date : Math.min(date, daysInMonth(mom.year(), month));
	        void (mom._isUTC
	            ? mom._d.setUTCMonth(month, date)
	            : mom._d.setMonth(month, date));
	        return mom;
	    }

	    function getSetMonth(value) {
	        if (value != null) {
	            setMonth(this, value);
	            hooks.updateOffset(this, true);
	            return this;
	        } else {
	            return get(this, 'Month');
	        }
	    }

	    function getDaysInMonth() {
	        return daysInMonth(this.year(), this.month());
	    }

	    function monthsShortRegex(isStrict) {
	        if (this._monthsParseExact) {
	            if (!hasOwnProp(this, '_monthsRegex')) {
	                computeMonthsParse.call(this);
	            }
	            if (isStrict) {
	                return this._monthsShortStrictRegex;
	            } else {
	                return this._monthsShortRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_monthsShortRegex')) {
	                this._monthsShortRegex = defaultMonthsShortRegex;
	            }
	            return this._monthsShortStrictRegex && isStrict
	                ? this._monthsShortStrictRegex
	                : this._monthsShortRegex;
	        }
	    }

	    function monthsRegex(isStrict) {
	        if (this._monthsParseExact) {
	            if (!hasOwnProp(this, '_monthsRegex')) {
	                computeMonthsParse.call(this);
	            }
	            if (isStrict) {
	                return this._monthsStrictRegex;
	            } else {
	                return this._monthsRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_monthsRegex')) {
	                this._monthsRegex = defaultMonthsRegex;
	            }
	            return this._monthsStrictRegex && isStrict
	                ? this._monthsStrictRegex
	                : this._monthsRegex;
	        }
	    }

	    function computeMonthsParse() {
	        function cmpLenRev(a, b) {
	            return b.length - a.length;
	        }

	        var shortPieces = [],
	            longPieces = [],
	            mixedPieces = [],
	            i,
	            mom,
	            shortP,
	            longP;
	        for (i = 0; i < 12; i++) {
	            // make the regex if we don't have it already
	            mom = createUTC([2000, i]);
	            shortP = regexEscape(this.monthsShort(mom, ''));
	            longP = regexEscape(this.months(mom, ''));
	            shortPieces.push(shortP);
	            longPieces.push(longP);
	            mixedPieces.push(longP);
	            mixedPieces.push(shortP);
	        }
	        // Sorting makes sure if one month (or abbr) is a prefix of another it
	        // will match the longer piece.
	        shortPieces.sort(cmpLenRev);
	        longPieces.sort(cmpLenRev);
	        mixedPieces.sort(cmpLenRev);

	        this._monthsRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	        this._monthsShortRegex = this._monthsRegex;
	        this._monthsStrictRegex = new RegExp(
	            '^(' + longPieces.join('|') + ')',
	            'i'
	        );
	        this._monthsShortStrictRegex = new RegExp(
	            '^(' + shortPieces.join('|') + ')',
	            'i'
	        );
	    }

	    function createDate(y, m, d, h, M, s, ms) {
	        // can't just apply() to create a date:
	        // https://stackoverflow.com/q/181348
	        var date;
	        // the date constructor remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            // preserve leap years using a full 400 year cycle, then reset
	            date = new Date(y + 400, m, d, h, M, s, ms);
	            if (isFinite(date.getFullYear())) {
	                date.setFullYear(y);
	            }
	        } else {
	            date = new Date(y, m, d, h, M, s, ms);
	        }

	        return date;
	    }

	    function createUTCDate(y) {
	        var date, args;
	        // the Date.UTC function remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            args = Array.prototype.slice.call(arguments);
	            // preserve leap years using a full 400 year cycle, then reset
	            args[0] = y + 400;
	            date = new Date(Date.UTC.apply(null, args));
	            if (isFinite(date.getUTCFullYear())) {
	                date.setUTCFullYear(y);
	            }
	        } else {
	            date = new Date(Date.UTC.apply(null, arguments));
	        }

	        return date;
	    }

	    // start-of-first-week - start-of-year
	    function firstWeekOffset(year, dow, doy) {
	        var // first-week day -- which january is always in the first week (4 for iso, 1 for other)
	            fwd = 7 + dow - doy,
	            // first-week day local weekday -- which local weekday is fwd
	            fwdlw = (7 + createUTCDate(year, 0, fwd).getUTCDay() - dow) % 7;

	        return -fwdlw + fwd - 1;
	    }

	    // https://en.wikipedia.org/wiki/ISO_week_date#Calculating_a_date_given_the_year.2C_week_number_and_weekday
	    function dayOfYearFromWeeks(year, week, weekday, dow, doy) {
	        var localWeekday = (7 + weekday - dow) % 7,
	            weekOffset = firstWeekOffset(year, dow, doy),
	            dayOfYear = 1 + 7 * (week - 1) + localWeekday + weekOffset,
	            resYear,
	            resDayOfYear;

	        if (dayOfYear <= 0) {
	            resYear = year - 1;
	            resDayOfYear = daysInYear(resYear) + dayOfYear;
	        } else if (dayOfYear > daysInYear(year)) {
	            resYear = year + 1;
	            resDayOfYear = dayOfYear - daysInYear(year);
	        } else {
	            resYear = year;
	            resDayOfYear = dayOfYear;
	        }

	        return {
	            year: resYear,
	            dayOfYear: resDayOfYear,
	        };
	    }

	    function weekOfYear(mom, dow, doy) {
	        var weekOffset = firstWeekOffset(mom.year(), dow, doy),
	            week = Math.floor((mom.dayOfYear() - weekOffset - 1) / 7) + 1,
	            resWeek,
	            resYear;

	        if (week < 1) {
	            resYear = mom.year() - 1;
	            resWeek = week + weeksInYear(resYear, dow, doy);
	        } else if (week > weeksInYear(mom.year(), dow, doy)) {
	            resWeek = week - weeksInYear(mom.year(), dow, doy);
	            resYear = mom.year() + 1;
	        } else {
	            resYear = mom.year();
	            resWeek = week;
	        }

	        return {
	            week: resWeek,
	            year: resYear,
	        };
	    }

	    function weeksInYear(year, dow, doy) {
	        var weekOffset = firstWeekOffset(year, dow, doy),
	            weekOffsetNext = firstWeekOffset(year + 1, dow, doy);
	        return (daysInYear(year) - weekOffset + weekOffsetNext) / 7;
	    }

	    // FORMATTING

	    addFormatToken('w', ['ww', 2], 'wo', 'week');
	    addFormatToken('W', ['WW', 2], 'Wo', 'isoWeek');

	    // PARSING

	    addRegexToken('w', match1to2, match1to2NoLeadingZero);
	    addRegexToken('ww', match1to2, match2);
	    addRegexToken('W', match1to2, match1to2NoLeadingZero);
	    addRegexToken('WW', match1to2, match2);

	    addWeekParseToken(
	        ['w', 'ww', 'W', 'WW'],
	        function (input, week, config, token) {
	            week[token.substr(0, 1)] = toInt(input);
	        }
	    );

	    // HELPERS

	    // LOCALES

	    function localeWeek(mom) {
	        return weekOfYear(mom, this._week.dow, this._week.doy).week;
	    }

	    var defaultLocaleWeek = {
	        dow: 0, // Sunday is the first day of the week.
	        doy: 6, // The week that contains Jan 6th is the first week of the year.
	    };

	    function localeFirstDayOfWeek() {
	        return this._week.dow;
	    }

	    function localeFirstDayOfYear() {
	        return this._week.doy;
	    }

	    // MOMENTS

	    function getSetWeek(input) {
	        var week = this.localeData().week(this);
	        return input == null ? week : this.add((input - week) * 7, 'd');
	    }

	    function getSetISOWeek(input) {
	        var week = weekOfYear(this, 1, 4).week;
	        return input == null ? week : this.add((input - week) * 7, 'd');
	    }

	    // FORMATTING

	    addFormatToken('d', 0, 'do', 'day');

	    addFormatToken('dd', 0, 0, function (format) {
	        return this.localeData().weekdaysMin(this, format);
	    });

	    addFormatToken('ddd', 0, 0, function (format) {
	        return this.localeData().weekdaysShort(this, format);
	    });

	    addFormatToken('dddd', 0, 0, function (format) {
	        return this.localeData().weekdays(this, format);
	    });

	    addFormatToken('e', 0, 0, 'weekday');
	    addFormatToken('E', 0, 0, 'isoWeekday');

	    // PARSING

	    addRegexToken('d', match1to2);
	    addRegexToken('e', match1to2);
	    addRegexToken('E', match1to2);
	    addRegexToken('dd', function (isStrict, locale) {
	        return locale.weekdaysMinRegex(isStrict);
	    });
	    addRegexToken('ddd', function (isStrict, locale) {
	        return locale.weekdaysShortRegex(isStrict);
	    });
	    addRegexToken('dddd', function (isStrict, locale) {
	        return locale.weekdaysRegex(isStrict);
	    });

	    addWeekParseToken(['dd', 'ddd', 'dddd'], function (input, week, config, token) {
	        var weekday = config._locale.weekdaysParse(input, token, config._strict);
	        // if we didn't get a weekday name, mark the date as invalid
	        if (weekday != null) {
	            week.d = weekday;
	        } else {
	            getParsingFlags(config).invalidWeekday = input;
	        }
	    });

	    addWeekParseToken(['d', 'e', 'E'], function (input, week, config, token) {
	        week[token] = toInt(input);
	    });

	    // HELPERS

	    function parseWeekday(input, locale) {
	        if (typeof input !== 'string') {
	            return input;
	        }

	        if (!isNaN(input)) {
	            return parseInt(input, 10);
	        }

	        input = locale.weekdaysParse(input);
	        if (typeof input === 'number') {
	            return input;
	        }

	        return null;
	    }

	    function parseIsoWeekday(input, locale) {
	        if (typeof input === 'string') {
	            return locale.weekdaysParse(input) % 7 || 7;
	        }
	        return isNaN(input) ? null : input;
	    }

	    // LOCALES
	    function shiftWeekdays(ws, n) {
	        return ws.slice(n, 7).concat(ws.slice(0, n));
	    }

	    var defaultLocaleWeekdays =
	            'Sunday_Monday_Tuesday_Wednesday_Thursday_Friday_Saturday'.split('_'),
	        defaultLocaleWeekdaysShort = 'Sun_Mon_Tue_Wed_Thu_Fri_Sat'.split('_'),
	        defaultLocaleWeekdaysMin = 'Su_Mo_Tu_We_Th_Fr_Sa'.split('_'),
	        defaultWeekdaysRegex = matchWord,
	        defaultWeekdaysShortRegex = matchWord,
	        defaultWeekdaysMinRegex = matchWord;

	    function localeWeekdays(m, format) {
	        var weekdays = isArray(this._weekdays)
	            ? this._weekdays
	            : this._weekdays[
	                  m && m !== true && this._weekdays.isFormat.test(format)
	                      ? 'format'
	                      : 'standalone'
	              ];
	        return m === true
	            ? shiftWeekdays(weekdays, this._week.dow)
	            : m
	              ? weekdays[m.day()]
	              : weekdays;
	    }

	    function localeWeekdaysShort(m) {
	        return m === true
	            ? shiftWeekdays(this._weekdaysShort, this._week.dow)
	            : m
	              ? this._weekdaysShort[m.day()]
	              : this._weekdaysShort;
	    }

	    function localeWeekdaysMin(m) {
	        return m === true
	            ? shiftWeekdays(this._weekdaysMin, this._week.dow)
	            : m
	              ? this._weekdaysMin[m.day()]
	              : this._weekdaysMin;
	    }

	    function handleStrictParse$1(weekdayName, format, strict) {
	        var i,
	            ii,
	            mom,
	            llc = weekdayName.toLocaleLowerCase();
	        if (!this._weekdaysParse) {
	            this._weekdaysParse = [];
	            this._shortWeekdaysParse = [];
	            this._minWeekdaysParse = [];

	            for (i = 0; i < 7; ++i) {
	                mom = createUTC([2000, 1]).day(i);
	                this._minWeekdaysParse[i] = this.weekdaysMin(
	                    mom,
	                    ''
	                ).toLocaleLowerCase();
	                this._shortWeekdaysParse[i] = this.weekdaysShort(
	                    mom,
	                    ''
	                ).toLocaleLowerCase();
	                this._weekdaysParse[i] = this.weekdays(mom, '').toLocaleLowerCase();
	            }
	        }

	        if (strict) {
	            if (format === 'dddd') {
	                ii = indexOf.call(this._weekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else if (format === 'ddd') {
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        } else {
	            if (format === 'dddd') {
	                ii = indexOf.call(this._weekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else if (format === 'ddd') {
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._weekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            } else {
	                ii = indexOf.call(this._minWeekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._weekdaysParse, llc);
	                if (ii !== -1) {
	                    return ii;
	                }
	                ii = indexOf.call(this._shortWeekdaysParse, llc);
	                return ii !== -1 ? ii : null;
	            }
	        }
	    }

	    function localeWeekdaysParse(weekdayName, format, strict) {
	        var i, mom, regex;

	        if (this._weekdaysParseExact) {
	            return handleStrictParse$1.call(this, weekdayName, format, strict);
	        }

	        if (!this._weekdaysParse) {
	            this._weekdaysParse = [];
	            this._minWeekdaysParse = [];
	            this._shortWeekdaysParse = [];
	            this._fullWeekdaysParse = [];
	        }

	        for (i = 0; i < 7; i++) {
	            // make the regex if we don't have it already

	            mom = createUTC([2000, 1]).day(i);
	            if (strict && !this._fullWeekdaysParse[i]) {
	                this._fullWeekdaysParse[i] = new RegExp(
	                    '^' + this.weekdays(mom, '').replace('.', '\\.?') + '$',
	                    'i'
	                );
	                this._shortWeekdaysParse[i] = new RegExp(
	                    '^' + this.weekdaysShort(mom, '').replace('.', '\\.?') + '$',
	                    'i'
	                );
	                this._minWeekdaysParse[i] = new RegExp(
	                    '^' + this.weekdaysMin(mom, '').replace('.', '\\.?') + '$',
	                    'i'
	                );
	            }
	            if (!this._weekdaysParse[i]) {
	                regex =
	                    '^' +
	                    this.weekdays(mom, '') +
	                    '|^' +
	                    this.weekdaysShort(mom, '') +
	                    '|^' +
	                    this.weekdaysMin(mom, '');
	                this._weekdaysParse[i] = new RegExp(regex.replace('.', ''), 'i');
	            }
	            // test the regex
	            if (
	                strict &&
	                format === 'dddd' &&
	                this._fullWeekdaysParse[i].test(weekdayName)
	            ) {
	                return i;
	            } else if (
	                strict &&
	                format === 'ddd' &&
	                this._shortWeekdaysParse[i].test(weekdayName)
	            ) {
	                return i;
	            } else if (
	                strict &&
	                format === 'dd' &&
	                this._minWeekdaysParse[i].test(weekdayName)
	            ) {
	                return i;
	            } else if (!strict && this._weekdaysParse[i].test(weekdayName)) {
	                return i;
	            }
	        }
	    }

	    // MOMENTS

	    function getSetDayOfWeek(input) {
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }

	        var day = get(this, 'Day');
	        if (input != null) {
	            input = parseWeekday(input, this.localeData());
	            return this.add(input - day, 'd');
	        } else {
	            return day;
	        }
	    }

	    function getSetLocaleDayOfWeek(input) {
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }
	        var weekday = (this.day() + 7 - this.localeData()._week.dow) % 7;
	        return input == null ? weekday : this.add(input - weekday, 'd');
	    }

	    function getSetISODayOfWeek(input) {
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }

	        // behaves the same as moment#day except
	        // as a getter, returns 7 instead of 0 (1-7 range instead of 0-6)
	        // as a setter, sunday should belong to the previous week.

	        if (input != null) {
	            var weekday = parseIsoWeekday(input, this.localeData());
	            return this.day(this.day() % 7 ? weekday : weekday - 7);
	        } else {
	            return this.day() || 7;
	        }
	    }

	    function weekdaysRegex(isStrict) {
	        if (this._weekdaysParseExact) {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                computeWeekdaysParse.call(this);
	            }
	            if (isStrict) {
	                return this._weekdaysStrictRegex;
	            } else {
	                return this._weekdaysRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                this._weekdaysRegex = defaultWeekdaysRegex;
	            }
	            return this._weekdaysStrictRegex && isStrict
	                ? this._weekdaysStrictRegex
	                : this._weekdaysRegex;
	        }
	    }

	    function weekdaysShortRegex(isStrict) {
	        if (this._weekdaysParseExact) {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                computeWeekdaysParse.call(this);
	            }
	            if (isStrict) {
	                return this._weekdaysShortStrictRegex;
	            } else {
	                return this._weekdaysShortRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_weekdaysShortRegex')) {
	                this._weekdaysShortRegex = defaultWeekdaysShortRegex;
	            }
	            return this._weekdaysShortStrictRegex && isStrict
	                ? this._weekdaysShortStrictRegex
	                : this._weekdaysShortRegex;
	        }
	    }

	    function weekdaysMinRegex(isStrict) {
	        if (this._weekdaysParseExact) {
	            if (!hasOwnProp(this, '_weekdaysRegex')) {
	                computeWeekdaysParse.call(this);
	            }
	            if (isStrict) {
	                return this._weekdaysMinStrictRegex;
	            } else {
	                return this._weekdaysMinRegex;
	            }
	        } else {
	            if (!hasOwnProp(this, '_weekdaysMinRegex')) {
	                this._weekdaysMinRegex = defaultWeekdaysMinRegex;
	            }
	            return this._weekdaysMinStrictRegex && isStrict
	                ? this._weekdaysMinStrictRegex
	                : this._weekdaysMinRegex;
	        }
	    }

	    function computeWeekdaysParse() {
	        function cmpLenRev(a, b) {
	            return b.length - a.length;
	        }

	        var minPieces = [],
	            shortPieces = [],
	            longPieces = [],
	            mixedPieces = [],
	            i,
	            mom,
	            minp,
	            shortp,
	            longp;
	        for (i = 0; i < 7; i++) {
	            // make the regex if we don't have it already
	            mom = createUTC([2000, 1]).day(i);
	            minp = regexEscape(this.weekdaysMin(mom, ''));
	            shortp = regexEscape(this.weekdaysShort(mom, ''));
	            longp = regexEscape(this.weekdays(mom, ''));
	            minPieces.push(minp);
	            shortPieces.push(shortp);
	            longPieces.push(longp);
	            mixedPieces.push(minp);
	            mixedPieces.push(shortp);
	            mixedPieces.push(longp);
	        }
	        // Sorting makes sure if one weekday (or abbr) is a prefix of another it
	        // will match the longer piece.
	        minPieces.sort(cmpLenRev);
	        shortPieces.sort(cmpLenRev);
	        longPieces.sort(cmpLenRev);
	        mixedPieces.sort(cmpLenRev);

	        this._weekdaysRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	        this._weekdaysShortRegex = this._weekdaysRegex;
	        this._weekdaysMinRegex = this._weekdaysRegex;

	        this._weekdaysStrictRegex = new RegExp(
	            '^(' + longPieces.join('|') + ')',
	            'i'
	        );
	        this._weekdaysShortStrictRegex = new RegExp(
	            '^(' + shortPieces.join('|') + ')',
	            'i'
	        );
	        this._weekdaysMinStrictRegex = new RegExp(
	            '^(' + minPieces.join('|') + ')',
	            'i'
	        );
	    }

	    // FORMATTING

	    function hFormat() {
	        return this.hours() % 12 || 12;
	    }

	    function kFormat() {
	        return this.hours() || 24;
	    }

	    addFormatToken('H', ['HH', 2], 0, 'hour');
	    addFormatToken('h', ['hh', 2], 0, hFormat);
	    addFormatToken('k', ['kk', 2], 0, kFormat);

	    addFormatToken('hmm', 0, 0, function () {
	        return '' + hFormat.apply(this) + zeroFill(this.minutes(), 2);
	    });

	    addFormatToken('hmmss', 0, 0, function () {
	        return (
	            '' +
	            hFormat.apply(this) +
	            zeroFill(this.minutes(), 2) +
	            zeroFill(this.seconds(), 2)
	        );
	    });

	    addFormatToken('Hmm', 0, 0, function () {
	        return '' + this.hours() + zeroFill(this.minutes(), 2);
	    });

	    addFormatToken('Hmmss', 0, 0, function () {
	        return (
	            '' +
	            this.hours() +
	            zeroFill(this.minutes(), 2) +
	            zeroFill(this.seconds(), 2)
	        );
	    });

	    function meridiem(token, lowercase) {
	        addFormatToken(token, 0, 0, function () {
	            return this.localeData().meridiem(
	                this.hours(),
	                this.minutes(),
	                lowercase
	            );
	        });
	    }

	    meridiem('a', true);
	    meridiem('A', false);

	    // PARSING

	    function matchMeridiem(isStrict, locale) {
	        return locale._meridiemParse;
	    }

	    addRegexToken('a', matchMeridiem);
	    addRegexToken('A', matchMeridiem);
	    addRegexToken('H', match1to2, match1to2HasZero);
	    addRegexToken('h', match1to2, match1to2NoLeadingZero);
	    addRegexToken('k', match1to2, match1to2NoLeadingZero);
	    addRegexToken('HH', match1to2, match2);
	    addRegexToken('hh', match1to2, match2);
	    addRegexToken('kk', match1to2, match2);

	    addRegexToken('hmm', match3to4);
	    addRegexToken('hmmss', match5to6);
	    addRegexToken('Hmm', match3to4);
	    addRegexToken('Hmmss', match5to6);

	    addParseToken(['H', 'HH'], HOUR);
	    addParseToken(['k', 'kk'], function (input, array, config) {
	        var kInput = toInt(input);
	        array[HOUR] = kInput === 24 ? 0 : kInput;
	    });
	    addParseToken(['a', 'A'], function (input, array, config) {
	        config._isPm = config._locale.isPM(input);
	        config._meridiem = input;
	    });
	    addParseToken(['h', 'hh'], function (input, array, config) {
	        array[HOUR] = toInt(input);
	        getParsingFlags(config).bigHour = true;
	    });
	    addParseToken('hmm', function (input, array, config) {
	        var pos = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos));
	        array[MINUTE] = toInt(input.substr(pos));
	        getParsingFlags(config).bigHour = true;
	    });
	    addParseToken('hmmss', function (input, array, config) {
	        var pos1 = input.length - 4,
	            pos2 = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos1));
	        array[MINUTE] = toInt(input.substr(pos1, 2));
	        array[SECOND] = toInt(input.substr(pos2));
	        getParsingFlags(config).bigHour = true;
	    });
	    addParseToken('Hmm', function (input, array, config) {
	        var pos = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos));
	        array[MINUTE] = toInt(input.substr(pos));
	    });
	    addParseToken('Hmmss', function (input, array, config) {
	        var pos1 = input.length - 4,
	            pos2 = input.length - 2;
	        array[HOUR] = toInt(input.substr(0, pos1));
	        array[MINUTE] = toInt(input.substr(pos1, 2));
	        array[SECOND] = toInt(input.substr(pos2));
	    });

	    // LOCALES

	    function localeIsPM(input) {
	        // IE8 Quirks Mode & IE7 Standards Mode do not allow accessing strings like arrays
	        // Using charAt should be more compatible.
	        return (input + '').toLowerCase().charAt(0) === 'p';
	    }

	    var defaultLocaleMeridiemParse = /[ap]\.?m?\.?/i,
	        // Setting the hour should keep the time, because the user explicitly
	        // specified which hour they want. So trying to maintain the same hour (in
	        // a new timezone) makes sense. Adding/subtracting hours does not follow
	        // this rule.
	        getSetHour = makeGetSet('Hours', true);

	    function localeMeridiem(hours, minutes, isLower) {
	        if (hours > 11) {
	            return isLower ? 'pm' : 'PM';
	        } else {
	            return isLower ? 'am' : 'AM';
	        }
	    }

	    var baseConfig = {
	        calendar: defaultCalendar,
	        longDateFormat: defaultLongDateFormat,
	        invalidDate: defaultInvalidDate,
	        ordinal: defaultOrdinal,
	        dayOfMonthOrdinalParse: defaultDayOfMonthOrdinalParse,
	        relativeTime: defaultRelativeTime,

	        months: defaultLocaleMonths,
	        monthsShort: defaultLocaleMonthsShort,

	        week: defaultLocaleWeek,

	        weekdays: defaultLocaleWeekdays,
	        weekdaysMin: defaultLocaleWeekdaysMin,
	        weekdaysShort: defaultLocaleWeekdaysShort,

	        meridiemParse: defaultLocaleMeridiemParse,
	    };

	    // internal storage for locale config files
	    var locales = {},
	        localeFamilies = {},
	        globalLocale;

	    function commonPrefix(arr1, arr2) {
	        var i,
	            minl = Math.min(arr1.length, arr2.length);
	        for (i = 0; i < minl; i += 1) {
	            if (arr1[i] !== arr2[i]) {
	                return i;
	            }
	        }
	        return minl;
	    }

	    function normalizeLocale(key) {
	        return key ? key.toLowerCase().replace('_', '-') : key;
	    }

	    // pick the locale from the array
	    // try ['en-au', 'en-gb'] as 'en-au', 'en-gb', 'en', as in move through the list trying each
	    // substring from most specific to least, but move to the next array item if it's a more specific variant than the current root
	    function chooseLocale(names) {
	        var i = 0,
	            j,
	            next,
	            locale,
	            split;

	        while (i < names.length) {
	            split = normalizeLocale(names[i]).split('-');
	            j = split.length;
	            next = normalizeLocale(names[i + 1]);
	            next = next ? next.split('-') : null;
	            while (j > 0) {
	                locale = loadLocale(split.slice(0, j).join('-'));
	                if (locale) {
	                    return locale;
	                }
	                if (
	                    next &&
	                    next.length >= j &&
	                    commonPrefix(split, next) >= j - 1
	                ) {
	                    //the next array item is better than a shallower substring of this one
	                    break;
	                }
	                j--;
	            }
	            i++;
	        }
	        return globalLocale;
	    }

	    function isLocaleNameSane(name) {
	        // Prevent names that look like filesystem paths, i.e contain '/' or '\'
	        // Ensure name is available and function returns boolean
	        return !!(name && name.match('^[^/\\\\]*$'));
	    }

	    function loadLocale(name) {
	        var oldLocale = null,
	            aliasedRequire;
	        // TODO: Find a better way to register and load all the locales in Node
	        if (
	            locales[name] === undefined &&
	            'object' !== 'undefined' &&
	            module &&
	            module.exports &&
	            isLocaleNameSane(name)
	        ) {
	            try {
	                oldLocale = globalLocale._abbr;
	                aliasedRequire = commonjsRequire;
	                aliasedRequire('./locale/' + name);
	                getSetGlobalLocale(oldLocale);
	            } catch (e) {
	                // mark as not found to avoid repeating expensive file require call causing high CPU
	                // when trying to find en-US, en_US, en-us for every format call
	                locales[name] = null; // null means not found
	            }
	        }
	        return locales[name];
	    }

	    // This function will load locale and then set the global locale.  If
	    // no arguments are passed in, it will simply return the current global
	    // locale key.
	    function getSetGlobalLocale(key, values) {
	        var data;
	        if (key) {
	            if (isUndefined(values)) {
	                data = getLocale(key);
	            } else {
	                data = defineLocale(key, values);
	            }

	            if (data) {
	                // moment.duration._locale = moment._locale = data;
	                globalLocale = data;
	            } else {
	                if (typeof console !== 'undefined' && console.warn) {
	                    //warn user if arguments are passed but the locale could not be set
	                    console.warn(
	                        'Locale ' + key + ' not found. Did you forget to load it?'
	                    );
	                }
	            }
	        }

	        return globalLocale._abbr;
	    }

	    function defineLocale(name, config) {
	        if (config !== null) {
	            var locale,
	                parentConfig = baseConfig;
	            config.abbr = name;
	            if (locales[name] != null) {
	                deprecateSimple(
	                    'defineLocaleOverride',
	                    'use moment.updateLocale(localeName, config) to change ' +
	                        'an existing locale. moment.defineLocale(localeName, ' +
	                        'config) should only be used for creating a new locale ' +
	                        'See http://momentjs.com/guides/#/warnings/define-locale/ for more info.'
	                );
	                parentConfig = locales[name]._config;
	            } else if (config.parentLocale != null) {
	                if (locales[config.parentLocale] != null) {
	                    parentConfig = locales[config.parentLocale]._config;
	                } else {
	                    locale = loadLocale(config.parentLocale);
	                    if (locale != null) {
	                        parentConfig = locale._config;
	                    } else {
	                        if (!localeFamilies[config.parentLocale]) {
	                            localeFamilies[config.parentLocale] = [];
	                        }
	                        localeFamilies[config.parentLocale].push({
	                            name: name,
	                            config: config,
	                        });
	                        return null;
	                    }
	                }
	            }
	            locales[name] = new Locale(mergeConfigs(parentConfig, config));

	            if (localeFamilies[name]) {
	                localeFamilies[name].forEach(function (x) {
	                    defineLocale(x.name, x.config);
	                });
	            }

	            // backwards compat for now: also set the locale
	            // make sure we set the locale AFTER all child locales have been
	            // created, so we won't end up with the child locale set.
	            getSetGlobalLocale(name);

	            return locales[name];
	        } else {
	            // useful for testing
	            delete locales[name];
	            return null;
	        }
	    }

	    function updateLocale(name, config) {
	        if (config != null) {
	            var locale,
	                tmpLocale,
	                parentConfig = baseConfig;

	            if (locales[name] != null && locales[name].parentLocale != null) {
	                // Update existing child locale in-place to avoid memory-leaks
	                locales[name].set(mergeConfigs(locales[name]._config, config));
	            } else {
	                // MERGE
	                tmpLocale = loadLocale(name);
	                if (tmpLocale != null) {
	                    parentConfig = tmpLocale._config;
	                }
	                config = mergeConfigs(parentConfig, config);
	                if (tmpLocale == null) {
	                    // updateLocale is called for creating a new locale
	                    // Set abbr so it will have a name (getters return
	                    // undefined otherwise).
	                    config.abbr = name;
	                }
	                locale = new Locale(config);
	                locale.parentLocale = locales[name];
	                locales[name] = locale;
	            }

	            // backwards compat for now: also set the locale
	            getSetGlobalLocale(name);
	        } else {
	            // pass null for config to unupdate, useful for tests
	            if (locales[name] != null) {
	                if (locales[name].parentLocale != null) {
	                    locales[name] = locales[name].parentLocale;
	                    if (name === getSetGlobalLocale()) {
	                        getSetGlobalLocale(name);
	                    }
	                } else if (locales[name] != null) {
	                    delete locales[name];
	                }
	            }
	        }
	        return locales[name];
	    }

	    // returns locale data
	    function getLocale(key) {
	        var locale;

	        if (key && key._locale && key._locale._abbr) {
	            key = key._locale._abbr;
	        }

	        if (!key) {
	            return globalLocale;
	        }

	        if (!isArray(key)) {
	            //short-circuit everything else
	            locale = loadLocale(key);
	            if (locale) {
	                return locale;
	            }
	            key = [key];
	        }

	        return chooseLocale(key);
	    }

	    function listLocales() {
	        return keys(locales);
	    }

	    function checkOverflow(m) {
	        var overflow,
	            a = m._a;

	        if (a && getParsingFlags(m).overflow === -2) {
	            overflow =
	                a[MONTH] < 0 || a[MONTH] > 11
	                    ? MONTH
	                    : a[DATE] < 1 || a[DATE] > daysInMonth(a[YEAR], a[MONTH])
	                      ? DATE
	                      : a[HOUR] < 0 ||
	                          a[HOUR] > 24 ||
	                          (a[HOUR] === 24 &&
	                              (a[MINUTE] !== 0 ||
	                                  a[SECOND] !== 0 ||
	                                  a[MILLISECOND] !== 0))
	                        ? HOUR
	                        : a[MINUTE] < 0 || a[MINUTE] > 59
	                          ? MINUTE
	                          : a[SECOND] < 0 || a[SECOND] > 59
	                            ? SECOND
	                            : a[MILLISECOND] < 0 || a[MILLISECOND] > 999
	                              ? MILLISECOND
	                              : -1;

	            if (
	                getParsingFlags(m)._overflowDayOfYear &&
	                (overflow < YEAR || overflow > DATE)
	            ) {
	                overflow = DATE;
	            }
	            if (getParsingFlags(m)._overflowWeeks && overflow === -1) {
	                overflow = WEEK;
	            }
	            if (getParsingFlags(m)._overflowWeekday && overflow === -1) {
	                overflow = WEEKDAY;
	            }

	            getParsingFlags(m).overflow = overflow;
	        }

	        return m;
	    }

	    // iso 8601 regex
	    // 0000-00-00 0000-W00 or 0000-W00-0 + T + 00 or 00:00 or 00:00:00 or 00:00:00.000 + +00:00 or +0000 or +00)
	    var extendedIsoRegex =
	            /^\s*((?:[+-]\d{6}|\d{4})-(?:\d\d-\d\d|W\d\d-\d|W\d\d|\d\d\d|\d\d))(?:(T| )(\d\d(?::\d\d(?::\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
	        basicIsoRegex =
	            /^\s*((?:[+-]\d{6}|\d{4})(?:\d\d\d\d|W\d\d\d|W\d\d|\d\d\d|\d\d|))(?:(T| )(\d\d(?:\d\d(?:\d\d(?:[.,]\d+)?)?)?)([+-]\d\d(?::?\d\d)?|\s*Z)?)?$/,
	        tzRegex = /Z|[+-]\d\d(?::?\d\d)?/,
	        isoDates = [
	            ['YYYYYY-MM-DD', /[+-]\d{6}-\d\d-\d\d/],
	            ['YYYY-MM-DD', /\d{4}-\d\d-\d\d/],
	            ['GGGG-[W]WW-E', /\d{4}-W\d\d-\d/],
	            ['GGGG-[W]WW', /\d{4}-W\d\d/, false],
	            ['YYYY-DDD', /\d{4}-\d{3}/],
	            ['YYYY-MM', /\d{4}-\d\d/, false],
	            ['YYYYYYMMDD', /[+-]\d{10}/],
	            ['YYYYMMDD', /\d{8}/],
	            ['GGGG[W]WWE', /\d{4}W\d{3}/],
	            ['GGGG[W]WW', /\d{4}W\d{2}/, false],
	            ['YYYYDDD', /\d{7}/],
	            ['YYYYMM', /\d{6}/, false],
	            ['YYYY', /\d{4}/, false],
	        ],
	        // iso time formats and regexes
	        isoTimes = [
	            ['HH:mm:ss.SSSS', /\d\d:\d\d:\d\d\.\d+/],
	            ['HH:mm:ss,SSSS', /\d\d:\d\d:\d\d,\d+/],
	            ['HH:mm:ss', /\d\d:\d\d:\d\d/],
	            ['HH:mm', /\d\d:\d\d/],
	            ['HHmmss.SSSS', /\d\d\d\d\d\d\.\d+/],
	            ['HHmmss,SSSS', /\d\d\d\d\d\d,\d+/],
	            ['HHmmss', /\d\d\d\d\d\d/],
	            ['HHmm', /\d\d\d\d/],
	            ['HH', /\d\d/],
	        ],
	        aspNetJsonRegex = /^\/?Date\((-?\d+)/i,
	        // RFC 2822 regex: For details see https://tools.ietf.org/html/rfc2822#section-3.3
	        rfc2822 =
	            /^(?:(Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s)?(\d{1,2})\s(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s(\d{2,4})\s(\d\d):(\d\d)(?::(\d\d))?\s(?:(UT|GMT|[ECMP][SD]T)|([Zz])|([+-]\d{4}))$/,
	        obsOffsets = {
	            UT: 0,
	            GMT: 0,
	            EDT: -4 * 60,
	            EST: -5 * 60,
	            CDT: -5 * 60,
	            CST: -6 * 60,
	            MDT: -6 * 60,
	            MST: -7 * 60,
	            PDT: -7 * 60,
	            PST: -8 * 60,
	        };

	    // date from iso format
	    function configFromISO(config) {
	        var i,
	            l,
	            string = config._i,
	            match = extendedIsoRegex.exec(string) || basicIsoRegex.exec(string),
	            allowTime,
	            dateFormat,
	            timeFormat,
	            tzFormat,
	            isoDatesLen = isoDates.length,
	            isoTimesLen = isoTimes.length;

	        if (match) {
	            getParsingFlags(config).iso = true;
	            for (i = 0, l = isoDatesLen; i < l; i++) {
	                if (isoDates[i][1].exec(match[1])) {
	                    dateFormat = isoDates[i][0];
	                    allowTime = isoDates[i][2] !== false;
	                    break;
	                }
	            }
	            if (dateFormat == null) {
	                config._isValid = false;
	                return;
	            }
	            if (match[3]) {
	                for (i = 0, l = isoTimesLen; i < l; i++) {
	                    if (isoTimes[i][1].exec(match[3])) {
	                        // match[2] should be 'T' or space
	                        timeFormat = (match[2] || ' ') + isoTimes[i][0];
	                        break;
	                    }
	                }
	                if (timeFormat == null) {
	                    config._isValid = false;
	                    return;
	                }
	            }
	            if (!allowTime && timeFormat != null) {
	                config._isValid = false;
	                return;
	            }
	            if (match[4]) {
	                if (tzRegex.exec(match[4])) {
	                    tzFormat = 'Z';
	                } else {
	                    config._isValid = false;
	                    return;
	                }
	            }
	            config._f = dateFormat + (timeFormat || '') + (tzFormat || '');
	            configFromStringAndFormat(config);
	        } else {
	            config._isValid = false;
	        }
	    }

	    function extractFromRFC2822Strings(
	        yearStr,
	        monthStr,
	        dayStr,
	        hourStr,
	        minuteStr,
	        secondStr
	    ) {
	        var result = [
	            untruncateYear(yearStr),
	            defaultLocaleMonthsShort.indexOf(monthStr),
	            parseInt(dayStr, 10),
	            parseInt(hourStr, 10),
	            parseInt(minuteStr, 10),
	        ];

	        if (secondStr) {
	            result.push(parseInt(secondStr, 10));
	        }

	        return result;
	    }

	    function untruncateYear(yearStr) {
	        var year = parseInt(yearStr, 10);
	        if (year <= 49) {
	            return 2000 + year;
	        } else if (year <= 999) {
	            return 1900 + year;
	        }
	        return year;
	    }

	    function preprocessRFC2822(s) {
	        // Remove comments and folding whitespace and replace multiple-spaces with a single space
	        return s
	            .replace(/\([^()]*\)|[\n\t]/g, ' ')
	            .replace(/(\s\s+)/g, ' ')
	            .replace(/^\s\s*/, '')
	            .replace(/\s\s*$/, '');
	    }

	    function checkWeekday(weekdayStr, parsedInput, config) {
	        if (weekdayStr) {
	            // TODO: Replace the vanilla JS Date object with an independent day-of-week check.
	            var weekdayProvided = defaultLocaleWeekdaysShort.indexOf(weekdayStr),
	                weekdayActual = new Date(
	                    parsedInput[0],
	                    parsedInput[1],
	                    parsedInput[2]
	                ).getDay();
	            if (weekdayProvided !== weekdayActual) {
	                getParsingFlags(config).weekdayMismatch = true;
	                config._isValid = false;
	                return false;
	            }
	        }
	        return true;
	    }

	    function calculateOffset(obsOffset, militaryOffset, numOffset) {
	        if (obsOffset) {
	            return obsOffsets[obsOffset];
	        } else if (militaryOffset) {
	            // the only allowed military tz is Z
	            return 0;
	        } else {
	            var hm = parseInt(numOffset, 10),
	                m = hm % 100,
	                h = (hm - m) / 100;
	            return h * 60 + m;
	        }
	    }

	    // date and time from ref 2822 format
	    function configFromRFC2822(config) {
	        var match = rfc2822.exec(preprocessRFC2822(config._i)),
	            parsedArray;
	        if (match) {
	            parsedArray = extractFromRFC2822Strings(
	                match[4],
	                match[3],
	                match[2],
	                match[5],
	                match[6],
	                match[7]
	            );
	            if (!checkWeekday(match[1], parsedArray, config)) {
	                return;
	            }

	            config._a = parsedArray;
	            config._tzm = calculateOffset(match[8], match[9], match[10]);

	            config._d = createUTCDate.apply(null, config._a);
	            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);

	            getParsingFlags(config).rfc2822 = true;
	        } else {
	            config._isValid = false;
	        }
	    }

	    // date from 1) ASP.NET, 2) ISO, 3) RFC 2822 formats, or 4) optional fallback if parsing isn't strict
	    function configFromString(config) {
	        var matched = aspNetJsonRegex.exec(config._i);
	        if (matched !== null) {
	            config._d = new Date(+matched[1]);
	            return;
	        }

	        configFromISO(config);
	        if (config._isValid === false) {
	            delete config._isValid;
	        } else {
	            return;
	        }

	        configFromRFC2822(config);
	        if (config._isValid === false) {
	            delete config._isValid;
	        } else {
	            return;
	        }

	        if (config._strict) {
	            config._isValid = false;
	        } else {
	            // Final attempt, use Input Fallback
	            hooks.createFromInputFallback(config);
	        }
	    }

	    hooks.createFromInputFallback = deprecate(
	        'value provided is not in a recognized RFC2822 or ISO format. moment construction falls back to js Date(), ' +
	            'which is not reliable across all browsers and versions. Non RFC2822/ISO date formats are ' +
	            'discouraged. Please refer to http://momentjs.com/guides/#/warnings/js-date/ for more info.',
	        function (config) {
	            config._d = new Date(config._i + (config._useUTC ? ' UTC' : ''));
	        }
	    );

	    // Pick the first defined of two or three arguments.
	    function defaults(a, b, c) {
	        if (a != null) {
	            return a;
	        }
	        if (b != null) {
	            return b;
	        }
	        return c;
	    }

	    function currentDateArray(config) {
	        // hooks is actually the exported moment object
	        var nowValue = new Date(hooks.now());
	        if (config._useUTC) {
	            return [
	                nowValue.getUTCFullYear(),
	                nowValue.getUTCMonth(),
	                nowValue.getUTCDate(),
	            ];
	        }
	        return [nowValue.getFullYear(), nowValue.getMonth(), nowValue.getDate()];
	    }

	    // convert an array to a date.
	    // the array should mirror the parameters below
	    // note: all values past the year are optional and will default to the lowest possible value.
	    // [year, month, day , hour, minute, second, millisecond]
	    function configFromArray(config) {
	        var i,
	            date,
	            input = [],
	            currentDate,
	            expectedWeekday,
	            yearToUse;

	        if (config._d) {
	            return;
	        }

	        currentDate = currentDateArray(config);

	        //compute day of the year from weeks and weekdays
	        if (config._w && config._a[DATE] == null && config._a[MONTH] == null) {
	            dayOfYearFromWeekInfo(config);
	        }

	        //if the day of the year is set, figure out what it is
	        if (config._dayOfYear != null) {
	            yearToUse = defaults(config._a[YEAR], currentDate[YEAR]);

	            if (
	                config._dayOfYear > daysInYear(yearToUse) ||
	                config._dayOfYear === 0
	            ) {
	                getParsingFlags(config)._overflowDayOfYear = true;
	            }

	            date = createUTCDate(yearToUse, 0, config._dayOfYear);
	            config._a[MONTH] = date.getUTCMonth();
	            config._a[DATE] = date.getUTCDate();
	        }

	        // Default to current date.
	        // * if no year, month, day of month are given, default to today
	        // * if day of month is given, default month and year
	        // * if month is given, default only year
	        // * if year is given, don't default anything
	        for (i = 0; i < 3 && config._a[i] == null; ++i) {
	            config._a[i] = input[i] = currentDate[i];
	        }

	        // Zero out whatever was not defaulted, including time
	        for (; i < 7; i++) {
	            config._a[i] = input[i] =
	                config._a[i] == null ? (i === 2 ? 1 : 0) : config._a[i];
	        }

	        // Check for 24:00:00.000
	        if (
	            config._a[HOUR] === 24 &&
	            config._a[MINUTE] === 0 &&
	            config._a[SECOND] === 0 &&
	            config._a[MILLISECOND] === 0
	        ) {
	            config._nextDay = true;
	            config._a[HOUR] = 0;
	        }

	        config._d = (config._useUTC ? createUTCDate : createDate).apply(
	            null,
	            input
	        );
	        expectedWeekday = config._useUTC
	            ? config._d.getUTCDay()
	            : config._d.getDay();

	        // Apply timezone offset from input. The actual utcOffset can be changed
	        // with parseZone.
	        if (config._tzm != null) {
	            config._d.setUTCMinutes(config._d.getUTCMinutes() - config._tzm);
	        }

	        if (config._nextDay) {
	            config._a[HOUR] = 24;
	        }

	        // check for mismatching day of week
	        if (
	            config._w &&
	            typeof config._w.d !== 'undefined' &&
	            config._w.d !== expectedWeekday
	        ) {
	            getParsingFlags(config).weekdayMismatch = true;
	        }
	    }

	    function dayOfYearFromWeekInfo(config) {
	        var w, weekYear, week, weekday, dow, doy, temp, weekdayOverflow, curWeek;

	        w = config._w;
	        if (w.GG != null || w.W != null || w.E != null) {
	            dow = 1;
	            doy = 4;

	            // TODO: We need to take the current isoWeekYear, but that depends on
	            // how we interpret now (local, utc, fixed offset). So create
	            // a now version of current config (take local/utc/offset flags, and
	            // create now).
	            weekYear = defaults(
	                w.GG,
	                config._a[YEAR],
	                weekOfYear(createLocal(), 1, 4).year
	            );
	            week = defaults(w.W, 1);
	            weekday = defaults(w.E, 1);
	            if (weekday < 1 || weekday > 7) {
	                weekdayOverflow = true;
	            }
	        } else {
	            dow = config._locale._week.dow;
	            doy = config._locale._week.doy;

	            curWeek = weekOfYear(createLocal(), dow, doy);

	            weekYear = defaults(w.gg, config._a[YEAR], curWeek.year);

	            // Default to current week.
	            week = defaults(w.w, curWeek.week);

	            if (w.d != null) {
	                // weekday -- low day numbers are considered next week
	                weekday = w.d;
	                if (weekday < 0 || weekday > 6) {
	                    weekdayOverflow = true;
	                }
	            } else if (w.e != null) {
	                // local weekday -- counting starts from beginning of week
	                weekday = w.e + dow;
	                if (w.e < 0 || w.e > 6) {
	                    weekdayOverflow = true;
	                }
	            } else {
	                // default to beginning of week
	                weekday = dow;
	            }
	        }
	        if (week < 1 || week > weeksInYear(weekYear, dow, doy)) {
	            getParsingFlags(config)._overflowWeeks = true;
	        } else if (weekdayOverflow != null) {
	            getParsingFlags(config)._overflowWeekday = true;
	        } else {
	            temp = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy);
	            config._a[YEAR] = temp.year;
	            config._dayOfYear = temp.dayOfYear;
	        }
	    }

	    // constant that refers to the ISO standard
	    hooks.ISO_8601 = function () {};

	    // constant that refers to the RFC 2822 form
	    hooks.RFC_2822 = function () {};

	    // date from string and format string
	    function configFromStringAndFormat(config) {
	        // TODO: Move this to another part of the creation flow to prevent circular deps
	        if (config._f === hooks.ISO_8601) {
	            configFromISO(config);
	            return;
	        }
	        if (config._f === hooks.RFC_2822) {
	            configFromRFC2822(config);
	            return;
	        }
	        config._a = [];
	        getParsingFlags(config).empty = true;

	        // This array is used to make a Date, either with `new Date` or `Date.UTC`
	        var string = '' + config._i,
	            i,
	            parsedInput,
	            tokens,
	            token,
	            skipped,
	            stringLength = string.length,
	            totalParsedInputLength = 0,
	            era,
	            tokenLen;

	        tokens =
	            expandFormat(config._f, config._locale).match(formattingTokens) || [];
	        tokenLen = tokens.length;
	        for (i = 0; i < tokenLen; i++) {
	            token = tokens[i];
	            parsedInput = (string.match(getParseRegexForToken(token, config)) ||
	                [])[0];
	            if (parsedInput) {
	                skipped = string.substr(0, string.indexOf(parsedInput));
	                if (skipped.length > 0) {
	                    getParsingFlags(config).unusedInput.push(skipped);
	                }
	                string = string.slice(
	                    string.indexOf(parsedInput) + parsedInput.length
	                );
	                totalParsedInputLength += parsedInput.length;
	            }
	            // don't parse if it's not a known token
	            if (formatTokenFunctions[token]) {
	                if (parsedInput) {
	                    getParsingFlags(config).empty = false;
	                } else {
	                    getParsingFlags(config).unusedTokens.push(token);
	                }
	                addTimeToArrayFromToken(token, parsedInput, config);
	            } else if (config._strict && !parsedInput) {
	                getParsingFlags(config).unusedTokens.push(token);
	            }
	        }

	        // add remaining unparsed input length to the string
	        getParsingFlags(config).charsLeftOver =
	            stringLength - totalParsedInputLength;
	        if (string.length > 0) {
	            getParsingFlags(config).unusedInput.push(string);
	        }

	        // clear _12h flag if hour is <= 12
	        if (
	            config._a[HOUR] <= 12 &&
	            getParsingFlags(config).bigHour === true &&
	            config._a[HOUR] > 0
	        ) {
	            getParsingFlags(config).bigHour = undefined;
	        }

	        getParsingFlags(config).parsedDateParts = config._a.slice(0);
	        getParsingFlags(config).meridiem = config._meridiem;
	        // handle meridiem
	        config._a[HOUR] = meridiemFixWrap(
	            config._locale,
	            config._a[HOUR],
	            config._meridiem
	        );

	        // handle era
	        era = getParsingFlags(config).era;
	        if (era !== null) {
	            config._a[YEAR] = config._locale.erasConvertYear(era, config._a[YEAR]);
	        }

	        configFromArray(config);
	        checkOverflow(config);
	    }

	    function meridiemFixWrap(locale, hour, meridiem) {
	        var isPm;

	        if (meridiem == null) {
	            // nothing to do
	            return hour;
	        }
	        if (locale.meridiemHour != null) {
	            return locale.meridiemHour(hour, meridiem);
	        } else if (locale.isPM != null) {
	            // Fallback
	            isPm = locale.isPM(meridiem);
	            if (isPm && hour < 12) {
	                hour += 12;
	            }
	            if (!isPm && hour === 12) {
	                hour = 0;
	            }
	            return hour;
	        } else {
	            // this is not supposed to happen
	            return hour;
	        }
	    }

	    // date from string and array of format strings
	    function configFromStringAndArray(config) {
	        var tempConfig,
	            bestMoment,
	            scoreToBeat,
	            i,
	            currentScore,
	            validFormatFound,
	            bestFormatIsValid = false,
	            configfLen = config._f.length;

	        if (configfLen === 0) {
	            getParsingFlags(config).invalidFormat = true;
	            config._d = new Date(NaN);
	            return;
	        }

	        for (i = 0; i < configfLen; i++) {
	            currentScore = 0;
	            validFormatFound = false;
	            tempConfig = copyConfig({}, config);
	            if (config._useUTC != null) {
	                tempConfig._useUTC = config._useUTC;
	            }
	            tempConfig._f = config._f[i];
	            configFromStringAndFormat(tempConfig);

	            if (isValid(tempConfig)) {
	                validFormatFound = true;
	            }

	            // if there is any input that was not parsed add a penalty for that format
	            currentScore += getParsingFlags(tempConfig).charsLeftOver;

	            //or tokens
	            currentScore += getParsingFlags(tempConfig).unusedTokens.length * 10;

	            getParsingFlags(tempConfig).score = currentScore;

	            if (!bestFormatIsValid) {
	                if (
	                    scoreToBeat == null ||
	                    currentScore < scoreToBeat ||
	                    validFormatFound
	                ) {
	                    scoreToBeat = currentScore;
	                    bestMoment = tempConfig;
	                    if (validFormatFound) {
	                        bestFormatIsValid = true;
	                    }
	                }
	            } else {
	                if (currentScore < scoreToBeat) {
	                    scoreToBeat = currentScore;
	                    bestMoment = tempConfig;
	                }
	            }
	        }

	        extend(config, bestMoment || tempConfig);
	    }

	    function configFromObject(config) {
	        if (config._d) {
	            return;
	        }

	        var i = normalizeObjectUnits(config._i),
	            dayOrDate = i.day === undefined ? i.date : i.day;
	        config._a = map(
	            [i.year, i.month, dayOrDate, i.hour, i.minute, i.second, i.millisecond],
	            function (obj) {
	                return obj && parseInt(obj, 10);
	            }
	        );

	        configFromArray(config);
	    }

	    function createFromConfig(config) {
	        var res = new Moment(checkOverflow(prepareConfig(config)));
	        if (res._nextDay) {
	            // Adding is smart enough around DST
	            res.add(1, 'd');
	            res._nextDay = undefined;
	        }

	        return res;
	    }

	    function prepareConfig(config) {
	        var input = config._i,
	            format = config._f;

	        config._locale = config._locale || getLocale(config._l);

	        if (input === null || (format === undefined && input === '')) {
	            return createInvalid({ nullInput: true });
	        }

	        if (typeof input === 'string') {
	            config._i = input = config._locale.preparse(input);
	        }

	        if (isMoment(input)) {
	            return new Moment(checkOverflow(input));
	        } else if (isDate(input)) {
	            config._d = input;
	        } else if (isArray(format)) {
	            configFromStringAndArray(config);
	        } else if (format) {
	            configFromStringAndFormat(config);
	        } else {
	            configFromInput(config);
	        }

	        if (!isValid(config)) {
	            config._d = null;
	        }

	        return config;
	    }

	    function configFromInput(config) {
	        var input = config._i;
	        if (isUndefined(input)) {
	            config._d = new Date(hooks.now());
	        } else if (isDate(input)) {
	            config._d = new Date(input.valueOf());
	        } else if (typeof input === 'string') {
	            configFromString(config);
	        } else if (isArray(input)) {
	            config._a = map(input.slice(0), function (obj) {
	                return parseInt(obj, 10);
	            });
	            configFromArray(config);
	        } else if (isObject(input)) {
	            configFromObject(config);
	        } else if (isNumber(input)) {
	            // from milliseconds
	            config._d = new Date(input);
	        } else {
	            hooks.createFromInputFallback(config);
	        }
	    }

	    function createLocalOrUTC(input, format, locale, strict, isUTC) {
	        var c = {};

	        if (format === true || format === false) {
	            strict = format;
	            format = undefined;
	        }

	        if (locale === true || locale === false) {
	            strict = locale;
	            locale = undefined;
	        }

	        if (
	            (isObject(input) && isObjectEmpty(input)) ||
	            (isArray(input) && input.length === 0)
	        ) {
	            input = undefined;
	        }
	        // object construction must be done this way.
	        // https://github.com/moment/moment/issues/1423
	        c._isAMomentObject = true;
	        c._useUTC = c._isUTC = isUTC;
	        c._l = locale;
	        c._i = input;
	        c._f = format;
	        c._strict = strict;

	        return createFromConfig(c);
	    }

	    function createLocal(input, format, locale, strict) {
	        return createLocalOrUTC(input, format, locale, strict, false);
	    }

	    var prototypeMin = deprecate(
	            'moment().min is deprecated, use moment.max instead. http://momentjs.com/guides/#/warnings/min-max/',
	            function () {
	                var other = createLocal.apply(null, arguments);
	                if (this.isValid() && other.isValid()) {
	                    return other < this ? this : other;
	                } else {
	                    return createInvalid();
	                }
	            }
	        ),
	        prototypeMax = deprecate(
	            'moment().max is deprecated, use moment.min instead. http://momentjs.com/guides/#/warnings/min-max/',
	            function () {
	                var other = createLocal.apply(null, arguments);
	                if (this.isValid() && other.isValid()) {
	                    return other > this ? this : other;
	                } else {
	                    return createInvalid();
	                }
	            }
	        );

	    // Pick a moment m from moments so that m[fn](other) is true for all
	    // other. This relies on the function fn to be transitive.
	    //
	    // moments should either be an array of moment objects or an array, whose
	    // first element is an array of moment objects.
	    function pickBy(fn, moments) {
	        var res, i;
	        if (moments.length === 1 && isArray(moments[0])) {
	            moments = moments[0];
	        }
	        if (!moments.length) {
	            return createLocal();
	        }
	        res = moments[0];
	        for (i = 1; i < moments.length; ++i) {
	            if (!moments[i].isValid() || moments[i][fn](res)) {
	                res = moments[i];
	            }
	        }
	        return res;
	    }

	    // TODO: Use [].sort instead?
	    function min() {
	        var args = [].slice.call(arguments, 0);

	        return pickBy('isBefore', args);
	    }

	    function max() {
	        var args = [].slice.call(arguments, 0);

	        return pickBy('isAfter', args);
	    }

	    var now = function () {
	        return Date.now ? Date.now() : +new Date();
	    };

	    var ordering = [
	        'year',
	        'quarter',
	        'month',
	        'week',
	        'day',
	        'hour',
	        'minute',
	        'second',
	        'millisecond',
	    ];

	    function isDurationValid(m) {
	        var key,
	            unitHasDecimal = false,
	            i,
	            orderLen = ordering.length;
	        for (key in m) {
	            if (
	                hasOwnProp(m, key) &&
	                !(
	                    indexOf.call(ordering, key) !== -1 &&
	                    (m[key] == null || !isNaN(m[key]))
	                )
	            ) {
	                return false;
	            }
	        }

	        for (i = 0; i < orderLen; ++i) {
	            if (m[ordering[i]]) {
	                if (unitHasDecimal) {
	                    return false; // only allow non-integers for smallest unit
	                }
	                if (parseFloat(m[ordering[i]]) !== toInt(m[ordering[i]])) {
	                    unitHasDecimal = true;
	                }
	            }
	        }

	        return true;
	    }

	    function isValid$1() {
	        return this._isValid;
	    }

	    function createInvalid$1() {
	        return createDuration(NaN);
	    }

	    function Duration(duration) {
	        var normalizedInput = normalizeObjectUnits(duration),
	            years = normalizedInput.year || 0,
	            quarters = normalizedInput.quarter || 0,
	            months = normalizedInput.month || 0,
	            weeks = normalizedInput.week || normalizedInput.isoWeek || 0,
	            days = normalizedInput.day || 0,
	            hours = normalizedInput.hour || 0,
	            minutes = normalizedInput.minute || 0,
	            seconds = normalizedInput.second || 0,
	            milliseconds = normalizedInput.millisecond || 0;

	        this._isValid = isDurationValid(normalizedInput);

	        // representation for dateAddRemove
	        this._milliseconds =
	            +milliseconds +
	            seconds * 1e3 + // 1000
	            minutes * 6e4 + // 1000 * 60
	            hours * 1000 * 60 * 60; //using 1000 * 60 * 60 instead of 36e5 to avoid floating point rounding errors https://github.com/moment/moment/issues/2978
	        // Because of dateAddRemove treats 24 hours as different from a
	        // day when working around DST, we need to store them separately
	        this._days = +days + weeks * 7;
	        // It is impossible to translate months into days without knowing
	        // which months you are are talking about, so we have to store
	        // it separately.
	        this._months = +months + quarters * 3 + years * 12;

	        this._data = {};

	        this._locale = getLocale();

	        this._bubble();
	    }

	    function isDuration(obj) {
	        return obj instanceof Duration;
	    }

	    function absRound(number) {
	        if (number < 0) {
	            return Math.round(-1 * number) * -1;
	        } else {
	            return Math.round(number);
	        }
	    }

	    // compare two arrays, return the number of differences
	    function compareArrays(array1, array2, dontConvert) {
	        var len = Math.min(array1.length, array2.length),
	            lengthDiff = Math.abs(array1.length - array2.length),
	            diffs = 0,
	            i;
	        for (i = 0; i < len; i++) {
	            if (
	                (dontConvert && array1[i] !== array2[i]) ||
	                (!dontConvert && toInt(array1[i]) !== toInt(array2[i]))
	            ) {
	                diffs++;
	            }
	        }
	        return diffs + lengthDiff;
	    }

	    // FORMATTING

	    function offset(token, separator) {
	        addFormatToken(token, 0, 0, function () {
	            var offset = this.utcOffset(),
	                sign = '+';
	            if (offset < 0) {
	                offset = -offset;
	                sign = '-';
	            }
	            return (
	                sign +
	                zeroFill(~~(offset / 60), 2) +
	                separator +
	                zeroFill(~~offset % 60, 2)
	            );
	        });
	    }

	    offset('Z', ':');
	    offset('ZZ', '');

	    // PARSING

	    addRegexToken('Z', matchShortOffset);
	    addRegexToken('ZZ', matchShortOffset);
	    addParseToken(['Z', 'ZZ'], function (input, array, config) {
	        config._useUTC = true;
	        config._tzm = offsetFromString(matchShortOffset, input);
	    });

	    // HELPERS

	    // timezone chunker
	    // '+10:00' > ['10',  '00']
	    // '-1530'  > ['-15', '30']
	    var chunkOffset = /([\+\-]|\d\d)/gi;

	    function offsetFromString(matcher, string) {
	        var matches = (string || '').match(matcher),
	            chunk,
	            parts,
	            minutes;

	        if (matches === null) {
	            return null;
	        }

	        chunk = matches[matches.length - 1] || [];
	        parts = (chunk + '').match(chunkOffset) || ['-', 0, 0];
	        minutes = +(parts[1] * 60) + toInt(parts[2]);

	        return minutes === 0 ? 0 : parts[0] === '+' ? minutes : -minutes;
	    }

	    // Return a moment from input, that is local/utc/zone equivalent to model.
	    function cloneWithOffset(input, model) {
	        var res, diff;
	        if (model._isUTC) {
	            res = model.clone();
	            diff =
	                (isMoment(input) || isDate(input)
	                    ? input.valueOf()
	                    : createLocal(input).valueOf()) - res.valueOf();
	            // Use low-level api, because this fn is low-level api.
	            res._d.setTime(res._d.valueOf() + diff);
	            hooks.updateOffset(res, false);
	            return res;
	        } else {
	            return createLocal(input).local();
	        }
	    }

	    function getDateOffset(m) {
	        // On Firefox.24 Date#getTimezoneOffset returns a floating point.
	        // https://github.com/moment/moment/pull/1871
	        return -Math.round(m._d.getTimezoneOffset());
	    }

	    // HOOKS

	    // This function will be called whenever a moment is mutated.
	    // It is intended to keep the offset in sync with the timezone.
	    hooks.updateOffset = function () {};

	    // MOMENTS

	    // keepLocalTime = true means only change the timezone, without
	    // affecting the local hour. So 5:31:26 +0300 --[utcOffset(2, true)]-->
	    // 5:31:26 +0200 It is possible that 5:31:26 doesn't exist with offset
	    // +0200, so we adjust the time as needed, to be valid.
	    //
	    // Keeping the time actually adds/subtracts (one hour)
	    // from the actual represented time. That is why we call updateOffset
	    // a second time. In case it wants us to change the offset again
	    // _changeInProgress == true case, then we have to adjust, because
	    // there is no such time in the given timezone.
	    function getSetOffset(input, keepLocalTime, keepMinutes) {
	        var offset = this._offset || 0,
	            localAdjust;
	        if (!this.isValid()) {
	            return input != null ? this : NaN;
	        }
	        if (input != null) {
	            if (typeof input === 'string') {
	                input = offsetFromString(matchShortOffset, input);
	                if (input === null) {
	                    return this;
	                }
	            } else if (Math.abs(input) < 16 && !keepMinutes) {
	                input = input * 60;
	            }
	            if (!this._isUTC && keepLocalTime) {
	                localAdjust = getDateOffset(this);
	            }
	            this._offset = input;
	            this._isUTC = true;
	            if (localAdjust != null) {
	                this.add(localAdjust, 'm');
	            }
	            if (offset !== input) {
	                if (!keepLocalTime || this._changeInProgress) {
	                    addSubtract(
	                        this,
	                        createDuration(input - offset, 'm'),
	                        1,
	                        false
	                    );
	                } else if (!this._changeInProgress) {
	                    this._changeInProgress = true;
	                    hooks.updateOffset(this, true);
	                    this._changeInProgress = null;
	                }
	            }
	            return this;
	        } else {
	            return this._isUTC ? offset : getDateOffset(this);
	        }
	    }

	    function getSetZone(input, keepLocalTime) {
	        if (input != null) {
	            if (typeof input !== 'string') {
	                input = -input;
	            }

	            this.utcOffset(input, keepLocalTime);

	            return this;
	        } else {
	            return -this.utcOffset();
	        }
	    }

	    function setOffsetToUTC(keepLocalTime) {
	        return this.utcOffset(0, keepLocalTime);
	    }

	    function setOffsetToLocal(keepLocalTime) {
	        if (this._isUTC) {
	            this.utcOffset(0, keepLocalTime);
	            this._isUTC = false;

	            if (keepLocalTime) {
	                this.subtract(getDateOffset(this), 'm');
	            }
	        }
	        return this;
	    }

	    function setOffsetToParsedOffset() {
	        if (this._tzm != null) {
	            this.utcOffset(this._tzm, false, true);
	        } else if (typeof this._i === 'string') {
	            var tZone = offsetFromString(matchOffset, this._i);
	            if (tZone != null) {
	                this.utcOffset(tZone);
	            } else {
	                this.utcOffset(0, true);
	            }
	        }
	        return this;
	    }

	    function hasAlignedHourOffset(input) {
	        if (!this.isValid()) {
	            return false;
	        }
	        input = input ? createLocal(input).utcOffset() : 0;

	        return (this.utcOffset() - input) % 60 === 0;
	    }

	    function isDaylightSavingTime() {
	        return (
	            this.utcOffset() > this.clone().month(0).utcOffset() ||
	            this.utcOffset() > this.clone().month(5).utcOffset()
	        );
	    }

	    function isDaylightSavingTimeShifted() {
	        if (!isUndefined(this._isDSTShifted)) {
	            return this._isDSTShifted;
	        }

	        var c = {},
	            other;

	        copyConfig(c, this);
	        c = prepareConfig(c);

	        if (c._a) {
	            other = c._isUTC ? createUTC(c._a) : createLocal(c._a);
	            this._isDSTShifted =
	                this.isValid() && compareArrays(c._a, other.toArray()) > 0;
	        } else {
	            this._isDSTShifted = false;
	        }

	        return this._isDSTShifted;
	    }

	    function isLocal() {
	        return this.isValid() ? !this._isUTC : false;
	    }

	    function isUtcOffset() {
	        return this.isValid() ? this._isUTC : false;
	    }

	    function isUtc() {
	        return this.isValid() ? this._isUTC && this._offset === 0 : false;
	    }

	    // ASP.NET json date format regex
	    var aspNetRegex = /^(-|\+)?(?:(\d*)[. ])?(\d+):(\d+)(?::(\d+)(\.\d*)?)?$/,
	        // from http://docs.closure-library.googlecode.com/git/closure_goog_date_date.js.source.html
	        // somewhat more in line with 4.4.3.2 2004 spec, but allows decimal anywhere
	        // and further modified to allow for strings containing both week and day
	        isoRegex =
	            /^(-|\+)?P(?:([-+]?[0-9,.]*)Y)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)W)?(?:([-+]?[0-9,.]*)D)?(?:T(?:([-+]?[0-9,.]*)H)?(?:([-+]?[0-9,.]*)M)?(?:([-+]?[0-9,.]*)S)?)?$/;

	    function createDuration(input, key) {
	        var duration = input,
	            // matching against regexp is expensive, do it on demand
	            match = null,
	            sign,
	            ret,
	            diffRes;

	        if (isDuration(input)) {
	            duration = {
	                ms: input._milliseconds,
	                d: input._days,
	                M: input._months,
	            };
	        } else if (isNumber(input) || !isNaN(+input)) {
	            duration = {};
	            if (key) {
	                duration[key] = +input;
	            } else {
	                duration.milliseconds = +input;
	            }
	        } else if ((match = aspNetRegex.exec(input))) {
	            sign = match[1] === '-' ? -1 : 1;
	            duration = {
	                y: 0,
	                d: toInt(match[DATE]) * sign,
	                h: toInt(match[HOUR]) * sign,
	                m: toInt(match[MINUTE]) * sign,
	                s: toInt(match[SECOND]) * sign,
	                ms: toInt(absRound(match[MILLISECOND] * 1000)) * sign, // the millisecond decimal point is included in the match
	            };
	        } else if ((match = isoRegex.exec(input))) {
	            sign = match[1] === '-' ? -1 : 1;
	            duration = {
	                y: parseIso(match[2], sign),
	                M: parseIso(match[3], sign),
	                w: parseIso(match[4], sign),
	                d: parseIso(match[5], sign),
	                h: parseIso(match[6], sign),
	                m: parseIso(match[7], sign),
	                s: parseIso(match[8], sign),
	            };
	        } else if (duration == null) {
	            // checks for null or undefined
	            duration = {};
	        } else if (
	            typeof duration === 'object' &&
	            ('from' in duration || 'to' in duration)
	        ) {
	            diffRes = momentsDifference(
	                createLocal(duration.from),
	                createLocal(duration.to)
	            );

	            duration = {};
	            duration.ms = diffRes.milliseconds;
	            duration.M = diffRes.months;
	        }

	        ret = new Duration(duration);

	        if (isDuration(input) && hasOwnProp(input, '_locale')) {
	            ret._locale = input._locale;
	        }

	        if (isDuration(input) && hasOwnProp(input, '_isValid')) {
	            ret._isValid = input._isValid;
	        }

	        return ret;
	    }

	    createDuration.fn = Duration.prototype;
	    createDuration.invalid = createInvalid$1;

	    function parseIso(inp, sign) {
	        // We'd normally use ~~inp for this, but unfortunately it also
	        // converts floats to ints.
	        // inp may be undefined, so careful calling replace on it.
	        var res = inp && parseFloat(inp.replace(',', '.'));
	        // apply sign while we're at it
	        return (isNaN(res) ? 0 : res) * sign;
	    }

	    function positiveMomentsDifference(base, other) {
	        var res = {};

	        res.months =
	            other.month() - base.month() + (other.year() - base.year()) * 12;
	        if (base.clone().add(res.months, 'M').isAfter(other)) {
	            --res.months;
	        }

	        res.milliseconds = +other - +base.clone().add(res.months, 'M');

	        return res;
	    }

	    function momentsDifference(base, other) {
	        var res;
	        if (!(base.isValid() && other.isValid())) {
	            return { milliseconds: 0, months: 0 };
	        }

	        other = cloneWithOffset(other, base);
	        if (base.isBefore(other)) {
	            res = positiveMomentsDifference(base, other);
	        } else {
	            res = positiveMomentsDifference(other, base);
	            res.milliseconds = -res.milliseconds;
	            res.months = -res.months;
	        }

	        return res;
	    }

	    // TODO: remove 'name' arg after deprecation is removed
	    function createAdder(direction, name) {
	        return function (val, period) {
	            var dur, tmp;
	            //invert the arguments, but complain about it
	            if (period !== null && !isNaN(+period)) {
	                deprecateSimple(
	                    name,
	                    'moment().' +
	                        name +
	                        '(period, number) is deprecated. Please use moment().' +
	                        name +
	                        '(number, period). ' +
	                        'See http://momentjs.com/guides/#/warnings/add-inverted-param/ for more info.'
	                );
	                tmp = val;
	                val = period;
	                period = tmp;
	            }

	            dur = createDuration(val, period);
	            addSubtract(this, dur, direction);
	            return this;
	        };
	    }

	    function addSubtract(mom, duration, isAdding, updateOffset) {
	        var milliseconds = duration._milliseconds,
	            days = absRound(duration._days),
	            months = absRound(duration._months);

	        if (!mom.isValid()) {
	            // No op
	            return;
	        }

	        updateOffset = updateOffset == null ? true : updateOffset;

	        if (months) {
	            setMonth(mom, get(mom, 'Month') + months * isAdding);
	        }
	        if (days) {
	            set$1(mom, 'Date', get(mom, 'Date') + days * isAdding);
	        }
	        if (milliseconds) {
	            mom._d.setTime(mom._d.valueOf() + milliseconds * isAdding);
	        }
	        if (updateOffset) {
	            hooks.updateOffset(mom, days || months);
	        }
	    }

	    var add = createAdder(1, 'add'),
	        subtract = createAdder(-1, 'subtract');

	    function isString(input) {
	        return typeof input === 'string' || input instanceof String;
	    }

	    // type MomentInput = Moment | Date | string | number | (number | string)[] | MomentInputObject | void; // null | undefined
	    function isMomentInput(input) {
	        return (
	            isMoment(input) ||
	            isDate(input) ||
	            isString(input) ||
	            isNumber(input) ||
	            isNumberOrStringArray(input) ||
	            isMomentInputObject(input) ||
	            input === null ||
	            input === undefined
	        );
	    }

	    function isMomentInputObject(input) {
	        var objectTest = isObject(input) && !isObjectEmpty(input),
	            propertyTest = false,
	            properties = [
	                'years',
	                'year',
	                'y',
	                'months',
	                'month',
	                'M',
	                'days',
	                'day',
	                'd',
	                'dates',
	                'date',
	                'D',
	                'hours',
	                'hour',
	                'h',
	                'minutes',
	                'minute',
	                'm',
	                'seconds',
	                'second',
	                's',
	                'milliseconds',
	                'millisecond',
	                'ms',
	            ],
	            i,
	            property,
	            propertyLen = properties.length;

	        for (i = 0; i < propertyLen; i += 1) {
	            property = properties[i];
	            propertyTest = propertyTest || hasOwnProp(input, property);
	        }

	        return objectTest && propertyTest;
	    }

	    function isNumberOrStringArray(input) {
	        var arrayTest = isArray(input),
	            dataTypeTest = false;
	        if (arrayTest) {
	            dataTypeTest =
	                input.filter(function (item) {
	                    return !isNumber(item) && isString(input);
	                }).length === 0;
	        }
	        return arrayTest && dataTypeTest;
	    }

	    function isCalendarSpec(input) {
	        var objectTest = isObject(input) && !isObjectEmpty(input),
	            propertyTest = false,
	            properties = [
	                'sameDay',
	                'nextDay',
	                'lastDay',
	                'nextWeek',
	                'lastWeek',
	                'sameElse',
	            ],
	            i,
	            property;

	        for (i = 0; i < properties.length; i += 1) {
	            property = properties[i];
	            propertyTest = propertyTest || hasOwnProp(input, property);
	        }

	        return objectTest && propertyTest;
	    }

	    function getCalendarFormat(myMoment, now) {
	        var diff = myMoment.diff(now, 'days', true);
	        return diff < -6
	            ? 'sameElse'
	            : diff < -1
	              ? 'lastWeek'
	              : diff < 0
	                ? 'lastDay'
	                : diff < 1
	                  ? 'sameDay'
	                  : diff < 2
	                    ? 'nextDay'
	                    : diff < 7
	                      ? 'nextWeek'
	                      : 'sameElse';
	    }

	    function calendar$1(time, formats) {
	        // Support for single parameter, formats only overload to the calendar function
	        if (arguments.length === 1) {
	            if (!arguments[0]) {
	                time = undefined;
	                formats = undefined;
	            } else if (isMomentInput(arguments[0])) {
	                time = arguments[0];
	                formats = undefined;
	            } else if (isCalendarSpec(arguments[0])) {
	                formats = arguments[0];
	                time = undefined;
	            }
	        }
	        // We want to compare the start of today, vs this.
	        // Getting start-of-today depends on whether we're local/utc/offset or not.
	        var now = time || createLocal(),
	            sod = cloneWithOffset(now, this).startOf('day'),
	            format = hooks.calendarFormat(this, sod) || 'sameElse',
	            output =
	                formats &&
	                (isFunction(formats[format])
	                    ? formats[format].call(this, now)
	                    : formats[format]);

	        return this.format(
	            output || this.localeData().calendar(format, this, createLocal(now))
	        );
	    }

	    function clone() {
	        return new Moment(this);
	    }

	    function isAfter(input, units) {
	        var localInput = isMoment(input) ? input : createLocal(input);
	        if (!(this.isValid() && localInput.isValid())) {
	            return false;
	        }
	        units = normalizeUnits(units) || 'millisecond';
	        if (units === 'millisecond') {
	            return this.valueOf() > localInput.valueOf();
	        } else {
	            return localInput.valueOf() < this.clone().startOf(units).valueOf();
	        }
	    }

	    function isBefore(input, units) {
	        var localInput = isMoment(input) ? input : createLocal(input);
	        if (!(this.isValid() && localInput.isValid())) {
	            return false;
	        }
	        units = normalizeUnits(units) || 'millisecond';
	        if (units === 'millisecond') {
	            return this.valueOf() < localInput.valueOf();
	        } else {
	            return this.clone().endOf(units).valueOf() < localInput.valueOf();
	        }
	    }

	    function isBetween(from, to, units, inclusivity) {
	        var localFrom = isMoment(from) ? from : createLocal(from),
	            localTo = isMoment(to) ? to : createLocal(to);
	        if (!(this.isValid() && localFrom.isValid() && localTo.isValid())) {
	            return false;
	        }
	        inclusivity = inclusivity || '()';
	        return (
	            (inclusivity[0] === '('
	                ? this.isAfter(localFrom, units)
	                : !this.isBefore(localFrom, units)) &&
	            (inclusivity[1] === ')'
	                ? this.isBefore(localTo, units)
	                : !this.isAfter(localTo, units))
	        );
	    }

	    function isSame(input, units) {
	        var localInput = isMoment(input) ? input : createLocal(input),
	            inputMs;
	        if (!(this.isValid() && localInput.isValid())) {
	            return false;
	        }
	        units = normalizeUnits(units) || 'millisecond';
	        if (units === 'millisecond') {
	            return this.valueOf() === localInput.valueOf();
	        } else {
	            inputMs = localInput.valueOf();
	            return (
	                this.clone().startOf(units).valueOf() <= inputMs &&
	                inputMs <= this.clone().endOf(units).valueOf()
	            );
	        }
	    }

	    function isSameOrAfter(input, units) {
	        return this.isSame(input, units) || this.isAfter(input, units);
	    }

	    function isSameOrBefore(input, units) {
	        return this.isSame(input, units) || this.isBefore(input, units);
	    }

	    function diff(input, units, asFloat) {
	        var that, zoneDelta, output;

	        if (!this.isValid()) {
	            return NaN;
	        }

	        that = cloneWithOffset(input, this);

	        if (!that.isValid()) {
	            return NaN;
	        }

	        zoneDelta = (that.utcOffset() - this.utcOffset()) * 6e4;

	        units = normalizeUnits(units);

	        switch (units) {
	            case 'year':
	                output = monthDiff(this, that) / 12;
	                break;
	            case 'month':
	                output = monthDiff(this, that);
	                break;
	            case 'quarter':
	                output = monthDiff(this, that) / 3;
	                break;
	            case 'second':
	                output = (this - that) / 1e3;
	                break; // 1000
	            case 'minute':
	                output = (this - that) / 6e4;
	                break; // 1000 * 60
	            case 'hour':
	                output = (this - that) / 36e5;
	                break; // 1000 * 60 * 60
	            case 'day':
	                output = (this - that - zoneDelta) / 864e5;
	                break; // 1000 * 60 * 60 * 24, negate dst
	            case 'week':
	                output = (this - that - zoneDelta) / 6048e5;
	                break; // 1000 * 60 * 60 * 24 * 7, negate dst
	            default:
	                output = this - that;
	        }

	        return asFloat ? output : absFloor(output);
	    }

	    function monthDiff(a, b) {
	        if (a.date() < b.date()) {
	            // end-of-month calculations work correct when the start month has more
	            // days than the end month.
	            return -monthDiff(b, a);
	        }
	        // difference in months
	        var wholeMonthDiff = (b.year() - a.year()) * 12 + (b.month() - a.month()),
	            // b is in (anchor - 1 month, anchor + 1 month)
	            anchor = a.clone().add(wholeMonthDiff, 'months'),
	            anchor2,
	            adjust;

	        if (b - anchor < 0) {
	            anchor2 = a.clone().add(wholeMonthDiff - 1, 'months');
	            // linear across the month
	            adjust = (b - anchor) / (anchor - anchor2);
	        } else {
	            anchor2 = a.clone().add(wholeMonthDiff + 1, 'months');
	            // linear across the month
	            adjust = (b - anchor) / (anchor2 - anchor);
	        }

	        //check for negative zero, return zero if negative zero
	        return -(wholeMonthDiff + adjust) || 0;
	    }

	    hooks.defaultFormat = 'YYYY-MM-DDTHH:mm:ssZ';
	    hooks.defaultFormatUtc = 'YYYY-MM-DDTHH:mm:ss[Z]';

	    function toString() {
	        return this.clone().locale('en').format('ddd MMM DD YYYY HH:mm:ss [GMT]ZZ');
	    }

	    function toISOString(keepOffset) {
	        if (!this.isValid()) {
	            return null;
	        }
	        var utc = keepOffset !== true,
	            m = utc ? this.clone().utc() : this;
	        if (m.year() < 0 || m.year() > 9999) {
	            return formatMoment(
	                m,
	                utc
	                    ? 'YYYYYY-MM-DD[T]HH:mm:ss.SSS[Z]'
	                    : 'YYYYYY-MM-DD[T]HH:mm:ss.SSSZ'
	            );
	        }
	        if (isFunction(Date.prototype.toISOString)) {
	            // native implementation is ~50x faster, use it when we can
	            if (utc) {
	                return this.toDate().toISOString();
	            } else {
	                return new Date(this.valueOf() + this.utcOffset() * 60 * 1000)
	                    .toISOString()
	                    .replace('Z', formatMoment(m, 'Z'));
	            }
	        }
	        return formatMoment(
	            m,
	            utc ? 'YYYY-MM-DD[T]HH:mm:ss.SSS[Z]' : 'YYYY-MM-DD[T]HH:mm:ss.SSSZ'
	        );
	    }

	    /**
	     * Return a human readable representation of a moment that can
	     * also be evaluated to get a new moment which is the same
	     *
	     * @link https://nodejs.org/dist/latest/docs/api/util.html#util_custom_inspect_function_on_objects
	     */
	    function inspect() {
	        if (!this.isValid()) {
	            return 'moment.invalid(/* ' + this._i + ' */)';
	        }
	        var func = 'moment',
	            zone = '',
	            prefix,
	            year,
	            datetime,
	            suffix;
	        if (!this.isLocal()) {
	            func = this.utcOffset() === 0 ? 'moment.utc' : 'moment.parseZone';
	            zone = 'Z';
	        }
	        prefix = '[' + func + '("]';
	        year = 0 <= this.year() && this.year() <= 9999 ? 'YYYY' : 'YYYYYY';
	        datetime = '-MM-DD[T]HH:mm:ss.SSS';
	        suffix = zone + '[")]';

	        return this.format(prefix + year + datetime + suffix);
	    }

	    function format(inputString) {
	        if (!inputString) {
	            inputString = this.isUtc()
	                ? hooks.defaultFormatUtc
	                : hooks.defaultFormat;
	        }
	        var output = formatMoment(this, inputString);
	        return this.localeData().postformat(output);
	    }

	    function from(time, withoutSuffix) {
	        if (
	            this.isValid() &&
	            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
	        ) {
	            return createDuration({ to: this, from: time })
	                .locale(this.locale())
	                .humanize(!withoutSuffix);
	        } else {
	            return this.localeData().invalidDate();
	        }
	    }

	    function fromNow(withoutSuffix) {
	        return this.from(createLocal(), withoutSuffix);
	    }

	    function to(time, withoutSuffix) {
	        if (
	            this.isValid() &&
	            ((isMoment(time) && time.isValid()) || createLocal(time).isValid())
	        ) {
	            return createDuration({ from: this, to: time })
	                .locale(this.locale())
	                .humanize(!withoutSuffix);
	        } else {
	            return this.localeData().invalidDate();
	        }
	    }

	    function toNow(withoutSuffix) {
	        return this.to(createLocal(), withoutSuffix);
	    }

	    // If passed a locale key, it will set the locale for this
	    // instance.  Otherwise, it will return the locale configuration
	    // variables for this instance.
	    function locale(key) {
	        var newLocaleData;

	        if (key === undefined) {
	            return this._locale._abbr;
	        } else {
	            newLocaleData = getLocale(key);
	            if (newLocaleData != null) {
	                this._locale = newLocaleData;
	            }
	            return this;
	        }
	    }

	    var lang = deprecate(
	        'moment().lang() is deprecated. Instead, use moment().localeData() to get the language configuration. Use moment().locale() to change languages.',
	        function (key) {
	            if (key === undefined) {
	                return this.localeData();
	            } else {
	                return this.locale(key);
	            }
	        }
	    );

	    function localeData() {
	        return this._locale;
	    }

	    var MS_PER_SECOND = 1000,
	        MS_PER_MINUTE = 60 * MS_PER_SECOND,
	        MS_PER_HOUR = 60 * MS_PER_MINUTE,
	        MS_PER_400_YEARS = (365 * 400 + 97) * 24 * MS_PER_HOUR;

	    // actual modulo - handles negative numbers (for dates before 1970):
	    function mod$1(dividend, divisor) {
	        return ((dividend % divisor) + divisor) % divisor;
	    }

	    function localStartOfDate(y, m, d) {
	        // the date constructor remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            // preserve leap years using a full 400 year cycle, then reset
	            return new Date(y + 400, m, d) - MS_PER_400_YEARS;
	        } else {
	            return new Date(y, m, d).valueOf();
	        }
	    }

	    function utcStartOfDate(y, m, d) {
	        // Date.UTC remaps years 0-99 to 1900-1999
	        if (y < 100 && y >= 0) {
	            // preserve leap years using a full 400 year cycle, then reset
	            return Date.UTC(y + 400, m, d) - MS_PER_400_YEARS;
	        } else {
	            return Date.UTC(y, m, d);
	        }
	    }

	    function startOf(units) {
	        var time, startOfDate;
	        units = normalizeUnits(units);
	        if (units === undefined || units === 'millisecond' || !this.isValid()) {
	            return this;
	        }

	        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

	        switch (units) {
	            case 'year':
	                time = startOfDate(this.year(), 0, 1);
	                break;
	            case 'quarter':
	                time = startOfDate(
	                    this.year(),
	                    this.month() - (this.month() % 3),
	                    1
	                );
	                break;
	            case 'month':
	                time = startOfDate(this.year(), this.month(), 1);
	                break;
	            case 'week':
	                time = startOfDate(
	                    this.year(),
	                    this.month(),
	                    this.date() - this.weekday()
	                );
	                break;
	            case 'isoWeek':
	                time = startOfDate(
	                    this.year(),
	                    this.month(),
	                    this.date() - (this.isoWeekday() - 1)
	                );
	                break;
	            case 'day':
	            case 'date':
	                time = startOfDate(this.year(), this.month(), this.date());
	                break;
	            case 'hour':
	                time = this._d.valueOf();
	                time -= mod$1(
	                    time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
	                    MS_PER_HOUR
	                );
	                break;
	            case 'minute':
	                time = this._d.valueOf();
	                time -= mod$1(time, MS_PER_MINUTE);
	                break;
	            case 'second':
	                time = this._d.valueOf();
	                time -= mod$1(time, MS_PER_SECOND);
	                break;
	        }

	        this._d.setTime(time);
	        hooks.updateOffset(this, true);
	        return this;
	    }

	    function endOf(units) {
	        var time, startOfDate;
	        units = normalizeUnits(units);
	        if (units === undefined || units === 'millisecond' || !this.isValid()) {
	            return this;
	        }

	        startOfDate = this._isUTC ? utcStartOfDate : localStartOfDate;

	        switch (units) {
	            case 'year':
	                time = startOfDate(this.year() + 1, 0, 1) - 1;
	                break;
	            case 'quarter':
	                time =
	                    startOfDate(
	                        this.year(),
	                        this.month() - (this.month() % 3) + 3,
	                        1
	                    ) - 1;
	                break;
	            case 'month':
	                time = startOfDate(this.year(), this.month() + 1, 1) - 1;
	                break;
	            case 'week':
	                time =
	                    startOfDate(
	                        this.year(),
	                        this.month(),
	                        this.date() - this.weekday() + 7
	                    ) - 1;
	                break;
	            case 'isoWeek':
	                time =
	                    startOfDate(
	                        this.year(),
	                        this.month(),
	                        this.date() - (this.isoWeekday() - 1) + 7
	                    ) - 1;
	                break;
	            case 'day':
	            case 'date':
	                time = startOfDate(this.year(), this.month(), this.date() + 1) - 1;
	                break;
	            case 'hour':
	                time = this._d.valueOf();
	                time +=
	                    MS_PER_HOUR -
	                    mod$1(
	                        time + (this._isUTC ? 0 : this.utcOffset() * MS_PER_MINUTE),
	                        MS_PER_HOUR
	                    ) -
	                    1;
	                break;
	            case 'minute':
	                time = this._d.valueOf();
	                time += MS_PER_MINUTE - mod$1(time, MS_PER_MINUTE) - 1;
	                break;
	            case 'second':
	                time = this._d.valueOf();
	                time += MS_PER_SECOND - mod$1(time, MS_PER_SECOND) - 1;
	                break;
	        }

	        this._d.setTime(time);
	        hooks.updateOffset(this, true);
	        return this;
	    }

	    function valueOf() {
	        return this._d.valueOf() - (this._offset || 0) * 60000;
	    }

	    function unix() {
	        return Math.floor(this.valueOf() / 1000);
	    }

	    function toDate() {
	        return new Date(this.valueOf());
	    }

	    function toArray() {
	        var m = this;
	        return [
	            m.year(),
	            m.month(),
	            m.date(),
	            m.hour(),
	            m.minute(),
	            m.second(),
	            m.millisecond(),
	        ];
	    }

	    function toObject() {
	        var m = this;
	        return {
	            years: m.year(),
	            months: m.month(),
	            date: m.date(),
	            hours: m.hours(),
	            minutes: m.minutes(),
	            seconds: m.seconds(),
	            milliseconds: m.milliseconds(),
	        };
	    }

	    function toJSON() {
	        // new Date(NaN).toJSON() === null
	        return this.isValid() ? this.toISOString() : null;
	    }

	    function isValid$2() {
	        return isValid(this);
	    }

	    function parsingFlags() {
	        return extend({}, getParsingFlags(this));
	    }

	    function invalidAt() {
	        return getParsingFlags(this).overflow;
	    }

	    function creationData() {
	        return {
	            input: this._i,
	            format: this._f,
	            locale: this._locale,
	            isUTC: this._isUTC,
	            strict: this._strict,
	        };
	    }

	    addFormatToken('N', 0, 0, 'eraAbbr');
	    addFormatToken('NN', 0, 0, 'eraAbbr');
	    addFormatToken('NNN', 0, 0, 'eraAbbr');
	    addFormatToken('NNNN', 0, 0, 'eraName');
	    addFormatToken('NNNNN', 0, 0, 'eraNarrow');

	    addFormatToken('y', ['y', 1], 'yo', 'eraYear');
	    addFormatToken('y', ['yy', 2], 0, 'eraYear');
	    addFormatToken('y', ['yyy', 3], 0, 'eraYear');
	    addFormatToken('y', ['yyyy', 4], 0, 'eraYear');

	    addRegexToken('N', matchEraAbbr);
	    addRegexToken('NN', matchEraAbbr);
	    addRegexToken('NNN', matchEraAbbr);
	    addRegexToken('NNNN', matchEraName);
	    addRegexToken('NNNNN', matchEraNarrow);

	    addParseToken(
	        ['N', 'NN', 'NNN', 'NNNN', 'NNNNN'],
	        function (input, array, config, token) {
	            var era = config._locale.erasParse(input, token, config._strict);
	            if (era) {
	                getParsingFlags(config).era = era;
	            } else {
	                getParsingFlags(config).invalidEra = input;
	            }
	        }
	    );

	    addRegexToken('y', matchUnsigned);
	    addRegexToken('yy', matchUnsigned);
	    addRegexToken('yyy', matchUnsigned);
	    addRegexToken('yyyy', matchUnsigned);
	    addRegexToken('yo', matchEraYearOrdinal);

	    addParseToken(['y', 'yy', 'yyy', 'yyyy'], YEAR);
	    addParseToken(['yo'], function (input, array, config, token) {
	        var match;
	        if (config._locale._eraYearOrdinalRegex) {
	            match = input.match(config._locale._eraYearOrdinalRegex);
	        }

	        if (config._locale.eraYearOrdinalParse) {
	            array[YEAR] = config._locale.eraYearOrdinalParse(input, match);
	        } else {
	            array[YEAR] = parseInt(input, 10);
	        }
	    });

	    function localeEras(m, format) {
	        var i,
	            l,
	            date,
	            eras = this._eras || getLocale('en')._eras;
	        for (i = 0, l = eras.length; i < l; ++i) {
	            switch (typeof eras[i].since) {
	                case 'string':
	                    // truncate time
	                    date = hooks(eras[i].since).startOf('day');
	                    eras[i].since = date.valueOf();
	                    break;
	            }

	            switch (typeof eras[i].until) {
	                case 'undefined':
	                    eras[i].until = +Infinity;
	                    break;
	                case 'string':
	                    // truncate time
	                    date = hooks(eras[i].until).startOf('day').valueOf();
	                    eras[i].until = date.valueOf();
	                    break;
	            }
	        }
	        return eras;
	    }

	    function localeErasParse(eraName, format, strict) {
	        var i,
	            l,
	            eras = this.eras(),
	            name,
	            abbr,
	            narrow;
	        eraName = eraName.toUpperCase();

	        for (i = 0, l = eras.length; i < l; ++i) {
	            name = eras[i].name.toUpperCase();
	            abbr = eras[i].abbr.toUpperCase();
	            narrow = eras[i].narrow.toUpperCase();

	            if (strict) {
	                switch (format) {
	                    case 'N':
	                    case 'NN':
	                    case 'NNN':
	                        if (abbr === eraName) {
	                            return eras[i];
	                        }
	                        break;

	                    case 'NNNN':
	                        if (name === eraName) {
	                            return eras[i];
	                        }
	                        break;

	                    case 'NNNNN':
	                        if (narrow === eraName) {
	                            return eras[i];
	                        }
	                        break;
	                }
	            } else if ([name, abbr, narrow].indexOf(eraName) >= 0) {
	                return eras[i];
	            }
	        }
	    }

	    function localeErasConvertYear(era, year) {
	        var dir = era.since <= era.until ? +1 : -1;
	        if (year === undefined) {
	            return hooks(era.since).year();
	        } else {
	            return hooks(era.since).year() + (year - era.offset) * dir;
	        }
	    }

	    function getEraName() {
	        var i,
	            l,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (eras[i].since <= val && val <= eras[i].until) {
	                return eras[i].name;
	            }
	            if (eras[i].until <= val && val <= eras[i].since) {
	                return eras[i].name;
	            }
	        }

	        return '';
	    }

	    function getEraNarrow() {
	        var i,
	            l,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (eras[i].since <= val && val <= eras[i].until) {
	                return eras[i].narrow;
	            }
	            if (eras[i].until <= val && val <= eras[i].since) {
	                return eras[i].narrow;
	            }
	        }

	        return '';
	    }

	    function getEraAbbr() {
	        var i,
	            l,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (eras[i].since <= val && val <= eras[i].until) {
	                return eras[i].abbr;
	            }
	            if (eras[i].until <= val && val <= eras[i].since) {
	                return eras[i].abbr;
	            }
	        }

	        return '';
	    }

	    function getEraYear() {
	        var i,
	            l,
	            dir,
	            val,
	            eras = this.localeData().eras();
	        for (i = 0, l = eras.length; i < l; ++i) {
	            dir = eras[i].since <= eras[i].until ? +1 : -1;

	            // truncate time
	            val = this.clone().startOf('day').valueOf();

	            if (
	                (eras[i].since <= val && val <= eras[i].until) ||
	                (eras[i].until <= val && val <= eras[i].since)
	            ) {
	                return (
	                    (this.year() - hooks(eras[i].since).year()) * dir +
	                    eras[i].offset
	                );
	            }
	        }

	        return this.year();
	    }

	    function erasNameRegex(isStrict) {
	        if (!hasOwnProp(this, '_erasNameRegex')) {
	            computeErasParse.call(this);
	        }
	        return isStrict ? this._erasNameRegex : this._erasRegex;
	    }

	    function erasAbbrRegex(isStrict) {
	        if (!hasOwnProp(this, '_erasAbbrRegex')) {
	            computeErasParse.call(this);
	        }
	        return isStrict ? this._erasAbbrRegex : this._erasRegex;
	    }

	    function erasNarrowRegex(isStrict) {
	        if (!hasOwnProp(this, '_erasNarrowRegex')) {
	            computeErasParse.call(this);
	        }
	        return isStrict ? this._erasNarrowRegex : this._erasRegex;
	    }

	    function matchEraAbbr(isStrict, locale) {
	        return locale.erasAbbrRegex(isStrict);
	    }

	    function matchEraName(isStrict, locale) {
	        return locale.erasNameRegex(isStrict);
	    }

	    function matchEraNarrow(isStrict, locale) {
	        return locale.erasNarrowRegex(isStrict);
	    }

	    function matchEraYearOrdinal(isStrict, locale) {
	        return locale._eraYearOrdinalRegex || matchUnsigned;
	    }

	    function computeErasParse() {
	        var abbrPieces = [],
	            namePieces = [],
	            narrowPieces = [],
	            mixedPieces = [],
	            i,
	            l,
	            erasName,
	            erasAbbr,
	            erasNarrow,
	            eras = this.eras();

	        for (i = 0, l = eras.length; i < l; ++i) {
	            erasName = regexEscape(eras[i].name);
	            erasAbbr = regexEscape(eras[i].abbr);
	            erasNarrow = regexEscape(eras[i].narrow);

	            namePieces.push(erasName);
	            abbrPieces.push(erasAbbr);
	            narrowPieces.push(erasNarrow);
	            mixedPieces.push(erasName);
	            mixedPieces.push(erasAbbr);
	            mixedPieces.push(erasNarrow);
	        }

	        this._erasRegex = new RegExp('^(' + mixedPieces.join('|') + ')', 'i');
	        this._erasNameRegex = new RegExp('^(' + namePieces.join('|') + ')', 'i');
	        this._erasAbbrRegex = new RegExp('^(' + abbrPieces.join('|') + ')', 'i');
	        this._erasNarrowRegex = new RegExp(
	            '^(' + narrowPieces.join('|') + ')',
	            'i'
	        );
	    }

	    // FORMATTING

	    addFormatToken(0, ['gg', 2], 0, function () {
	        return this.weekYear() % 100;
	    });

	    addFormatToken(0, ['GG', 2], 0, function () {
	        return this.isoWeekYear() % 100;
	    });

	    function addWeekYearFormatToken(token, getter) {
	        addFormatToken(0, [token, token.length], 0, getter);
	    }

	    addWeekYearFormatToken('gggg', 'weekYear');
	    addWeekYearFormatToken('ggggg', 'weekYear');
	    addWeekYearFormatToken('GGGG', 'isoWeekYear');
	    addWeekYearFormatToken('GGGGG', 'isoWeekYear');

	    // ALIASES

	    // PARSING

	    addRegexToken('G', matchSigned);
	    addRegexToken('g', matchSigned);
	    addRegexToken('GG', match1to2, match2);
	    addRegexToken('gg', match1to2, match2);
	    addRegexToken('GGGG', match1to4, match4);
	    addRegexToken('gggg', match1to4, match4);
	    addRegexToken('GGGGG', match1to6, match6);
	    addRegexToken('ggggg', match1to6, match6);

	    addWeekParseToken(
	        ['gggg', 'ggggg', 'GGGG', 'GGGGG'],
	        function (input, week, config, token) {
	            week[token.substr(0, 2)] = toInt(input);
	        }
	    );

	    addWeekParseToken(['gg', 'GG'], function (input, week, config, token) {
	        week[token] = hooks.parseTwoDigitYear(input);
	    });

	    // MOMENTS

	    function getSetWeekYear(input) {
	        return getSetWeekYearHelper.call(
	            this,
	            input,
	            this.week(),
	            this.weekday() + this.localeData()._week.dow,
	            this.localeData()._week.dow,
	            this.localeData()._week.doy
	        );
	    }

	    function getSetISOWeekYear(input) {
	        return getSetWeekYearHelper.call(
	            this,
	            input,
	            this.isoWeek(),
	            this.isoWeekday(),
	            1,
	            4
	        );
	    }

	    function getISOWeeksInYear() {
	        return weeksInYear(this.year(), 1, 4);
	    }

	    function getISOWeeksInISOWeekYear() {
	        return weeksInYear(this.isoWeekYear(), 1, 4);
	    }

	    function getWeeksInYear() {
	        var weekInfo = this.localeData()._week;
	        return weeksInYear(this.year(), weekInfo.dow, weekInfo.doy);
	    }

	    function getWeeksInWeekYear() {
	        var weekInfo = this.localeData()._week;
	        return weeksInYear(this.weekYear(), weekInfo.dow, weekInfo.doy);
	    }

	    function getSetWeekYearHelper(input, week, weekday, dow, doy) {
	        var weeksTarget;
	        if (input == null) {
	            return weekOfYear(this, dow, doy).year;
	        } else {
	            weeksTarget = weeksInYear(input, dow, doy);
	            if (week > weeksTarget) {
	                week = weeksTarget;
	            }
	            return setWeekAll.call(this, input, week, weekday, dow, doy);
	        }
	    }

	    function setWeekAll(weekYear, week, weekday, dow, doy) {
	        var dayOfYearData = dayOfYearFromWeeks(weekYear, week, weekday, dow, doy),
	            date = createUTCDate(dayOfYearData.year, 0, dayOfYearData.dayOfYear);

	        this.year(date.getUTCFullYear());
	        this.month(date.getUTCMonth());
	        this.date(date.getUTCDate());
	        return this;
	    }

	    // FORMATTING

	    addFormatToken('Q', 0, 'Qo', 'quarter');

	    // PARSING

	    addRegexToken('Q', match1);
	    addParseToken('Q', function (input, array) {
	        array[MONTH] = (toInt(input) - 1) * 3;
	    });

	    // MOMENTS

	    function getSetQuarter(input) {
	        return input == null
	            ? Math.ceil((this.month() + 1) / 3)
	            : this.month((input - 1) * 3 + (this.month() % 3));
	    }

	    // FORMATTING

	    addFormatToken('D', ['DD', 2], 'Do', 'date');

	    // PARSING

	    addRegexToken('D', match1to2, match1to2NoLeadingZero);
	    addRegexToken('DD', match1to2, match2);
	    addRegexToken('Do', function (isStrict, locale) {
	        // TODO: Remove "ordinalParse" fallback in next major release.
	        return isStrict
	            ? locale._dayOfMonthOrdinalParse || locale._ordinalParse
	            : locale._dayOfMonthOrdinalParseLenient;
	    });

	    addParseToken(['D', 'DD'], DATE);
	    addParseToken('Do', function (input, array) {
	        array[DATE] = toInt(input.match(match1to2)[0]);
	    });

	    // MOMENTS

	    var getSetDayOfMonth = makeGetSet('Date', true);

	    // FORMATTING

	    addFormatToken('DDD', ['DDDD', 3], 'DDDo', 'dayOfYear');

	    // PARSING

	    addRegexToken('DDD', match1to3);
	    addRegexToken('DDDD', match3);
	    addParseToken(['DDD', 'DDDD'], function (input, array, config) {
	        config._dayOfYear = toInt(input);
	    });

	    // HELPERS

	    // MOMENTS

	    function getSetDayOfYear(input) {
	        var dayOfYear =
	            Math.round(
	                (this.clone().startOf('day') - this.clone().startOf('year')) / 864e5
	            ) + 1;
	        return input == null ? dayOfYear : this.add(input - dayOfYear, 'd');
	    }

	    // FORMATTING

	    addFormatToken('m', ['mm', 2], 0, 'minute');

	    // PARSING

	    addRegexToken('m', match1to2, match1to2HasZero);
	    addRegexToken('mm', match1to2, match2);
	    addParseToken(['m', 'mm'], MINUTE);

	    // MOMENTS

	    var getSetMinute = makeGetSet('Minutes', false);

	    // FORMATTING

	    addFormatToken('s', ['ss', 2], 0, 'second');

	    // PARSING

	    addRegexToken('s', match1to2, match1to2HasZero);
	    addRegexToken('ss', match1to2, match2);
	    addParseToken(['s', 'ss'], SECOND);

	    // MOMENTS

	    var getSetSecond = makeGetSet('Seconds', false);

	    // FORMATTING

	    addFormatToken('S', 0, 0, function () {
	        return ~~(this.millisecond() / 100);
	    });

	    addFormatToken(0, ['SS', 2], 0, function () {
	        return ~~(this.millisecond() / 10);
	    });

	    addFormatToken(0, ['SSS', 3], 0, 'millisecond');
	    addFormatToken(0, ['SSSS', 4], 0, function () {
	        return this.millisecond() * 10;
	    });
	    addFormatToken(0, ['SSSSS', 5], 0, function () {
	        return this.millisecond() * 100;
	    });
	    addFormatToken(0, ['SSSSSS', 6], 0, function () {
	        return this.millisecond() * 1000;
	    });
	    addFormatToken(0, ['SSSSSSS', 7], 0, function () {
	        return this.millisecond() * 10000;
	    });
	    addFormatToken(0, ['SSSSSSSS', 8], 0, function () {
	        return this.millisecond() * 100000;
	    });
	    addFormatToken(0, ['SSSSSSSSS', 9], 0, function () {
	        return this.millisecond() * 1000000;
	    });

	    // PARSING

	    addRegexToken('S', match1to3, match1);
	    addRegexToken('SS', match1to3, match2);
	    addRegexToken('SSS', match1to3, match3);

	    var token, getSetMillisecond;
	    for (token = 'SSSS'; token.length <= 9; token += 'S') {
	        addRegexToken(token, matchUnsigned);
	    }

	    function parseMs(input, array) {
	        array[MILLISECOND] = toInt(('0.' + input) * 1000);
	    }

	    for (token = 'S'; token.length <= 9; token += 'S') {
	        addParseToken(token, parseMs);
	    }

	    getSetMillisecond = makeGetSet('Milliseconds', false);

	    // FORMATTING

	    addFormatToken('z', 0, 0, 'zoneAbbr');
	    addFormatToken('zz', 0, 0, 'zoneName');

	    // MOMENTS

	    function getZoneAbbr() {
	        return this._isUTC ? 'UTC' : '';
	    }

	    function getZoneName() {
	        return this._isUTC ? 'Coordinated Universal Time' : '';
	    }

	    var proto = Moment.prototype;

	    proto.add = add;
	    proto.calendar = calendar$1;
	    proto.clone = clone;
	    proto.diff = diff;
	    proto.endOf = endOf;
	    proto.format = format;
	    proto.from = from;
	    proto.fromNow = fromNow;
	    proto.to = to;
	    proto.toNow = toNow;
	    proto.get = stringGet;
	    proto.invalidAt = invalidAt;
	    proto.isAfter = isAfter;
	    proto.isBefore = isBefore;
	    proto.isBetween = isBetween;
	    proto.isSame = isSame;
	    proto.isSameOrAfter = isSameOrAfter;
	    proto.isSameOrBefore = isSameOrBefore;
	    proto.isValid = isValid$2;
	    proto.lang = lang;
	    proto.locale = locale;
	    proto.localeData = localeData;
	    proto.max = prototypeMax;
	    proto.min = prototypeMin;
	    proto.parsingFlags = parsingFlags;
	    proto.set = stringSet;
	    proto.startOf = startOf;
	    proto.subtract = subtract;
	    proto.toArray = toArray;
	    proto.toObject = toObject;
	    proto.toDate = toDate;
	    proto.toISOString = toISOString;
	    proto.inspect = inspect;
	    if (typeof Symbol !== 'undefined' && Symbol.for != null) {
	        proto[Symbol.for('nodejs.util.inspect.custom')] = function () {
	            return 'Moment<' + this.format() + '>';
	        };
	    }
	    proto.toJSON = toJSON;
	    proto.toString = toString;
	    proto.unix = unix;
	    proto.valueOf = valueOf;
	    proto.creationData = creationData;
	    proto.eraName = getEraName;
	    proto.eraNarrow = getEraNarrow;
	    proto.eraAbbr = getEraAbbr;
	    proto.eraYear = getEraYear;
	    proto.year = getSetYear;
	    proto.isLeapYear = getIsLeapYear;
	    proto.weekYear = getSetWeekYear;
	    proto.isoWeekYear = getSetISOWeekYear;
	    proto.quarter = proto.quarters = getSetQuarter;
	    proto.month = getSetMonth;
	    proto.daysInMonth = getDaysInMonth;
	    proto.week = proto.weeks = getSetWeek;
	    proto.isoWeek = proto.isoWeeks = getSetISOWeek;
	    proto.weeksInYear = getWeeksInYear;
	    proto.weeksInWeekYear = getWeeksInWeekYear;
	    proto.isoWeeksInYear = getISOWeeksInYear;
	    proto.isoWeeksInISOWeekYear = getISOWeeksInISOWeekYear;
	    proto.date = getSetDayOfMonth;
	    proto.day = proto.days = getSetDayOfWeek;
	    proto.weekday = getSetLocaleDayOfWeek;
	    proto.isoWeekday = getSetISODayOfWeek;
	    proto.dayOfYear = getSetDayOfYear;
	    proto.hour = proto.hours = getSetHour;
	    proto.minute = proto.minutes = getSetMinute;
	    proto.second = proto.seconds = getSetSecond;
	    proto.millisecond = proto.milliseconds = getSetMillisecond;
	    proto.utcOffset = getSetOffset;
	    proto.utc = setOffsetToUTC;
	    proto.local = setOffsetToLocal;
	    proto.parseZone = setOffsetToParsedOffset;
	    proto.hasAlignedHourOffset = hasAlignedHourOffset;
	    proto.isDST = isDaylightSavingTime;
	    proto.isLocal = isLocal;
	    proto.isUtcOffset = isUtcOffset;
	    proto.isUtc = isUtc;
	    proto.isUTC = isUtc;
	    proto.zoneAbbr = getZoneAbbr;
	    proto.zoneName = getZoneName;
	    proto.dates = deprecate(
	        'dates accessor is deprecated. Use date instead.',
	        getSetDayOfMonth
	    );
	    proto.months = deprecate(
	        'months accessor is deprecated. Use month instead',
	        getSetMonth
	    );
	    proto.years = deprecate(
	        'years accessor is deprecated. Use year instead',
	        getSetYear
	    );
	    proto.zone = deprecate(
	        'moment().zone is deprecated, use moment().utcOffset instead. http://momentjs.com/guides/#/warnings/zone/',
	        getSetZone
	    );
	    proto.isDSTShifted = deprecate(
	        'isDSTShifted is deprecated. See http://momentjs.com/guides/#/warnings/dst-shifted/ for more information',
	        isDaylightSavingTimeShifted
	    );

	    function createUnix(input) {
	        return createLocal(input * 1000);
	    }

	    function createInZone() {
	        return createLocal.apply(null, arguments).parseZone();
	    }

	    function preParsePostFormat(string) {
	        return string;
	    }

	    var proto$1 = Locale.prototype;

	    proto$1.calendar = calendar;
	    proto$1.longDateFormat = longDateFormat;
	    proto$1.invalidDate = invalidDate;
	    proto$1.ordinal = ordinal;
	    proto$1.preparse = preParsePostFormat;
	    proto$1.postformat = preParsePostFormat;
	    proto$1.relativeTime = relativeTime;
	    proto$1.pastFuture = pastFuture;
	    proto$1.set = set;
	    proto$1.eras = localeEras;
	    proto$1.erasParse = localeErasParse;
	    proto$1.erasConvertYear = localeErasConvertYear;
	    proto$1.erasAbbrRegex = erasAbbrRegex;
	    proto$1.erasNameRegex = erasNameRegex;
	    proto$1.erasNarrowRegex = erasNarrowRegex;

	    proto$1.months = localeMonths;
	    proto$1.monthsShort = localeMonthsShort;
	    proto$1.monthsParse = localeMonthsParse;
	    proto$1.monthsRegex = monthsRegex;
	    proto$1.monthsShortRegex = monthsShortRegex;
	    proto$1.week = localeWeek;
	    proto$1.firstDayOfYear = localeFirstDayOfYear;
	    proto$1.firstDayOfWeek = localeFirstDayOfWeek;

	    proto$1.weekdays = localeWeekdays;
	    proto$1.weekdaysMin = localeWeekdaysMin;
	    proto$1.weekdaysShort = localeWeekdaysShort;
	    proto$1.weekdaysParse = localeWeekdaysParse;

	    proto$1.weekdaysRegex = weekdaysRegex;
	    proto$1.weekdaysShortRegex = weekdaysShortRegex;
	    proto$1.weekdaysMinRegex = weekdaysMinRegex;

	    proto$1.isPM = localeIsPM;
	    proto$1.meridiem = localeMeridiem;

	    function get$1(format, index, field, setter) {
	        var locale = getLocale(),
	            utc = createUTC().set(setter, index);
	        return locale[field](utc, format);
	    }

	    function listMonthsImpl(format, index, field) {
	        if (isNumber(format)) {
	            index = format;
	            format = undefined;
	        }

	        format = format || '';

	        if (index != null) {
	            return get$1(format, index, field, 'month');
	        }

	        var i,
	            out = [];
	        for (i = 0; i < 12; i++) {
	            out[i] = get$1(format, i, field, 'month');
	        }
	        return out;
	    }

	    // ()
	    // (5)
	    // (fmt, 5)
	    // (fmt)
	    // (true)
	    // (true, 5)
	    // (true, fmt, 5)
	    // (true, fmt)
	    function listWeekdaysImpl(localeSorted, format, index, field) {
	        if (typeof localeSorted === 'boolean') {
	            if (isNumber(format)) {
	                index = format;
	                format = undefined;
	            }

	            format = format || '';
	        } else {
	            format = localeSorted;
	            index = format;
	            localeSorted = false;

	            if (isNumber(format)) {
	                index = format;
	                format = undefined;
	            }

	            format = format || '';
	        }

	        var locale = getLocale(),
	            shift = localeSorted ? locale._week.dow : 0,
	            i,
	            out = [];

	        if (index != null) {
	            return get$1(format, (index + shift) % 7, field, 'day');
	        }

	        for (i = 0; i < 7; i++) {
	            out[i] = get$1(format, (i + shift) % 7, field, 'day');
	        }
	        return out;
	    }

	    function listMonths(format, index) {
	        return listMonthsImpl(format, index, 'months');
	    }

	    function listMonthsShort(format, index) {
	        return listMonthsImpl(format, index, 'monthsShort');
	    }

	    function listWeekdays(localeSorted, format, index) {
	        return listWeekdaysImpl(localeSorted, format, index, 'weekdays');
	    }

	    function listWeekdaysShort(localeSorted, format, index) {
	        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysShort');
	    }

	    function listWeekdaysMin(localeSorted, format, index) {
	        return listWeekdaysImpl(localeSorted, format, index, 'weekdaysMin');
	    }

	    getSetGlobalLocale('en', {
	        eras: [
	            {
	                since: '0001-01-01',
	                until: +Infinity,
	                offset: 1,
	                name: 'Anno Domini',
	                narrow: 'AD',
	                abbr: 'AD',
	            },
	            {
	                since: '0000-12-31',
	                until: -Infinity,
	                offset: 1,
	                name: 'Before Christ',
	                narrow: 'BC',
	                abbr: 'BC',
	            },
	        ],
	        dayOfMonthOrdinalParse: /\d{1,2}(th|st|nd|rd)/,
	        ordinal: function (number) {
	            var b = number % 10,
	                output =
	                    toInt((number % 100) / 10) === 1
	                        ? 'th'
	                        : b === 1
	                          ? 'st'
	                          : b === 2
	                            ? 'nd'
	                            : b === 3
	                              ? 'rd'
	                              : 'th';
	            return number + output;
	        },
	    });

	    // Side effect imports

	    hooks.lang = deprecate(
	        'moment.lang is deprecated. Use moment.locale instead.',
	        getSetGlobalLocale
	    );
	    hooks.langData = deprecate(
	        'moment.langData is deprecated. Use moment.localeData instead.',
	        getLocale
	    );

	    var mathAbs = Math.abs;

	    function abs() {
	        var data = this._data;

	        this._milliseconds = mathAbs(this._milliseconds);
	        this._days = mathAbs(this._days);
	        this._months = mathAbs(this._months);

	        data.milliseconds = mathAbs(data.milliseconds);
	        data.seconds = mathAbs(data.seconds);
	        data.minutes = mathAbs(data.minutes);
	        data.hours = mathAbs(data.hours);
	        data.months = mathAbs(data.months);
	        data.years = mathAbs(data.years);

	        return this;
	    }

	    function addSubtract$1(duration, input, value, direction) {
	        var other = createDuration(input, value);

	        duration._milliseconds += direction * other._milliseconds;
	        duration._days += direction * other._days;
	        duration._months += direction * other._months;

	        return duration._bubble();
	    }

	    // supports only 2.0-style add(1, 's') or add(duration)
	    function add$1(input, value) {
	        return addSubtract$1(this, input, value, 1);
	    }

	    // supports only 2.0-style subtract(1, 's') or subtract(duration)
	    function subtract$1(input, value) {
	        return addSubtract$1(this, input, value, -1);
	    }

	    function absCeil(number) {
	        if (number < 0) {
	            return Math.floor(number);
	        } else {
	            return Math.ceil(number);
	        }
	    }

	    function bubble() {
	        var milliseconds = this._milliseconds,
	            days = this._days,
	            months = this._months,
	            data = this._data,
	            seconds,
	            minutes,
	            hours,
	            years,
	            monthsFromDays;

	        // if we have a mix of positive and negative values, bubble down first
	        // check: https://github.com/moment/moment/issues/2166
	        if (
	            !(
	                (milliseconds >= 0 && days >= 0 && months >= 0) ||
	                (milliseconds <= 0 && days <= 0 && months <= 0)
	            )
	        ) {
	            milliseconds += absCeil(monthsToDays(months) + days) * 864e5;
	            days = 0;
	            months = 0;
	        }

	        // The following code bubbles up values, see the tests for
	        // examples of what that means.
	        data.milliseconds = milliseconds % 1000;

	        seconds = absFloor(milliseconds / 1000);
	        data.seconds = seconds % 60;

	        minutes = absFloor(seconds / 60);
	        data.minutes = minutes % 60;

	        hours = absFloor(minutes / 60);
	        data.hours = hours % 24;

	        days += absFloor(hours / 24);

	        // convert days to months
	        monthsFromDays = absFloor(daysToMonths(days));
	        months += monthsFromDays;
	        days -= absCeil(monthsToDays(monthsFromDays));

	        // 12 months -> 1 year
	        years = absFloor(months / 12);
	        months %= 12;

	        data.days = days;
	        data.months = months;
	        data.years = years;

	        return this;
	    }

	    function daysToMonths(days) {
	        // 400 years have 146097 days (taking into account leap year rules)
	        // 400 years have 12 months === 4800
	        return (days * 4800) / 146097;
	    }

	    function monthsToDays(months) {
	        // the reverse of daysToMonths
	        return (months * 146097) / 4800;
	    }

	    function as(units) {
	        if (!this.isValid()) {
	            return NaN;
	        }
	        var days,
	            months,
	            milliseconds = this._milliseconds;

	        units = normalizeUnits(units);

	        if (units === 'month' || units === 'quarter' || units === 'year') {
	            days = this._days + milliseconds / 864e5;
	            months = this._months + daysToMonths(days);
	            switch (units) {
	                case 'month':
	                    return months;
	                case 'quarter':
	                    return months / 3;
	                case 'year':
	                    return months / 12;
	            }
	        } else {
	            // handle milliseconds separately because of floating point math errors (issue #1867)
	            days = this._days + Math.round(monthsToDays(this._months));
	            switch (units) {
	                case 'week':
	                    return days / 7 + milliseconds / 6048e5;
	                case 'day':
	                    return days + milliseconds / 864e5;
	                case 'hour':
	                    return days * 24 + milliseconds / 36e5;
	                case 'minute':
	                    return days * 1440 + milliseconds / 6e4;
	                case 'second':
	                    return days * 86400 + milliseconds / 1000;
	                // Math.floor prevents floating point math errors here
	                case 'millisecond':
	                    return Math.floor(days * 864e5) + milliseconds;
	                default:
	                    throw new Error('Unknown unit ' + units);
	            }
	        }
	    }

	    function makeAs(alias) {
	        return function () {
	            return this.as(alias);
	        };
	    }

	    var asMilliseconds = makeAs('ms'),
	        asSeconds = makeAs('s'),
	        asMinutes = makeAs('m'),
	        asHours = makeAs('h'),
	        asDays = makeAs('d'),
	        asWeeks = makeAs('w'),
	        asMonths = makeAs('M'),
	        asQuarters = makeAs('Q'),
	        asYears = makeAs('y'),
	        valueOf$1 = asMilliseconds;

	    function clone$1() {
	        return createDuration(this);
	    }

	    function get$2(units) {
	        units = normalizeUnits(units);
	        return this.isValid() ? this[units + 's']() : NaN;
	    }

	    function makeGetter(name) {
	        return function () {
	            return this.isValid() ? this._data[name] : NaN;
	        };
	    }

	    var milliseconds = makeGetter('milliseconds'),
	        seconds = makeGetter('seconds'),
	        minutes = makeGetter('minutes'),
	        hours = makeGetter('hours'),
	        days = makeGetter('days'),
	        months = makeGetter('months'),
	        years = makeGetter('years');

	    function weeks() {
	        return absFloor(this.days() / 7);
	    }

	    var round = Math.round,
	        thresholds = {
	            ss: 44, // a few seconds to seconds
	            s: 45, // seconds to minute
	            m: 45, // minutes to hour
	            h: 22, // hours to day
	            d: 26, // days to month/week
	            w: null, // weeks to month
	            M: 11, // months to year
	        };

	    // helper function for moment.fn.from, moment.fn.fromNow, and moment.duration.fn.humanize
	    function substituteTimeAgo(string, number, withoutSuffix, isFuture, locale) {
	        return locale.relativeTime(number || 1, !!withoutSuffix, string, isFuture);
	    }

	    function relativeTime$1(posNegDuration, withoutSuffix, thresholds, locale) {
	        var duration = createDuration(posNegDuration).abs(),
	            seconds = round(duration.as('s')),
	            minutes = round(duration.as('m')),
	            hours = round(duration.as('h')),
	            days = round(duration.as('d')),
	            months = round(duration.as('M')),
	            weeks = round(duration.as('w')),
	            years = round(duration.as('y')),
	            a =
	                (seconds <= thresholds.ss && ['s', seconds]) ||
	                (seconds < thresholds.s && ['ss', seconds]) ||
	                (minutes <= 1 && ['m']) ||
	                (minutes < thresholds.m && ['mm', minutes]) ||
	                (hours <= 1 && ['h']) ||
	                (hours < thresholds.h && ['hh', hours]) ||
	                (days <= 1 && ['d']) ||
	                (days < thresholds.d && ['dd', days]);

	        if (thresholds.w != null) {
	            a =
	                a ||
	                (weeks <= 1 && ['w']) ||
	                (weeks < thresholds.w && ['ww', weeks]);
	        }
	        a = a ||
	            (months <= 1 && ['M']) ||
	            (months < thresholds.M && ['MM', months]) ||
	            (years <= 1 && ['y']) || ['yy', years];

	        a[2] = withoutSuffix;
	        a[3] = +posNegDuration > 0;
	        a[4] = locale;
	        return substituteTimeAgo.apply(null, a);
	    }

	    // This function allows you to set the rounding function for relative time strings
	    function getSetRelativeTimeRounding(roundingFunction) {
	        if (roundingFunction === undefined) {
	            return round;
	        }
	        if (typeof roundingFunction === 'function') {
	            round = roundingFunction;
	            return true;
	        }
	        return false;
	    }

	    // This function allows you to set a threshold for relative time strings
	    function getSetRelativeTimeThreshold(threshold, limit) {
	        if (thresholds[threshold] === undefined) {
	            return false;
	        }
	        if (limit === undefined) {
	            return thresholds[threshold];
	        }
	        thresholds[threshold] = limit;
	        if (threshold === 's') {
	            thresholds.ss = limit - 1;
	        }
	        return true;
	    }

	    function humanize(argWithSuffix, argThresholds) {
	        if (!this.isValid()) {
	            return this.localeData().invalidDate();
	        }

	        var withSuffix = false,
	            th = thresholds,
	            locale,
	            output;

	        if (typeof argWithSuffix === 'object') {
	            argThresholds = argWithSuffix;
	            argWithSuffix = false;
	        }
	        if (typeof argWithSuffix === 'boolean') {
	            withSuffix = argWithSuffix;
	        }
	        if (typeof argThresholds === 'object') {
	            th = Object.assign({}, thresholds, argThresholds);
	            if (argThresholds.s != null && argThresholds.ss == null) {
	                th.ss = argThresholds.s - 1;
	            }
	        }

	        locale = this.localeData();
	        output = relativeTime$1(this, !withSuffix, th, locale);

	        if (withSuffix) {
	            output = locale.pastFuture(+this, output);
	        }

	        return locale.postformat(output);
	    }

	    var abs$1 = Math.abs;

	    function sign(x) {
	        return (x > 0) - (x < 0) || +x;
	    }

	    function toISOString$1() {
	        // for ISO strings we do not use the normal bubbling rules:
	        //  * milliseconds bubble up until they become hours
	        //  * days do not bubble at all
	        //  * months bubble up until they become years
	        // This is because there is no context-free conversion between hours and days
	        // (think of clock changes)
	        // and also not between days and months (28-31 days per month)
	        if (!this.isValid()) {
	            return this.localeData().invalidDate();
	        }

	        var seconds = abs$1(this._milliseconds) / 1000,
	            days = abs$1(this._days),
	            months = abs$1(this._months),
	            minutes,
	            hours,
	            years,
	            s,
	            total = this.asSeconds(),
	            totalSign,
	            ymSign,
	            daysSign,
	            hmsSign;

	        if (!total) {
	            // this is the same as C#'s (Noda) and python (isodate)...
	            // but not other JS (goog.date)
	            return 'P0D';
	        }

	        // 3600 seconds -> 60 minutes -> 1 hour
	        minutes = absFloor(seconds / 60);
	        hours = absFloor(minutes / 60);
	        seconds %= 60;
	        minutes %= 60;

	        // 12 months -> 1 year
	        years = absFloor(months / 12);
	        months %= 12;

	        // inspired by https://github.com/dordille/moment-isoduration/blob/master/moment.isoduration.js
	        s = seconds ? seconds.toFixed(3).replace(/\.?0+$/, '') : '';

	        totalSign = total < 0 ? '-' : '';
	        ymSign = sign(this._months) !== sign(total) ? '-' : '';
	        daysSign = sign(this._days) !== sign(total) ? '-' : '';
	        hmsSign = sign(this._milliseconds) !== sign(total) ? '-' : '';

	        return (
	            totalSign +
	            'P' +
	            (years ? ymSign + years + 'Y' : '') +
	            (months ? ymSign + months + 'M' : '') +
	            (days ? daysSign + days + 'D' : '') +
	            (hours || minutes || seconds ? 'T' : '') +
	            (hours ? hmsSign + hours + 'H' : '') +
	            (minutes ? hmsSign + minutes + 'M' : '') +
	            (seconds ? hmsSign + s + 'S' : '')
	        );
	    }

	    var proto$2 = Duration.prototype;

	    proto$2.isValid = isValid$1;
	    proto$2.abs = abs;
	    proto$2.add = add$1;
	    proto$2.subtract = subtract$1;
	    proto$2.as = as;
	    proto$2.asMilliseconds = asMilliseconds;
	    proto$2.asSeconds = asSeconds;
	    proto$2.asMinutes = asMinutes;
	    proto$2.asHours = asHours;
	    proto$2.asDays = asDays;
	    proto$2.asWeeks = asWeeks;
	    proto$2.asMonths = asMonths;
	    proto$2.asQuarters = asQuarters;
	    proto$2.asYears = asYears;
	    proto$2.valueOf = valueOf$1;
	    proto$2._bubble = bubble;
	    proto$2.clone = clone$1;
	    proto$2.get = get$2;
	    proto$2.milliseconds = milliseconds;
	    proto$2.seconds = seconds;
	    proto$2.minutes = minutes;
	    proto$2.hours = hours;
	    proto$2.days = days;
	    proto$2.weeks = weeks;
	    proto$2.months = months;
	    proto$2.years = years;
	    proto$2.humanize = humanize;
	    proto$2.toISOString = toISOString$1;
	    proto$2.toString = toISOString$1;
	    proto$2.toJSON = toISOString$1;
	    proto$2.locale = locale;
	    proto$2.localeData = localeData;

	    proto$2.toIsoString = deprecate(
	        'toIsoString() is deprecated. Please use toISOString() instead (notice the capitals)',
	        toISOString$1
	    );
	    proto$2.lang = lang;

	    // FORMATTING

	    addFormatToken('X', 0, 0, 'unix');
	    addFormatToken('x', 0, 0, 'valueOf');

	    // PARSING

	    addRegexToken('x', matchSigned);
	    addRegexToken('X', matchTimestamp);
	    addParseToken('X', function (input, array, config) {
	        config._d = new Date(parseFloat(input) * 1000);
	    });
	    addParseToken('x', function (input, array, config) {
	        config._d = new Date(toInt(input));
	    });

	    //! moment.js

	    hooks.version = '2.30.1';

	    setHookCallback(createLocal);

	    hooks.fn = proto;
	    hooks.min = min;
	    hooks.max = max;
	    hooks.now = now;
	    hooks.utc = createUTC;
	    hooks.unix = createUnix;
	    hooks.months = listMonths;
	    hooks.isDate = isDate;
	    hooks.locale = getSetGlobalLocale;
	    hooks.invalid = createInvalid;
	    hooks.duration = createDuration;
	    hooks.isMoment = isMoment;
	    hooks.weekdays = listWeekdays;
	    hooks.parseZone = createInZone;
	    hooks.localeData = getLocale;
	    hooks.isDuration = isDuration;
	    hooks.monthsShort = listMonthsShort;
	    hooks.weekdaysMin = listWeekdaysMin;
	    hooks.defineLocale = defineLocale;
	    hooks.updateLocale = updateLocale;
	    hooks.locales = listLocales;
	    hooks.weekdaysShort = listWeekdaysShort;
	    hooks.normalizeUnits = normalizeUnits;
	    hooks.relativeTimeRounding = getSetRelativeTimeRounding;
	    hooks.relativeTimeThreshold = getSetRelativeTimeThreshold;
	    hooks.calendarFormat = getCalendarFormat;
	    hooks.prototype = proto;

	    // currently HTML5 input type only supports 24-hour formats
	    hooks.HTML5_FMT = {
	        DATETIME_LOCAL: 'YYYY-MM-DDTHH:mm', // <input type="datetime-local" />
	        DATETIME_LOCAL_SECONDS: 'YYYY-MM-DDTHH:mm:ss', // <input type="datetime-local" step="1" />
	        DATETIME_LOCAL_MS: 'YYYY-MM-DDTHH:mm:ss.SSS', // <input type="datetime-local" step="0.001" />
	        DATE: 'YYYY-MM-DD', // <input type="date" />
	        TIME: 'HH:mm', // <input type="time" />
	        TIME_SECONDS: 'HH:mm:ss', // <input type="time" step="1" />
	        TIME_MS: 'HH:mm:ss.SSS', // <input type="time" step="0.001" />
	        WEEK: 'GGGG-[W]WW', // <input type="week" />
	        MONTH: 'YYYY-MM', // <input type="month" />
	    };

	    return hooks;

	}))); 
} (moment$1));

var momentExports = moment$1.exports;
var moment = /*@__PURE__*/getDefaultExportFromCjs(momentExports);

function getNoteFromStore({ date, granularity }) {
    var _a;
    const notesStore = get_store_value(notesStores[granularity]);
    return (_a = notesStore[getDateUID({ date, granularity })]) === null || _a === void 0 ? void 0 : _a.file;
}
/**
    * @note dependent on `getNoteSettingsByPeriodicity`, must only be called after periodic notes plugin is fully loaded
*/
function getAllVaultNotes(granularity) {
    const notes = {};
    try {
        const { folder, format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
        logger("io-utils-getAllVaultNotes", granularity, format);
        const notesFolder = window.app.vault.getAbstractFileByPath(obsidian.normalizePath(folder));
        if (!notesFolder) {
            throw new Error(`Unable to locate the ${getPeriodicityFromGranularity(granularity)} notes folder. Check your plugin's settings or restart calendar plugin.`);
        }
        obsidian.Vault.recurseChildren(notesFolder, (note) => {
            // console.log(`getAllVaultNotes() > Vault.recurseChildren(${notesFolder}) > note: `, note)
            if (note instanceof obsidian.TFile) {
                // if file name maps to a valid moment date, it is saved in store.
                // console.log(`getAllVaultNotes(${granularity}) > note: `, note.name);
                const date = getDateFromFile(note, granularity);
                if (date) {
                    const dateUID = getDateUID({ date, granularity });
                    window.app.vault.cachedRead(note).then((data) => {
                        var _a;
                        // update store separately to avoid possible slow downs
                        const emoji = (_a = data.match(/#sticker-([^\s]+)/)) === null || _a === void 0 ? void 0 : _a[1];
                        if (emoji) {
                            // update notes object from crr context with resolved data in case they resolve before vault operation is done
                            notes[dateUID] = {
                                file: note,
                                sticker: emoji
                            };
                            notesStores[granularity].update((values) => (Object.assign(Object.assign({}, values), { [dateUID]: {
                                    file: note,
                                    sticker: emoji
                                } })));
                        }
                    });
                    notes[dateUID] = {
                        file: note,
                        sticker: null
                    };
                }
            }
        });
        return notes;
    }
    catch (error) {
        typeof error === 'string' && new obsidian.Notice(error);
        return notes;
    }
}

// https://github.com/liamcain/obsidian-periodic-notes
function validateFilename(filename) {
    const illegalRe = /[?<>\\:*|"]/g;
    // eslint-disable-next-line no-control-regex
    const controlRe = /[\x00-\x1f\x80-\x9f]/g;
    const reservedRe = /^\.+$/;
    const windowsReservedRe = /^(con|prn|aux|nul|com[0-9]|lpt[0-9])(\..*)?$/i;
    return (!illegalRe.test(filename) &&
        !controlRe.test(filename) &&
        !reservedRe.test(filename) &&
        !windowsReservedRe.test(filename));
}
function getBasename(format) {
    var _a;
    const isTemplateNested = format.indexOf('/') !== -1;
    return isTemplateNested ? (_a = format.split('/').pop()) !== null && _a !== void 0 ? _a : '' : format;
}
function validateFormat(format, granularity) {
    const testFormattedDate = window.moment().format(format);
    const parsedDate = window.moment(testFormattedDate, format, true);
    if (!parsedDate.isValid()) {
        return false;
    }
    if (granularity === 'day' &&
        !['m', 'd', 'y'].every((requiredChar) => getBasename(format)
            .replace(/\[[^\]]*\]/g, '') // remove everything within brackets
            .toLowerCase()
            .indexOf(requiredChar) !== -1)) {
        return false;
    }
    return true;
}
/**
    * Get new valid formats from periodic notes plugin, daily notes plugin settings
    * or default formats in case none of them are enabled or installed.
    *
    * @note should noly be called after plugin loads, to ensure plugins settings access.
    */
function getNewValidFormatsFromSettings(existingValidFormats = {
    day: [],
    week: [],
    month: [],
    quarter: [],
    year: []
}) {
    const validFormats = Object.assign({}, existingValidFormats);
    let warningDisplayed = false;
    granularities.forEach((granularity) => {
        const format = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity)).format.split('/').pop();
        logger("[io-validation-format]", granularity, format);
        if (granularity !== 'day' && /^\d{1,2}$/.test(window.moment().format(format))) {
            if (!warningDisplayed) {
                // TODO: rewrite
                new obsidian.Notice('Caution ⚠️: Avoid using formats that yield two-digit numbers, such as "W" or "M", as they can be ambiguous and cause unexpected behavior.', 5500);
                warningDisplayed = true;
            }
        }
        if (!format) {
            return;
        }
        const isFilenameValid = validateFilename(format);
        const isFormatValid = validateFormat(format, granularity);
        const isNewFormat = validFormats[granularity].indexOf(format) === -1;
        isFilenameValid && isFormatValid && isNewFormat && validFormats[granularity].push(format);
    });
    return validFormats;
}

const REGEX = (function generateRegex() {
    const staticParts = ['title', 'date', 'time', 'currentdate', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dynamicParts = granularities.flatMap(granularity => {
        if (granularity === 'day') {
            return ['yesterday', 'tomorrow'];
        }
        else {
            return [`prev-${granularity}`, `next-${granularity}`];
        }
    });
    const allParts = [...staticParts, ...dynamicParts].join("|");
    const pattern = `{{\\s*(${allParts})(([+-]\\d+)([yQMwWdhms]))?:?(.*?)?\\s*}}`;
    return new RegExp(pattern, "gi");
})();
function createOrOpenNote(_a) {
    return __awaiter(this, arguments, void 0, function* ({ leaf, date, granularity, confirmBeforeCreateOverride = get_store_value(settingsStore).shouldConfirmBeforeCreate }) {
        let file = getNoteFromStore({ date, granularity });
        function openFile(file) {
            return __awaiter(this, void 0, void 0, function* () {
                if (file) {
                    file && (yield leaf.openFile(file));
                    activeFileIdStore.setFile(getDateUID({ date, granularity }));
                }
            });
        }
        if (file) {
            yield openFile(file);
        }
        else {
            const periodicity = capitalize(getPeriodicityFromGranularity(granularity));
            const { format } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
            logger("[io-create-or-open-note]", granularity, format);
            const formattedDate = date.format(format);
            const isFormatValid = validateFormat(format, granularity);
            console.log('createOrOpenNote() > isFormatValid: ', isFormatValid);
            if (!isFormatValid) {
                new obsidian.Notice("Invalid format. Please check your plugin's settings.");
                return;
            }
            if (confirmBeforeCreateOverride) {
                createConfirmationDialog({
                    title: `New ${periodicity} Note`,
                    text: `File ${formattedDate} does not exist. Would you like to create it?`,
                    note: getOnCreateNoteDialogNoteFromGranularity(granularity),
                    cta: 'Create',
                    onAccept: () => __awaiter(this, void 0, void 0, function* () {
                        file = yield createNote(granularity, date);
                        console.log('createOrOpenNote() > onAccept() > file: ', file);
                        yield openFile(file);
                        return file;
                    })
                });
            }
            else {
                file = yield createNote(granularity, date);
                console.log('🤯🔥🤯 createOrOpenNote() > file: 🤯🔥🤯', file);
                yield openFile(file);
                console.log('createOrOpenNote() > notesStore: ', get_store_value(notesStores[granularity]));
            }
        }
    });
}
function createNote(granularity, date) {
    return __awaiter(this, void 0, void 0, function* () {
        const { template, format, folder } = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity));
        logger("[io-create--note]", granularity, format);
        const filename = date.format(format);
        const normalizedPath = yield getNotePath(folder, filename);
        const [templateContents, IFoldInfo] = yield getTemplateInfo(template);
        try {
            const createdFile = yield window.app.vault.create(normalizedPath, replaceTemplateContents(date, format, templateContents));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            window.app.foldManager.save(createdFile, IFoldInfo);
            return createdFile;
        }
        catch (err) {
            console.error(`Failed to create file: '${normalizedPath}'`, err);
            new obsidian.Notice(`Failed to create file: '${normalizedPath}'`);
        }
    });
}
/**
 * Replaces date and time placeholders in a template string with formatted date strings.
 *
 * This function supports various date-related placeholders and allows for date adjustments
 * and custom formatting. It's designed to be flexible and handle a wide range of date and
 * time representation needs in templates.
 *
 * Supported placeholders:
 * - {{title}}: The main date (usually the note's date)
 * - {{date}}: Same as title
 * - {{time}}: The current time
 * - {{currentDate}}: The current date and time
 * - {{yesterday}}: The day before the main date
 * - {{tomorrow}}: The day after the main date
 * - {{prev-<granularity>}}: The previous <granularity> before the main date
 * - {{next-<granularity>}}: The next <granularity> after the main date
 * - {{weekday}}: Any day of the week (e.g., {{monday}}, {{tuesday}}, etc.)
 *
 * Each placeholder supports:
 * - Date adjustments: e.g., {{date+1d}}, {{monday-1w}}
 * - Custom formatting: e.g., {{date:YYYY-MM-DD}}, {{time:HH:mm:ss}}
 *
 * Examples:
 * - Title: {{title}}
* - Date: {{date}}
* - Current time: {{time}}
* - Current date: {{currentDAte:LLLL}}
* - Sunday: {{sunday}}
* - Tomorrow: {{tomorrow:dddd, MMMM Do YYYY}}
* - Crr Week: {{date:w}}
* - Next Week: {{next-week:[locale week]-w, [ISO Week]-W}}
* - Prev Monday: {{monday-1w:LLLL}}
* - Next Quarter: {{next-quarter:}}
 *
 * @param granularity The granularity of the note (day, week, month, quarter, year)
 * @param date The main date to use for replacements
 * @param defaultFormat The default format to use when no custom format is specified
 * @param template The template string containing placeholders to be replaced
 * @returns The template string with all placeholders replaced by formatted date strings
 */
function replaceTemplateContents(date, defaultFormat, template) {
    const now = moment();
    const localeWeekdays = (function getLocaleWeekdays() {
        const { moment } = window;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let weekStart = moment.localeData()._week.dow;
        let weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        while (weekStart) {
            weekdays.push(weekdays.shift());
            weekStart--;
        }
        return weekdays;
    })();
    return template.replace(REGEX, (match, type, adjustment, delta, unit, format) => {
        let momentDate;
        let modifiedDefaultFormat = defaultFormat;
        switch (type.toLowerCase()) {
            case 'title':
            case 'date':
                momentDate = date.clone();
                break;
            case 'time':
                momentDate = now.clone();
                modifiedDefaultFormat = 'HH:mm';
                break;
            case 'currentdate':
                momentDate = now.clone();
                break;
            case 'yesterday':
                momentDate = date.clone().subtract(1, 'day');
                break;
            case 'tomorrow':
                momentDate = date.clone().add(1, 'day');
                break;
            default:
                if (localeWeekdays.includes(type.toLowerCase())) {
                    // handle weekdays
                    momentDate = date.clone().weekday(localeWeekdays.indexOf(type.toLowerCase()));
                }
                else if (type.includes("prev")) {
                    // handle previous granularities
                    const granularity = type.split("-")[1];
                    momentDate = date.clone().subtract(1, granularity);
                }
                else if (type.includes("next")) {
                    // handle next granularities
                    const granularity = type.split("-")[1];
                    momentDate = date.clone().add(1, granularity);
                }
                else {
                    return match; // Return unchanged if not recognized
                }
                break;
        }
        if (adjustment) {
            momentDate.add(parseInt(delta, 10), unit);
        }
        return momentDate.format(format || modifiedDefaultFormat);
    });
}
// Example usage
const template = `
Title: {{title}}
Date: {{date}}
Current time: {{time}}
Current date: {{currentDAte:LLLL}}
Sunday: {{sunday}}
Tomorrow: {{tomorrow:dddd, MMMM Do YYYY}}
Crr Week: {{date:w}}
Next Week: {{next-week:[locale week]-w, [ISO Week]-W}}
Prev Monday: {{monday-1w:LLLL}}
Next Quarter: {{next-quarter:}}

Wrong: {{wrong:W}}
`;
const result = replaceTemplateContents(moment(), 'YYYY-MM-DD', template);
console.log(result);

/* src/ui/components/Nldatepicker.svelte generated by Svelte v4.2.19 */

function add_css(target) {
	append_styles(target, "svelte-1ekuxpk", ".container.svelte-1ekuxpk{width:100%\n}@media(min-width: 640px){.container.svelte-1ekuxpk{max-width:640px\n    }}@media(min-width: 768px){.container.svelte-1ekuxpk{max-width:768px\n    }}@media(min-width: 1024px){.container.svelte-1ekuxpk{max-width:1024px\n    }}@media(min-width: 1280px){.container.svelte-1ekuxpk{max-width:1280px\n    }}@media(min-width: 1536px){.container.svelte-1ekuxpk{max-width:1536px\n    }}.pointer-events-none.svelte-1ekuxpk{pointer-events:none\n}.collapse.svelte-1ekuxpk{visibility:collapse\n}.static.svelte-1ekuxpk{position:static\n}.absolute.svelte-1ekuxpk{position:absolute\n}.relative.svelte-1ekuxpk{position:relative\n}.bottom-1.svelte-1ekuxpk{bottom:0.25rem\n}.left-0.svelte-1ekuxpk{left:0px\n}.left-full.svelte-1ekuxpk{left:100%\n}.top-0.svelte-1ekuxpk{top:0px\n}.z-10.svelte-1ekuxpk{z-index:10\n}.z-20.svelte-1ekuxpk{z-index:20\n}.m-0.svelte-1ekuxpk{margin:0px\n}.-ml-1.svelte-1ekuxpk{margin-left:-0.25rem\n}.mb-1\\.5.svelte-1ekuxpk{margin-bottom:0.375rem\n}.ml-\\[5px\\].svelte-1ekuxpk{margin-left:5px\n}.ml-auto.svelte-1ekuxpk{margin-left:auto\n}.mt-2.svelte-1ekuxpk{margin-top:0.5rem\n}.mt-2\\.5.svelte-1ekuxpk{margin-top:0.625rem\n}.mt-3.svelte-1ekuxpk{margin-top:0.75rem\n}.mt-7.svelte-1ekuxpk{margin-top:1.75rem\n}.block.svelte-1ekuxpk{display:block\n}.flex.svelte-1ekuxpk{display:flex\n}.table.svelte-1ekuxpk{display:table\n}.contents.svelte-1ekuxpk{display:contents\n}.\\!h-4.svelte-1ekuxpk{height:1rem !important\n}.\\!h-auto.svelte-1ekuxpk{height:auto !important\n}.h-2\\.5.svelte-1ekuxpk{height:0.625rem\n}.h-\\[8px\\].svelte-1ekuxpk{height:8px\n}.h-auto.svelte-1ekuxpk{height:auto\n}.\\!w-4.svelte-1ekuxpk{width:1rem !important\n}.\\!w-6.svelte-1ekuxpk{width:1.5rem !important\n}.\\!w-8.svelte-1ekuxpk{width:2rem !important\n}.w-2\\.5.svelte-1ekuxpk{width:0.625rem\n}.w-\\[8px\\].svelte-1ekuxpk{width:8px\n}.w-full.svelte-1ekuxpk{width:100%\n}.w-max.svelte-1ekuxpk{width:-moz-max-content;width:max-content\n}.max-w-xs.svelte-1ekuxpk{max-width:20rem\n}.flex-grow.svelte-1ekuxpk{flex-grow:1\n}.border-collapse.svelte-1ekuxpk{border-collapse:collapse\n}.-translate-x-1\\/2.svelte-1ekuxpk{--tw-translate-x:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.-translate-y-1\\/2.svelte-1ekuxpk{--tw-translate-y:-50%;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.rotate-12.svelte-1ekuxpk{--tw-rotate:12deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.rotate-180.svelte-1ekuxpk{--tw-rotate:180deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.rotate-45.svelte-1ekuxpk{--tw-rotate:45deg;transform:translate(var(--tw-translate-x), var(--tw-translate-y)) rotate(var(--tw-rotate)) skewX(var(--tw-skew-x)) skewY(var(--tw-skew-y)) scaleX(var(--tw-scale-x)) scaleY(var(--tw-scale-y))\n}.cursor-not-allowed.svelte-1ekuxpk{cursor:not-allowed\n}.cursor-pointer.svelte-1ekuxpk{cursor:pointer\n}.flex-col.svelte-1ekuxpk{flex-direction:column\n}.items-end.svelte-1ekuxpk{align-items:flex-end\n}.items-center.svelte-1ekuxpk{align-items:center\n}.justify-between.svelte-1ekuxpk{justify-content:space-between\n}.rounded-\\[--radius-s\\].svelte-1ekuxpk{border-radius:var(--radius-s)\n}.rounded-\\[--tab-curve\\].svelte-1ekuxpk{border-radius:var(--tab-curve)\n}.rounded-sm.svelte-1ekuxpk{border-radius:0.125rem\n}.border-0.svelte-1ekuxpk{border-width:0px\n}.bg-\\[--background-modifier-hover\\].svelte-1ekuxpk{background-color:var(--background-modifier-hover)\n}.bg-\\[--interactive-accent\\].svelte-1ekuxpk{background-color:var(--interactive-accent)\n}.bg-slate-500.svelte-1ekuxpk{--tw-bg-opacity:1;background-color:rgb(100 116 139 / var(--tw-bg-opacity))\n}.bg-transparent.svelte-1ekuxpk{background-color:transparent\n}.p-1.svelte-1ekuxpk{padding:0.25rem\n}.p-2.svelte-1ekuxpk{padding:0.5rem\n}.px-1.svelte-1ekuxpk{padding-left:0.25rem;padding-right:0.25rem\n}.px-2.svelte-1ekuxpk{padding-left:0.5rem;padding-right:0.5rem\n}.px-4.svelte-1ekuxpk{padding-left:1rem;padding-right:1rem\n}.py-2.svelte-1ekuxpk{padding-top:0.5rem;padding-bottom:0.5rem\n}.py-3.svelte-1ekuxpk{padding-top:0.75rem;padding-bottom:0.75rem\n}.\\!pt-2.svelte-1ekuxpk{padding-top:0.5rem !important\n}.pt-4.svelte-1ekuxpk{padding-top:1rem\n}.text-center.svelte-1ekuxpk{text-align:center\n}.font-\\[\\'Inter\\'\\].svelte-1ekuxpk{font-family:'Inter'\n}.text-7xl.svelte-1ekuxpk{font-size:4.5rem;line-height:1\n}.text-lg.svelte-1ekuxpk{font-size:1.125rem;line-height:1.75rem\n}.text-sm.svelte-1ekuxpk{font-size:0.875rem;line-height:1.25rem\n}.text-xs.svelte-1ekuxpk{font-size:0.75rem;line-height:1rem\n}.font-medium.svelte-1ekuxpk{font-weight:500\n}.font-semibold.svelte-1ekuxpk{font-weight:600\n}.uppercase.svelte-1ekuxpk{text-transform:uppercase\n}.capitalize.svelte-1ekuxpk{text-transform:capitalize\n}.tabular-nums.svelte-1ekuxpk{--tw-numeric-spacing:tabular-nums;font-variant-numeric:var(--tw-ordinal) var(--tw-slashed-zero) var(--tw-numeric-figure) var(--tw-numeric-spacing) var(--tw-numeric-fraction)\n}.text-\\[--color-arrow\\].svelte-1ekuxpk{color:var(--color-arrow)\n}.text-\\[--color-text-title\\].svelte-1ekuxpk{color:var(--color-text-title)\n}.text-\\[--color-text-today\\].svelte-1ekuxpk{color:var(--color-text-today)\n}.text-\\[--interactive-accent\\].svelte-1ekuxpk{color:var(--interactive-accent)\n}.text-\\[--tab-text-color\\].svelte-1ekuxpk{color:var(--tab-text-color)\n}.text-\\[--text-muted\\].svelte-1ekuxpk{color:var(--text-muted)\n}.text-\\[--text-normal\\].svelte-1ekuxpk{color:var(--text-normal)\n}.text-\\[--text-on-accent\\].svelte-1ekuxpk{color:var(--text-on-accent)\n}.opacity-0.svelte-1ekuxpk{opacity:0\n}.opacity-100.svelte-1ekuxpk{opacity:1\n}.opacity-50.svelte-1ekuxpk{opacity:0.5\n}.opacity-60.svelte-1ekuxpk{opacity:0.6\n}.shadow.svelte-1ekuxpk{--tw-shadow:0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);--tw-shadow-colored:0 1px 3px 0 var(--tw-shadow-color), 0 1px 2px -1px var(--tw-shadow-color);box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)\n}.blur.svelte-1ekuxpk{--tw-blur:blur(8px);filter:var(--tw-blur) var(--tw-brightness) var(--tw-contrast) var(--tw-grayscale) var(--tw-hue-rotate) var(--tw-invert) var(--tw-saturate) var(--tw-sepia) var(--tw-drop-shadow)\n}.transition.svelte-1ekuxpk{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, -webkit-backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter;transition-property:color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, -webkit-backdrop-filter;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms\n}.transition-colors.svelte-1ekuxpk{transition-property:color, background-color, border-color, text-decoration-color, fill, stroke;transition-timing-function:cubic-bezier(0.4, 0, 0.2, 1);transition-duration:150ms\n}.hover\\:cursor-pointer.svelte-1ekuxpk:hover{cursor:pointer\n}.hover\\:bg-\\[--interactive-accent-hover\\].svelte-1ekuxpk:hover{background-color:var(--interactive-accent-hover)\n}.hover\\:bg-\\[--interactive-hover\\].svelte-1ekuxpk:hover{background-color:var(--interactive-hover)\n}.hover\\:text-\\[--text-on-accent\\].svelte-1ekuxpk:hover{color:var(--text-on-accent)\n}.\\[\\&\\:not\\(\\:focus-visible\\)\\]\\:shadow-none.svelte-1ekuxpk:not(:focus-visible){--tw-shadow:0 0 #0000;--tw-shadow-colored:0 0 #0000;box-shadow:var(--tw-ring-offset-shadow, 0 0 #0000), var(--tw-ring-shadow, 0 0 #0000), var(--tw-shadow)\n}");
}

function get_each_context(ctx, list, i) {
	const child_ctx = ctx.slice();
	child_ctx[2] = list[i];
	return child_ctx;
}

// (111:4) {#each granularities as granularity}
function create_each_block(ctx) {
	let option;

	return {
		c() {
			option = element("option");
			option.textContent = `${capitalize(getPeriodicityFromGranularity(/*granularity*/ ctx[2]))} `;
			option.__value = /*granularity*/ ctx[2];
			set_input_value(option, option.__value);
		},
		m(target, anchor) {
			insert(target, option, anchor);
		},
		p: noop,
		d(detaching) {
			if (detaching) {
				detach(option);
			}
		}
	};
}

function create_fragment(ctx) {
	let div16;
	let div4;
	let div2;
	let div0;
	let t1;
	let div1;
	let t2;
	let t3;
	let div3;
	let input0;
	let t4;
	let div9;
	let div7;
	let t8;
	let div8;
	let input1;
	let t9;
	let div14;
	let div12;
	let t13;
	let div13;
	let select;
	let t14;
	let div15;
	let button0;
	let t16;
	let button1;
	let t17;
	let button1_class_value;
	let button1_aria_disabled_value;
	let button1_disabled_value;
	let mounted;
	let dispose;
	let each_value = ensure_array_like(granularities);
	let each_blocks = [];

	for (let i = 0; i < each_value.length; i += 1) {
		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
	}

	return {
		c() {
			div16 = element("div");
			div4 = element("div");
			div2 = element("div");
			div0 = element("div");
			div0.textContent = "Date";
			t1 = space();
			div1 = element("div");
			t2 = text(/*formattedDate*/ ctx[4]);
			t3 = space();
			div3 = element("div");
			input0 = element("input");
			t4 = space();
			div9 = element("div");
			div7 = element("div");
			div7.innerHTML = `<div class="setting-item-name">Date Format</div> <div class="setting-item-description">Moment format to be used</div>`;
			t8 = space();
			div8 = element("div");
			input1 = element("input");
			t9 = space();
			div14 = element("div");
			div12 = element("div");
			div12.innerHTML = `<div class="setting-item-name">Periodicity</div> <div class="setting-item-description">Type of periodic note to be created</div>`;
			t13 = space();
			div13 = element("div");
			select = element("select");

			for (let i = 0; i < each_blocks.length; i += 1) {
				each_blocks[i].c();
			}

			t14 = space();
			div15 = element("div");
			button0 = element("button");
			button0.textContent = "Never mind";
			t16 = space();
			button1 = element("button");
			t17 = text("Open");
			attr(div0, "class", "setting-item-name");
			attr(div1, "class", "setting-item-description");
			attr(div2, "class", "setting-item-info");
			attr(input0, "type", "text");
			attr(input0, "spellcheck", "false");
			attr(input0, "placeholder", "Today");
			attr(div3, "class", "setting-item-control");
			attr(div4, "class", "setting-item border-0 svelte-1ekuxpk");
			attr(div7, "class", "setting-item-info");
			attr(input1, "type", "text");
			attr(input1, "spellcheck", "false");
			attr(input1, "placeholder", "YYYY-MM-DD HH:mm");
			attr(div8, "class", "setting-item-control");
			attr(div9, "class", "setting-item");
			attr(div12, "class", "setting-item-info");
			attr(select, "class", "dropdown");
			if (/*granularity*/ ctx[2] === void 0) add_render_callback(() => /*select_change_handler*/ ctx[12].call(select));
			attr(div13, "class", "setting-item-control");
			attr(div14, "class", "setting-item");
			attr(button0, "class", "cursor-pointer svelte-1ekuxpk");

			attr(button1, "class", button1_class_value = "" + (null_to_empty(`mod-cta ${/*parsedDate*/ ctx[3]
			? 'cursor-pointer'
			: 'cursor-not-allowed opacity-50'}`) + " svelte-1ekuxpk"));

			attr(button1, "aria-disabled", button1_aria_disabled_value = !Boolean(/*parsedDate*/ ctx[3]));
			button1.disabled = button1_disabled_value = !Boolean(/*parsedDate*/ ctx[3]);
			attr(div15, "class", "modal-button-container mt-3 svelte-1ekuxpk");
			attr(div16, "class", "pt-4 svelte-1ekuxpk");
		},
		m(target, anchor) {
			insert(target, div16, anchor);
			append(div16, div4);
			append(div4, div2);
			append(div2, div0);
			append(div2, t1);
			append(div2, div1);
			append(div1, t2);
			append(div4, t3);
			append(div4, div3);
			append(div3, input0);
			set_input_value(input0, /*dateInput*/ ctx[0]);
			append(div16, t4);
			append(div16, div9);
			append(div9, div7);
			append(div9, t8);
			append(div9, div8);
			append(div8, input1);
			set_input_value(input1, /*format*/ ctx[1]);
			append(div16, t9);
			append(div16, div14);
			append(div14, div12);
			append(div14, t13);
			append(div14, div13);
			append(div13, select);

			for (let i = 0; i < each_blocks.length; i += 1) {
				if (each_blocks[i]) {
					each_blocks[i].m(select, null);
				}
			}

			select_option(select, /*granularity*/ ctx[2], true);
			append(div16, t14);
			append(div16, div15);
			append(div15, button0);
			append(div15, t16);
			append(div15, button1);
			append(button1, t17);

			if (!mounted) {
				dispose = [
					listen(input0, "input", /*input0_input_handler*/ ctx[10]),
					listen(input1, "input", /*input1_input_handler*/ ctx[11]),
					listen(select, "change", /*select_change_handler*/ ctx[12]),
					listen(select, "change", /*handleOnChange*/ ctx[7]),
					listen(button0, "click", /*handleCancel*/ ctx[5]),
					listen(button1, "click", /*handleAccept*/ ctx[6])
				];

				mounted = true;
			}
		},
		p(ctx, [dirty]) {
			if (dirty & /*formattedDate*/ 16) set_data(t2, /*formattedDate*/ ctx[4]);

			if (dirty & /*dateInput*/ 1 && input0.value !== /*dateInput*/ ctx[0]) {
				set_input_value(input0, /*dateInput*/ ctx[0]);
			}

			if (dirty & /*format*/ 2 && input1.value !== /*format*/ ctx[1]) {
				set_input_value(input1, /*format*/ ctx[1]);
			}

			if (dirty & /*granularity*/ 4) {
				select_option(select, /*granularity*/ ctx[2]);
			}

			if (dirty & /*parsedDate*/ 8 && button1_class_value !== (button1_class_value = "" + (null_to_empty(`mod-cta ${/*parsedDate*/ ctx[3]
			? 'cursor-pointer'
			: 'cursor-not-allowed opacity-50'}`) + " svelte-1ekuxpk"))) {
				attr(button1, "class", button1_class_value);
			}

			if (dirty & /*parsedDate*/ 8 && button1_aria_disabled_value !== (button1_aria_disabled_value = !Boolean(/*parsedDate*/ ctx[3]))) {
				attr(button1, "aria-disabled", button1_aria_disabled_value);
			}

			if (dirty & /*parsedDate*/ 8 && button1_disabled_value !== (button1_disabled_value = !Boolean(/*parsedDate*/ ctx[3]))) {
				button1.disabled = button1_disabled_value;
			}
		},
		i: noop,
		o: noop,
		d(detaching) {
			if (detaching) {
				detach(div16);
			}

			destroy_each(each_blocks, detaching);
			mounted = false;
			run_all(dispose);
		}
	};
}

function instance($$self, $$props, $$invalidate) {
	let format;

	var __awaiter = this && this.__awaiter || function (thisArg, _arguments, P, generator) {
		function adopt(value) {
			return value instanceof P
			? value
			: new P(function (resolve) {
						resolve(value);
					});
		}

		return new (P || (P = Promise))(function (resolve, reject) {
				function fulfilled(value) {
					try {
						step(generator.next(value));
					} catch(e) {
						reject(e);
					}
				}

				function rejected(value) {
					try {
						step(generator["throw"](value));
					} catch(e) {
						reject(e);
					}
				}

				function step(result) {
					result.done
					? resolve(result.value)
					: adopt(result.value).then(fulfilled, rejected);
				}

				step((generator = generator.apply(thisArg, _arguments || [])).next());
			});
	};

	let { modalClass } = $$props;
	let { pluginClass } = $$props;
	const nldatesPlugin = window.app.plugins.getPlugin('nldates-obsidian');
	const settings = get_store_value(settingsStore);
	let granularity = settings.crrNldModalGranularity;
	let dateInput = '';
	let parsedDate;
	let formattedDate = window.moment().format(format || getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity)).format);

	const getDateStr = () => {
		let cleanDateInput = dateInput;

		if (dateInput.endsWith('|')) {
			cleanDateInput = dateInput.slice(0, -1);
		}

		$$invalidate(4, formattedDate = 'Loading...');
		const nlParsedDate = nldatesPlugin.parseDate(cleanDateInput || 'today');

		if (nlParsedDate.moment.isValid()) {
			$$invalidate(3, parsedDate = nlParsedDate.moment);
			$$invalidate(4, formattedDate = nlParsedDate.moment.format(format));
		} else {
			$$invalidate(3, parsedDate = null);
			$$invalidate(4, formattedDate = 'Invalid date');
		}
	};

	// event handlers
	const enterKeyCb = ev => {
		const target = ev.target;

		if (ev.key === 'Enter' && target.className !== 'dropdown') {
			handleAccept();
		}

		if (document.getElementsByClassName('modal').length === 0) {
			window.removeEventListener('keydown', enterKeyCb);
		}
	};

	const handleCancel = () => __awaiter(void 0, void 0, void 0, function* () {
		modalClass.close();
		window.removeEventListener('keydown', enterKeyCb);
	});

	const handleAccept = () => __awaiter(void 0, void 0, void 0, function* () {
		if (parsedDate) {
			modalClass.close();
			const { workspace } = window.app;
			const leaf = workspace.getLeaf(false);

			createOrOpenNote({
				leaf,
				date: parsedDate,
				granularity,
				confirmBeforeCreateOverride: false
			});
		}

		window.removeEventListener('keydown', enterKeyCb);
	});

	const handleOnChange = ev => {
		pluginClass.saveSettings(() => ({
			crrNldModalGranularity: ev.currentTarget.value
		}));
	};

	onMount(() => {
		window.addEventListener('keydown', enterKeyCb);
	});

	function input0_input_handler() {
		dateInput = this.value;
		$$invalidate(0, dateInput);
	}

	function input1_input_handler() {
		format = this.value;
		($$invalidate(1, format), $$invalidate(2, granularity));
	}

	function select_change_handler() {
		granularity = select_value(this);
		$$invalidate(2, granularity);
	}

	$$self.$$set = $$props => {
		if ('modalClass' in $$props) $$invalidate(8, modalClass = $$props.modalClass);
		if ('pluginClass' in $$props) $$invalidate(9, pluginClass = $$props.pluginClass);
	};

	$$self.$$.update = () => {
		if ($$self.$$.dirty & /*granularity*/ 4) {
			$$invalidate(1, format = getNoteSettingsByPeriodicity(getPeriodicityFromGranularity(granularity)).format);
		}

		if ($$self.$$.dirty & /*dateInput, format*/ 3) {
			(obsidian.debounce(getDateStr, 50)());
		}
	};

	return [
		dateInput,
		format,
		granularity,
		parsedDate,
		formattedDate,
		handleCancel,
		handleAccept,
		handleOnChange,
		modalClass,
		pluginClass,
		input0_input_handler,
		input1_input_handler,
		select_change_handler
	];
}

class Nldatepicker extends SvelteComponent {
	constructor(options) {
		super();
		init(this, options, instance, create_fragment, safe_not_equal, { modalClass: 8, pluginClass: 9 }, add_css);
	}
}

class NldatePickerModal extends obsidian.Modal {
    constructor(plugin) {
        super(window.app);
        const { contentEl } = this;
        // Create a div to mount the Svelte component
        const svelteContainer = contentEl.createDiv();
        // Instantiate the Svelte component
        new Nldatepicker({
            target: svelteContainer,
            props: {
                modalClass: this,
                pluginClass: plugin
            }
        });
    }
}
function createNldatePickerDialog(plugin) {
    new NldatePickerModal(plugin).open();
}

class CalendarView extends obsidian.ItemView {
    constructor(leaf, plugin) {
        super(leaf);
        this.plugin = plugin;
        this.registerEvent(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        this.app.workspace.on('periodic-notes:settings-updated', obsidian.debounce(this.onPeriodicNotesSettingsUpdate.bind(this), 1000)));
        this.registerEvent(this.app.vault.on('create', (file) => this.onFileCreated(file)));
        this.registerEvent(this.app.vault.on('delete', (file) => this.onFileDeleted(file)));
        this.registerEvent(this.app.vault.on('rename', (file, oldPath) => this.onFileRenamed(file, oldPath)));
        // this.registerEvent(
        // 	this.app.vault.on('modify', (file: TAbstractFile) => this.onFileModified(file as TFile))
        // );
        this.registerEvent(this.app.metadataCache.on('changed', this.onFileModified));
        this.registerEvent(this.app.workspace.on('file-open', () => this.onFileOpen()));
    }
    getViewType() {
        return VIEW_TYPE;
    }
    getDisplayText() {
        return 'Example view';
    }
    onOpen() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('On open view👐');
            this.view = new View({
                target: this.contentEl
            });
            // index existing notes
            if (this.app.workspace.layoutReady && this.view) {
                granularities.forEach((granularity) => {
                    notesStores[granularity].index();
                });
            }
        });
    }
    onClose() {
        console.log('On close view❌');
        if (this.view) {
            this.view.$destroy();
        }
        return Promise.resolve();
    }
    // triggered when periodic-notes settings are updated
    onPeriodicNotesSettingsUpdate() {
        return __awaiter(this, void 0, void 0, function* () {
            const periodicNotesPlugin = yield getPlugin(PERIODIC_NOTES_PLUGIN_ID);
            console.log("new settings", periodicNotesPlugin.settings);
            this.plugin.saveSettings((oldSettings) => {
                console.log("😋 saving settings", oldSettings);
                return {
                    validFormats: getNewValidFormatsFromSettings(oldSettings.validFormats)
                };
            });
            this.updateActiveFile.bind(this)();
        });
    }
    onFileCreated(file) {
        if (this.app.workspace.layoutReady && this.view) {
            let date = null;
            const granularity = granularities.find((granularity) => (date = getDateFromFile(file, granularity, true)));
            console.log('On file created > date: ', date);
            console.log('On file created > granularity: ', granularity);
            if (date && granularity) {
                const dateUID = getDateUID({ date, granularity });
                console.log('On file created > dateUID: ', dateUID);
                const fileExists = get_store_value(notesStores[granularity])[dateUID];
                console.log('On file created > fileExists: ', fileExists);
                // update matching file in store
                !fileExists &&
                    notesStores[granularity].update((values) => (Object.assign(Object.assign({}, values), { [dateUID]: {
                            file,
                            sticker: null
                        } })));
            }
        }
    }
    onFileDeleted(file) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log('❌ ON file deleted ❌');
            let date = null;
            const granularity = granularities.find((granularity) => (date = getDateFromFile(file, granularity)));
            if (date && granularity) {
                const notesStore = notesStores[granularity];
                const dateUID = getDateUID({ date, granularity });
                const fileExists = get_store_value(notesStore)[dateUID];
                const newStore = Object.assign({}, get_store_value(notesStore));
                if (fileExists) {
                    delete newStore[dateUID];
                    notesStore.update(() => newStore);
                    console.log(`${dateUID} succesfully deleted`, 'new store: ', get_store_value(notesStores[granularity]));
                }
            }
            this.updateActiveFile();
        });
    }
    onFileRenamed(renamedFile, oldPath) {
        return __awaiter(this, void 0, void 0, function* () {
            let newDate = null;
            const newGranularity = granularities.find((granularity) => (newDate = getDateFromFile(renamedFile, granularity)));
            let oldDate = null;
            const oldGranularity = granularities.find((granularity) => (oldDate = getDateFromPath(oldPath, granularity)));
            const oldIsValid = Boolean(oldDate && oldGranularity);
            const newIsValid = Boolean(newDate && newGranularity);
            // OLD filename INVALID ❌ && NEW filename VALID ✅ => update store to add NEW file with null emoji
            if (!oldIsValid && newIsValid && newGranularity) {
                const notesStore = notesStores[newGranularity];
                const dateUID = getDateUID({
                    date: newDate,
                    granularity: newGranularity
                });
                notesStore.update((values) => (Object.assign(Object.assign({}, values), { [dateUID]: {
                        file: renamedFile,
                        sticker: null
                    } })));
            }
            // OLD filename VALID ✅ && NEW filename INVALID ❌ => update store to remove OLD
            if (oldIsValid && !newIsValid && oldGranularity && newGranularity) {
                const notesStore = notesStores[oldGranularity];
                const dateUID = getDateUID({
                    date: oldDate,
                    granularity: newGranularity
                });
                const newStore = Object.assign({}, get_store_value(notesStore));
                delete newStore[dateUID];
                notesStore.set(newStore);
            }
            // OLD filename CALID ✅ && NEW filename INVALID ✅ => update store to remove OLD and add NEW one with OLD emoji
            if (oldIsValid && newIsValid && newGranularity && oldGranularity) {
                const newNotesStore = notesStores[newGranularity];
                const newDateUID = getDateUID({
                    date: newDate,
                    granularity: newGranularity
                });
                const oldNotesStore = notesStores[oldGranularity];
                const oldDateUID = getDateUID({
                    date: oldDate,
                    granularity: newGranularity
                });
                const oldEmoji = get_store_value(oldNotesStore)[oldDateUID].sticker;
                // remove OLD file
                const newStore = Object.assign({}, get_store_value(oldNotesStore));
                delete newStore[oldDateUID];
                // add NEW file to store with OLD emoji
                newNotesStore.update((values) => (Object.assign(Object.assign({}, values), { [newDateUID]: {
                        file: renamedFile,
                        sticker: oldEmoji
                    } })));
            }
            console.log('‍✏️On file renamed ✏️ > file: ', renamedFile, oldPath);
            console.log('new store: ', newGranularity && get_store_value(notesStores[newGranularity]));
        });
    }
    onFileModified(file, data, cache) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            console.log('‍✏️On file modified ✏️ > file: ', file, cache);
            let date = null;
            const granularity = granularities.find((granularity) => (date = getDateFromFile(file, granularity)));
            const dateUID = date && granularity ? getDateUID({ date, granularity }) : null;
            const notesStore = (granularity && notesStores[granularity]) || null;
            const oldEmoji = notesStore && dateUID && get_store_value(notesStore)[dateUID].sticker;
            const newEmoji = ((_c = (_b = (_a = cache.tags) === null || _a === void 0 ? void 0 : _a.find((el) => el.tag.contains('sticker-'))) === null || _b === void 0 ? void 0 : _b.tag.match(/#sticker-([^\s]+)/)) === null || _c === void 0 ? void 0 : _c[1]) || null;
            if (oldEmoji !== newEmoji && notesStore && granularity && dateUID) {
                console.log('updating EMOJI 🏳️‍🌈');
                notesStores[granularity].update((values) => (Object.assign(Object.assign({}, values), { [dateUID]: {
                        file,
                        sticker: newEmoji
                    } })));
            }
        });
    }
    onFileOpen() {
        if (this.app.workspace.layoutReady) {
            console.log('view.ts > onFileOpen()');
            this.updateActiveFile();
        }
    }
    // onHover({ date, targetEl, isControlPressed, granularity }: Parameters<TOnHover>[0]): void {
    // 	// console.log('view.ts > onHover(): 📈')
    // 	// this.keydownFn && window.removeEventListener('keydown', this.keydownFn);
    // 	const { format } = getNoteSettingsByPeriodicity(granularity);
    // 	const note = getNoteByGranularity({ date, granularity });
    // 	this.triggerLinkHover = () =>
    // 		this.app.workspace.trigger('link-hover', this, targetEl, date.format(format), note?.path);
    // 	if (!isControlPressed && !this.settings.autoHoverPreview) {
    // 		// TODO: add markdown view popover when ctrlKey pressed after hover
    // 		// window.addEventListener('keydown', this.keydownFn);
    // 		return;
    // 	}
    // 	this.triggerLinkHover();
    // }
    // Utils
    updateActiveFile() {
        console.log('🪟📅 view.ts > updateActiveFile()');
        // get activeLeaf view
        this.app.workspace.activeLeaf;
        // TODO: may cause unexpected behavior, check on it.
        const activeLeaf = this.app.workspace.getActiveViewOfType(CalendarView);
        let file = null;
        if ((activeLeaf === null || activeLeaf === void 0 ? void 0 : activeLeaf.view) && (activeLeaf === null || activeLeaf === void 0 ? void 0 : activeLeaf.view) instanceof obsidian.FileView) {
            // extract file from view
            file = activeLeaf.view.file;
            if (file) {
                let noteDate = null;
                let noteGranularity = null;
                for (const granularity of granularities) {
                    const date = getDateFromFile(file, granularity);
                    console.log('✅✅✅date and granularity found ✅✅✅');
                    console.log('date', date, 'granularity', granularity);
                    if (date) {
                        noteDate = date;
                        noteGranularity = granularity;
                        break;
                    }
                }
                // save file in activeFile store
                if (noteDate && noteGranularity) {
                    activeFileIdStore.setFile(getDateUID({ date: noteDate, granularity: noteGranularity }));
                }
            }
        }
    }
    keydownCallback(ev) {
        console.log('view.ts > keydownCallback > isControlPressed() > this: ', this, isControlPressed(ev));
        if (isControlPressed(ev)) {
            this.triggerLinkHover();
        }
    }
}

class PeriodicNotesCalendarPlugin extends obsidian.Plugin {
    constructor() {
        super(...arguments);
        this.popovers = {};
        this.popoversCleanups = [];
    }
    onunload() {
        console.log('ON Unload ⛰️');
        this.app.workspace.getLeavesOfType(VIEW_TYPE).forEach((leaf) => leaf.detach());
        this.popoversCleanups.length > 0 && this.popoversCleanups.forEach((cleanup) => cleanup());
    }
    onload() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.loadSettings();
            console.log('ON Load 🫵');
            pluginClassStore.set(this);
            yield getPlugin(PERIODIC_NOTES_PLUGIN_ID);
            yield getDailyNotesPlugin();
            const unsubSettingsStore = settingsStore.subscribe((settings) => {
                this.settings = settings;
            });
            this.register(unsubSettingsStore);
            this.addSettingTab(new SettingsTab(this.app, this));
            this.handleRibbon();
            // register view
            this.registerView(VIEW_TYPE, (leaf) => new CalendarView(leaf, this));
            // Commands
            this.addCommand({
                id: 'open-calendar-view',
                name: 'Open calendar view',
                callback: () => {
                    this.toggleView();
                }
            });
            granularities.forEach((granularity) => {
                ['previous', 'next'].forEach((pos) => {
                    const periodicity = getPeriodicityFromGranularity(granularity);
                    let posText;
                    if (granularity === 'day') {
                        posText = pos === 'next' ? 'tomorrow' : 'yesterday';
                    }
                    else {
                        posText = `${pos}-${periodicity}`;
                    }
                    this.addCommand({
                        id: `create-${posText}-note`,
                        name: `Open ${granularity === 'day'
                            ? `${posText}'s`
                            : `${pos} ${getPeriodicityFromGranularity(granularity)}`} note`,
                        callback: () => {
                            const { workspace } = window.app;
                            const leaf = workspace.getLeaf(false);
                            const newDate = window
                                .moment()
                                .clone()[pos === 'next' ? 'add' : 'subtract'](1, granularity)
                                .startOf(granularity);
                            createOrOpenNote({ leaf, date: newDate, granularity, confirmBeforeCreateOverride: false });
                        }
                    });
                });
            });
            const nlDatesPlugin = yield getPlugin(NLDATES_PLUGIN_ID);
            this.addCommand({
                id: 'open-nldate-note',
                name: 'Open a Periodic Note based on Natural Language Date selection',
                callback: () => {
                    if (nlDatesPlugin) {
                        createNldatePickerDialog(this);
                    }
                    else {
                        new obsidian.Notice(`Please install '${NLDATES_PLUGIN_ID}' plugin to use this command`);
                    }
                }
            });
            // add quick locales switch commands
            if (this.settings.allowLocalesSwitchFromCommandPalette) {
                window.moment.locales().forEach((momentLocale) => {
                    this.addCommand({
                        id: `switch-to - ${momentLocale} -locale`,
                        name: `Switch to ${localesMap.get(momentLocale) || momentLocale} locale`,
                        callback: () => {
                            updateLocale(momentLocale);
                            updateWeekStart();
                            updateWeekdays();
                        }
                    });
                });
            }
            this.app.workspace.onLayoutReady(() => {
                console.log('ON Layout REady 🙌');
                this.initView({ active: false });
                if (this.settings.openPopoverOnRibbonHover) {
                    Popover.create({
                        id: CALENDAR_POPOVER_ID,
                        view: {
                            Component: View
                        }
                    });
                }
            });
        });
    }
    loadSettings() {
        return __awaiter(this, void 0, void 0, function* () {
            const settings = (yield this.loadData());
            !settings && (yield this.saveData(DEFAULT_SETTINGS));
            settingsStore.update((old) => (Object.assign(Object.assign({}, old), (settings || {}))));
        });
    }
    saveSettings(changeSettings) {
        return __awaiter(this, void 0, void 0, function* () {
            settingsStore.update((old) => {
                return Object.assign(Object.assign({}, old), changeSettings(old));
            });
            yield this.saveData(this.settings);
        });
    }
    handleRibbon() {
        const ribbonEl = this.addRibbonIcon('dice', 'Open calendar', () => {
            var _a;
            const calendarPopover = getPopoverInstance(CALENDAR_POPOVER_ID);
            if (this.settings.leafViewEnabled) {
                this.toggleView();
                if (this.settings.openPopoverOnRibbonHover && (calendarPopover === null || calendarPopover === void 0 ? void 0 : calendarPopover.opened)) {
                    calendarPopover.close();
                }
                return;
            }
            else {
                if (this.settings.openPopoverOnRibbonHover) {
                    calendarPopover === null || calendarPopover === void 0 ? void 0 : calendarPopover.toggle();
                    return;
                }
                else {
                    const calendarEl = document.querySelector(`#${CALENDAR_POPOVER_ID} [data - popover="true"]`);
                    if (!calendarEl &&
                        !getPopoverInstance(CALENDAR_POPOVER_ID)) {
                        Popover.create({
                            id: CALENDAR_POPOVER_ID,
                            view: {
                                Component: View
                            }
                        }).open();
                    }
                    else {
                        (_a = getPopoverInstance(CALENDAR_POPOVER_ID)) === null || _a === void 0 ? void 0 : _a.toggle();
                    }
                }
            }
        });
        ribbonEl.id = `${CALENDAR_POPOVER_ID} -ribbon - ref - el`;
    }
    initView() {
        return __awaiter(this, arguments, void 0, function* ({ active } = { active: true }) {
            var _a;
            this.app.workspace.detachLeavesOfType(VIEW_TYPE);
            yield ((_a = this.app.workspace[`get${get_store_value(settingsStore).viewLeafPosition}Leaf`](false)) === null || _a === void 0 ? void 0 : _a.setViewState({
                type: VIEW_TYPE,
                active
            }));
        });
    }
    revealView() {
        // get calendar view and set it as active
        this.app.workspace.revealLeaf(this.app.workspace.getLeavesOfType(VIEW_TYPE)[0]);
        this.app.workspace.getLeavesOfType(VIEW_TYPE)[0].setViewState({
            type: VIEW_TYPE,
            active: true
        });
    }
    toggleView() {
        return __awaiter(this, void 0, void 0, function* () {
            /**
             * HTMLElement where View is rendered at
             */
            const leaf = this.app.workspace.getLeavesOfType(VIEW_TYPE)[0];
            if (!leaf) {
                yield this.initView();
                return;
            }
            const getSplitPos = () => {
                var _a;
                const closestWorkspaceSplitClassName = (_a = leaf.containerEl.closest('.workspace-split')) === null || _a === void 0 ? void 0 : _a.className;
                if (closestWorkspaceSplitClassName === null || closestWorkspaceSplitClassName === void 0 ? void 0 : closestWorkspaceSplitClassName.includes('left')) {
                    return 'left';
                }
                if (closestWorkspaceSplitClassName === null || closestWorkspaceSplitClassName === void 0 ? void 0 : closestWorkspaceSplitClassName.includes('right')) {
                    return 'right';
                }
                return 'root';
            };
            /**
             * The worskpace split where leaf is currently attached to
             * based on closest workspace split className
             */
            const crrSplitPos = getSplitPos();
            console.log('crrSplitPos', crrSplitPos);
            /**
             * A split is a container for leaf nodes that slides in when clicking the collapse button, except for the root split (markdown editor). There are three types: left, root, and right.
             */
            const crrSplit = this.app.workspace[`${crrSplitPos}Split`];
            console.log('crrSplit', crrSplit);
            const leafActive = leaf.tabHeaderEl.className.includes('is-active');
            console.log('leafActive', leafActive);
            // Scnearios
            // eval root split
            if (crrSplit instanceof obsidian.WorkspaceRoot) {
                if (leafActive) {
                    // 1. root split && leaf active
                    leaf.view.unload();
                    yield this.initView({ active: false });
                    return;
                }
                // 2. root split && leaf NOT active
                this.revealView();
                return;
            }
            // eval left or right split
            // only leftSplit and rightSplit can be collapsed
            if (!crrSplit.collapsed) {
                if (leafActive) {
                    // 3. crr split open and leaf active
                    crrSplit.collapse();
                }
                else {
                    // 4. crr split open and leaf NOT active
                    this.revealView();
                }
            }
            else {
                // 5. crr split collapsed
                this.revealView();
            }
        });
    }
    getTheme() {
        this.getTheme();
    }
}

module.exports = PeriodicNotesCalendarPlugin;
