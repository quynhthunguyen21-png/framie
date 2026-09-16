const API=(window.FRAME_API||'/api').replace(/\/$/,'');
const storeKey='framie_state_v6';
const saved=JSON.parse(localStorage.getItem(storeKey)||'{}');
const S={
  user:saved.user||JSON.parse(localStorage.getItem('framie_user')||'null'), token:saved.token||localStorage.getItem('framie_token')||'',
  cart:saved.cart||[], design:saved.design||null, nfc:saved.nfc||null, step:saved.step||1, selected:saved.selected||null, nfcSelected:saved.nfcSelected||null, privacy:!!saved.privacy, coupon:saved.coupon||null,
  productPlan:saved.productPlan||'memory', spotify:saved.spotify||null, recording:false, recordProcessing:false, recordSeconds:0, recordTimerId:null, mediaRecorder:null, mediaStream:null, recChunks:[], nfcUnlockCache:{}
};
const plans=[
  {code:'basic',number:'01',name:'Framie Basic',price:149000,description:'Một chiếc khung tối giản cho một khoảnh khắc chỉ hai người hiểu.',features:['Tối đa 1 ảnh','Text mặt khung','NFC landing cơ bản'],note:'Hợp để đánh dấu sinh nhật, ngày đầu yêu hoặc một lời nhắn riêng.'},
  {code:'memory',number:'02',name:'Framie Memory',price:249000,description:'Không gian đủ đầy để kể một câu chuyện tình yêu bằng ảnh và giọng nói.',features:['Tối đa 5 ảnh','Ghi âm / audio','NFC landing nâng cao'],note:'Dành cho kỷ niệm yêu nhau, yêu xa, sinh nhật hoặc ngày đặc biệt.',popular:true},
  {code:'standard',number:'03',name:'Framie Standard',price:349000,description:'Một trải nghiệm Phygital trọn vẹn cho những cột mốc lớn của hai người.',features:['Thiết kế riêng không giới hạn','Album ảnh số','Audio + video đa tầng','Quản trị bảo mật cao cấp'],note:'Dành cho lễ cầu hôn, quà cưới, kỷ niệm lớn và những dịp thật riêng.'}
];
S.cart = S.cart.map(item => {
  const plan = plans.find(candidate => candidate.code === item.code);
  return plan ? { ...item, name: plan.name, price: plan.price } : item;
});
const colors=[['cream','Trắng kem','#FFF8F8'],['wood','Gỗ sáng','#D9B89A'],['black','Đen','#2F2527'],['beige','Beige','#E8D4D2'],['pink','Hồng pastel','#FFD3D6'],['deep-red','Đỏ trầm','#8F352D']];
const bgColors=[['','Không nền'],['#FFFFFF','Trắng'],['#FDF4F4','Hồng phấn'],['#F6DFE1','Hồng đào'],['#FADFDF','Hồng nhạt'],['#FBE3EA','Hồng be'],['#D9EDEA','Xanh bạc hà'],['#F3E7DA','Kem'],['#EFEAE3','Xám nhạt']];
const sizes=['10 x 15 cm','13 x 18 cm','15 x 21 cm','20 x 30 cm'];
const frameShapes=[['portrait','Khung đứng','Đứng'],['landscape','Khung ngang','Ngang'],['square','Khung vuông','Vuông']];
/* PNG sticker library shipped in public/stickers (trimmed exports of the
   FRAMIE.STICKER artwork). Declared before the templates because the
   template compositions below reference st() at module-evaluation time. */
const stickerPacks=[
  {slug:'bows',label:'Nơ',count:31},
  {slug:'flowers',label:'Hoa',count:19},
  {slug:'butterfly',label:'Bướm',count:42},
  {slug:'symbols',label:'Biểu tượng',count:33},
  {slug:'party',label:'Buổi tiệc',count:9},
  {slug:'tape',label:'Băng keo & kẹp',count:18},
  {slug:'frames',label:'Khung ảnh',count:10},
  {slug:'paper',label:'Nền giấy',count:5},
  {slug:'vintage',label:'Vintage',count:10}
];
const st=(slug,i)=>`/stickers/${slug}/${slug}-${String(i).padStart(2,'0')}.png`;
const templateThemes=['Kỷ niệm','Sinh nhật','Trưởng thành'];
/* Template compositions rebuilt to match the six reference collages in
   public/framie ảnh (Mẫu 1-6). Each design exists in two colourways that
   share a layout, so the element list is built once per design and the
   variant only overrides the mat colour / frame colour. Coordinates are
   percentages of the landscape canvas (x/y = element centre). */
const T=(id,type,x,y,width,height,extra={})=>({id,type,x,y,width,height,rotate:0,z:1,...extra});
const scriptFont='Cormorant Garamond';
const bubble=(id,text,x,y,width,size)=>T(id,'text',x,y,width,44,{size,text,font:'DM Sans',bg:'#fff',color:'#2F2527',z:9});
const photo=(id,src,x,y,w,h,z,extra={})=>T(id,'image',x,y,w,h,{src,zoom:1,cropX:50,cropY:50,z,...extra});
const decor=(id,src,x,y,w,h,z,rotate=0)=>T(id,'sticker',x,y,w,h,{src,text:'',size:40,z,rotate});

