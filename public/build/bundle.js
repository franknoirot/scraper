
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function assign(tar, src) {
        // @ts-ignore
        for (const k in src)
            tar[k] = src[k];
        return tar;
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function validate_store(store, name) {
        if (store != null && typeof store.subscribe !== 'function') {
            throw new Error(`'${name}' is not a store with a 'subscribe' method`);
        }
    }
    function subscribe(store, ...callbacks) {
        if (store == null) {
            return noop;
        }
        const unsub = store.subscribe(...callbacks);
        return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
    }
    function component_subscribe(component, store, callback) {
        component.$$.on_destroy.push(subscribe(store, callback));
    }
    function create_slot(definition, ctx, $$scope, fn) {
        if (definition) {
            const slot_ctx = get_slot_context(definition, ctx, $$scope, fn);
            return definition[0](slot_ctx);
        }
    }
    function get_slot_context(definition, ctx, $$scope, fn) {
        return definition[1] && fn
            ? assign($$scope.ctx.slice(), definition[1](fn(ctx)))
            : $$scope.ctx;
    }
    function get_slot_changes(definition, $$scope, dirty, fn) {
        if (definition[2] && fn) {
            const lets = definition[2](fn(dirty));
            if (typeof $$scope.dirty === 'object') {
                const merged = [];
                const len = Math.max($$scope.dirty.length, lets.length);
                for (let i = 0; i < len; i += 1) {
                    merged[i] = $$scope.dirty[i] | lets[i];
                }
                return merged;
            }
            return $$scope.dirty | lets;
        }
        return $$scope.dirty;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function set_store_value(store, ret, value = ret) {
        store.set(value);
        return ret;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function element(name) {
        return document.createElement(name);
    }
    function svg_element(name) {
        return document.createElementNS('http://www.w3.org/2000/svg', name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_style(node, key, value, important) {
        node.style.setProperty(key, value, important ? 'important' : '');
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onDestroy(fn) {
        get_current_component().$$.on_destroy.push(fn);
    }
    function setContext(key, context) {
        get_current_component().$$.context.set(key, context);
    }
    function getContext(key) {
        return get_current_component().$$.context.get(key);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function tick() {
        schedule_update();
        return resolved_promise;
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
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
        flushing = false;
        seen_callbacks.clear();
    }
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
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);

    function destroy_block(block, lookup) {
        block.d(1);
        lookup.delete(block.key);
    }
    function outro_and_destroy_block(block, lookup) {
        transition_out(block, 1, 1, () => {
            lookup.delete(block.key);
        });
    }
    function update_keyed_each(old_blocks, dirty, get_key, dynamic, ctx, list, lookup, node, destroy, create_each_block, next, get_context) {
        let o = old_blocks.length;
        let n = list.length;
        let i = o;
        const old_indexes = {};
        while (i--)
            old_indexes[old_blocks[i].key] = i;
        const new_blocks = [];
        const new_lookup = new Map();
        const deltas = new Map();
        i = n;
        while (i--) {
            const child_ctx = get_context(ctx, list, i);
            const key = get_key(child_ctx);
            let block = lookup.get(key);
            if (!block) {
                block = create_each_block(key, child_ctx);
                block.c();
            }
            else if (dynamic) {
                block.p(child_ctx, dirty);
            }
            new_lookup.set(key, new_blocks[i] = block);
            if (key in old_indexes)
                deltas.set(key, Math.abs(i - old_indexes[key]));
        }
        const will_move = new Set();
        const did_move = new Set();
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
            }
            else if (!new_lookup.has(old_key)) {
                // remove old block
                destroy(old_block, lookup);
                o--;
            }
            else if (!lookup.has(new_key) || will_move.has(new_key)) {
                insert(new_block);
            }
            else if (did_move.has(old_key)) {
                o--;
            }
            else if (deltas.get(new_key) > deltas.get(old_key)) {
                did_move.add(new_key);
                insert(new_block);
            }
            else {
                will_move.add(old_key);
                o--;
            }
        }
        while (o--) {
            const old_block = old_blocks[o];
            if (!new_lookup.has(old_block.key))
                destroy(old_block, lookup);
        }
        while (n)
            insert(new_blocks[n - 1]);
        return new_blocks;
    }
    function validate_each_keys(ctx, list, get_context, get_key) {
        const keys = new Set();
        for (let i = 0; i < list.length; i++) {
            const key = get_key(get_context(ctx, list, i));
            if (keys.has(key)) {
                throw new Error(`Cannot have duplicate keys in a keyed each`);
            }
            keys.add(key);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
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
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.19.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function prop_dev(node, property, value) {
        node[property] = value;
        dispatch_dev("SvelteDOMSetProperty", { node, property, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (!arg || !('length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    const subscriber_queue = [];
    /**
     * Creates a `Readable` store that allows reading by subscription.
     * @param value initial value
     * @param {StartStopNotifier}start start and stop notifications for subscriptions
     */
    function readable(value, start) {
        return {
            subscribe: writable(value, start).subscribe,
        };
    }
    /**
     * Create a `Writable` store that allows both updating and reading by subscription.
     * @param {*=}value initial value
     * @param {StartStopNotifier=}start start and stop notifications for subscriptions
     */
    function writable(value, start = noop) {
        let stop;
        const subscribers = [];
        function set(new_value) {
            if (safe_not_equal(value, new_value)) {
                value = new_value;
                if (stop) { // store is ready
                    const run_queue = !subscriber_queue.length;
                    for (let i = 0; i < subscribers.length; i += 1) {
                        const s = subscribers[i];
                        s[1]();
                        subscriber_queue.push(s, value);
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
        function update(fn) {
            set(fn(value));
        }
        function subscribe(run, invalidate = noop) {
            const subscriber = [run, invalidate];
            subscribers.push(subscriber);
            if (subscribers.length === 1) {
                stop = start(set) || noop;
            }
            run(value);
            return () => {
                const index = subscribers.indexOf(subscriber);
                if (index !== -1) {
                    subscribers.splice(index, 1);
                }
                if (subscribers.length === 0) {
                    stop();
                    stop = null;
                }
            };
        }
        return { set, update, subscribe };
    }
    function derived(stores, fn, initial_value) {
        const single = !Array.isArray(stores);
        const stores_array = single
            ? [stores]
            : stores;
        const auto = fn.length < 2;
        return readable(initial_value, (set) => {
            let inited = false;
            const values = [];
            let pending = 0;
            let cleanup = noop;
            const sync = () => {
                if (pending) {
                    return;
                }
                cleanup();
                const result = fn(single ? values[0] : values, set);
                if (auto) {
                    set(result);
                }
                else {
                    cleanup = is_function(result) ? result : noop;
                }
            };
            const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
                values[i] = value;
                pending &= ~(1 << i);
                if (inited) {
                    sync();
                }
            }, () => {
                pending |= (1 << i);
            }));
            inited = true;
            sync();
            return function stop() {
                run_all(unsubscribers);
                cleanup();
            };
        });
    }

    /* src/tabs/Tabs.svelte generated by Svelte v3.19.0 */
    const file = "src/tabs/Tabs.svelte";

    function create_fragment(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "tabs");
    			add_location(div, file, 47, 0, 1063);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 16) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[4], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const TABS = {};

    function instance($$self, $$props, $$invalidate) {
    	const tabs = [];
    	const panels = [];
    	const selectedTab = writable(null);
    	const selectedPanel = writable(null);

    	setContext(TABS, {
    		registerTab: tab => {
    			tabs.push(tab);
    			selectedTab.update(current => current || tab);

    			onDestroy(() => {
    				const i = tabs.indexOf(tab);
    				tabs.splice(i, 1);

    				selectedTab.update(current => current === tab
    				? tabs[i] || tabs[tabs.length - 1]
    				: current);
    			});
    		},
    		registerPanel: panel => {
    			panels.push(panel);
    			selectedPanel.update(current => current || panel);

    			onDestroy(() => {
    				const i = panels.indexOf(panel);
    				panels.splice(i, 1);

    				selectedPanel.update(current => current === panel
    				? panels[i] || panels[panels.length - 1]
    				: current);
    			});
    		},
    		selectTab: tab => {
    			const i = tabs.indexOf(tab);
    			selectedTab.set(tab);
    			selectedPanel.set(panels[i]);
    		},
    		selectedTab,
    		selectedPanel
    	});

    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		TABS,
    		setContext,
    		onDestroy,
    		writable,
    		tabs,
    		panels,
    		selectedTab,
    		selectedPanel
    	});

    	return [tabs, panels, selectedTab, selectedPanel, $$scope, $$slots];
    }

    class Tabs extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tabs",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    /* src/tabs/TabList.svelte generated by Svelte v3.19.0 */

    const file$1 = "src/tabs/TabList.svelte";

    function create_fragment$1(ctx) {
    	let div;
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[1].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[0], null);

    	const block = {
    		c: function create() {
    			div = element("div");
    			if (default_slot) default_slot.c();
    			attr_dev(div, "class", "tab-list svelte-c9h6kv");
    			add_location(div, file$1, 0, 0, 0);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			if (default_slot) {
    				default_slot.m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 1) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[0], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[0], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(0, $$scope = $$props.$$scope);
    	};

    	return [$$scope, $$slots];
    }

    class TabList extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabList",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/tabs/TabPanel.svelte generated by Svelte v3.19.0 */

    // (11:0) {#if $selectedPanel === panel}
    function create_if_block(ctx) {
    	let current;
    	const default_slot_template = /*$$slots*/ ctx[5].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[4], null);

    	const block = {
    		c: function create() {
    			if (default_slot) default_slot.c();
    		},
    		m: function mount(target, anchor) {
    			if (default_slot) {
    				default_slot.m(target, anchor);
    			}

    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 16) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[4], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[4], dirty, null));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (default_slot) default_slot.d(detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(11:0) {#if $selectedPanel === panel}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let if_block_anchor;
    	let current;
    	let if_block = /*$selectedPanel*/ ctx[0] === /*panel*/ ctx[1] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$selectedPanel*/ ctx[0] === /*panel*/ ctx[1]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
    	let $selectedPanel;
    	const panel = {};
    	const { registerPanel, selectedPanel } = getContext(TABS);
    	validate_store(selectedPanel, "selectedPanel");
    	component_subscribe($$self, selectedPanel, value => $$invalidate(0, $selectedPanel = value));
    	registerPanel(panel);
    	let { $$slots = {}, $$scope } = $$props;

    	$$self.$set = $$props => {
    		if ("$$scope" in $$props) $$invalidate(4, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		TABS,
    		panel,
    		registerPanel,
    		selectedPanel,
    		$selectedPanel
    	});

    	return [$selectedPanel, panel, selectedPanel, registerPanel, $$scope, $$slots];
    }

    class TabPanel extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TabPanel",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    /* src/tabs/Tab.svelte generated by Svelte v3.19.0 */
    const file$2 = "src/tabs/Tab.svelte";

    function create_fragment$3(ctx) {
    	let button;
    	let button_class_value;
    	let current;
    	let dispose;
    	const default_slot_template = /*$$slots*/ ctx[7].default;
    	const default_slot = create_slot(default_slot_template, ctx, /*$$scope*/ ctx[6], null);

    	const block = {
    		c: function create() {
    			button = element("button");
    			if (default_slot) default_slot.c();

    			attr_dev(button, "class", button_class_value = "" + (null_to_empty("tab" + (/*$selectedTab*/ ctx[1] === /*tab*/ ctx[2]
    			? " selected"
    			: "") + (/*className*/ ctx[0] ? ` ${/*className*/ ctx[0]}` : "")) + " svelte-aalgjl"));

    			add_location(button, file$2, 45, 0, 825);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);

    			if (default_slot) {
    				default_slot.m(button, null);
    			}

    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[8], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (default_slot && default_slot.p && dirty & /*$$scope*/ 64) {
    				default_slot.p(get_slot_context(default_slot_template, ctx, /*$$scope*/ ctx[6], null), get_slot_changes(default_slot_template, /*$$scope*/ ctx[6], dirty, null));
    			}

    			if (!current || dirty & /*$selectedTab, className*/ 3 && button_class_value !== (button_class_value = "" + (null_to_empty("tab" + (/*$selectedTab*/ ctx[1] === /*tab*/ ctx[2]
    			? " selected"
    			: "") + (/*className*/ ctx[0] ? ` ${/*className*/ ctx[0]}` : "")) + " svelte-aalgjl"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(default_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(default_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			if (default_slot) default_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
    	let $selectedTab;
    	let { className = "" } = $$props;
    	const tab = {};
    	const { registerTab, selectTab, selectedTab } = getContext(TABS);
    	validate_store(selectedTab, "selectedTab");
    	component_subscribe($$self, selectedTab, value => $$invalidate(1, $selectedTab = value));
    	registerTab(tab);
    	const writable_props = ["className"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Tab> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	const click_handler = () => selectTab(tab);

    	$$self.$set = $$props => {
    		if ("className" in $$props) $$invalidate(0, className = $$props.className);
    		if ("$$scope" in $$props) $$invalidate(6, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({
    		getContext,
    		TABS,
    		className,
    		tab,
    		registerTab,
    		selectTab,
    		selectedTab,
    		$selectedTab
    	});

    	$$self.$inject_state = $$props => {
    		if ("className" in $$props) $$invalidate(0, className = $$props.className);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		className,
    		$selectedTab,
    		tab,
    		selectTab,
    		selectedTab,
    		registerTab,
    		$$scope,
    		$$slots,
    		click_handler
    	];
    }

    class Tab extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { className: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Tab",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get className() {
    		throw new Error("<Tab>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set className(value) {
    		throw new Error("<Tab>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    const findNodeByName = function(name, childrenArr, suffix = '/') {
        return childrenArr.find(node => node.name === name + suffix)
    };

    const buildSitemapObj = function(urlArr) {
        const domain = urlArr.shift();
        const siteArr = urlArr.map(url => url.replace(domain, ''));
        const siteObj = newNode(domain);

        for (let i=0; i<siteArr.length; i++) {
            const uriParts = siteArr[i].split('/').filter(el => el && el !== '/');
            if (!siteObj.children) siteObj.children = [];
            if (!findNodeByName(uriParts[0], siteObj.children)) siteObj.children.push(newNode(`${ uriParts[0] }/`));
            currNode = findNodeByName(uriParts[0], siteObj.children);

            if (uriParts.length === 1) {
                currNode.url = urlArr[i];
            }

            for(let j=1; j<uriParts.length; j++) {
                if (!currNode.children) currNode.children = [];
                if (!findNodeByName(uriParts[j], currNode.children)) {
                    currNode.children.push(newNode(`${ uriParts[j] }/`, ));
                }

                currNode = findNodeByName(uriParts[j], currNode.children);

                if (j === uriParts.length - 1) {
                    currNode.url = urlArr[i];
                }
            }
        }

        return siteObj

        function newNode(name = '/', url) {
            return {
                name,
                url,
            }
        }
    };

    const getPageURLs = function(pagePath, sitemap) {
        const pathParts = pagePath.split('/').filter(part => part && part !== '/');

        let pathNode = sitemap;
        let urls = [];
        for (let i=0; i < pathParts.length; i++) {
            if (!pathNode) continue
            if (pathParts[i] !== '*') pathNode = findNodeByName(pathParts[i], pathNode.children);

            if (i === pathParts.length - 1) {
                if (pathParts[i] === '*') urls = (pathNode.children && pathNode.children instanceof Array) ? pathNode.children.map(node => node ? node.url : '').filter(f => f) : [];
                else urls = (pathNode) ? [pathNode.url] : undefined;
            }
        }

        return urls
    };

    var sitemapUtils = {
        buildSitemapObj,
        getPageURLs,
    };
    var sitemapUtils_2 = sitemapUtils.getPageURLs;

    const scrapesRun = writable(0);

    const sitemap = writable(null);

    const sitemapFiles = writable(null);

    const scraperModels = writable(undefined);

    function addModel() {
        scraperModels.update(oldModels => {
            const newModel = {
                name: 'Post',
                values: [
                    {value: 'title', selector: 'h1', property: 'textContent'},
                ]
            };

            return oldModels ? [...oldModels, newModel] : [newModel]
        });
    }

    function removeModel(index) {
        scraperModels.update(oldModels => {
            if (oldModels.length === 1) return undefined
            if (index === 0) return [...oldModels.slice(1)]
            return [...oldModels.slice(0, index), ...oldModels.slice(index+1, oldModels.length)]
        });
    }

    function updateName(val, index) {
        scraperModels.update(oldModels => {
            const newModels = [...oldModels];
            newModels[index].name = val;
            return newModels
        });
    }

    function addModelValue(modelIndex) {
        scraperModels.update(oldModels => {
            const defaultValue = { value: 'someValue', selector: '.some-class img', property: 'src' };
            const newModels = [...oldModels];
            newModels[modelIndex].values.push(defaultValue);
            return newModels
        });
    }

    function updateModelValue(val, modelIndex, valueIndex, valueKey) {
        scraperModels.update(oldModels => {
            const newModels = [...oldModels];
            newModels[modelIndex].values[valueIndex][valueKey] = val;
            return newModels
        });
    }

    function removeModelValue(modelIndex, valueIndex) {
        scraperModels.update(oldModels => {
            const newModels = [...oldModels];
            if (newModels[modelIndex].values.length === 1) { newModels[modelIndex].values = []; }
            else if (valueIndex === 0) { newModels[modelIndex].values = [...newModels[modelIndex].values.slice(1)]; }
            else { newModels[modelIndex].values = [...newModels[modelIndex].values.slice(0, valueIndex), ...newModels[modelIndex].values.slice(valueIndex+1, newModels[modelIndex].values.length)]; }
            return newModels
        });
    }

    const scrapeOperations = writable(undefined);

    function addOperation() {
        scrapeOperations.update(oldOperations => {
            const newOperation = {
                directory: '/about/team/*',
                model: '',
                on: true,
            };

            return oldOperations ? [...oldOperations, newOperation] : [newOperation]
        });
    }

    function removeOperation(index) {
        scrapeOperations.update(oldOperations => {
            if (oldOperations.length === 1) return undefined
            if (index === 0) return [...oldOperations.slice(1)]
            return [...oldOperations.slice(0, index), ...oldOperations.slice(index+1, oldOperations.length)]
        });
    }

    function updateOperationValue(val, index, key) {
        scrapeOperations.update(oldOperations => {
            const newOperations = [...oldOperations];
            newOperations[index][key] = val;
            return newOperations
        });
    }

    const scrapeURLs = derived([scrapeOperations, sitemap],
        ([$scrapeOperations, $sitemap]) => ($scrapeOperations && $sitemap) ? $scrapeOperations.map(operation => sitemapUtils_2(operation.directory, $sitemap)) : undefined);

    const scrapeResults = writable(null);

    /* src/components/Accordion.svelte generated by Svelte v3.19.0 */

    const file$3 = "src/components/Accordion.svelte";
    const get_items_slot_changes = dirty => ({});
    const get_items_slot_context = ctx => ({});
    const get_button_slot_changes = dirty => ({});
    const get_button_slot_context = ctx => ({});

    // (14:4) {#if closeCallback}
    function create_if_block$1(ctx) {
    	let button;
    	let svg;
    	let path0;
    	let path1;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			attr_dev(path0, "d", "M 1 1 l 8 8");
    			attr_dev(path0, "class", "svelte-12ds0o0");
    			add_location(path0, file$3, 16, 12, 556);
    			attr_dev(path1, "d", "M 1 9 l 8 -8");
    			attr_dev(path1, "class", "svelte-12ds0o0");
    			add_location(path1, file$3, 17, 12, 593);
    			attr_dev(svg, "viewBox", "0 0 10 10");
    			attr_dev(svg, "class", "svelte-12ds0o0");
    			add_location(svg, file$3, 15, 8, 518);
    			attr_dev(button, "class", "accordion-delete svelte-12ds0o0");
    			add_location(button, file$3, 14, 4, 441);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[3], false, false, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(14:4) {#if closeCallback}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$4(ctx) {
    	let div0;
    	let button;
    	let t0;
    	let t1;
    	let div1;
    	let current;
    	let dispose;
    	const button_slot_template = /*$$slots*/ ctx[2].button;
    	const button_slot = create_slot(button_slot_template, ctx, /*$$scope*/ ctx[1], get_button_slot_context);
    	let if_block = /*closeCallback*/ ctx[0] && create_if_block$1(ctx);
    	const items_slot_template = /*$$slots*/ ctx[2].items;
    	const items_slot = create_slot(items_slot_template, ctx, /*$$scope*/ ctx[1], get_items_slot_context);

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			button = element("button");
    			if (button_slot) button_slot.c();
    			t0 = space();
    			if (if_block) if_block.c();
    			t1 = space();
    			div1 = element("div");
    			if (items_slot) items_slot.c();
    			attr_dev(button, "class", "accordion-btn svelte-12ds0o0");
    			add_location(button, file$3, 5, 4, 93);
    			attr_dev(div0, "class", "accordion-bar closed svelte-12ds0o0");
    			add_location(div0, file$3, 4, 0, 54);
    			attr_dev(div1, "class", "accordion-items closed svelte-12ds0o0");
    			add_location(div1, file$3, 22, 0, 665);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, button);

    			if (button_slot) {
    				button_slot.m(button, null);
    			}

    			append_dev(div0, t0);
    			if (if_block) if_block.m(div0, null);
    			insert_dev(target, t1, anchor);
    			insert_dev(target, div1, anchor);

    			if (items_slot) {
    				items_slot.m(div1, null);
    			}

    			current = true;
    			dispose = listen_dev(button, "click", click_handler, false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (button_slot && button_slot.p && dirty & /*$$scope*/ 2) {
    				button_slot.p(get_slot_context(button_slot_template, ctx, /*$$scope*/ ctx[1], get_button_slot_context), get_slot_changes(button_slot_template, /*$$scope*/ ctx[1], dirty, get_button_slot_changes));
    			}

    			if (/*closeCallback*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$1(ctx);
    					if_block.c();
    					if_block.m(div0, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if (items_slot && items_slot.p && dirty & /*$$scope*/ 2) {
    				items_slot.p(get_slot_context(items_slot_template, ctx, /*$$scope*/ ctx[1], get_items_slot_context), get_slot_changes(items_slot_template, /*$$scope*/ ctx[1], dirty, get_items_slot_changes));
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(button_slot, local);
    			transition_in(items_slot, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(button_slot, local);
    			transition_out(items_slot, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (button_slot) button_slot.d(detaching);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t1);
    			if (detaching) detach_dev(div1);
    			if (items_slot) items_slot.d(detaching);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$4.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const click_handler = function (e) {
    	if (e.target !== this) return;
    	this.parentElement.classList.toggle("closed");
    	this.parentElement.nextSibling.nextSibling.classList.toggle("closed");
    };

    function instance$4($$self, $$props, $$invalidate) {
    	let { closeCallback = "" } = $$props;
    	const writable_props = ["closeCallback"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Accordion> was created with unknown prop '${key}'`);
    	});

    	let { $$slots = {}, $$scope } = $$props;
    	const click_handler_1 = () => closeCallback();

    	$$self.$set = $$props => {
    		if ("closeCallback" in $$props) $$invalidate(0, closeCallback = $$props.closeCallback);
    		if ("$$scope" in $$props) $$invalidate(1, $$scope = $$props.$$scope);
    	};

    	$$self.$capture_state = () => ({ closeCallback });

    	$$self.$inject_state = $$props => {
    		if ("closeCallback" in $$props) $$invalidate(0, closeCallback = $$props.closeCallback);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [closeCallback, $$scope, $$slots, click_handler_1];
    }

    class Accordion extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { closeCallback: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Accordion",
    			options,
    			id: create_fragment$4.name
    		});
    	}

    	get closeCallback() {
    		throw new Error("<Accordion>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeCallback(value) {
    		throw new Error("<Accordion>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/TreeView.svelte generated by Svelte v3.19.0 */

    const file$4 = "src/components/TreeView.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	child_ctx[7] = i;
    	return child_ctx;
    }

    // (33:4) {:else}
    function create_else_block(ctx) {
    	let li;
    	let a;
    	let t_value = /*object*/ ctx[0].name + "";
    	let t;
    	let a_href_value;

    	const block = {
    		c: function create() {
    			li = element("li");
    			a = element("a");
    			t = text(t_value);
    			attr_dev(a, "class", "leaf-link svelte-1d5vdhz");

    			attr_dev(a, "href", a_href_value = /*href*/ ctx[2]
    			? /*href*/ ctx[2]
    			: /*object*/ ctx[0].name);

    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 34, 8, 1593);
    			attr_dev(li, "class", "svelte-1d5vdhz");
    			add_location(li, file$4, 33, 4, 1580);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, a);
    			append_dev(a, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*object*/ 1 && t_value !== (t_value = /*object*/ ctx[0].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*href, object*/ 5 && a_href_value !== (a_href_value = /*href*/ ctx[2]
    			? /*href*/ ctx[2]
    			: /*object*/ ctx[0].name)) {
    				attr_dev(a, "href", a_href_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(33:4) {:else}",
    		ctx
    	});

    	return block;
    }

    // (21:4) {#if object.children && object.children.length > 0 }
    function create_if_block$2(ctx) {
    	let div;
    	let a;
    	let t0_value = /*object*/ ctx[0].name + "";
    	let t0;
    	let a_href_value;
    	let t1;
    	let span;
    	let t2_value = /*object*/ ctx[0].children.length + "";
    	let t2;
    	let t3;

    	let t4_value = (/*object*/ ctx[0].children.length > 1
    	? "children"
    	: "child") + "";

    	let t4;
    	let t5;
    	let t6;
    	let button;
    	let t7_value = (/*expanded*/ ctx[1] ? "← Collapse" : "Expand →") + "";
    	let t7;
    	let t8;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let dispose;
    	let if_block = /*descendants*/ ctx[3] !== /*object*/ ctx[0].children.length && create_if_block_1(ctx);
    	let each_value = /*object*/ ctx[0].children;
    	validate_each_argument(each_value);
    	const get_key = ctx => /*object*/ ctx[0].name + "-" + /*child*/ ctx[5].name + "-" + /*i*/ ctx[7];
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");
    			a = element("a");
    			t0 = text(t0_value);
    			t1 = space();
    			span = element("span");
    			t2 = text(t2_value);
    			t3 = space();
    			t4 = text(t4_value);
    			t5 = space();
    			if (if_block) if_block.c();
    			t6 = space();
    			button = element("button");
    			t7 = text(t7_value);
    			t8 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			attr_dev(a, "class", "branch-link svelte-1d5vdhz");

    			attr_dev(a, "href", a_href_value = /*href*/ ctx[2]
    			? /*href*/ ctx[2]
    			: /*object*/ ctx[0].name);

    			attr_dev(a, "target", "_blank");
    			add_location(a, file$4, 22, 8, 862);
    			attr_dev(span, "class", "children-label svelte-1d5vdhz");
    			add_location(span, file$4, 23, 8, 964);
    			attr_dev(button, "class", "svelte-1d5vdhz");
    			add_location(button, file$4, 27, 8, 1246);
    			attr_dev(div, "class", "branch-wrapper svelte-1d5vdhz");
    			add_location(div, file$4, 21, 4, 825);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, a);
    			append_dev(a, t0);
    			append_dev(div, t1);
    			append_dev(div, span);
    			append_dev(span, t2);
    			append_dev(span, t3);
    			append_dev(span, t4);
    			append_dev(div, t5);
    			if (if_block) if_block.m(div, null);
    			append_dev(div, t6);
    			append_dev(div, button);
    			append_dev(button, t7);
    			insert_dev(target, t8, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*object*/ 1) && t0_value !== (t0_value = /*object*/ ctx[0].name + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*href, object*/ 5 && a_href_value !== (a_href_value = /*href*/ ctx[2]
    			? /*href*/ ctx[2]
    			: /*object*/ ctx[0].name)) {
    				attr_dev(a, "href", a_href_value);
    			}

    			if ((!current || dirty & /*object*/ 1) && t2_value !== (t2_value = /*object*/ ctx[0].children.length + "")) set_data_dev(t2, t2_value);

    			if ((!current || dirty & /*object*/ 1) && t4_value !== (t4_value = (/*object*/ ctx[0].children.length > 1
    			? "children"
    			: "child") + "")) set_data_dev(t4, t4_value);

    			if (/*descendants*/ ctx[3] !== /*object*/ ctx[0].children.length) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_1(ctx);
    					if_block.c();
    					if_block.m(div, t6);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}

    			if ((!current || dirty & /*expanded*/ 2) && t7_value !== (t7_value = (/*expanded*/ ctx[1] ? "← Collapse" : "Expand →") + "")) set_data_dev(t7, t7_value);

    			if (dirty & /*object, href, expanded*/ 7) {
    				const each_value = /*object*/ ctx[0].children;
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block, each_1_anchor, get_each_context);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (if_block) if_block.d();
    			if (detaching) detach_dev(t8);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$2.name,
    		type: "if",
    		source: "(21:4) {#if object.children && object.children.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (25:8) {#if descendants !== object.children.length}
    function create_if_block_1(ctx) {
    	let span;
    	let t0;
    	let t1;
    	let t2_value = "descendents" + "";
    	let t2;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(/*descendants*/ ctx[3]);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(span, "class", "children-label descendants svelte-1d5vdhz");
    			add_location(span, file$4, 25, 8, 1142);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    			append_dev(span, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*descendants*/ 8) set_data_dev(t0, /*descendants*/ ctx[3]);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(25:8) {#if descendants !== object.children.length}",
    		ctx
    	});

    	return block;
    }

    // (30:4) {#each object.children as child, i (object.name+'-'+child.name+'-'+i)}
    function create_each_block(key_1, ctx) {
    	let first;
    	let current;

    	const treeview = new TreeView({
    			props: {
    				object: /*child*/ ctx[5],
    				href: /*href*/ ctx[2]
    				? /*href*/ ctx[2] + /*child*/ ctx[5].name
    				: /*object*/ ctx[0].name + /*child*/ ctx[5].name,
    				expanded: /*expanded*/ ctx[1]
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(treeview.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(treeview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const treeview_changes = {};
    			if (dirty & /*object*/ 1) treeview_changes.object = /*child*/ ctx[5];

    			if (dirty & /*href, object*/ 5) treeview_changes.href = /*href*/ ctx[2]
    			? /*href*/ ctx[2] + /*child*/ ctx[5].name
    			: /*object*/ ctx[0].name + /*child*/ ctx[5].name;

    			if (dirty & /*expanded*/ 2) treeview_changes.expanded = /*expanded*/ ctx[1];
    			treeview.$set(treeview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(treeview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(treeview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(treeview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(30:4) {#each object.children as child, i (object.name+'-'+child.name+'-'+i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$5(ctx) {
    	let ul;
    	let current_block_type_index;
    	let if_block;
    	let ul_id_value;
    	let ul_class_value;
    	let current;
    	const if_block_creators = [create_if_block$2, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*object*/ ctx[0].children && /*object*/ ctx[0].children.length > 0) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			if_block.c();
    			attr_dev(ul, "id", ul_id_value = !/*href*/ ctx[2] ? "root-node" : "");

    			attr_dev(ul, "class", ul_class_value = "" + (null_to_empty((!/*expanded*/ ctx[1] ? "closed" : "") + " " + (/*object*/ ctx[0].children && /*object*/ ctx[0].children.length > 0
    			? "branch-node"
    			: "leaf-node")) + " svelte-1d5vdhz"));

    			add_location(ul, file$4, 19, 0, 602);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			if_blocks[current_block_type_index].m(ul, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(ul, null);
    			}

    			if (!current || dirty & /*href*/ 4 && ul_id_value !== (ul_id_value = !/*href*/ ctx[2] ? "root-node" : "")) {
    				attr_dev(ul, "id", ul_id_value);
    			}

    			if (!current || dirty & /*expanded, object*/ 3 && ul_class_value !== (ul_class_value = "" + (null_to_empty((!/*expanded*/ ctx[1] ? "closed" : "") + " " + (/*object*/ ctx[0].children && /*object*/ ctx[0].children.length > 0
    			? "branch-node"
    			: "leaf-node")) + " svelte-1d5vdhz"))) {
    				attr_dev(ul, "class", ul_class_value);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			if_blocks[current_block_type_index].d();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$5.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function getDescendants(tree, nodes = 0) {
    	if (!tree.children) return nodes + 1;
    	return tree.children.reduce((acc, child) => acc + getDescendants(child), nodes);
    }

    function instance$5($$self, $$props, $$invalidate) {
    	let { object = {
    		name: "No name set",
    		children: [{ name: "", children: [] }]
    	} } = $$props;

    	let { href = "" } = $$props;
    	let { expanded = true } = $$props;

    	object.children = object.children && object.children.length > 0
    	? object.children.sort((a, b) => a.name < b.name ? -1 : 1)
    	: null;

    	const writable_props = ["object", "href", "expanded"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<TreeView> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		$$invalidate(1, expanded = !expanded);
    	};

    	$$self.$set = $$props => {
    		if ("object" in $$props) $$invalidate(0, object = $$props.object);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("expanded" in $$props) $$invalidate(1, expanded = $$props.expanded);
    	};

    	$$self.$capture_state = () => ({
    		object,
    		href,
    		expanded,
    		getDescendants,
    		descendants
    	});

    	$$self.$inject_state = $$props => {
    		if ("object" in $$props) $$invalidate(0, object = $$props.object);
    		if ("href" in $$props) $$invalidate(2, href = $$props.href);
    		if ("expanded" in $$props) $$invalidate(1, expanded = $$props.expanded);
    		if ("descendants" in $$props) $$invalidate(3, descendants = $$props.descendants);
    	};

    	let descendants;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*object*/ 1) {
    			 $$invalidate(3, descendants = object.children ? getDescendants(object) : 0);
    		}
    	};

    	return [object, expanded, href, descendants, click_handler];
    }

    class TreeView extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$5, create_fragment$5, safe_not_equal, { object: 0, href: 2, expanded: 1 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TreeView",
    			options,
    			id: create_fragment$5.name
    		});
    	}

    	get object() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set object(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get href() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set href(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get expanded() {
    		throw new Error("<TreeView>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set expanded(value) {
    		throw new Error("<TreeView>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/views/BuildSitemap.svelte generated by Svelte v3.19.0 */
    const file$5 = "src/views/BuildSitemap.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (53:0) {:else}
    function create_else_block$1(ctx) {
    	let t;
    	let current;

    	const accordion = new Accordion({
    			props: {
    				closeCallback: /*func*/ ctx[5],
    				$$slots: {
    					default: [create_default_slot],
    					items: [create_items_slot],
    					button: [create_button_slot]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const treeview = new TreeView({
    			props: { object: /*$sitemap*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(accordion.$$.fragment);
    			t = space();
    			create_component(treeview.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(accordion, target, anchor);
    			insert_dev(target, t, anchor);
    			mount_component(treeview, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const accordion_changes = {};

    			if (dirty & /*$$scope, $sitemapFiles*/ 514) {
    				accordion_changes.$$scope = { dirty, ctx };
    			}

    			accordion.$set(accordion_changes);
    			const treeview_changes = {};
    			if (dirty & /*$sitemap*/ 1) treeview_changes.object = /*$sitemap*/ ctx[0];
    			treeview.$set(treeview_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accordion.$$.fragment, local);
    			transition_in(treeview.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accordion.$$.fragment, local);
    			transition_out(treeview.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(accordion, detaching);
    			if (detaching) detach_dev(t);
    			destroy_component(treeview, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$1.name,
    		type: "else",
    		source: "(53:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (48:0) {#if !$sitemap}
    function create_if_block$3(ctx) {
    	let label;
    	let t;
    	let input;
    	let dispose;

    	const block = {
    		c: function create() {
    			label = element("label");
    			t = text("Upload one or more .xml files\n    ");
    			input = element("input");
    			attr_dev(input, "type", "file");
    			attr_dev(input, "accept", ".xml");
    			input.multiple = "true";
    			add_location(input, file$5, 49, 4, 1307);
    			add_location(label, file$5, 48, 0, 1266);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, label, anchor);
    			append_dev(label, t);
    			append_dev(label, input);
    			dispose = listen_dev(input, "change", /*change_handler*/ ctx[4], false, false, false);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(label);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$3.name,
    		type: "if",
    		source: "(48:0) {#if !$sitemap}",
    		ctx
    	});

    	return block;
    }

    // (55:4) <span slot='button'>
    function create_button_slot(ctx) {
    	let span;
    	let t0_value = /*$sitemapFiles*/ ctx[1].length + "";
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = text(" files");
    			attr_dev(span, "slot", "button");
    			add_location(span, file$5, 54, 4, 1482);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, span, anchor);
    			append_dev(span, t0);
    			append_dev(span, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$sitemapFiles*/ 2 && t0_value !== (t0_value = /*$sitemapFiles*/ ctx[1].length + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(span);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot.name,
    		type: "slot",
    		source: "(55:4) <span slot='button'>",
    		ctx
    	});

    	return block;
    }

    // (57:8) {#each $sitemapFiles as file, i (file.name)}
    function create_each_block$1(key_1, ctx) {
    	let li;
    	let t_value = /*file*/ ctx[6].name + "";
    	let t;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			li = element("li");
    			t = text(t_value);
    			attr_dev(li, "class", "svelte-19rg1ff");
    			add_location(li, file$5, 57, 8, 1623);
    			this.first = li;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, li, anchor);
    			append_dev(li, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$sitemapFiles*/ 2 && t_value !== (t_value = /*file*/ ctx[6].name + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(li);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(57:8) {#each $sitemapFiles as file, i (file.name)}",
    		ctx
    	});

    	return block;
    }

    // (56:4) <ol slot='items'>
    function create_items_slot(ctx) {
    	let ol;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$sitemapFiles*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*file*/ ctx[6].name;
    	validate_each_keys(ctx, each_value, get_each_context$1, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$1(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			ol = element("ol");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(ol, "slot", "items");
    			attr_dev(ol, "class", "svelte-19rg1ff");
    			add_location(ol, file$5, 55, 4, 1544);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ol, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(ol, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$sitemapFiles*/ 2) {
    				const each_value = /*$sitemapFiles*/ ctx[1];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, ol, destroy_block, create_each_block$1, null, get_each_context$1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ol);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_items_slot.name,
    		type: "slot",
    		source: "(56:4) <ol slot='items'>",
    		ctx
    	});

    	return block;
    }

    // (54:0) <Accordion closeCallback={ () => sitemapDelete() }>
    function create_default_slot(ctx) {
    	let t;

    	const block = {
    		c: function create() {
    			t = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot.name,
    		type: "slot",
    		source: "(54:0) <Accordion closeCallback={ () => sitemapDelete() }>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$6(ctx) {
    	let h1;
    	let t1;
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$3, create_else_block$1];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (!/*$sitemap*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Sources";
    			t1 = space();
    			if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file$5, 46, 0, 1233);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$6.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    async function readAsDataURLAsync(file) {
    	const fr = new FileReader();

    	return new Promise((resolve, reject) => {
    			fr.onerror = () => {
    				fr.abort();
    				reject(new DOMException("Problem parsing file."));
    			};

    			fr.onload = () => resolve(fr.result);
    			fr.readAsDataURL(file);
    		});
    }

    function instance$6($$self, $$props, $$invalidate) {
    	let $sitemap;
    	let $sitemapFiles;
    	validate_store(sitemap, "sitemap");
    	component_subscribe($$self, sitemap, $$value => $$invalidate(0, $sitemap = $$value));
    	validate_store(sitemapFiles, "sitemapFiles");
    	component_subscribe($$self, sitemapFiles, $$value => $$invalidate(1, $sitemapFiles = $$value));

    	let sitemapDelete = () => {
    		set_store_value(sitemap, $sitemap = null);
    	};

    	async function handleSitemapUpload(e) {
    		if (!e.target.files) {
    			e.target.value = "";
    			return;
    		}

    		set_store_value(sitemapFiles, $sitemapFiles = Array.from(e.target.files).map(file => {
    			return { name: file.name, entries: null };
    		}));

    		const filesAsDataURL = await Promise.all(Array.from(e.target.files).map(async file => {
    			return {
    				name: file.name,
    				dataURL: await readAsDataURLAsync(file)
    			};
    		}));

    		window.api.send("toMain:sitemap", filesAsDataURL);
    	}

    	const change_handler = e => handleSitemapUpload(e);
    	const func = () => sitemapDelete();

    	$$self.$capture_state = () => ({
    		sitemap,
    		sitemapFiles,
    		Accordion,
    		TreeView,
    		sitemapDelete,
    		handleSitemapUpload,
    		readAsDataURLAsync,
    		$sitemap,
    		$sitemapFiles,
    		Array,
    		Promise,
    		window,
    		FileReader,
    		DOMException
    	});

    	$$self.$inject_state = $$props => {
    		if ("sitemapDelete" in $$props) $$invalidate(2, sitemapDelete = $$props.sitemapDelete);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		$sitemap,
    		$sitemapFiles,
    		sitemapDelete,
    		handleSitemapUpload,
    		change_handler,
    		func
    	];
    }

    class BuildSitemap extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$6, create_fragment$6, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "BuildSitemap",
    			options,
    			id: create_fragment$6.name
    		});
    	}
    }

    /* src/components/VisualPicker.svelte generated by Svelte v3.19.0 */

    const { console: console_1 } = globals;
    const file$6 = "src/components/VisualPicker.svelte";

    function create_fragment$7(ctx) {
    	let div0;
    	let t0;
    	let div5;
    	let div1;
    	let label;
    	let t2;
    	let input;
    	let input_value_value;
    	let t3;
    	let button0;
    	let svg0;
    	let path0;
    	let path1;
    	let t4;
    	let div3;
    	let iframe;
    	let t5;
    	let iframe_src_value;
    	let t6;
    	let div2;
    	let div3_class_value;
    	let t7;
    	let div4;
    	let button1;
    	let svg1;
    	let rect;
    	let path2;
    	let t8;
    	let dispose;

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			t0 = space();
    			div5 = element("div");
    			div1 = element("div");
    			label = element("label");
    			label.textContent = "URL:";
    			t2 = space();
    			input = element("input");
    			t3 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t4 = space();
    			div3 = element("div");
    			iframe = element("iframe");
    			t5 = text("Load a URL!");
    			t6 = space();
    			div2 = element("div");
    			t7 = space();
    			div4 = element("div");
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			rect = svg_element("rect");
    			path2 = svg_element("path");
    			t8 = text("\n            Pick an Element");
    			attr_dev(div0, "class", "popup-bg svelte-16mx6hs");
    			add_location(div0, file$6, 32, 0, 1085);
    			attr_dev(label, "for", "url-input");
    			attr_dev(label, "class", "svelte-16mx6hs");
    			add_location(label, file$6, 35, 8, 1225);
    			attr_dev(input, "id", "url-input");
    			attr_dev(input, "type", "text");
    			input.value = input_value_value = /*iFrameSrc*/ ctx[0] ? /*iFrameSrc*/ ctx[0] : "";
    			attr_dev(input, "class", "svelte-16mx6hs");
    			add_location(input, file$6, 36, 8, 1269);
    			attr_dev(path0, "d", "M 1 1 l 8 8");
    			attr_dev(path0, "class", "svelte-16mx6hs");
    			add_location(path0, file$6, 41, 16, 1639);
    			attr_dev(path1, "d", "M 1 9 l 8 -8");
    			attr_dev(path1, "class", "svelte-16mx6hs");
    			add_location(path1, file$6, 42, 16, 1680);
    			attr_dev(svg0, "viewBox", "0 0 10 10");
    			attr_dev(svg0, "class", "svelte-16mx6hs");
    			add_location(svg0, file$6, 40, 12, 1597);
    			attr_dev(button0, "class", "close-btn svelte-16mx6hs");
    			add_location(button0, file$6, 39, 8, 1501);
    			attr_dev(div1, "class", "url-bar svelte-16mx6hs");
    			add_location(div1, file$6, 34, 4, 1195);
    			if (iframe.src !== (iframe_src_value = /*iFrameSrc*/ ctx[0] ? /*iFrameSrc*/ ctx[0] : "")) attr_dev(iframe, "src", iframe_src_value);
    			attr_dev(iframe, "title", "Visual Selector Preview");
    			attr_dev(iframe, "frameborder", "0");
    			attr_dev(iframe, "class", "svelte-16mx6hs");
    			add_location(iframe, file$6, 47, 8, 1844);
    			attr_dev(div2, "class", "click-target svelte-16mx6hs");
    			add_location(div2, file$6, 51, 8, 2019);
    			attr_dev(div3, "class", div3_class_value = "" + (null_to_empty("iframe-click-wrapper " + (/*isPickingElem*/ ctx[2] ? "is-picking" : "")) + " svelte-16mx6hs"));
    			add_location(div3, file$6, 46, 4, 1758);
    			attr_dev(rect, "x", "1");
    			attr_dev(rect, "y", "1");
    			attr_dev(rect, "width", "26");
    			attr_dev(rect, "height", "26");
    			attr_dev(rect, "rx", "8");
    			attr_dev(rect, "stroke", "#084A5F");
    			attr_dev(rect, "stroke-width", "2");
    			attr_dev(rect, "stroke-linejoin", "round");
    			attr_dev(rect, "stroke-dasharray", "10 5");
    			attr_dev(rect, "class", "svelte-16mx6hs");
    			add_location(rect, file$6, 56, 16, 2402);
    			attr_dev(path2, "d", "M7.99609 11.7266L4.31641 10.6836L5.00781 8.5625L8.65234 10.0273L8.41797 5.9375H10.7148L10.4805 10.1094L14.0312 8.66797L14.7227 10.8125L10.9727 11.8555L13.4336 14.9727L11.5703 16.2969L9.4375 12.875L7.32812 16.1797L5.46484 14.9141L7.99609 11.7266Z");
    			attr_dev(path2, "fill", "#084A5F");
    			attr_dev(path2, "class", "svelte-16mx6hs");
    			add_location(path2, file$6, 57, 16, 2550);
    			set_style(svg1, "margin-inline-end", ".5em");
    			attr_dev(svg1, "width", "28");
    			attr_dev(svg1, "height", "28");
    			attr_dev(svg1, "viewBox", "0 0 28 28");
    			attr_dev(svg1, "fill", "none");
    			attr_dev(svg1, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg1, "class", "svelte-16mx6hs");
    			add_location(svg1, file$6, 55, 12, 2256);
    			attr_dev(button1, "class", "element-picker svelte-16mx6hs");
    			add_location(button1, file$6, 54, 8, 2169);
    			attr_dev(div4, "class", "controls-row svelte-16mx6hs");
    			add_location(div4, file$6, 53, 4, 2134);
    			attr_dev(div5, "class", "popup svelte-16mx6hs");
    			add_location(div5, file$6, 33, 0, 1171);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			insert_dev(target, t0, anchor);
    			insert_dev(target, div5, anchor);
    			append_dev(div5, div1);
    			append_dev(div1, label);
    			append_dev(div1, t2);
    			append_dev(div1, input);
    			append_dev(div1, t3);
    			append_dev(div1, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(svg0, path1);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div3, iframe);
    			append_dev(iframe, t5);
    			/*iframe_binding*/ ctx[13](iframe);
    			append_dev(div3, t6);
    			append_dev(div3, div2);
    			append_dev(div5, t7);
    			append_dev(div5, div4);
    			append_dev(div4, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, rect);
    			append_dev(svg1, path2);
    			append_dev(button1, t8);

    			dispose = [
    				listen_dev(div0, "click", /*click_handler*/ ctx[9], false, false, false),
    				listen_dev(input, "blur", /*blur_handler*/ ctx[10], false, false, false),
    				listen_dev(input, "keypress", /*keypress_handler*/ ctx[11], false, false, false),
    				listen_dev(button0, "click", /*click_handler_1*/ ctx[12], false, false, false),
    				listen_dev(div2, "click", /*click_handler_2*/ ctx[14], false, false, false),
    				listen_dev(button1, "click", /*click_handler_3*/ ctx[15], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*iFrameSrc*/ 1 && input_value_value !== (input_value_value = /*iFrameSrc*/ ctx[0] ? /*iFrameSrc*/ ctx[0] : "") && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*iFrameSrc*/ 1 && iframe.src !== (iframe_src_value = /*iFrameSrc*/ ctx[0] ? /*iFrameSrc*/ ctx[0] : "")) {
    				attr_dev(iframe, "src", iframe_src_value);
    			}

    			if (dirty & /*isPickingElem*/ 4 && div3_class_value !== (div3_class_value = "" + (null_to_empty("iframe-click-wrapper " + (/*isPickingElem*/ ctx[2] ? "is-picking" : "")) + " svelte-16mx6hs"))) {
    				attr_dev(div3, "class", div3_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(div5);
    			/*iframe_binding*/ ctx[13](null);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$7.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$7($$self, $$props, $$invalidate) {
    	let { modelIndex = 0 } = $$props;
    	let { valueIndex = 0 } = $$props;
    	let { closeCallback = undefined } = $$props;
    	let { iFrameSrc = undefined } = $$props;
    	let isPickingElem = false;
    	let iFrame, iFrameDocument;

    	async function initIFrame() {
    		await tick();
    		console.log("iFrame = ", iFrame, iFrame.contentWindow.document.body, iFrame.contentDocument.body);
    		console.log("iFrame height = ", iFrame.contentDocument.documentElement, iFrame.contentDocument.body.clientHeight, iFrame.contentDocument.body.getBoundingClientRect());
    		iFrameDocument = iFrame.contentDocument;
    	}

    	function handleIFrameClick(event) {
    		console.log("click location in app = ", event.offsetX, event.offsetY, iFrameDocument.scrollTop, iFrameDocument.body.clientHeight);

    		// const iFrameElem = iFrameDocument.elementFromPoint(event.offsetX, event.offsetY)
    		// console.log('nearest element in iFrame = ', iFrameElem)
    		$$invalidate(2, isPickingElem = false);
    	}

    	const writable_props = ["modelIndex", "valueIndex", "closeCallback", "iFrameSrc"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<VisualPicker> was created with unknown prop '${key}'`);
    	});

    	const click_handler = () => {
    		if (closeCallback) closeCallback();
    	};

    	const blur_handler = e => {
    		$$invalidate(0, iFrameSrc = e.target.value);
    	};

    	const keypress_handler = e => {
    		if (e.key === "Enter") {
    			$$invalidate(0, iFrameSrc = e.target.value);
    		}
    	};

    	const click_handler_1 = () => {
    		if (closeCallback) closeCallback();
    	};

    	function iframe_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			$$invalidate(3, iFrame = $$value);
    		});
    	}

    	const click_handler_2 = e => {
    		if (iFrame && iFrameSrc) handleIFrameClick(e);
    	};

    	const click_handler_3 = () => {
    		$$invalidate(2, isPickingElem = true);
    	};

    	$$self.$set = $$props => {
    		if ("modelIndex" in $$props) $$invalidate(5, modelIndex = $$props.modelIndex);
    		if ("valueIndex" in $$props) $$invalidate(6, valueIndex = $$props.valueIndex);
    		if ("closeCallback" in $$props) $$invalidate(1, closeCallback = $$props.closeCallback);
    		if ("iFrameSrc" in $$props) $$invalidate(0, iFrameSrc = $$props.iFrameSrc);
    	};

    	$$self.$capture_state = () => ({
    		tick,
    		modelIndex,
    		valueIndex,
    		closeCallback,
    		iFrameSrc,
    		isPickingElem,
    		iFrame,
    		iFrameDocument,
    		initIFrame,
    		handleIFrameClick,
    		undefined,
    		console
    	});

    	$$self.$inject_state = $$props => {
    		if ("modelIndex" in $$props) $$invalidate(5, modelIndex = $$props.modelIndex);
    		if ("valueIndex" in $$props) $$invalidate(6, valueIndex = $$props.valueIndex);
    		if ("closeCallback" in $$props) $$invalidate(1, closeCallback = $$props.closeCallback);
    		if ("iFrameSrc" in $$props) $$invalidate(0, iFrameSrc = $$props.iFrameSrc);
    		if ("isPickingElem" in $$props) $$invalidate(2, isPickingElem = $$props.isPickingElem);
    		if ("iFrame" in $$props) $$invalidate(3, iFrame = $$props.iFrame);
    		if ("iFrameDocument" in $$props) iFrameDocument = $$props.iFrameDocument;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*iFrame*/ 8) {
    			 if (iFrame && iFrame.src) {
    				initIFrame();
    			}
    		}
    	};

    	return [
    		iFrameSrc,
    		closeCallback,
    		isPickingElem,
    		iFrame,
    		handleIFrameClick,
    		modelIndex,
    		valueIndex,
    		iFrameDocument,
    		initIFrame,
    		click_handler,
    		blur_handler,
    		keypress_handler,
    		click_handler_1,
    		iframe_binding,
    		click_handler_2,
    		click_handler_3
    	];
    }

    class VisualPicker extends SvelteComponentDev {
    	constructor(options) {
    		super(options);

    		init(this, options, instance$7, create_fragment$7, safe_not_equal, {
    			modelIndex: 5,
    			valueIndex: 6,
    			closeCallback: 1,
    			iFrameSrc: 0
    		});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "VisualPicker",
    			options,
    			id: create_fragment$7.name
    		});
    	}

    	get modelIndex() {
    		throw new Error("<VisualPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set modelIndex(value) {
    		throw new Error("<VisualPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get valueIndex() {
    		throw new Error("<VisualPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set valueIndex(value) {
    		throw new Error("<VisualPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get closeCallback() {
    		throw new Error("<VisualPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set closeCallback(value) {
    		throw new Error("<VisualPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get iFrameSrc() {
    		throw new Error("<VisualPicker>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set iFrameSrc(value) {
    		throw new Error("<VisualPicker>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/views/SetUpModels.svelte generated by Svelte v3.19.0 */
    const file$7 = "src/views/SetUpModels.svelte";

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[17] = list[i];
    	child_ctx[19] = i;
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    function get_each_context$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[11] = list[i];
    	child_ctx[13] = i;
    	return child_ctx;
    }

    // (11:0) {#if $scraperModels && $scraperModels.length > 0 }
    function create_if_block_1$1(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*$scraperModels*/ ctx[1];
    	validate_each_argument(each_value);
    	const get_key = ctx => `${scrapesRun}-model-${/*i*/ ctx[13]}`;
    	validate_each_keys(ctx, each_value, get_each_context$2, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$2(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*removeModel, $scraperModels, addModelValue, removeModelValue, console, $sitemap, showVisualPicker, Object, updateModelValue, updateName*/ 7) {
    				const each_value = /*$scraperModels*/ ctx[1];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$2, each_1_anchor, get_each_context$2);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$1.name,
    		type: "if",
    		source: "(11:0) {#if $scraperModels && $scraperModels.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (14:8) 
    function create_button_slot$1(ctx) {
    	let input;
    	let input_value_value;
    	let input_data_index_value;
    	let dispose;

    	const block = {
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "slot", "button");
    			attr_dev(input, "type", "text");
    			input.value = input_value_value = /*model*/ ctx[11].name;
    			attr_dev(input, "data-index", input_data_index_value = /*i*/ ctx[13]);
    			attr_dev(input, "class", "svelte-xvqgsz");
    			add_location(input, file$7, 13, 8, 541);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			dispose = listen_dev(input, "input", /*input_handler*/ ctx[4], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scraperModels*/ 2 && input_value_value !== (input_value_value = /*model*/ ctx[11].name) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}

    			if (dirty & /*$scraperModels*/ 2 && input_data_index_value !== (input_data_index_value = /*i*/ ctx[13])) {
    				attr_dev(input, "data-index", input_data_index_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot$1.name,
    		type: "slot",
    		source: "(14:8) ",
    		ctx
    	});

    	return block;
    }

    // (24:20) {#each Object.keys(valueObj) as key, k (model.name+key+j+k+i)}
    function create_each_block_2(key_1, ctx) {
    	let input;
    	let input_value_value;
    	let dispose;

    	function input_handler_1(...args) {
    		return /*input_handler_1*/ ctx[5](/*i*/ ctx[13], /*j*/ ctx[16], /*key*/ ctx[17], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			input = element("input");
    			attr_dev(input, "type", "text");
    			input.value = input_value_value = /*valueObj*/ ctx[14][/*key*/ ctx[17]];
    			attr_dev(input, "class", "svelte-xvqgsz");
    			add_location(input, file$7, 24, 20, 1132);
    			this.first = input;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, input, anchor);
    			dispose = listen_dev(input, "input", input_handler_1, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$scraperModels*/ 2 && input_value_value !== (input_value_value = /*valueObj*/ ctx[14][/*key*/ ctx[17]]) && input.value !== input_value_value) {
    				prop_dev(input, "value", input_value_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(input);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(24:20) {#each Object.keys(valueObj) as key, k (model.name+key+j+k+i)}",
    		ctx
    	});

    	return block;
    }

    // (22:12) {#each model.values as valueObj, j (`model-${i}
    function create_each_block_1(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t0;
    	let button0;
    	let svg0;
    	let path0;
    	let t1;
    	let button1;
    	let svg1;
    	let path1;
    	let path2;
    	let dispose;
    	let each_value_2 = Object.keys(/*valueObj*/ ctx[14]);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => /*model*/ ctx[11].name + /*key*/ ctx[17] + /*j*/ ctx[16] + /*k*/ ctx[19] + /*i*/ ctx[13];
    	validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2(key, child_ctx));
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[6](/*i*/ ctx[13], /*j*/ ctx[16], ...args);
    	}

    	function click_handler_1(...args) {
    		return /*click_handler_1*/ ctx[7](/*i*/ ctx[13], /*j*/ ctx[16], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t0 = space();
    			button0 = element("button");
    			svg0 = svg_element("svg");
    			path0 = svg_element("path");
    			t1 = space();
    			button1 = element("button");
    			svg1 = svg_element("svg");
    			path1 = svg_element("path");
    			path2 = svg_element("path");
    			attr_dev(path0, "d", "M6.5 21L1 1L19 11.5L12.5 14L17.5 21L15.5 22.5L10.5 15.5L6.5 21Z");
    			attr_dev(path0, "class", "svelte-xvqgsz");
    			add_location(path0, file$7, 28, 28, 1554);
    			attr_dev(svg0, "width", "20");
    			attr_dev(svg0, "height", "24");
    			attr_dev(svg0, "viewBox", "0 0 20 24");
    			attr_dev(svg0, "fill", "none");
    			attr_dev(svg0, "xmlns", "http://www.w3.org/2000/svg");
    			attr_dev(svg0, "class", "svelte-xvqgsz");
    			add_location(svg0, file$7, 27, 24, 1430);
    			attr_dev(button0, "class", "visual-selector svelte-xvqgsz");
    			add_location(button0, file$7, 26, 20, 1288);
    			attr_dev(path1, "d", "M 1 1 l 8 8");
    			attr_dev(path1, "class", "svelte-xvqgsz");
    			add_location(path1, file$7, 33, 28, 1862);
    			attr_dev(path2, "d", "M 1 9 l 8 -8");
    			attr_dev(path2, "class", "svelte-xvqgsz");
    			add_location(path2, file$7, 34, 28, 1915);
    			attr_dev(svg1, "viewBox", "0 0 10 10");
    			attr_dev(svg1, "class", "svelte-xvqgsz");
    			add_location(svg1, file$7, 32, 24, 1808);
    			attr_dev(button1, "class", "remove-value svelte-xvqgsz");
    			add_location(button1, file$7, 31, 20, 1711);
    			attr_dev(div, "class", "item-row svelte-xvqgsz");
    			add_location(div, file$7, 22, 16, 1006);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t0);
    			append_dev(div, button0);
    			append_dev(button0, svg0);
    			append_dev(svg0, path0);
    			append_dev(div, t1);
    			append_dev(div, button1);
    			append_dev(button1, svg1);
    			append_dev(svg1, path1);
    			append_dev(svg1, path2);

    			dispose = [
    				listen_dev(button0, "click", click_handler, false, false, false),
    				listen_dev(button1, "click", click_handler_1, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$scraperModels, Object, updateModelValue*/ 2) {
    				const each_value_2 = Object.keys(/*valueObj*/ ctx[14]);
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div, destroy_block, create_each_block_2, t0, get_each_context_2);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(22:12) {#each model.values as valueObj, j (`model-${i}",
    		ctx
    	});

    	return block;
    }

    // (16:8) <div slot='items' class='items'>
    function create_items_slot$1(ctx) {
    	let div0;
    	let div1;
    	let strong0;
    	let t1;
    	let strong1;
    	let t3;
    	let strong2;
    	let t5;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t6;
    	let button;
    	let strong3;
    	let t8;
    	let dispose;
    	let each_value_1 = /*model*/ ctx[11].values;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => `model-${/*i*/ ctx[13]}-${/*j*/ ctx[16]}`;
    	validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1(key, child_ctx));
    	}

    	function click_handler_2(...args) {
    		return /*click_handler_2*/ ctx[8](/*i*/ ctx[13], ...args);
    	}

    	const block = {
    		c: function create() {
    			div0 = element("div");
    			div1 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Value";
    			t1 = space();
    			strong1 = element("strong");
    			strong1.textContent = "Selector";
    			t3 = space();
    			strong2 = element("strong");
    			strong2.textContent = "Property";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t6 = space();
    			button = element("button");
    			strong3 = element("strong");
    			strong3.textContent = "+ Add";
    			t8 = text(" Value");
    			add_location(strong0, file$7, 17, 16, 796);
    			add_location(strong1, file$7, 18, 16, 835);
    			add_location(strong2, file$7, 19, 16, 877);
    			attr_dev(div1, "class", "item-row svelte-xvqgsz");
    			add_location(div1, file$7, 16, 12, 757);
    			add_location(strong3, file$7, 39, 74, 2119);
    			attr_dev(button, "class", "add-value svelte-xvqgsz");
    			add_location(button, file$7, 39, 12, 2057);
    			attr_dev(div0, "slot", "items");
    			attr_dev(div0, "class", "items svelte-xvqgsz");
    			add_location(div0, file$7, 15, 8, 712);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div0, anchor);
    			append_dev(div0, div1);
    			append_dev(div1, strong0);
    			append_dev(div1, t1);
    			append_dev(div1, strong1);
    			append_dev(div1, t3);
    			append_dev(div1, strong2);
    			append_dev(div0, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div0, null);
    			}

    			append_dev(div0, t6);
    			append_dev(div0, button);
    			append_dev(button, strong3);
    			append_dev(button, t8);
    			dispose = listen_dev(button, "click", click_handler_2, false, false, false);
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*removeModelValue, $scraperModels, console, $sitemap, showVisualPicker, Object, updateModelValue*/ 7) {
    				const each_value_1 = /*model*/ ctx[11].values;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div0, destroy_block, create_each_block_1, t6, get_each_context_1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div0);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}

    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_items_slot$1.name,
    		type: "slot",
    		source: "(16:8) <div slot='items' class='items'>",
    		ctx
    	});

    	return block;
    }

    // (13:4) <Accordion closeCallback={ () => removeModel(i) } >
    function create_default_slot$1(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$1.name,
    		type: "slot",
    		source: "(13:4) <Accordion closeCallback={ () => removeModel(i) } >",
    		ctx
    	});

    	return block;
    }

    // (12:4) {#each $scraperModels as model, i (`${scrapesRun}
    function create_each_block$2(key_1, ctx) {
    	let first;
    	let current;

    	function func(...args) {
    		return /*func*/ ctx[3](/*i*/ ctx[13], ...args);
    	}

    	const accordion = new Accordion({
    			props: {
    				closeCallback: func,
    				$$slots: {
    					default: [create_default_slot$1],
    					items: [create_items_slot$1],
    					button: [create_button_slot$1]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(accordion.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(accordion, target, anchor);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			const accordion_changes = {};
    			if (dirty & /*$scraperModels*/ 2) accordion_changes.closeCallback = func;

    			if (dirty & /*$$scope, $scraperModels, $sitemap, showVisualPicker*/ 1048583) {
    				accordion_changes.$$scope = { dirty, ctx };
    			}

    			accordion.$set(accordion_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accordion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accordion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(accordion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$2.name,
    		type: "each",
    		source: "(12:4) {#each $scraperModels as model, i (`${scrapesRun}",
    		ctx
    	});

    	return block;
    }

    // (46:0) {#if showVisualPicker}
    function create_if_block$4(ctx) {
    	let current;

    	const visualpicker = new VisualPicker({
    			props: {
    				modelIndex: /*showVisualPicker*/ ctx[0][0],
    				valueIndex: /*showVisualPicker*/ ctx[0][1],
    				closeCallback: /*func_1*/ ctx[10],
    				iFrameSrc: /*$sitemap*/ ctx[2] ? /*$sitemap*/ ctx[2].name : ""
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(visualpicker.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(visualpicker, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const visualpicker_changes = {};
    			if (dirty & /*showVisualPicker*/ 1) visualpicker_changes.modelIndex = /*showVisualPicker*/ ctx[0][0];
    			if (dirty & /*showVisualPicker*/ 1) visualpicker_changes.valueIndex = /*showVisualPicker*/ ctx[0][1];
    			if (dirty & /*showVisualPicker*/ 1) visualpicker_changes.closeCallback = /*func_1*/ ctx[10];
    			if (dirty & /*$sitemap*/ 4) visualpicker_changes.iFrameSrc = /*$sitemap*/ ctx[2] ? /*$sitemap*/ ctx[2].name : "";
    			visualpicker.$set(visualpicker_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(visualpicker.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(visualpicker.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(visualpicker, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$4.name,
    		type: "if",
    		source: "(46:0) {#if showVisualPicker}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$8(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let button;
    	let strong;
    	let t4;
    	let t5;
    	let if_block1_anchor;
    	let current;
    	let dispose;
    	let if_block0 = /*$scraperModels*/ ctx[1] && /*$scraperModels*/ ctx[1].length > 0 && create_if_block_1$1(ctx);
    	let if_block1 = /*showVisualPicker*/ ctx[0] && create_if_block$4(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Models";
    			t1 = space();
    			if (if_block0) if_block0.c();
    			t2 = space();
    			button = element("button");
    			strong = element("strong");
    			strong.textContent = "+ Add";
    			t4 = text(" Model");
    			t5 = space();
    			if (if_block1) if_block1.c();
    			if_block1_anchor = empty();
    			add_location(h1, file$7, 9, 0, 342);
    			add_location(strong, file$7, 44, 56, 2268);
    			attr_dev(button, "class", "add-model svelte-xvqgsz");
    			add_location(button, file$7, 44, 0, 2212);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block0) if_block0.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, strong);
    			append_dev(button, t4);
    			insert_dev(target, t5, anchor);
    			if (if_block1) if_block1.m(target, anchor);
    			insert_dev(target, if_block1_anchor, anchor);
    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler_3*/ ctx[9], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$scraperModels*/ ctx[1] && /*$scraperModels*/ ctx[1].length > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    					transition_in(if_block0, 1);
    				} else {
    					if_block0 = create_if_block_1$1(ctx);
    					if_block0.c();
    					transition_in(if_block0, 1);
    					if_block0.m(t2.parentNode, t2);
    				}
    			} else if (if_block0) {
    				group_outros();

    				transition_out(if_block0, 1, 1, () => {
    					if_block0 = null;
    				});

    				check_outros();
    			}

    			if (/*showVisualPicker*/ ctx[0]) {
    				if (if_block1) {
    					if_block1.p(ctx, dirty);
    					transition_in(if_block1, 1);
    				} else {
    					if_block1 = create_if_block$4(ctx);
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
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block0);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block0);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (if_block0) if_block0.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			if (detaching) detach_dev(t5);
    			if (if_block1) if_block1.d(detaching);
    			if (detaching) detach_dev(if_block1_anchor);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$8.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$8($$self, $$props, $$invalidate) {
    	let $scraperModels;
    	let $sitemap;
    	validate_store(scraperModels, "scraperModels");
    	component_subscribe($$self, scraperModels, $$value => $$invalidate(1, $scraperModels = $$value));
    	validate_store(sitemap, "sitemap");
    	component_subscribe($$self, sitemap, $$value => $$invalidate(2, $sitemap = $$value));
    	let showVisualPicker = false;
    	const func = i => removeModel(i);

    	const input_handler = function (e) {
    		updateName(e.target.value, this.dataset.index);
    	};

    	const input_handler_1 = (i, j, key, e) => updateModelValue(e.target.value, i, j, key);

    	const click_handler = (i, j) => {
    		console.log("sitemap = ", $sitemap);
    		$$invalidate(0, showVisualPicker = [i, j]);
    	};

    	const click_handler_1 = (i, j) => removeModelValue(i, j);
    	const click_handler_2 = i => addModelValue(i);
    	const click_handler_3 = () => addModel();

    	const func_1 = () => {
    		$$invalidate(0, showVisualPicker = false);
    	};

    	$$self.$capture_state = () => ({
    		sitemap,
    		scrapesRun,
    		scraperModels,
    		addModel,
    		updateName,
    		removeModel,
    		addModelValue,
    		updateModelValue,
    		removeModelValue,
    		VisualPicker,
    		Accordion,
    		showVisualPicker,
    		$scraperModels,
    		$sitemap
    	});

    	$$self.$inject_state = $$props => {
    		if ("showVisualPicker" in $$props) $$invalidate(0, showVisualPicker = $$props.showVisualPicker);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		showVisualPicker,
    		$scraperModels,
    		$sitemap,
    		func,
    		input_handler,
    		input_handler_1,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		func_1
    	];
    }

    class SetUpModels extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$8, create_fragment$8, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "SetUpModels",
    			options,
    			id: create_fragment$8.name
    		});
    	}
    }

    /* src/views/PrepareScrape.svelte generated by Svelte v3.19.0 */
    const file$8 = "src/views/PrepareScrape.svelte";

    function get_each_context_1$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context$3(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    // (29:0) {#if $scrapeOperations && $scrapeOperations.length > 0 }
    function create_if_block$5(ctx) {
    	let div1;
    	let div0;
    	let strong0;
    	let t1;
    	let strong1;
    	let t3;
    	let strong2;
    	let t5;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value = /*$scrapeOperations*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => `${/*$scrapesRun*/ ctx[1]}-operation-${/*i*/ ctx[11]}`;
    	validate_each_keys(ctx, each_value, get_each_context$3, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$3(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$3(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			strong0 = element("strong");
    			strong0.textContent = "Directory";
    			t1 = space();
    			strong1 = element("strong");
    			strong1.textContent = "Model";
    			t3 = space();
    			strong2 = element("strong");
    			strong2.textContent = "On";
    			t5 = space();

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(strong0, file$8, 31, 8, 1029);
    			add_location(strong1, file$8, 32, 8, 1064);
    			add_location(strong2, file$8, 33, 8, 1095);
    			attr_dev(div0, "class", "item-row svelte-4c2tx0");
    			add_location(div0, file$8, 30, 4, 998);
    			attr_dev(div1, "class", "operations svelte-4c2tx0");
    			add_location(div1, file$8, 29, 0, 969);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, strong0);
    			append_dev(div0, t1);
    			append_dev(div0, strong1);
    			append_dev(div0, t3);
    			append_dev(div0, strong2);
    			append_dev(div1, t5);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div1, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*removeOperation, $scrapeOperations, handleUpdate, $scraperModels, $sitemap, isValidPath*/ 13) {
    				const each_value = /*$scrapeOperations*/ ctx[0];
    				validate_each_argument(each_value);
    				validate_each_keys(ctx, each_value, get_each_context$3, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div1, destroy_block, create_each_block$3, null, get_each_context$3);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$5.name,
    		type: "if",
    		source: "(29:0) {#if $scrapeOperations && $scrapeOperations.length > 0 }",
    		ctx
    	});

    	return block;
    }

    // (46:16) {:else}
    function create_else_block$2(ctx) {
    	let option;

    	const block = {
    		c: function create() {
    			option = element("option");
    			option.textContent = "Set up models first!";
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file$8, 46, 16, 1899);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$2.name,
    		type: "else",
    		source: "(46:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (41:16) {#if $scraperModels && $scraperModels.length > 0}
    function create_if_block_1$2(ctx) {
    	let option;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let each_value_1 = /*$scraperModels*/ ctx[3];
    	validate_each_argument(each_value_1);
    	const get_key = ctx => "scraper-model-" + /*i*/ ctx[11];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$1(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$1(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			option = element("option");
    			option.textContent = "Choose a Model";

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    			option.__value = "";
    			option.value = option.__value;
    			add_location(option, file$8, 41, 16, 1653);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scraperModels*/ 8) {
    				const each_value_1 = /*$scraperModels*/ ctx[3];
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, each_1_anchor.parentNode, destroy_block, create_each_block_1$1, each_1_anchor, get_each_context_1$1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$2.name,
    		type: "if",
    		source: "(41:16) {#if $scraperModels && $scraperModels.length > 0}",
    		ctx
    	});

    	return block;
    }

    // (43:16) {#each $scraperModels as model, i ('scraper-model-'+i)}
    function create_each_block_1$1(key_1, ctx) {
    	let option;
    	let t_value = /*model*/ ctx[12].name + "";
    	let t;
    	let option_value_value;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			option = element("option");
    			t = text(t_value);
    			option.__value = option_value_value = /*model*/ ctx[12].name;
    			option.value = option.__value;
    			add_location(option, file$8, 43, 16, 1782);
    			this.first = option;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, option, anchor);
    			append_dev(option, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scraperModels*/ 8 && t_value !== (t_value = /*model*/ ctx[12].name + "")) set_data_dev(t, t_value);

    			if (dirty & /*$scraperModels*/ 8 && option_value_value !== (option_value_value = /*model*/ ctx[12].name)) {
    				prop_dev(option, "__value", option_value_value);
    			}

    			option.value = option.__value;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(option);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$1.name,
    		type: "each",
    		source: "(43:16) {#each $scraperModels as model, i ('scraper-model-'+i)}",
    		ctx
    	});

    	return block;
    }

    // (36:4) {#each $scrapeOperations as operation, i (`${$scrapesRun}
    function create_each_block$3(key_1, ctx) {
    	let div;
    	let input0;
    	let input0_value_value;
    	let input0_class_value;
    	let t0;
    	let select;
    	let select_value_value;
    	let t1;
    	let input1;
    	let input1_checked_value;
    	let t2;
    	let button;
    	let svg;
    	let path0;
    	let path1;
    	let t3;
    	let dispose;

    	function input_handler(...args) {
    		return /*input_handler*/ ctx[4](/*i*/ ctx[11], ...args);
    	}

    	function select_block_type(ctx, dirty) {
    		if (/*$scraperModels*/ ctx[3] && /*$scraperModels*/ ctx[3].length > 0) return create_if_block_1$2;
    		return create_else_block$2;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	function input_handler_1(...args) {
    		return /*input_handler_1*/ ctx[5](/*i*/ ctx[11], ...args);
    	}

    	function click_handler(...args) {
    		return /*click_handler*/ ctx[7](/*i*/ ctx[11], ...args);
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			input0 = element("input");
    			t0 = space();
    			select = element("select");
    			if_block.c();
    			t1 = space();
    			input1 = element("input");
    			t2 = space();
    			button = element("button");
    			svg = svg_element("svg");
    			path0 = svg_element("path");
    			path1 = svg_element("path");
    			t3 = space();
    			attr_dev(input0, "type", "text");
    			input0.value = input0_value_value = /*operation*/ ctx[9].directory;

    			attr_dev(input0, "class", input0_class_value = "" + (null_to_empty(/*$sitemap*/ ctx[2] && !isValidPath(/*operation*/ ctx[9].directory, /*$sitemap*/ ctx[2])
    			? "invalid"
    			: "") + " svelte-4c2tx0"));

    			add_location(input0, file$8, 37, 12, 1249);
    			attr_dev(select, "class", "svelte-4c2tx0");
    			add_location(select, file$8, 39, 12, 1477);
    			attr_dev(input1, "type", "checkbox");
    			input1.checked = input1_checked_value = /*operation*/ ctx[9].on;
    			attr_dev(input1, "class", "svelte-4c2tx0");
    			add_location(input1, file$8, 49, 12, 2002);
    			attr_dev(path0, "d", "M 1 1 l 8 8");
    			attr_dev(path0, "class", "svelte-4c2tx0");
    			add_location(path0, file$8, 52, 20, 2230);
    			attr_dev(path1, "d", "M 1 9 l 8 -8");
    			attr_dev(path1, "class", "svelte-4c2tx0");
    			add_location(path1, file$8, 53, 20, 2275);
    			attr_dev(svg, "viewBox", "0 0 10 10");
    			attr_dev(svg, "class", "svelte-4c2tx0");
    			add_location(svg, file$8, 51, 16, 2184);
    			attr_dev(button, "class", "remove-value svelte-4c2tx0");
    			add_location(button, file$8, 50, 12, 2099);
    			attr_dev(div, "class", "item-row svelte-4c2tx0");
    			add_location(div, file$8, 36, 8, 1214);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, input0);
    			append_dev(div, t0);
    			append_dev(div, select);
    			if_block.m(select, null);
    			select_value_value = /*operation*/ ctx[9].model;

    			for (var i_1 = 0; i_1 < select.options.length; i_1 += 1) {
    				var option = select.options[i_1];

    				if (option.__value === select_value_value) {
    					option.selected = true;
    					break;
    				}
    			}

    			append_dev(div, t1);
    			append_dev(div, input1);
    			append_dev(div, t2);
    			append_dev(div, button);
    			append_dev(button, svg);
    			append_dev(svg, path0);
    			append_dev(svg, path1);
    			append_dev(div, t3);

    			dispose = [
    				listen_dev(input0, "input", input_handler, false, false, false),
    				listen_dev(select, "input", input_handler_1, false, false, false),
    				listen_dev(input1, "input", /*input_handler_2*/ ctx[6], false, false, false),
    				listen_dev(button, "click", click_handler, false, false, false)
    			];
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;

    			if (dirty & /*$scrapeOperations*/ 1 && input0_value_value !== (input0_value_value = /*operation*/ ctx[9].directory) && input0.value !== input0_value_value) {
    				prop_dev(input0, "value", input0_value_value);
    			}

    			if (dirty & /*$sitemap, $scrapeOperations*/ 5 && input0_class_value !== (input0_class_value = "" + (null_to_empty(/*$sitemap*/ ctx[2] && !isValidPath(/*operation*/ ctx[9].directory, /*$sitemap*/ ctx[2])
    			? "invalid"
    			: "") + " svelte-4c2tx0"))) {
    				attr_dev(input0, "class", input0_class_value);
    			}

    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(select, null);
    				}
    			}

    			if (dirty & /*$scrapeOperations*/ 1 && select_value_value !== (select_value_value = /*operation*/ ctx[9].model)) {
    				for (var i_1 = 0; i_1 < select.options.length; i_1 += 1) {
    					var option = select.options[i_1];

    					if (option.__value === select_value_value) {
    						option.selected = true;
    						break;
    					}
    				}
    			}

    			if (dirty & /*$scrapeOperations*/ 1 && input1_checked_value !== (input1_checked_value = /*operation*/ ctx[9].on)) {
    				prop_dev(input1, "checked", input1_checked_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$3.name,
    		type: "each",
    		source: "(36:4) {#each $scrapeOperations as operation, i (`${$scrapesRun}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$9(ctx) {
    	let h1;
    	let t1;
    	let t2;
    	let button;
    	let strong;
    	let t4;
    	let dispose;
    	let if_block = /*$scrapeOperations*/ ctx[0] && /*$scrapeOperations*/ ctx[0].length > 0 && create_if_block$5(ctx);

    	const block = {
    		c: function create() {
    			h1 = element("h1");
    			h1.textContent = "Scrape Operations";
    			t1 = space();
    			if (if_block) if_block.c();
    			t2 = space();
    			button = element("button");
    			strong = element("strong");
    			strong.textContent = "+ Add";
    			t4 = text(" operation");
    			add_location(h1, file$8, 27, 0, 885);
    			add_location(strong, file$8, 63, 3, 2496);
    			attr_dev(button, "class", "add-operation svelte-4c2tx0");
    			add_location(button, file$8, 60, 0, 2386);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, button, anchor);
    			append_dev(button, strong);
    			append_dev(button, t4);
    			dispose = listen_dev(button, "click", /*click_handler_1*/ ctx[8], false, false, false);
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$scrapeOperations*/ ctx[0] && /*$scrapeOperations*/ ctx[0].length > 0) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block$5(ctx);
    					if_block.c();
    					if_block.m(t2.parentNode, t2);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$9.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function isValidPath(path, sitemap) {
    	const splitPath = path.split("/").filter(el => el && el !== "*");
    	let currDir = sitemap.children;
    	let valid = true;

    	for (let i = 0; i < splitPath.length; i++) {
    		const foundDir = currDir.find(child => child.name === splitPath[i] + "/");

    		if (!foundDir) {
    			valid = false;
    			break;
    		}

    		currDir = foundDir.children;
    	}

    	return valid;
    }

    function handleUpdate(val, index, key) {
    	updateOperationValue(val, index, key);
    } // $scrapeResults = undefined

    function instance$9($$self, $$props, $$invalidate) {
    	let $scrapeOperations;
    	let $scrapesRun;
    	let $sitemap;
    	let $scraperModels;
    	validate_store(scrapeOperations, "scrapeOperations");
    	component_subscribe($$self, scrapeOperations, $$value => $$invalidate(0, $scrapeOperations = $$value));
    	validate_store(scrapesRun, "scrapesRun");
    	component_subscribe($$self, scrapesRun, $$value => $$invalidate(1, $scrapesRun = $$value));
    	validate_store(sitemap, "sitemap");
    	component_subscribe($$self, sitemap, $$value => $$invalidate(2, $sitemap = $$value));
    	validate_store(scraperModels, "scraperModels");
    	component_subscribe($$self, scraperModels, $$value => $$invalidate(3, $scraperModels = $$value));
    	const input_handler = (i, e) => handleUpdate(e.target.value, i, "directory");
    	const input_handler_1 = (i, e) => handleUpdate(e.target.value, i, "model");
    	const input_handler_2 = () => handleUpdate();
    	const click_handler = i => removeOperation(i);

    	const click_handler_1 = () => {
    		addOperation();
    	}; // $scrapeResults = undefined -->

    	$$self.$capture_state = () => ({
    		scrapesRun,
    		sitemap,
    		scraperModels,
    		scrapeOperations,
    		addOperation,
    		removeOperation,
    		updateOperationValue,
    		scrapeURLs,
    		scrapeResults,
    		Accordion,
    		isValidPath,
    		handleUpdate,
    		$scrapeOperations,
    		$scrapesRun,
    		$sitemap,
    		$scraperModels
    	});

    	return [
    		$scrapeOperations,
    		$scrapesRun,
    		$sitemap,
    		$scraperModels,
    		input_handler,
    		input_handler_1,
    		input_handler_2,
    		click_handler,
    		click_handler_1
    	];
    }

    class PrepareScrape extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$9, create_fragment$9, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "PrepareScrape",
    			options,
    			id: create_fragment$9.name
    		});
    	}
    }

    /* src/views/ViewResults.svelte generated by Svelte v3.19.0 */
    const file$9 = "src/views/ViewResults.svelte";

    function get_each_context_2$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[12] = list[i];
    	child_ctx[14] = i;
    	return child_ctx;
    }

    function get_each_context_1$2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[9] = list[i];
    	child_ctx[11] = i;
    	return child_ctx;
    }

    function get_each_context$4(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[6] = list[i];
    	child_ctx[8] = i;
    	return child_ctx;
    }

    // (23:0) {#if $scrapeResults}
    function create_if_block$6(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*$scrapeResults*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*$scrapesRun*/ ctx[1] + "-operation-" + /*i*/ ctx[8];
    	validate_each_keys(ctx, each_value, get_each_context$4, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$4(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$4(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scrapeResults, Object*/ 1) {
    				const each_value = /*$scrapeResults*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$4, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$4, each_1_anchor, get_each_context$4);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$6.name,
    		type: "if",
    		source: "(23:0) {#if $scrapeResults}",
    		ctx
    	});

    	return block;
    }

    // (26:8) <div slot='button'>
    function create_button_slot$2(ctx) {
    	let div;
    	let span0;
    	let strong0;
    	let t0_value = /*operation*/ ctx[6].path + "";
    	let t0;
    	let t1;
    	let strong1;
    	let t2_value = /*operation*/ ctx[6].modelName + "";
    	let t2;
    	let t3;
    	let t4;
    	let span1;
    	let t5_value = /*operation*/ ctx[6].pageURLs.length + "";
    	let t5;
    	let t6;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			strong0 = element("strong");
    			t0 = text(t0_value);
    			t1 = text(" crawled using ");
    			strong1 = element("strong");
    			t2 = text(t2_value);
    			t3 = text(" model.");
    			t4 = space();
    			span1 = element("span");
    			t5 = text(t5_value);
    			t6 = text(" pages");
    			add_location(strong0, file$9, 26, 18, 856);
    			add_location(strong1, file$9, 26, 68, 906);
    			add_location(span0, file$9, 26, 12, 850);
    			attr_dev(span1, "class", "pages-label svelte-10zz16c");
    			add_location(span1, file$9, 27, 12, 973);
    			attr_dev(div, "slot", "button");
    			add_location(div, file$9, 25, 8, 818);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, strong0);
    			append_dev(strong0, t0);
    			append_dev(span0, t1);
    			append_dev(span0, strong1);
    			append_dev(strong1, t2);
    			append_dev(span0, t3);
    			append_dev(div, t4);
    			append_dev(div, span1);
    			append_dev(span1, t5);
    			append_dev(span1, t6);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scrapeResults*/ 1 && t0_value !== (t0_value = /*operation*/ ctx[6].path + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$scrapeResults*/ 1 && t2_value !== (t2_value = /*operation*/ ctx[6].modelName + "")) set_data_dev(t2, t2_value);
    			if (dirty & /*$scrapeResults*/ 1 && t5_value !== (t5_value = /*operation*/ ctx[6].pageURLs.length + "")) set_data_dev(t5, t5_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_button_slot$2.name,
    		type: "slot",
    		source: "(26:8) <div slot='button'>",
    		ctx
    	});

    	return block;
    }

    // (42:16) {:else}
    function create_else_block$3(ctx) {
    	let div;
    	let span0;
    	let t0_value = /*key*/ ctx[12] + "";
    	let t0;
    	let t1;
    	let span1;
    	let t2_value = /*entry*/ ctx[9][/*key*/ ctx[12]] + "";
    	let t2;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			span1 = element("span");
    			t2 = text(t2_value);
    			add_location(span0, file$9, 43, 20, 1728);
    			add_location(span1, file$9, 44, 20, 1769);
    			attr_dev(div, "class", "item-row svelte-10zz16c");
    			add_location(div, file$9, 42, 16, 1685);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, t0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, t2);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scrapeResults*/ 1 && t0_value !== (t0_value = /*key*/ ctx[12] + "")) set_data_dev(t0, t0_value);
    			if (dirty & /*$scrapeResults*/ 1 && t2_value !== (t2_value = /*entry*/ ctx[9][/*key*/ ctx[12]] + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block$3.name,
    		type: "else",
    		source: "(42:16) {:else}",
    		ctx
    	});

    	return block;
    }

    // (34:16) {#if key === 'url'}
    function create_if_block_1$3(ctx) {
    	let div;
    	let t0_value = /*entry*/ ctx[9][/*key*/ ctx[12]] + "";
    	let t0;
    	let t1;
    	let if_block_anchor;
    	let if_block = /*j*/ ctx[11] === 0 && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			attr_dev(div, "class", "item-header svelte-10zz16c");
    			add_location(div, file$9, 34, 16, 1375);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			insert_dev(target, t1, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scrapeResults*/ 1 && t0_value !== (t0_value = /*entry*/ ctx[9][/*key*/ ctx[12]] + "")) set_data_dev(t0, t0_value);

    			if (/*j*/ ctx[11] === 0) {
    				if (!if_block) {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching) detach_dev(t1);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$3.name,
    		type: "if",
    		source: "(34:16) {#if key === 'url'}",
    		ctx
    	});

    	return block;
    }

    // (36:16) {#if j === 0}
    function create_if_block_2(ctx) {
    	let div;
    	let span0;
    	let strong0;
    	let t1;
    	let span1;
    	let strong1;

    	const block = {
    		c: function create() {
    			div = element("div");
    			span0 = element("span");
    			strong0 = element("strong");
    			strong0.textContent = "Key";
    			t1 = space();
    			span1 = element("span");
    			strong1 = element("strong");
    			strong1.textContent = "Value";
    			add_location(strong0, file$9, 37, 26, 1516);
    			add_location(span0, file$9, 37, 20, 1510);
    			add_location(strong1, file$9, 38, 26, 1570);
    			add_location(span1, file$9, 38, 20, 1564);
    			attr_dev(div, "class", "item-row svelte-10zz16c");
    			add_location(div, file$9, 36, 16, 1467);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, span0);
    			append_dev(span0, strong0);
    			append_dev(div, t1);
    			append_dev(div, span1);
    			append_dev(span1, strong1);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(36:16) {#if j === 0}",
    		ctx
    	});

    	return block;
    }

    // (33:16) {#each Object.keys(entry).sort((a,b) => (a === 'url') ? -1 : 0) as key, k (`operation-${i}
    function create_each_block_2$1(key_1, ctx) {
    	let first;
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*key*/ ctx[12] === "url") return create_if_block_1$3;
    		return create_else_block$3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type(ctx);

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			if_block.c();
    			if_block_anchor = empty();
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if_block.d(1);
    				if_block = current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2$1.name,
    		type: "each",
    		source: "(33:16) {#each Object.keys(entry).sort((a,b) => (a === 'url') ? -1 : 0) as key, k (`operation-${i}",
    		ctx
    	});

    	return block;
    }

    // (31:12) {#each operation.values as entry, j ('operation-'+i+'-entry-'+j)}
    function create_each_block_1$2(key_1, ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let t;
    	let each_value_2 = Object.keys(/*entry*/ ctx[9]).sort(func);
    	validate_each_argument(each_value_2);
    	const get_key = ctx => `operation-${/*i*/ ctx[8]}-entry-${/*j*/ ctx[11]}-val-${/*k*/ ctx[14]}`;
    	validate_each_keys(ctx, each_value_2, get_each_context_2$1, get_key);

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		let child_ctx = get_each_context_2$1(ctx, each_value_2, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_2$1(key, child_ctx));
    	}

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(div, "class", "item svelte-10zz16c");
    			add_location(div, file$9, 31, 12, 1174);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			append_dev(div, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*$scrapeResults, Object*/ 1) {
    				const each_value_2 = Object.keys(/*entry*/ ctx[9]).sort(func);
    				validate_each_argument(each_value_2);
    				validate_each_keys(ctx, each_value_2, get_each_context_2$1, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_2, each_1_lookup, div, destroy_block, create_each_block_2$1, t, get_each_context_2$1);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1$2.name,
    		type: "each",
    		source: "(31:12) {#each operation.values as entry, j ('operation-'+i+'-entry-'+j)}",
    		ctx
    	});

    	return block;
    }

    // (30:8) <div slot='items'>
    function create_items_slot$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_value_1 = /*operation*/ ctx[6].values;
    	validate_each_argument(each_value_1);
    	const get_key = ctx => "operation-" + /*i*/ ctx[8] + "-entry-" + /*j*/ ctx[11];
    	validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		let child_ctx = get_each_context_1$2(ctx, each_value_1, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block_1$2(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "slot", "items");
    			add_location(div, file$9, 29, 8, 1065);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*Object, $scrapeResults*/ 1) {
    				const each_value_1 = /*operation*/ ctx[6].values;
    				validate_each_argument(each_value_1);
    				validate_each_keys(ctx, each_value_1, get_each_context_1$2, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value_1, each_1_lookup, div, destroy_block, create_each_block_1$2, null, get_each_context_1$2);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_items_slot$2.name,
    		type: "slot",
    		source: "(30:8) <div slot='items'>",
    		ctx
    	});

    	return block;
    }

    // (25:4) <Accordion>
    function create_default_slot$2(ctx) {
    	let t0;
    	let t1;

    	const block = {
    		c: function create() {
    			t0 = space();
    			t1 = space();
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, t1, anchor);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(t1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$2.name,
    		type: "slot",
    		source: "(25:4) <Accordion>",
    		ctx
    	});

    	return block;
    }

    // (24:4) {#each $scrapeResults as operation, i ($scrapesRun+'-operation-'+i)}
    function create_each_block$4(key_1, ctx) {
    	let first;
    	let current;

    	const accordion = new Accordion({
    			props: {
    				$$slots: {
    					default: [create_default_slot$2],
    					items: [create_items_slot$2],
    					button: [create_button_slot$2]
    				},
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(accordion.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(accordion, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const accordion_changes = {};

    			if (dirty & /*$$scope, $scrapeResults*/ 32769) {
    				accordion_changes.$$scope = { dirty, ctx };
    			}

    			accordion.$set(accordion_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(accordion.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(accordion.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(accordion, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$4.name,
    		type: "each",
    		source: "(24:4) {#each $scrapeResults as operation, i ($scrapesRun+'-operation-'+i)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$a(ctx) {
    	let div1;
    	let h1;
    	let t1;
    	let div0;
    	let button0;
    	let t3;
    	let button1;
    	let t5;
    	let if_block_anchor;
    	let current;
    	let dispose;
    	let if_block = /*$scrapeResults*/ ctx[0] && create_if_block$6(ctx);

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			h1 = element("h1");
    			h1.textContent = "Scrape Results";
    			t1 = space();
    			div0 = element("div");
    			button0 = element("button");
    			button0.textContent = "Save Data + Screenshots";
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "Save Data";
    			t5 = space();
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    			add_location(h1, file$9, 16, 4, 440);
    			attr_dev(button0, "class", "save save-screenshots svelte-10zz16c");
    			add_location(button0, file$9, 18, 8, 499);
    			attr_dev(button1, "class", "save svelte-10zz16c");
    			add_location(button1, file$9, 19, 8, 612);
    			attr_dev(div0, "class", "flex-out svelte-10zz16c");
    			add_location(div0, file$9, 17, 4, 468);
    			attr_dev(div1, "class", "flex-out svelte-10zz16c");
    			add_location(div1, file$9, 15, 0, 413);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, h1);
    			append_dev(div1, t1);
    			append_dev(div1, div0);
    			append_dev(div0, button0);
    			append_dev(div0, t3);
    			append_dev(div0, button1);
    			insert_dev(target, t5, anchor);
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;

    			dispose = [
    				listen_dev(button0, "click", /*click_handler*/ ctx[4], false, false, false),
    				listen_dev(button1, "click", /*click_handler_1*/ ctx[5], false, false, false)
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*$scrapeResults*/ ctx[0]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    					transition_in(if_block, 1);
    				} else {
    					if_block = create_if_block$6(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				group_outros();

    				transition_out(if_block, 1, 1, () => {
    					if_block = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			if (detaching) detach_dev(t5);
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$a.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    const func = (a, b) => a === "url" ? -1 : 0;

    function instance$a($$self, $$props, $$invalidate) {
    	let $sitemap;
    	let $scrapeResults;
    	let $scrapesRun;
    	validate_store(sitemap, "sitemap");
    	component_subscribe($$self, sitemap, $$value => $$invalidate(3, $sitemap = $$value));
    	validate_store(scrapeResults, "scrapeResults");
    	component_subscribe($$self, scrapeResults, $$value => $$invalidate(0, $scrapeResults = $$value));
    	validate_store(scrapesRun, "scrapesRun");
    	component_subscribe($$self, scrapesRun, $$value => $$invalidate(1, $scrapesRun = $$value));

    	function saveData(takeScreenshots = false) {
    		if (window.api) {
    			window.api.send("toMain:save", {
    				sitemap: $sitemap,
    				dirConfigs: $scrapeResults,
    				takeScreenshots
    			});
    		}
    	}

    	const click_handler = () => saveData(true);
    	const click_handler_1 = () => saveData();

    	$$self.$capture_state = () => ({
    		sitemap,
    		scrapesRun,
    		scrapeResults,
    		Accordion,
    		saveData,
    		window,
    		$sitemap,
    		$scrapeResults,
    		$scrapesRun
    	});

    	return [
    		$scrapeResults,
    		$scrapesRun,
    		saveData,
    		$sitemap,
    		click_handler,
    		click_handler_1
    	];
    }

    class ViewResults extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$a, create_fragment$a, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "ViewResults",
    			options,
    			id: create_fragment$a.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.19.0 */

    const file$a = "src/App.svelte";

    function get_each_context$5(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[18] = list[i];
    	child_ctx[20] = i;
    	return child_ctx;
    }

    // (98:3) <Tab className={(label.includes('Results') ? 'results' : '') + (isScraping ? ' scraping' : '')}>
    function create_default_slot_6(ctx) {
    	let t_value = /*label*/ ctx[18] + "";
    	let t;

    	const block = {
    		c: function create() {
    			t = text(t_value);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tabLabels*/ 4 && t_value !== (t_value = /*label*/ ctx[18] + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_6.name,
    		type: "slot",
    		source: "(98:3) <Tab className={(label.includes('Results') ? 'results' : '') + (isScraping ? ' scraping' : '')}>",
    		ctx
    	});

    	return block;
    }

    // (97:3) {#each tabLabels as label, i (label)}
    function create_each_block$5(key_1, ctx) {
    	let first;
    	let current;

    	const tab = new Tab({
    			props: {
    				className: (/*label*/ ctx[18].includes("Results") ? "results" : "") + (/*isScraping*/ ctx[3] ? " scraping" : ""),
    				$$slots: { default: [create_default_slot_6] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			first = empty();
    			create_component(tab.$$.fragment);
    			this.first = first;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, first, anchor);
    			mount_component(tab, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const tab_changes = {};
    			if (dirty & /*tabLabels, isScraping*/ 12) tab_changes.className = (/*label*/ ctx[18].includes("Results") ? "results" : "") + (/*isScraping*/ ctx[3] ? " scraping" : "");

    			if (dirty & /*$$scope, tabLabels*/ 2097156) {
    				tab_changes.$$scope = { dirty, ctx };
    			}

    			tab.$set(tab_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tab.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tab.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(first);
    			destroy_component(tab, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$5.name,
    		type: "each",
    		source: "(97:3) {#each tabLabels as label, i (label)}",
    		ctx
    	});

    	return block;
    }

    // (96:2) <TabList>
    function create_default_slot_5(ctx) {
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let each_1_anchor;
    	let current;
    	let each_value = /*tabLabels*/ ctx[2];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*label*/ ctx[18];
    	validate_each_keys(ctx, each_value, get_each_context$5, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context$5(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block$5(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*tabLabels, isScraping*/ 12) {
    				const each_value = /*tabLabels*/ ctx[2];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context$5, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, each_1_anchor.parentNode, outro_and_destroy_block, create_each_block$5, each_1_anchor, get_each_context$5);
    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d(detaching);
    			}

    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_5.name,
    		type: "slot",
    		source: "(96:2) <TabList>",
    		ctx
    	});

    	return block;
    }

    // (101:2) {#if isScraping && pagesToScrape > 0}
    function create_if_block_1$4(ctx) {
    	let div1;
    	let div0;
    	let t0;
    	let p;

    	let t1_value = (/*pagesToScrape*/ ctx[6] === /*$scrapeURLs*/ ctx[5].flat().length
    	? "Scraping..."
    	: `${/*totalPages*/ ctx[4] - /*pagesToScrape*/ ctx[6]} of ${/*totalPages*/ ctx[4]} pages scraped`) + "";

    	let t1;

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = space();
    			p = element("p");
    			t1 = text(t1_value);
    			attr_dev(div0, "class", "bar svelte-x5m2kz");
    			add_location(div0, file$a, 102, 4, 3219);
    			attr_dev(p, "class", "svelte-x5m2kz");
    			add_location(p, file$a, 103, 4, 3247);
    			attr_dev(div1, "class", "progress-bar svelte-x5m2kz");
    			add_location(div1, file$a, 101, 3, 3188);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div1, t0);
    			append_dev(div1, p);
    			append_dev(p, t1);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*pagesToScrape, $scrapeURLs, totalPages*/ 112 && t1_value !== (t1_value = (/*pagesToScrape*/ ctx[6] === /*$scrapeURLs*/ ctx[5].flat().length
    			? "Scraping..."
    			: `${/*totalPages*/ ctx[4] - /*pagesToScrape*/ ctx[6]} of ${/*totalPages*/ ctx[4]} pages scraped`) + "")) set_data_dev(t1, t1_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1$4.name,
    		type: "if",
    		source: "(101:2) {#if isScraping && pagesToScrape > 0}",
    		ctx
    	});

    	return block;
    }

    // (109:2) <TabPanel key='panel-0'>
    function create_default_slot_4(ctx) {
    	let current;
    	const buildsitemap = new BuildSitemap({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(buildsitemap.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(buildsitemap, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(buildsitemap.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(buildsitemap.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(buildsitemap, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_4.name,
    		type: "slot",
    		source: "(109:2) <TabPanel key='panel-0'>",
    		ctx
    	});

    	return block;
    }

    // (112:2) <TabPanel key='panel-1'>
    function create_default_slot_3(ctx) {
    	let current;
    	const setupmodels = new SetUpModels({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(setupmodels.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(setupmodels, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(setupmodels.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(setupmodels.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(setupmodels, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_3.name,
    		type: "slot",
    		source: "(112:2) <TabPanel key='panel-1'>",
    		ctx
    	});

    	return block;
    }

    // (115:2) <TabPanel key='panel-2'>
    function create_default_slot_2(ctx) {
    	let current;
    	const preparescrape = new PrepareScrape({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(preparescrape.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(preparescrape, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(preparescrape.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(preparescrape.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(preparescrape, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_2.name,
    		type: "slot",
    		source: "(115:2) <TabPanel key='panel-2'>",
    		ctx
    	});

    	return block;
    }

    // (118:2) {#if $scrapeResults}
    function create_if_block$7(ctx) {
    	let current;

    	const tabpanel = new TabPanel({
    			props: {
    				key: "panel-3",
    				$$slots: { default: [create_default_slot_1] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabpanel.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabpanel, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabpanel.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabpanel.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabpanel, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$7.name,
    		type: "if",
    		source: "(118:2) {#if $scrapeResults}",
    		ctx
    	});

    	return block;
    }

    // (119:2) <TabPanel key='panel-3'>
    function create_default_slot_1(ctx) {
    	let current;
    	const viewresults = new ViewResults({ $$inline: true });

    	const block = {
    		c: function create() {
    			create_component(viewresults.$$.fragment);
    		},
    		m: function mount(target, anchor) {
    			mount_component(viewresults, target, anchor);
    			current = true;
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(viewresults.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(viewresults.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(viewresults, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot_1.name,
    		type: "slot",
    		source: "(119:2) <TabPanel key='panel-3'>",
    		ctx
    	});

    	return block;
    }

    // (91:0) <Tabs>
    function create_default_slot$3(ctx) {
    	let header;
    	let span;
    	let t0_value = (/*isConnected*/ ctx[0] ? "Connected" : "Not Connected") + "";
    	let t0;
    	let span_class_value;
    	let t1;
    	let button;
    	let t2;
    	let button_disabled_value;
    	let t3;
    	let t4;
    	let header_style_value;
    	let t5;
    	let main;
    	let t6;
    	let t7;
    	let t8;
    	let current;
    	let dispose;

    	const tablist = new TabList({
    			props: {
    				$$slots: { default: [create_default_slot_5] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block0 = /*isScraping*/ ctx[3] && /*pagesToScrape*/ ctx[6] > 0 && create_if_block_1$4(ctx);

    	const tabpanel0 = new TabPanel({
    			props: {
    				key: "panel-0",
    				$$slots: { default: [create_default_slot_4] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tabpanel1 = new TabPanel({
    			props: {
    				key: "panel-1",
    				$$slots: { default: [create_default_slot_3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const tabpanel2 = new TabPanel({
    			props: {
    				key: "panel-2",
    				$$slots: { default: [create_default_slot_2] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	let if_block1 = /*$scrapeResults*/ ctx[7] && create_if_block$7(ctx);

    	const block = {
    		c: function create() {
    			header = element("header");
    			span = element("span");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			t2 = text("Run Scrape");
    			t3 = space();
    			create_component(tablist.$$.fragment);
    			t4 = space();
    			if (if_block0) if_block0.c();
    			t5 = space();
    			main = element("main");
    			create_component(tabpanel0.$$.fragment);
    			t6 = space();
    			create_component(tabpanel1.$$.fragment);
    			t7 = space();
    			create_component(tabpanel2.$$.fragment);
    			t8 = space();
    			if (if_block1) if_block1.c();
    			attr_dev(span, "class", span_class_value = "" + (null_to_empty("connection-status" + (/*isConnected*/ ctx[0] ? " connected" : "")) + " svelte-x5m2kz"));
    			add_location(span, file$a, 92, 2, 2717);
    			attr_dev(button, "class", "run-scrape svelte-x5m2kz");
    			button.disabled = button_disabled_value = !/*scrapeIsReady*/ ctx[1];
    			add_location(button, file$a, 93, 2, 2845);

    			attr_dev(header, "style", header_style_value = /*isScraping*/ ctx[3] && /*pagesToScrape*/ ctx[6] > 0
    			? `--scrape-progress: ${100 - /*pagesToScrape*/ ctx[6] / /*totalPages*/ ctx[4] * 100}%;`
    			: "");

    			attr_dev(header, "class", "svelte-x5m2kz");
    			add_location(header, file$a, 91, 1, 2587);
    			attr_dev(main, "class", "svelte-x5m2kz");
    			add_location(main, file$a, 107, 1, 3419);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, span);
    			append_dev(span, t0);
    			append_dev(header, t1);
    			append_dev(header, button);
    			append_dev(button, t2);
    			append_dev(header, t3);
    			mount_component(tablist, header, null);
    			append_dev(header, t4);
    			if (if_block0) if_block0.m(header, null);
    			insert_dev(target, t5, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(tabpanel0, main, null);
    			append_dev(main, t6);
    			mount_component(tabpanel1, main, null);
    			append_dev(main, t7);
    			mount_component(tabpanel2, main, null);
    			append_dev(main, t8);
    			if (if_block1) if_block1.m(main, null);
    			current = true;
    			dispose = listen_dev(button, "click", /*click_handler*/ ctx[17], false, false, false);
    		},
    		p: function update(ctx, dirty) {
    			if ((!current || dirty & /*isConnected*/ 1) && t0_value !== (t0_value = (/*isConnected*/ ctx[0] ? "Connected" : "Not Connected") + "")) set_data_dev(t0, t0_value);

    			if (!current || dirty & /*isConnected*/ 1 && span_class_value !== (span_class_value = "" + (null_to_empty("connection-status" + (/*isConnected*/ ctx[0] ? " connected" : "")) + " svelte-x5m2kz"))) {
    				attr_dev(span, "class", span_class_value);
    			}

    			if (!current || dirty & /*scrapeIsReady*/ 2 && button_disabled_value !== (button_disabled_value = !/*scrapeIsReady*/ ctx[1])) {
    				prop_dev(button, "disabled", button_disabled_value);
    			}

    			const tablist_changes = {};

    			if (dirty & /*$$scope, tabLabels, isScraping*/ 2097164) {
    				tablist_changes.$$scope = { dirty, ctx };
    			}

    			tablist.$set(tablist_changes);

    			if (/*isScraping*/ ctx[3] && /*pagesToScrape*/ ctx[6] > 0) {
    				if (if_block0) {
    					if_block0.p(ctx, dirty);
    				} else {
    					if_block0 = create_if_block_1$4(ctx);
    					if_block0.c();
    					if_block0.m(header, null);
    				}
    			} else if (if_block0) {
    				if_block0.d(1);
    				if_block0 = null;
    			}

    			if (!current || dirty & /*isScraping, pagesToScrape, totalPages*/ 88 && header_style_value !== (header_style_value = /*isScraping*/ ctx[3] && /*pagesToScrape*/ ctx[6] > 0
    			? `--scrape-progress: ${100 - /*pagesToScrape*/ ctx[6] / /*totalPages*/ ctx[4] * 100}%;`
    			: "")) {
    				attr_dev(header, "style", header_style_value);
    			}

    			const tabpanel0_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				tabpanel0_changes.$$scope = { dirty, ctx };
    			}

    			tabpanel0.$set(tabpanel0_changes);
    			const tabpanel1_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				tabpanel1_changes.$$scope = { dirty, ctx };
    			}

    			tabpanel1.$set(tabpanel1_changes);
    			const tabpanel2_changes = {};

    			if (dirty & /*$$scope*/ 2097152) {
    				tabpanel2_changes.$$scope = { dirty, ctx };
    			}

    			tabpanel2.$set(tabpanel2_changes);

    			if (/*$scrapeResults*/ ctx[7]) {
    				if (!if_block1) {
    					if_block1 = create_if_block$7(ctx);
    					if_block1.c();
    					transition_in(if_block1, 1);
    					if_block1.m(main, null);
    				} else {
    					transition_in(if_block1, 1);
    				}
    			} else if (if_block1) {
    				group_outros();

    				transition_out(if_block1, 1, 1, () => {
    					if_block1 = null;
    				});

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tablist.$$.fragment, local);
    			transition_in(tabpanel0.$$.fragment, local);
    			transition_in(tabpanel1.$$.fragment, local);
    			transition_in(tabpanel2.$$.fragment, local);
    			transition_in(if_block1);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tablist.$$.fragment, local);
    			transition_out(tabpanel0.$$.fragment, local);
    			transition_out(tabpanel1.$$.fragment, local);
    			transition_out(tabpanel2.$$.fragment, local);
    			transition_out(if_block1);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			destroy_component(tablist);
    			if (if_block0) if_block0.d();
    			if (detaching) detach_dev(t5);
    			if (detaching) detach_dev(main);
    			destroy_component(tabpanel0);
    			destroy_component(tabpanel1);
    			destroy_component(tabpanel2);
    			if (if_block1) if_block1.d();
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_default_slot$3.name,
    		type: "slot",
    		source: "(91:0) <Tabs>",
    		ctx
    	});

    	return block;
    }

    function create_fragment$b(ctx) {
    	let current;

    	const tabs = new Tabs({
    			props: {
    				$$slots: { default: [create_default_slot$3] },
    				$$scope: { ctx }
    			},
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			create_component(tabs.$$.fragment);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			mount_component(tabs, target, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			const tabs_changes = {};

    			if (dirty & /*$$scope, $scrapeResults, isScraping, pagesToScrape, totalPages, $scrapeURLs, tabLabels, scrapeIsReady, isConnected*/ 2097407) {
    				tabs_changes.$$scope = { dirty, ctx };
    			}

    			tabs.$set(tabs_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(tabs.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(tabs.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_component(tabs, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$b.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$b($$self, $$props, $$invalidate) {
    	let $sitemap;
    	let $scraperModels;
    	let $scrapeOperations;
    	let $scrapeURLs;
    	let $scrapeResults;
    	let $scrapesRun;
    	validate_store(sitemap, "sitemap");
    	component_subscribe($$self, sitemap, $$value => $$invalidate(9, $sitemap = $$value));
    	validate_store(scraperModels, "scraperModels");
    	component_subscribe($$self, scraperModels, $$value => $$invalidate(10, $scraperModels = $$value));
    	validate_store(scrapeOperations, "scrapeOperations");
    	component_subscribe($$self, scrapeOperations, $$value => $$invalidate(11, $scrapeOperations = $$value));
    	validate_store(scrapeURLs, "scrapeURLs");
    	component_subscribe($$self, scrapeURLs, $$value => $$invalidate(5, $scrapeURLs = $$value));
    	validate_store(scrapeResults, "scrapeResults");
    	component_subscribe($$self, scrapeResults, $$value => $$invalidate(7, $scrapeResults = $$value));
    	validate_store(scrapesRun, "scrapesRun");
    	component_subscribe($$self, scrapesRun, $$value => $$invalidate(13, $scrapesRun = $$value));
    	let isConnected = navigator.onLine;

    	window.addEventListener("offline", () => {
    		$$invalidate(0, isConnected = false);
    	});

    	window.addEventListener("online", () => {
    		$$invalidate(0, isConnected = true);
    	});

    	let scrapeIsReady = false;
    	let tabLabels = ["Build Sitemap", "Set Up Models", "Prepare Scrape"];
    	let currView = 0;
    	let textInput = {};
    	let textVal = "";
    	let isScraping = false;

    	if (window.api) {
    		window.api.receive("fromMain:sitemap", newSitemap => {
    			console.log("received new site map!");
    			set_store_value(sitemap, $sitemap = newSitemap);
    			set_store_value(scrapeResults, $scrapeResults = undefined);
    		});

    		window.api.receive("fromMain:scrapePageSuccess", url => {
    			console.log(`successfully scraped page: ${url}`);
    			$$invalidate(6, pagesToScrape--, pagesToScrape);
    		});

    		window.api.receive("fromMain:scrapeSuccess", results => {
    			if (tabLabels.includes("View Results")) {
    				const newLabels = tabLabels.filter(label => label !== "View Results");
    				$$invalidate(2, tabLabels = newLabels);
    			}

    			console.log("scrape results: ", results);
    			$$invalidate(3, isScraping = false);
    			set_store_value(scrapeResults, $scrapeResults = results);
    			$$invalidate(2, tabLabels = [...tabLabels, "View Results"]);
    			set_store_value(scrapesRun, $scrapesRun++, $scrapesRun);
    		});

    		window.api.receive("fromMain:scrapeFailure", err => {
    			console.log("err = ", err);
    			set_store_value(scrapeResults, $scrapeResults = undefined);

    			if (tabLabels.includes("View Results")) {
    				const newLabels = tabLabels.filter(label => label !== "View Results");
    				$$invalidate(2, tabLabels = newLabels);
    			}

    			set_store_value(scrapesRun, $scrapesRun++, $scrapesRun);
    		});
    	}

    	function handleRun() {
    		console.log("models = ", $scraperModels);
    		console.log("operations = ", $scrapeOperations);
    		console.log("sitemap = ", $sitemap);
    		console.log("scrapeURLs = ", $scrapeURLs);

    		if (window.api) {
    			window.api.send("toMain:scrape", {
    				sitemap: $sitemap,
    				operations: $scrapeOperations.map(op => {
    					const newOp = op;
    					newOp.model = $scraperModels.find(model => model.name === newOp.model);
    					return newOp;
    				})
    			});

    			$$invalidate(3, isScraping = true);
    		} else {
    			console.error("running in environment without access to Node scraper function!");
    		}
    	}

    	const click_handler = () => handleRun();

    	$$self.$capture_state = () => ({
    		Tabs,
    		TabList,
    		TabPanel,
    		Tab,
    		BuildSitemap,
    		SetUpModels,
    		PrepareScrape,
    		ViewResults,
    		scrapesRun,
    		sitemap,
    		scraperModels,
    		scrapeOperations,
    		scrapeResults,
    		scrapeURLs,
    		isConnected,
    		scrapeIsReady,
    		tabLabels,
    		currView,
    		textInput,
    		textVal,
    		isScraping,
    		handleRun,
    		navigator,
    		window,
    		$sitemap,
    		$scraperModels,
    		$scrapeOperations,
    		totalPages,
    		$scrapeURLs,
    		undefined,
    		pagesToScrape,
    		arrVal,
    		JSON,
    		console,
    		$scrapeResults,
    		$scrapesRun
    	});

    	$$self.$inject_state = $$props => {
    		if ("isConnected" in $$props) $$invalidate(0, isConnected = $$props.isConnected);
    		if ("scrapeIsReady" in $$props) $$invalidate(1, scrapeIsReady = $$props.scrapeIsReady);
    		if ("tabLabels" in $$props) $$invalidate(2, tabLabels = $$props.tabLabels);
    		if ("currView" in $$props) currView = $$props.currView;
    		if ("textInput" in $$props) textInput = $$props.textInput;
    		if ("textVal" in $$props) $$invalidate(16, textVal = $$props.textVal);
    		if ("isScraping" in $$props) $$invalidate(3, isScraping = $$props.isScraping);
    		if ("totalPages" in $$props) $$invalidate(4, totalPages = $$props.totalPages);
    		if ("pagesToScrape" in $$props) $$invalidate(6, pagesToScrape = $$props.pagesToScrape);
    		if ("arrVal" in $$props) arrVal = $$props.arrVal;
    	};

    	let totalPages;
    	let pagesToScrape;
    	let arrVal;

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*$sitemap, $scraperModels, $scrapeOperations, isConnected*/ 3585) {
    			 $$invalidate(1, scrapeIsReady = $sitemap && $scraperModels && $scrapeOperations && isConnected && $scrapeOperations.every(operation => operation.model));
    		}

    		if ($$self.$$.dirty & /*$scrapeURLs*/ 32) {
    			 $$invalidate(4, totalPages = $scrapeURLs ? $scrapeURLs.flat().length : undefined);
    		}

    		if ($$self.$$.dirty & /*$scrapeURLs, totalPages*/ 48) {
    			 $$invalidate(6, pagesToScrape = $scrapeURLs ? totalPages : undefined);
    		}
    	};

    	 arrVal = (function (val) {
    		try {
    			return JSON.parse(val);
    		} catch(err) {
    			return null;
    		}
    	})(textVal);

    	return [
    		isConnected,
    		scrapeIsReady,
    		tabLabels,
    		isScraping,
    		totalPages,
    		$scrapeURLs,
    		pagesToScrape,
    		$scrapeResults,
    		handleRun,
    		$sitemap,
    		$scraperModels,
    		$scrapeOperations,
    		arrVal,
    		$scrapesRun,
    		currView,
    		textInput,
    		textVal,
    		click_handler
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$b, create_fragment$b, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$b.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
