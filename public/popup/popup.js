var app=function(){"use strict";function t(){}function n(t){return t()}function e(){return Object.create(null)}function o(t){t.forEach(n)}function r(t){return"function"==typeof t}function c(t,n){return t!=t?n==n:t!==n||t&&"object"==typeof t||"function"==typeof t}function u(t,n){t.appendChild(n)}function i(t){t.parentNode.removeChild(t)}function s(t){return document.createElement(t)}function a(t){return document.createTextNode(t)}function l(t,n,e){null==e?t.removeAttribute(n):t.getAttribute(n)!==e&&t.setAttribute(n,e)}let f;function d(t){f=t}const p=[],m=[],g=[],h=[],$=Promise.resolve();let b=!1;function y(t){g.push(t)}let _=!1;const x=new Set;function v(){if(!_){_=!0;do{for(let t=0;t<p.length;t+=1){const n=p[t];d(n),k(n.$$)}for(d(null),p.length=0;m.length;)m.pop()();for(let t=0;t<g.length;t+=1){const n=g[t];x.has(n)||(x.add(n),n())}g.length=0}while(p.length);for(;h.length;)h.pop()();b=!1,_=!1,x.clear()}}function k(t){if(null!==t.fragment){t.update(),o(t.before_update);const n=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,n),t.after_update.forEach(y)}}const w=new Set;function E(t,n){-1===t.$$.dirty[0]&&(p.push(t),b||(b=!0,$.then(v)),t.$$.dirty.fill(0)),t.$$.dirty[n/31|0]|=1<<n%31}function j(c,u,s,a,l,p,m=[-1]){const g=f;d(c);const h=c.$$={fragment:null,ctx:null,props:p,update:t,not_equal:l,bound:e(),on_mount:[],on_destroy:[],on_disconnect:[],before_update:[],after_update:[],context:new Map(g?g.$$.context:[]),callbacks:e(),dirty:m,skip_bound:!1};let $=!1;if(h.ctx=s?s(c,u.props||{},((t,n,...e)=>{const o=e.length?e[0]:n;return h.ctx&&l(h.ctx[t],h.ctx[t]=o)&&(!h.skip_bound&&h.bound[t]&&h.bound[t](o),$&&E(c,t)),n})):[],h.update(),$=!0,o(h.before_update),h.fragment=!!a&&a(h.ctx),u.target){if(u.hydrate){const t=function(t){return Array.from(t.childNodes)}(u.target);h.fragment&&h.fragment.l(t),t.forEach(i)}else h.fragment&&h.fragment.c();u.intro&&((b=c.$$.fragment)&&b.i&&(w.delete(b),b.i(_))),function(t,e,c,u){const{fragment:i,on_mount:s,on_destroy:a,after_update:l}=t.$$;i&&i.m(e,c),u||y((()=>{const e=s.map(n).filter(r);a?a.push(...e):o(e),t.$$.on_mount=[]})),l.forEach(y)}(c,u.target,u.anchor,u.customElement),v()}var b,_;d(g)}function A(n){let e,o,r,c,f,d,p,m;return{c(){e=s("main"),o=s("div"),r=a("Hello "),c=a(n[0]),f=a("!"),d=a(" "),p=s("img"),p.src!==(m="images/logo48.png")&&l(p,"src","images/logo48.png"),l(p,"alt","img"),l(p,"width","100"),l(p,"height","100"),l(e,"class","svelte-69jvpm")},m(t,n){!function(t,n,e){t.insertBefore(n,e||null)}(t,e,n),u(e,o),u(o,r),u(o,c),u(o,f),u(e,d),u(e,p)},p(t,[n]){1&n&&function(t,n){n=""+n,t.wholeText!==n&&(t.data=n)}(c,t[0])},i:t,o:t,d(t){t&&i(e)}}}function N(t,n,e){let{name:o}=n;return t.$$set=t=>{"name"in t&&e(0,o=t.name)},[o]}console.log("我是 popup.js");return new class extends class{$destroy(){!function(t,n){const e=t.$$;null!==e.fragment&&(o(e.on_destroy),e.fragment&&e.fragment.d(n),e.on_destroy=e.fragment=null,e.ctx=[])}(this,1),this.$destroy=t}$on(t,n){const e=this.$$.callbacks[t]||(this.$$.callbacks[t]=[]);return e.push(n),()=>{const t=e.indexOf(n);-1!==t&&e.splice(t,1)}}$set(t){var n;this.$$set&&(n=t,0!==Object.keys(n).length)&&(this.$$.skip_bound=!0,this.$$set(t),this.$$.skip_bound=!1)}}{constructor(t){super(),j(this,t,N,A,c,{name:0})}}({target:document.body,props:{name:"world"}})}();
