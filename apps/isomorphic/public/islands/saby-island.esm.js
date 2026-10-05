const Le = (e, t) => e === t, De = Symbol("solid-track"), ae = {
  equals: Le
};
let Be = Te;
const Y = 1, ce = 2, Se = {
  owned: null,
  cleanups: null,
  context: null,
  owner: null
};
var R = null;
let he = null, Ne = null, M = null, B = null, J = null, fe = 0;
function oe(e, t) {
  const n = M, l = R, s = e.length === 0, i = t === void 0 ? l : t, o = s ? Se : {
    owned: null,
    cleanups: null,
    context: i ? i.context : null,
    owner: i
  }, r = s ? e : () => e(() => Q(() => ne(o)));
  R = o, M = null;
  try {
    return se(r, !0);
  } finally {
    M = n, R = l;
  }
}
function j(e, t) {
  t = t ? Object.assign({}, ae, t) : ae;
  const n = {
    value: e,
    observers: null,
    observerSlots: null,
    comparator: t.equals || void 0
  }, l = (s) => (typeof s == "function" && (s = s(n.value)), Ce(n, s));
  return [_e.bind(n), l];
}
function G(e, t, n) {
  const l = ke(e, t, !1, Y);
  be(l);
}
function ee(e, t, n) {
  n = n ? Object.assign({}, ae, n) : ae;
  const l = ke(e, t, !0, 0);
  return l.observers = null, l.observerSlots = null, l.comparator = n.equals || void 0, be(l), _e.bind(l);
}
function Q(e) {
  if (M === null) return e();
  const t = M;
  M = null;
  try {
    return e();
  } finally {
    M = t;
  }
}
function qe(e) {
  return R === null || (R.cleanups === null ? R.cleanups = [e] : R.cleanups.push(e)), e;
}
function _e() {
  if (this.sources && this.state)
    if (this.state === Y) be(this);
    else {
      const e = B;
      B = null, se(() => de(this), !1), B = e;
    }
  if (M) {
    const e = this.observers ? this.observers.length : 0;
    M.sources ? (M.sources.push(this), M.sourceSlots.push(e)) : (M.sources = [this], M.sourceSlots = [e]), this.observers ? (this.observers.push(M), this.observerSlots.push(M.sources.length - 1)) : (this.observers = [M], this.observerSlots = [M.sources.length - 1]);
  }
  return this.value;
}
function Ce(e, t, n) {
  let l = e.value;
  return (!e.comparator || !e.comparator(l, t)) && (e.value = t, e.observers && e.observers.length && se(() => {
    for (let s = 0; s < e.observers.length; s += 1) {
      const i = e.observers[s], o = he && he.running;
      o && he.disposed.has(i), (o ? !i.tState : !i.state) && (i.pure ? B.push(i) : J.push(i), i.observers && Ie(i)), o || (i.state = Y);
    }
    if (B.length > 1e6)
      throw B = [], new Error();
  }, !1)), t;
}
function be(e) {
  if (!e.fn) return;
  ne(e);
  const t = fe;
  Ge(e, e.value, t);
}
function Ge(e, t, n) {
  let l;
  const s = R, i = M;
  M = R = e;
  try {
    l = e.fn(t);
  } catch (o) {
    return e.pure && (e.state = Y, e.owned && e.owned.forEach(ne), e.owned = null), e.updatedAt = n + 1, Ee(o);
  } finally {
    M = i, R = s;
  }
  (!e.updatedAt || e.updatedAt <= n) && (e.updatedAt != null && "observers" in e ? Ce(e, l) : e.value = l, e.updatedAt = n);
}
function ke(e, t, n, l = Y, s) {
  const i = {
    fn: e,
    state: l,
    updatedAt: null,
    owned: null,
    sources: null,
    sourceSlots: null,
    cleanups: null,
    value: t,
    owner: R,
    context: R ? R.context : null,
    pure: n
  };
  return R === null || R !== Se && (R.owned ? R.owned.push(i) : R.owned = [i]), i;
}
function Ae(e) {
  if (e.state === 0) return;
  if (e.state === ce) return de(e);
  if (e.suspense && Q(e.suspense.inFallback)) return e.suspense.effects.push(e);
  const t = [e];
  for (; (e = e.owner) && (!e.updatedAt || e.updatedAt < fe); )
    e.state && t.push(e);
  for (let n = t.length - 1; n >= 0; n--)
    if (e = t[n], e.state === Y)
      be(e);
    else if (e.state === ce) {
      const l = B;
      B = null, se(() => de(e, t[0]), !1), B = l;
    }
}
function se(e, t) {
  if (B) return e();
  let n = !1;
  t || (B = []), J ? n = !0 : J = [], fe++;
  try {
    const l = e();
    return Ue(n), l;
  } catch (l) {
    n || (J = null), B = null, Ee(l);
  }
}
function Ue(e) {
  if (B && (Te(B), B = null), e) return;
  const t = J;
  J = null, t.length && se(() => Be(t), !1);
}
function Te(e) {
  for (let t = 0; t < e.length; t++) Ae(e[t]);
}
function de(e, t) {
  e.state = 0;
  for (let n = 0; n < e.sources.length; n += 1) {
    const l = e.sources[n];
    if (l.sources) {
      const s = l.state;
      s === Y ? l !== t && (!l.updatedAt || l.updatedAt < fe) && Ae(l) : s === ce && de(l, t);
    }
  }
}
function Ie(e) {
  for (let t = 0; t < e.observers.length; t += 1) {
    const n = e.observers[t];
    n.state || (n.state = ce, n.pure ? B.push(n) : J.push(n), n.observers && Ie(n));
  }
}
function ne(e) {
  let t;
  if (e.sources)
    for (; e.sources.length; ) {
      const n = e.sources.pop(), l = e.sourceSlots.pop(), s = n.observers;
      if (s && s.length) {
        const i = s.pop(), o = n.observerSlots.pop();
        l < s.length && (i.sourceSlots[o] = l, s[l] = i, n.observerSlots[l] = o);
      }
    }
  if (e.tOwned) {
    const n = e.tOwned;
    for (delete e.tOwned, t = n.length - 1; t >= 0; t--) ne(n[t]);
  }
  if (e.owned) {
    const n = e.owned;
    for (e.owned = null, t = n.length - 1; t >= 0; t--) ne(n[t]);
  }
  if (e.cleanups) {
    const n = e.cleanups;
    for (e.cleanups = null, t = n.length - 1; t >= 0; t--) n[t]();
  }
  e.state = 0;
}
function Ve(e) {
  return e instanceof Error ? e : new Error(typeof e == "string" ? e : "Unknown error", {
    cause: e
  });
}
function Ee(e, t = R) {
  throw Ve(e);
}
const He = Symbol("fallback");
function ve(e) {
  for (let t = 0; t < e.length; t++) e[t]();
}
function ze(e, t, n = {}) {
  let l = [], s = [], i = [], o = 0, r = t.length > 1 ? [] : null;
  return qe(() => ve(i)), () => {
    let d = e() || [], c = d.length, f, a;
    return d[De], Q(() => {
      let v, p, _, T, y, h, b, g, x;
      if (c === 0)
        o !== 0 && (ve(i), i = [], l = [], s = [], o = 0, r && (r = [])), n.fallback && (l = [He], s[0] = oe((m) => (i[0] = m, n.fallback())), o = 1);
      else if (o === 0) {
        for (s = new Array(c), a = 0; a < c; a++)
          l[a] = d[a], s[a] = oe(S);
        o = c;
      } else {
        for (_ = new Array(c), T = new Array(c), r && (y = new Array(c)), h = 0, b = Math.min(o, c); h < b && l[h] === d[h]; h++) ;
        for (b = o - 1, g = c - 1; b >= h && g >= h && l[b] === d[g]; b--, g--)
          _[g] = s[b], T[g] = i[b], r && (y[g] = r[b]);
        for (v = /* @__PURE__ */ new Map(), p = new Array(g + 1), a = g; a >= h; a--)
          x = d[a], f = v.get(x), p[a] = f === void 0 ? -1 : f, v.set(x, a);
        for (f = h; f <= b; f++)
          x = l[f], a = v.get(x), a !== void 0 && a !== -1 ? (_[a] = s[f], T[a] = i[f], r && (y[a] = r[f]), a = p[a], v.set(x, a)) : i[f]();
        for (a = h; a < c; a++)
          a in _ ? (s[a] = _[a], i[a] = T[a], r && (r[a] = y[a], r[a](a))) : s[a] = oe(S);
        s = s.slice(0, o = c), l = d.slice(0);
      }
      return s;
    });
    function S(v) {
      if (i[a] = v, r) {
        const [p, _] = j(a);
        return r[a] = _, t(d[a], p);
      }
      return t(d[a]);
    }
  };
}
function $(e, t) {
  return Q(() => e(t || {}));
}
const We = (e) => `Stale read from <${e}>.`;
function te(e) {
  const t = "fallback" in e && {
    fallback: () => e.fallback
  };
  return ee(ze(() => e.each, e.children, t || void 0));
}
function F(e) {
  const t = e.keyed, n = ee(() => e.when, void 0, void 0), l = t ? n : ee(n, void 0, {
    equals: (s, i) => !s == !i
  });
  return ee(() => {
    const s = l();
    if (s) {
      const i = e.children;
      return typeof i == "function" && i.length > 0 ? Q(() => i(t ? s : () => {
        if (!Q(l)) throw We("Show");
        return n();
      })) : i;
    }
    return e.fallback;
  }, void 0, void 0);
}
const le = (e) => ee(() => e());
function Ke(e, t, n) {
  let l = n.length, s = t.length, i = l, o = 0, r = 0, d = t[s - 1].nextSibling, c = null;
  for (; o < s || r < i; ) {
    if (t[o] === n[r]) {
      o++, r++;
      continue;
    }
    for (; t[s - 1] === n[i - 1]; )
      s--, i--;
    if (s === o) {
      const f = i < l ? r ? n[r - 1].nextSibling : n[i - r] : d;
      for (; r < i; ) e.insertBefore(n[r++], f);
    } else if (i === r)
      for (; o < s; )
        (!c || !c.has(t[o])) && t[o].remove(), o++;
    else if (t[o] === n[i - 1] && n[r] === t[s - 1]) {
      const f = t[--s].nextSibling;
      e.insertBefore(n[r++], t[o++].nextSibling), e.insertBefore(n[--i], f), t[s] = n[i];
    } else {
      if (!c) {
        c = /* @__PURE__ */ new Map();
        let a = r;
        for (; a < i; ) c.set(n[a], a++);
      }
      const f = c.get(t[o]);
      if (f != null)
        if (r < f && f < i) {
          let a = o, S = 1, v;
          for (; ++a < s && a < i && !((v = c.get(t[a])) == null || v !== f + S); )
            S++;
          if (S > f - r) {
            const p = t[o];
            for (; r < f; ) e.insertBefore(n[r++], p);
          } else e.replaceChild(n[r++], t[o++]);
        } else o++;
      else t[o++].remove();
    }
  }
}
const we = "_$DX_DELEGATE";
function Me(e, t, n, l = {}) {
  let s;
  return oe((i) => {
    s = i, t === document ? e() : u(t, e(), t.firstChild ? null : void 0, n);
  }, l.owner), () => {
    s(), t.textContent = "";
  };
}
function w(e, t, n, l) {
  let s;
  const i = () => {
    const r = document.createElement("template");
    return r.innerHTML = e, r.content.firstChild;
  }, o = t ? () => Q(() => document.importNode(s || (s = i()), !0)) : () => (s || (s = i())).cloneNode(!0);
  return o.cloneNode = o, o;
}
function re(e, t = window.document) {
  const n = t[we] || (t[we] = /* @__PURE__ */ new Set());
  for (let l = 0, s = e.length; l < s; l++) {
    const i = e[l];
    n.has(i) || (n.add(i), t.addEventListener(i, Je));
  }
}
function Qe(e, t, n) {
  n == null ? e.removeAttribute(t) : e.setAttribute(t, n);
}
function W(e, t) {
  t == null ? e.removeAttribute("class") : e.className = t;
}
function $e(e, t, n, l) {
  Array.isArray(n) ? (e[`$$${t}`] = n[0], e[`$$${t}Data`] = n[1]) : e[`$$${t}`] = n;
}
function xe(e, t, n) {
  return Q(() => e(t, n));
}
function u(e, t, n, l) {
  if (n !== void 0 && !l && (l = []), typeof t != "function") return ue(e, t, l, n);
  G((s) => ue(e, t(), s, n), l);
}
function Je(e) {
  let t = e.target;
  const n = `$$${e.type}`, l = e.target, s = e.currentTarget, i = (d) => Object.defineProperty(e, "target", {
    configurable: !0,
    value: d
  }), o = () => {
    const d = t[n];
    if (d && !t.disabled) {
      const c = t[`${n}Data`];
      if (c !== void 0 ? d.call(t, c, e) : d.call(t, e), e.cancelBubble) return;
    }
    return t.host && typeof t.host != "string" && !t.host._$host && t.contains(e.target) && i(t.host), !0;
  }, r = () => {
    for (; o() && (t = t._$host || t.parentNode || t.host); ) ;
  };
  if (Object.defineProperty(e, "currentTarget", {
    configurable: !0,
    get() {
      return t || document;
    }
  }), e.composedPath) {
    const d = e.composedPath();
    i(d[0]);
    for (let c = 0; c < d.length - 2 && (t = d[c], !!o()); c++) {
      if (t._$host) {
        t = t._$host, r();
        break;
      }
      if (t.parentNode === s)
        break;
    }
  } else r();
  i(l);
}
function ue(e, t, n, l, s) {
  for (; typeof n == "function"; ) n = n();
  if (t === n) return n;
  const i = typeof t, o = l !== void 0;
  if (e = o && n[0] && n[0].parentNode || e, i === "string" || i === "number") {
    if (i === "number" && (t = t.toString(), t === n))
      return n;
    if (o) {
      let r = n[0];
      r && r.nodeType === 3 ? r.data !== t && (r.data = t) : r = document.createTextNode(t), n = X(e, n, l, r);
    } else
      n !== "" && typeof n == "string" ? n = e.firstChild.data = t : n = e.textContent = t;
  } else if (t == null || i === "boolean")
    n = X(e, n, l);
  else {
    if (i === "function")
      return G(() => {
        let r = t();
        for (; typeof r == "function"; ) r = r();
        n = ue(e, r, n, l);
      }), () => n;
    if (Array.isArray(t)) {
      const r = [], d = n && Array.isArray(n);
      if (ge(r, t, n, s))
        return G(() => n = ue(e, r, n, l, !0)), () => n;
      if (r.length === 0) {
        if (n = X(e, n, l), o) return n;
      } else d ? n.length === 0 ? ye(e, r, l) : Ke(e, n, r) : (n && X(e), ye(e, r));
      n = r;
    } else if (t.nodeType) {
      if (Array.isArray(n)) {
        if (o) return n = X(e, n, l, t);
        X(e, n, null, t);
      } else n == null || n === "" || !e.firstChild ? e.appendChild(t) : e.replaceChild(t, e.firstChild);
      n = t;
    }
  }
  return n;
}
function ge(e, t, n, l) {
  let s = !1;
  for (let i = 0, o = t.length; i < o; i++) {
    let r = t[i], d = n && n[e.length], c;
    if (!(r == null || r === !0 || r === !1)) if ((c = typeof r) == "object" && r.nodeType)
      e.push(r);
    else if (Array.isArray(r))
      s = ge(e, r, d) || s;
    else if (c === "function")
      if (l) {
        for (; typeof r == "function"; ) r = r();
        s = ge(e, Array.isArray(r) ? r : [r], Array.isArray(d) ? d : [d]) || s;
      } else
        e.push(r), s = !0;
    else {
      const f = String(r);
      d && d.nodeType === 3 && d.data === f ? e.push(d) : e.push(document.createTextNode(f));
    }
  }
  return s;
}
function ye(e, t, n = null) {
  for (let l = 0, s = t.length; l < s; l++) e.insertBefore(t[l], n);
}
function X(e, t, n, l) {
  if (n === void 0) return e.textContent = "";
  const s = l || document.createTextNode("");
  if (t.length) {
    let i = !1;
    for (let o = t.length - 1; o >= 0; o--) {
      const r = t[o];
      if (s !== r) {
        const d = r.parentNode === e;
        !i && !o ? d ? e.replaceChild(s, r) : e.insertBefore(s, n) : d && r.remove();
      } else i = !0;
    }
  } else e.insertBefore(s, n);
  return [s];
}
var Ye = /* @__PURE__ */ w('<button type=button class="ml-0.5 text-blue-400 hover:text-white transition-colors"title="Remove active form filter">×'), Xe = /* @__PURE__ */ w('<div class="pt-2.5 px-4 flex items-center gap-1.5"><span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30"><svg class="w-3.5 h-3.5"viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1=16 y1=13 x2=8 y2=13></line><line x1=16 y1=17 x2=8 y2=17></line></svg><span>'), Ze = /* @__PURE__ */ w('<div class="absolute bottom-full right-0 mb-2 w-48 rounded-xl bg-slate-900 border border-white/10 shadow-xl py-1 z-30">'), et = /* @__PURE__ */ w('<svg class="w-4 h-4 animate-spin"viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2><circle class=opacity-25 cx=12 cy=12 r=10 stroke=currentColor stroke-width=4></circle><path class=opacity-75 fill=currentColor d="M4 12a8 8 0 018-8v8H4z">'), tt = /* @__PURE__ */ w('<div class="saby-chat-pill-wrapper w-full max-w-3xl mx-auto px-4 pb-4"><div class="saby-chat-pill relative rounded-2xl border border-white/10 bg-slate-900/80 backdrop-blur-xl shadow-2xl transition-all duration-200 focus-within:border-blue-500/50 focus-within:ring-2 focus-within:ring-blue-500/20"><div class="flex items-end gap-2 p-3"><textarea rows=1 class="flex-1 bg-transparent text-slate-100 placeholder-slate-400 text-sm md:text-base resize-none outline-none leading-relaxed max-h-[180px] py-1 px-1 scrollbar-thin"></textarea><div class="flex items-center gap-2 flex-shrink-0 mb-0.5"><div class=relative><button type=button class="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"title="Select Model"><span></span><svg class="w-3 h-3 opacity-60"viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2><polyline points="6 9 12 15 18 9"></polyline></svg></button></div><button type=button class="w-8 h-8 md:w-9 md:h-9 rounded-xl flex items-center justify-center bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:hover:bg-blue-600 text-white shadow-md transition-all active:scale-95"title="Send Message">'), nt = /* @__PURE__ */ w("<span class=text-blue-400>✓"), lt = /* @__PURE__ */ w('<button type=button class="w-full text-left px-3 py-1.5 text-xs text-slate-300 hover:bg-blue-600/20 hover:text-blue-400 flex items-center justify-between"><span>'), st = /* @__PURE__ */ w('<svg class="w-4 h-4 ml-0.5"viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2><line x1=22 y1=2 x2=11 y2=13></line><polygon points="22 2 15 22 11 13 2 9 22 2">');
const rt = [{
  id: "gpt-4o",
  label: "GPT-4o (Omni)"
}, {
  id: "claude-3-5-sonnet",
  label: "Claude 3.5 Sonnet"
}, {
  id: "gemini-1-5-pro",
  label: "Gemini 1.5 Pro"
}];
function je(e) {
  const [t, n] = j(""), [l, s] = j(!1);
  let i;
  const o = (c) => {
    const f = c.currentTarget;
    n(f.value), f.style.height = "auto", f.style.height = `${Math.min(f.scrollHeight, 180)}px`;
  }, r = (c) => {
    c.key === "Enter" && !c.shiftKey && (c.preventDefault(), d());
  }, d = () => {
    const c = t().trim();
    !c || e.disabled || e.isStreaming || (e.onSubmit(c), n(""), i && (i.style.height = "auto"));
  };
  return (() => {
    var c = tt(), f = c.firstChild, a = f.firstChild, S = a.firstChild, v = S.nextSibling, p = v.firstChild, _ = p.firstChild, T = _.firstChild, y = p.nextSibling;
    u(f, $(F, {
      get when() {
        return e.activeProjectFormTitle;
      },
      get children() {
        var b = Xe(), g = b.firstChild, x = g.firstChild, m = x.nextSibling;
        return u(m, () => e.activeProjectFormTitle), u(g, $(F, {
          get when() {
            return e.onClearActiveForm;
          },
          get children() {
            var I = Ye();
            return $e(I, "click", e.onClearActiveForm), I;
          }
        }), null), b;
      }
    }), a), S.$$keydown = r, $e(S, "input", o);
    var h = i;
    return typeof h == "function" ? xe(h, S) : i = S, _.$$click = () => s(!l()), u(T, () => e.selectedModel || "GPT-4o"), u(p, $(F, {
      get when() {
        return l();
      },
      get children() {
        var b = Ze();
        return u(b, () => rt.map((g) => (() => {
          var x = lt(), m = x.firstChild;
          return x.$$click = () => {
            e.onSelectModel?.(g.id), s(!1);
          }, u(m, () => g.label), u(x, $(F, {
            get when() {
              return e.selectedModel === g.id;
            },
            get children() {
              return nt();
            }
          }), null), x;
        })())), b;
      }
    }), null), y.$$click = d, u(y, $(F, {
      get when() {
        return e.isStreaming;
      },
      get fallback() {
        return st();
      },
      get children() {
        return et();
      }
    })), G((b) => {
      var g = e.placeholder || "Ask Saby anything about governance, staff, forms...", x = e.disabled || e.isStreaming, m = !t().trim() || e.disabled || e.isStreaming;
      return g !== b.e && Qe(S, "placeholder", b.e = g), x !== b.t && (S.disabled = b.t = x), m !== b.a && (y.disabled = b.a = m), b;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), G(() => S.value = t()), c;
  })();
}
re(["click", "input", "keydown"]);
var it = /* @__PURE__ */ w('<div class="text-xs text-slate-400 mb-3"><span>Target Resources: </span><span class="text-slate-300 font-mono">'), ot = /* @__PURE__ */ w('<div class="flex items-center gap-2 pt-1"><button type=button class="flex-1 rounded-lg border border-white/10 bg-white/5 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition-colors disabled:opacity-50">Reject</button><button type=button class="flex-1 rounded-lg bg-amber-600 py-1.5 text-xs font-semibold text-white hover:bg-amber-500 transition-colors shadow-md disabled:opacity-50">'), at = /* @__PURE__ */ w('<div class="my-3 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 shadow-lg backdrop-blur-md"><div class="flex items-center gap-2 mb-2"><span class="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500/20 text-amber-400">⚠️</span><span class="text-xs font-semibold uppercase tracking-wider text-amber-400">Governance Approval Required</span><span> Risk</span></div><div class="text-sm text-slate-200 mb-2"><span>Action: </span><code class="rounded bg-black/40 px-1.5 py-0.5 text-xs text-amber-200 font-mono">'), ct = /* @__PURE__ */ w("<div>");
function dt(e) {
  const [t, n] = j(!1), [l, s] = j(null), i = async () => {
    n(!0);
    try {
      await e.onApprove(e.requestId), s("approved");
    } finally {
      n(!1);
    }
  }, o = async () => {
    n(!0);
    try {
      await e.onReject(e.requestId), s("rejected");
    } finally {
      n(!1);
    }
  }, r = () => e.riskLevel === "critical" || e.riskLevel === "high";
  return (() => {
    var d = at(), c = d.firstChild, f = c.firstChild, a = f.nextSibling, S = a.nextSibling, v = S.firstChild, p = c.nextSibling, _ = p.firstChild, T = _.nextSibling;
    return u(S, () => e.riskLevel || "High", v), u(T, () => e.action), u(d, $(F, {
      get when() {
        return le(() => !!e.resources)() && e.resources.length > 0;
      },
      get children() {
        var y = it(), h = y.firstChild, b = h.nextSibling;
        return u(b, () => e.resources.join(", ")), y;
      }
    }), null), u(d, $(F, {
      get when() {
        return !l();
      },
      get fallback() {
        return (() => {
          var y = ct();
          return u(y, () => l() === "approved" ? "✓ Request Approved & Executed" : "✕ Request Rejected"), G(() => W(y, `text-xs font-medium py-1.5 px-3 rounded-lg ${l() === "approved" ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-red-500/20 text-red-400 border border-red-500/30"}`)), y;
        })();
      },
      get children() {
        var y = ot(), h = y.firstChild, b = h.nextSibling;
        return h.$$click = o, b.$$click = i, u(b, () => t() ? "Confirming..." : "Approve & Execute"), G((g) => {
          var x = t(), m = t();
          return x !== g.e && (h.disabled = g.e = x), m !== g.t && (b.disabled = g.t = m), g;
        }, {
          e: void 0,
          t: void 0
        }), y;
      }
    }), null), G(() => W(S, `ml-auto rounded px-2 py-0.5 text-[10px] font-bold uppercase ${r() ? "bg-red-500/20 text-red-400 border border-red-500/30" : "bg-amber-500/20 text-amber-300"}`)), d;
  })();
}
re(["click"]);
var ut = /* @__PURE__ */ w('<div class="w-7 h-7 rounded-lg bg-slate-800 border border-white/10 flex items-center justify-center text-slate-300 font-semibold text-xs shadow-sm">U'), ft = /* @__PURE__ */ w('<span class="inline-block w-1.5 h-4 ml-1 bg-blue-400 animate-pulse align-middle">'), bt = /* @__PURE__ */ w('<div><div><div class="flex-shrink-0 mt-1"></div><div class="group relative flex flex-col"><div><div class="whitespace-pre-wrap break-words"></div></div><div class="flex items-center gap-2 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity text-xs text-slate-400"><button type=button class="hover:text-slate-200 transition-colors flex items-center gap-1"><span>'), ht = /* @__PURE__ */ w('<div class="w-7 h-7 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 font-bold text-xs shadow-sm">S');
function Pe(e) {
  const [t, n] = j(!1), l = async () => {
    try {
      await navigator.clipboard.writeText(e.message.content), n(!0), setTimeout(() => n(!1), 2e3);
    } catch {
    }
  }, s = () => e.message.role === "user";
  return (() => {
    var i = bt(), o = i.firstChild, r = o.firstChild, d = r.nextSibling, c = d.firstChild, f = c.firstChild, a = c.nextSibling, S = a.firstChild, v = S.firstChild;
    return u(r, $(F, {
      get when() {
        return s();
      },
      get fallback() {
        return ht();
      },
      get children() {
        return ut();
      }
    })), u(f, () => e.message.content, null), u(f, $(F, {
      get when() {
        return le(() => !!e.isStreaming)() && !s();
      },
      get children() {
        return ft();
      }
    }), null), u(c, $(F, {
      get when() {
        return e.message.approval;
      },
      get children() {
        return $(dt, {
          get requestId() {
            return e.message.approval.requestId;
          },
          get action() {
            return e.message.approval.action;
          },
          get resources() {
            return e.message.approval.resources;
          },
          get riskLevel() {
            return e.message.approval.riskLevel;
          },
          get metadata() {
            return e.message.approval.metadata;
          },
          get onApprove() {
            return e.onApproveRequest || (async () => {
            });
          },
          get onReject() {
            return e.onRejectRequest || (async () => {
            });
          }
        });
      }
    }), null), S.$$click = l, u(v, () => t() ? "Copied" : "Copy"), G((p) => {
      var _ = `w-full py-2.5 flex ${s() ? "justify-end" : "justify-start"}`, T = `flex gap-3 max-w-[85%] md:max-w-[80%] ${s() ? "flex-row-reverse" : "flex-row"}`, y = `rounded-2xl px-4 py-3 text-sm leading-relaxed ${s() ? "bg-blue-600 text-white shadow-md rounded-tr-sm" : "bg-slate-800/80 border border-white/[0.08] text-slate-100 shadow-sm rounded-tl-sm backdrop-blur-sm"}`;
      return _ !== p.e && W(i, p.e = _), T !== p.t && W(o, p.t = T), y !== p.a && W(c, p.a = y), p;
    }, {
      e: void 0,
      t: void 0,
      a: void 0
    }), i;
  })();
}
re(["click"]);
async function Re(e) {
  const {
    endpoint: t,
    message: n,
    threadId: l,
    activeProjectFormId: s,
    modelPreference: i,
    accessToken: o,
    onToken: r,
    onProgress: d,
    onDone: c,
    onError: f
  } = e, a = {
    "Content-Type": "application/json",
    Accept: "text/event-stream"
  };
  o && (a.Authorization = `Bearer ${o}`);
  const S = {
    message: n,
    threadId: l || null,
    context: {
      modelPreference: i || "gpt-4o",
      activeProjectFormId: s || null
    }
  };
  try {
    const v = await fetch(t, {
      method: "POST",
      headers: a,
      body: JSON.stringify(S)
    });
    if (!v.ok) {
      const h = await v.text().catch(() => `HTTP ${v.status}`);
      f(`Failed to connect to agent (${v.status}): ${h}`);
      return;
    }
    if (!v.body) {
      f("No response stream received from agent server");
      return;
    }
    const p = v.body.getReader(), _ = new TextDecoder();
    let T = "", y = "";
    for (; ; ) {
      const { done: h, value: b } = await p.read();
      if (h) break;
      T += _.decode(b, { stream: !0 });
      const g = T.split(`
`);
      T = g.pop() || "";
      let x = "";
      for (const m of g) {
        const I = m.trim();
        if (!I) {
          x = "";
          continue;
        }
        if (I.startsWith("event:"))
          x = I.slice(6).trim();
        else if (I.startsWith("data:")) {
          const k = I.slice(5).trim();
          try {
            const E = JSON.parse(k);
            if (x === "progress")
              d?.(E.stage || "processing");
            else if (x === "token" || E.chunk || E.text) {
              const A = E.chunk ?? E.text ?? "";
              y += A, r(A);
            } else if (x === "done") {
              const A = E.answer ?? y;
              c(A);
            } else x === "error" && f(E.error || "An error occurred during agent processing");
          } catch {
            k && k !== "[DONE]" && (y += k, r(k));
          }
        }
      }
    }
    c(y);
  } catch (v) {
    const p = v instanceof Error ? v.message : String(v);
    f(p);
  }
}
var gt = /* @__PURE__ */ w('<div class="flex items-center gap-1.5 text-xs text-blue-400"><span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span><span class=capitalize>...'), xt = /* @__PURE__ */ w('<div class="max-w-3xl mx-auto flex flex-col space-y-1">'), pt = /* @__PURE__ */ w('<div class="saby-solid-landing flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden font-sans"><div><div class="p-3 border-b border-white/10 flex items-center justify-between"><button type=button class="flex items-center gap-2 w-full px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md transition-colors"><span>+</span><span>New Conversation</span></button></div><div class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin"><div class="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Recent Threads</div></div></div><div class="flex-1 flex flex-col h-full relative overflow-hidden"><div class="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/40 backdrop-blur-md"><div class="flex items-center gap-2"><button type=button class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"title="Toggle Sidebar"><svg class="w-4 h-4"viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2><line x1=3 y1=12 x2=21 y2=12></line><line x1=3 y1=6 x2=21 y2=6></line><line x1=3 y1=18 x2=21 y2=18></line></svg></button><span class="text-xs font-medium text-slate-300"></span></div></div><div class="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin"></div><div class="flex-shrink-0 w-full pt-2">'), mt = /* @__PURE__ */ w('<button type=button><span class=truncate></span><span class="text-[10px] text-slate-500 ml-1 flex-shrink-0">'), vt = /* @__PURE__ */ w('<div class="max-w-3xl mx-auto my-auto py-12 flex flex-col items-center text-center"><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 mb-4"><span>⚡</span><span>Saby Governed Intelligence Engine</span></div><h1 class="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-3">Run an Intelligent Organization</h1><p class="text-sm md:text-base text-slate-400 max-w-xl mb-8 leading-relaxed">Automate compliance audits, orchestrate staff workflows, and trigger verified multi-channel actions with enterprise governance.</p><div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full text-left mb-6">'), wt = /* @__PURE__ */ w('<button type=button class="p-4 rounded-xl border border-white/10 bg-slate-900/50 hover:bg-slate-900/90 hover:border-blue-500/40 transition-all text-left group"><div class="text-2xl mb-1.5"></div><div class="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors"></div><div class="text-xs text-slate-400 mt-1 leading-snug">');
const $t = [{
  icon: "📋",
  title: "Project Forms & Audits",
  desc: "Generate compliance checklists, incident reviews, and ISO templates",
  prompt: "Generate an audit checklist for our Q4 operational compliance review."
}, {
  icon: "👥",
  title: "People & Staff Intel",
  desc: "Inspect employee records, unit structures, and role permissions",
  prompt: "Inspect the current department roster and show active team leads."
}, {
  icon: "🛡️",
  title: "Governance & Approvals",
  desc: "Review multi-tier approval logs, policy drift, and security gates",
  prompt: "Show all pending approval requests and high-risk capability logs."
}, {
  icon: "📢",
  title: "Broadcast & Delivery",
  desc: "Compose multi-channel notifications across WhatsApp, SMS, and Email",
  prompt: "Draft an urgent operational update to broadcast to all managers."
}];
function yt(e) {
  const [t, n] = j([]), [l] = j([{
    id: "t1",
    title: "Q3 Operational Compliance",
    updatedAt: "2h ago",
    pinned: !0
  }, {
    id: "t2",
    title: "Lagos Office Staff Roster",
    updatedAt: "Yesterday"
  }, {
    id: "t3",
    title: "ISO-27001 Readiness Plan",
    updatedAt: "3 days ago"
  }]), [s, i] = j(e.initialThreadId || null), [o, r] = j(!1), [d, c] = j(""), [f, a] = j(!0), [S, v] = j("gpt-4o");
  let p;
  const _ = () => {
    p && (p.scrollTop = p.scrollHeight);
  }, T = async (h) => {
    if (!e.session?.accessToken && e.onAuthRequired) {
      e.onAuthRequired();
      return;
    }
    const b = `user_${Date.now()}`, g = `asst_${Date.now()}`, x = {
      id: b,
      role: "user",
      content: h,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }, m = {
      id: g,
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    n((k) => [...k, x, m]), r(!0), c("thinking"), setTimeout(_, 50);
    const I = e.streamEndpoint || `${e.apiBaseUrl || ""}/api/saby/agent/stream`;
    await Re({
      endpoint: I,
      message: h,
      threadId: s(),
      modelPreference: S(),
      accessToken: e.session?.accessToken,
      onProgress: (k) => {
        c(k);
      },
      onToken: (k) => {
        n((E) => E.map((A) => A.id === g ? {
          ...A,
          content: A.content + k
        } : A)), _();
      },
      onDone: (k) => {
        n((E) => E.map((A) => A.id === g ? {
          ...A,
          content: k || A.content,
          status: "completed"
        } : A)), r(!1), c(""), _();
      },
      onError: (k) => {
        n((E) => E.map((A) => A.id === g ? {
          ...A,
          content: `Error: ${k}`,
          status: "error"
        } : A)), r(!1), c(""), _();
      }
    });
  }, y = () => {
    n([]), i(null);
  };
  return (() => {
    var h = pt(), b = h.firstChild, g = b.firstChild, x = g.firstChild, m = g.nextSibling;
    m.firstChild;
    var I = b.nextSibling, k = I.firstChild, E = k.firstChild, A = E.firstChild, Z = A.nextSibling, D = k.nextSibling, U = D.nextSibling;
    x.$$click = y, u(m, $(te, {
      get each() {
        return l();
      },
      children: (L) => (() => {
        var N = mt(), V = N.firstChild, K = V.nextSibling;
        return N.$$click = () => {
          i(L.id), e.onThreadSelect?.(L.id);
        }, u(V, () => L.title), u(K, () => L.updatedAt), G(() => W(N, `w-full text-left px-2.5 py-2 rounded-lg text-xs truncate transition-colors flex items-center justify-between ${s() === L.id ? "bg-blue-600/20 text-blue-400 font-medium border border-blue-500/30" : "text-slate-300 hover:bg-white/5"}`)), N;
      })()
    }), null), A.$$click = () => a(!f()), u(Z, () => s() ? "Conversation" : "Saby Intelligent Agent"), u(k, $(F, {
      get when() {
        return o();
      },
      get children() {
        var L = gt(), N = L.firstChild, V = N.nextSibling, K = V.firstChild;
        return u(V, d, K), L;
      }
    }), null);
    var P = p;
    return typeof P == "function" ? xe(P, D) : p = D, u(D, $(F, {
      get when() {
        return t().length > 0;
      },
      get fallback() {
        return (
          /* Hero State (when empty) */
          (() => {
            var L = vt(), N = L.firstChild, V = N.nextSibling, K = V.nextSibling, C = K.nextSibling;
            return u(C, $(te, {
              each: $t,
              children: (O) => (() => {
                var q = wt(), z = q.firstChild, H = z.nextSibling, ie = H.nextSibling;
                return q.$$click = () => T(O.prompt), u(z, () => O.icon), u(H, () => O.title), u(ie, () => O.desc), q;
              })()
            })), L;
          })()
        );
      },
      get children() {
        var L = xt();
        return u(L, $(te, {
          get each() {
            return t();
          },
          children: (N, V) => $(Pe, {
            message: N,
            get isStreaming() {
              return le(() => !!o())() && V() === t().length - 1;
            }
          })
        })), L;
      }
    })), u(U, $(je, {
      get disabled() {
        return o();
      },
      get isStreaming() {
        return o();
      },
      get selectedModel() {
        return S();
      },
      onSelectModel: v,
      onSubmit: T
    })), G(() => W(b, `transition-all duration-300 border-r border-white/10 bg-slate-900/60 backdrop-blur-xl flex flex-col z-20 ${f() ? "w-64" : "w-0 overflow-hidden border-none"}`)), h;
  })();
}
re(["click"]);
var St = /* @__PURE__ */ w('<button type=button class="text-[11px] text-blue-400 hover:text-white transition-colors">Clear'), _t = /* @__PURE__ */ w('<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-blue-500/15 text-blue-400 border border-blue-500/30"><span>Active:</span><span class=font-semibold>'), Ct = /* @__PURE__ */ w('<div class="flex items-center gap-1.5 text-xs text-blue-400"><span class="w-2 h-2 rounded-full bg-blue-500 animate-ping"></span><span class=capitalize>...'), kt = /* @__PURE__ */ w('<div class="max-w-3xl mx-auto flex flex-col space-y-1">'), At = /* @__PURE__ */ w('<div class="saby-solid-intelligence flex h-full w-full bg-slate-950 text-slate-100 overflow-hidden font-sans"><div><div class="p-3 border-b border-white/10"><div class="flex items-center justify-between mb-2"><span class="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5"><span>📋</span><span>Project Forms</span></span></div><input type=text placeholder="Search forms &amp; audits..."class="w-full bg-slate-950/80 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500/50"></div><div class="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin"></div></div><div class="flex-1 flex flex-col h-full relative overflow-hidden"><div class="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-slate-950/50 backdrop-blur-md"><div class="flex items-center gap-2"><button type=button class="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"title="Toggle Forms"><svg class="w-4 h-4"viewBox="0 0 24 24"fill=none stroke=currentColor stroke-width=2><line x1=3 y1=12 x2=21 y2=12></line><line x1=3 y1=6 x2=21 y2=6></line><line x1=3 y1=18 x2=21 y2=18></line></svg></button><span class="text-xs font-semibold text-slate-200">Workspace Intelligence</span></div></div><div class="flex-1 overflow-y-auto px-4 py-6 scrollbar-thin"></div><div class="flex-shrink-0 w-full pt-2">'), Tt = /* @__PURE__ */ w('<span class="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 flex-shrink-0">'), It = /* @__PURE__ */ w('<p class="text-[11px] text-slate-400 line-clamp-2 mt-0.5 leading-snug">'), Et = /* @__PURE__ */ w('<button type=button><div class="flex items-center justify-between mb-0.5"><span class="font-semibold truncate">'), Mt = /* @__PURE__ */ w('<div class="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 max-w-lg mx-auto text-left mb-6"><div class="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">Focused Form Context</div><div class="text-sm font-bold text-white mb-1"></div><p class="text-xs text-slate-300"></p><div class="mt-3 flex flex-wrap gap-2"><button type=button class="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs transition-colors border border-blue-500/30">Audit Compliance Gaps</button><button type=button class="px-2.5 py-1 rounded-lg bg-blue-600/30 hover:bg-blue-600/50 text-blue-200 text-xs transition-colors border border-blue-500/30">Generate Review Questions'), jt = /* @__PURE__ */ w('<div class="max-w-3xl mx-auto my-auto py-10 text-center"><div class="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mx-auto mb-3 text-xl shadow-lg">⚡</div><h2 class="text-2xl font-bold text-white mb-2">Intelligence Workspace</h2><p class="text-xs md:text-sm text-slate-400 max-w-md mx-auto mb-6">Select a Project Form on the left to focus your inquiry, or ask Saby to synthesize organizational data.');
const Pt = [{
  id: "pf_1",
  title: "ISO-27001 Security Assessment",
  category: "Governance",
  description: "Audit access control and data classification"
}, {
  id: "pf_2",
  title: "Clinical Trial Protocol Review",
  category: "Compliance",
  description: "Review patient consent and ethics clearances"
}, {
  id: "pf_3",
  title: "Staff Onboarding & Induction",
  category: "HR",
  description: "Collect identity documents and role assignments"
}, {
  id: "pf_4",
  title: "Vendor Risk Evaluation",
  category: "Procurement",
  description: "Score 3rd-party vendor security posture"
}];
function Rt(e) {
  const [t, n] = j([]), [l, s] = j(e.activeProjectFormId || null), [i, o] = j(""), [r, d] = j(!1), [c, f] = j(""), [a, S] = j(!0), [v, p] = j("gpt-4o");
  let _;
  const T = () => e.projectForms || Pt, y = () => {
    const m = i().toLowerCase().trim();
    return m ? T().filter((I) => I.title.toLowerCase().includes(m) || I.category && I.category.toLowerCase().includes(m)) : T();
  }, h = () => T().find((m) => m.id === l()) || null, b = () => {
    _ && (_.scrollTop = _.scrollHeight);
  }, g = (m) => {
    s(m), e.onProjectFormSelect?.(m);
  }, x = async (m) => {
    const I = `user_${Date.now()}`, k = `asst_${Date.now()}`, E = {
      id: I,
      role: "user",
      content: m,
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    }, A = {
      id: k,
      role: "assistant",
      content: "",
      status: "streaming",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    n((D) => [...D, E, A]), d(!0), f("thinking"), setTimeout(b, 50);
    const Z = e.streamEndpoint || `${e.apiBaseUrl || ""}/api/saby/agent/stream`;
    await Re({
      endpoint: Z,
      message: m,
      activeProjectFormId: l(),
      modelPreference: v(),
      accessToken: e.session?.accessToken,
      onProgress: (D) => {
        f(D);
      },
      onToken: (D) => {
        n((U) => U.map((P) => P.id === k ? {
          ...P,
          content: P.content + D
        } : P)), b();
      },
      onDone: (D) => {
        n((U) => U.map((P) => P.id === k ? {
          ...P,
          content: D || P.content,
          status: "completed"
        } : P)), d(!1), f(""), b();
      },
      onError: (D) => {
        n((U) => U.map((P) => P.id === k ? {
          ...P,
          content: `Error: ${D}`,
          status: "error"
        } : P)), d(!1), f(""), b();
      }
    });
  };
  return (() => {
    var m = At(), I = m.firstChild, k = I.firstChild, E = k.firstChild;
    E.firstChild;
    var A = E.nextSibling, Z = k.nextSibling, D = I.nextSibling, U = D.firstChild, P = U.firstChild, L = P.firstChild;
    L.nextSibling;
    var N = U.nextSibling, V = N.nextSibling;
    u(E, $(F, {
      get when() {
        return l();
      },
      get children() {
        var C = St();
        return C.$$click = () => g(null), C;
      }
    }), null), A.$$input = (C) => o(C.currentTarget.value), u(Z, $(te, {
      get each() {
        return y();
      },
      children: (C) => (() => {
        var O = Et(), q = O.firstChild, z = q.firstChild;
        return O.$$click = () => g(l() === C.id ? null : C.id), u(z, () => C.title), u(q, $(F, {
          get when() {
            return C.category;
          },
          get children() {
            var H = Tt();
            return u(H, () => C.category), H;
          }
        }), null), u(O, $(F, {
          get when() {
            return C.description;
          },
          get children() {
            var H = It();
            return u(H, () => C.description), H;
          }
        }), null), G(() => W(O, `w-full text-left p-2.5 rounded-xl text-xs transition-all border ${l() === C.id ? "bg-blue-600/20 border-blue-500/50 text-blue-300 shadow-sm" : "bg-white/[0.02] border-transparent hover:bg-white/5 hover:border-white/10 text-slate-300"}`)), O;
      })()
    })), L.$$click = () => S(!a()), u(P, $(F, {
      get when() {
        return h();
      },
      get children() {
        var C = _t(), O = C.firstChild, q = O.nextSibling;
        return u(q, () => h().title), C;
      }
    }), null), u(U, $(F, {
      get when() {
        return r();
      },
      get children() {
        var C = Ct(), O = C.firstChild, q = O.nextSibling, z = q.firstChild;
        return u(q, c, z), C;
      }
    }), null);
    var K = _;
    return typeof K == "function" ? xe(K, N) : _ = N, u(N, $(F, {
      get when() {
        return t().length > 0;
      },
      get fallback() {
        return (() => {
          var C = jt(), O = C.firstChild, q = O.nextSibling;
          return q.nextSibling, u(C, $(F, {
            get when() {
              return h();
            },
            get children() {
              var z = Mt(), H = z.firstChild, ie = H.nextSibling, pe = ie.nextSibling, Fe = pe.nextSibling, me = Fe.firstChild, Oe = me.nextSibling;
              return u(ie, () => h().title), u(pe, () => h().description), me.$$click = () => x(`Audit compliance gaps for ${h().title}`), Oe.$$click = () => x(`Generate review questions for ${h().title}`), z;
            }
          }), null), C;
        })();
      },
      get children() {
        var C = kt();
        return u(C, $(te, {
          get each() {
            return t();
          },
          children: (O, q) => $(Pe, {
            message: O,
            get isStreaming() {
              return le(() => !!r())() && q() === t().length - 1;
            }
          })
        })), C;
      }
    })), u(V, $(je, {
      get placeholder() {
        return le(() => !!h())() ? `Ask about ${h().title}...` : "Ask about project forms, audits, staff, governance...";
      },
      get activeProjectFormTitle() {
        return h()?.title;
      },
      onClearActiveForm: () => g(null),
      get disabled() {
        return r();
      },
      get isStreaming() {
        return r();
      },
      get selectedModel() {
        return v();
      },
      onSelectModel: p,
      onSubmit: x
    })), G(() => W(I, `transition-all duration-300 border-r border-white/10 bg-slate-900/70 backdrop-blur-xl flex flex-col z-20 ${a() ? "w-72" : "w-0 overflow-hidden border-none"}`)), G(() => A.value = i()), m;
  })();
}
re(["click", "input"]);
function Ft(e, t = {}) {
  return Me(() => $(yt, t), e);
}
function Ot(e, t = {}) {
  return Me(() => $(Rt, t), e);
}
typeof window < "u" && (window.SabyIsland = {
  mountLandingChat: Ft,
  mountIntelligenceChat: Ot
});
export {
  dt as SabyApprovalCard,
  je as SabyFloatingChatPill,
  Pe as SabyMessageBubble,
  Rt as SolidIntelligenceChatView,
  yt as SolidLandingChatView,
  Ot as mountIntelligenceChat,
  Ft as mountLandingChat
};
