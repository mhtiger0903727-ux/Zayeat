/* Product reactions and estimated scrap request pricing - 2026-11 */
(()=>{
 const voter=localStorage.getItem('zayeat_product_voter')||crypto.randomUUID();
 localStorage.setItem('zayeat_product_voter',voter);
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
  document.querySelectorAll('#homeFiles .card,#productList .card').forEach((card,i)=>{
   if(card.querySelector('[data-product-social]'))return;
   const host=card.closest('#homeFiles,#productList');const list=(cachedFiles||[]).filter(f=>f.placement===(host.id==='homeFiles'?'home':'products')&&f.is_published!==false);const f=list[i];if(!f)return;
   const el=document.createElement('div');el.className='product-social';el.dataset.productSocial=f.id;
   el.innerHTML='<div class="social-actions"><button type="button" class="social-heart" aria-label="لایک محصول">♡</button><span class="social-count">۰</span><button type="button" class="social-open">💬 نظرات (<span class="social-comments-count">۰</span>)</button></div><div class="social-panel" hidden><div class="social-comments-list"></div><form class="social-comment-form"><input maxlength="500" required placeholder="نظر خود را بنویسید"><button type="submit" class="btn-green">ارسال</button></form></div>';
   card.querySelector('.body')?.append(el);updateSocial(el);
   el.querySelector('.social-open').onclick=()=>{const p=el.querySelector('.social-panel');p.hidden=!p.hidden;};
   el.querySelector('.social-heart').onclick=async()=>{const btn=el.querySelector('.social-heart');btn.disabled=true;try{const mine=likes.some(x=>x.product_id===f.id&&x.voter_id===voter);const q=mine?sb.from('product_likes').delete().eq('product_id',f.id).eq('voter_id',voter):sb.from('product_likes').insert({product_id:f.id,voter_id:voter});const {error}=await q;if(error)throw error;await refreshSocial();}catch(e){alert('ثبت لایک ناموفق بود: '+e.message)}finally{btn.disabled=false;}};
   el.querySelector('form').onsubmit=async ev=>{ev.preventDefault();const input=el.querySelector('input'),body=input.value.trim();if(!body)return;const {error}=await sb.from('product_comments').insert({product_id:f.id,voter_id:voter,body});if(error){alert('ثبت نظر ناموفق بود: '+error.message);return;}input.value='';await refreshSocial();};
  });
 }
 const observer=new MutationObserver(()=>{if(document.querySelectorAll('#homeFiles .card:not(:has([data-product-social])),#productList .card:not(:has([data-product-social]))').length)decorate();});
 ['homeFiles','productList'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true});});
 decorate();refreshSocial();setInterval(refreshSocial,30000);
 const requestItems=document.getElementById('requestItems');if(!requestItems)return;
 const total=document.createElement('div');total.id='requestEstimatedTotal';total.className='request-estimated-total';requestItems.after(total);
 const oldAdd=window.addRequestItemRow;
 const list=()=>cachedFiles.filter(f=>f.placement==='products'&&f.is_published!==false&&priceOf(f)>0);
 function updateTotal(){let sum=0,unknown=0;requestItems.querySelectorAll('.request-item-row').forEach(row=>{const select=row.querySelector('.request-product-select'),weight=Number(row.querySelector('.request-item-quantity').value),p=Number(select?.selectedOptions[0]?.dataset.price||0);if(p&&weight>0)sum+=p*weight;else if(select?.value)unknown++;const sub=row.querySelector('.request-subtotal');if(sub)sub.textContent=p&&weight>0?'جمع این قلم: '+fmt(p*weight)+' تومان':'قیمت پس از تعیین وزن';});total.textContent='جمع کل تخمینی: '+fmt(sum)+' تومان'+(unknown?' | '+fmt(unknown)+' قلم بدون وزن مشخص':'')+' — مبلغ قطعی پس از وزن‌کشی';}
 function enhance(row){if(row.dataset.enhanced)return;row.dataset.enhanced='1';const name=row.querySelector('.request-item-name'),weight=row.querySelector('.request-item-quantity');if(!name||!weight)return;const select=document.createElement('select');select.className='request-product-select';select.innerHTML='<option value="">انتخاب محصول و قیمت روز</option>'+list().map(f=>'<option value="'+escapeHTML(f.id)+'" data-price="'+priceOf(f)+'" data-name="'+escapeHTML(f.caption||f.original_name)+'">'+escapeHTML(f.caption||f.original_name)+' — '+fmt(priceOf(f))+' تومان/کیلو</option>').join('');name.before(select);name.placeholder='نام محصول (در صورت نبودن در فهرست)';name.required=false;weight.required=false;weight.placeholder='وزن حدودی (کیلوگرم، اختیاری)';const count=document.createElement('input');count.className='request-item-count';count.type='number';count.min='1';count.step='1';count.placeholder='تعداد محصول';count.required=true;count.value='1';weight.before(count);const sub=document.createElement('small');sub.className='request-subtotal';weight.after(sub);select.onchange=()=>{if(select.value)name.value=select.selectedOptions[0].dataset.name;updateTotal()};[name,weight,count].forEach(x=>x.addEventListener('input',updateTotal));row.querySelector('.request-remove')?.addEventListener('click',()=>setTimeout(updateTotal,0));updateTotal();}
 const itemObserver=new MutationObserver(()=>{requestItems.querySelectorAll('.request-item-row:not([data-enhanced])').forEach(enhance);updateTotal();});itemObserver.observe(requestItems,{childList:true});requestItems.querySelectorAll('.request-item-row').forEach(enhance);
 document.getElementById('addRequestItem')?.addEventListener('click',()=>setTimeout(()=>requestItems.querySelectorAll('.request-item-row').forEach(enhance),0));
 document.getElementById('customerRequestForm')?.addEventListener('submit',()=>{requestItems.querySelectorAll('.request-item-row').forEach(row=>{const name=row.querySelector('.request-item-name'),count=row.querySelector('.request-item-count'),weight=row.querySelector('.request-item-quantity');if(!name.value.trim())name.value=row.querySelector('.request-product-select')?.selectedOptions[0]?.dataset.name||'';if(count&&name.value.trim())name.value=name.value.replace(/ \(تعداد: \d+\)$/,'')+' (تعداد: '+count.value+')';if(!weight.value)weight.value='0.001';});},true);
})();
