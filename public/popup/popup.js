
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    const identity = x => x;
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
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    const is_client = typeof window !== 'undefined';
    let now = is_client
        ? () => window.performance.now()
        : () => Date.now();
    let raf = is_client ? cb => requestAnimationFrame(cb) : noop;

    const tasks = new Set();
    function run_tasks(now) {
        tasks.forEach(task => {
            if (!task.c(now)) {
                tasks.delete(task);
                task.f();
            }
        });
        if (tasks.size !== 0)
            raf(run_tasks);
    }
    /**
     * Creates a new task that runs on each raf frame
     * until it returns a falsy value or is aborted
     */
    function loop(callback) {
        let task;
        if (tasks.size === 0)
            raf(run_tasks);
        return {
            promise: new Promise(fulfill => {
                tasks.add(task = { c: callback, f: fulfill });
            }),
            abort() {
                tasks.delete(task);
            }
        };
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
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function stop_propagation(fn) {
        return function (event) {
            event.stopPropagation();
            // @ts-ignore
            return fn.call(this, event);
        };
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
    function toggle_class(element, name, toggle) {
        element.classList[toggle ? 'add' : 'remove'](name);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    const active_docs = new Set();
    let active = 0;
    // https://github.com/darkskyapp/string-hash/blob/master/index.js
    function hash(str) {
        let hash = 5381;
        let i = str.length;
        while (i--)
            hash = ((hash << 5) - hash) ^ str.charCodeAt(i);
        return hash >>> 0;
    }
    function create_rule(node, a, b, duration, delay, ease, fn, uid = 0) {
        const step = 16.666 / duration;
        let keyframes = '{\n';
        for (let p = 0; p <= 1; p += step) {
            const t = a + (b - a) * ease(p);
            keyframes += p * 100 + `%{${fn(t, 1 - t)}}\n`;
        }
        const rule = keyframes + `100% {${fn(b, 1 - b)}}\n}`;
        const name = `__svelte_${hash(rule)}_${uid}`;
        const doc = node.ownerDocument;
        active_docs.add(doc);
        const stylesheet = doc.__svelte_stylesheet || (doc.__svelte_stylesheet = doc.head.appendChild(element('style')).sheet);
        const current_rules = doc.__svelte_rules || (doc.__svelte_rules = {});
        if (!current_rules[name]) {
            current_rules[name] = true;
            stylesheet.insertRule(`@keyframes ${name} ${rule}`, stylesheet.cssRules.length);
        }
        const animation = node.style.animation || '';
        node.style.animation = `${animation ? `${animation}, ` : ''}${name} ${duration}ms linear ${delay}ms 1 both`;
        active += 1;
        return name;
    }
    function delete_rule(node, name) {
        const previous = (node.style.animation || '').split(', ');
        const next = previous.filter(name
            ? anim => anim.indexOf(name) < 0 // remove specific animation
            : anim => anim.indexOf('__svelte') === -1 // remove all Svelte animations
        );
        const deleted = previous.length - next.length;
        if (deleted) {
            node.style.animation = next.join(', ');
            active -= deleted;
            if (!active)
                clear_rules();
        }
    }
    function clear_rules() {
        raf(() => {
            if (active)
                return;
            active_docs.forEach(doc => {
                const stylesheet = doc.__svelte_stylesheet;
                let i = stylesheet.cssRules.length;
                while (i--)
                    stylesheet.deleteRule(i);
                doc.__svelte_rules = {};
            });
            active_docs.clear();
        });
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }
    function createEventDispatcher() {
        const component = get_current_component();
        return (type, detail) => {
            const callbacks = component.$$.callbacks[type];
            if (callbacks) {
                // TODO are there situations where events could be dispatched
                // in a server (non-DOM) environment?
                const event = custom_event(type, detail);
                callbacks.slice().forEach(fn => {
                    fn.call(component, event);
                });
            }
        };
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
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    function add_flush_callback(fn) {
        flush_callbacks.push(fn);
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
            set_current_component(null);
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

    let promise;
    function wait() {
        if (!promise) {
            promise = Promise.resolve();
            promise.then(() => {
                promise = null;
            });
        }
        return promise;
    }
    function dispatch(node, direction, kind) {
        node.dispatchEvent(custom_event(`${direction ? 'intro' : 'outro'}${kind}`));
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
    const null_transition = { duration: 0 };
    function create_in_transition(node, fn, params) {
        let config = fn(node, params);
        let running = false;
        let animation_name;
        let task;
        let uid = 0;
        function cleanup() {
            if (animation_name)
                delete_rule(node, animation_name);
        }
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 0, 1, duration, delay, easing, css, uid++);
            tick(0, 1);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            if (task)
                task.abort();
            running = true;
            add_render_callback(() => dispatch(node, true, 'start'));
            task = loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(1, 0);
                        dispatch(node, true, 'end');
                        cleanup();
                        return running = false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(t, 1 - t);
                    }
                }
                return running;
            });
        }
        let started = false;
        return {
            start() {
                if (started)
                    return;
                delete_rule(node);
                if (is_function(config)) {
                    config = config();
                    wait().then(go);
                }
                else {
                    go();
                }
            },
            invalidate() {
                started = false;
            },
            end() {
                if (running) {
                    cleanup();
                    running = false;
                }
            }
        };
    }
    function create_out_transition(node, fn, params) {
        let config = fn(node, params);
        let running = true;
        let animation_name;
        const group = outros;
        group.r += 1;
        function go() {
            const { delay = 0, duration = 300, easing = identity, tick = noop, css } = config || null_transition;
            if (css)
                animation_name = create_rule(node, 1, 0, duration, delay, easing, css);
            const start_time = now() + delay;
            const end_time = start_time + duration;
            add_render_callback(() => dispatch(node, false, 'start'));
            loop(now => {
                if (running) {
                    if (now >= end_time) {
                        tick(0, 1);
                        dispatch(node, false, 'end');
                        if (!--group.r) {
                            // this will result in `end()` being called,
                            // so we don't need to clean up here
                            run_all(group.c);
                        }
                        return false;
                    }
                    if (now >= start_time) {
                        const t = easing((now - start_time) / duration);
                        tick(1 - t, t);
                    }
                }
                return running;
            });
        }
        if (is_function(config)) {
            wait().then(() => {
                // @ts-ignore
                config = config();
                go();
            });
        }
        else {
            go();
        }
        return {
            end(reset) {
                if (reset && config.tick) {
                    config.tick(1, 0);
                }
                if (running) {
                    if (animation_name)
                        delete_rule(node, animation_name);
                    running = false;
                }
            }
        };
    }

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);
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
                throw new Error('Cannot have duplicate keys in a keyed each');
            }
            keys.add(key);
        }
    }

    function bind(component, name, callback) {
        const index = component.$$.props[name];
        if (index !== undefined) {
            component.$$.bound[index] = callback;
            callback(component.$$.ctx[index]);
        }
    }
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
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
        }
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
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
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
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
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
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.35.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src/components/main/Popup.svelte generated by Svelte v3.35.0 */

    const file$4 = "src/components/main/Popup.svelte";

    function create_fragment$4(ctx) {
    	let main;
    	let div;
    	let t0;
    	let t1;
    	let t2;

    	const block = {
    		c: function create() {
    			main = element("main");
    			div = element("div");
    			t0 = text("Hello ");
    			t1 = text(/*name*/ ctx[0]);
    			t2 = text("!");
    			attr_dev(div, "class", "container svelte-1c28gv7");
    			add_location(div, file$4, 5, 2, 47);
    			add_location(main, file$4, 4, 0, 38);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			append_dev(div, t2);
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*name*/ 1) set_data_dev(t1, /*name*/ ctx[0]);
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
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

    function instance$4($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Popup", slots, []);
    	let { name } = $$props;
    	const writable_props = ["name"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Popup> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	$$self.$capture_state = () => ({ name });

    	$$self.$inject_state = $$props => {
    		if ("name" in $$props) $$invalidate(0, name = $$props.name);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [name];
    }

    class Popup extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$4, create_fragment$4, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup",
    			options,
    			id: create_fragment$4.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*name*/ ctx[0] === undefined && !("name" in props)) {
    			console.warn("<Popup> was created without expected prop 'name'");
    		}
    	}

    	get name() {
    		throw new Error("<Popup>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set name(value) {
    		throw new Error("<Popup>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/components/FormSelect.svelte generated by Svelte v3.35.0 */
    const file$3 = "src/components/FormSelect.svelte";

    function get_each_context$1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (46:4) {#each options as item, index}
    function create_each_block$1(ctx) {
    	let div;
    	let t0_value = /*item*/ ctx[7].name + "";
    	let t0;
    	let t1;
    	let mounted;
    	let dispose;

    	const block = {
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "data-index", /*index*/ ctx[9]);
    			attr_dev(div, "class", "select-item font-size-14 padding-lr-8 svelte-1n6x4zx");
    			add_location(div, file$3, 46, 6, 1226);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);

    			if (!mounted) {
    				dispose = listen_dev(div, "click", /*handleSelect*/ ctx[3], false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*options*/ 2 && t0_value !== (t0_value = /*item*/ ctx[7].name + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block$1.name,
    		type: "each",
    		source: "(46:4) {#each options as item, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$3(ctx) {
    	let main;
    	let div1;
    	let div0;
    	let t0;
    	let t1;
    	let i;
    	let t2;
    	let div2;
    	let mounted;
    	let dispose;
    	let each_value = /*options*/ ctx[1];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block$1(get_each_context$1(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			main = element("main");
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(/*selectName*/ ctx[2]);
    			t1 = space();
    			i = element("i");
    			t2 = space();
    			div2 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div0, "class", "font-size-14");
    			add_location(div0, file$3, 41, 4, 927);
    			attr_dev(i, "class", "transition-300 iconfont icon-arrow-down svelte-1n6x4zx");
    			toggle_class(i, "arrow-up", /*showList*/ ctx[0]);
    			add_location(i, file$3, 42, 4, 976);
    			attr_dev(div1, "id", "select-box");
    			attr_dev(div1, "class", "color-main transition-300 bg-color-light-grey flex-between round-4 svelte-1n6x4zx");
    			add_location(div1, file$3, 40, 2, 787);
    			attr_dev(div2, "class", "select-container round-4 bg-color-light-grey padding-tb-8 transition-300 svelte-1n6x4zx");
    			toggle_class(div2, "select-spread", /*showList*/ ctx[0]);
    			add_location(div2, file$3, 44, 2, 1067);
    			attr_dev(main, "class", "svelte-1n6x4zx");
    			add_location(main, file$3, 39, 0, 778);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div1);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, i);
    			append_dev(main, t2);
    			append_dev(main, div2);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div2, null);
    			}

    			if (!mounted) {
    				dispose = listen_dev(div1, "click", stop_propagation(/*handleClick*/ ctx[4]), false, false, true);
    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*selectName*/ 4) set_data_dev(t0, /*selectName*/ ctx[2]);

    			if (dirty & /*showList*/ 1) {
    				toggle_class(i, "arrow-up", /*showList*/ ctx[0]);
    			}

    			if (dirty & /*handleSelect, options*/ 10) {
    				each_value = /*options*/ ctx[1];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context$1(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block$1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div2, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*showList*/ 1) {
    				toggle_class(div2, "select-spread", /*showList*/ ctx[0]);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_each(each_blocks, detaching);
    			mounted = false;
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
    	let selectName;
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("FormSelect", slots, []);
    	const dispatch = createEventDispatcher();
    	let { value = "en" } = $$props;

    	let { options = [
    		// 语言列表
    		{ name: "中文", value: "zh" },
    		{ name: "英语", value: "en" },
    		{ name: "日语", value: "ja" }
    	] } = $$props;

    	let { showList = false } = $$props; // 是否显示下拉框

    	// 选择语言点击事件
    	function handleSelect({ target }) {
    		$$invalidate(0, showList = false);
    		const { index } = target.dataset;
    		const item = options[Number(index)];
    		$$invalidate(5, value = item.value);
    		dispatch("handleChange", item);
    	}

    	// 下拉框点击事件
    	function handleClick() {
    		dispatch("handleClick");
    		$$invalidate(0, showList = !showList);
    	}

    	const writable_props = ["value", "options", "showList"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<FormSelect> was created with unknown prop '${key}'`);
    	});

    	$$self.$$set = $$props => {
    		if ("value" in $$props) $$invalidate(5, value = $$props.value);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("showList" in $$props) $$invalidate(0, showList = $$props.showList);
    	};

    	$$self.$capture_state = () => ({
    		createEventDispatcher,
    		onMount,
    		dispatch,
    		value,
    		options,
    		showList,
    		handleSelect,
    		handleClick,
    		selectName
    	});

    	$$self.$inject_state = $$props => {
    		if ("value" in $$props) $$invalidate(5, value = $$props.value);
    		if ("options" in $$props) $$invalidate(1, options = $$props.options);
    		if ("showList" in $$props) $$invalidate(0, showList = $$props.showList);
    		if ("selectName" in $$props) $$invalidate(2, selectName = $$props.selectName);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	$$self.$$.update = () => {
    		if ($$self.$$.dirty & /*options, value*/ 34) {
    			$$invalidate(2, selectName = options.find(item => item.value === value).name);
    		}
    	};

    	return [showList, options, selectName, handleSelect, handleClick, value];
    }

    class FormSelect extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { value: 5, options: 1, showList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormSelect",
    			options,
    			id: create_fragment$3.name
    		});
    	}

    	get value() {
    		throw new Error("<FormSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set value(value) {
    		throw new Error("<FormSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get options() {
    		throw new Error("<FormSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set options(value) {
    		throw new Error("<FormSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	get showList() {
    		throw new Error("<FormSelect>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set showList(value) {
    		throw new Error("<FormSelect>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    function backOut(t) {
        const s = 1.70158;
        return --t * t * ((s + 1) * t + s) + 1;
    }
    function cubicOut(t) {
        const f = t - 1.0;
        return f * f * f + 1.0;
    }

    function fade(node, { delay = 0, duration = 400, easing = identity } = {}) {
        const o = +getComputedStyle(node).opacity;
        return {
            delay,
            duration,
            easing,
            css: t => `opacity: ${t * o}`
        };
    }
    function fly(node, { delay = 0, duration = 400, easing = cubicOut, x = 0, y = 0, opacity = 0 } = {}) {
        const style = getComputedStyle(node);
        const target_opacity = +style.opacity;
        const transform = style.transform === 'none' ? '' : style.transform;
        const od = target_opacity * (1 - opacity);
        return {
            delay,
            duration,
            easing,
            css: (t, u) => `
			transform: ${transform} translate(${(1 - t) * x}px, ${(1 - t) * y}px);
			opacity: ${target_opacity - (od * u)}`
        };
    }

    /* src/components/Basics/Toast.svelte generated by Svelte v3.35.0 */
    const file$2 = "src/components/Basics/Toast.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    // (35:2) {#each toasts as toast (toast._id)}
    function create_each_block(key_1, ctx) {
    	let div;
    	let t0_value = /*toast*/ ctx[5].msg + "";
    	let t0;
    	let t1;
    	let div_intro;
    	let div_outro;
    	let current;

    	const block = {
    		key: key_1,
    		first: null,
    		c: function create() {
    			div = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			attr_dev(div, "class", "toast-item svelte-ec56ci");
    			add_location(div, file$2, 35, 4, 721);
    			this.first = div;
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);
    			append_dev(div, t0);
    			append_dev(div, t1);
    			current = true;
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if ((!current || dirty & /*toasts*/ 1) && t0_value !== (t0_value = /*toast*/ ctx[5].msg + "")) set_data_dev(t0, t0_value);
    		},
    		i: function intro(local) {
    			if (current) return;

    			add_render_callback(() => {
    				if (div_outro) div_outro.end(1);

    				if (!div_intro) div_intro = create_in_transition(div, fly, {
    					delay: 0,
    					duration: 300,
    					x: 0,
    					y: 50,
    					opacity: 0.1,
    					easing: backOut
    				});

    				div_intro.start();
    			});

    			current = true;
    		},
    		o: function outro(local) {
    			if (div_intro) div_intro.invalidate();
    			div_outro = create_out_transition(div, fade, { duration: 300, opacity: 0 });
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div);
    			if (detaching && div_outro) div_outro.end();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(35:2) {#each toasts as toast (toast._id)}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
    	let div;
    	let each_blocks = [];
    	let each_1_lookup = new Map();
    	let current;
    	let each_value = /*toasts*/ ctx[0];
    	validate_each_argument(each_value);
    	const get_key = ctx => /*toast*/ ctx[5]._id;
    	validate_each_keys(ctx, each_value, get_each_context, get_key);

    	for (let i = 0; i < each_value.length; i += 1) {
    		let child_ctx = get_each_context(ctx, each_value, i);
    		let key = get_key(child_ctx);
    		each_1_lookup.set(key, each_blocks[i] = create_each_block(key, child_ctx));
    	}

    	const block = {
    		c: function create() {
    			div = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			attr_dev(div, "class", "toast-wrapper svelte-ec56ci");
    			add_location(div, file$2, 33, 0, 651);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(div, null);
    			}

    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*toasts*/ 1) {
    				each_value = /*toasts*/ ctx[0];
    				validate_each_argument(each_value);
    				group_outros();
    				validate_each_keys(ctx, each_value, get_each_context, get_key);
    				each_blocks = update_keyed_each(each_blocks, dirty, get_key, 1, ctx, each_value, each_1_lookup, div, outro_and_destroy_block, create_each_block, null, get_each_context);
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

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].d();
    			}
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
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("Toast", slots, []);
    	let toasts = []; // 알람이 연속적으로 발생할 수 있으니 배열로 생성
    	let retainMs = 2000; // 생성되고 사라질 시간

    	// 알람을 추가한다, 변수로 단순하게 메시지 한 줄 받음
    	let toastId = 0;

    	const pushToast = (msg = "") => {
    		$$invalidate(0, toasts = [...toasts, { _id: ++toastId, msg }]); // 새로운 할당

    		setTimeout(
    			() => {
    				unshiftToast();
    			},
    			retainMs
    		);
    	};

    	// 오래된 알람 하나 삭제
    	const unshiftToast = () => {
    		$$invalidate(0, toasts = toasts.filter((a, i) => i > 0)); // 새로운 할당
    	};

    	onMount(() => {
    		window.showToast = pushToast;
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<Toast> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({
    		onMount,
    		fade,
    		fly,
    		backOut,
    		toasts,
    		retainMs,
    		toastId,
    		pushToast,
    		unshiftToast
    	});

    	$$self.$inject_state = $$props => {
    		if ("toasts" in $$props) $$invalidate(0, toasts = $$props.toasts);
    		if ("retainMs" in $$props) retainMs = $$props.retainMs;
    		if ("toastId" in $$props) toastId = $$props.toastId;
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [toasts];
    }

    class Toast extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Toast",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

    function getDefaultExportFromCjs (x) {
    	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
    }

    function createCommonjsModule(fn) {
      var module = { exports: {} };
    	return fn(module, module.exports), module.exports;
    }

    /*!
     * clipboard.js v2.0.8
     * https://clipboardjs.com/
     *
     * Licensed MIT © Zeno Rocha
     */

    var clipboard = createCommonjsModule(function (module, exports) {
    !function(t,e){module.exports=e();}(commonjsGlobal,function(){return n={134:function(t,e,n){n.d(e,{default:function(){return r}});var e=n(279),i=n.n(e),e=n(370),a=n.n(e),e=n(817),o=n.n(e);function c(t){return (c="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function u(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}var l=function(){function e(t){!function(t){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this),this.resolveOptions(t),this.initSelection();}var t,n;return t=e,(n=[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action=t.action,this.container=t.container,this.emitter=t.emitter,this.target=t.target,this.text=t.text,this.trigger=t.trigger,this.selectedText="";}},{key:"initSelection",value:function(){this.text?this.selectFake():this.target&&this.selectTarget();}},{key:"createFakeElement",value:function(){var t="rtl"===document.documentElement.getAttribute("dir");this.fakeElem=document.createElement("textarea"),this.fakeElem.style.fontSize="12pt",this.fakeElem.style.border="0",this.fakeElem.style.padding="0",this.fakeElem.style.margin="0",this.fakeElem.style.position="absolute",this.fakeElem.style[t?"right":"left"]="-9999px";t=window.pageYOffset||document.documentElement.scrollTop;return this.fakeElem.style.top="".concat(t,"px"),this.fakeElem.setAttribute("readonly",""),this.fakeElem.value=this.text,this.fakeElem}},{key:"selectFake",value:function(){var t=this,e=this.createFakeElement();this.fakeHandlerCallback=function(){return t.removeFake()},this.fakeHandler=this.container.addEventListener("click",this.fakeHandlerCallback)||!0,this.container.appendChild(e),this.selectedText=o()(e),this.copyText(),this.removeFake();}},{key:"removeFake",value:function(){this.fakeHandler&&(this.container.removeEventListener("click",this.fakeHandlerCallback),this.fakeHandler=null,this.fakeHandlerCallback=null),this.fakeElem&&(this.container.removeChild(this.fakeElem),this.fakeElem=null);}},{key:"selectTarget",value:function(){this.selectedText=o()(this.target),this.copyText();}},{key:"copyText",value:function(){var e;try{e=document.execCommand(this.action);}catch(t){e=!1;}this.handleResult(e);}},{key:"handleResult",value:function(t){this.emitter.emit(t?"success":"error",{action:this.action,text:this.selectedText,trigger:this.trigger,clearSelection:this.clearSelection.bind(this)});}},{key:"clearSelection",value:function(){this.trigger&&this.trigger.focus(),document.activeElement.blur(),window.getSelection().removeAllRanges();}},{key:"destroy",value:function(){this.removeFake();}},{key:"action",set:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:"copy";if(this._action=t,"copy"!==this._action&&"cut"!==this._action)throw new Error('Invalid "action" value, use either "copy" or "cut"')},get:function(){return this._action}},{key:"target",set:function(t){if(void 0!==t){if(!t||"object"!==c(t)||1!==t.nodeType)throw new Error('Invalid "target" value, use a valid Element');if("copy"===this.action&&t.hasAttribute("disabled"))throw new Error('Invalid "target" attribute. Please use "readonly" instead of "disabled" attribute');if("cut"===this.action&&(t.hasAttribute("readonly")||t.hasAttribute("disabled")))throw new Error('Invalid "target" attribute. You can\'t cut text from elements with "readonly" or "disabled" attributes');this._target=t;}},get:function(){return this._target}}])&&u(t.prototype,n),e}();function s(t){return (s="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t})(t)}function f(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r);}}function h(t,e){return (h=Object.setPrototypeOf||function(t,e){return t.__proto__=e,t})(t,e)}function d(n){var r=function(){if("undefined"==typeof Reflect||!Reflect.construct)return !1;if(Reflect.construct.sham)return !1;if("function"==typeof Proxy)return !0;try{return Date.prototype.toString.call(Reflect.construct(Date,[],function(){})),!0}catch(t){return !1}}();return function(){var t,e=p(n);return t=r?(t=p(this).constructor,Reflect.construct(e,arguments,t)):e.apply(this,arguments),e=this,!(t=t)||"object"!==s(t)&&"function"!=typeof t?function(t){if(void 0!==t)return t;throw new ReferenceError("this hasn't been initialised - super() hasn't been called")}(e):t}}function p(t){return (p=Object.setPrototypeOf?Object.getPrototypeOf:function(t){return t.__proto__||Object.getPrototypeOf(t)})(t)}function y(t,e){t="data-clipboard-".concat(t);if(e.hasAttribute(t))return e.getAttribute(t)}var r=function(){!function(t,e){if("function"!=typeof e&&null!==e)throw new TypeError("Super expression must either be null or a function");t.prototype=Object.create(e&&e.prototype,{constructor:{value:t,writable:!0,configurable:!0}}),e&&h(t,e);}(o,i());var t,e,n,r=d(o);function o(t,e){var n;return function(t){if(!(t instanceof o))throw new TypeError("Cannot call a class as a function")}(this),(n=r.call(this)).resolveOptions(e),n.listenClick(t),n}return t=o,n=[{key:"isSupported",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:["copy","cut"],t="string"==typeof t?[t]:t,e=!!document.queryCommandSupported;return t.forEach(function(t){e=e&&!!document.queryCommandSupported(t);}),e}}],(e=[{key:"resolveOptions",value:function(){var t=0<arguments.length&&void 0!==arguments[0]?arguments[0]:{};this.action="function"==typeof t.action?t.action:this.defaultAction,this.target="function"==typeof t.target?t.target:this.defaultTarget,this.text="function"==typeof t.text?t.text:this.defaultText,this.container="object"===s(t.container)?t.container:document.body;}},{key:"listenClick",value:function(t){var e=this;this.listener=a()(t,"click",function(t){return e.onClick(t)});}},{key:"onClick",value:function(t){t=t.delegateTarget||t.currentTarget;this.clipboardAction&&(this.clipboardAction=null),this.clipboardAction=new l({action:this.action(t),target:this.target(t),text:this.text(t),container:this.container,trigger:t,emitter:this});}},{key:"defaultAction",value:function(t){return y("action",t)}},{key:"defaultTarget",value:function(t){t=y("target",t);if(t)return document.querySelector(t)}},{key:"defaultText",value:function(t){return y("text",t)}},{key:"destroy",value:function(){this.listener.destroy(),this.clipboardAction&&(this.clipboardAction.destroy(),this.clipboardAction=null);}}])&&f(t.prototype,e),n&&f(t,n),o}();},828:function(t){var e;"undefined"==typeof Element||Element.prototype.matches||((e=Element.prototype).matches=e.matchesSelector||e.mozMatchesSelector||e.msMatchesSelector||e.oMatchesSelector||e.webkitMatchesSelector),t.exports=function(t,e){for(;t&&9!==t.nodeType;){if("function"==typeof t.matches&&t.matches(e))return t;t=t.parentNode;}};},438:function(t,e,n){var a=n(828);function i(t,e,n,r,o){var i=function(e,n,t,r){return function(t){t.delegateTarget=a(t.target,n),t.delegateTarget&&r.call(e,t);}}.apply(this,arguments);return t.addEventListener(n,i,o),{destroy:function(){t.removeEventListener(n,i,o);}}}t.exports=function(t,e,n,r,o){return "function"==typeof t.addEventListener?i.apply(null,arguments):"function"==typeof n?i.bind(null,document).apply(null,arguments):("string"==typeof t&&(t=document.querySelectorAll(t)),Array.prototype.map.call(t,function(t){return i(t,e,n,r,o)}))};},879:function(t,n){n.node=function(t){return void 0!==t&&t instanceof HTMLElement&&1===t.nodeType},n.nodeList=function(t){var e=Object.prototype.toString.call(t);return void 0!==t&&("[object NodeList]"===e||"[object HTMLCollection]"===e)&&"length"in t&&(0===t.length||n.node(t[0]))},n.string=function(t){return "string"==typeof t||t instanceof String},n.fn=function(t){return "[object Function]"===Object.prototype.toString.call(t)};},370:function(t,e,n){var l=n(879),s=n(438);t.exports=function(t,e,n){if(!t&&!e&&!n)throw new Error("Missing required arguments");if(!l.string(e))throw new TypeError("Second argument must be a String");if(!l.fn(n))throw new TypeError("Third argument must be a Function");if(l.node(t))return c=e,u=n,(a=t).addEventListener(c,u),{destroy:function(){a.removeEventListener(c,u);}};if(l.nodeList(t))return r=t,o=e,i=n,Array.prototype.forEach.call(r,function(t){t.addEventListener(o,i);}),{destroy:function(){Array.prototype.forEach.call(r,function(t){t.removeEventListener(o,i);});}};if(l.string(t))return t=t,e=e,n=n,s(document.body,t,e,n);throw new TypeError("First argument must be a String, HTMLElement, HTMLCollection, or NodeList");var r,o,i,a,c,u;};},817:function(t){t.exports=function(t){var e,n="SELECT"===t.nodeName?(t.focus(),t.value):"INPUT"===t.nodeName||"TEXTAREA"===t.nodeName?((e=t.hasAttribute("readonly"))||t.setAttribute("readonly",""),t.select(),t.setSelectionRange(0,t.value.length),e||t.removeAttribute("readonly"),t.value):(t.hasAttribute("contenteditable")&&t.focus(),n=window.getSelection(),(e=document.createRange()).selectNodeContents(t),n.removeAllRanges(),n.addRange(e),n.toString());return n};},279:function(t){function e(){}e.prototype={on:function(t,e,n){var r=this.e||(this.e={});return (r[t]||(r[t]=[])).push({fn:e,ctx:n}),this},once:function(t,e,n){var r=this;function o(){r.off(t,o),e.apply(n,arguments);}return o._=e,this.on(t,o,n)},emit:function(t){for(var e=[].slice.call(arguments,1),n=((this.e||(this.e={}))[t]||[]).slice(),r=0,o=n.length;r<o;r++)n[r].fn.apply(n[r].ctx,e);return this},off:function(t,e){var n=this.e||(this.e={}),r=n[t],o=[];if(r&&e)for(var i=0,a=r.length;i<a;i++)r[i].fn!==e&&r[i].fn._!==e&&o.push(r[i]);return o.length?n[t]=o:delete n[t],this}},t.exports=e,t.exports.TinyEmitter=e;}},o={},r.n=function(t){var e=t&&t.__esModule?function(){return t.default}:function(){return t};return r.d(e,{a:e}),e},r.d=function(t,e){for(var n in e)r.o(e,n)&&!r.o(t,n)&&Object.defineProperty(t,n,{enumerable:!0,get:e[n]});},r.o=function(t,e){return Object.prototype.hasOwnProperty.call(t,e)},r(134).default;function r(t){if(o[t])return o[t].exports;var e=o[t]={exports:{}};return n[t](e,e.exports,r),e.exports}var n,o;});
    });

    var ClipboardJS = /*@__PURE__*/getDefaultExportFromCjs(clipboard);

    // by zhangxinxu welcome to visit my personal website http://www.zhangxinxu.com/
    // zxx.drag v1.0 2010-03-23 元素的拖拽实现

    var params = {
      left: 0,
      top: 0,
      currentX: 0,
      currentY: 0,
      flag: false
    };
    //获取相关CSS属性
    var getCss = function (o, key) {
      return o.currentStyle ? o.currentStyle[key] : document.defaultView.getComputedStyle(o, false)[key]
    };

    //拖拽的实现
    var startDrag = function (bar, target, callback) {
      if (getCss(target, 'left') !== 'auto') {
        params.left = getCss(target, 'left');
      }
      if (getCss(target, 'top') !== 'auto') {
        params.top = getCss(target, 'top');
      }
      //o是移动对象
      bar.onmousedown = function (event) {
        params.flag = true;
        if (!event) {
          event = window.event;
          //防止IE文字选中
          bar.onselectstart = function () {
            return false
          };
        }
        var e = event;
        params.currentX = e.clientX;
        params.currentY = e.clientY;
      };
      document.onmouseup = function () {
        params.flag = false;
        if (getCss(target, 'left') !== 'auto') {
          params.left = getCss(target, 'left');
        }
        if (getCss(target, 'top') !== 'auto') {
          params.top = getCss(target, 'top');
        }
      };
      document.onmousemove = function (event) {
        var e = event ? event : window.event;
        if (params.flag) {
          var nowX = e.clientX,
            nowY = e.clientY;
          var disX = nowX - params.currentX,
            disY = nowY - params.currentY;
          target.style.left = parseInt(params.left) + disX + 'px';
          target.style.top = parseInt(params.top) + disY + 'px';

          if (typeof callback == 'function') {
            callback((parseInt(params.left) || 0) + disX, (parseInt(params.top) || 0) + disY);
          }

          if (event.preventDefault) {
            event.preventDefault();
          }
          return false
        }
      };
    };

    /* src/components/main/TranslatePop.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/main/TranslatePop.svelte";

    // (148:2) {#if isShow}
    function create_if_block(ctx) {
    	let div12;
    	let div3;
    	let div0;
    	let i0;
    	let t0;
    	let span0;
    	let t2;
    	let i1;
    	let t3;
    	let div1;
    	let t4;
    	let div2;
    	let span1;
    	let t5;
    	let span2;
    	let t6;
    	let div4;
    	let formselect0;
    	let updating_value;
    	let updating_showList;
    	let t7;
    	let i2;
    	let t8;
    	let formselect1;
    	let updating_value_1;
    	let updating_showList_1;
    	let t9;
    	let div6;
    	let span3;
    	let t11;
    	let div5;
    	let t13;
    	let div11;
    	let span4;
    	let t15;
    	let div7;
    	let t17;
    	let div10;
    	let div8;
    	let img;
    	let img_src_value;
    	let t18;
    	let span5;
    	let t20;
    	let div9;
    	let span6;
    	let t21;
    	let span7;
    	let current;
    	let mounted;
    	let dispose;

    	function formselect0_value_binding(value) {
    		/*formselect0_value_binding*/ ctx[20](value);
    	}

    	function formselect0_showList_binding(value) {
    		/*formselect0_showList_binding*/ ctx[22](value);
    	}

    	let formselect0_props = { options: /*langList*/ ctx[8] };

    	if (/*sourceLang*/ ctx[0] !== void 0) {
    		formselect0_props.value = /*sourceLang*/ ctx[0];
    	}

    	if (/*leftShowList*/ ctx[4] !== void 0) {
    		formselect0_props.showList = /*leftShowList*/ ctx[4];
    	}

    	formselect0 = new FormSelect({ props: formselect0_props, $$inline: true });
    	binding_callbacks.push(() => bind(formselect0, "value", formselect0_value_binding));
    	/*formselect0_binding*/ ctx[21](formselect0);
    	binding_callbacks.push(() => bind(formselect0, "showList", formselect0_showList_binding));
    	formselect0.$on("handleClick", /*handleLeftClick*/ ctx[16]);
    	formselect0.$on("handleChange", /*handleSelectChange*/ ctx[18]);

    	function formselect1_value_binding(value) {
    		/*formselect1_value_binding*/ ctx[23](value);
    	}

    	function formselect1_showList_binding(value) {
    		/*formselect1_showList_binding*/ ctx[25](value);
    	}

    	let formselect1_props = { options: /*langList*/ ctx[8] };

    	if (/*targetLang*/ ctx[1] !== void 0) {
    		formselect1_props.value = /*targetLang*/ ctx[1];
    	}

    	if (/*rightShowList*/ ctx[5] !== void 0) {
    		formselect1_props.showList = /*rightShowList*/ ctx[5];
    	}

    	formselect1 = new FormSelect({ props: formselect1_props, $$inline: true });
    	binding_callbacks.push(() => bind(formselect1, "value", formselect1_value_binding));
    	/*formselect1_binding*/ ctx[24](formselect1);
    	binding_callbacks.push(() => bind(formselect1, "showList", formselect1_showList_binding));
    	formselect1.$on("handleClick", /*handleRightClick*/ ctx[17]);
    	formselect1.$on("handleChange", /*handleSelectChange*/ ctx[18]);

    	const block = {
    		c: function create() {
    			div12 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			i0 = element("i");
    			t0 = space();
    			span0 = element("span");
    			span0.textContent = "设置";
    			t2 = space();
    			i1 = element("i");
    			t3 = space();
    			div1 = element("div");
    			t4 = space();
    			div2 = element("div");
    			span1 = element("span");
    			t5 = space();
    			span2 = element("span");
    			t6 = space();
    			div4 = element("div");
    			create_component(formselect0.$$.fragment);
    			t7 = space();
    			i2 = element("i");
    			t8 = space();
    			create_component(formselect1.$$.fragment);
    			t9 = space();
    			div6 = element("div");
    			span3 = element("span");
    			span3.textContent = "原文";
    			t11 = space();
    			div5 = element("div");
    			div5.textContent = `${/*sourceText*/ ctx[11]}`;
    			t13 = space();
    			div11 = element("div");
    			span4 = element("span");
    			span4.textContent = "译文";
    			t15 = space();
    			div7 = element("div");
    			div7.textContent = `${/*targetText*/ ctx[12]}`;
    			t17 = space();
    			div10 = element("div");
    			div8 = element("div");
    			img = element("img");
    			t18 = space();
    			span5 = element("span");
    			span5.textContent = `${/*serviceDict*/ ctx[9][/*transService*/ ctx[10]].name}`;
    			t20 = space();
    			div9 = element("div");
    			span6 = element("span");
    			t21 = space();
    			span7 = element("span");
    			attr_dev(i0, "class", "iconfont icon-setting font-size-16");
    			add_location(i0, file$1, 151, 10, 3676);
    			attr_dev(span0, "class", "trans-bar-left-name svelte-gznr2n");
    			add_location(span0, file$1, 152, 10, 3735);
    			attr_dev(i1, "class", "iconfont icon-arrow-right");
    			add_location(i1, file$1, 153, 10, 3789);
    			attr_dev(div0, "class", "trans-bar-left flex-between hover-color-orange svelte-gznr2n");
    			add_location(div0, file$1, 150, 8, 3605);
    			attr_dev(div1, "id", "trans-bar-middle");
    			attr_dev(div1, "class", "svelte-gznr2n");
    			add_location(div1, file$1, 155, 8, 3852);
    			attr_dev(span1, "class", "iconfont icon-push-pin padding-lr-8 hover-color-orange svelte-gznr2n");
    			toggle_class(span1, "icon-push-is-pin", /*isPin*/ ctx[6]);
    			add_location(span1, file$1, 157, 10, 3935);
    			attr_dev(span2, "class", "iconfont icon-close hover-color-orange svelte-gznr2n");
    			add_location(span2, file$1, 158, 10, 4074);
    			attr_dev(div2, "class", "trans-bar-right flex");
    			add_location(div2, file$1, 156, 8, 3890);
    			attr_dev(div3, "class", "trans-bar font-size-12 color-main flex-between padding-lr-16 svelte-gznr2n");
    			add_location(div3, file$1, 149, 6, 3522);
    			attr_dev(i2, "class", "trans-lang-middle iconfont icon-arrow-compare flex-center hover-color-orange");
    			add_location(i2, file$1, 170, 8, 4503);
    			attr_dev(div4, "class", "trans-lang flex-between padding-lr-16 svelte-gznr2n");
    			add_location(div4, file$1, 161, 6, 4187);
    			attr_dev(span3, "class", "color-99 font-size-10 leading-8");
    			add_location(span3, file$1, 181, 8, 4921);
    			attr_dev(div5, "class", "font-size-14 color-33");
    			add_location(div5, file$1, 182, 8, 4985);
    			attr_dev(div6, "class", "padding-lr-16 padding-tb-8");
    			add_location(div6, file$1, 180, 6, 4872);
    			attr_dev(span4, "class", "color-99 font-size-10 leading-8");
    			add_location(span4, file$1, 185, 8, 5107);
    			attr_dev(div7, "class", "font-size-14");
    			add_location(div7, file$1, 186, 8, 5171);
    			if (img.src !== (img_src_value = /*serviceDict*/ ctx[9][/*transService*/ ctx[10]].src)) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "width", "16");
    			attr_dev(img, "height", "16");
    			attr_dev(img, "alt", /*transService*/ ctx[10]);
    			add_location(img, file$1, 189, 12, 5367);
    			add_location(span5, file$1, 190, 12, 5465);
    			attr_dev(div8, "class", "font-size-12 color-66 transition-300 flex");
    			add_location(div8, file$1, 188, 10, 5274);
    			attr_dev(span6, "class", "iconfont icon-copy padding-lr-8 hover-color-orange");
    			add_location(span6, file$1, 193, 12, 5556);
    			attr_dev(span7, "class", "iconfont icon-open-web hover-color-orange");
    			add_location(span7, file$1, 194, 12, 5658);
    			add_location(div9, file$1, 192, 10, 5538);
    			attr_dev(div10, "class", "trans-footer flex-between svelte-gznr2n");
    			add_location(div10, file$1, 187, 8, 5224);
    			attr_dev(div11, "class", "trans-target padding-lr-16 svelte-gznr2n");
    			add_location(div11, file$1, 184, 6, 5058);
    			attr_dev(div12, "id", "trans-box");
    			attr_dev(div12, "class", "select-trans-pop color-main svelte-gznr2n");
    			attr_dev(div12, "style", /*boxStyle*/ ctx[13]);
    			attr_dev(div12, "draggable", "true");
    			toggle_class(div12, "select-trans-pop-pin", /*isPin*/ ctx[6]);
    			add_location(div12, file$1, 148, 4, 3364);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div12, anchor);
    			append_dev(div12, div3);
    			append_dev(div3, div0);
    			append_dev(div0, i0);
    			append_dev(div0, t0);
    			append_dev(div0, span0);
    			append_dev(div0, t2);
    			append_dev(div0, i1);
    			append_dev(div3, t3);
    			append_dev(div3, div1);
    			append_dev(div3, t4);
    			append_dev(div3, div2);
    			append_dev(div2, span1);
    			append_dev(div2, t5);
    			append_dev(div2, span2);
    			append_dev(div12, t6);
    			append_dev(div12, div4);
    			mount_component(formselect0, div4, null);
    			append_dev(div4, t7);
    			append_dev(div4, i2);
    			append_dev(div4, t8);
    			mount_component(formselect1, div4, null);
    			append_dev(div12, t9);
    			append_dev(div12, div6);
    			append_dev(div6, span3);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div12, t13);
    			append_dev(div12, div11);
    			append_dev(div11, span4);
    			append_dev(div11, t15);
    			append_dev(div11, div7);
    			append_dev(div11, t17);
    			append_dev(div11, div10);
    			append_dev(div10, div8);
    			append_dev(div8, img);
    			append_dev(div8, t18);
    			append_dev(div8, span5);
    			append_dev(div10, t20);
    			append_dev(div10, div9);
    			append_dev(div9, span6);
    			append_dev(div9, t21);
    			append_dev(div9, span7);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span1, "click", /*handlePinClick*/ ctx[14], false, false, false),
    					listen_dev(span2, "click", /*handleClose*/ ctx[15], false, false, false),
    					listen_dev(div8, "click", handleOpenWeb, false, false, false),
    					listen_dev(span6, "click", handleCopy, false, false, false),
    					listen_dev(span7, "click", handleOpenWeb, false, false, false),
    					listen_dev(div12, "click", /*handleBoxClick*/ ctx[19], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*isPin*/ 64) {
    				toggle_class(span1, "icon-push-is-pin", /*isPin*/ ctx[6]);
    			}

    			const formselect0_changes = {};

    			if (!updating_value && dirty & /*sourceLang*/ 1) {
    				updating_value = true;
    				formselect0_changes.value = /*sourceLang*/ ctx[0];
    				add_flush_callback(() => updating_value = false);
    			}

    			if (!updating_showList && dirty & /*leftShowList*/ 16) {
    				updating_showList = true;
    				formselect0_changes.showList = /*leftShowList*/ ctx[4];
    				add_flush_callback(() => updating_showList = false);
    			}

    			formselect0.$set(formselect0_changes);
    			const formselect1_changes = {};

    			if (!updating_value_1 && dirty & /*targetLang*/ 2) {
    				updating_value_1 = true;
    				formselect1_changes.value = /*targetLang*/ ctx[1];
    				add_flush_callback(() => updating_value_1 = false);
    			}

    			if (!updating_showList_1 && dirty & /*rightShowList*/ 32) {
    				updating_showList_1 = true;
    				formselect1_changes.showList = /*rightShowList*/ ctx[5];
    				add_flush_callback(() => updating_showList_1 = false);
    			}

    			formselect1.$set(formselect1_changes);

    			if (dirty & /*isPin*/ 64) {
    				toggle_class(div12, "select-trans-pop-pin", /*isPin*/ ctx[6]);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(formselect0.$$.fragment, local);
    			transition_in(formselect1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(formselect0.$$.fragment, local);
    			transition_out(formselect1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div12);
    			/*formselect0_binding*/ ctx[21](null);
    			destroy_component(formselect0);
    			/*formselect1_binding*/ ctx[24](null);
    			destroy_component(formselect1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(148:2) {#if isShow}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let main;
    	let toast;
    	let t;
    	let current;
    	toast = new Toast({ $$inline: true });
    	let if_block = /*isShow*/ ctx[7] && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(toast.$$.fragment);
    			t = space();
    			if (if_block) if_block.c();
    			add_location(main, file$1, 145, 0, 3326);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(toast, main, null);
    			append_dev(main, t);
    			if (if_block) if_block.m(main, null);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			if (/*isShow*/ ctx[7]) {
    				if (if_block) {
    					if_block.p(ctx, dirty);

    					if (dirty & /*isShow*/ 128) {
    						transition_in(if_block, 1);
    					}
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					transition_in(if_block, 1);
    					if_block.m(main, null);
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
    			transition_in(toast.$$.fragment, local);
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(toast.$$.fragment, local);
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(toast);
    			if (if_block) if_block.d();
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

    function handleCopy() {
    	
    }

    // 跳转网页点击
    function handleOpenWeb() {
    	window.open("http://fanyi.youdao.com/", "_blank");
    }

    function dragStart(e) {
    	console.log(e, "dragStart");
    }

    function dragEnd({ target }) {
    	console.log({ ...target }, "dragEnd");
    	const { offsetTop, offsetLeft } = target;
    	console.log(offsetTop, offsetLeft);
    } //     offsetHeight: 200
    // offsetLeft: 0

    // offsetParent: main.svelte-1tecc95
    // offsetTop: 18
    // offsetWidth: 320
    function dragExit(e) {
    	console.log("dragExit", e);
    }

    function mouseDown(e) {
    	console.log("mouseDown", e);
    }

    function mouseUp(e) {
    	console.log("onmouseUp", e);
    }

    function mouseMove(e) {
    	
    } // console.log('mouseMove', e)

    function mouseOver(e) {
    	console.log("mouseOver", e);
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TranslatePop", slots, []);
    	const clipboard = new ClipboardJS(".icon-copy", { text: () => targetText });

    	clipboard.on("success", e => {
    		window.showToast("已复制译文");
    	});

    	const langList = [
    		{ name: "中文", value: "zh" },
    		{ name: "英语", value: "en" },
    		{ name: "日语", value: "ja" }
    	];

    	let sourceLang = "en";
    	let targetLang = "zh";
    	let leftSelect;
    	let rightSelect;
    	let leftShowList = false;
    	let rightShowList = false;

    	const serviceDict = {
    		google: {
    			name: "谷歌翻译",
    			src: "./images/logo/google-logo.png",
    			url: "https://translate.google.cn/"
    		}, // https://translate.google.cn/?sl=en&tl=zh-CN&text=hello&op=translate
    		youdao: {
    			name: "有道翻译",
    			src: "./images/logo/youdao-logo.png",
    			url: "http://fanyi.youdao.com/"
    		},
    		baidu: {
    			name: "百度翻译",
    			src: "./images/logo/baidu-logo.png",
    			url: "https://fanyi.baidu.com/"
    		}, // https://fanyi.baidu.com/#en/zh/hello
    		caiyun: {
    			name: "彩云小译",
    			src: "./images/logo/caiyun-logo.png",
    			url: "https://fanyi.caiyunapp.com/#/"
    		},
    		deepl: {
    			name: "DeepL 翻译",
    			src: "./images/logo/deepl-logo.png",
    			url: "https://www.deepl.com/translator"
    		}, // https://www.deepl.com/translator#en/zh/hello
    		
    	};

    	let transService = "google"; // 使用的翻译服务
    	let sourceText = "要翻译的原文";
    	let targetText = "翻译好赛盖饭的";
    	let isPin = false;
    	let isShow = true;
    	let boxStyle = "top:0px;left:0px";

    	// 图钉icon点击事件
    	function handlePinClick() {
    		$$invalidate(6, isPin = !isPin);
    	}

    	// 关闭icon点击事件
    	function handleClose() {
    		$$invalidate(7, isShow = false);
    	} // setTimeout(() => {
    	//   isShow = true

    	// 左边选择器点击
    	function handleLeftClick(e) {
    		$$invalidate(5, rightShowList = false);
    	}

    	// 右边选择器点击
    	function handleRightClick(e) {
    		$$invalidate(4, leftShowList = false);
    	}

    	// 翻译语言切换
    	function handleSelectChange() {
    		console.log({ sourceLang, targetLang });
    	}

    	// 组件点击事件
    	function handleBoxClick() {
    		$$invalidate(4, leftShowList = false);
    		$$invalidate(5, rightShowList = false);
    	}

    	// 拖拽方法处理
    	onMount(() => {
    		const targetDom = document.getElementById("trans-box");
    		const dragDom = document.getElementById("trans-bar-middle");

    		startDrag(dragDom, targetDom, (x, y) => {
    			console.log(x, y, "00");
    		});
    	});

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<TranslatePop> was created with unknown prop '${key}'`);
    	});

    	function formselect0_value_binding(value) {
    		sourceLang = value;
    		$$invalidate(0, sourceLang);
    	}

    	function formselect0_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			leftSelect = $$value;
    			$$invalidate(2, leftSelect);
    		});
    	}

    	function formselect0_showList_binding(value) {
    		leftShowList = value;
    		$$invalidate(4, leftShowList);
    	}

    	function formselect1_value_binding(value) {
    		targetLang = value;
    		$$invalidate(1, targetLang);
    	}

    	function formselect1_binding($$value) {
    		binding_callbacks[$$value ? "unshift" : "push"](() => {
    			rightSelect = $$value;
    			$$invalidate(3, rightSelect);
    		});
    	}

    	function formselect1_showList_binding(value) {
    		rightShowList = value;
    		$$invalidate(5, rightShowList);
    	}

    	$$self.$capture_state = () => ({
    		onMount,
    		FormSelect,
    		Toast,
    		ClipboardJS,
    		startDrag,
    		clipboard,
    		langList,
    		sourceLang,
    		targetLang,
    		leftSelect,
    		rightSelect,
    		leftShowList,
    		rightShowList,
    		serviceDict,
    		transService,
    		sourceText,
    		targetText,
    		isPin,
    		isShow,
    		boxStyle,
    		handlePinClick,
    		handleClose,
    		handleCopy,
    		handleOpenWeb,
    		handleLeftClick,
    		handleRightClick,
    		handleSelectChange,
    		handleBoxClick,
    		dragStart,
    		dragEnd,
    		dragExit,
    		mouseDown,
    		mouseUp,
    		mouseMove,
    		mouseOver
    	});

    	$$self.$inject_state = $$props => {
    		if ("sourceLang" in $$props) $$invalidate(0, sourceLang = $$props.sourceLang);
    		if ("targetLang" in $$props) $$invalidate(1, targetLang = $$props.targetLang);
    		if ("leftSelect" in $$props) $$invalidate(2, leftSelect = $$props.leftSelect);
    		if ("rightSelect" in $$props) $$invalidate(3, rightSelect = $$props.rightSelect);
    		if ("leftShowList" in $$props) $$invalidate(4, leftShowList = $$props.leftShowList);
    		if ("rightShowList" in $$props) $$invalidate(5, rightShowList = $$props.rightShowList);
    		if ("transService" in $$props) $$invalidate(10, transService = $$props.transService);
    		if ("sourceText" in $$props) $$invalidate(11, sourceText = $$props.sourceText);
    		if ("targetText" in $$props) $$invalidate(12, targetText = $$props.targetText);
    		if ("isPin" in $$props) $$invalidate(6, isPin = $$props.isPin);
    		if ("isShow" in $$props) $$invalidate(7, isShow = $$props.isShow);
    		if ("boxStyle" in $$props) $$invalidate(13, boxStyle = $$props.boxStyle);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		sourceLang,
    		targetLang,
    		leftSelect,
    		rightSelect,
    		leftShowList,
    		rightShowList,
    		isPin,
    		isShow,
    		langList,
    		serviceDict,
    		transService,
    		sourceText,
    		targetText,
    		boxStyle,
    		handlePinClick,
    		handleClose,
    		handleLeftClick,
    		handleRightClick,
    		handleSelectChange,
    		handleBoxClick,
    		formselect0_value_binding,
    		formselect0_binding,
    		formselect0_showList_binding,
    		formselect1_value_binding,
    		formselect1_binding,
    		formselect1_showList_binding
    	];
    }

    class TranslatePop extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "TranslatePop",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.35.0 */
    const file = "src/App.svelte";

    function create_fragment(ctx) {
    	let main;
    	let popup;
    	let t;
    	let tranlatepop;
    	let current;
    	popup = new Popup({ $$inline: true });
    	tranlatepop = new TranslatePop({ $$inline: true });

    	const block = {
    		c: function create() {
    			main = element("main");
    			create_component(popup.$$.fragment);
    			t = space();
    			create_component(tranlatepop.$$.fragment);
    			attr_dev(main, "class", "svelte-1tecc95");
    			add_location(main, file, 137, 0, 3688);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			mount_component(popup, main, null);
    			append_dev(main, t);
    			mount_component(tranlatepop, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(popup.$$.fragment, local);
    			transition_in(tranlatepop.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(popup.$$.fragment, local);
    			transition_out(tranlatepop.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			destroy_component(popup);
    			destroy_component(tranlatepop);
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

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	$$self.$capture_state = () => ({ Popup, TranlatePop: TranslatePop });
    	return [];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    console.log("我是 popup.js");
    const app = new App({
      target: document.body,
      props: {
        name: 'world'
      }
    });

    return app;

}());