const anniversaryElements=()=>[
  decor('a-film',st('frames',10),26,50,70,44,2,90),
  photo('a-p1','/hinh5.jpg',28,14,23,17,3),
  photo('a-p2','/anh5.png',28,33,23,17,3),
  photo('a-p3','/hinh7.jpg',28,52,23,17,3),
  photo('a-p4','/anh6.jpg',28,71,23,17,3),
  decor('a-clip',st('vintage',7),10,70,15,27,1),
  decor('a-heart1',st('symbols',11),13,11,8,13,2),
  decor('a-heart2',st('symbols',11),47,11,7,11,2),
  decor('a-bow1',st('bows',11),34,30,11,16,4),
  decor('a-bow2',st('bows',16),44,74,10,14,4),
  decor('a-silho',st('symbols',20),79,74,34,46,1),
  decor('a-hearts',st('symbols',10),52,74,13,17,2),
  decor('a-roses',st('flowers',10),93,26,13,30,2),
  T('a-t1','text',60,21,30,40,{size:17,text:'Cảm ơn vì là',font:scriptFont,italic:true,z:6}),
  T('a-t2','text',72,29,38,40,{size:17,text:'thanh xuân của nhau',font:scriptFont,italic:true,z:6}),
  T('a-t3','text',57,39,32,44,{size:19,text:'Nhìn lại 5 năm',font:scriptFont,italic:true,z:6}),
  T('a-t4','text',70,47,32,44,{size:19,text:'của em và anh',font:scriptFont,italic:true,z:6}),
  T('a-t5','text',50,57,20,32,{size:14,text:'p.s. i love u',font:scriptFont,italic:true,bg:'#CFC0DC',z:6}),
  T('a-t6','text',53,74,20,40,{size:9,text:'Cảm ơn vì ta đã\ncố gắng vì nhau',font:scriptFont,italic:true,z:6}),
  bubble('a-t7','Chạm vào khi anh nhớ em',84,13,26,7)
];
const birthdayElements=()=>[
  photo('b-p1','/hinh5.png',27,37,26,30,3),
  photo('b-p2','/anh7.jpg',50,53,23,33,4,{rotate:-2}),
  photo('b-p3','/anh5.png',70,35,25,28,3),
  photo('b-p4','/hinh6.png',83,67,22,32,3),
  decor('b-bunt1',st('party',3),24,13,27,21,2),
  decor('b-bunt2',st('party',4),71,8,24,15,2),
  decor('b-balloon',st('party',5),55,14,14,23,2),
  decor('b-glass',st('party',6),74,19,16,13,5),
  decor('b-stars',st('party',7),93,78,13,22,5),
  decor('b-cake',st('party',8),43,88,10,17,5),
  decor('b-note',st('tape',18),59,82,24,25,5),
  T('b-t1','text',27,73,32,90,{size:30,text:'Happy\nBirthday',font:scriptFont,italic:true,z:6}),
  T('b-t2','text',59,83,19,40,{size:9,text:'Chúc em bé của anh\nsinh nhật vui vẻ',font:scriptFont,italic:true,z:7}),
  bubble('b-t3','Chạm vào để xem lại kỉ niệm',84,12,26,7)
];
const graduationElements=(withBow)=>[
  T('g-t1','text',36,11,56,50,{size:25,text:'LỄ TRƯỞNG THÀNH',font:'Playfair Display',z:6}),
  photo('g-p1','/hinh7.jpg',36,53,42,60,3),
  decor('g-tape',st('tape',1),18,27,8,15,4,-25),
  decor('g-clip',st('tape',11),53,24,6,14,4),
  decor('g-note',st('paper',2),70,26,30,27,2),
  T('g-t2','text',70,26,25,44,{size:8,text:'Khoảng khắc quý giá của cuộc\nđời thật may là bên anh vẫn luôn\ncó em',font:scriptFont,italic:true,z:5}),
  decor('g-bow',st('bows',12),56,16,8,11,4),
  decor('g-flower',st('flowers',18),86,34,12,17,4),
  decor('g-cam',st('frames',4),76,71,36,45,2),
  photo('g-p2','/hinh6.jpg',72,71,14,17,3),
  decor('g-fly',st('butterfly',9),90,57,9,13,5),
  bubble('g-t3','Kỉ niệm ở đây',84,12,22,7),
  ...(withBow?[decor('g-bow2',st('bows',31),16,82,12,17,4)]:[])
];
const templates=[
  {id:'anniv-black',theme:'Kỷ niệm',name:'5 năm bên nhau',image:'/mau1.jpg',plan:'memory',frame:'landscape',color:'black',bg:'#F6DFE1',size:'15 x 21 cm',elements:anniversaryElements()},
  {id:'anniv-white',theme:'Kỷ niệm',name:'5 năm bên nhau · khung kem',image:'/mau2.jpg',plan:'memory',frame:'landscape',color:'cream',bg:'#F6DFE1',size:'15 x 21 cm',elements:anniversaryElements()},
  {id:'birthday-mauve',theme:'Sinh nhật',name:'Happy Birthday',image:'/mau3.jpg',plan:'memory',frame:'landscape',color:'beige',bg:'#FADFDF',size:'13 x 18 cm',elements:birthdayElements()},
  {id:'birthday-black',theme:'Sinh nhật',name:'Happy Birthday · khung đen',image:'/mau4.jpg',plan:'memory',frame:'landscape',color:'black',bg:'#FADFDF',size:'13 x 18 cm',elements:birthdayElements()},
  {id:'graduation-pink',theme:'Trưởng thành',name:'Lễ trưởng thành',image:'/mau5.jpg',plan:'standard',frame:'landscape',color:'black',bg:'#FBE3EA',size:'15 x 21 cm',elements:graduationElements(false)},
  {id:'graduation-mint',theme:'Trưởng thành',name:'Lễ trưởng thành · xanh bạc hà',image:'/mau6.jpg',plan:'standard',frame:'landscape',color:'black',bg:'#D9EDEA',size:'15 x 21 cm',elements:graduationElements(true)}
];
function useTemplate(id){const t=templates.find(x=>x.id===id);if(!t)return;S.design={plan:t.plan,frame:t.frame,color:t.color,bg:t.bg,size:t.size,elements:JSON.parse(JSON.stringify(t.elements))};S.nfc=defaultNfc();S.selected=null;S.nfcSelected=null;S.loadedDesignId=null;S.productPlan=t.plan;S.step=3;persist();navigate('/setup')}
function templateLibrary(activeTheme='all'){shell(`<main class="page"><div class="page-head"><span class="eyebrow">CỬA HÀNG · KHO TEMPLATE</span><h1>Chọn một template<br><em>đã có sẵn câu chuyện</em></h1><p>Mỗi template gồm ảnh, chữ và bố cục dựng sẵn theo chủ đề — bạn chỉ cần thay ảnh của hai người và tiếp tục tuỳ chỉnh trong Trạm thiết lập.</p></div><div class="template-filters"><button type="button" class="filter ${activeTheme==='all'?'active':''}" data-theme="all">Tất cả</button>${templateThemes.map(t=>`<button type="button" class="filter ${activeTheme===t?'active':''}" data-theme="${esc(t)}">${esc(t)}</button>`).join('')}</div><div class="template-grid">${templates.filter(t=>activeTheme==='all'||t.theme===activeTheme).map(t=>`<article class="template-card"><div class="template-thumb"><img src="${t.image}" alt="${esc(t.name)}"></div><div class="template-info"><span class="eyebrow">${esc(t.theme)}</span><h3>${esc(t.name)}</h3><button type="button" class="btn primary full" data-use-template="${t.id}">Dùng mẫu này →</button></div></article>`).join('')}</div></main>`);$$('[data-theme]').forEach(b=>b.onclick=()=>templateLibrary(b.dataset.theme));$$('[data-use-template]').forEach(b=>b.onclick=()=>useTemplate(b.dataset.useTemplate))}
const frameLabel=(frame,short=false)=>{const f=frameShapes.find(x=>x[0]===frame);return f?f[short?2:1]:frameShapes[0][short?2:1]};
const stickers=[['♥','Trái tim'],['♡','Tim đôi'],['★','Ngôi sao'],['☆','Sao rỗng'],['✦','Tia sáng'],['✧','Lấp lánh'],['🎈','Bóng bay'],['🎂','Bánh sinh nhật'],['🐶','Cún'],['🐱','Mèo'],['🌸','Hoa'],['🌷','Tulip'],['🌹','Hoa hồng'],['🌼','Cúc'],['🎀','Nơ'],['🧸','Gấu'],['🐰','Thỏ'],['🐻','Bear'],['🎁','Quà'],['🍒','Cherry'],['🍓','Dâu'],['🍰','Bánh'],['🦋','Bướm'],['✨','Sparkle'],['📷','Camera'],['🎵','Music'],['☀','Mặt trời'],['☾','Mặt trăng'],['☁','Mây'],['🌈','Cầu vồng'],['💌','Thư'],['💫','Sao băng'],['🤍','Tim trắng'],['🩷','Tim hồng'],['💕','Hai tim'],['💐','Bó hoa'],['🥂','Cheers'],['💍','Nhẫn'],['🕊','Bồ câu'],['🫶','Hands'],['🪄','Magic']];
const money=n=>new Intl.NumberFormat('vi-VN').format(Math.max(0,Number(n)||0))+'đ';
const esc=s=>String(s??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const textAlignJustify=align=>align==='left'?'flex-start':align==='right'?'flex-end':'center';
const textStyleExtra=el=>`font-weight:${el.bold?700:400};font-style:${el.italic?'italic':'normal'};text-align:${el.align||'center'};justify-content:${textAlignJustify(el.align)}${el.color?`;color:${el.color}`:''}${el.bg?`;background:${el.bg};padding:6px 10px;border-radius:8px`:''}`;
const resizeHandlesHtml=()=>['nw','n','ne','e','se','s','sw','w'].map(p=>`<span class="resize-handle rh-${p}" data-pos="${p}"></span>`).join('');
const textToolbarHtml=el=>`<div class="text-toolbar"><button type="button" id="tb-bold" class="${el.bold?'active':''}" title="In đậm"><b>B</b></button><button type="button" id="tb-italic" class="${el.italic?'active':''}" title="In nghiêng"><i>I</i></button><button type="button" id="tb-align-left" class="${el.align==='left'?'active':''}" title="Căn trái">⟸</button><button type="button" id="tb-align-center" class="${(!el.align||el.align==='center')?'active':''}" title="Căn giữa">≡</button><button type="button" id="tb-align-right" class="${el.align==='right'?'active':''}" title="Căn phải">⟹</button><label class="color-field" title="Màu chữ">A<input type="color" id="tb-color" value="${el.color||'#3a2e2f'}"></label><label class="color-field" title="Màu nền chữ">▦<input type="color" id="tb-bg" value="${el.bg||'#ffffff'}"></label><button type="button" id="tb-bg-clear" title="Bỏ nền chữ">Bỏ nền</button></div>`;
function wireTextToolbar(el,updateNode){const setAlign=a=>{el.align=a;persist();updateNode(el);$$('.text-toolbar [id^="tb-align-"]').forEach(b=>b.classList.remove('active'));$('#tb-align-'+a)?.classList.add('active')};$('#tb-bold')?.addEventListener('click',()=>{el.bold=!el.bold;persist();updateNode(el);$('#tb-bold').classList.toggle('active',!!el.bold)});$('#tb-italic')?.addEventListener('click',()=>{el.italic=!el.italic;persist();updateNode(el);$('#tb-italic').classList.toggle('active',!!el.italic)});$('#tb-align-left')?.addEventListener('click',()=>setAlign('left'));$('#tb-align-center')?.addEventListener('click',()=>setAlign('center'));$('#tb-align-right')?.addEventListener('click',()=>setAlign('right'));$('#tb-color')?.addEventListener('input',e=>{el.color=e.target.value;persist();updateNode(el)});$('#tb-bg')?.addEventListener('input',e=>{el.bg=e.target.value;persist();updateNode(el)});$('#tb-bg-clear')?.addEventListener('click',()=>{el.bg='';persist();updateNode(el)})}
const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const logo=(c='')=>`<img class="logo ${c}" src="/framie-logo.png" alt="framie">`;
const stripBase64=(arr)=>(arr||[]).map(el=>{if(el&&typeof el.src==='string'&&el.src.startsWith('data:')){const copy={...el};delete copy.src;return copy}return el});
const persist=()=>{const safeNfc=JSON.parse(JSON.stringify(S.nfc||{}));delete safeNfc.password;safeNfc.elements=stripBase64(safeNfc.elements);const safeDesign=JSON.parse(JSON.stringify(S.design||{}));safeDesign.elements=stripBase64(safeDesign.elements);try{localStorage.setItem(storeKey,JSON.stringify({user:S.user,token:S.token,cart:S.cart,design:safeDesign,nfc:safeNfc,step:S.step,selected:S.selected,nfcSelected:S.nfcSelected,privacy:S.privacy,coupon:S.coupon,productPlan:S.productPlan,spotify:S.spotify}))}catch(e){console.warn('localStorage quota exceeded, skipping persist',e)}};
const defaultDesign=()=>({plan:S.productPlan,frame:'portrait',color:'cream',size:'13 x 18 cm',elements:[{id:'e1',type:'text',x:50,y:66,size:28,width:70,rotate:0,z:3,text:'a little\npiece of us'},{id:'e2',type:'text',x:50,y:86,size:11,width:60,rotate:0,z:4,text:'tap to remember'}]});
const defaultNfc=()=>({title:'',text:'',elements:[{id:'cover1',type:'cover',x:50,y:4.77,width:84,height:210,rotate:0,z:1},{id:'n1',type:'text',x:50,y:8.3,size:24,width:86,rotate:0,z:3,text:'Gửi một điều thật đẹp.',font:'Playfair Display'},{id:'n2',type:'text',x:50,y:9.43,size:13,width:86,rotate:0,z:4,text:'Một kỷ niệm có thể chạm vào.',font:'DM Sans'}],recording:null,spotify:null,passwordEnabled:false,passwordHash:''});
if(!S.design)S.design=defaultDesign(); if(!S.nfc)S.nfc=defaultNfc(); if(S.nfc?.elements){const _n1=S.nfc.elements.find(e=>e.id==='n1');if(_n1)_n1.y=8.3;const _n2=S.nfc.elements.find(e=>e.id==='n2');if(_n2)_n2.y=9.43;const _cov=S.nfc.elements.find(e=>e.id==='cover1');if(_cov)_cov.y=4.77;const _allCovs=S.nfc.elements.filter(e=>e.type==='cover');_allCovs.forEach(c=>{if(c.y<15)c.y=4.77});const hasCover=S.nfc.elements.some(e=>e.type==='cover');const hasImg=S.nfc.elements.some(e=>e.type==='image');if(!hasCover&&!hasImg)S.nfc.elements.unshift({id:'cover1',type:'cover',x:50,y:4.77,width:84,height:210,rotate:0,z:1})} persist();
function refreshAuth(){const u=localStorage.getItem('framie_user'); const t=localStorage.getItem('framie_token'); if(u)S.user=JSON.parse(u); if(t)S.token=t;}
/* S (cart/design/nfc/step/...) lives in one shared localStorage key that
   isn't namespaced per-user, so on a browser used by more than one person
   the in-progress cart/design/wizard step used to survive a sign-out or a
   switch to a different account and show up as the next person's own data.
   Wipe it whenever the signed-in identity actually changes; a guest (no
   S.user yet) logging in to save/checkout their own in-progress design is
   the one case that must NOT be cleared. */
function resetIdentityState(){S.cart=[];S.productPlan=null;S.design=defaultDesign();S.nfc=defaultNfc();S.step=1;S.selected=null;S.nfcSelected=null;S.coupon=null;S.spotify=null;S.loadedDesignId=null;S.designHasOrder=false;S.undoPhysical=[];S.undoNfc=[]}
function setAuth(x){if(S.user&&x.user&&S.user.id!==x.user.id)resetIdentityState();S.user=x.user;S.token=x.token;localStorage.setItem('framie_user',JSON.stringify(S.user));localStorage.setItem('framie_token',S.token);persist()}
function signout(){resetIdentityState();S.user=null;S.token='';localStorage.removeItem('framie_user');localStorage.removeItem('framie_token');persist();navigate('/')}
function shell(content,{wide=false,plain=false}={}){
  refreshAuth(); document.body.classList.remove('menu-open');
  if(plain){$('#app').innerHTML=content;return}
  const nav=[['/','Trang chủ'],['/about','Về Framie'],['/blog','Blog'],['/shop','Cửa hàng'],['/setup','Trạm thiết lập'],['/contact','Liên hệ']];
  $('#app').innerHTML=`<header><a class="brand" href="/">${logo()}<span>Chạm để kết nối</span></a><nav>${nav.map(([h,t])=>`<a href="${h}" class="${location.pathname===h?'active':''}">${t}</a>`).join('')}</nav><div class="head-actions"><a class="icon-btn" aria-label="Tài khoản" href="/${S.user?'dashboard':'login'}"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="4"></circle><path d="M4 21c.8-4 3.4-6 8-6s7.2 2 8 6"></path></svg></a><a class="icon-btn cart-btn" aria-label="Giỏ hàng" href="/cart"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h2l2 11h9l2-8H7"></path><circle cx="10" cy="20" r="1.5"></circle><circle cx="17" cy="20" r="1.5"></circle></svg>${S.cart.length?`<b>${S.cart.reduce((a,x)=>a+x.qty,0)}</b>`:''}</a><a class="btn primary head-btn" href="/setup">Thiết lập ngay</a><button class="menu" type="button" aria-label="Mở menu">☰</button></div></header><div class="mobile-nav">${nav.map(([h,t])=>`<a href="${h}">${t}</a>`).join('')}<a href="/${S.user?'dashboard':'login'}">${S.user?'Dashboard':'Đăng nhập'}</a><a href="/cart">Giỏ hàng</a></div>${content}<footer><div><a href="/">${logo('footer-logo')}</a><p>Khung tranh NFC custom dành cho những điều thật riêng.</p><div class="socials"><a href="https://www.facebook.com/profile.php?id=61594251033219" target="_blank" rel="noreferrer" aria-label="Facebook"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 8h3V4h-3c-3.2 0-5 1.9-5 5v3H6v4h3v4h4v-4h3l1-4h-4V9c0-.7.3-1 1-1Z"></path></svg></a><a href="https://www.tiktok.com/@framie9?_r=1&amp;_t=ZS-99fErkTULxN" target="_blank" rel="noreferrer" aria-label="TikTok"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 4v10.5a4.5 4.5 0 1 1-4-4.47"></path><path d="M14 4c1 2.7 2.7 4.2 5 4.8"></path></svg></a><a href="https://www.threads.com/@khunganh_framie" target="_blank" rel="noreferrer" aria-label="Threads"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.8 11.2c-.6-4.1-3.1-6.2-6.8-6.2-4.1 0-6.8 2.7-6.8 7s2.7 7 7 7c3.3 0 5.8-1.7 6.1-4.4.3-2.6-1.5-4.5-4.5-4.7-2.8-.2-4.8.8-4.8 2.9 0 1.7 1.6 2.5 3.4 2.2 2.4-.4 3.7-2.3 3.9-4.8"></path></svg></a></div></div><div><h4>Framie</h4>${nav.slice(0,5).map(([h,t])=>`<a href="${h}">${t}</a>`).join('')}</div><div><h4>Hỗ trợ</h4><a href="/contact">Liên hệ</a><a href="/policy">Chính sách bảo mật</a><a href="/policy#refund">Đổi trả & bảo hành</a></div><div><h4>Nhận tin từ Framie</h4><p>Mẹo thiết kế và ưu đãi nhỏ cho những món quà thật riêng.</p><form id="newsletter" class="newsletter"><input name="email" type="email" placeholder="Email của bạn" required><button aria-label="Đăng ký">→</button></form></div><small class="copyright">© 2026 framie. All rights reserved.</small></footer>`;
  $('.socials a[aria-label="Facebook"]')?.setAttribute('href','https://www.facebook.com/share/19Vcq4sfYQ/?mibextid=wwXIfr');
  $('.socials a[aria-label="Threads"]')?.setAttribute('href','https://www.threads.com/@khunganh_framie');
  $('.socials a[aria-label="TikTok"]')?.remove();
  $('.menu')?.addEventListener('click',()=>document.body.classList.toggle('menu-open')); $('#newsletter')?.addEventListener('submit',e=>{e.preventDefault();alert('Cảm ơn bạn đã đăng ký nhận tin từ framie.');e.currentTarget.reset()});
  initScrollReveal();
}
function initScrollReveal(root=document){
  const els=[...root.querySelectorAll('.reveal:not(.is-visible)')];
  if(!els.length)return;
  if(!('IntersectionObserver' in window)){els.forEach(el=>el.classList.add('is-visible'));return}
  const io=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');io.unobserve(entry.target)}})},{threshold:.15,rootMargin:'0px 0px -40px 0px'});
  els.forEach(el=>io.observe(el));
}
function home(){shell(`<main><section class="hero"><div class="hero-copy"><span class="eyebrow">HOLD A KEEPSAKE, CARRY A <i>STORY</i></span><h1>Gói khoảnh khắc,<br><em>giữ yêu thương</em></h1><p>FRAMIE là món quà nơi những điều hữu hình và những kỷ niệm số hóa cùng nhau lưu giữ trọn vẹn lời yêu thương. Từ một khung hình có thể chạm đến những hình ảnh, lời nhắn và âm thanh chỉ thuộc về hai người.</p><div class="hero-actions"><a class="btn primary" href="/setup">Bắt đầu ngay →</a><a class="btn ghost" href="#demo">Xem demo ▷</a></div></div><div class="hero-visual"><div class="hero-product-shot"><div class="orb o1"></div><div class="orb o2"></div><span class="hero-badge">FRAMIE · NFC MEMORY</span><div class="shot-frame"><img src="/hinh1.jpg" alt="Khung ảnh Framie tích hợp NFC, chạm điện thoại để mở trang kỷ niệm"></div><span class="hero-cta-chip">Chạm để mở</span><div class="hero-tagline"><b>một cú chạm</b><em>một câu chuyện</em></div></div></div></section>
<section class="feature-strip reveal">${[['✦','Custom tự do','Thiết kế ảnh, chữ và sticker ngay trên khung.'],['◇','Preview trực quan','Xem bố cục theo thời gian thực trước khi đặt.'],['♡','NFC một chạm','Mở ra cả một thế giới kỷ niệm trên điện thoại.'],['⌁','Riêng tư','Chủ động bảo vệ những điều chỉ hai người muốn giữ.']].map(x=>`<div><i>${x[0]}</i><div><b>${x[1]}</b><small>${x[2]}</small></div></div>`).join('')}</section>
<section class="section demo-section reveal" id="demo"><div class="two-col"><div><span class="eyebrow">KHÁM PHÁ TRẢI NGHIỆM FRAMIE</span><h2>Một món quà có thể kể chuyện</h2><p>Chạm NFC trên khung ảnh và mở ra những điều không thể nhìn thấy bằng mắt — hình ảnh, video, lời nhắn và thanh âm được dành riêng cho người bạn yêu.</p><button id="demo-play" class="btn primary">▶ Xem demo trải nghiệm</button></div><div id="demo-vid-container" class="demo-card" style="padding:0; display:block; cursor:pointer; position:relative; min-height:auto; height:auto; overflow:hidden; border-radius:30px;"><button class="demo-play" style="pointer-events:none;">▶</button><video id="demo-video" src="/videodemonew.mp4" autoplay loop muted playsinline style="width:100%; height:auto; display:block; border-radius:30px; pointer-events:none;"></video></div></div></section>
<section class="section blush memory-section reveal"><span class="eyebrow">NƠI NHỮNG KỶ NIỆM ĐƯỢC LƯU GIỮ</span><h2>Một khung ảnh — <em>Cả một thế giới riêng</em></h2><p class="section-lead">FRAMIE đưa những kỷ niệm từ thế giới số vào một món quà hữu hình — nơi mỗi hình ảnh, thanh âm và lời nhắn đều mang một ý nghĩa riêng.</p><div class="couple-story-grid"><article><img src="/hinh2.jpg" alt="Khung ảnh Framie gắn NFC"><span>01 — Giữ lại khoảnh khắc.</span><h3>Một bức ảnh đẹp không chỉ để ngắm</h3><p>Một bức ảnh đẹp không chỉ để ngắm, mà để lưu giữ cảm xúc phía sau nó.</p></article><article><img src="/hinh3.jpg" alt="Mở trang kỷ niệm Framie bằng NFC"><span>02 — Chạm để mở ký ức.</span><h3>Một lần chạm, một câu chuyện mở ra</h3><p>Một cú chạm NFC đưa bạn trở về với những lời nhắn, giai điệu và khoảnh khắc thân thương.</p></article></div></section>
<section class="story reveal"><div class="story-art"><div class="story-frame"><img src="/hinh4.jpg" alt="Framie đặt cạnh điện thoại đang mở trang kỷ niệm"></div></div><article><span class="eyebrow">VỀ FRAMIE</span><h2>Biến lời yêu thương<br><em>thành một món quà</em></h2><p>FRAMIE biến những lời yêu thương khó nói thành một món quà có thể chạm, nghe và cảm nhận. Món quà không chỉ được trao đi — nó còn có thể kể lại câu chuyện tình yêu của hai người mỗi khi được mở ra.</p><blockquote>“Không chỉ tặng một món quà — cùng nhau lưu giữ một câu chuyện.”</blockquote><a class="text-link" href="/about">Xem câu chuyện Framie →</a></article></section>
<section class="section testimonials reveal"><div class="section-head-row"><div><span class="eyebrow">KHÁCH HÀNG NÓI GÌ?</span><h2>Những câu chuyện<br><em>được trao lại</em></h2></div><span class="rating">★★★★★ <small>4.9/5 từ người mua</small></span></div><div class="testimonial-grid"><article class="testimonial"><div class="stars">★★★★★</div><p>“Món quà nhỏ nhưng cảm giác nhận được rất riêng. Mình thích nhất là phần nghe lại lời nhắn của người ấy.”</p><b>Minh & Vy · Kỷ niệm 2 năm</b><div class="avatar">M</div></article><article class="testimonial"><div class="stars">★★★★★</div><p>“Tụi mình chọn một bức ảnh ở Hội An và thêm bài hát hai đứa cùng thích. Rất bất ngờ và dễ thương.”</p><b>Tuấn & Linh · Quà sinh nhật</b><div class="avatar">T</div></article><article class="testimonial"><div class="stars">★★★★★</div><p>“Khung nhìn đẹp, nhưng điều giữ mình lại là câu chuyện phía sau nó. Sau vài tháng vẫn mở lại để nghe.”</p><b>Hà & Nam · Ngày đặc biệt</b><div class="avatar">H</div></article></div></section><section class="section final-cta reveal"><span class="eyebrow">MADE FOR TWO</span><h2>Một món quà nhỏ.<br><em>Một câu chuyện thật dài</em></h2><a class="btn primary" href="/setup">Thiết lập Framie →</a></section></main>`);$$('.choose-plan').forEach(b=>b.onclick=()=>{S.productPlan=b.dataset.plan;S.design.plan=b.dataset.plan;persist();navigate('/setup')});const playDemo=()=>{const m=document.createElement('div');m.className='modal';m.style.background='#000';m.innerHTML=`<button class="close" aria-label="Đóng" style="color:#fff;top:20px;right:20px;font-size:40px;">×</button><video src="/videodemonew.mp4" autoplay muted controls playsinline webkit-playsinline preload="auto" style="width:100%; height:100%; max-height:100vh; object-fit:contain; outline:none;"></video>`;document.body.appendChild(m);const v=m.querySelector('video');if(v){v.muted=true;v.setAttribute('muted','');v.setAttribute('playsinline','true');v.setAttribute('webkit-playsinline','true');v.setAttribute('preload','auto');v.play().catch(()=>{});}$('.close',m).onclick=()=>m.remove();};document.querySelectorAll('a[href="#demo"]').forEach(link=>link.addEventListener('click',e=>{e.preventDefault();playDemo();}));$('#demo-play')?.addEventListener('click',playDemo);$('#demo-vid-container')?.addEventListener('click',playDemo)}
function about(){shell(`<main class="about-page-v2">
<section class="about-hero-v2">
  <div class="about-hero-grid">
    <div class="hero-product-shot about-hero-shot">
      <img class="about-floral" src="/flow.png" alt="" aria-hidden="true">
      <div class="shot-frame"><img src="/hinh1.jpg" alt="Khung ảnh Framie tích hợp NFC, chạm điện thoại để mở trang kỷ niệm"></div>
    </div>
    <div class="about-hero-copy">
      <h1>VỀ FRAMIE</h1>
      <div class="about-divider"><i>♥</i></div>
      <h2>Cùng nhau lưu giữ<br><em>một câu chuyện</em></h2>
    </div>
  </div>
</section>

<section class="about-story-v2">
  <span class="eyebrow-hearts">♡ CÂU CHUYỆN THƯƠNG HIỆU ♡</span>
  <h2 class="script-heading"><em>Câu chuyện thương hiệu</em></h2>
  <div class="story-card-v2">
    <p>Tình yêu đâu chỉ có những ngày đầy ắp màu hồng ngọt ngào mà còn có những lần bất đồng quan điểm hay giận dỗi. Khi bạn muốn lựa chọn một món quà tặng kỷ niệm mang tính cá nhân hóa, kết nối để làm lành hay những đêm yêu xa muốn nghe một giọng nói ấm áp quan tâm. Tụi mình nhận ra “Ảnh trong máy thì trôi mất, khung hình để bàn lại quá im lìm chẳng thể mang đến giá trị cảm xúc đa giác quan”.</p>
    <p>Tụi mình tự hỏi “Giá như những chiếc khung ảnh xinh xắn đó có thể thay bạn nói ra những điều bạn khó nói ra trực tiếp hay đoạn nhạc ngày tỏ tình thì đáng yêu biết mấy!”. Và từ đó <strong class="brand-accent">Framie</strong> ra đời.</p>
    <p>Đến với <strong class="brand-accent">Framie</strong>, bạn sẽ được tự tay may đo để tạo ra chiếc khung ảnh mang dấu ấn riêng của hai bạn. Từ chọn kiểu khung, màu sắc đến để một chiếc NFC bé xinh chứa những giai điệu quen thuộc của hai bạn. Chỉ cần một cái chạm nhẹ điện thoại vào khung, thanh âm thân thương sẽ vang lên mang đến sự bất ngờ và giúp món quà của bạn trở nên thật đáng nhớ. <strong class="brand-accent">Framie</strong> sẽ là chiếc phao giúp bạn dỗ người yêu của mình những khi phụng phịu hay cái ôm vô hình sưởi ấm nỗi nhớ khi yêu xa và là món quà tạo nên sự khác biệt.</p>
    <div class="story-card-footer">
      <p><strong><span class="brand-accent">Framie</span> · Gói trọn khoảnh khắc, giữ trọn yêu thương.</strong></p>
      <a class="btn primary" href="/setup">Khám phá Framie →</a>
    </div>
  </div>
</section>

<section class="about-why-v2">
  <span class="eyebrow-hearts">♡ TẠI SAO NÊN CHỌN FRAMIE ♡</span>
  <div class="why-grid">
    <article>
      <b>01.</b>
      <h3>Tiên phong quà tặng <em>Thoughtful</em></h3>
      <small>Độc đáo – Ý nghĩa – Khác biệt</small>
      <p>Framie là món quà hoàn hảo cho những dịp đặc biệt như sinh nhật, kỷ niệm, ngày cưới hay lễ tết. Một món quà nhỏ nhưng chứa đựng cả tấm lòng và những kỷ niệm vô giá.</p>
    </article>
    <article>
      <b>02.</b>
      <h3>Kết nối hoàn hảo giữa <em>hiện tại và những khoảnh khắc đáng nhớ</em></h3>
      <p>Chỉ với một cú chạm, bạn có thể mở ra những kỷ niệm đã được lưu giữ, xem lại hình ảnh, video, hoặc những lời nhắn yêu thương. Framie giúp bạn và người thân gần nhau hơn, dù ở bất cứ đâu.</p>
    </article>
  </div>
</section>

<section class="about-values-v2">
  <span class="eyebrow-hearts">♡ GIÁ TRỊ CỐT LÕI ♡</span>
  <div class="values-grid-v2">
    <article>
      <b>01</b>
      <h3>Cá nhân hóa</h3>
      <p>Tự do gửi gắm dấu ấn riêng độc bản qua kiểu khung, màu sắc, hình ảnh, sticker, âm thanh và các mẫu gợi ý.</p>
    </article>
    <article>
      <b>02</b>
      <h3>Đổi mới trải nghiệm</h3>
      <p>Xóa nhòa ranh giới vật lý và số qua NFC, tạo ra trải nghiệm đa giác quan bằng chạm, hình ảnh và thanh âm.</p>
    </article>
    <article>
      <b>03</b>
      <h3>Gắn kết</h3>
      <p>Khơi gợi ký ức và làm sâu sắc mối quan hệ bằng những chi tiết, giọng nói và giai điệu quen thuộc.</p>
    </article>
  </div>
</section>

<section class="about-cta-v2">
  <span class="eyebrow-hearts">♡ KEEP WHAT MATTERS ♡</span>
  <h2>Một món quà nhỏ.<br><em>Một câu chuyện thật dài.</em></h2>
  <a class="btn primary" href="/shop">Khám phá ngay →</a>
</section>
</main>`)}
const BLOG_COVERS=['/hinh8.jpg','/hinh9.jpg','/hinh10.jpg','/hinh11.jpg','/hinh12.jpg'];
const blogCover=id=>BLOG_COVERS[Math.abs((id||0)-1)%BLOG_COVERS.length];

const normalizeCategory = c => {
  if (!c) return 'Khác';
  const val = String(c).trim();
  if (val === 'Lifestyle' || val === 'Khác') return 'Khác';
  if (val === 'Cẩm nang' || val === 'Hướng dẫn') return 'Hướng dẫn';
  if (val === 'Cảm hứng' || val === 'Ý tưởng') return 'Ý tưởng';
  if (val === 'Công nghệ' || val === 'NFC') return 'NFC';
  if (val === 'Tình yêu') return 'Tình yêu';
  if (val === 'Quà tặng') return 'Quà tặng';
  if (val === 'Kỷ niệm') return 'Kỷ niệm';
  return 'Khác';
};

// ─── Markdown parser (lightweight) ──────────────────────────────────────────
function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  const lines = match[1].split(/\r?\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const idx = line.indexOf(':');
    if (idx < 0) { i++; continue; }
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    // Remove surrounding quotes from value
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    // Handle YAML inline array: tags: ["a", "b"] or tags: [a, b]
    if (val.startsWith('[')) {
      // Collect multi-line array if not closed yet
      let arrayStr = val;
      while (!arrayStr.includes(']') && i + 1 < lines.length) {
        i++;
        arrayStr += ' ' + lines[i].trim();
      }
      // Parse array items: strip brackets, split by comma, remove quotes
      meta[key] = arrayStr
        .replace(/^\[|\]$/g, '')
        .split(',')
        .map(s => s.trim().replace(/^"|"$|^'|'$/g, ''))
        .filter(Boolean);
    } else {
      meta[key] = val;
    }
    i++;
  }
  return { meta, body: match[2].trim() };
}

