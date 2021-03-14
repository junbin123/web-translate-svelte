
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
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
    const outroing = new Set();
    let outros;
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

    const globals = (typeof window !== 'undefined'
        ? window
        : typeof globalThis !== 'undefined'
            ? globalThis
            : global);

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

    const file$3 = "src/components/main/Popup.svelte";

    function create_fragment$3(ctx) {
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
    			add_location(div, file$3, 5, 2, 47);
    			add_location(main, file$3, 4, 0, 38);
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
    		id: create_fragment$3.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$3($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$3, create_fragment$3, safe_not_equal, { name: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Popup",
    			options,
    			id: create_fragment$3.name
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
    const file$2 = "src/components/FormSelect.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[7] = list[i];
    	child_ctx[9] = i;
    	return child_ctx;
    }

    // (46:4) {#each options as item, index}
    function create_each_block(ctx) {
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
    			add_location(div, file$2, 46, 6, 1226);
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
    		id: create_each_block.name,
    		type: "each",
    		source: "(46:4) {#each options as item, index}",
    		ctx
    	});

    	return block;
    }

    function create_fragment$2(ctx) {
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
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
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
    			add_location(div0, file$2, 41, 4, 927);
    			attr_dev(i, "class", "transition-300 iconfont icon-arrow-down svelte-1n6x4zx");
    			toggle_class(i, "arrow-up", /*showList*/ ctx[0]);
    			add_location(i, file$2, 42, 4, 976);
    			attr_dev(div1, "id", "select-box");
    			attr_dev(div1, "class", "color-main transition-300 bg-color-light-grey flex-between round-4 svelte-1n6x4zx");
    			add_location(div1, file$2, 40, 2, 787);
    			attr_dev(div2, "class", "select-container round-4 bg-color-light-grey padding-tb-8 transition-300 svelte-1n6x4zx");
    			toggle_class(div2, "select-spread", /*showList*/ ctx[0]);
    			add_location(div2, file$2, 44, 2, 1067);
    			attr_dev(main, "class", "svelte-1n6x4zx");
    			add_location(main, file$2, 39, 0, 778);
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
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
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
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self, $$props, $$invalidate) {
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
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, { value: 5, options: 1, showList: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "FormSelect",
    			options,
    			id: create_fragment$2.name
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

    /* src/components/main/TranslatePop.svelte generated by Svelte v3.35.0 */

    const { console: console_1 } = globals;
    const file$1 = "src/components/main/TranslatePop.svelte";

    function create_fragment$1(ctx) {
    	let main;
    	let div10;
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
    	let div9;
    	let span4;
    	let t15;
    	let div7;
    	let t17;
    	let div8;
    	let current;
    	let mounted;
    	let dispose;

    	function formselect0_value_binding(value) {
    		/*formselect0_value_binding*/ ctx[13](value);
    	}

    	function formselect0_showList_binding(value) {
    		/*formselect0_showList_binding*/ ctx[15](value);
    	}

    	let formselect0_props = { options: /*langList*/ ctx[6] };

    	if (/*sourceLang*/ ctx[0] !== void 0) {
    		formselect0_props.value = /*sourceLang*/ ctx[0];
    	}

    	if (/*leftShowList*/ ctx[4] !== void 0) {
    		formselect0_props.showList = /*leftShowList*/ ctx[4];
    	}

    	formselect0 = new FormSelect({ props: formselect0_props, $$inline: true });
    	binding_callbacks.push(() => bind(formselect0, "value", formselect0_value_binding));
    	/*formselect0_binding*/ ctx[14](formselect0);
    	binding_callbacks.push(() => bind(formselect0, "showList", formselect0_showList_binding));
    	formselect0.$on("handleClick", /*handleLeftClick*/ ctx[9]);
    	formselect0.$on("handleChange", /*handleSelectChange*/ ctx[11]);

    	function formselect1_value_binding(value) {
    		/*formselect1_value_binding*/ ctx[16](value);
    	}

    	function formselect1_showList_binding(value) {
    		/*formselect1_showList_binding*/ ctx[18](value);
    	}

    	let formselect1_props = { options: /*langList*/ ctx[6] };

    	if (/*targetLang*/ ctx[1] !== void 0) {
    		formselect1_props.value = /*targetLang*/ ctx[1];
    	}

    	if (/*rightShowList*/ ctx[5] !== void 0) {
    		formselect1_props.showList = /*rightShowList*/ ctx[5];
    	}

    	formselect1 = new FormSelect({ props: formselect1_props, $$inline: true });
    	binding_callbacks.push(() => bind(formselect1, "value", formselect1_value_binding));
    	/*formselect1_binding*/ ctx[17](formselect1);
    	binding_callbacks.push(() => bind(formselect1, "showList", formselect1_showList_binding));
    	formselect1.$on("handleClick", /*handleRightClick*/ ctx[10]);
    	formselect1.$on("handleChange", /*handleSelectChange*/ ctx[11]);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div10 = element("div");
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
    			div5.textContent = "In recent years, many companies have begun to use formal proofs to provide assurance for software.";
    			t13 = space();
    			div9 = element("div");
    			span4 = element("span");
    			span4.textContent = "译文";
    			t15 = space();
    			div7 = element("div");
    			div7.textContent = "近年来，许多公司已开始使用形式证明来为软件提供保证。";
    			t17 = space();
    			div8 = element("div");
    			div8.textContent = "由彩云小译提供翻译服务";
    			attr_dev(i0, "class", "iconfont icon-setting font-size-16");
    			add_location(i0, file$1, 60, 8, 1408);
    			attr_dev(span0, "class", "trans-bar-left-name svelte-eomynx");
    			add_location(span0, file$1, 61, 8, 1465);
    			attr_dev(i1, "class", "iconfont icon-arrow-right");
    			add_location(i1, file$1, 62, 8, 1517);
    			attr_dev(div0, "class", "trans-bar-left flex-between hover-color-orange svelte-eomynx");
    			add_location(div0, file$1, 59, 6, 1339);
    			attr_dev(div1, "id", "trans-bar-middle");
    			attr_dev(div1, "class", "svelte-eomynx");
    			add_location(div1, file$1, 64, 6, 1576);
    			attr_dev(span1, "class", "iconfont icon-push-pin padding-lr-8 hover-color-orange svelte-eomynx");
    			toggle_class(span1, "icon-push-is-pin", /*isPin*/ ctx[7]);
    			add_location(span1, file$1, 66, 8, 1655);
    			attr_dev(span2, "class", "iconfont icon-close hover-color-orange svelte-eomynx");
    			add_location(span2, file$1, 67, 8, 1792);
    			attr_dev(div2, "class", "trans-bar-right flex");
    			add_location(div2, file$1, 65, 6, 1612);
    			attr_dev(div3, "class", "trans-bar font-size-12 color-main flex-between padding-lr-16 svelte-eomynx");
    			add_location(div3, file$1, 58, 4, 1258);
    			attr_dev(i2, "class", "trans-lang-middle iconfont icon-arrow-compare flex-center hover-color-orange");
    			add_location(i2, file$1, 79, 6, 2197);
    			attr_dev(div4, "class", "trans-lang flex-between padding-lr-16 svelte-eomynx");
    			add_location(div4, file$1, 70, 4, 1899);
    			attr_dev(span3, "class", "color-99 font-size-10 leading-8");
    			add_location(span3, file$1, 90, 6, 2593);
    			attr_dev(div5, "class", "font-size-14 color-333");
    			add_location(div5, file$1, 91, 6, 2655);
    			attr_dev(div6, "class", "padding-lr-16 padding-tb-8");
    			add_location(div6, file$1, 89, 4, 2546);
    			attr_dev(span4, "class", "color-99 font-size-10 leading-8");
    			add_location(span4, file$1, 94, 6, 2858);
    			attr_dev(div7, "class", "font-size-14");
    			add_location(div7, file$1, 95, 6, 2920);
    			attr_dev(div8, "class", "font-size-10 color-99 trans-target-api transition-300 svelte-eomynx");
    			add_location(div8, file$1, 96, 6, 2985);
    			attr_dev(div9, "class", "trans-target padding-lr-16 svelte-eomynx");
    			add_location(div9, file$1, 93, 4, 2811);
    			attr_dev(div10, "class", "select-trans-pop color-main svelte-eomynx");
    			attr_dev(div10, "style", /*boxStyle*/ ctx[8]);
    			toggle_class(div10, "select-trans-pop-pin", /*isPin*/ ctx[7]);
    			add_location(div10, file$1, 57, 2, 1134);
    			add_location(main, file$1, 56, 0, 1125);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div10);
    			append_dev(div10, div3);
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
    			append_dev(div10, t6);
    			append_dev(div10, div4);
    			mount_component(formselect0, div4, null);
    			append_dev(div4, t7);
    			append_dev(div4, i2);
    			append_dev(div4, t8);
    			mount_component(formselect1, div4, null);
    			append_dev(div10, t9);
    			append_dev(div10, div6);
    			append_dev(div6, span3);
    			append_dev(div6, t11);
    			append_dev(div6, div5);
    			append_dev(div10, t13);
    			append_dev(div10, div9);
    			append_dev(div9, span4);
    			append_dev(div9, t15);
    			append_dev(div9, div7);
    			append_dev(div9, t17);
    			append_dev(div9, div8);
    			current = true;

    			if (!mounted) {
    				dispose = [
    					listen_dev(span1, "click", handlePinClick, false, false, false),
    					listen_dev(span2, "click", handleClose, false, false, false),
    					listen_dev(div10, "click", /*handleBoxClick*/ ctx[12], false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
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
    			if (detaching) detach_dev(main);
    			/*formselect0_binding*/ ctx[14](null);
    			destroy_component(formselect0);
    			/*formselect1_binding*/ ctx[17](null);
    			destroy_component(formselect1);
    			mounted = false;
    			run_all(dispose);
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

    const pinClass = "iconfont icon-push-pin hover-transition icon-push-is-pin";
    const noPinClass = "iconfont icon-push-pin hover-transition";

    function handlePinClick() {
    	
    }

    function handleClose() {
    	
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("TranslatePop", slots, []);

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
    	let isPin = true;
    	let name = "jjj";

    	let boxStyle = {
    		position: "fixed",
    		top: 8 + "px",
    		left: 8 + "px"
    	};

    	function handleLeftClick(e) {
    		$$invalidate(5, rightShowList = false);
    		console.log(e);
    	}

    	function handleRightClick(e) {
    		$$invalidate(4, leftShowList = false);
    		console.log(e);
    	}

    	function handleSelectChange(e) {
    		console.log({ sourceLang, targetLang });
    	}

    	// 组件点击
    	function handleBoxClick() {
    		$$invalidate(4, leftShowList = false);
    		$$invalidate(5, rightShowList = false);
    	}

    	onMount(() => {
    		console.log("onMount");
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
    		langList,
    		sourceLang,
    		targetLang,
    		leftSelect,
    		rightSelect,
    		leftShowList,
    		rightShowList,
    		isPin,
    		name,
    		boxStyle,
    		pinClass,
    		noPinClass,
    		handlePinClick,
    		handleClose,
    		handleLeftClick,
    		handleRightClick,
    		handleSelectChange,
    		handleBoxClick
    	});

    	$$self.$inject_state = $$props => {
    		if ("sourceLang" in $$props) $$invalidate(0, sourceLang = $$props.sourceLang);
    		if ("targetLang" in $$props) $$invalidate(1, targetLang = $$props.targetLang);
    		if ("leftSelect" in $$props) $$invalidate(2, leftSelect = $$props.leftSelect);
    		if ("rightSelect" in $$props) $$invalidate(3, rightSelect = $$props.rightSelect);
    		if ("leftShowList" in $$props) $$invalidate(4, leftShowList = $$props.leftShowList);
    		if ("rightShowList" in $$props) $$invalidate(5, rightShowList = $$props.rightShowList);
    		if ("isPin" in $$props) $$invalidate(7, isPin = $$props.isPin);
    		if ("name" in $$props) name = $$props.name;
    		if ("boxStyle" in $$props) $$invalidate(8, boxStyle = $$props.boxStyle);
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
    		langList,
    		isPin,
    		boxStyle,
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
