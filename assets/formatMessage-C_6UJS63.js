function f(e,n={}){return String(e).replace(/\{(\w+)\}/g,(t,r)=>n[r]===void 0?t:String(n[r]))}export{f};
