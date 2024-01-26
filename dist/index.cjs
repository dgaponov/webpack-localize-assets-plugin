"use strict";var G=require("path"),V=require("astring"),B=require("webpack/lib/WebpackError.js"),Oe=require("module"),Z=require("webpack"),Q=require("assert"),X=require("acorn"),Y=require("crypto"),j=require("webpack-sources"),ee=require("magic-string");function v(e){return e&&typeof e=="object"&&"default"in e?e:{default:e}}var te=v(G),y=v(B),ne=v(Z),q=v(Q),oe=v(Y),se=v(ee),d="webpack-localize-assets-plugin";const ae=Object.prototype.hasOwnProperty;function S(e,t){return ae.call(e,t)}function re(e){if(!e)throw new Error("Options are required");if(!e.locales)throw new Error("Locales are required");if(Object.keys(e.locales).length===0)throw new Error("locales must contain at least one locale");if(e.sourceMapForLocales&&e.sourceMapForLocales.some(t=>!S(e.locales,t)))throw new Error("sourceMapForLocales must contain valid locales");if(e.localizeCompiler){if(!e.functionResolver&&Object.keys(e.localizeCompiler).length===0)throw new Error("localizeCompiler can't be an empty object");if(e.functionName)throw new Error("Can't use localizeCompiler and also specify functionName")}}const ce=(e,t)=>{const s=e.readFileSync(t).toString();return JSON.parse(s)};function le({inputFileSystem:e},t){const s={},n=new Set;for(const o in t){if(!S(t,o))continue;const a=t[o];if(typeof a=="string"){const c=te.default.resolve(a);s[o]=ce(e,c),n.add(c)}else s[o]=a}return{names:Object.keys(s),data:s,paths:n}}const $=e=>V.generate(e,{indent:"",lineEnd:""});function O(e,t,s,n){const o=t.callNode.arguments.map($),a=t.callNode.callee.name;return(typeof e=="function"?e:e[a]).call(t,o,s,n)}var F=require;const ie=e=>{const[t]=e.version?e.version.split("."):[];return t==="5"},E=e=>"processAssets"in e.hooks,{toConstantDependency:ue}=ie(ne.default)?F("webpack/lib/javascript/JavascriptParserHelpers"):F("webpack/lib/ParserHelpers"),fe=(e,t,s)=>{if(E(e)){for(const n of e.chunks){if(n.files.has(t))for(const o of s)n.files.add(o);if(n.auxiliaryFiles.has(t))for(const o of s)n.auxiliaryFiles.add(o)}e.deleteAsset(t)}else{delete e.assets[t];for(const n of e.chunks){const o=n.files.indexOf(t);o>-1&&n.files.splice(o,1,...s)}}},L=(e,t)=>{e.find(n=>n.message===t.message)||e.push(t)},M=(e,t)=>{"addWarning"in e?e.addWarning(t):L(e.warnings,t)},de=(e,t)=>{"addError"in e?e.addError(t):L(e.errors,t)},N=Symbol("CustomTranslationCallTag"),he=(e,t,s)=>{const n=o=>{var a,c;if((c=(a=o==null?void 0:o.state)==null?void 0:a.module)!=null&&c.resource.includes("node_modules"))return;const r={};Array.isArray(t)&&t.forEach(l=>{r[l]=void 0}),typeof t=="function"&&o.hooks.preDeclarator.tap(d,l=>{if(typeof t=="function"){const i=t(l);i&&(r[i.functionName]=i.namespace)}l.id.type==="Identifier"&&l.id.name in r&&o.tagVariable(l.id.name,N)});const u=l=>{const i=l;i.callee.type==="Identifier"&&i.callee.name in r&&s(i.callee.name,o,i,r[i.callee.name])};Array.isArray(t)&&t.forEach(l=>{o.hooks.call.for(l).tap(d,u)}),o.hooks.call.for(N).tap(d,u)};e.hooks.parser.for("javascript/auto").tap(d,n),e.hooks.parser.for("javascript/dynamic").tap(d,n),e.hooks.parser.for("javascript/esm").tap(d,n)},x=(e,t)=>{E(e)?e.hooks.assetPath.tap(d,t):e.mainTemplate.hooks.assetPath.tap(d,t)},pe=(e,t)=>{if(E(e)){const s=e.constructor;e.hooks.processAssets.tap({name:d,stage:s.PROCESS_ASSETS_STAGE_SUMMARIZE-1,additionalAssets:!0},t)}else e.hooks.optimizeAssets.tap(d,t)};function ge(e,t){const s=new Set;return(n,o,a)=>{if(s.has(n))return;s.add(n);const c=e.names.filter(i=>!S(e.data[i],n));if(!(c.length>0))return;const u=a.loc.start,l=new y.default(`[${d}] Missing localization for key "${n}" used in ${o.resource}:${u.line}:${u.column} from locales: ${c.join(", ")}`);if(l){if(t)throw l;M(o,l)}}}const T=(e,t,s)=>{he(e,t,(n,o,a,c)=>{const{module:r}=o.state,u=a.arguments[0];if(!(a.arguments.length>0&&u.type==="Literal"&&typeof u.value=="string")){const i=a.loc.start;M(r,new y.default(`[${d}] Ignoring confusing usage of localization function "${n}" in ${r.resource}:${i.line}:${i.column}`));return}const l=s({key:u.value,namespace:c,callNode:a,module:r});if(l)return ue(o,l)(a),!0})},W=(e,t,s)=>{const n=ge(e,t.throwOnMissing);return o=>{const a=o.namespace?`${o.namespace}:${o.key}`:o.key;n(a,o.module,o.callNode);for(const c of e.paths)o.module.buildInfo.fileDependencies.add(c);return s(o)}},b=(e,t)=>{const s=[];let n=e.indexOf(t);for(;n>-1;)s.push(n),n=e.indexOf(t,n+1);return s},_=(e,t,s)=>{const n=b(e,t);for(let o=n.length-1;o>=0;o-=1){const a=n[o];e=e.slice(0,a)+s+e.slice(a+t.length)}return e},H=(e,t,s)=>{const{filename:n,chunkFilename:o}=e.outputOptions;return s&&(typeof n=="string"&&q.default(n.includes("[locale]"),"output.filename must include [locale]"),typeof o=="string"&&q.default(o.includes("[locale]"),"output.chunkFilename must include [locale]")),(a,c)=>(typeof a=="function"&&(a=a(c)),a=_(a,"[locale]",t),a)},P="::",K=({key:e,namespace:t})=>t?`${t}${P}${e}`:e,me=e=>{const t=e.split(P);return t.length===2?{namespace:t[0],key:t[1]}:{key:e}},ye=(e,t,s,n,o,a,c)=>{const[r]=n.names;T(t,a,W(n,s,({key:u,callNode:l,module:i,namespace:f})=>{const p=K({key:u,namespace:f});return c==null||c.delete(p),O(o,{callNode:l,resolveKey:(h=p)=>n.data[r][h],emitWarning:h=>M(i,new y.default(h)),emitError:h=>de(i,new y.default(h))},r,f)})),x(e,H(e,r))},I=e=>oe.default.createHash("sha256").update(e).digest("hex"),z=`_placeholder${I(d).slice(0,8)}`,we=(e,{module:t,key:s,callNode:n,namespace:o})=>{const a=K({key:s,namespace:o});t.buildInfo.localized||(t.buildInfo.localized={}),t.buildInfo.localized[a]||(t.buildInfo.localized[a]=e.names.map(r=>e.data[r][a])),o&&n.arguments[0].type==="Literal"&&(n.arguments[0].value=a,n.arguments[0].raw=`'${a}'`);const c=$(n);return`${z}(${c},${z})`},ve=e=>{const t=b(e,z),s=[];for(;t.length>0;){const n=t.shift(),o=t.shift(),a=e.slice(n+z.length+1,o-1);s.push({code:a,location:{start:n,end:o+z.length+1}})}return s},ke=e=>e.replace(/\\(.)/g,"$1"),Se=e=>JSON.stringify(e).slice(1,-1),ze=e=>X.parseExpressionAt(e,0,{ecmaVersion:"latest"}),Ae=(e,t,s,n,o)=>{const{devtool:a}=t.options,c=a&&a.includes("eval"),r=ve(e);return(u,{locale:l})=>{const i=n.data[l];for(const f of r){let{code:p}=f;c&&(p=ke(p));const h=ze(p),C=h.arguments[0].value,{key:g,namespace:m}=me(C);let w=O(s,{callNode:h,resolveKey:(k=g)=>i[k],emitWarning:k=>{L(t.warnings,new y.default(k))},emitError:k=>{L(t.errors,new y.default(k))}},l,m);c&&(w=Se(w)),u.overwrite(f.location.start,f.location.end,w),o==null||o.delete(g)}}},A=`[locale:${I("locale-placeholder").slice(0,8)}]`,D=(e,t)=>_(e,A,t),Le=e=>{const t=b(e,A);return(s,{locale:n})=>{for(const o of t)s.overwrite(o,o+A.length,n)}},be=e=>e.flatMap(t=>{const{contenthash:s}=t.info;return s!=null?s:[]}),Ce=(e,t)=>{const s=be(e),n=new Map;for(const o of s)for(const a of t.names)n.set(o+a,I(o+a).slice(0,o.length));return{insertLocalizedContentHash(o,a,c){const{contenthash:r}=a;if(r){const u=l=>{var i;const f=(i=n.get(l+c))!=null?i:l;return o=_(o,l,f),f};a.contenthash=Array.isArray(r)?r.map(u):u(r)}return o},getHashLocations(o){const a=s.map(c=>[c,b(o,c)]);return(c,{locale:r})=>{for(const[u,l]of a){const i=n.get(u+r);for(const f of l)c.overwrite(f,f+u.length,i)}}}}},$e=(e,t,s)=>{const n=new se.default(e.code);for(const a of t)a(n,e);const o=n.toString();if(s){const a=n.generateMap({source:e.name,includeContent:!0});return new j.SourceMapSource(o,e.name,a,e.code,s,!0)}return new j.RawSource(o)},Ee=/\.js$/,Me=/\.js\.map$/,_e=(e,t,s,n,o)=>{const a=e.getAssets().filter(r=>r.name.includes(A)),c=Ce(a,t);for(const r of a){const{source:u,map:l}=r.source.sourceAndMap(),i=[];if(Ee.test(r.name)){const f=u.toString(),p=Ae(f,e,o,t,n),h=Le(f),C=c.getHashLocations(f);for(const g of t.names){let m=D(r.name,g);const w={...r.info,locale:g};m=c.insertLocalizedContentHash(m,w,g),i.push(m),e.emitAsset(m,$e({name:m,code:f,locale:g},[p,h,C],l),w)}}else{const f=Me.test(r.name)&&s?s:t.names;for(const p of f){const h=D(r.name,p);i.push(h),e.emitAsset(h,r.source,r.info)}}fe(e,r.name,i)}},Ie=(e,t,s,n,o,a,c)=>{T(t,a,W(n,s,r=>we(n,r))),x(e,H(e,A,!0)),pe(e,()=>_e(e,n,s.sourceMapForLocales||n.names,c,o)),e.hooks.chunkHash.tap(d,(r,u)=>{const i=(e.chunkGraph?e.chunkGraph.getChunkModules(r):r.getModules()).map(f=>f.buildInfo.localized).filter(Boolean);i.length>0&&u.update(JSON.stringify(i))})};function je(e){const t=new Set;for(const s in e)if(S(e,s))for(const n in e[s])S(e[s],n)&&t.add(n);return t}const qe=(e,t)=>{const s=je(t);return e.hooks.afterSeal.tap(d,()=>{if(s.size!==0)for(const n of s){const o=new y.default(`[${d}] Unused string key "${n}"`);e.warnings.push(o)}}),s},U="__";function J(e){const[t]=e;if(e.length>1){let n=$(this.callNode);return n.length>80&&(n=`${n.slice(0,80)}\u2026`),this.emitWarning(`[${d}] Ignoring confusing usage of localization function: ${n})`),t}const s=this.resolveKey();return s?JSON.stringify(s):t}class R{constructor(t){var s,n;re(t),this.options=t,this.localizeCompiler=(n=t.localizeCompiler)!=null?n:{[(s=t.functionName)!=null?s:U]:J}}apply(t){const{options:s,localizeCompiler:n}=this;t.hooks.thisCompilation.tap(d,(o,{normalModuleFactory:a})=>{var c;const r=le(t,s.locales),u=(c=s.functionResolver)!=null?c:Object.keys(n),l=s.warnOnUnusedString?qe(o,r.data):void 0;(r.names.length===1?ye:Ie)(o,a,s,r,n,u,l)})}}R.defaultLocalizeCompiler={[U]:J},module.exports=R;