function md2html(md) {
  return md
    // images first so they render as real HTML, not literal text
    .replace(/!\[(.+?)\]\((.+?)\)/g, '<img src="$2" alt="$1" />')
    .replace(/^!\[(.+?)\]\((.+?)\)$/gm, '<figure class="md-figure"><img src="$2" alt="$1" /></figure>')
    // headings
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h1>$1</h1>')
    // bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // blockquote
    .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
    // hr
    .replace(/^---$/gm, '<hr>')
    // unordered list
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    .replace(/(<li>.*<\/li>\n?)+/g, m => `<ul>${m}</ul>`)
    // inline code
    .replace(/`(.+?)`/g, '<code>$1</code>')
    // links
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>')
    // paragraphs (lines not starting with html tags)
    .split(/\n{2,}/)
    .map(block => {
      block = block.trim();
      if (!block) return '';
      if (/^<(h[1-6]|ul|ol|blockquote|hr|li|img|figure)/.test(block)) return block;
      return `<p>${block.replace(/\n/g, ' ')}</p>`;
    })
    .join('\n');
}

// List of all .md blog post slugs — add new file here to add new blog post
const MD_BLOG_SLUGS = [
  'khung-anh-nfc-la-gi-cach-hoat-dong-va-huong-dan-chon-mua',
  'qua-tang-cam-xuc',
  'thiet-ke-mot-framie',
  'y-tuong-qua-tang',
  'nfc-la-gi',
  'qua-tot-nghiep',
  'bi-quyet-giu-lua-yeu-xa',
];

// Fetch + parse a .md blog post from /posts/<slug>.md
async function fetchMdPost(slug) {
  try {
    const r = await fetch(`/posts/${slug}.md`);
    if (!r.ok) return null;
    const raw = await r.text();
    const { meta, body } = parseFrontmatter(raw);
    // tags can be array (from YAML array) or comma-separated string
    let tags;
    if (Array.isArray(meta.tags)) tags = meta.tags;
    else if (meta.tags) tags = String(meta.tags).split(',').map(t => t.trim()).filter(Boolean);
    else tags = ['framie'];
    return {
      id: parseInt(meta.id) || 0,
      slug: meta.slug || slug,
      title: meta.title || slug,
      category: normalizeCategory(meta.category),
      excerpt: meta.excerpt || '',
      author: meta.author || 'Đội ngũ Framie',
      image: meta.image || null,          // e.g. "/blog/qua-tang.jpg"
      body,
      bodyHtml: md2html(body),
      date: meta.date || '',
      readTime: meta.readTime || '5 phút đọc',
      tags,
      // SEO: use title & excerpt directly (no need for separate seoTitle/seoDescription)
      seoTitle: meta.seoTitle || meta.title || slug,
      seoDescription: meta.seoDescription || meta.excerpt || '',
    };
  } catch { return null; }
}

// Fetch all MD posts in parallel
async function fetchAllMdPosts() {
  const results = await Promise.all(MD_BLOG_SLUGS.map(fetchMdPost));
  return sortBlogPosts(results.filter(Boolean));
}

function sortBlogPosts(posts) {
  return posts.sort((a, b) => {
    const dateOrder = String(b.date || '').localeCompare(String(a.date || ''));
    return dateOrder || (Number(b.id) || 0) - (Number(a.id) || 0);
  });
}

