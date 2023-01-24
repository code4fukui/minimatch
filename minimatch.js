// deno-fmt-ignore-file
// deno-lint-ignore-file
// This code was bundled using `deno bundle` and it's not recommended to edit it manually

const getName = (fn)=>{
    const n = fn.lastIndexOf("/");
    if (n < 0) {
        return fn;
    }
    return fn.substring(n + 1);
};
const __default = {
    argv: [
        "deno",
        getName(Deno.mainModule),
        ...Deno.args
    ],
    stderr: {
        isTTY: true,
        columns: 80,
        write: (s)=>{
            console.debug(s);
        }
    },
    stdout: {
        isTTY: true,
        columns: 80,
        write: (s)=>{
            console.log(s);
        }
    },
    exit: (n)=>Deno.exit(n),
    on: (signal, func)=>{},
    env: Deno.env.toObject(),
    platform: "esm"
};
function balanced(a, b, str) {
    if (a instanceof RegExp) a = maybeMatch(a, str);
    if (b instanceof RegExp) b = maybeMatch(b, str);
    const r = range(a, b, str);
    return r && {
        start: r[0],
        end: r[1],
        pre: str.slice(0, r[0]),
        body: str.slice(r[0] + a.length, r[1]),
        post: str.slice(r[1] + b.length)
    };
}
function maybeMatch(reg, str) {
    const m = str.match(reg);
    return m ? m[0] : null;
}
balanced.range = range;
function range(a, b, str) {
    let begs, beg, left, right, result;
    let ai = str.indexOf(a);
    let bi = str.indexOf(b, ai + 1);
    let i = ai;
    if (ai >= 0 && bi > 0) {
        if (a === b) {
            return [
                ai,
                bi
            ];
        }
        begs = [];
        left = str.length;
        while(i >= 0 && !result){
            if (i === ai) {
                begs.push(i);
                ai = str.indexOf(a, i + 1);
            } else if (begs.length === 1) {
                result = [
                    begs.pop(),
                    bi
                ];
            } else {
                beg = begs.pop();
                if (beg < left) {
                    left = beg;
                    right = bi;
                }
                bi = str.indexOf(b, i + 1);
            }
            i = ai < bi && ai >= 0 ? ai : bi;
        }
        if (begs.length) {
            result = [
                left,
                right
            ];
        }
    }
    return result;
}
const escSlash = '\0SLASH' + Math.random() + '\0';
const escOpen = '\0OPEN' + Math.random() + '\0';
const escClose = '\0CLOSE' + Math.random() + '\0';
const escComma = '\0COMMA' + Math.random() + '\0';
const escPeriod = '\0PERIOD' + Math.random() + '\0';
function numeric(str) {
    return parseInt(str, 10) == str ? parseInt(str, 10) : str.charCodeAt(0);
}
function escapeBraces(str) {
    return str.split('\\\\').join(escSlash).split('\\{').join(escOpen).split('\\}').join(escClose).split('\\,').join(escComma).split('\\.').join(escPeriod);
}
function unescapeBraces(str) {
    return str.split(escSlash).join('\\').split(escOpen).join('{').split(escClose).join('}').split(escComma).join(',').split(escPeriod).join('.');
}
function parseCommaParts(str) {
    if (!str) return [
        ''
    ];
    const parts = [];
    const m = balanced('{', '}', str);
    if (!m) return str.split(',');
    const { pre , body , post  } = m;
    const p = pre.split(',');
    p[p.length - 1] += '{' + body + '}';
    const postParts = parseCommaParts(post);
    if (post.length) {
        p[p.length - 1] += postParts.shift();
        p.push.apply(p, postParts);
    }
    parts.push.apply(parts, p);
    return parts;
}
function expandTop(str) {
    if (!str) return [];
    if (str.slice(0, 2) === '{}') {
        str = '\\{\\}' + str.slice(2);
    }
    return expand(escapeBraces(str), true).map(unescapeBraces);
}
function embrace(str) {
    return '{' + str + '}';
}
function isPadded(el) {
    return /^-?0\d/.test(el);
}
function lte(i, y) {
    return i <= y;
}
function gte(i, y) {
    return i >= y;
}
function expand(str, isTop) {
    const expansions = [];
    const m = balanced('{', '}', str);
    if (!m) return [
        str
    ];
    const pre = m.pre;
    const post = m.post.length ? expand(m.post, false) : [
        ''
    ];
    if (/\$$/.test(m.pre)) {
        for(let k = 0; k < post.length; k++){
            const expansion = pre + '{' + m.body + '}' + post[k];
            expansions.push(expansion);
        }
    } else {
        const isNumericSequence = /^-?\d+\.\.-?\d+(?:\.\.-?\d+)?$/.test(m.body);
        const isAlphaSequence = /^[a-zA-Z]\.\.[a-zA-Z](?:\.\.-?\d+)?$/.test(m.body);
        const isSequence = isNumericSequence || isAlphaSequence;
        const isOptions = m.body.indexOf(',') >= 0;
        if (!isSequence && !isOptions) {
            if (m.post.match(/,.*\}/)) {
                str = m.pre + '{' + m.body + escClose + m.post;
                return expand(str);
            }
            return [
                str
            ];
        }
        let n;
        if (isSequence) {
            n = m.body.split(/\.\./);
        } else {
            n = parseCommaParts(m.body);
            if (n.length === 1) {
                n = expand(n[0], false).map(embrace);
                if (n.length === 1) {
                    return post.map(function(p) {
                        return m.pre + n[0] + p;
                    });
                }
            }
        }
        let N;
        if (isSequence) {
            const x = numeric(n[0]);
            const y = numeric(n[1]);
            const width = Math.max(n[0].length, n[1].length);
            let incr = n.length == 3 ? Math.abs(numeric(n[2])) : 1;
            let test = lte;
            const reverse = y < x;
            if (reverse) {
                incr *= -1;
                test = gte;
            }
            const pad = n.some(isPadded);
            N = [];
            for(let i = x; test(i, y); i += incr){
                let c;
                if (isAlphaSequence) {
                    c = String.fromCharCode(i);
                    if (c === '\\') c = '';
                } else {
                    c = String(i);
                    if (pad) {
                        const need = width - c.length;
                        if (need > 0) {
                            const z = new Array(need + 1).join('0');
                            if (i < 0) c = '-' + z + c.slice(1);
                            else c = z + c;
                        }
                    }
                }
                N.push(c);
            }
        } else {
            N = [];
            for(let j = 0; j < n.length; j++){
                N.push.apply(N, expand(n[j], false));
            }
        }
        for(let j1 = 0; j1 < N.length; j1++){
            for(let k1 = 0; k1 < post.length; k1++){
                const expansion1 = pre + N[j1] + post[k1];
                if (!isTop || isSequence || expansion1) expansions.push(expansion1);
            }
        }
    }
    return expansions;
}
const minimatch = (p, pattern, options = {})=>{
    assertValidPattern(pattern);
    if (!options.nocomment && pattern.charAt(0) === '#') {
        return false;
    }
    return new Minimatch(pattern, options).match(p);
};
const platform = typeof __default === 'object' && __default ? typeof __default.env === 'object' && __default.env && __default.env.__MINIMATCH_TESTING_PLATFORM__ || __default.platform : 'posix';
const isWindows = platform === 'win32';
const path = isWindows ? {
    sep: '\\'
} : {
    sep: '/'
};
const sep = path.sep;
minimatch.sep = sep;
const GLOBSTAR = Symbol('globstar **');
minimatch.GLOBSTAR = GLOBSTAR;
const plTypes = {
    '!': {
        open: '(?:(?!(?:',
        close: '))[^/]*?)'
    },
    '?': {
        open: '(?:',
        close: ')?'
    },
    '+': {
        open: '(?:',
        close: ')+'
    },
    '*': {
        open: '(?:',
        close: ')*'
    },
    '@': {
        open: '(?:',
        close: ')'
    }
};
const qmark = '[^/]';
const star = qmark + '*?';
const twoStarDot = '(?:(?!(?:\\/|^)(?:\\.{1,2})($|\\/)).)*?';
const twoStarNoDot = '(?:(?!(?:\\/|^)\\.).)*?';
const charSet = (s)=>s.split('').reduce((set, c)=>{
        set[c] = true;
        return set;
    }, {});
