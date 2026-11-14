// @ts-nocheck
import { linesOf } from "./sites";

export type CenterId = string;
export type DptId = "전체" | "유제 냉장" | "FF2";
export type Job = any;
export type ArchiveKind = "FF1" | "FF2";
export type ArchiveRow = any;
export type LocHit = { count: number; store: string; route: string };
export type LocMeasure = "건수" | "작업수량";
export const LINE_COUNT = 8;

var Dn=[
  `1센터`,
  `2센터`,
  `3센터`
],
On=Dn,
kn=`신오산`;
function An(e){
  On=e
}function jn(e){
  kn=e||`신오산`
}function Mn(){
  return On
}function Nn(){
  return kn
}var Pn=[
  `🔴 1라인`,
  `🟠 2라인`,
  `🟡 3라인`,
  `🟢 4라인`,
  `🔵 5라인`,
  `🟣 6라인`,
  `💗 7라인`,
  `💙 8라인`,
  `🟤 9라인`,
  `⚫ 10라인`,
  `⚪ 11라인`,
  `🔶 12라인`
],
Fn={
  "1센터":`🔵 1센터`,
  "2센터":`🟠 2센터`,
  "3센터":`🟣 3센터`
},
In=[
  {
    id:`전체`,
    label:`전체`
  },
  {
    id:`유제 냉장`,
    label:`유제 냉장`
  },
  {
    id:`FF2`,
    label:`FF2`
  }
];
function Ln(e){
  let t=e.replace(/\D/g,
  ``);
  return t?t.padStart(4,
  `0`).slice(-4):``
}function Rn(e,
t,
n=`작업수량`){
  let r=new Map,
  i=new Map;
  for(let t of e){
    let e=Ln(t.location);
    if(!e)continue;
    let a=r.get(e)??new Map,
    o=t.storeNm||t.storeCd||`점포없음`,
    s=n===`건수`?1:t.orderQty||0;
    a.set(o,
    (a.get(o)??0)+s),
    r.set(e,
    a);
    let c=Xn(t.route);
    if(!c)continue;
    let l=i.get(e)??new Map;
    l.set(c,
    (l.get(c)??0)+s),
    i.set(e,
    l)
  }let a=new Map;
  for(let[
    e,
    t
  ]of r){
    let n=[
      ...t.entries()
    ].sort((e,
    t)=>t[
      1
    ]-e[
      1
    ]||e[
      0
    ].localeCompare(t[
      0
    ],
    `ko`)),
    r=[
      ...i.get(e)?.entries()??[
        
      ]
    ].sort((e,
    t)=>t[
      1
    ]-e[
      1
    ]||Number(e[
      0
    ])-Number(t[
      0
    ])),
    o=n.reduce((e,
    [
      ,
      t
    ])=>e+t,
    0),
    s=n.length===1?n[
      0
    ][
      0
    ]:`${n[0][0]} 외 ${n.length-1}`,
    c=r.length===0?``:r.length===1?r[
      0
    ][
      0
    ]:`${r[0][0]} 외 ${r.length-1}`;
    a.set(e,
    {
      count:o,
      store:s,
      route:c
    })
  }if(t)for(let[
    e,
    n
  ]of Object.entries(t)){
    let t=Ln(e),
    r=n.trim();
    t&&r&&!a.has(t)&&a.set(t,
    {
      count:0,
      store:r,
      route:``
    })
  }return a
}function zn(e,
t){
  if(t===`전체`)return!0;
  if(!/^\d+$/.test(e))return!1;
  let n=Number(e);
  return t===`유제 냉장`?n>=100&&n<=199:n>=200&&n<=299
}function Bn(e){
  return linesOf(kn, e)
}var Vn={
  10:6e5,
  15:9e5,
  30:18e5,
  60:36e5
};
function Hn(e){
  if(e==null||e===``)return null;
  if(e instanceof Date&&!Number.isNaN(e.getTime()))return Date.UTC(e.getFullYear(),
  e.getMonth(),
  e.getDate(),
  e.getHours(),
  e.getMinutes(),
  e.getSeconds());
  if(typeof e==`number`&&Number.isFinite(e))return e>2e4&&e<8e4?Math.round((e-25569)*864e5):null;
  let t=String(e).trim(),
  n=t.match(/(\d{4})-(\d{1,2})-(\d{1,2})\s+(오전|오후)\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if(n){
    let e=Number(n[
      5
    ]);
    return n[
      4
    ]===`오후`&&e!==12&&(e+=12),
    n[
      4
    ]===`오전`&&e===12&&(e=0),
    Date.UTC(Number(n[
      1
    ]),
    Number(n[
      2
    ])-1,
    Number(n[
      3
    ]),
    e,
    Number(n[
      6
    ]),
    Number(n[
      7
    ]??0))
  }let r=t.match(/(\d{4})-(\d{1,2})-(\d{1,2})[T](\d{1,2}):(\d{2})(?::(\d{2}))?/);
  return r?Date.UTC(Number(r[
    1
  ]),
  Number(r[
    2
  ])-1,
  Number(r[
    3
  ]),
  Number(r[
    4
  ]),
  Number(r[
    5
  ]),
  Number(r[
    6
  ]??0)):null
}function Un(e){
  if(e==null||e===``)return null;
  let t=typeof e==`number`?e:Number(String(e).trim());
  return Number.isFinite(t)?t:null
}function Wn(e){
  return e==null||e===``?``:typeof e==`number`&&Number.isFinite(e)?String(e):String(e).trim()
}function Gn(e){
  let t=e.map((e,
  t)=>({
    v:e,
    i:t
  })).filter(e=>e.v>0).sort((e,
  t)=>t.v-e.v),
  n=e.map(()=>``),
  r=1;
  for(let e=0;
  e<t.length;
  e++)e>0&&t[
    e
  ].v<t[
    e-1
  ].v&&(r=e+1),
  n[
    t[
      e
    ].i
  ]=`${r}위`;
  return n
}function Kn(e,
t,
n){
  let r=e!=null&&t!=null?(t-e)/36e5:0;
  return{
    hours:r,
    perHour:r>0?n/r:0
  }
}function qn(e,
t){
  let n=0,
  r=0,
  i=null,
  a=null;
  for(let e of t)n+=1,
  e.at!=null&&(r+=1,
  (i==null||e.at<i)&&(i=e.at),
  (a==null||e.at>a)&&(a=e.at));
  let{
    hours:o,
    perHour:s
  }=Kn(i,
  a,
  r);
  return{
    id:e,
    planned:n,
    done:r,
    left:n-r,
    rate:n?r/n:0,
    first:i,
    last:a,
    hours:o,
    perHour:s,
    rank:``
  }
}function Jn(e){
  let t=Gn(e.map(e=>e.perHour));
  return e.map((e,
  n)=>({
    ...e,
    rank:t[
      n
    ]??``
  }))
}function Yn(e,
t=8){
  let n=[
    
  ];
  for(let r=1;
  r<=t;
  r++){
    let t=0,
    i=0,
    a=null,
    o=null;
    for(let n of e)n.line===r&&(t+=1,
    n.at!=null&&(i+=1,
    (a==null||n.at<a)&&(a=n.at),
    (o==null||n.at>o)&&(o=n.at)));
    let{
      hours:s,
      perHour:c
    }=Kn(a,
    o,
    i);
    n.push({
      line:r,
      planned:t,
      done:i,
      left:t-i,
      rate:t?i/t:0,
      first:a,
      last:o,
      hours:s,
      perHour:c,
      rank:``
    })
  }let r=Gn(n.map(e=>e.perHour));
  return n.map((e,
  t)=>({
    ...e,
    rank:r[
      t
    ]??``
  }))
}function Xn(e){
  return/^\d+$/.test(e)?String(Number(e)%100):e
}function Zn(e,
t=!1){
  let n=new Map;
  for(let r of e){
    let e=r.route||`없음`,
    i=t?Xn(e):e,
    a=n.get(i)??{
      route:i,
      planned:0,
      done:0,
      left:0,
      rate:0,
      first:null,
      last:null,
      members:``,
      lines:``,
      lineKey:99,
      memberSet:new Set,
      lineSet:new Set
    };
    a.planned+=1,
    r.at!=null&&(a.done+=1,
    (a.first==null||r.at<a.first)&&(a.first=r.at),
    (a.last==null||r.at>a.last)&&(a.last=r.at)),
    r.line>=1&&r.line<=8&&a.lineSet.add(r.line),
    t&&e!==`없음`&&a.memberSet.add(e),
    n.set(i,
    a)
  }let r=[
    
  ];
  for(let e of n.values()){
    e.left=e.planned-e.done,
    e.rate=e.planned?e.done/e.planned:0;
    let t=[
      ...e.memberSet
    ].sort((e,
    t)=>e.localeCompare(t,
    `ko`,
    {
      numeric:!0
    }));
    e.members=t.length>1||t.length===1&&t[
      0
    ]!==e.route?t.join(`, `):``;
    let n=[
      ...e.lineSet
    ].sort((e,
    t)=>e-t);
    e.lines=n.join(`, `),
    e.lineKey=n[
      0
    ]??99,
    r.push({
      route:e.route,
      planned:e.planned,
      done:e.done,
      left:e.left,
      rate:e.rate,
      first:e.first,
      last:e.last,
      members:e.members,
      lines:e.lines,
      lineKey:e.lineKey
    })
  }return r.sort((e,
  t)=>e.route===`없음`?1:t.route===`없음`?-1:e.route.localeCompare(t.route,
  `ko`,
  {
    numeric:!0
  }))
}function Qn(e,
t){
  let n=new Map;
  for(let r of e){
    if(t>0&&r.line!==t)continue;
    let e=r.storeNm||`점포없음`,
    i=r.storeCd||``,
    a=`${i}|${e}`,
    o=n.get(a)??{
      key:a,
      store:e,
      code:i,
      lines:``,
      planned:0,
      done:0,
      left:0,
      rate:0,
      lineSet:new Set
    };
    o.planned+=1,
    r.at!=null&&(r.qty||0)>0&&((r.orderQty||0)<=0||(r.qty||0)>=r.orderQty)&&(o.done+=1),
    r.line>=1&&r.line<=8&&o.lineSet.add(r.line),
    n.set(a,
    o)
  }return[
    ...n.values()
  ].map(e=>{
    let t=[
      ...e.lineSet
    ].sort((e,
    t)=>e-t);
    return{
      key:e.key,
      store:e.store,
      code:e.code,
      lines:t.join(`, `),
      planned:e.planned,
      done:e.done,
      left:e.planned-e.done,
      rate:e.planned?e.done/e.planned:0
    }
  }).sort((e,
  t)=>e.store.localeCompare(t.store,
  `ko`))
}function $n(e,
t,
n){
  let r=new Map;
  for(let i of e){
    if(n>0&&i.line!==n||`${i.storeCd||``}|${i.storeNm||`점포없음`}`!==t)continue;
    let e=i.goodsCd||``,
    a=i.goodsNm||`상품없음`,
    o=`${e}|${a}`,
    s=r.get(o)??{
      key:o,
      code:e,
      name:a,
      count:0,
      qty:0,
      totalQty:0,
      workQty:0,
      leftQty:0
    },
    c=i.orderQty||i.qty||0,
    l=i.qty||0,
    f=i.at!=null&&l>0&&((i.orderQty||0)<=0||l>=i.orderQty);
    s.totalQty+=c,
    f?s.workQty+=l:(s.count+=1,
    s.qty+=l,
    s.leftQty+=Math.max(c-l,0)),
    r.set(o,
    s)
  }return[
    ...r.values()
  ].filter(e=>e.count>0).sort((e,
  t)=>t.count-e.count||e.name.localeCompare(t.name,
  `ko`))
}function er(e,
t){
  let n=new Map;
  for(let r of e){
    if(t>0&&r.line!==t)continue;
    let e=r.goodsCd||``,
    i=r.goodsNm||`상품없음`,
    a=`${e}|${i}`,
    o=n.get(a)??{
      key:a,
      code:e,
      name:i,
      planned:0,
      done:0,
      left:0,
      rate:0,
      totalQty:0,
      openQty:0
    };
    let s=r.orderQty||r.qty||0,
    c=r.qty||0,
    l=r.orderQty||0,
    u=!(r.at!=null&&c>0&&(l<=0||c>=l));
    o.planned+=1,
    o.totalQty+=s,
    u?(o.openQty+=s):(o.done+=1),
    n.set(a,
    o)
  }return[
    ...n.values()
  ].map(e=>({
    ...e,
    left:e.planned-e.done,
    rate:e.totalQty?(e.totalQty-e.openQty)/e.totalQty:0
  }))
}function tr(e,
t=8){
  return Yn(e,
  t).map(e=>{
    let t=null;
    return e.left===0&&e.last!=null?t=e.last:e.left>0&&e.perHour>0&&e.last!=null&&(t=e.last+e.left/e.perHour*36e5),
    {
      line:e.line,
      planned:e.planned,
      done:e.done,
      left:e.left,
      perHour:e.perHour,
      last:e.last,
      eta:t
    }
  })
}function nr(e){
  let t=0,
  n=0,
  r=0,
  i=null;
  for(let a of e)t+=a.planned,
  n+=a.done,
  r+=a.left,
  a.last!=null&&(i==null||a.last>i)&&(i=a.last);
  let a=e.filter(e=>e.left>0&&e.planned>0),
  o=a.filter(e=>e.eta==null).map(e=>e.line),
  s=null,
  c=null;
  if(r===0)s=i;
  else if(o.length===0)for(let e of a)e.eta!=null&&(s==null||e.eta>s)&&(s=e.eta,
  c=e.line);
  return{
    planned:t,
    done:n,
    left:r,
    eta:s,
    slowLine:c,
    unknown:o,
    snapshot:i
  }
}function rr(e){
  if(e==null)return`—`;
  if(e<=3e4)return`끝남`;
  let t=Math.round(e/6e4),
  n=Math.floor(t/60),
  r=t%60;
  return n<=0?`${r}분`:r===0?`${n}시간`:`${n}시간 ${r}분`
}function ir(e,
t){
  if(e==null)return`—`;
  let n=cr(e);
  if(t==null)return n;
  let r=dr(t),
  i=dr(e);
  return r.key===i.key?n:`${i.date} ${n}`
}function ar(e,
t){
  let n=Vn[
    t
  ]??t*6e4,
  r=new Date(e),
  i=Date.UTC(r.getUTCFullYear(),
  r.getUTCMonth(),
  r.getUTCDate());
  return i+Math.floor((e-i)/n)*n
}function or(e,
t,
n){
  let r=Vn[
    t
  ]??t*6e4,
  i=null,
  a=null;
  for(let t of e)t.at!=null&&((i==null||t.at<i)&&(i=t.at),
  (a==null||t.at>a)&&(a=t.at));
  if(i==null||a==null)return[
    
  ];
  let o=ar(i,
  t),
  s=ar(a,
  t),
  c=[
    
  ];
  for(let e=o;
  e<=s;
  e+=r)c.push({
    start:e,
    end:e+r,
    count:0,
    perHour:0,
    cumulative:0,
    totalRate:0,
    pickQty:0,
    sliceRate:0,
    lines:Array.from({
      length:8
    },
    ()=>0)
  });
  for(let t of e){
    if(t.at==null)continue;
    let e=c[
      Math.floor((t.at-o)/r)
    ];
    e&&(e.count+=1,
    e.pickQty+=t.qty||0,
    t.line>=1&&t.line<=8&&(e.lines[
      t.line-1
    ]+=1))
  }let l=0,
  u=60/t;
  for(let e of c)l+=e.count,
  e.cumulative=l,
  e.perHour=e.count*u,
  e.totalRate=n?l/n:0,
  e.sliceRate=n?e.count/n:0;
  return c
}function sr(e){
  let t=-1;
  for(let n=0;
  n<e.length;
  n++)e[
    n
  ].pickQty!==0&&(t=n);
  if(t<0)return Array.from({
    length:8
  },
  ()=>0);
  let n=t+1,
  r=Array.from({
    length:8
  },
  ()=>0);
  for(let n=0;
  n<=t;
  n++)for(let t=0;
  t<8;
  t++)r[
    t
  ]+=e[
    n
  ].lines[
    t
  ];
  return r.map(e=>e/n)
}function cr(e){
  if(e==null)return``;
  let t=Math.round(e/6e4)*6e4,
  n=new Date(t);
  return`${String(n.getUTCHours()).padStart(2,`0`)}:${String(n.getUTCMinutes()).padStart(2,`0`)}`
}function lr(e){
  if(e==null)return``;
  let t=new Date(e);
  return`${String(t.getUTCHours()).padStart(2,`0`)}:${String(t.getUTCMinutes()).padStart(2,`0`)}:${String(t.getUTCSeconds()).padStart(2,`0`)}`
}var ur=[
  `일요일`,
  `월요일`,
  `화요일`,
  `수요일`,
  `목요일`,
  `금요일`,
  `토요일`
];
function dr(e){
  let t=new Date(e),
  n=t.getUTCMonth()+1,
  r=t.getUTCDate();
  return{
    key:`${t.getUTCFullYear()}-${n}-${r}`,
    date:`${n}월 ${r}일`,
    week:ur[
      t.getUTCDay()
    ]??``
  }
}function fr(e,
t){
  if(e==null)return{
    date:`—`,
    week:`—`
  };
  let n=dr(e),
  r=t==null?n:dr(t);
  return n.key===r.key?{
    date:n.date,
    week:n.week
  }:{
    date:`${n.date} ~ ${r.date}`,
    week:`${n.week} ~ ${r.week}`
  }
}function pr(e,
t){
  if(e.length===0)return 0;
  if(e.length===1)return e[
    0
  ];
  let n=(e.length-1)*t,
  r=Math.floor(n),
  i=Math.ceil(n);
  return r===i?e[
    r
  ]:e[
    r
  ]+(e[
    i
  ]-e[
    r
  ])*(n-r)
}function mr(e,
t,
n){
  let r=Math.min(1,
  Math.max(0,
  n)),
  i=e.map((e,
  n)=>Math.round(e+(t[
    n
  ]-e)*r));
  return`rgb(${i[0]} ${i[1]} ${i[2]})`
}var hr=[
  255,
  255,
  255
],
gr=[
  255,
  249,
  196
],
_r=[
  39,
  174,
  96
],
vr=[
  99,
  190,
  123
],
yr=[
  255,
  235,
  132
],
br=[
  248,
  105,
  107
];
function xr(e){
  let t=[
    ...e
  ].sort((e,
  t)=>e-t),
  n=pr(t,
  .5),
  r=pr(t,
  .9);
  return e=>e<=0?`transparent`:r<=n?mr(gr,
  _r,
  1):e<=n?mr(hr,
  gr,
  n<=0?1:e/n):e>=r?mr(gr,
  _r,
  1):mr(gr,
  _r,
  (e-n)/(r-n))
}function Sr(e){
  let t=e.filter(e=>e!=null).sort((e,
  t)=>e-t),
  n=t[
    0
  ]??0,
  r=t[
    t.length-1
  ]??0,
  i=pr(t,
  .5);
  return e=>e==null||t.length===0?`transparent`:r===n?mr(yr,
  yr,
  0):e<=i?mr(vr,
  yr,
  i===n?1:(e-n)/(i-n)):mr(yr,
  br,
  r===i?1:(e-i)/(r-i))
}function Cr(e){
  let[
    t,
    n,
    r
  ]=e.split(`-`).map(Number);
  return!t||!n||!r?``:ur[
    new Date(Date.UTC(t,
    n-1,
    r)).getUTCDay()
  ]??``
}function wr(e){
  let[
    t,
    n
  ]=e.split(`-`);
  return`${t}년 ${Number(n)}월`
}function Tr(e){
  let[
    t,
    n,
    r
  ]=e.split(`-`).map(Number),
  i=new Date(Date.UTC(t,
  n-1,
  r)),
  a=i.getUTCDay()||7,
  o=new Date(i);
  o.setUTCDate(i.getUTCDate()+4-a);
  let s=new Date(Date.UTC(o.getUTCFullYear(),
  0,
  1)),
  c=Math.ceil(((o.getTime()-s.getTime())/864e5+1)/7),
  l=new Date(i);
  l.setUTCDate(i.getUTCDate()-a+1);
  let u=new Date(l);
  u.setUTCDate(l.getUTCDate()+6);
  let d=e=>`${e.getUTCMonth()+1}/${e.getUTCDate()}`;
  return{
    key:`${o.getUTCFullYear()}-W${String(c).padStart(2,`0`)}`,
    label:`${o.getUTCFullYear()}년 ${c}주`,
    range:`${d(l)}~${d(u)}`
  }
}function Er(e,
t){
  let n=e.replace(/\.[^.]+$/,
  ``),
  r=/FF\s*1(?!\d)/i.test(n)?`FF1`:/FF\s*2(?!\d)/i.test(n)?`FF2`:null;
  if(!r||t<2e3)return null;
  let i=(e,
  t,
  n)=>`${e}-${t.padStart(2,`0`)}-${n.padStart(2,`0`)}`,
  a=n.match(/(20\d{2})[-_.\/년\s]*(0?[1-9]|1[0-2])[-_.\/월\s]*([0-2]?\d|3[01])(?!\d)/);
  if(a)return{
    date:i(a[
      1
    ],
    a[
      2
    ],
    a[
      3
    ]),
    kind:r
  };
  let o=n.match(/(0?[1-9]|1[0-2])\s*월\s*([0-2]?\d|3[01])\s*일/);
  if(o)return{
    date:i(String(t),
    o[
      1
    ],
    o[
      2
    ]),
    kind:r
  };
  let s=n.match(/(?:^|[^0-9])(0?[1-9]|1[0-2])[-_.\/]([0-2]?\d|3[01])(?!\d)/);
  if(s)return{
    date:i(String(t),
    s[
      1
    ],
    s[
      2
    ]),
    kind:r
  };
  let c=n.match(/(?:^|[^0-9])(0[1-9]|1[0-2])([0-2]\d|3[01])(?!\d)/);
  return c?{
    date:i(String(t),
    c[
      1
    ],
    c[
      2
    ]),
    kind:r
  }:null
}function Dr(e,
t,
n,
r,
i,
a,
o){
  let s=a===0?qn(i,
  o):Yn(o).find(e=>e.line===a);
  return!s||s.planned===0?null:{
    period:e,
    sub:t,
    sort:n,
    dpt:r,
    center:i,
    line:a,
    days:1,
    planned:s.planned,
    done:s.done,
    left:s.left,
    rate:s.rate,
    hours:s.hours,
    perHour:s.perHour,
    first:s.first,
    last:s.last
  }
}function Or(e){
  if(!/^\d+$/.test(e))return``;
  let t=Number(e);
  return t>=100&&t<=199?`유제 냉장`:t>=200&&t<=299?`FF2`:t>=300&&t<=399?`FF1`:``
}function kr(e,
t,
n){
  let r=`${Number(e.slice(5,7))}월 ${Number(e.slice(8,10))}일`,
  i=Cr(e),
  a=new Map;
  for(let e of Dn)for(let r of n[
    e
  ]??[
    
  ]){
    let n=Or(r.route),
    i=``;
    if(t===`FF1`){
      if(n===`유제 냉장`||n===`FF2`)continue;
      i=`FF1`
    }else(n===`유제 냉장`||n===`FF2`)&&(i=n);
    if(!i)continue;
    let o=a.get(i)??{
      
    };
    o[
      e
    ]=[
      ...o[
        e
      ]??[
        
      ],
      r
    ],
    a.set(i,
    o)
  }let o=[
    
  ];
  for(let[
    t,
    n
  ]of a)for(let a of Dn){
    let s=n[
      a
    ]??[
      
    ];
    if(s.length===0)continue;
    let c=Dr(r,
    i,
    e,
    t,
    a,
    0,
    s);
    c&&o.push(c);
    for(let n=1;
    n<=Bn(a);
    n++){
      let c=Dr(r,
      i,
      `${e}-${n}`,
      t,
      a,
      n,
      s);
      c&&o.push(c)
    }
  }return o
}function Ar(e,
t){
  let n=new Map;
  for(let r of e){
    let e=r.sort.slice(0,
    10),
    i=Tr(e),
    a=t===`week`?i.label:wr(e),
    o=t===`week`?i.range:``,
    s=t===`week`?i.key:e.slice(0,
    7),
    c=`${s}|${r.dpt}|${r.center}|${r.line}`,
    l=n.get(c)??{
      period:a,
      sub:o,
      sort:s,
      dpt:r.dpt,
      center:r.center,
      line:r.line,
      days:0,
      planned:0,
      done:0,
      left:0,
      rate:0,
      hours:0,
      perHour:0,
      first:null,
      last:null,
      daySet:new Set
    };
    l.planned+=r.planned,
    l.done+=r.done,
    l.hours+=r.hours,
    l.daySet.add(e),
    r.first!=null&&(l.first==null||r.first<l.first)&&(l.first=r.first),
    r.last!=null&&(l.last==null||r.last>l.last)&&(l.last=r.last),
    n.set(c,
    l)
  }return[
    ...n.values()
  ].map(e=>{
    let{
      daySet:t,
      ...n
    }=e;
    return n.days=t.size,
    n.left=n.planned-n.done,
    n.rate=n.planned?n.done/n.planned:0,
    n.perHour=n.hours>0?n.done/n.hours:0,
    n
  }).sort((e,
  t)=>e.sort.localeCompare(t.sort)||e.center.localeCompare(t.center,
  `ko`)||e.line-t.line||e.dpt.localeCompare(t.dpt,
  `ko`))
}
export {
  Dn as CENTERS,
  An as setShownCenters,
  jn as setShownSite,
  Mn as centerList,
  Nn as shownSite,
  Pn as LINE_LABELS,
  Fn as CENTER_LABELS,
  In as DPTS,
  Ln as normalizeLoc,
  Rn as locationHits,
  zn as matchDpt,
  Bn as lineCountOf,
  Hn as parsePick,
  Un as lineOf,
  Wn as routeOf,
  qn as centerStat,
  Jn as withCenterRanks,
  Yn as lineStats,
  Xn as routeBucket,
  Zn as routeStats,
  Qn as storeStats,
  $n as openGoods,
  er as goodsStats,
  tr as lineForecasts,
  nr as centerForecast,
  rr as formatAhead,
  ir as formatWhen,
  or as buckets,
  sr as lineAverages,
  cr as formatHm,
  lr as formatHms,
  fr as workDateLabel,
  xr as heatScale,
  Sr as finishScale,
  wr as monthOf,
  Tr as isoWeekOf,
  Er as archiveFileMeta,
  kr as archiveDayRows,
  Ar as rollupArchive,
};