// Update <title>, <meta description>, og: and twitter: tags for full SEO
function setSEO({ title, description, image } = {}) {
  document.title = title ? `${title} | Framie` : 'Framie — Chạm để kết nối';

  // description
  let metaDesc = document.querySelector('meta[name="description"]');
  if (!metaDesc) { metaDesc = document.createElement('meta'); metaDesc.name = 'description'; document.head.appendChild(metaDesc); }
  metaDesc.content = description || 'Framie — Khung tranh nghệ thuật tích hợp NFC.';

  // og:title, twitter:title
  [['og:title','property'], ['twitter:title','name']].forEach(([prop, attr]) => {
    let el = document.querySelector(`meta[${attr}="${prop}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
    el.content = document.title;
  });

  // og:description, twitter:description
  [['og:description','property'], ['twitter:description','name']].forEach(([prop, attr]) => {
    let el = document.querySelector(`meta[${attr}="${prop}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
    el.content = metaDesc.content;
  });

  // og:image, twitter:image (for social sharing preview card)
  const imgUrl = image ? (image.startsWith('http') ? image : location.origin + image) : null;
  if (imgUrl) {
    [['og:image','property'], ['twitter:image','name']].forEach(([prop, attr]) => {
      let el = document.querySelector(`meta[${attr}="${prop}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(attr, prop); document.head.appendChild(el); }
      el.content = imgUrl;
    });
    // og:image:width/height hint (optional, helps crawlers)
    let w = document.querySelector('meta[property="og:image:width"]');
    if (!w) { w = document.createElement('meta'); w.setAttribute('property', 'og:image:width'); document.head.appendChild(w); }
    w.content = '1200';
  }

  // og:url
  let ogUrl = document.querySelector('meta[property="og:url"]');
  if (!ogUrl) { ogUrl = document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); document.head.appendChild(ogUrl); }
  ogUrl.content = location.href;

  // og:type
  let ogType = document.querySelector('meta[property="og:type"]');
  if (!ogType) { ogType = document.createElement('meta'); ogType.setAttribute('property', 'og:type'); document.head.appendChild(ogType); }
  ogType.content = 'article';

  // canonical link
  let canon = document.querySelector('link[rel="canonical"]');
  if (!canon) { canon = document.createElement('link'); canon.rel = 'canonical'; document.head.appendChild(canon); }
  canon.href = location.href;
}

const BLOG_POSTS_INITIAL = [
  {
    id: 1,
    slug: 'qua-tang-cam-xuc',

    title: 'Vì sao những món quà có câu chuyện thường được nhớ lâu hơn?',
    category: 'Khác',
    excerpt: 'Không cần cầu kỳ, chỉ cần đủ riêng tư và đúng người.',
    body: 'Giá trị của món quà không chỉ nằm ở vật thể. Một lớp ký ức số giúp người nhận quay lại khoảnh khắc ấy nhiều lần, theo cách nhẹ nhàng.',
    date: '2026-09-09',
    readTime: '9p',
    tags: ['yêu xa', 'tình yêu lứa đôi', 'lưu giữ ký ức']
  },
  {
    id: 2,
    slug: 'thiet-ke-mot-framie',
    title: 'Bắt đầu thiết kế Framie từ đâu?',
    category: 'Hướng dẫn',
    excerpt: 'Một checklist nhỏ để món quà trông đẹp và kể đúng câu chuyện.',
    body: 'Chọn ảnh chính trước, rồi thêm một câu thật ngắn. Với NFC, hãy dùng giọng nói hoặc video cho những điều khó nói bằng chữ.',
    date: '2026-09-09',
    readTime: '5p',
    tags: ['quà tốt nghiệp', 'quà tặng ý nghĩa', 'kỷ niệm đẹp']
  },
  {
    id: 3,
    slug: 'y-tuong-qua-tang',
    title: '7 ý tưởng Framie cho những người bạn yêu quý',
    category: 'Ý tưởng',
    excerpt: 'Sinh nhật, tốt nghiệp, yêu xa, gia đình và những ngày rất riêng.',
    body: 'Hãy bắt đầu từ một khoảnh khắc, một câu nói hoặc một kỷ niệm. Sau đó xây trải nghiệm quanh điều đó bằng ảnh, video, âm thanh và lời nhắn.',
    date: '2026-09-09',
    readTime: '5p',
    tags: ['1000 ngày yêu', 'kỷ niệm ngày cưới', 'album ảnh số']
  },
  {
    id: 4,
    slug: 'nfc-la-gi',
    title: 'NFC là gì và vì sao một lần chạm có thể kể cả câu chuyện?',
    category: 'NFC',
    excerpt: 'Hiểu NFC theo cách đơn giản và gần gũi.',
    body: 'NFC là lớp kết nối giúp điện thoại mở một địa chỉ web gắn với sản phẩm mà không cần ứng dụng riêng. Người nhận chỉ cần đưa điện thoại lại gần vùng NFC để mở trang ký ức.',
    date: '2026-09-09',
    readTime: '5p',
    tags: ['công nghệ nfc', 'chạm điện thoại', 'trải nghiệm phygital']
  },
  {
    id: 5,
    slug: 'qua-tot-nghiep',
    title: 'Một món quà để nhớ về ngày mình đã lớn',
    category: 'Quà tặng',
    excerpt: 'Giữ một ngày quan trọng lại trong ảnh, lời nhắn và một lần chạm.',
    body: 'Từ một bức ảnh tốt nghiệp đến lời chúc bằng chính giọng nói của bạn, Framie biến một món quà nhỏ thành một câu chuyện nhiều lớp.',
    date: '2026-09-09',
    readTime: '7p',
    tags: ['ý tưởng custom', 'quà tặng sáng tạo', 'gợi ý quà tặng']
  },
  {
    id: 6,
    slug: 'bi-quyet-giu-lua-yeu-xa',
    title: 'Bí quyết giữ lửa yêu xa cùng khung tranh Framie',
    category: 'Tình yêu',
    excerpt: 'Dù khoảng cách hàng ngàn cây số, một lần chạm NFC nghe lại giọng nói của người ấy sẽ mang lại cảm giác ấm áp.',
    body: 'Yêu xa chưa bao giờ là điều dễ dàng. Những cuộc gọi qua màn hình đôi khi không thể thay thế một cái ôm hay một kỷ niệm hữu hình.',
    date: '2026-09-09',
    readTime: '6p',
    tags: ['yêu xa', 'tình yêu lứa đôi', 'lưu giữ ký ức']
  },
  {
    id: 7,
    slug: 'luu-giu-1000-ngay-yeu',
    title: 'Lưu giữ 1000 ngày yêu bằng âm thanh và hình ảnh',
    category: 'Kỷ niệm',
    excerpt: 'Tổng hợp 1000 ngày bên nhau trong chiếc khung tranh thông minh kết hợp NFC.',
    body: '1000 ngày bên nhau là chặng đường có đủ vui buồn, giận hờn và yêu thương. Tôn vinh kỷ niệm bằng album ảnh và lời chúc âm thanh.',
    date: '2026-09-09',
    readTime: '5p',
    tags: ['1000 ngày yêu', 'kỷ niệm ngày cưới', 'album ảnh số']
  }
];

async function blog(){
  setSEO({ title: 'Blog — Ý tưởng quà tặng & kỷ niệm', description: 'Những gợi ý nhỏ về quà tặng, NFC, thiết kế và cách kể chuyện bằng ký ức.' });

  // Try loading from .md files first, fall back to API, then hardcoded
  let posts = await fetchAllMdPosts();
  if (!posts.length) {
    try {
      const apiPosts = await fetch(API+'/posts').then(r => r.json());
      if (Array.isArray(apiPosts) && apiPosts.length) posts = apiPosts;
    } catch {}
  }
  if (!posts.length) posts = BLOG_POSTS_INITIAL;

  posts = posts.map((p, idx) => {
    const fallback = BLOG_POSTS_INITIAL[idx % BLOG_POSTS_INITIAL.length];
    const cat = normalizeCategory(p.category || fallback.category);
    return {
      id: p.id || fallback.id,
      slug: p.slug || fallback.slug,
      title: p.title || fallback.title,
      category: cat,
      excerpt: p.excerpt || fallback.excerpt,
      body: p.body || fallback.body,
      bodyHtml: p.bodyHtml || '',
      date: p.date || fallback.date,
      readTime: p.readTime || fallback.readTime || '5 phút đọc',
      tags: p.tags && p.tags.length ? p.tags : (fallback.tags || ['kỷ niệm', 'framie'])
    };
  });
  posts = sortBlogPosts(posts);

  const categories = ['Tất cả', 'Tình yêu', 'Quà tặng', 'Kỷ niệm', 'NFC', 'Ý tưởng', 'Hướng dẫn', 'Khác'];

  shell(`<main class="page">
    <div class="page-head">
      <span class="eyebrow">BLOG</span>
      <h1>Ý tưởng để<br><em>trao điều ý nghĩa</em></h1>
      <p>Những gợi ý nhỏ về quà tặng, NFC, thiết kế và cách kể chuyện bằng ký ức.</p>
    </div>
    <div class="blog-search-centered">
      <span class="search-icon-rose">⌕</span>
      <input id="blog-search" type="text" placeholder="Tìm bài viết..." autocomplete="off">
    </div>
    <div class="blog-categories-filter">
      ${categories.map(c => `<button type="button" class="cat-pill ${c==='Tất cả'?'active':''}" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
    </div>
    <div id="posts" class="blog-grid-modern">
      ${posts.map(p => `
        <a class="modern-blog-card" href="/blog/${p.slug}" data-category="${esc(p.category)}">
          <div class="modern-card-cover">
            <img src="${blogCover(p.id)}" alt="${esc(p.title)}" loading="lazy">
          </div>
          <div class="modern-card-content">
            <span class="modern-cat-badge">${esc(p.category)}</span>
            <h2 class="modern-card-title">${esc(p.title)}</h2>
            <p class="modern-card-excerpt">${esc(p.excerpt)}</p>
            <div class="modern-card-meta">
              <span>📅 ${esc(p.date)}</span>
              <span>⏱ ${esc(p.readTime)}</span>
            </div>
            <div class="modern-card-tags">
              ${p.tags.map(t => `<span>🏷️ ${esc(t)}</span>`).join('')}
            </div>
          </div>
        </a>
      `).join('')}
    </div>
  </main>`);

  let activeCat = 'Tất cả';
  let searchTerm = '';
  const filterPosts = () => {
    $$('#posts .modern-blog-card').forEach(card => {
      const catMatch = activeCat === 'Tất cả' || card.dataset.category === activeCat;
      const textMatch = !searchTerm || card.innerText.toLowerCase().includes(searchTerm.toLowerCase());
      card.style.display = (catMatch && textMatch) ? 'flex' : 'none';
    });
  };
  $$('.cat-pill').forEach(btn => {
    btn.onclick = () => {
      $$('.cat-pill').forEach(x => x.classList.remove('active'));
      btn.classList.add('active');
      activeCat = btn.dataset.cat;
      filterPosts();
    };
  });
  $('#blog-search')?.addEventListener('input', e => {
    searchTerm = e.target.value;
    filterPosts();
  });
}


async function blogPost(slug){
  // Try .md file first, then API, then hardcoded fallback
  let p = await fetchMdPost(slug);
  if (!p) {
    try {
      const res = await fetch(API+'/posts/'+encodeURIComponent(slug));
      if(res.ok) p = await res.json();
    } catch {}
  }
  if(!p || p.message) p = BLOG_POSTS_INITIAL.find(x => x.slug === slug);
  if(!p) return shell(`<main class="page"><h1>Không tìm thấy bài viết</h1></main>`);

  // SEO: title, description, og:image all from frontmatter
  setSEO({
    title: p.seoTitle || p.title,
    description: p.seoDescription || p.excerpt,
    image: p.image || null,
  });

  let all = await fetchAllMdPosts();
  if (!all.length) all = BLOG_POSTS_INITIAL;
  const related = all.filter(x => x.slug !== slug).slice(0, 4);
  const dateStr = p.date || (p.createdAt ? new Date(p.createdAt).toLocaleDateString('vi-VN') : '');
  const readTime = p.readTime || '5 phút đọc';
  // Render MD body as HTML if available, otherwise plain paragraphs
  const bodyContent = p.bodyHtml
    ? p.bodyHtml
    : esc(p.body||'').split(/\n+/).map(x => `<p>${x}</p>`).join('');

  shell(`<main class="page narrow post">
    <a class="text-link back-link" href="/blog">← Về Blog</a>
    <div class="post-hero" style="background-image:url('${p.image || blogCover(p.id)}')">
      <div class="post-hero-scrim">
        <span class="eyebrow">${esc(p.category)}</span>
        <h1>${esc(p.title)}</h1>
        <div class="post-meta-row">
          <span>${esc(p.author)}</span>
          <span class="dot">·</span>
          <span>📅 ${esc(dateStr)}</span>
          <span class="dot">·</span>
          <span>⏱ ${esc(readTime)}</span>
          <button class="btn ghost share-btn" id="share-post" type="button">⤴ Chia sẻ</button>
        </div>
      </div>
    </div>
    <div class="post-layout">
      <article class="post-body md-content">
        ${bodyContent}
      </article>
      <aside class="post-sidebar">
        <h3>Bài viết khác</h3>
        ${related.map(r => `
          <a class="related-post" href="/blog/${r.slug}">
            <img src="${blogCover(r.id)}" alt="${esc(r.title)}" loading="lazy">
            <div>
              <small>${esc(r.category)}</small>
              <span>${esc(r.title)}</span>
            </div>
          </a>
        `).join('')}
      </aside>
    </div>
  </main>`);

  $('#share-post')?.addEventListener('click', async () => {
    try {
      if(navigator.share){
        await navigator.share({title:p.title,text:p.excerpt,url:location.href});
      } else {
        await navigator.clipboard.writeText(location.href);
        alert('Đã sao chép liên kết bài viết.');
      }
    } catch {}
  });
}
function shop(){shell(`<main class="page"><div class="page-head"><span class="eyebrow">CỬA HÀNG · MADE FOR COUPLES</span><h1>Chọn một chiếc Framie<br><em>để khởi đầu hành trình</em></h1><p>Với ba mức trải nghiệm linh hoạt, Framie giúp bạn biến một kỷ niệm của hai người thành món quà hữu hình và một không gian digital riêng.</p></div><div class="shop-grid">${plans.map((p,i)=>{const sw=[['#ffffff','/hinh5.jpg'],['#E8D4D2','/hinh6.jpg'],['#FFD3D6','/hinh7.jpg']][i];return `<article class="shop-card" data-plan-card="${p.code}"><div class="shop-art"><div class="shop-frame-showcase"><div class="frame-product-shell" style="--frame-color:${sw[0]}"><div class="fake-frame shop-frame-${i+1}"><img src="${sw[1]}" alt="${p.name} preview"><span>NFC</span></div></div></div></div><div class="shop-info"><div class="plan-top"><b>${p.number}</b>${p.popular?'<span>Được chọn nhiều</span>':''}</div><h2>${p.name}</h2><p>${p.description}</p><ul>${p.features.map(f=>`<li>✓ ${f}</li>`).join('')}</ul><p class="fit"><b>Phù hợp:</b> ${p.note}</p><div class="price-row"><strong>${money(p.price)}</strong><button class="btn primary shop-setup" data-plan="${p.code}">Thiết lập →</button></div></div></article>`}).join('')}</div><section class="template-promo"><div class="template-promo-copy"><span class="eyebrow">MỚI · KHO TEMPLATE</span><h2>Không biết bắt đầu từ đâu?<br><em>Chọn ngay một mẫu có sẵn</em></h2><p>Các template được thiết kế theo từng chủ đề — kỷ niệm, sinh nhật, trưởng thành. Chọn một mẫu, thay ảnh của hai người vào và tiếp tục tuỳ chỉnh như bình thường.</p><a class="btn primary" href="/templates">Khám phá Kho Template →</a></div><div class="template-promo-strip">${templates.slice(0,3).map(t=>`<img src="${t.image}" alt="${esc(t.name)}">`).join('')}</div></section><section class="product-details"><span class="eyebrow">THÔNG TIN SẢN PHẨM</span><h2>Đẹp ở ngoài. Riêng ở bên trong</h2><div class="tabs"><button class="active" data-tab="material">Chất liệu</button><button data-tab="spec">Thông số</button><button data-tab="use">Hướng dẫn</button><button data-tab="warranty">Bảo hành</button></div><div id="tab-panel" class="tab-panel"><p>Khung được định hướng theo phong cách premium, bề mặt tối giản, tông màu ấm và ưu tiên cảm giác quà tặng. Nội dung NFC là lớp số đi kèm sản phẩm.</p></div></section></main>`);$$('.shop-setup').forEach(b=>b.onclick=()=>{S.productPlan=b.dataset.plan;S.design.plan=S.productPlan;persist();navigate('/setup')});const data={material:'Khung có các lựa chọn Trắng kem, Gỗ sáng, Đen, Beige, Hồng pastel và Đỏ trầm.',spec:'Kích thước 10×15, 13×18, 15×21 và 20×30 cm; khung đứng hoặc ngang.',use:'Thiết kế → xem lại → đặt hàng. Khi nhận quà, đưa điện thoại hỗ trợ NFC tới vùng NFC trên khung để mở trang riêng.',warranty:'Chính sách đổi trả và bảo hành được cập nhật theo đơn hàng thực tế. Liên hệ Framie khi cần hỗ trợ.'};$$('[data-tab]').forEach(b=>b.onclick=()=>{$$('[data-tab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');$('#tab-panel').innerHTML=`<p>${data[b.dataset.tab]}</p>`})}
function contact(){shell(`<main class="page contact"><div class="contact-copy"><span class="eyebrow">LIÊN HỆ</span><h1>Để Framie<br><em>nghe câu chuyện của bạn</em></h1><p class="lead">Cần tư vấn thiết kế, đơn hàng hay hỗ trợ NFC? Hãy để lại thông tin, đội ngũ Framie sẽ phản hồi.</p><div class="contact-list"><div><b>Hotline</b><a href="tel:0345562908">0345562908</a></div><div><b>Email</b><a href="mailto:framienfc@gmail.com">framienfc@gmail.com</a></div><div><b>Địa chỉ</b><span>279 Nguyễn Tri Phương, Phường Diên Hồng, TP. Hồ Chí Minh<br>Plus Code: 7P28QM69+C9</span></div></div></div><div class="contact-side"><form id="contact" class="card-form"><h3>Gửi yêu cầu</h3><input name="name" required placeholder="Họ và tên"><input name="email" type="email" required placeholder="Email"><input name="phone" required placeholder="Số điện thoại"><textarea name="message" required placeholder="Nội dung bạn muốn Framie hỗ trợ"></textarea><button class="btn primary full">Gửi yêu cầu →</button><p id="contact-msg" class="form-note"></p></form><div class="map-card"><div class="map-top"><span>FRAMIE STUDIO</span><b>279 Nguyễn Tri Phương</b></div><iframe title="Framie map" loading="lazy" src="https://www.google.com/maps?q=279%20Nguy%E1%BB%85n%20Tri%20Ph%C6%B0%C6%A1ng%2C%20Ph%C6%B0%E1%BB%9Dng%20Di%C3%AAn%20H%E1%BB%93ng%2C%20TP.%20H%E1%BB%93%20Ch%C3%AD%20Minh%207P28QM69%2BC9&output=embed"></iframe></div></div></main>`);$('#contact').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));$('#contact-msg').textContent='Đang gửi...';fetch(API+'/contact',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(f)}).catch(()=>{});try{const r=await fetch('https://formsubmit.co/ajax/framienfc@gmail.com',{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify({name:f.name,email:f.email,phone:f.phone,message:f.message,_subject:'Yêu cầu liên hệ mới từ '+f.name})});const x=await r.json();if(x.success){$('#contact-msg').textContent='Đã gửi yêu cầu. Chúng tôi sẽ phản hồi sớm nhất qua email.';e.currentTarget.reset()}else{$('#contact-msg').textContent='Có lỗi xảy ra khi gửi. Vui lòng thử lại.'}}catch(err){$('#contact-msg').textContent='Có lỗi xảy ra khi gửi. Vui lòng thử lại.'}}}
function policy(){shell(`<main class="page narrow policy"><span class="eyebrow">PHÁP LÝ</span><h1>Chính sách<br><em>Framie</em></h1><div class="policy-body">${PRIVACY}<h2 id="refund">ĐỔI TRẢ & BẢO HÀNH</h2><p>FRAMIE tiếp nhận hỗ trợ đối với sản phẩm có lỗi sản xuất, sai khác so với cấu hình đã xác nhận hoặc các vấn đề phát sinh do hệ thống. Vui lòng liên hệ FRAMIE với mã đơn hàng và thông tin cần thiết để được hướng dẫn xử lý.</p></div></main>`)}
function auth(){const reg=parseRoute().p==='/register',forgot=parseRoute().p==='/forgot';if(forgot){shell(`<main class="auth-page"><div class="auth-card"><span class="eyebrow">KHÔI PHỤC TÀI KHOẢN</span><h1>Đặt lại mật khẩu</h1><p>Nhập email để nhận hướng dẫn khôi phục.</p><form id="forgot"><input name="identity" type="email" required placeholder="Email"><button class="btn primary full">Gửi hướng dẫn →</button></form><a class="switch" href="/login">← Quay lại đăng nhập</a></div></main>`);$('#forgot').onsubmit=async e=>{e.preventDefault();await fetch(API+'/auth/forgot',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});alert('Nếu tài khoản tồn tại, hướng dẫn khôi phục đã được tiếp nhận.');return} ;return}
shell(`<main class="auth-page"><div class="auth-side"><span class="eyebrow">FRAMIE ACCOUNT</span><h2>Một nơi để<br><em>giữ lại những gì bạn đã tạo</em></h2><p>Lưu thiết kế, quản lý đơn hàng và chỉnh sửa nội dung NFC bất cứ lúc nào.</p></div><div class="auth-card"><span class="eyebrow">${reg?'ĐĂNG KÝ':'ĐĂNG NHẬP'}</span><h1>${reg?'Tạo tài khoản Framie.':'Chào mừng trở lại.'}</h1><form id="auth">${reg?`<input name="name" required placeholder="Họ và tên"><input name="phone" required placeholder="Số điện thoại">`:''}<input name="${reg?'email':'identity'}" ${reg?'type="email"':''} required placeholder="${reg?'Email':'Email hoặc số điện thoại'}"><input name="password" type="password" minlength="6" required placeholder="Mật khẩu"><div class="auth-options">${reg?'':`<label><input type="checkbox"> Ghi nhớ đăng nhập</label><a href="/forgot">Quên mật khẩu?</a>`}</div><div id="err"></div><button class="btn primary full">${reg?'Tạo tài khoản':'Đăng nhập'} →</button></form><a href="${API}/auth/google/start" class="btn ghost full google">G <span>Tiếp tục với Google</span></a><a class="switch" href="/${reg?'login':'register'}">${reg?'Đã có tài khoản? Đăng nhập':'Chưa có tài khoản? Đăng ký'}</a></div></main>`);if(parseRoute().q.get('error')==='google')$('#err').innerHTML=`<div class="error">Không thể đăng nhập bằng Google. Vui lòng thử lại hoặc dùng email.</div>`;$('#auth').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.currentTarget));const endpoint=reg?'register':'login';const r=await fetch(API+'/auth/'+endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});const x=await r.json();if(!r.ok){$('#err').innerHTML=`<div class="error">${esc(x.message)}</div>`;return}setAuth(x);navigate('/dashboard')}}
function base64UrlDecode(str){let s=String(str||'').replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return decodeURIComponent(atob(s).split('').map(c=>'%'+('00'+c.charCodeAt(0).toString(16)).slice(-2)).join(''))}
function googleAuthComplete(){const {q}=parseRoute();const data=q.get('data');try{if(!data)throw new Error('missing');const payload=JSON.parse(base64UrlDecode(data));setAuth(payload);navigate('/dashboard')}catch{navigate('/login?error=google')}}
const PRIVACY=`<h2>CHÍNH SÁCH BẢO MẬT THÔNG TIN - FRAMIE</h2><p>Chính sách này giải thích cách FRAMIE thu thập, sử dụng và bảo vệ dữ liệu khi bạn tạo, lưu trữ và hiển thị nội dung trên các sản phẩm quà tặng tích hợp NFC.</p><p>Bằng việc truy cập website, tạo nội dung hoặc chủ động tải dữ liệu lên hệ thống FRAMIE, bạn xác nhận đã đọc, hiểu và đồng ý với các điều khoản trong chính sách này.</p><h3>1. PHẠM VI VÀ CÁC LOẠI DỮ LIỆU THU THẬP</h3><ul><li><b>Dữ liệu nội dung:</b> hình ảnh, video, ghi âm âm thanh, văn bản/lời nhắn cá nhân.</li><li><b>Thông tin tài khoản:</b> họ tên, email hoặc số điện thoại khi đăng ký.</li><li><b>Thông tin đơn hàng:</b> dữ liệu cần thiết để thanh toán, giao hàng và hỗ trợ khách hàng.</li></ul><p>FRAMIE chỉ thu thập và xử lý những thông tin cần thiết cho việc cung cấp dịch vụ.</p><h3>2. PHƯƠNG THỨC TẢI DỮ LIỆU VÀ QUYỀN TRUY CẬP THIẾT BỊ</h3><ul><li>Tải hình ảnh, video, âm thanh và tệp liên quan trực tiếp từ máy tính hoặc điện thoại.</li><li>Khi ghi âm hoặc quay video trực tiếp, trình duyệt sẽ yêu cầu quyền Microphone/Camera.</li><li>Người dùng có thể cấp quyền truy cập thư viện ảnh hoặc tệp tin để lựa chọn nội dung.</li></ul><p>Bạn có quyền từ chối hoặc hủy các quyền này trong phần cài đặt của thiết bị/trình duyệt. Việc từ chối có thể khiến một số tính năng không hoạt động.</p><h3>3. MỤC ĐÍCH XỬ LÝ VÀ SỬ DỤNG DỮ LIỆU</h3><ul><li>Lưu trữ và hiển thị ảnh, video, âm thanh, văn bản.</li><li>Liên kết sản phẩm vật lý với trải nghiệm số thông qua mã định danh NFC.</li><li>Truy xuất nội dung khi người nhận chạm NFC hoặc truy cập đường dẫn được liên kết.</li><li>Xử lý, xác nhận và giao đơn hàng.</li><li>Cải thiện hiệu suất, phát hiện lỗi và nâng cao trải nghiệm.</li></ul><h3>4. CAM KẾT BẢO MẬT VÀ BẢO VỆ DỮ LIỆU</h3><ul><li>Không bán hoặc cho thuê ảnh, video, âm thanh và lời nhắn cá nhân cho bên thứ ba nhằm mục đích quảng cáo/tiếp thị.</li><li>FRAMIE không tự động sử dụng nội dung cá nhân cho hoạt động truyền thông hoặc đăng tải công khai.</li><li>Người tạo có thể bật <b>mật khẩu bảo vệ NFC</b>; khi bật, người nhận phải nhập đúng mật khẩu mới xem được nội dung.</li><li>Nội dung NFC có thể được quản trị và thay đổi từ Dashboard của chủ thiết kế.</li></ul><h3>5. QUYỀN KIỂM SOÁT VÀ XÓA DỮ LIỆU</h3><p>Theo quy định pháp luật hiện hành, bao gồm Nghị định 13/2023/NĐ-CP, người dùng có quyền biết, đồng ý, truy cập, chỉnh sửa, xóa, phản đối hoặc yêu cầu hạn chế xử lý dữ liệu trong phạm vi hệ thống hỗ trợ.</p><p>Lưu ý: xóa dữ liệu hoặc rút lại sự đồng ý có thể khiến nội dung NFC tương ứng không còn hiển thị.</p><h3>6. CHIA SẺ DỮ LIỆU VỚI BÊN THỨ BA</h3><ul><li>Nhà cung cấp hạ tầng lưu trữ đám mây.</li><li>Đối tác giao nhận/vận chuyển.</li><li>Đơn vị trung gian thanh toán.</li></ul><p>FRAMIE chỉ cung cấp thông tin cần thiết để các bên thực hiện chức năng được giao và không bán dữ liệu cá nhân cho mục đích thương mại.</p><h3>7. BẢO MẬT SẢN PHẨM NFC</h3><p>Chip NFC chỉ chứa đường dẫn liên kết (URL), không lưu trực tiếp hình ảnh, video hoặc dữ liệu cá nhân. Khi mất sản phẩm hoặc nghi ngờ truy cập trái phép, hãy liên hệ FRAMIE để được hỗ trợ khóa nội dung hoặc đặt lại mã bảo mật.</p><h3>8. THỜI GIAN LƯU TRỮ DỮ LIỆU</h3><p>FRAMIE lưu trữ nội dung trong khoảng thời gian cần thiết để cung cấp dịch vụ hoặc theo thời hạn của gói dịch vụ. Một số dữ liệu có thể được lưu lâu hơn nếu cần để thực hiện nghĩa vụ pháp lý hoặc giải quyết tranh chấp.</p><h3>9. THAY ĐỔI CHÍNH SÁCH</h3><p>FRAMIE có thể cập nhật Chính sách này để phản ánh thay đổi của sản phẩm, công nghệ hoặc pháp luật. Phiên bản cập nhật sẽ được đăng tải công khai trên website kèm thời điểm hiệu lực.</p><h3>10. THÔNG TIN LIÊN HỆ</h3><p>Đơn vị: FRAMIE<br>Địa chỉ: 279 Nguyễn Tri Phương, Phường Diên Hồng, TP. Hồ Chí Minh<br>Hotline hỗ trợ: 0345562908<br>Email tiếp nhận: framienfc@gmail.com<br>Website chính thức: FRAMIE</p><p><b>Chính sách này có hiệu lực kể từ ngày đăng tải.</b></p>`
function privacy(){const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="modal-card privacy"><button class="close" aria-label="Đóng">×</button><div class="privacy-scroll">${PRIVACY}</div><div class="privacy-consents"><label class="check"><input id="privacy-ok" type="checkbox"> Tôi đã đọc, hiểu và đồng ý với Điều khoản sử dụng cùng Chính sách bảo mật của FRAMIE.</label><label class="check"><input id="rights-ok" type="checkbox"> Tôi xác nhận có đầy đủ quyền sở hữu/quyền sử dụng đối với hình ảnh, video, âm thanh và văn bản tải lên; nội dung không vi phạm bản quyền, pháp luật hoặc quyền riêng tư của người khác.</label></div><button id="privacy-agree" class="btn primary full" disabled>Đồng ý & tiếp tục →</button></div>`;document.body.appendChild(m);$('.close',m).onclick=()=>m.remove();const sync=()=>$('#privacy-agree',m).disabled=!($('#privacy-ok',m).checked&&$('#rights-ok',m).checked);$('#privacy-ok',m).onchange=sync;$('#rights-ok',m).onchange=sync;$('#privacy-agree',m).onclick=()=>{S.privacy=true;S.step=4;persist();m.remove();renderSetup()}}
function resetDesign(){S.design=defaultDesign();S.nfc=defaultNfc();S.selected=null;S.nfcSelected=null;S.step=1;persist()}
function renderSetup(){
  const titles={1:'Chọn gói',2:'Chọn khung',4:'Custom khung vật lý',5:'Custom nội dung NFC',6:'Bảo mật',7:'Preview & đặt hàng'};
  const labels=[[1,'Chọn gói'],[2,'Chọn khung'],[4,'Thiết kế vật lý'],[5,'Nội dung NFC'],[6,'Bảo mật'],[7,'Xem lại']];
  if(S.step===3){S.step=2;persist();privacy();return}
  const current=labels.findIndex(x=>x[0]===S.step);
  const stepNo=current>=0?`${current+1}/${labels.length}`:'1/6';
  shell(`<main class="setup"><aside class="setup-side"><a href="/">← Trang chủ</a><div class="setup-title"><span class="eyebrow">TRẠM THIẾT LẬP</span><h2>Biến ý tưởng <em>thành Framie</em></h2><p class="setup-couple-note">Thiết kế riêng cho câu chuyện của hai người.</p></div><div class="progress">${labels.map(([step,label],i)=>`<button type="button" data-step="${step}" class="${S.step===step?'active':''}"><b>0${i+1}</b><span>${label}</span></button>`).join('')}</div></aside><section class="setup-main"><div class="setup-head"><div><span class="eyebrow">BƯỚC ${stepNo}</span><h1>${titles[S.step]||'Framie'}</h1></div><div class="setup-head-actions"><button id="reset-design" class="icon-btn" title="Làm mới" aria-label="Làm mới">↻</button><a href="/dashboard" class="icon-btn" aria-label="Dashboard"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="4" width="6" height="6" rx="1"></rect><rect x="14" y="4" width="6" height="6" rx="1"></rect><rect x="4" y="14" width="6" height="6" rx="1"></rect><rect x="14" y="14" width="6" height="6" rx="1"></rect></svg></a><button id="draft" class="btn ghost">Lưu bản nháp</button></div></div><div class="setup-body" id="setup-body"></div><div class="setup-foot"><button id="prev" class="btn ghost" ${S.step===1?'disabled':''}>← Quay lại</button><button id="next" class="btn primary">${S.step===7?(S.designHasOrder?'Lưu thay đổi':'Đặt hàng thiết kế này'):'Tiếp tục'} →</button></div></section></main>`);
  $$('[data-step]').forEach(b=>b.onclick=()=>{const n=+b.dataset.step;if(n>=4&&!S.privacy){privacy();return}S.step=n;persist();renderSetup()});
  $('#prev').onclick=()=>{if(S.step===4)S.step=2;else if(S.step===5)S.step=4;else if(S.step===6)S.step=5;else if(S.step===7)S.step=6;else if(S.step>1)S.step--;persist();renderSetup()};
  $('#next').onclick=async()=>{if(S.step===2){privacy();return}if(S.step===7){const d=await saveDesign('ready');if(!d)return;if(S.designHasOrder){alert('Đã lưu thay đổi cho thiết kế của bạn.');navigate('/dashboard');return}navigate(`/checkout?design=${d.id}`);return}S.step++;persist();renderSetup()};
  $('#draft').onclick=()=>saveDesign('draft',true);$('#reset-design').onclick=()=>{if(confirm('Làm mới toàn bộ thiết kế hiện tại?')){resetDesign();renderSetup()}};
  if(S.step===1)planStep();else if(S.step===2)frameStep();else if(S.step===4)physicalStep();else if(S.step===5)nfcStep();else if(S.step===6)securityStep();else reviewStep();
}
function securityStep(){
  const enabled=!!S.nfc.passwordEnabled;
  $('#setup-body').innerHTML=`<div class="security-step-shell"><div class="security-step-card"><span class="security-lock">🔒</span><span class="eyebrow">BẢO MẬT NFC</span><h2>Bạn có muốn đặt mật khẩu cho trang kỷ niệm?</h2><p>Mật khẩu sẽ được gắn với NFC này. Người nhận chỉ xem được nội dung sau khi nhập đúng mật khẩu.</p><div class="security-choice"><button type="button" class="security-choice-btn ${enabled?'selected':''}" id="security-yes"><b>Có, đặt mật khẩu</b><span>Trang NFC sẽ được bảo vệ.</span></button><button type="button" class="security-choice-btn ${!enabled?'selected':''}" id="security-no"><b>Không cần mật khẩu</b><span>Mở nội dung trực tiếp.</span></button></div><div id="security-password-wrap" class="security-password-wrap" ${enabled?'':'hidden'}><label>Mật khẩu NFC<input id="security-password" type="password" minlength="4" autocomplete="new-password" value="${esc(S.nfc.password||'')}" placeholder="Nhập tối thiểu 4 ký tự"><small>Chỉ bạn mới có thể thay đổi mật khẩu này trong Dashboard.</small></label></div><div class="security-step-actions"><span class="security-state">${enabled?'🔒 Đang bật bảo vệ':'🔓 Không đặt mật khẩu'}</span><button id="security-continue" class="btn primary">Tiếp tục →</button></div></div></div>`;
  const yes=$('#security-yes'),no=$('#security-no'),wrap=$('#security-password-wrap'),input=$('#security-password'),state=$('.security-state');
  const setEnabled=v=>{S.nfc.passwordEnabled=v;if(!v){delete S.nfc.password;S.nfc.passwordHash='';}wrap.hidden=!v;yes.classList.toggle('selected',v);no.classList.toggle('selected',!v);state.textContent=v?'🔒 Đang bật bảo vệ':'🔓 Không đặt mật khẩu';persist()};
  yes.onclick=()=>setEnabled(true);no.onclick=()=>setEnabled(false);input?.addEventListener('input',e=>{S.nfc.password=e.target.value;persist()});
  $('#security-continue').onclick=()=>{if(S.nfc.passwordEnabled&&String(S.nfc.password||'').length<4){alert('Mật khẩu NFC tối thiểu 4 ký tự.');input?.focus();return}S.step=7;persist();renderSetup()};
}
function planStep(){const cards=plans.map(p=>`<button type="button" class="selection ${S.design.plan===p.code?'selected':''}" data-plan="${p.code}"><div class="plan-top"><b>${p.number}</b>${p.popular?'<span>Được chọn nhiều</span>':''}</div><h2>${p.name}</h2><p>${p.description}</p><strong>${money(p.price)}</strong><ul>${p.features.map(f=>`<li>✓ ${f}</li>`).join('')}</ul><small>${p.note}</small></button>`).join('');$('#setup-body').innerHTML=`<div class="selection-grid">${cards}</div>`;$$('[data-plan]').forEach(b=>b.onclick=()=>{S.design.plan=b.dataset.plan;S.productPlan=b.dataset.plan;persist();planStep()})}
function frameStep(){$('#setup-body').innerHTML=`<div class="frame-grid"><div class="frame-controls"><div class="control-group"><h3>Frame orientation</h3><div class="choices">${frameShapes.map(f=>`<button type="button" class="choice ${S.design.frame===f[0]?'selected':''}" data-frame="${f[0]}"><div class="choice-frame ${f[0]}"></div><span>${f[1]}</span></button>`).join('')}</div></div><div class="control-group"><h3>Frame colors</h3><div class="swatches">${colors.map(c=>`<button type="button" class="swatch ${S.design.color===c[0]?'selected':''}" data-color="${c[0]}" title="${c[1]}" style="--sw:${c[2]}"></button>`).join('')}</div></div><div class="control-group"><h3>Màu nền khung</h3><div class="swatches">${bgColors.map(c=>`<button type="button" class="swatch ${c[0]?'':'no-bg'} ${(S.design.bg||'')===c[0]?'selected':''}" data-bg="${esc(c[0])}" title="${esc(c[1])}" style="--sw:${c[0]||'#fff'}"></button>`).join('')}<label class="swatch custom-bg-swatch" title="Chọn màu khác" style="--sw:${esc(S.design.bg||'#ffffff')}"><input id="bg-custom" type="color" value="${esc(S.design.bg||'#ffffff')}"></label></div></div><div class="control-group"><h3>Frame sizes</h3><div class="sizes">${sizes.map(x=>`<button type="button" class="size ${S.design.size===x?'selected':''}" data-size="${x}">${x}</button>`).join('')}</div></div></div><div>${framePreview()}<div class="frame-summary"><span>${frameLabel(S.design.frame)}</span><span>${S.design.size}</span></div></div></div>`;$$('[data-frame]').forEach(b=>b.onclick=()=>{S.design.frame=b.dataset.frame;persist();frameStep()});$$('[data-color]').forEach(b=>b.onclick=()=>{S.design.color=b.dataset.color;persist();frameStep()});$$('[data-bg]').forEach(b=>b.onclick=()=>{S.design.bg=b.dataset.bg||'';persist();frameStep()});$('#bg-custom')?.addEventListener('input',e=>{S.design.bg=e.target.value;persist();frameStep()});$$('[data-size]').forEach(b=>b.onclick=()=>{S.design.size=b.dataset.size;persist();frameStep()})}
function framePreview(scale='normal',interactive=false){return `<div class="preview-wrap ${scale}"><span>LIVE PREVIEW</span><div id="physical-canvas" class="frame-preview ${S.design.frame} ${S.design.color}" style="${S.design.bg?`background:${esc(S.design.bg)}`:''}">${[...S.design.elements].sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>renderPhysical(e,interactive)).join('')}<span class="nfc-badge">NFC</span></div><small>${frameLabel(S.design.frame,true)} · ${S.design.size}</small></div>`}
function renderPhysical(el,interactive=true){const selected=interactive&&S.selected===el.id?'selected':'';const handles=interactive?resizeHandlesHtml():'';const png=el.type==='sticker'&&el.src;const heightStyle=(el.type==='image'||png)?`${el.height??100}%`:`${el.height||70}px`;const s=`left:${el.x}%;top:${el.y}%;width:${el.width||35}%;height:${heightStyle};z-index:${el.z||1};transform:translate(-50%,-50%) rotate(${el.rotate||0}deg)`;if(el.type==='image')return `<div class="physical image ${selected}" data-el="${el.id}" style="${s}"><img src="${esc(el.src)}" style="object-position:${el.cropX??50}% ${el.cropY??50}%;transform:scale(${el.zoom||1})">${handles}</div>`;if(el.type==='sticker')return `<div class="physical sticker ${png?'img-sticker':''} ${selected}" data-el="${el.id}" style="${s}${png?'':`;font-size:${el.size||40}px`}">${png?`<img src="${esc(el.src)}" alt="">`:esc(el.text)}${handles}</div>`;return `<div class="physical text ${selected}" data-el="${el.id}" style="${s};font-size:${el.size||18}px;justify-content:${textAlignJustify(el.align)}"><span class="txt" style="font-family:${el.font||'Playfair Display'};${textStyleExtra(el)}">${esc(el.text).replace(/\n/g,'<br>')}</span>${handles}</div>`}
function physicalStep(){
  $('#setup-body').innerHTML=`<div class="editor-layout"><div class="editor-tools"><label class="tool">＋<b>Ảnh</b><input id="upload-physical" type="file" accept="image/*"></label><button class="tool" id="add-text" type="button">T<b>Văn bản</b></button><button class="tool" id="stickers" type="button">✦<b>Sticker</b></button><button class="tool" id="undo-physical" type="button" ${(S.undoPhysical||[]).length?'':'disabled'}>↩<b>Hoàn tác</b></button></div><div class="editor-area">${framePreview('normal',true)}</div><aside class="inspector">${S.selected?physicalInspector():`<div class="empty"><div>✦</div><h3>Chọn một thành phần</h3><p>Thêm ảnh, chữ hoặc sticker để bắt đầu. Click để chọn, kéo để di chuyển.</p></div>`}</aside></div>`;
  $('#upload-physical').onchange=e=>addImage(e,'physical');
  $('#add-text').onclick=()=>{snapshotPhysical();const id='e'+Date.now();const maxZ=Math.max(0,...S.design.elements.map(x=>x.z||0));const pos=nextPhysicalPos();S.design.elements.push({id,type:'text',x:pos.x,y:pos.y,size:23,width:60,height:70,rotate:0,z:maxZ+1,text:'Nhập nội dung',font:'Playfair Display'});S.selected=id;persist();physicalStep()};
  $('#stickers').onclick=()=>stickerModal(false);$('#undo-physical').onclick=()=>undoPhysical();bindPhysicalDrag();bindPhysicalResize();bindPhysicalImageDrop();wirePhysicalInspector();
}
function renderPhysicalInspectorOnly(){const panel=$('.editor-layout .inspector');if(!panel)return;panel.innerHTML=S.selected?physicalInspector():`<div class="empty"><div>✦</div><h3>Chọn một thành phần</h3><p>Thêm ảnh, chữ hoặc sticker để bắt đầu. Click để chọn, kéo để di chuyển.</p></div>`;$$('.physical').forEach(n=>n.classList.toggle('selected',n.dataset.el===S.selected));wirePhysicalInspector();const undoBtn=$('#undo-physical');if(undoBtn)undoBtn.disabled=!(S.undoPhysical||[]).length}
function snapshotPhysical(){S.undoPhysical=S.undoPhysical||[];S.undoPhysical.push(JSON.stringify(stripBase64(S.design.elements)));if(S.undoPhysical.length>10)S.undoPhysical.shift()}
function undoPhysical(){if(!S.undoPhysical||!S.undoPhysical.length)return;S.design.elements=JSON.parse(S.undoPhysical.pop());S.selected=null;persist();physicalStep()}
function selectPhysical(id){if(id!==S.selected)snapshotPhysical();S.selected=id;persist();renderPhysicalInspectorOnly()}
/* New photos/text/stickers used to always drop at the exact center (x:50,y:50),
   so from the 2nd element onward everything landed stacked on top of the
   previous one — dragging or clicking only ever reached the topmost (last
   added) layer, which read as "can't add more than 2 photos" / "can't
   interact". Cascade new elements around the center on a small repeating
   grid instead, matching what getSmartNextNfcY already does for the NFC side. */
function nextPhysicalPos(){const n=(S.design.elements||[]).length;const span=3,step=14;const i=n%(span*span);const col=i%span,row=Math.floor(i/span);return{x:50+(col-(span-1)/2)*step,y:50+(row-(span-1)/2)*step}}
async function addImage(e,kind){const f=e.target.files?.[0];if(!f)return;if(!S.user)return;const data=await fileToDataURL(f);const id=(kind==='physical'?'e':'n')+Date.now();if(kind==='physical'){snapshotPhysical();const isFirst=!S.design.elements.some(x=>x.type==='image');const maxZ=Math.max(0,...S.design.elements.map(x=>x.z||0));const pos=isFirst?{x:50,y:50}:nextPhysicalPos();const el={id,type:'image',src:data,x:pos.x,y:pos.y,width:isFirst?100:55,height:isFirst?100:65,rotate:0,z:isFirst?0:maxZ+1,zoom:1,cropX:50,cropY:50};S.design.elements.unshift(el);S.selected=id;
// Render immediately for preview but do NOT persist base64 to localStorage yet
physicalStep();
try{el.src=await uploadData(data,f.type);persist()/* only persist after real URL */;physicalStep()}catch(err){S.design.elements=S.design.elements.filter(x=>x.id!==id);if(S.selected===id)S.selected=null;persist();physicalStep();alert(err.message)}}e.target.value=''}
function fileToDataURL(f){return new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(f)})}
async function uploadData(data,mime){const r=await fetch(API+'/upload',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({data,mime})});const x=await r.json();if(!r.ok)throw new Error(x.message||'Upload thất bại');return x.url}
function physicalInspector(){const el=S.design.elements.find(x=>x.id===S.selected);if(!el)return '';const isMedia=el.type==='image';const pctH=isMedia||(el.type==='sticker'&&el.src);return `<div class="inspector-head"><div><span>CANVA STYLE EDITOR</span><b>${el.type==='image'?'Ảnh':el.type==='sticker'?'Sticker':'Văn bản'}</b></div><button id="delete-physical" type="button">Xoá</button></div>${el.type==='text'?`<label>Nội dung<textarea id="physical-text">${esc(el.text)}</textarea></label><label>Font<select id="font"><option ${el.font==='Playfair Display'?'selected':''}>Playfair Display</option><option ${el.font==='Cormorant Garamond'?'selected':''}>Cormorant Garamond</option><option ${el.font==='DM Sans'?'selected':''}>DM Sans</option><option ${el.font==='Georgia'?'selected':''}>Georgia</option><option ${el.font==='Arial'?'selected':''}>Arial</option></select></label>${textToolbarHtml(el)}`:''}${isMedia?`<label class="upload-box">Thay ảnh<input id="replace-physical" type="file" accept="image/*"></label><div class="control"><span>Zoom / scale</span><input id="p-zoom" type="range" min=".5" max="5" step=".05" value="${el.zoom||1}"></div><div class="control"><span>Crop X</span><input id="p-cropx" type="range" min="0" max="100" value="${el.cropX??50}"></div><div class="control"><span>Crop Y</span><input id="p-cropy" type="range" min="0" max="100" value="${el.cropY??50}"></div>`:''}<div class="control"><span>Kích thước</span><input id="p-size" type="range" min="8" max="90" value="${el.size||18}"></div><div class="control"><span>Độ rộng</span><input id="p-width" type="range" min="5" max="100" value="${el.width||35}"></div><div class="control"><span>Chiều cao</span><input id="p-height" type="range" min="${pctH?5:30}" max="${pctH?200:600}" value="${el.height??(pctH?100:70)}"></div><div class="grid2"><label>X<input id="p-x" type="number" min="0" max="100" value="${Math.round(el.x)}"></label><label>Y<input id="p-y" type="number" min="0" max="100" value="${Math.round(el.y)}"></label></div><div class="control"><span>Góc xoay</span><input id="p-rotate" type="range" min="-180" max="180" value="${el.rotate||0}"></div><div class="quick-actions"><button type="button" id="p-center">↔ Căn giữa</button><button type="button" id="p-front">Đưa lên cùng</button></div><div class="layer-actions"><button id="layer-up" type="button">↑ Lên lớp</button><button id="layer-down" type="button">↓ Xuống lớp</button></div>`}
function updatePhysicalNode(el){const node=$(`.physical[data-el="${el.id}"]`);if(!node)return;node.style.left=el.x+'%';node.style.top=el.y+'%';node.style.width=(el.width||35)+'%';node.style.height=(el.type==='image'||(el.type==='sticker'&&el.src))?((el.height??100)+'%'):((el.height||70)+'px');node.style.fontSize=(el.size||18)+'px';node.style.transform=`translate(-50%,-50%) rotate(${el.rotate||0}deg)`;node.style.zIndex=el.z||1;const img=node.querySelector('img');if(img&&el.type==='image'){img.style.objectPosition=`${el.cropX??50}% ${el.cropY??50}%`;img.style.transform=`scale(${el.zoom||1})`;}if(el.type==='text'){const txt=node.querySelector('.txt');node.style.justifyContent=textAlignJustify(el.align);if(txt){txt.innerHTML=esc(el.text).replace(/\n/g,'<br>');txt.style.fontFamily=el.font||'Playfair Display';txt.style.fontWeight=el.bold?700:400;txt.style.fontStyle=el.italic?'italic':'normal';txt.style.textAlign=el.align||'center';txt.style.color=el.color||'';if(el.bg){txt.style.background=el.bg;txt.style.padding='6px 10px';txt.style.borderRadius='8px'}else{txt.style.background='';txt.style.padding='';txt.style.borderRadius=''}}}}
function bindPhysicalImageDrop(){$$('.physical.image').forEach(node=>{node.ondragover=e=>{e.preventDefault();node.classList.add('drag-over')};node.ondragleave=()=>node.classList.remove('drag-over');node.ondrop=async e=>{e.preventDefault();node.classList.remove('drag-over');const f=e.dataTransfer.files?.[0];if(!f||!f.type.startsWith('image/'))return;const id=node.dataset.el;const target=S.design.elements.find(x=>x.id===id);if(!target)return;snapshotPhysical();const dataUrl=await fileToDataURL(f);target.src=dataUrl;updatePhysicalNode(target);// No persist here — wait for real URL
try{target.src=await uploadData(dataUrl,f.type);persist()}catch(err){alert(err.message)}}})}
function bindPhysicalDrag(){$$('.physical').forEach(node=>{node.onpointerdown=e=>{const id=node.dataset.el;const target=S.design.elements.find(x=>x.id===id);if(!target)return;selectPhysical(id);const isControl=e.target.closest('button,audio,video,iframe,input,textarea,select');const isHandle=e.target.closest('.drag-handle');if(isControl&&!isHandle)return;e.preventDefault();e.stopPropagation();const rect=node.parentElement.getBoundingClientRect(),sx=e.clientX,sy=e.clientY,ox=target.x,oy=target.y;node.setPointerCapture?.(e.pointerId);const move=ev=>{target.x=Math.max(2,Math.min(98,ox+(ev.clientX-sx)/rect.width*100));target.y=Math.max(2,Math.min(98,oy+(ev.clientY-sy)/rect.height*100));updatePhysicalNode(target)};const up=()=>{window.removeEventListener('pointermove',move);persist()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})};node.onclick=()=>selectPhysical(node.dataset.el)})}
function bindPhysicalResize(){$$('.physical .resize-handle').forEach(handle=>{handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const node=handle.closest('.physical');const id=node.dataset.el;const target=S.design.elements.find(x=>x.id===id);if(!target)return;const pos=handle.dataset.pos;const rect=node.parentElement.getBoundingClientRect();const sx=e.clientX,sy=e.clientY;const isImg=target.type==='image';const ow=target.width||35,oh=isImg?(target.height??100):(target.height||70),ox=target.x,oy=target.y;handle.setPointerCapture?.(e.pointerId);const move=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;const dxPct=dx/rect.width*100;if(pos.includes('e')){target.width=Math.max(5,ow+dxPct);target.x=ox+dxPct/2}else if(pos.includes('w')){target.width=Math.max(5,ow-dxPct);target.x=ox+dxPct/2}if(isImg){const dyPct=dy/rect.height*100;if(pos.includes('s')){target.height=Math.max(5,oh+dyPct);target.y=oy+dyPct/2}else if(pos.includes('n')){target.height=Math.max(5,oh-dyPct);target.y=oy+dyPct/2}}else{const dyPctForY=dy/rect.height*100;if(pos.includes('s')){target.height=Math.max(20,oh+dy);target.y=oy+dyPctForY/2}else if(pos.includes('n')){target.height=Math.max(20,oh-dy);target.y=oy+dyPctForY/2}}updatePhysicalNode(target)};const up=()=>{window.removeEventListener('pointermove',move);persist();renderPhysicalInspectorOnly()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})}})}
function bindNfcResize(){$$('#nfc-phone .nfc-el .resize-handle').forEach(handle=>{handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();const node=handle.closest('.nfc-el');const id=node.dataset.nfc;const target=S.nfc.elements.find(x=>x.id===id);if(!target)return;const pos=handle.dataset.pos;const rect=$('#nfc-phone .device-canvas').getBoundingClientRect();const sx=e.clientX,sy=e.clientY;const ow=target.width||84,oh=target.height||(target.type==='spotify'?152:target.type==='audio'?74:target.type==='video'?210:target.type==='image'?220:70),ox=target.x,oy=target.y;handle.setPointerCapture?.(e.pointerId);const move=ev=>{const dx=ev.clientX-sx,dy=ev.clientY-sy;const dxPct=dx/rect.width*100;if(pos.includes('e')){target.width=Math.max(10,ow+dxPct);target.x=ox+dxPct/2}else if(pos.includes('w')){target.width=Math.max(10,ow-dxPct);target.x=ox+dxPct/2}const dyPctForY=dy/rect.height*100;if(pos.includes('s')){target.height=Math.max(20,oh+dy);target.y=oy+dyPctForY/2}else if(pos.includes('n')){target.height=Math.max(20,oh-dy);target.y=oy+dyPctForY/2}updateNfcNode(target)};const up=()=>{window.removeEventListener('pointermove',move);persist();nfcStep()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})}})}
function swapLayer(list,id,dir){const sorted=[...list].sort((a,b)=>(a.z||0)-(b.z||0));const i=sorted.findIndex(x=>x.id===id);const j=dir>0?i+1:i-1;if(i<0||j<0||j>=sorted.length)return;[sorted[i].z,sorted[j].z]=[(sorted[j].z||0),(sorted[i].z||0)];}
function wirePhysicalInspector(){const el=S.design.elements.find(x=>x.id===S.selected);if(!el)return;const on=(id,k,fn=v=>v)=>$(id)?.addEventListener('input',e=>{el[k]=fn(e.target.value);persist();updatePhysicalNode(el)});on('#physical-text','text');on('#font','font');if(el.type==='text')wireTextToolbar(el,updatePhysicalNode);on('#p-zoom','zoom',Number);on('#p-cropx','cropX',Number);on('#p-cropy','cropY',Number);on('#p-height','height',Number);on('#p-size','size',Number);on('#p-width','width',Number);on('#p-x','x',Number);on('#p-y','y',Number);on('#p-rotate','rotate',Number);$('#delete-physical')?.addEventListener('click',()=>{S.design.elements=S.design.elements.filter(x=>x.id!==S.selected);S.selected=null;persist();physicalStep()});$('#replace-physical')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{el.src=await uploadData(await fileToDataURL(f),f.type);persist();physicalStep()}catch(err){alert(err.message)}});$('#layer-up')?.addEventListener('click',()=>{swapLayer(S.design.elements,S.selected,1);persist();physicalStep()});$('#layer-down')?.addEventListener('click',()=>{swapLayer(S.design.elements,S.selected,-1);persist();physicalStep()});$('#p-center')?.addEventListener('click',()=>{el.x=50;el.y=50;persist();physicalStep()});$('#p-front')?.addEventListener('click',()=>{const m=Math.max(0,...S.design.elements.map(x=>x.z||0));el.z=m+1;persist();physicalStep()})}
function stickerModal(nfcMode){const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="modal-card stickers"><div class="modal-head"><div><span class="eyebrow">STICKER</span><h2>Chọn một nét nhỏ</h2></div><button class="close">×</button></div><div class="sticker-tabs">${[['emoji','Emoji'],...stickerPacks.map(p=>[p.slug,p.label])].map(([k,l],i)=>`<button type="button" class="sticker-tab ${i===0?'active':''}" data-pack="${k}">${esc(l)}</button>`).join('')}</div><label class="upload-box sticker-upload">Tải ảnh lên làm sticker riêng<input id="custom-sticker-upload" type="file" accept="image/*"></label><div class="sticker-grid"></div></div>`;document.body.appendChild(m);
  const grid=$('.sticker-grid',m);
  const paint=pack=>{
    if(pack==='emoji'){grid.classList.remove('png');grid.innerHTML=stickers.map(s=>`<button data-st="${encodeURIComponent(s[0])}"><span>${s[0]}</span><small>${s[1]}</small></button>`).join('')}
    else{const p=stickerPacks.find(x=>x.slug===pack);grid.classList.add('png');grid.innerHTML=Array.from({length:p.count},(_,i)=>`<button data-st-src="${st(p.slug,i+1)}"><img src="${st(p.slug,i+1)}" alt="" loading="lazy"></button>`).join('')}
    wire();
  };
  const addPng=src=>{const id=(nfcMode?'n':'e')+Date.now();if(nfcMode){snapshotNfc();S.nfc.elements.push({id,type:'sticker',src,x:50,y:55,size:40,width:30,height:110,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,text:''});S.nfcSelected=id}else{snapshotPhysical();const pos=nextPhysicalPos();S.design.elements.push({id,type:'sticker',src,x:pos.x,y:pos.y,size:42,width:22,height:26,rotate:0,z:Math.max(0,...S.design.elements.map(x=>x.z||0))+1,text:''});S.selected=id}m.remove();persist();nfcMode?nfcStep():physicalStep()};
  const wire=()=>{$$('[data-st-src]',m).forEach(b=>b.onclick=()=>addPng(b.dataset.stSrc));$$('[data-st]',m).forEach(b=>b.onclick=()=>{
const val=decodeURIComponent(b.dataset.st);const id=(nfcMode?'n':'e')+Date.now();if(nfcMode){snapshotNfc();S.nfc.elements.push({id,type:'sticker',x:50,y:65,size:40,width:30,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,text:val}) ;S.nfcSelected=id}else{snapshotPhysical();const pos=nextPhysicalPos();S.design.elements.push({id,type:'sticker',x:pos.x,y:pos.y,size:42,width:30,rotate:0,z:Math.max(0,...S.design.elements.map(x=>x.z||0))+1,text:val});S.selected=id}m.remove();persist();nfcMode?nfcStep():physicalStep()})};
  $$('.sticker-tab',m).forEach(t=>t.onclick=()=>{$$('.sticker-tab',m).forEach(x=>x.classList.remove('active'));t.classList.add('active');paint(t.dataset.pack)});
  paint('emoji');
  $('.close',m).onclick=()=>m.remove();
  $('#custom-sticker-upload',m).onchange=async e=>{const f=e.target.files?.[0];if(!f)return;const dataUrl=await fileToDataURL(f);const id=(nfcMode?'n':'e')+Date.now();m.remove();if(nfcMode){snapshotNfc();const el={id,type:'image',src:dataUrl,x:50,y:getSmartNextNfcY('image'),width:24,height:110,zoom:1,cropX:50,cropY:50,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,text:''};S.nfc.elements.push(el);S.nfcSelected=id;persist();nfcStep();try{el.src=await uploadData(dataUrl,f.type);persist()}catch(err){S.nfc.elements=S.nfc.elements.filter(x=>x.id!==id);if(S.nfcSelected===id)S.nfcSelected=null;persist();nfcStep();alert(err.message)}}else{snapshotPhysical();const maxZ=Math.max(0,...S.design.elements.map(x=>x.z||0));const pos=nextPhysicalPos();const el={id,type:'image',src:dataUrl,x:pos.x,y:pos.y,width:22,height:22,zoom:1,cropX:50,cropY:50,rotate:0,z:maxZ+1};S.design.elements.push(el);S.selected=id;persist();physicalStep();try{el.src=await uploadData(dataUrl,f.type);persist()}catch(err){S.design.elements=S.design.elements.filter(x=>x.id!==id);if(S.selected===id)S.selected=null;persist();physicalStep();alert(err.message)}}}}
