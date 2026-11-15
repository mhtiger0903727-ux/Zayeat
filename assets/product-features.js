/* Instagram-style like/unlike and comments for every published file */
function startProductSocial(){
 if(window.__productSocialStarted)return;
 const sb=window.productSocialSb;if(!sb)return;
 window.__productSocialStarted=true;
 const uuid=()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const n=Math.random()*16|0;return(c==='x'?n:(n&3|8)).toString(16)});
 const getId=k=>{let v=localStorage.getItem(k);if(!v){v=uuid();localStorage.setItem(k,v);}return v;};
 const voter=getId('zayeat_product_voter'),token=getId('zayeat_product_owner_token');
 const fmt=n=>Number(n).toLocaleString('fa-IR');
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let likes=[],comments=[];
 const date=v=>{try{return new Date(v).toLocaleDateString('fa-IR',{year:'numeric',month:'short',day:'numeric'});}catch{return '';}};
 function update(el){
  const id=el.dataset.productSocial,heart=el.querySelector('.social-heart');if(!heart)return;
  const mine=likes.some(x=>x.product_id===id&&x.voter_id===voter);
  heart.classList.toggle('liked',mine);heart.textContent=mine?'♥':'♡';
  heart.setAttribute('aria-pressed',String(mine));heart.setAttribute('aria-label',mine?'برداشتن پسند':'پسندیدن');
  el.querySelector('.social-count').textContent=fmt(likes.filter(x=>x.product_id===id).length)+' پسند';
  const cs=comments.filter(x=>x.product_id===id);
  el.querySelector('.social-comments-count').textContent=fmt(cs.length);
  el.querySelector('.social-comments-list').innerHTML=cs.map(c=>'<div class="ig-comment"><span class="ig-avatar">👤</span><div><strong>کاربر</strong> '+esc(c.body)+'<small>'+date(c.created_at)+'</small></div></div>').join('')||'<p class="muted">هنوز نظری ثبت نشده؛ اولین نفر باشید.</p>';
 }
 async function refresh(){
  try{
   const [a,b]=await Promise.all([sb.from('product_likes').select('product_id,voter_id'),sb.from('product_comments').select('id,product_id,body,created_at').order('created_at',{ascending:false}).limit(1000)]);
   if(a.error)throw a.error;if(b.error)throw b.error;
   likes=a.data||[];comments=b.data||[];
   document.querySelectorAll('[data-product-social][data-social-initialized]').forEach(update);
  }catch(e){console.warn('خطا در دریافت پسندها و نظرات:',e);document.querySelectorAll('.ig-feedback').forEach(x=>x.textContent='دریافت اطلاعات ممکن نشد. دوباره تلاش کنید.');}
 }
 function decorate(){
  document.querySelectorAll('#homeFiles .card[data-file-id],#productList .card[data-file-id]').forEach(card=>{
   if(card.querySelector('[data-social-initialized]'))return;
   const id=card.dataset.fileId,body=card.querySelector('.body');if(!id||!body)return;
   let el=card.querySelector('[data-product-social]');if(!el){el=document.createElement('section');body.appendChild(el);}
   el.className='product-social ig-social';el.dataset.productSocial=id;el.dataset.socialInitialized='true';
   el.innerHTML='<div class="social-actions"><button class="social-heart" type="button" aria-label="پسندیدن" aria-pressed="false">♡</button><button class="social-open" type="button" aria-label="نمایش نظرات">♧</button></div><div class="social-count">۰ پسند</div><button class="ig-view-comments" type="button">مشاهده نظرات (<span class="social-comments-count">۰</span>)</button><div class="social-panel" hidden><div class="ig-panel-title"><strong>نظرات</strong><button class="ig-close" type="button" aria-label="بستن نظرات">×</button></div><div class="social-comments-list"></div><form class="social-comment-form"><input maxlength="500" required placeholder="نظر خود را بنویسید..." aria-label="متن نظر"><button type="submit">ارسال</button></form><p class="ig-feedback" aria-live="polite"></p></div>';
   const panel=el.querySelector('.social-panel');
   const toggle=()=>{panel.hidden=!panel.hidden;if(!panel.hidden)el.querySelector('input').focus();};
   el.querySelector('.social-open').onclick=toggle;el.querySelector('.ig-view-comments').onclick=toggle;el.querySelector('.ig-close').onclick=()=>panel.hidden=true;
   const heart=el.querySelector('.social-heart');
   heart.onclick=async()=>{
    if(heart.disabled)return;heart.disabled=true;
    const previous=likes.slice(),had=likes.some(x=>x.product_id===id&&x.voter_id===voter);
    likes=had?likes.filter(x=>!(x.product_id===id&&x.voter_id===voter)):[...likes,{product_id:id,voter_id:voter}];update(el);
    try{const {error}=await sb.rpc('toggle_product_like',{p_product_id:id,p_voter_id:voter,p_token:token});if(error)throw error;await refresh();}
    catch(e){likes=previous;update(el);alert('ثبت پسند انجام نشد: '+e.message);}
    finally{heart.disabled=false;}
   };
   const form=el.querySelector('form');form.onsubmit=async event=>{
    event.preventDefault();const input=form.querySelector('input'),button=form.querySelector('button'),value=input.value.trim();if(!value)return;
    button.disabled=true;const feedback=el.querySelector('.ig-feedback');feedback.textContent='در حال ارسال...';
    try{const {error}=await sb.from('product_comments').insert({product_id:id,voter_id:voter,body:value});if(error)throw error;input.value='';feedback.textContent='نظر ثبت شد.';await refresh();}
    catch(e){feedback.textContent='ثبت نظر ناموفق بود: '+e.message;}
    finally{button.disabled=false;}
   };
   update(el);
  });
 }
 const observer=new MutationObserver(()=>decorate());
 ['homeFiles','productList'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true});});
 window.refreshProductSocialCards=decorate;decorate();refresh();setInterval(refresh,30000);
}
if(window.productSocialSb)startProductSocial();else window.addEventListener('product-social-ready',startProductSocial,{once:true});