const reSpecials = charSet('().*{}+?[]^$\\!');
const addPatternStartSet = charSet('[.(');
const filter = (pattern, options = {})=>(p)=>minimatch(p, pattern, options);
minimatch.filter = filter;
const ext = (a, b = {})=>Object.assign({}, a, b);
const defaults = (def)=>{
    if (!def || typeof def !== 'object' || !Object.keys(def).length) {
        return minimatch;
    }
    const orig = minimatch;
    const m = (p, pattern, options = {})=>orig(p, pattern, ext(def, options));
    return Object.assign(m, {
        Minimatch: class Minimatch extends orig.Minimatch {
            constructor(pattern, options = {}){
                super(pattern, ext(def, options));
            }
            static defaults(options) {
                return orig.defaults(ext(def, options)).Minimatch;
            }
        },
        filter: (pattern, options = {})=>orig.filter(pattern, ext(def, options)),
        defaults: (options)=>orig.defaults(ext(def, options)),
        makeRe: (pattern, options = {})=>orig.makeRe(pattern, ext(def, options)),
        braceExpand: (pattern, options = {})=>orig.braceExpand(pattern, ext(def, options)),
        match: (list, pattern, options = {})=>orig.match(list, pattern, ext(def, options)),
        sep: orig.sep,
        GLOBSTAR: GLOBSTAR
    });
};
minimatch.defaults = defaults;
const braceExpand = (pattern, options = {})=>{
    assertValidPattern(pattern);
    if (options.nobrace || !/\{(?:(?!\{).)*\}/.test(pattern)) {
        return [
            pattern
        ];
    }
    return expandTop(pattern);
};
minimatch.braceExpand = braceExpand;
const MAX_PATTERN_LENGTH = 1024 * 64;
const assertValidPattern = (pattern)=>{
    if (typeof pattern !== 'string') {
        throw new TypeError('invalid pattern');
    }
    if (pattern.length > MAX_PATTERN_LENGTH) {
        throw new TypeError('pattern is too long');
    }
};
const SUBPARSE = Symbol('subparse');
const makeRe = (pattern, options = {})=>new Minimatch(pattern, options).makeRe();
minimatch.makeRe = makeRe;
const match = (list, pattern, options = {})=>{
    const mm = new Minimatch(pattern, options);
    list = list.filter((f)=>mm.match(f));
    if (mm.options.nonull && !list.length) {
        list.push(pattern);
    }
    return list;
};
minimatch.match = match;
const globUnescape = (s)=>s.replace(/\\(.)/g, '$1');
const charUnescape = (s)=>s.replace(/\\([^-\]])/g, '$1');
const regExpEscape = (s)=>s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
const braExpEscape = (s)=>s.replace(/[[\]\\]/g, '\\$&');
class Minimatch {
    options;
    set;
    pattern;
    windowsPathsNoEscape;
    nonegate;
    negate;
    comment;
    empty;
    preserveMultipleSlashes;
    partial;
    globSet;
    globParts;
    regexp;
    constructor(pattern, options = {}){
        assertValidPattern(pattern);
        options = options || {};
        this.options = options;
        this.pattern = pattern;
        this.windowsPathsNoEscape = !!options.windowsPathsNoEscape || options.allowWindowsEscape === false;
        if (this.windowsPathsNoEscape) {
            this.pattern = this.pattern.replace(/\\/g, '/');
        }
        this.preserveMultipleSlashes = !!options.preserveMultipleSlashes;
        this.regexp = null;
        this.negate = false;
        this.nonegate = !!options.nonegate;
        this.comment = false;
        this.empty = false;
        this.partial = !!options.partial;
        this.globSet = [];
        this.globParts = [];
        this.set = [];
        this.make();
    }
    debug(..._) {}
    make() {
        const pattern = this.pattern;
        const options = this.options;
        if (!options.nocomment && pattern.charAt(0) === '#') {
            this.comment = true;
            return;
        }
        if (!pattern) {
            this.empty = true;
            return;
        }
        this.parseNegate();
        this.globSet = this.braceExpand();
        if (options.debug) {
            this.debug = (...args)=>console.error(...args);
        }
        this.debug(this.pattern, this.globSet);
        const rawGlobParts = this.globSet.map((s)=>this.slashSplit(s));
        this.globParts = this.options.noglobstar ? rawGlobParts : rawGlobParts.map((parts)=>parts.reduce((set, part)=>{
                if (part !== '**' || set[set.length - 1] !== '**') {
                    set.push(part);
                }
                return set;
            }, []));
        this.debug(this.pattern, this.globParts);
        let set = this.globParts.map((s, _, __)=>s.map((ss)=>this.parse(ss)));
        this.debug(this.pattern, set);
        this.set = set.filter((s)=>s.indexOf(false) === -1);
        if (isWindows) {
            for(let i = 0; i < this.set.length; i++){
                const p = this.set[i];
                if (p[0] === '' && p[1] === '' && this.globParts[i][2] === '?' && typeof p[3] === 'string' && /^[a-z]:$/i.test(p[3])) {
                    p[2] = '?';
                }
            }
        }
        this.debug(this.pattern, this.set);
    }
    parseNegate() {
        if (this.nonegate) return;
        const pattern = this.pattern;
        let negate = false;
        let negateOffset = 0;
        for(let i = 0; i < pattern.length && pattern.charAt(i) === '!'; i++){
            negate = !negate;
            negateOffset++;
        }
        if (negateOffset) this.pattern = pattern.slice(negateOffset);
        this.negate = negate;
    }
    matchOne(file, pattern, partial = false) {
        const options = this.options;
        if (isWindows) {
            const fileUNC = file[0] === '' && file[1] === '' && file[2] === '?' && typeof file[3] === 'string' && /^[a-z]:$/i.test(file[3]);
            const patternUNC = pattern[0] === '' && pattern[1] === '' && pattern[2] === '?' && typeof pattern[3] === 'string' && /^[a-z]:$/i.test(pattern[3]);
            if (fileUNC && patternUNC) {
                const fd = file[3];
                const pd = pattern[3];
                if (fd.toLowerCase() === pd.toLowerCase()) {
                    file[3] = pd;
                }
            } else if (patternUNC && typeof file[0] === 'string') {
                const pd1 = pattern[3];
                const fd1 = file[0];
                if (pd1.toLowerCase() === fd1.toLowerCase()) {
                    pattern[3] = fd1;
                    pattern = pattern.slice(3);
                }
            } else if (fileUNC && typeof pattern[0] === 'string') {
                const fd2 = file[3];
                if (fd2.toLowerCase() === pattern[0].toLowerCase()) {
                    pattern[0] = fd2;
                    file = file.slice(3);
                }
            }
        }
        this.debug('matchOne', this, {
            file,
            pattern
        });
        this.debug('matchOne', file.length, pattern.length);
        for(var fi = 0, pi = 0, fl = file.length, pl = pattern.length; fi < fl && pi < pl; fi++, pi++){
            this.debug('matchOne loop');
            var p = pattern[pi];
            var f = file[fi];
            this.debug(pattern, p, f);
            if (p === false) {
                return false;
            }
            if (p === GLOBSTAR) {
                this.debug('GLOBSTAR', [
                    pattern,
                    p,
                    f
                ]);
                var fr = fi;
                var pr = pi + 1;
                if (pr === pl) {
                    this.debug('** at the end');
                    for(; fi < fl; fi++){
                        if (file[fi] === '.' || file[fi] === '..' || !options.dot && file[fi].charAt(0) === '.') return false;
                    }
                    return true;
                }
                while(fr < fl){
                    var swallowee = file[fr];
                    this.debug('\nglobstar while', file, fr, pattern, pr, swallowee);
                    if (this.matchOne(file.slice(fr), pattern.slice(pr), partial)) {
                        this.debug('globstar found match!', fr, fl, swallowee);
                        return true;
                    } else {
                        if (swallowee === '.' || swallowee === '..' || !options.dot && swallowee.charAt(0) === '.') {
                            this.debug('dot detected!', file, fr, pattern, pr);
                            break;
                        }
                        this.debug('globstar swallow a segment, and continue');
                        fr++;
                    }
                }
                if (partial) {
                    this.debug('\n>>> no match, partial?', file, fr, pattern, pr);
                    if (fr === fl) {
                        return true;
                    }
                }
                return false;
            }
            let hit;
            if (typeof p === 'string') {
                hit = f === p;
                this.debug('string match', p, f, hit);
            } else {
                hit = p.test(f);
                this.debug('pattern match', p, f, hit);
            }
            if (!hit) return false;
        }
        if (fi === fl && pi === pl) {
            return true;
        } else if (fi === fl) {
            return partial;
        } else if (pi === pl) {
            return fi === fl - 1 && file[fi] === '';
        } else {
            throw new Error('wtf?');
        }
    }
    braceExpand() {
        return braceExpand(this.pattern, this.options);
    }
    parse(pattern, isSub) {
        assertValidPattern(pattern);
        const options = this.options;
        if (pattern === '**') {
            if (!options.noglobstar) return GLOBSTAR;
            else pattern = '*';
        }
        if (pattern === '') return '';
        let re = '';
        let hasMagic = false;
        let escaping = false;
        const patternListStack = [];
        const negativeLists = [];
        let stateChar = false;
        let inClass = false;
        let reClassStart = -1;
        let classStart = -1;
        let cs;
        let pl;
        let sp;
        let dotTravAllowed = pattern.charAt(0) === '.';
        let dotFileAllowed = options.dot || dotTravAllowed;
        const patternStart = ()=>dotTravAllowed ? '' : dotFileAllowed ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)';
        const subPatternStart = (p)=>p.charAt(0) === '.' ? '' : options.dot ? '(?!(?:^|\\/)\\.{1,2}(?:$|\\/))' : '(?!\\.)';
        const clearStateChar = ()=>{
            if (stateChar) {
                switch(stateChar){
                    case '*':
                        re += star;
                        hasMagic = true;
                        break;
                    case '?':
                        re += qmark;
                        hasMagic = true;
                        break;
                    default:
                        re += '\\' + stateChar;
                        break;
                }
                this.debug('clearStateChar %j %j', stateChar, re);
                stateChar = false;
            }
        };
        for(let i = 0, c; i < pattern.length && (c = pattern.charAt(i)); i++){
            this.debug('%s\t%s %s %j', pattern, i, re, c);
            if (escaping) {
                if (c === '/') {
                    return false;
                }
                if (reSpecials[c]) {
                    re += '\\';
                }
                re += c;
                escaping = false;
                continue;
            }
            switch(c){
                case '/':
                    {
                        return false;
                    }
                case '\\':
                    if (inClass && pattern.charAt(i + 1) === '-') {
                        re += c;
                        continue;
                    }
                    clearStateChar();
                    escaping = true;
                    continue;
                case '?':
                case '*':
                case '+':
                case '@':
                case '!':
                    this.debug('%s\t%s %s %j <-- stateChar', pattern, i, re, c);
                    if (inClass) {
                        this.debug('  in class');
                        if (c === '!' && i === classStart + 1) c = '^';
                        re += c;
                        continue;
                    }
                    this.debug('call clearStateChar %j', stateChar);
                    clearStateChar();
                    stateChar = c;
                    if (options.noext) clearStateChar();
                    continue;
                case '(':
                    {
                        if (inClass) {
                            re += '(';
                            continue;
                        }
                        if (!stateChar) {
                            re += '\\(';
                            continue;
                        }
                        const plEntry = {
                            type: stateChar,
                            start: i - 1,
                            reStart: re.length,
                            open: plTypes[stateChar].open,
                            close: plTypes[stateChar].close
                        };
                        this.debug(this.pattern, '\t', plEntry);
                        patternListStack.push(plEntry);
                        re += plEntry.open;
                        if (plEntry.start === 0 && plEntry.type !== '!') {
                            dotTravAllowed = true;
                            re += subPatternStart(pattern.slice(i + 1));
                        }
                        this.debug('plType %j %j', stateChar, re);
                        stateChar = false;
                        continue;
                    }
                case ')':
                    {
                        const plEntry1 = patternListStack[patternListStack.length - 1];
                        if (inClass || !plEntry1) {
                            re += '\\)';
                            continue;
                        }
                        patternListStack.pop();
                        clearStateChar();
                        hasMagic = true;
                        pl = plEntry1;
                        re += pl.close;
                        if (pl.type === '!') {
                            negativeLists.push(Object.assign(pl, {
                                reEnd: re.length
                            }));
                        }
                        continue;
                    }
                case '|':
                    {
                        const plEntry2 = patternListStack[patternListStack.length - 1];
                        if (inClass || !plEntry2) {
                            re += '\\|';
                            continue;
                        }
                        clearStateChar();
                        re += '|';
                        if (plEntry2.start === 0 && plEntry2.type !== '!') {
                            dotTravAllowed = true;
                            re += subPatternStart(pattern.slice(i + 1));
                        }
                        continue;
                    }
                case '[':
                    clearStateChar();
                    if (inClass) {
                        re += '\\' + c;
                        continue;
                    }
                    inClass = true;
                    classStart = i;
                    reClassStart = re.length;
                    re += c;
                    continue;
                case ']':
                    if (i === classStart + 1 || !inClass) {
                        re += '\\' + c;
                        continue;
                    }
                    cs = pattern.substring(classStart + 1, i);
                    try {
                        RegExp('[' + braExpEscape(charUnescape(cs)) + ']');
                        re += c;
                    } catch (er) {
                        re = re.substring(0, reClassStart) + '(?:$.)';
                    }
                    hasMagic = true;
                    inClass = false;
                    continue;
                default:
                    clearStateChar();
                    if (reSpecials[c] && !(c === '^' && inClass)) {
                        re += '\\';
                    }
                    re += c;
                    break;
            }
        }
        if (inClass) {
            cs = pattern.slice(classStart + 1);
            sp = this.parse(cs, SUBPARSE);
            re = re.substring(0, reClassStart) + '\\[' + sp[0];
            hasMagic = hasMagic || sp[1];
        }
        for(pl = patternListStack.pop(); pl; pl = patternListStack.pop()){
            let tail;
            tail = re.slice(pl.reStart + pl.open.length);
            this.debug(this.pattern, 'setting tail', re, pl);
            tail = tail.replace(/((?:\\{2}){0,64})(\\?)\|/g, (_, $1, $2)=>{
                if (!$2) {
                    $2 = '\\';
                }
                return $1 + $1 + $2 + '|';
            });
            this.debug('tail=%j\n   %s', tail, tail, pl, re);
            const t = pl.type === '*' ? star : pl.type === '?' ? qmark : '\\' + pl.type;
            hasMagic = true;
            re = re.slice(0, pl.reStart) + t + '\\(' + tail;
        }
        clearStateChar();
        if (escaping) {
            re += '\\\\';
        }
        const addPatternStart = addPatternStartSet[re.charAt(0)];
        for(let n = negativeLists.length - 1; n > -1; n--){
            const nl = negativeLists[n];
            const nlBefore = re.slice(0, nl.reStart);
            const nlFirst = re.slice(nl.reStart, nl.reEnd - 8);
            let nlAfter = re.slice(nl.reEnd);
            const nlLast = re.slice(nl.reEnd - 8, nl.reEnd) + nlAfter;
            const closeParensBefore = nlBefore.split(')').length;
            const openParensBefore = nlBefore.split('(').length - closeParensBefore;
            let cleanAfter = nlAfter;
            for(let i1 = 0; i1 < openParensBefore; i1++){
                cleanAfter = cleanAfter.replace(/\)[+*?]?/, '');
            }
            nlAfter = cleanAfter;
            const dollar = nlAfter === '' && isSub !== SUBPARSE ? '(?:$|\\/)' : '';
            re = nlBefore + nlFirst + nlAfter + dollar + nlLast;
        }
        if (re !== '' && hasMagic) {
            re = '(?=.)' + re;
        }
        if (addPatternStart) {
            re = patternStart() + re;
        }
        if (isSub === SUBPARSE) {
            return [
                re,
                hasMagic
            ];
        }
        if (options.nocase && !hasMagic) {
            hasMagic = pattern.toUpperCase() !== pattern.toLowerCase();
        }
        if (!hasMagic) {
            return globUnescape(pattern);
        }
        const flags = options.nocase ? 'i' : '';
        try {
            return Object.assign(new RegExp('^' + re + '$', flags), {
                _glob: pattern,
                _src: re
            });
        } catch (er1) {
            this.debug('invalid regexp', er1);
            return new RegExp('$.');
        }
    }
    makeRe() {
        if (this.regexp || this.regexp === false) return this.regexp;
        const set = this.set;
        if (!set.length) {
            this.regexp = false;
            return this.regexp;
        }
        const options = this.options;
        const twoStar = options.noglobstar ? star : options.dot ? twoStarDot : twoStarNoDot;
        const flags = options.nocase ? 'i' : '';
        let re = set.map((pattern)=>{
            const pp = pattern.map((p)=>typeof p === 'string' ? regExpEscape(p) : p === GLOBSTAR ? GLOBSTAR : p._src);
            pp.forEach((p, i)=>{
                const next = pp[i + 1];
                const prev = pp[i - 1];
                if (p !== GLOBSTAR || prev === GLOBSTAR) {
                    return;
                }
                if (prev === undefined) {
                    if (next !== undefined && next !== GLOBSTAR) {
                        pp[i + 1] = '(?:\\/|' + twoStar + '\\/)?' + next;
                    } else {
                        pp[i] = twoStar;
                    }
                } else if (next === undefined) {
                    pp[i - 1] = prev + '(?:\\/|' + twoStar + ')?';
                } else if (next !== GLOBSTAR) {
                    pp[i - 1] = prev + '(?:\\/|\\/' + twoStar + '\\/)' + next;
                    pp[i + 1] = GLOBSTAR;
                }
            });
            return pp.filter((p)=>p !== GLOBSTAR).join('/');
        }).join('|');
        re = '^(?:' + re + ')$';
        if (this.negate) re = '^(?!' + re + ').*$';
        try {
            this.regexp = new RegExp(re, flags);
        } catch (ex) {
            this.regexp = false;
        }
        return this.regexp;
    }
    slashSplit(p) {
        if (this.preserveMultipleSlashes) {
            return p.split('/');
        } else if (isWindows && /^\/\/[^\/]+/.test(p)) {
            return [
                '',
                ...p.split(/\/+/)
            ];
        } else {
            return p.split(/\/+/);
        }
    }
    match(f, partial = this.partial) {
        this.debug('match', f, this.pattern);
        if (this.comment) {
            return false;
        }
        if (this.empty) {
            return f === '';
        }
        if (f === '/' && partial) {
            return true;
        }
        const options = this.options;
        if (path.sep !== '/') {
            f = f.split(path.sep).join('/');
        }
        const ff = this.slashSplit(f);
        this.debug(this.pattern, 'split', ff);
        const set = this.set;
        this.debug(this.pattern, 'set', set);
        let filename = ff[ff.length - 1];
        if (!filename) {
            for(let i = ff.length - 2; !filename && i >= 0; i--){
                filename = ff[i];
            }
        }
        for(let i1 = 0; i1 < set.length; i1++){
            const pattern = set[i1];
            let file = ff;
            if (options.matchBase && pattern.length === 1) {
                file = [
                    filename
                ];
            }
            const hit = this.matchOne(file, pattern, partial);
            if (hit) {
                if (options.flipNegate) {
                    return true;
                }
                return !this.negate;
            }
        }
        if (options.flipNegate) {
            return false;
        }
        return this.negate;
    }
    static defaults(def) {
        return minimatch.defaults(def).Minimatch;
    }
}
minimatch.Minimatch = Minimatch;
export { minimatch as minimatch };
export { minimatch as default };
export { sep as sep };
export { GLOBSTAR as GLOBSTAR };
export { filter as filter };
export { defaults as defaults };
export { braceExpand as braceExpand };
export { makeRe as makeRe };
export { match as match };
export { Minimatch as Minimatch };