function bindAudioTriggers(root=document){$$('.audio-trigger',root).forEach(btn=>btn.onclick=()=>{const src=btn.dataset.audioSrc;if(!src)return;const existing=$('.inline-audio-player',btn.parentElement);if(existing){existing.play();return}const audio=document.createElement('audio');audio.className='inline-audio-player';audio.controls=true;audio.src=src;audio.autoplay=true;btn.insertAdjacentElement('afterend',audio);});$$('audio',root).forEach(a=>a.addEventListener('click',e=>e.stopPropagation()));}
const NFC_CANVAS_PX=4400;
function getSmartNextNfcY(type){const elements=S.nfc.elements||[];if(!elements.length)return 20;let maxBottom=0;elements.forEach(el=>{const h=el.height||(el.type==='spotify'?168:el.type==='audio'?74:el.type==='video'?210:el.type==='image'?220:el.type==='cover'?210:70);const bottom=el.y+((h/NFC_CANVAS_PX*100)/2);if(bottom>maxBottom)maxBottom=bottom});const newH=(type==='spotify'?168:type==='audio'?74:type==='video'?210:type==='image'?220:type==='cover'?210:70);const newHPct=(newH/NFC_CANVAS_PX)*100;const gap=4.2;const nextY=maxBottom+gap+(newHPct/2);return Math.max(15,Math.min(92,Math.round(nextY)))}
function nfcStep(){const __nfcScrollTop=$('#nfc-phone .device-screen')?.scrollTop||0;$('#setup-body').innerHTML=`<div class="nfc-layout"><div class="nfc-tools"><button class="tool" id="nt" type="button">T<b>Văn bản</b></button><label class="tool">＋<b>Hình ảnh</b><input id="ni" type="file" accept="image/*"></label><button class="tool" id="nc" type="button">▢<b>Khung hồng</b></button><button class="tool" id="na" type="button">◉<b>Âm thanh</b></button><button class="tool" id="ns" type="button">✦<b>Sticker</b></button><label class="tool">▣<b>Video</b><input id="nv" type="file" accept="video/*"></label><button class="tool" id="add-spotify" type="button">♫<b>Spotify</b></button><button class="tool" id="undo-nfc" type="button" ${(S.undoNfc||[]).length?'':'disabled'}>↩<b>Hoàn tác</b></button></div><div class="phone-center"><div class="device-stage"><div class="device-phone" id="nfc-phone"><div class="dynamic-island"></div><div class="device-screen">${nfcPhoneContent()}</div></div></div></div><aside class="inspector nfc-inspector">${S.nfcSelected?nfcInspector():`<div class="empty"><div>⌁</div><h3>Nội dung NFC</h3><p>Click để chọn. Kéo để di chuyển. Mỗi lớp có thể đổi kích thước, chiều cao, xoay và sắp lớp.</p></div>`}</aside></div>`;$('#nt').onclick=()=>{snapshotNfc();const id='n'+Date.now();S.nfc.elements.push({id,type:'text',x:50,y:getSmartNextNfcY('text'),size:18,width:84,height:70,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,text:'Nhập nội dung',font:'Playfair Display'});S.nfcSelected=id;persist();nfcStep()};$('#nc').onclick=()=>{snapshotNfc();const id='n'+Date.now();S.nfc.elements.push({id,type:'cover',x:50,y:getSmartNextNfcY('cover'),width:84,height:210,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1});S.nfcSelected=id;persist();nfcStep()};$('#ni').onchange=e=>addNfcFile(e,'image');$('#nv').onchange=e=>addNfcFile(e,'video');$('#ns').onclick=()=>stickerModal(true);$('#na').onclick=()=>addNfcAudioElement();$('#add-spotify').onclick=()=>addSpotifyElement();$('#undo-nfc').onclick=()=>undoNfc();bindNfcDrag();bindNfcResize();wireNfcInspector();bindAudioTriggers();bindSpotifyEmbeds();const __nfcScreen=$('#nfc-phone .device-screen');if(__nfcScreen)__nfcScreen.scrollTop=__nfcScrollTop}
function renderNfcInspectorOnly(){const panel=$('.nfc-layout .nfc-inspector');if(!panel)return;panel.innerHTML=S.nfcSelected?nfcInspector():`<div class="empty"><div>⌁</div><h3>Nội dung NFC</h3><p>Click để chọn. Kéo để di chuyển. Mỗi lớp có thể đổi kích thước, chiều cao, xoay và sắp lớp.</p></div>`;$$('.nfc-el').forEach(n=>n.classList.toggle('selected',n.dataset.nfc===S.nfcSelected));wireNfcInspector();bindAudioTriggers(panel);bindSpotifyEmbeds(panel);const undoBtn=$('#undo-nfc');if(undoBtn)undoBtn.disabled=!(S.undoNfc||[]).length}
function snapshotNfc(){S.undoNfc=S.undoNfc||[];S.undoNfc.push(JSON.stringify(stripBase64(S.nfc.elements)));if(S.undoNfc.length>10)S.undoNfc.shift()}
function undoNfc(){if(!S.undoNfc||!S.undoNfc.length)return;S.nfc.elements=JSON.parse(S.undoNfc.pop());S.nfcSelected=null;persist();nfcStep()}
function selectNfc(id){if(id!==S.nfcSelected)snapshotNfc();S.nfcSelected=id;persist();renderNfcInspectorOnly()}
function nfcPhoneContent(){return nfcPhoneContentFrom(S.nfc,true)}
function nfcPhoneContentFrom(x,interactive=false){return `<div class="device-canvas"><div class="nfc-top">${logo('compact')}<span>tap to remember</span></div>${(x.elements||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>renderNfc(e,interactive)).join('')}${x.recording?`<div class="saved-audio"><audio class="saved-audio-player" controls preload="metadata" src="${esc(x.recording)}"></audio></div>`:''}</div>`}
function calcNfcCropHeight(x){const elements=x.elements||[];if(!elements.length)return 250;let maxBottom=0;elements.forEach(el=>{const h=el.height||(el.type==='spotify'?152:el.type==='audio'?74:el.type==='video'?210:el.type==='image'?220:el.type==='cover'?210:70);const topPx=(el.y/100)*NFC_CANVAS_PX;const bottomPx=topPx+(h/2);if(bottomPx>maxBottom)maxBottom=bottomPx});if(x.recording){maxBottom=Math.max(maxBottom,140)}return Math.ceil(maxBottom+16)}
function nfcLandingContentFrom(x){const cropH=calcNfcCropHeight(x);return `<div class="nfc-landing-stage" style="height:${cropH}px;min-height:${cropH}px"><div class="device-canvas"><div class="nfc-top">${logo('compact')}<span>tap to remember</span></div>${(x.elements||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>renderNfc(e,false)).join('')}${x.recording?`<div class="saved-audio"><audio class="saved-audio-player" controls preload="metadata" src="${esc(x.recording)}"></audio></div>`:''}</div></div>`}
function spotifyEmbedUrl(value){const v=String(value||'').trim();if(!v)return '';if(v.startsWith('spotify:')){const m=v.match(/^spotify:(track|album|playlist|episode|show|artist):([A-Za-z0-9]+)$/i);return m?`https://open.spotify.com/embed/${m[1]}/${m[2]}`:''}const m=v.match(/open\.spotify\.com\/(track|album|playlist|episode|show|artist)\/([A-Za-z0-9]+)/i);return m?`https://open.spotify.com/embed/${m[1]}/${m[2]}`:''}
function renderNfc(el,interactive=true){const selected=interactive&&S.nfcSelected===el.id?'selected':'';const effectiveWidth=el.width||84;const h=el.height||(el.type==='spotify'?152:el.type==='audio'?74:el.type==='video'?210:el.type==='image'?220:el.type==='cover'?210:70);const dragHandle=(el.type==='audio'||el.type==='spotify'||el.type==='cover'||el.type==='video')?`<span class="drag-handle" title="Kéo để di chuyển">⠿</span>`:'';const s=`left:${el.x}%;top:${el.y}%;width:${effectiveWidth}%;height:${h}px;z-index:${el.z||1};font-size:${el.size||16}px;transform:translate(-50%,-50%) rotate(${el.rotate||0}deg)`;let inner;if(el.type==='image')inner=`<img src="${esc(el.src)}" style="object-position:${el.cropX??50}% ${el.cropY??50}%;transform:scale(${el.zoom||1})">`;else if(el.type==='video')inner=`${dragHandle}<video controls playsinline preload="metadata" src="${esc(el.src)}"></video>`;else if(el.type==='audio')inner=`${dragHandle}<audio controls preload="metadata" src="${esc(el.src||'')}"></audio>`;else if(el.type==='spotify'){const embed=spotifyEmbedUrl(el.url);inner=embed?`${dragHandle}<div class="spotify-embed"><iframe src="${embed}" title="Spotify music" loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"></iframe></div>`:`${dragHandle}<div class="nfc-audio">♫ Thêm link Spotify</div>`}else if(el.type==='cover')inner=`<div class="nfc-cover-box"></div>`;else if(el.type==='sticker')inner=el.src?`<img src="${esc(el.src)}" alt="">`:esc(el.text);else inner=`<span style="font-family:${esc(el.font||'Playfair Display')};${textStyleExtra(el)}">${esc(el.text).replace(/\n/g,'<br>')}</span>`;const outerStyle=el.type==='text'?`${s};justify-content:${textAlignJustify(el.align)}`:s;const handles=interactive?resizeHandlesHtml():'';return `<div class="nfc-el ${el.type} ${selected}" data-nfc="${el.id}" style="${outerStyle}">${inner}${handles}</div>`}
function addSpotifyElement(){const url=prompt('Dán link Spotify (track / album / playlist / podcast):',S.nfc.spotify||'');if(url===null)return;const embed=spotifyEmbedUrl(url);if(!embed){alert('Link Spotify chưa đúng định dạng. Hãy dùng link từ open.spotify.com hoặc spotify:track/...');return}snapshotNfc();const id='n'+Date.now();S.nfc.elements.push({id,type:'spotify',x:50,y:getSmartNextNfcY('spotify'),width:94,height:168,size:12,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,url});S.nfc.spotify=url;S.nfcSelected=id;persist();nfcStep()}
function addNfcAudioElement(){snapshotNfc();const id='n'+Date.now();S.nfc.elements.push({id,type:'audio',x:50,y:getSmartNextNfcY('audio'),size:13,width:94,height:74,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,text:'Lời nhắn thoại',label:'Lời nhắn thoại',src:null});S.nfcSelected=id;persist();nfcStep()}
async function addNfcFile(e,type){const f=e.target.files?.[0];if(!f)return;const dataUrl=await fileToDataURL(f);snapshotNfc();const id='n'+Date.now();const el={id,type,src:dataUrl,x:50,y:getSmartNextNfcY(type),width:84,height:type==='image'?220:210,size:16,zoom:1,cropX:50,cropY:50,rotate:0,z:Math.max(0,...S.nfc.elements.map(x=>x.z||0))+1,text:''};S.nfc.elements.push(el);S.nfcSelected=id;
// Render immediately, defer persist until real URL
nfcStep();try{el.src=await uploadData(dataUrl,f.type);persist()/* only after real URL */;nfcStep()}catch(err){S.nfc.elements=S.nfc.elements.filter(x=>x.id!==id);if(S.nfcSelected===id)S.nfcSelected=null;persist();nfcStep();alert(err.message)}e.target.value=''}
const formatRecTime=s=>{const m=Math.floor(s/60);return `${m}:${String(s%60).padStart(2,'0')}`};
function stopRecordTimer(){if(S.recordTimerId){clearInterval(S.recordTimerId);S.recordTimerId=null}}
function startRecord(target=null){if(S.recording){stopRecordTimer();S.recording=false;S.recordProcessing=true;const btn=$('#record-el');if(btn){btn.textContent='Đang xử lý...';btn.disabled=true}nfcStep();S.mediaRecorder.stop();return}if(!window.isSecureContext){alert('Ghi âm chỉ hoạt động khi trang được mở qua HTTPS. Vui lòng mở Framie qua địa chỉ https://...');return}if(!navigator.mediaDevices?.getUserMedia||typeof MediaRecorder==='undefined'){alert('Trình duyệt không hỗ trợ ghi âm. Hãy dùng Chrome/Safari mới.');return}navigator.mediaDevices.getUserMedia({audio:true}).then(stream=>{S.mediaStream=stream;S.recChunks=[];const preferred=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported?.(t));S.mediaRecorder=preferred?new MediaRecorder(stream,{mimeType:preferred}):new MediaRecorder(stream);S.recording=true;S.recordingTarget=target;S.recordProcessing=false;S.recordSeconds=0;stopRecordTimer();S.recordTimerId=setInterval(()=>{S.recordSeconds++;const btn=$('#record-el');if(btn)btn.textContent=`Dừng ghi · ${formatRecTime(S.recordSeconds)}`;},1000);S.mediaRecorder.ondataavailable=e=>e.data.size&&S.recChunks.push(e.data);S.mediaRecorder.onstop=async()=>{stopRecordTimer();const outType=(S.mediaRecorder.mimeType||'audio/webm').split(';')[0];const blob=new Blob(S.recChunks,{type:outType});if(!blob.size){alert('Không ghi được âm thanh nào. Hãy thử lại và nói gần microphone hơn.');S.recording=false;S.recordingTarget=null;S.recordProcessing=false;nfcStep();stream.getTracks().forEach(t=>t.stop());return}const data=await fileToDataURL(blob);try{const src=await uploadData(data,outType);if(target){const el=S.nfc.elements.find(x=>x.id===target);if(el)el.src=src}else S.nfc.recording=src;persist();S.recording=false;S.recordingTarget=null;S.recordProcessing=false;nfcStep()}catch(err){alert(err.message);S.recording=false;S.recordingTarget=null;S.recordProcessing=false;nfcStep()}stream.getTracks().forEach(t=>t.stop())};S.mediaRecorder.start();nfcStep()}).catch(err=>{S.recording=false;S.recordingTarget=null;S.recordProcessing=false;if(err.name==='NotAllowedError')alert('Bạn đã từ chối quyền Microphone. Hãy vào cài đặt trình duyệt bật lại quyền Microphone cho Framie rồi thử lại.');else if(err.name==='NotFoundError')alert('Không tìm thấy microphone trên thiết bị này.');else alert('Không thể ghi âm ('+(err.name||err.message||'lỗi không xác định')+'). Hãy kiểm tra quyền Microphone và thử lại.')})}
function extractAudioFromVideo(file){
  return new Promise((resolve,reject)=>{
    if(typeof MediaRecorder==='undefined'){reject(new Error('Trình duyệt không hỗ trợ tách audio từ video.'));return}
    const url=URL.createObjectURL(file);
    const video=document.createElement('video');
    video.src=url;video.muted=true;video.volume=0;video.playsInline=true;video.preload='auto';
    const cleanup=()=>{URL.revokeObjectURL(url);video.remove()};
    video.addEventListener('loadedmetadata',()=>{
      let stream;
      try{stream=video.captureStream?video.captureStream():video.mozCaptureStream?video.mozCaptureStream():null}catch{stream=null}
      if(!stream){cleanup();reject(new Error('Trình duyệt không hỗ trợ tách audio từ video.'));return}
      const audioTracks=stream.getAudioTracks();
      if(!audioTracks.length){cleanup();reject(new Error('Video này không có âm thanh.'));return}
      const audioStream=new MediaStream(audioTracks);
      const preferred=['audio/webm;codecs=opus','audio/webm','audio/mp4'].find(t=>MediaRecorder.isTypeSupported?.(t));
      const rec=preferred?new MediaRecorder(audioStream,{mimeType:preferred}):new MediaRecorder(audioStream);
      const chunks=[];
      rec.ondataavailable=e=>e.data.size&&chunks.push(e.data);
      rec.onstop=()=>{const outType=(rec.mimeType||'audio/webm').split(';')[0];cleanup();resolve(new Blob(chunks,{type:outType}))};
      rec.onerror=()=>{cleanup();reject(new Error('Không tách được âm thanh từ video này.'))};
      video.addEventListener('ended',()=>rec.state==='recording'&&rec.stop());
      rec.start();
      video.play().catch(err=>{cleanup();reject(err)});
    });
    video.addEventListener('error',()=>{cleanup();reject(new Error('Không đọc được file video.'))});
  });
}
function updateNfcNode(el){const node=$(`.nfc-el[data-nfc="${el.id}"]`);if(!node)return;node.style.left=el.x+'%';node.style.top=el.y+'%';node.style.width=(el.width||84)+'%';node.style.height=(el.height||(el.type==='spotify'?152:el.type==='audio'?74:el.type==='video'?210:el.type==='image'?220:70))+'px';node.style.fontSize=(el.size||16)+'px';node.style.transform=`translate(-50%,-50%) rotate(${el.rotate||0}deg)`;node.style.zIndex=el.z||1;const img=node.querySelector('img');if(img){img.style.objectPosition=`${el.cropX??50}% ${el.cropY??50}%`;img.style.transform=`scale(${el.zoom||1})`;}const iframe=node.querySelector('iframe');if(iframe&&el.url){const src=spotifyEmbedUrl(el.url);if(src&&iframe.src!==src)iframe.src=src;}if(el.type==='text'){const span=node.querySelector('span');if(span){span.innerHTML=esc(el.text).replace(/\n/g,'<br>');span.style.fontFamily=el.font||'Playfair Display';span.style.fontWeight=el.bold?700:400;span.style.fontStyle=el.italic?'italic':'normal';span.style.textAlign=el.align||'center';span.style.color=el.color||'';if(el.bg){span.style.background=el.bg;span.style.padding='6px 10px';span.style.borderRadius='8px'}else{span.style.background='';span.style.padding='';span.style.borderRadius=''}}node.style.justifyContent=textAlignJustify(el.align)}}
function bindNfcDrag(){$$('.nfc-el').forEach(el=>{el.onpointerdown=e=>{const id=el.dataset.nfc;const target=S.nfc.elements.find(x=>x.id===id);if(!target)return;selectNfc(id);const isControl=e.target.closest('button,audio,video,iframe,input,textarea,select');const isHandle=e.target.closest('.drag-handle');if(isControl&&!isHandle)return;e.preventDefault();e.stopPropagation();const rect=$('#nfc-phone .device-canvas').getBoundingClientRect(),sx=e.clientX,sy=e.clientY,ox=target.x,oy=target.y;el.setPointerCapture?.(e.pointerId);const move=ev=>{target.x=Math.max(4,Math.min(96,ox+(ev.clientX-sx)/rect.width*100));target.y=Math.max(3,Math.min(97,oy+(ev.clientY-sy)/rect.height*100));updateNfcNode(target)};const up=()=>{window.removeEventListener('pointermove',move);persist()};window.addEventListener('pointermove',move);window.addEventListener('pointerup',up,{once:true})};el.onclick=()=>selectNfc(el.dataset.nfc)})}
function nfcInspector(){const el=S.nfc.elements.find(x=>x.id===S.nfcSelected);if(!el)return '';const isRecThis=S.recording&&(S.recordingTarget?S.recordingTarget===el.id:S.nfcSelected===el.id);return `<div class="inspector-head"><div><span>CANVA STYLE EDITOR</span><b>${el.type==='image'?'Hình ảnh':el.type==='video'?'Video':el.type==='audio'?'Âm thanh':el.type==='spotify'?'Spotify':el.type==='sticker'?'Sticker':'Văn bản'}</b></div><button id="delete-nfc" type="button">Xoá</button></div>${el.type==='text'?`<label>Nội dung<textarea id="nfc-text">${esc(el.text)}</textarea></label><label>Font<select id="nfc-font"><option ${el.font==='Playfair Display'?'selected':''}>Playfair Display</option><option ${el.font==='Cormorant Garamond'?'selected':''}>Cormorant Garamond</option><option ${el.font==='Georgia'?'selected':''}>Georgia</option><option ${el.font==='DM Sans'?'selected':''}>DM Sans</option><option ${el.font==='Arial'?'selected':''}>Arial</option></select></label>${textToolbarHtml(el)}`:''}${el.type==='sticker'?`<label>Nhãn sticker<input id="sticker-text" value="${esc(el.text)}"></label>`:''}${el.type==='spotify'?`<label>Link Spotify<input id="spotify-url" value="${esc(el.url||'')}" placeholder="https://open.spotify.com/track/..."></label><p class="muted">Spotify được nhúng thật vào trang. Người xem cần chạm nút phát theo chính sách của Spotify.</p>`:''}${el.type==='image'?`<label class="upload-box">Thay hình<input id="nfc-replace" type="file" accept="image/*"></label><div class="control"><span>Zoom ảnh</span><input id="nfc-zoom" type="range" min=".5" max="5" step=".05" value="${el.zoom||1}"></div><div class="control"><span>Crop X</span><input id="nfc-cropx" type="range" min="0" max="100" value="${el.cropX??50}"></div><div class="control"><span>Crop Y</span><input id="nfc-cropy" type="range" min="0" max="100" value="${el.cropY??50}"></div>`:''}${el.type==='audio'?`<div class="record-panel"><b>Âm thanh</b><label>Tên hiển thị<input id="audio-label" value="${esc(el.label||el.text||'Lời nhắn thoại')}" placeholder="Lời nhắn thoại"></label><button id="record-el" class="btn primary" type="button" ${S.recordProcessing?'disabled':''}>${isRecThis?`Dừng ghi · ${formatRecTime(S.recordSeconds||0)}`:(S.recordProcessing?'Đang xử lý...':'Ghi âm')}</button><label class="upload-box">Upload audio<input id="audio-upload" type="file" accept="audio/*"></label><label class="upload-box">Tách audio từ video<input id="audio-from-video" type="file" accept="video/*"></label><small class="muted">Chọn một video, Framie sẽ tự tách phần âm thanh để dùng làm lời nhắn.</small>${el.src?`<audio controls src="${esc(el.src)}"></audio>`:''}</div>`:''}${el.type==='video'?`<label class="upload-box">Thay video<input id="nfc-replace" type="file" accept="video/*"></label>`:''}<div class="control"><span>Kích thước chữ / icon</span><input id="nfc-size" type="range" min="8" max="60" value="${el.size||16}"></div><div class="control"><span>Độ rộng</span><input id="nfc-width" type="range" min="15" max="98" value="${el.width||84}"></div><div class="control"><span>Chiều cao</span><input id="nfc-height" type="range" min="30" max="600" value="${el.height||(el.type==='spotify'?168:el.type==='audio'?74:el.type==='video'?210:el.type==='image'?220:70)}"></div><div class="grid2"><label>X<input id="nfc-x" type="number" min="0" max="100" value="${Math.round(el.x)}"></label><label>Y<input id="nfc-y" type="number" min="0" max="100" value="${Math.round(el.y)}"></label></div><div class="control"><span>Góc xoay</span><input id="nfc-rotate" type="range" min="-180" max="180" value="${el.rotate||0}"></div><div class="quick-actions"><button id="nfc-center" type="button">↔ Căn giữa</button></div><div class="layer-actions"><button id="nfc-up" type="button">↑ Lên lớp</button><button id="nfc-down" type="button">↓ Xuống lớp</button></div>`}
function wireNfcInspector(){const el=S.nfc.elements.find(x=>x.id===S.nfcSelected);if(!el)return;const on=(id,k,fn=v=>v)=>$(id)?.addEventListener('input',e=>{el[k]=fn(e.target.value);persist();updateNfcNode(el)});on('#nfc-text','text');on('#nfc-font','font');if(el.type==='text')wireTextToolbar(el,updateNfcNode);on('#sticker-text','text');on('#audio-label','label');on('#audio-label','text');on('#nfc-zoom','zoom',Number);on('#nfc-cropx','cropX',Number);on('#nfc-cropy','cropY',Number);on('#nfc-size','size',Number);on('#nfc-width','width',Number);on('#nfc-height','height',Number);on('#nfc-x','x',Number);on('#nfc-y','y',Number);on('#nfc-rotate','rotate',Number);on('#spotify-url','url',v=>{const value=String(v||'').trim();if(spotifyEmbedUrl(value)){el.url=value;S.nfc.spotify=value;return value}return el.url||''});$('#delete-nfc')?.addEventListener('click',()=>{S.nfc.elements=S.nfc.elements.filter(x=>x.id!==S.nfcSelected);S.nfcSelected=null;persist();nfcStep()});$('#record-el')?.addEventListener('click',()=>startRecord(S.nfcSelected));$('#audio-upload')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{el.src=await uploadData(await fileToDataURL(f),f.type);persist();nfcStep()}catch(err){alert(err.message)}});$('#audio-from-video')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;const label=e.target.closest('label');const original=label.firstChild.textContent;label.firstChild.textContent='Đang tách âm thanh...';e.target.disabled=true;try{const blob=await extractAudioFromVideo(f);if(!blob.size)throw new Error('Không tách được âm thanh từ video này.');el.src=await uploadData(await fileToDataURL(blob),blob.type);persist();nfcStep()}catch(err){alert(err.message||'Không tách được âm thanh từ video này.');label.firstChild.textContent=original;e.target.disabled=false}});$('#nfc-replace')?.addEventListener('change',async e=>{const f=e.target.files?.[0];if(!f)return;try{el.src=await uploadData(await fileToDataURL(f),f.type);persist();nfcStep()}catch(err){alert(err.message)}});$('#nfc-up')?.addEventListener('click',()=>{swapLayer(S.nfc.elements,S.nfcSelected,1);persist();nfcStep()});$('#nfc-down')?.addEventListener('click',()=>{swapLayer(S.nfc.elements,S.nfcSelected,-1);persist();nfcStep()});$('#nfc-center')?.addEventListener('click',()=>{el.x=50;el.y=50;persist();nfcStep()})}
function bindSpotifyEmbeds(root=document){$$('.spotify-embed iframe',root).forEach(f=>{f.addEventListener('load',()=>{try{f.contentWindow.postMessage({type:'framieReady'},'*')}catch{}})})}

