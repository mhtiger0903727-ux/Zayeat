/* Product reactions and estimated scrap request pricing - 2026-11 */
(()=>{
 const voter=localStorage.getItem('zayeat_product_voter')||crypto.randomUUID();
 localStorage.setItem('zayeat_product_voter',voter);
 const tokenKey='zayeat_product_owner_token';const token=localStorage.getItem(tokenKey)||crypto.randomUUID();localStorage.setItem(tokenKey,token);
 const fmt=n=>Math.round(n).toLocaleString('fa-IR');
 const parsePrice=v=>{let s=String(v||'').replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).replace(/[٠-٩]/g,c=>'٠١٢٣٤٥٦٧٨٩'.indexOf(c));let m=s.replace(/[,٬،\s]/g,'').match(/\d+(?:\.\d+)?/);return m?Number(m[0]):0};
 const escapeHTML=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const priceOf=f=>parsePrice(f.price);
 let likes=[],comments=[];
 async function refreshSocial(){
  try{const [a,b]=await Promise.all([sb.from('product_likes').select('product_id,voter_id'),sb.from('product_comments').select('id,product_id,body,created_at').order('created_at',{ascending:false}).limit(1000)]);if(a.error)throw a.error;if(b.error)throw b.error;likes=a.data||[];comments=b.data||[];document.querySelectorAll('[data-product-social]').forEach(updateSocial);}catch(e){console.warn('Product interactions:',e.message);}
 }
 function updateSocial(el){const id=el.dataset.productSocial;const mine=likes.some(x=>x.product_id===id&&x.voter_id===voter);el.querySelector('.social-heart').textContent=mine?'♥':'♡';el.querySelector('.social-heart').classList.toggle('liked',mine);el.querySelector('.social-count').textContent=fmt(likes.filter(x=>x.product_id===id).length);const cs=comments.filter(x=>x.product_id===id);el.querySelector('.social-comments-count').textContent=fmt(cs.length);el.querySelector('.social-comments-list').innerHTML=cs.map(c=>'<p>'+escapeHTML(c.body)+' <small>'+new Date(c.created_at).toLocaleDateString('fa-IR')+'</small></p>').join('')||'<p class="muted">هنوز نظری ثبت نشده است.</p>';}
 function decorate(){
  document.querySelectorAll('#homeFiles .card,#productList .card').forEach(card=>{
   if(card.querySelector('[data-product-social]'))return;
   const host=card.closest('#homeFiles,#productList');const list=(cachedFiles||[]).filter(f=>f.placement===(host.id==='homeFiles'?'home':'products')&&f.is_published!==false);const f=list.find(item=>item.id===card.dataset.fileId);if(!f)return;
   const el=document.createElement('div');el.className='product-social';el.dataset.productSocial=f.id;
   el.innerHTML='<div class="social-actions"><button type="button" class="social-heart" aria-label="لایک محصول">♡</button><span class="social-count">۰</span><button type="button" class="social-open">💬 نظرات (<span class="social-comments-count">۰</span>)</button></div><div class="social-panel" hidden><div class="social-comments-list"></div><form class="social-comment-form"><input maxlength="500" required placeholder="نظر خود را بنویسید"><button type="submit" class="btn-green">ارسال</button></form></div>';
   card.querySelector('.body')?.append(el);updateSocial(el);
   el.querySelector('.social-open').onclick=()=>{const p=el.querySelector('.social-panel');p.hidden=!p.hidden;};
   el.querySelector('.social-heart').onclick=async()=>{const btn=el.querySelector('.social-heart');btn.disabled=true;try{const {error}=await sb.rpc('toggle_product_like',{p_product_id:f.id,p_voter_id:voter,p_token:token});if(error)throw error;await refreshSocial();}catch(e){alert('ثبت لایک ناموفق بود: '+e.message)}finally{btn.disabled=false;}};
   el.querySelector('form').onsubmit=async ev=>{ev.preventDefault();const input=el.querySelector('input'),body=input.value.trim();if(!body)return;const {error}=await sb.from('product_comments').insert({product_id:f.id,voter_id:voter,body});if(error){alert('ثبت نظر ناموفق بود: '+error.message);return;}input.value='';await refreshSocial();};
  });
 }
 const observer=new MutationObserver(()=>{if([...document.querySelectorAll('#homeFiles .card,#productList .card')].some(card=>!card.querySelector('[data-product-social]')))decorate();});
 ['homeFiles','productList'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true});});
 window.refreshProductSocialCards=decorate;
 decorate();refreshSocial();setInterval(refreshSocial,30000);

})();