function reviewStep(){$('#setup-body').innerHTML=`<div class="review-grid"><div class="review-card"><div class="review-head"><span>KHUNG VẬT LÝ</span><b>${plans.find(p=>p.code===S.design.plan)?.name}</b></div>${framePreview('review')}<div class="review-meta"><span>${frameLabel(S.design.frame)}</span><span>${S.design.size}</span></div></div><div class="review-card"><div class="review-head"><span>TRANG NFC</span><b>Preview</b></div><div class="review-phone"><div class="device-phone"><div class="dynamic-island"></div><div class="device-screen">${nfcPhoneContent()}</div></div></div></div><aside class="review-summary"><span class="eyebrow">TỔNG QUAN</span><h3>${plans.find(p=>p.code===S.design.plan)?.name}</h3><div class="summary-line"><span>Gói</span><b>${money(plans.find(p=>p.code===S.design.plan)?.price)}</b></div><div class="summary-line"><span>Khung</span><b>${frameLabel(S.design.frame)}</b></div><div class="summary-line"><span>Kích thước</span><b>${S.design.size}</b></div><div class="summary-line"><span>NFC</span><b>${S.nfc.elements.length} lớp nội dung</b></div><div class="security-badge">${S.nfc.passwordEnabled?'🔒 NFC có mật khẩu':'🔓 NFC không đặt mật khẩu'}</div><p>Đây là bản preview cuối. Tất cả nội dung custom, vị trí lớp và thiết lập bảo mật sẽ được lưu cùng thiết kế.</p></aside></div>`;bindAudioTriggers();bindSpotifyEmbeds()}
async function hashText(value){const data=new TextEncoder().encode(String(value));const buf=await crypto.subtle.digest('SHA-256',data);return [...new Uint8Array(buf)].map(x=>x.toString(16).padStart(2,'0')).join('')}
async function saveDesign(status='draft',toast=false){if(!S.token){navigate('/login');return null}persist();const nfc=JSON.parse(JSON.stringify(S.nfc));if(nfc.passwordEnabled){nfc.password=String(S.nfc.password||'')}else{delete nfc.password;delete nfc.passwordHash}const body={name:`${plans.find(p=>p.code===S.design.plan)?.name||'Framie'} · ${S.design.size}`,config:S.design,nfc,status};const method=S.loadedDesignId?'PUT':'POST';const endpoint=S.loadedDesignId?`${API}/designs/${S.loadedDesignId}`:API+'/designs';const r=await fetch(endpoint,{method,headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify(body)});const d=await r.json();if(!r.ok){alert(d.message||'Không thể lưu');return null}delete S.nfc.password;S.nfc.passwordEnabled=!!d.nfc?.passwordEnabled||!!S.nfc.passwordEnabled;S.loadedDesignId=d.id;persist();if(toast)alert('Đã lưu bản nháp.');return d}
function calcCart(){const sub=S.cart.reduce((a,x)=>a+(x.price*x.qty),0);const discount=S.coupon?Math.round(sub*(S.coupon.discount||0)):0;const shipping=sub>=300000||sub===0?0:30000;return {sub,discount,shipping,total:Math.max(0,sub-discount+shipping)}}
function addCart(plan,qty=1){const p=plans.find(x=>x.code===plan);if(!p)return;const ex=S.cart.find(x=>x.code===plan);if(ex)ex.qty+=qty;else S.cart.push({code:p.code,name:p.name,price:p.price,qty});persist()}
function cart(){if(!S.cart.length){shell(`<main class="page empty-cart"><span class="eyebrow">GIỎ HÀNG</span><h1>Giỏ hàng đang <em>trống</em></h1><p>Hãy chọn một gói Framie để bắt đầu.</p><a class="btn primary" href="/shop">Khám phá cửa hàng →</a></main>`);return}const c=calcCart();shell(`<main class="page cart-page"><div class="page-head"><span class="eyebrow">GIỎ HÀNG</span><h1>Những điều bạn đã <em>chọn</em></h1></div><div class="cart-layout"><section class="cart-list">${S.cart.map((x,i)=>`<article class="cart-row"><div class="cart-thumb ${x.code}"><span>${x.name.replace('Framie ','')}</span></div><div class="cart-detail"><b>${x.name}</b><small>Khung tranh NFC custom</small><div class="cart-controls"><button data-minus="${i}">−</button><span>${x.qty}</span><button data-plus="${i}">+</button><button class="remove" data-remove="${i}">Xóa</button></div></div><strong>${money(x.price*x.qty)}</strong></article>`).join('')}<a class="text-link" href="/shop">← Tiếp tục mua sắm</a></section><aside class="cart-summary"><span class="eyebrow">TÓM TẮT</span><div class="coupon"><input id="coupon" placeholder="Mã giảm giá"><button id="apply-coupon">Áp dụng</button></div>${S.coupon?`<div class="coupon-note">Đã áp dụng ${esc(S.coupon.code)}</div>`:''}<div class="summary-line"><span>Tạm tính</span><b>${money(c.sub)}</b></div><div class="summary-line"><span>Phí vận chuyển</span><b>${c.shipping?money(c.shipping):'Miễn phí'}</b></div>${c.discount?`<div class="summary-line"><span>Giảm giá</span><b>- ${money(c.discount)}</b></div>`:''}<div class="summary-total"><span>Tổng</span><strong>${money(c.total)}</strong></div><a class="btn primary full" href="/checkout">Tiến hành thanh toán →</a></aside></div></main>`);$$('[data-minus]').forEach(b=>b.onclick=()=>{const i=+b.dataset.minus;S.cart[i].qty=Math.max(1,S.cart[i].qty-1);persist();cart()});$$('[data-plus]').forEach(b=>b.onclick=()=>{S.cart[+b.dataset.plus].qty++;persist();cart()});$$('[data-remove]').forEach(b=>b.onclick=()=>{S.cart.splice(+b.dataset.remove,1);persist();cart()});$('#apply-coupon').onclick=async()=>{const code=$('#coupon').value.trim();if(!code)return;const r=await fetch(API+'/coupon',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code})});const x=await r.json();if(!r.ok)return alert(x.message);S.coupon=x;persist();cart()}}
async function checkout(){refreshAuth();if(!S.user){navigate('/login');return}if(!S.cart.length){if(S.design?.plan){addCart(S.design.plan)}else{navigate('/shop');return}}const c=calcCart();shell(`<main class="page checkout"><div><span class="eyebrow">CHECKOUT</span><h1>Hoàn tất<br><em>Framie của bạn</em></h1><form id="co" class="card-form checkout-form"><div class="form-grid"><input name="name" required value="${esc(S.user.name||'')}" placeholder="Tên"><input name="phone" required value="${esc(S.user.phone||'')}" placeholder="Số điện thoại"></div><textarea name="address" required placeholder="Địa chỉ nhận hàng">${esc(S.user.address||'')}</textarea><div class="payment-list"><b>Phương thức thanh toán</b><label><input type="radio" name="payment" value="cod" checked> COD · Thanh toán khi nhận</label><label><input type="radio" name="payment" value="bank"> Chuyển khoản ngân hàng</label></div><button class="btn primary full">Tạo đơn hàng →</button></form></div><aside class="summary"><span class="eyebrow">ĐƠN HÀNG</span>${S.cart.map(x=>`<div class="summary-product"><span>${x.name} × ${x.qty}</span><b>${money(x.price*x.qty)}</b></div>`).join('')}<div class="summary-line"><span>Tạm tính</span><b>${money(c.sub)}</b></div><div class="summary-line"><span>Phí vận chuyển</span><b>${c.shipping?money(c.shipping):'Miễn phí'}</b></div>${c.discount?`<div class="summary-line"><span>Giảm giá</span><b>- ${money(c.discount)}</b></div>`:''}<div class="summary-total"><span>Tổng</span><strong>${money(c.total)}</strong></div></aside></main>`);$('#co').onsubmit=async e=>{e.preventDefault();const f=Object.fromEntries(new FormData(e.currentTarget));const r=await fetch(API+'/checkout',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({items:S.cart,total:c.total,coupon:S.coupon,planCode:S.design.plan,designId:S.loadedDesignId||null,paymentMethod:f.payment,shipping:f})});const d=await r.json();if(!r.ok)return alert(d.message||'Không thể tạo đơn hàng');S.cart=[];S.coupon=null;persist();shell(`<main class="success-page"><div class="success-card"><div class="success-icon">✓</div><span class="eyebrow">ĐƠN HÀNG ĐÃ TẠO</span><h1>Cảm ơn quý khách đã tin tưởng và sử dụng dịch vụ của <em>framie</em>!</h1><p>Đơn hàng ${d.orderCode} đã được tạo thành công. Cảm ơn quý khách hàng đã tin tưởng và sử dụng dịch vụ của <b>framie</b>!</p><button id="success-ok" class="btn primary">OK · Về Dashboard</button></div></main>`);$('#success-ok').onclick=()=>navigate('/dashboard')}}
function openDashboardPreview(d){const m=document.createElement('div');m.className='modal';const protectedNote=d.nfc?.passwordEnabled?'<div class="security-badge">🔒 Trang NFC có mật khẩu bảo vệ</div>':'';m.innerHTML=`<div class="modal-card dashboard-preview-modal"><button class="close">×</button><div class="modal-head"><div><span class="eyebrow">XEM LẠI NFC</span><h2>${esc(d.name)}</h2>${protectedNote}</div></div><div class="dashboard-preview-phone"><div class="device-phone"><div class="dynamic-island"></div><div class="device-screen">${nfcPhoneContentFrom(d.nfc||defaultNfc())}</div></div></div></div>`;document.body.appendChild(m);$('.close',m).onclick=()=>m.remove();bindAudioTriggers(m);bindSpotifyEmbeds(m)}
async function dashboard(){
  refreshAuth();if(!S.user){navigate('/login');return}
  const h={Authorization:'Bearer '+S.token};
  const [dsRes,osRes,anRes]=await Promise.all([fetch(API+'/designs',{headers:h}),fetch(API+'/orders',{headers:h}),fetch(API+'/analytics',{headers:h})]);
  if(dsRes.status===401||osRes.status===401||anRes.status===401){signout();navigate('/login');return}
  const [dsRaw,osRaw,anRaw]=await Promise.all([dsRes.json(),osRes.json(),anRes.json()]);
  const ds=Array.isArray(dsRaw)?dsRaw:[];
  const os=Array.isArray(osRaw)?osRaw:[];
  const an=(anRaw&&typeof anRaw==='object'&&!anRaw.message)?anRaw:{totalScans:0,byDesign:[]};
  shell(`<main class="page dashboard"><div class="dash-head"><div><span class="eyebrow">DASHBOARD</span><h1>Xin chào, ${esc(S.user.name)}</h1><p>Quản lý thiết kế, NFC và đơn hàng của bạn.</p></div><a href="/setup" class="btn primary">Tạo Framie mới →</a></div><div class="dash-tabs"><button class="active" data-dtab="overview">Tổng quan</button><button data-dtab="orders">Đơn hàng</button><button data-dtab="nfc">NFC</button><button data-dtab="account">Tài khoản</button></div><div id="dash-content"></div></main>`);
  const render=tab=>{const el=$('#dash-content');
    if(tab==='overview')el.innerHTML=`<div class="stats"><div><b>${ds.length}</b><span>Thiết kế</span></div><div><b>${os.length}</b><span>Đơn hàng</span></div><div><b>${an.totalScans||0}</b><span>Lượt quét NFC</span></div></div><section class="dash-section"><div class="section-head-row"><h2>Thiết kế gần đây</h2><a class="text-link" href="/setup">+ Tạo mới</a></div>${ds.length?ds.map(d=>`<div class="dash-row"><div class="dash-thumb ${d.config?.color||'cream'}"></div><div><b>${esc(d.name)}</b><small>${new Date(d.updatedAt||d.createdAt||Date.now()).toLocaleDateString('vi-VN')} · ${esc(d.status||'draft')}</small></div><div class="dash-row-actions"><button class="text-link dash-preview" data-preview-id="${d.id}" type="button">Xem lại NFC →</button><a class="text-link" href="/setup?design=${d.id}">Chỉnh sửa →</a></div></div>`).join(''):'<div class="empty">Chưa có bản thiết kế.</div>'}</section>`;
    if(tab==='orders')el.innerHTML=`<section class="dash-section"><h2>Đơn hàng của tôi</h2>${os.length?os.map(o=>`<div class="dash-row order-row"><div class="order-no">${o.code?.slice(-3)||(o.id?String(o.id).slice(-3):'000')}</div><div><b>${esc(o.code||('Order #'+o.id))}</b><small>${new Date(o.createdAt||Date.now()).toLocaleDateString('vi-VN')} · ${money(o.total)}</small></div><span class="status">${o.orderStatus==='pending'?'Chờ duyệt':o.orderStatus==='shipping'?'Đang giao':'Đã giao'}</span></div>`).join(''):'<div class="empty">Chưa có đơn hàng.</div>'}</section>`;
    if(tab==='nfc')el.innerHTML=`<section class="dash-section"><div class="section-head-row"><div><h2>Quản lý landing page</h2><p class="muted">Mỗi NFC liên kết với một URL và một thiết lập mật khẩu riêng.</p></div><span class="rating">${an.totalScans||0} lượt</span></div>${an.byDesign?.length?an.byDesign.map(x=>{const d=ds.find(z=>z.id===x.id),url=`${location.origin}/m/${x.id}`;return `<article class="nfc-management-card"><div class="nfc-management-head"><div><b>${esc(x.name)}</b><small>NFC #${x.id} · ${x.scans} lượt quét</small></div><span class="security-badge">${d?.nfc?.passwordEnabled?'🔒 Có mật khẩu':'🔓 Không mật khẩu'}</span></div><div class="nfc-url-row"><span>URL</span><code>${esc(url)}</code><button class="text-link copy-nfc-url" data-url="${esc(url)}" type="button">Sao chép</button></div><div class="nfc-credential-row"><span>Mật khẩu</span><strong>${d?.nfc?.passwordEnabled?'••••••••':'Không đặt'}</strong>${d?.nfc?.passwordEnabled?`<button class="text-link view-nfc-password" data-password-id="${x.id}" type="button">Xem</button><button class="text-link dash-password" data-password-id="${x.id}" data-password-enabled="1" type="button">Đổi mật khẩu</button>`:`<button class="text-link dash-password" data-password-id="${x.id}" data-password-enabled="0" type="button">Đặt mật khẩu</button>`}<a class="text-link" href="/m/${x.id}" target="_blank">Mở landing →</a></div></article>`}).join(''):'<div class="empty">Chưa có landing page nào.</div>'}</section>`;
    if(tab==='account')el.innerHTML=`<div class="account-grid"><form id="profile-form" class="card-form"><span class="eyebrow">THÔNG TIN TÀI KHOẢN</span><h3>Cập nhật hồ sơ</h3><input name="name" value="${esc(S.user.name||'')}" placeholder="Họ tên"><input name="phone" value="${esc(S.user.phone||'')}" placeholder="Số điện thoại"><textarea name="address" placeholder="Địa chỉ giao hàng mặc định">${esc(S.user.address||'')}</textarea><button class="btn primary">Lưu thay đổi</button></form><form id="password-form" class="card-form"><span class="eyebrow">BẢO MẬT</span><h3>Đổi mật khẩu</h3><input type="password" name="current" placeholder="Mật khẩu hiện tại"><input type="password" name="next" minlength="6" placeholder="Mật khẩu mới"><button class="btn ghost">Đổi mật khẩu</button></form><div class="card-form"><span class="eyebrow">PHIÊN ĐĂNG NHẬP</span><h3>Google / Email</h3><p class="muted">Bạn đang đăng nhập với ${esc(S.user.email)}.</p><button id="logout" class="btn ghost" type="button">Đăng xuất</button></div></div>`;
    if(tab==='overview'){$$('.dash-preview').forEach(b=>b.onclick=()=>{const d=ds.find(x=>String(x.id)===b.dataset.previewId);if(d)openDashboardPreview(d)})}
    if(tab==='nfc'){
      $$('.copy-nfc-url').forEach(b=>b.onclick=async()=>{try{await navigator.clipboard.writeText(b.dataset.url);b.textContent='Đã sao chép';setTimeout(()=>b.textContent='Sao chép',1200)}catch{prompt('URL landing page',b.dataset.url)}});
      $$('.view-nfc-password').forEach(b=>b.onclick=()=>viewNfcPassword(Number(b.dataset.passwordId)));
      $$('.dash-password').forEach(btn=>btn.onclick=async()=>{const id=Number(btn.dataset.passwordId);const enabled=btn.dataset.passwordEnabled==='1';const password=enabled?prompt('Nhập mật khẩu NFC mới (tối thiểu 4 ký tự). Để trống để tắt:'):prompt('Đặt mật khẩu NFC (tối thiểu 4 ký tự):');if(password===null)return;if(enabled&&!password){const r=await fetch(`${API}/designs/${id}/nfc-password`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({enabled:false})});if(r.ok){alert('Đã tắt mật khẩu NFC.');dashboard()}return}if(String(password||'').length<4){alert('Mật khẩu NFC tối thiểu 4 ký tự.');return}const r=await fetch(`${API}/designs/${id}/nfc-password`,{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify({enabled:true,password})});const x=await r.json();if(!r.ok)return alert(x.message||'Không thể cập nhật mật khẩu.');alert('Đã cập nhật mật khẩu NFC.');dashboard()});
    }
    if(tab==='account'){$('#profile-form')?.addEventListener('submit',async e=>{e.preventDefault();const r=await fetch(API+'/auth/profile',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});const x=await r.json();if(!r.ok)return alert(x.message);S.user=x.user;localStorage.setItem('framie_user',JSON.stringify(S.user));persist();alert('Đã cập nhật thông tin.')});$('#password-form')?.addEventListener('submit',async e=>{e.preventDefault();const r=await fetch(API+'/auth/password',{method:'PUT',headers:{'Content-Type':'application/json',Authorization:'Bearer '+S.token},body:JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))});const x=await r.json();if(!r.ok)return alert(x.message);alert('Đã đổi mật khẩu.');e.currentTarget.reset()});$('#logout')?.addEventListener('click',signout)}
  };
  $$('[data-dtab]').forEach(b=>b.onclick=()=>{$$('[data-dtab]').forEach(x=>x.classList.remove('active'));b.classList.add('active');render(b.dataset.dtab)});render('overview')
}
async function viewNfcPassword(id){const r=await fetch(`${API}/designs/${id}/nfc-password`,{headers:{Authorization:'Bearer '+S.token}});const d=await r.json();if(!r.ok)return alert(d.message||'Không thể đọc mật khẩu.');const m=document.createElement('div');m.className='modal';m.innerHTML=`<div class="modal-card password-modal"><button class="close" type="button">×</button><span class="eyebrow">NFC PASSWORD</span><h2>Mật khẩu landing page</h2><div class="password-reveal"><input id="reveal-password" type="password" value="${esc(d.password||'')}" readonly><button id="toggle-reveal" type="button">Hiện</button></div><p class="muted">Mật khẩu được hiển thị chỉ cho chủ thiết kế đã đăng nhập.</p></div>`;document.body.appendChild(m);$('.close',m).onclick=()=>m.remove();$('#toggle-reveal',m).onclick=()=>{const i=$('#reveal-password');const show=i.type==='password';i.type=show?'text':'password';$('#toggle-reveal').textContent=show?'Ẩn':'Hiện'} }
function adjustNfcLandingCropHeight(){
  const stage=$('.nfc-landing-stage');
  const canvas=$('.nfc-landing-stage .device-canvas');
  if(!stage||!canvas)return;
  const canvasRect=canvas.getBoundingClientRect();
  if(!canvasRect.width||!canvasRect.height)return;
  let maxBottom=0;
  const nfcTop=$('.nfc-top',canvas);
  if(nfcTop){
    const r=nfcTop.getBoundingClientRect();
    if(r.height)maxBottom=Math.max(maxBottom,r.bottom-canvasRect.top);
  }
  const savedAudio=$('.saved-audio',canvas);
  if(savedAudio){
    const r=savedAudio.getBoundingClientRect();
    if(r.height)maxBottom=Math.max(maxBottom,r.bottom-canvasRect.top);
  }
  $$('.nfc-el',canvas).forEach(el=>{
    const r=el.getBoundingClientRect();
    if(r.height){
      const b=r.bottom-canvasRect.top;
      if(b>maxBottom)maxBottom=b;
    }
  });
  if(maxBottom>0){
    const croppedH=Math.ceil(maxBottom+16);
    stage.style.height=croppedH+'px';
    stage.style.minHeight=croppedH+'px';
  }
}

async function renderPublicUnlocked(d){
  fetch(API+'/nfc/'+d.id+'/scan',{method:'POST'}).catch(()=>{});
  document.title=`${d.name} · framie`;
  shell(`<main class="nfc-public-landing-page"><div class="nfc-landing-container"><div class="nfc-landing-stage-wrapper">${nfcLandingContentFrom(d.nfc||defaultNfc())}</div><div class="nfc-landing-cta"><a class="btn primary full" href="/setup">Tạo Framie của riêng bạn →</a></div></div></main>`,{plain:true});
  bindAudioTriggers();
  bindSpotifyEmbeds();
  adjustNfcLandingCropHeight();
  const canvas=$('.nfc-landing-stage .device-canvas');
  if(canvas){
    $$('img, video, iframe',canvas).forEach(m=>{
      m.addEventListener('load',adjustNfcLandingCropHeight);
      m.addEventListener('loadedmetadata',adjustNfcLandingCropHeight);
    });
  }
  setTimeout(adjustNfcLandingCropHeight,100);
  setTimeout(adjustNfcLandingCropHeight,400);
  window.removeEventListener('resize',adjustNfcLandingCropHeight);
  window.addEventListener('resize',adjustNfcLandingCropHeight);
}
async function nfcPublic(id){const r=await fetch(API+'/nfc/'+id);const d=await r.json();if(!r.ok)return shell(`<main class="page narrow"><span class="eyebrow">NFC</span><h1>Trang ký ức không tồn tại</h1><p>${esc(d.message||'Không tìm thấy Framie.')}</p><a class="text-link" href="/">← Về trang chủ Framie</a></main>`,{plain:true});if(d.protected){shell(`<main class="nfc-lock-page"><div class="nfc-lock-card"><div class="lock-icon">🔒</div><span class="eyebrow">FRAMIE PRIVATE MEMORY</span><h1>Đây là một câu chuyện <em>riêng tư</em></h1><p>Nhập mật khẩu do người tạo Framie cung cấp để mở nội dung kỷ niệm.</p><form id="nfc-unlock-form"><input id="nfc-unlock-password" type="password" placeholder="Mật khẩu" autocomplete="current-password" required><button class="btn primary full">Mở nội dung →</button></form><small id="nfc-unlock-error"></small></div></main>`,{plain:true});$('#nfc-unlock-form').onsubmit=async e=>{e.preventDefault();const password=$('#nfc-unlock-password').value;const rr=await fetch(`${API}/nfc/${id}/unlock`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password})});const data=await rr.json();if(!rr.ok){$('#nfc-unlock-error').textContent=data.message||'Mật khẩu không đúng.';return}renderPublicUnlocked(data)};return}return renderPublicUnlocked(d)}
function framePreviewFromConfig(config){const c=config||{};return `<div class="public-frame-card"><span class="eyebrow">FRAMIE · BẢN THIẾT KẾ</span><div class="frame-preview ${c.frame||'portrait'} ${c.color||'cream'} public-frame" style="${c.bg?`background:${esc(c.bg)}`:''}">${(c.elements||[]).slice().sort((a,b)=>(a.z||0)-(b.z||0)).map(e=>renderPhysical(e,false)).join('')}<span class="nfc-badge">NFC</span></div><div class="public-frame-meta"><span>${frameLabel(c.frame)}</span><span>${c.size||''}</span></div></div>`}

function parseRoute(){const raw=location.pathname+location.search;const [p,q='']=raw.split('?');return {p:p||'/',q:new URLSearchParams(q)}}
function navigate(path){history.pushState({},'',path);route()}
async function setup(){refreshAuth();if(!S.user){navigate('/login');return}const {q}=parseRoute();const id=Number(q.get('design'));if(id&&(!S.loadedDesignId||S.loadedDesignId!==id)){try{const r=await fetch(API+'/designs/'+id,{headers:{Authorization:'Bearer '+S.token}});if(r.ok){const d=await r.json();S.design=d.config||defaultDesign();S.nfc=d.nfc||defaultNfc();if(S.nfc?.elements){const _n1=S.nfc.elements.find(e=>e.id==='n1');if(_n1)_n1.y=8.3;const _n2=S.nfc.elements.find(e=>e.id==='n2');if(_n2)_n2.y=9.43;const _cov=S.nfc.elements.find(e=>e.id==='cover1');if(_cov)_cov.y=4.77;const _allCovs=S.nfc.elements.filter(e=>e.type==='cover');_allCovs.forEach(c=>{if(c.y<15)c.y=4.77});const hasCover=S.nfc.elements.some(e=>e.type==='cover');const hasImg=S.nfc.elements.some(e=>e.type==='image');if(!hasCover&&!hasImg)S.nfc.elements.unshift({id:'cover1',type:'cover',x:50,y:4.77,width:84,height:210,rotate:0,z:1})}S.loadedDesignId=id;S.step=4;persist()}}catch{} }let orders=null;const fetchOrders=async()=>{if(!orders){try{const r=await fetch(API+'/orders',{headers:{Authorization:'Bearer '+S.token}});if(r.ok){const res=await r.json();orders=Array.isArray(res)?res:[]}else{if(r.status===401){signout();navigate('/login');return []}orders=[]}}catch{orders=[]}}return orders};if(!id&&S.loadedDesignId){const os=await fetchOrders();if(os.some(o=>o.designId===S.loadedDesignId)){S.productPlan=null;resetDesign();S.loadedDesignId=null}}if(S.loadedDesignId){const os=await fetchOrders();S.designHasOrder=os.some(o=>o.designId===S.loadedDesignId)}else{S.designHasOrder=false} renderSetup()}
function route(){const {p}=parseRoute();if(p==='/')home();else if(p==='/about')about();else if(p==='/blog')blog();else if(p.startsWith('/blog/'))blogPost(p.slice(6));else if(p==='/shop')shop();else if(p==='/templates')templateLibrary();else if(p==='/contact')contact();else if(p==='/policy')policy();else if(p==='/login'||p==='/register'||p==='/forgot')auth();else if(p==='/auth/google/complete')googleAuthComplete();else if(p==='/setup')setup();else if(p==='/dashboard')dashboard();else if(p==='/cart')cart();else if(p==='/checkout')checkout();else if(p.startsWith('/m/'))nfcPublic(p.slice(3));else home()}
/* Canva/Figma-style keyboard delete: Delete/Backspace removes the currently
   selected physical or NFC element, matching the on-screen "Xoá" button.
   Bound once globally rather than per-render (physicalStep()/nfcStep() redraw
   often). Skipped while typing in an input/textarea/contenteditable so it
   doesn't eat a Backspace meant for editing text, and skipped whenever the
   selected id no longer has a matching node on screen (wrong page, or the
   node was already removed) so it never fires against a stale selection. */
window.addEventListener('keydown',e=>{
  if(e.key!=='Delete'&&e.key!=='Backspace')return;
  const t=e.target;
  if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.isContentEditable))return;
  if(S.selected&&$(`.physical[data-el="${S.selected}"]`)){
    e.preventDefault();
    S.design.elements=S.design.elements.filter(x=>x.id!==S.selected);S.selected=null;persist();physicalStep();
  }else if(S.nfcSelected&&$(`.nfc-el[data-nfc="${S.nfcSelected}"]`)){
    e.preventDefault();
    S.nfc.elements=S.nfc.elements.filter(x=>x.id!==S.nfcSelected);S.nfcSelected=null;persist();nfcStep();
  }
});
window.addEventListener('popstate',()=>{window.scrollTo({top:0,left:0,behavior:'instant'});route()});route();