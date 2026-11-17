/* DayFlow V3 enhancements. Keeps the V2 df-events storage contract. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), read=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))??d}catch{return d}}, write=(k,v)=>localStorage.setItem(k,JSON.stringify(v));
let profile=read('df-profile',null), prefs=read('df-prefs',{accent:'#aa8cff',mode:'category',hidden:[],freeze:3,freezeDate:'',focusDay:'',focusTotal:0,dashboardOrder:['v3Greeting','v3DashSection','v3CategorySection','v3OverdueSection','v3WeekSection','v3FocusSection','v3StatsSection','v3DayaSection']}), focus={left:1500,running:false,break:false,handle:null}, dayaHistory=read('df-daya-history',[]), pendingAction=null;
const cats={class:['کلاس','#7c9cff','📚'],homework:['تکلیف و مطالعه','#c18bff','✍️'],personal:['شخصی','#65d6b0','🌿'],exam:['امتحان و رویداد','#ffad75','🎯']};
const css=`
.v3welcome{position:fixed;inset:0;background:#090810ed;z-index:80;display:grid;place-items:center;padding:18px}.v3welcome .sheet{width:min(100%,480px)}.v3grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.v3tile{border:1px solid var(--line);border-radius:18px;padding:14px;background:linear-gradient(145deg,#2b2738,#211f2b);min-width:0}.v3tile .emoji{font-size:24px}.v3tile strong{display:block;margin:5px 0}.v3tile small{color:var(--muted)}.v3bar{height:9px;border-radius:20px;background:#403b4d;overflow:hidden;margin-top:9px}.v3bar i{display:block;height:100%;border-radius:20px;background:var(--accent);width:0}.v3row{display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap}.v3chips{display:flex;gap:7px;overflow:auto;padding:4px 0 9px}.v3chip{min-width:112px;text-align:right;border:1px solid var(--line);border-radius:17px;padding:12px;background:#262331}.v3chip b{display:block;font-size:14px}.v3chip small{color:var(--muted)}.v3modal{position:fixed;inset:0;background:#08070dcc;z-index:60;display:flex;align-items:flex-end;justify-content:center;padding:12px}.v3modal .sheet{width:min(100%,560px);max-height:88vh;overflow:auto}.v3week{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px}.v3week button{background:#292634;border:1px solid var(--line);border-radius:12px;padding:9px 2px;font-size:12px}.v3week button.active{background:var(--accent);color:#171222}.v3field{margin:10px 0}.v3field label{margin:0 0 5px}.v3field input,.v3field select{margin-top:5px}.v3muted{color:var(--muted);font-size:12px;line-height:1.6}.v3task{border-inline-start:4px solid var(--accent)}.v3badge{font-size:11px;padding:3px 7px;border-radius:8px;background:#3a3547}.v3danger{color:#ff9ba7}.v3success{color:#83dfb8}.v3chat{background:#25222f;border:1px solid var(--line);padding:10px 12px;border-radius:15px;margin:8px 0;white-space:pre-wrap}.v3chat.user{border-inline-start:3px solid var(--accent)}.v3chat.bot{border-inline-start:3px solid var(--green)}.v3timer{font-size:44px;font-weight:800;text-align:center;color:var(--accent2);padding:10px}.v3hidden{display:none!important}.v3avatar{width:42px;height:42px;border-radius:50%;object-fit:cover;background:#393346;display:grid;place-items:center;font-size:23px}.v3day{border:1px solid var(--line);padding:9px 3px;border-radius:13px;text-align:center;background:#282532}.v3day.active{border-color:var(--accent);background:#403451}.v3list{display:flex;flex-direction:column;gap:7px}.v3list>div{background:#292634;border-radius:12px;padding:10px}.v3modal input[type=checkbox]{width:auto}.v3modal .checks label{font-size:13px}.v3foot{font-size:11px;color:var(--muted);text-align:center;margin:20px 0 5px}
`;
document.head.insertAdjacentHTML('beforeend',`<style>${css}</style>`);
const add=(where,html,position='beforeend')=>(where==='body'?document.body:$(where))?.insertAdjacentHTML(position,html);
add('homeView',`<section id="v3Greeting" class="panel" style="margin-top:14px"><div class="v3row"><div><div class="muted">خوش اومدی به DayFlow</div><strong id="v3Hello" style="font-size:19px">سلام!</strong><div id="v3DayaLine" class="muted">بیا روزت رو مرتب کنیم.</div></div><div id="v3Avatar" class="v3avatar">🌟</div></div></section>
<section id="v3DashSection" style="margin-top:14px"><div class="sectionhead"><h2 style="margin:8px 0">نمای امروز</h2><button class="secondary smallbtn" id="v3Mode">نمای زمانی</button></div><div class="v3grid" id="v3Dash"><div class="v3tile"><span class="emoji">✅</span><small>پیشرفت امروز</small><strong id="v3Progress">۰٪</strong><div class="v3bar"><i id="v3ProgressBar"></i></div></div><div class="v3tile"><span class="emoji">⏭️</span><small>کلاس بعدی</small><strong id="v3NextClass">—</strong><small id="v3NextTime">—</small></div><div class="v3tile"><span class="emoji">📖</span><small>تکالیف باقی‌مانده</small><strong id="v3Homework">۰</strong></div><div class="v3tile"><span class="emoji">🗓️</span><small>برنامه فردا</small><strong id="v3Tomorrow">۰ مورد</strong><small id="v3TomorrowSub">—</small></div><div class="v3tile"><span class="emoji">🧊</span><small>فریز استریک</small><strong id="v3Freeze">۳</strong></div></div></section>
<section id="v3CategorySection" style="margin-top:14px"><div class="sectionhead"><h2 style="margin:8px 0">دسته‌بندی‌ها</h2></div><div class="v3chips" id="v3Categories"></div><div id="v3CategoryResults"></div></section>
<section id="v3OverdueSection" class="panel" style="margin-top:14px"><div class="v3row"><h2 style="margin:0">کارهای عقب‌افتاده</h2><span class="v3badge" id="v3OverdueCount">۰</span></div><div id="v3Overdue" class="v3list" style="margin-top:8px"></div></section>
<section id="v3WeekSection" class="panel" style="margin-top:14px"><div class="v3row"><h2 style="margin:0">برنامه هفتگی</h2><span class="muted">شنبه تا جمعه</span></div><div id="v3Week" class="v3week" style="margin-top:10px"></div><div id="v3WeekItems" style="margin-top:9px"></div></section>
<section id="v3FocusSection" class="panel" style="margin-top:14px"><div class="v3row"><h2 style="margin:0">تمرکز</h2><span class="muted">۲۵ دقیقه تمرکز / ۵ دقیقه استراحت</span></div><div class="v3timer" id="v3Timer">۲۵:۰۰</div><div class="v3row"><button class="primary" id="v3FocusStart">شروع تمرکز</button><button class="secondary" id="v3FocusReset">بازنشانی</button><button class="secondary" id="v3FocusCustom">زمان دلخواه</button></div><div class="muted" id="v3FocusStats" style="margin-top:8px">امروز: ۰ دقیقه</div></section>
<section id="v3StatsSection" class="panel" style="margin-top:14px"><div class="v3row"><h2 style="margin:0">آمار و دستاوردها</h2><button class="secondary smallbtn" id="v3StatsBtn">جزئیات</button></div><div id="v3Achievements" class="v3chips" style="margin-top:8px"></div></section>
<section id="v3DayaSection" class="panel" style="margin-top:14px"><div class="v3row"><div><h2 style="margin:0">Daya</h2><div class="muted">دستیار داخلی DayFlow</div></div><button class="primary smallbtn" id="v3DayaOpen">گفت‌وگو</button></div><div class="muted" style="margin-top:8px">Daya فعلاً دستیار داخلی و محدود است؛ پاسخ‌های هوشمند مبتنی بر مدل آنلاین در این نسخه فعال نیست.</div></section>
<div class="v3foot">ساخته‌شده توسط سپهر جمسا · Designed &amp; Developed by Sepehr Jamsa</div>`);
add('settingsView',`<section class="panel" style="margin-top:14px"><h2 style="margin-top:0">پروفایل و شخصی‌سازی</h2><div class="v3row"><span>نام نمایشی</span><strong id="v3ProfileName">—</strong><button class="secondary smallbtn" id="v3EditProfile">ویرایش پروفایل</button></div><div class="settingrow"><span>رنگ اصلی برنامه</span><input type="color" id="v3Accent" value="#aa8cff"></div><div class="v3field"><label>رنگ دسته‌بندی‌ها</label><div class="v3grid">${Object.entries(cats).map(([k,v])=>`<label>${v[0]}<input type="color" id="v3Color-${k}" value="${v[1]}"></label>`).join('')}</div></div><div class="settingrow"><span>نمایش داشبورد</span><button class="secondary smallbtn" id="v3DashPrefs">مدیریت کارت‌ها</button></div><div class="settingrow"><span>ترتیب بخش‌های خانه</span><button class="secondary smallbtn" id="v3DashOrder">تغییر ترتیب</button></div><div class="settingrow"><span>فریز استریک باقی‌مانده</span><strong id="v3FreezeSetting">۳</strong></div><div class="settingrow"><span>آواتار تصویری</span><button class="secondary smallbtn" id="v3AvatarPick">انتخاب تصویر</button></div><div class="settingrow"><span>مدیریت کلاس‌های تکرارشونده</span><button class="secondary smallbtn" id="v3SeriesManage">مدیریت سری‌ها</button></div><p class="v3muted">فریز فقط برای حفظ استریک در روز بدون فعالیت است و فعالیت جعلی ثبت نمی‌کند. حداکثر موجودی ۳ عدد است؛ با هر ۷ روز فعال ثبت‌شده، یک فریز جایزه می‌گیری (تا سقف ۳).</p></section>
<section class="panel" style="margin-top:14px"><h2 style="margin-top:0">تقویم سامسونگ</h2><p class="v3muted">برنامه‌های کلاس را به‌صورت فایل تقویم خروجی بگیر. رویدادها همراه هشدار ۳۰ یا ۶۰ دقیقه قبل صادر می‌شوند. همگام‌سازی دوطرفه وجود ندارد.</p><div class="v3field"><label>هشدار کلاس‌ها</label><div class="checks"><label><input type="checkbox" id="v3Alarm30" checked> ۳۰ دقیقه قبل</label><label><input type="checkbox" id="v3Alarm60"> ۱ ساعت قبل</label></div></div><button class="primary" id="v3ExportIcs" style="width:100%">خروجی کلاس‌ها برای Samsung Calendar</button><p class="v3muted">پس از دانلود فایل .ics، آن را با Samsung Calendar باز یا وارد کن. پشتیبانی از هشدار هنگام واردکردن به تنظیمات و نسخه تقویم سامسونگ بستگی دارد.</p></section>
<section class="panel" style="margin-top:14px"><h2 style="margin-top:0">پشتیبان‌گیری</h2><div class="v3row"><button class="secondary" id="v3Backup">دریافت نسخه پشتیبان</button><button class="secondary" id="v3Restore">بازیابی نسخه پشتیبان</button><input type="file" id="v3RestoreFile" accept="application/json" class="v3hidden"></div></section>`);
// Add recurring / priority fields to existing form.
add('formView',`<div class="panel" style="margin-top:12px"><h3 style="margin:0 0 8px">تنظیمات تکمیلی</h3><div class="v3field"><label>اولویت</label><select id="v3Priority"><option value="normal">معمولی</option><option value="high">ضروری</option><option value="low">کم‌اهمیت</option></select></div><div class="v3field"><label><input type="checkbox" id="v3Recurring" style="width:auto"> تکرار هفتگی</label></div><div id="v3RepeatOptions" class="v3hidden"><div class="v3muted">روزهای هفته (شنبه تا جمعه)</div><div class="checks" id="v3Weekdays">${['شنبه','یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه'].map((x,i)=>`<label><input type="checkbox" value="${i}" class="v3weekday">${x}</label>`).join('')}</div><div class="v3field"><label>تکرار تا</label><select id="v3RepeatEnd"><option value="26">۶ ماه آینده</option><option value="52">۱ سال آینده</option><option value="0">بدون تاریخ پایان (تا ۲ سال آینده)</option></select></div></div><div class="v3field"><label>یادداشت (اختیاری)</label><input id="v3Note" maxlength="180" placeholder="توضیحات کوتاه"></div></div>`,'beforeend');
// Category and week day details modal containers.
add('body',`<div id="v3Modal" class="v3modal v3hidden"><div class="sheet"><div class="sheethead"><strong id="v3ModalTitle">جزئیات</strong><button class="close" id="v3ModalClose">×</button></div><div id="v3ModalBody"></div></div></div><div id="v3Welcome" class="v3welcome v3hidden"><div class="sheet"><h2 style="margin-top:0">به DayFlow خوش اومدی ✨</h2><p class="muted">پروفایلت فقط روی همین مرورگر و دستگاه ذخیره می‌شود.</p><div class="v3field"><label>اسم نمایشی</label><input id="v3WelcomeName" maxlength="40" placeholder="مثلاً سپهر"></div><div class="v3field"><label>پایه یا کلاس (اختیاری)</label><input id="v3WelcomeGrade" maxlength="30" placeholder="مثلاً پایه نهم"></div><div class="v3field"><label>ایموجی آواتار</label><input id="v3WelcomeAvatar" maxlength="4" value="🌟"></div><div class="v3field"><label>رنگ دلخواه</label><input id="v3WelcomeColor" type="color" value="#aa8cff"></div><button class="primary" id="v3WelcomeSave" style="width:100%">شروع کنیم</button></div></div><input type="file" id="v3AvatarFile" accept="image/*" class="v3hidden">`);
function modal(title,html){$('v3ModalTitle').textContent=title;$('v3ModalBody').innerHTML=html;$('v3Modal').classList.remove('v3hidden')};$('v3ModalClose').onclick=()=>$('v3Modal').classList.add('v3hidden');
function jdate(s){return typeof parseJ==='function'?parseJ(s):null}function dayKey(d){return key(d)}function todayKey(){return dayKey(new Date())}function daysBetween(a,b){return Math.floor((b-a)/86400000)}function weekStart(d){let x=new Date(d);x.setHours(12,0,0,0);x.setDate(x.getDate()-((x.getDay()+1)%7));return x}const weekNames=['ش','ی','د','س','چ','پ','ج'];
function persist(){save();renderAll()}
function setAccent(c){prefs.accent=c;write('df-prefs',prefs);document.documentElement.style.setProperty('--accent',c);document.documentElement.style.setProperty('--accent2',c)}
function applyCategoryColors(){Object.keys(cats).forEach(k=>{if(prefs.categoryColors?.[k])cats[k][1]=prefs.categoryColors[k];let el=$('v3Color-'+k);if(el)el.value=cats[k][1]})}
function profileUI(){if(profile){$('v3Hello').textContent=`سلام ${profile.name}! خوش اومدی 👋`;$('v3ProfileName').textContent=profile.name;if(profile.avatarImage)$('v3Avatar').innerHTML=`<img src="${profile.avatarImage}" alt="آواتار" style="width:100%;height:100%;border-radius:50%;object-fit:cover">`;else $('v3Avatar').textContent=profile.avatar||'🌟';$('v3DayaLine').textContent=profile.grade?`${profile.grade} · برنامه امروزت رو با هم مرتب کنیم.`:'بیا روزت رو مرتب کنیم.'}else $('v3Welcome').classList.remove('v3hidden');}
$('v3WelcomeSave').onclick=()=>{let n=$('v3WelcomeName').value.trim();if(!n){alert('یک اسم نمایشی وارد کن.');return}profile={name:n,grade:$('v3WelcomeGrade').value.trim(),avatar:$('v3WelcomeAvatar').value.trim()||'🌟'};write('df-profile',profile);setAccent($('v3WelcomeColor').value);$('v3Welcome').classList.add('v3hidden');profileUI();};
$('v3EditProfile').onclick=()=>{modal('ویرایش پروفایل',`<div class="v3field"><label>نام</label><input id="v3PN" value="${escapeHtml(profile?.name||'')}"></div><div class="v3field"><label>پایه / کلاس</label><input id="v3PG" value="${escapeHtml(profile?.grade||'')}"></div><div class="v3field"><label>ایموجی آواتار</label><input id="v3PA" value="${escapeHtml(profile?.avatar||'🌟')}"></div><button class="primary" id="v3PSave">ذخیره</button>`);$('v3PSave').onclick=()=>{profile={name:$('v3PN').value.trim()||'کاربر',grade:$('v3PG').value.trim(),avatar:$('v3PA').value.trim()||'🌟',avatarImage:profile?.avatarImage};write('df-profile',profile);profileUI();$('v3Modal').classList.add('v3hidden')}};
function escapeHtml(s){return String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function occurrenceList(){return events.slice().sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''))}
function renderCategories(){let t=todayKey(),lim=new Date();lim.setDate(lim.getDate()+7);let horizon=key(lim);let html=Object.entries(cats).map(([k,v])=>{let n=events.filter(e=>e.type===k&&!e.done&&e.date>=t&&e.date<=horizon).length;return `<button class="v3chip" data-cat="${k}" style="border-color:${v[1]}55"><span class="emoji">${v[2]}</span><b>${v[0]}</b><small>${n} مورد باقی‌مانده</small></button>`}).join('');$('v3Categories').innerHTML=html;document.querySelectorAll('[data-cat]').forEach(b=>b.onclick=()=>{let k=b.dataset.cat,v=cats[k],list=occurrenceList().filter(e=>e.type===k);modal(v[0],`<button class="primary" id="v3CatAdd">＋ افزودن ${v[0]}</button><div class="v3list" style="margin-top:10px">${list.length?list.map(e=>`<div><div class="v3row"><strong>${escapeHtml(e.name)}</strong><span class="v3badge">${e.date} · ${e.time||'—'}</span></div><div class="v3muted">${e.done?'انجام‌شده':'باقی‌مانده'} · اولویت: ${{high:'ضروری',normal:'معمولی',low:'کم‌اهمیت'}[e.priority||'normal']}</div><div class="v3row" style="margin-top:7px"><button class="secondary smallbtn" data-v3edit="${e.id}">ویرایش</button><button class="secondary smallbtn" data-v3done="${e.id}">${e.done?'بازگردانی':'انجام شد'}</button></div></div>`).join(''):'<div class="empty">هنوز موردی در این دسته ثبت نشده.</div>'}</div>`);$('v3CatAdd').onclick=()=>{ $('v3Modal').classList.add('v3hidden');openForm();$('eventType').value=k};bindModalActions()})}
function bindModalActions(){document.querySelectorAll('[data-v3edit]').forEach(b=>b.onclick=()=>{let e=events.find(x=>x.id===b.dataset.v3edit);$('v3Modal').classList.add('v3hidden');openForm(e)});document.querySelectorAll('[data-v3done]').forEach(b=>b.onclick=()=>{let e=events.find(x=>x.id===b.dataset.v3done);if(e){e.done=!e.done;persist();$('v3Modal').classList.add('v3hidden')}})}
function renderWeek(){let start=weekStart(new Date()),days=Array.from({length:7},(_,i)=>{let d=new Date(start);d.setDate(d.getDate()+i);return d});$('v3Week').innerHTML=days.map((d,i)=>`<button class="v3day ${dayKey(d)===dayKey(new Date())?'active':''}" data-wday="${dayKey(d)}"><b>${weekNames[i]}</b><br>${faParts(d).d}</button>`).join('');document.querySelectorAll('[data-wday]').forEach(b=>b.onclick=()=>{document.querySelectorAll('[data-wday]').forEach(x=>x.classList.toggle('active',x===b));let l=events.filter(e=>e.date===b.dataset.wday).sort((a,c)=>(a.time||'').localeCompare(c.time||''));$('v3WeekItems').innerHTML=l.length?l.map(e=>`<div class="task ${e.done?'done':''}"><div class="taskinfo"><strong>${escapeHtml(e.name)}</strong><div class="taskmeta">${e.time||'—'} · ${cats[e.type]?.[0]||'برنامه'}</div></div><span class="v3badge">${e.done?'✓':'•'}</span></div>`).join(''):'<div class="empty">برای این روز برنامه‌ای نداری.</div>'});$('v3Week').querySelector('[data-wday="'+todayKey()+'"]')?.click()}
function renderDashboard(){let t=todayKey(),limit=new Date();limit.setDate(limit.getDate()+7);let horizon=key(limit),today=events.filter(e=>e.date===t),done=today.filter(e=>e.done).length,pct=today.length?Math.round(done/today.length*100):0;$('v3Progress').textContent=num(pct)+'٪';$('v3ProgressBar').style.width=pct+'%';$('v3Homework').textContent=num(events.filter(e=>e.type==='homework'&&!e.done&&e.date>=t&&e.date<=horizon).length);let tomorrow=new Date();tomorrow.setDate(tomorrow.getDate()+1);let tomorrowItems=events.filter(e=>e.date===key(tomorrow));$('v3Tomorrow').textContent=num(tomorrowItems.length)+' مورد';$('v3TomorrowSub').textContent=tomorrowItems.slice(0,2).map(e=>e.name).join('، ')||'برنامه‌ای ثبت نشده';let next=events.filter(e=>e.type==='class'&&!e.done&&e.date>=t&&e.date<=horizon).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''))[0];$('v3NextClass').textContent=next?.name||'—';$('v3NextTime').textContent=next?`${next.date} · ${next.time||'—'}`:'کلاس پیش‌رو ثبت نشده';$('v3Freeze').textContent=num(prefs.freeze);$('v3FreezeSetting').textContent=num(prefs.freeze);$('v3OverdueCount').textContent=num(events.filter(e=>!e.done&&e.date<t).length);let overdue=events.filter(e=>!e.done&&e.date<t).sort((a,b)=>a.date.localeCompare(b.date));$('v3Overdue').innerHTML=overdue.length?overdue.map(e=>{let diff=daysBetween(jdate(e.date),new Date());return `<div><div class="v3row"><strong>${escapeHtml(e.name)}</strong><span class="v3badge v3danger">${num(diff)} روز تأخیر</span></div><div class="v3row" style="margin-top:7px"><button class="secondary smallbtn" data-overdone="${e.id}">انجام شد</button><button class="secondary smallbtn" data-move="${e.id}">انتقال به امروز</button></div></div>`}).join(''):'<div class="empty">عالیه! کار عقب‌افتاده‌ای نداری.</div>';document.querySelectorAll('[data-overdone]').forEach(b=>b.onclick=()=>{let e=events.find(x=>x.id===b.dataset.overdone);if(e)e.done=true;persist()});document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{let e=events.find(x=>x.id===b.dataset.move);if(e)e.date=t;persist()});let name=profile?.name||'';$('v3DayaLine').textContent=lang==='en'?`You have ${today.length} plans today; ${today.filter(e=>!e.done).length} remain.`:`${name?name+'، ':''}امروز ${num(today.length)} برنامه داری؛ ${num(today.filter(e=>!e.done).length)} مورد باقی مونده.`;}
function achievements(){let streak=Number($('streak')?.textContent.replace(/[^0-9]/g,''))||0;let titles=[[7,'شروع قدرتمند'],[10,'جنگجوی منظم'],[30,'استاد استمرار'],[50,'افسانه نظم'],[60,'شکست‌ناپذیر'],[100,'اسطوره DayFlow'],[365,'قهرمان یک ساله']];$('v3Achievements').innerHTML=titles.map(([n,s])=>`<div class="v3chip"><b>${streak>=n?'🏆':'🔒'} ${s}</b><small>${num(n)} روز</small></div>`).join('')}
function renderAll(){grantFreezeRewards();profileUI();renderDashboard();renderCategories();renderWeek();achievements();$('v3FocusStats').textContent=`امروز: ${num(Math.round((prefs.focusTotal||0)/60))} دقیقه · این هفته: ${num(Math.round((prefs.focusWeekTotal||0)/60))} دقیقه`}
$('v3Mode').onclick=()=>{prefs.mode=prefs.mode==='category'?'time':'category';write('df-prefs',prefs);$('v3Mode').textContent=prefs.mode==='category'?'نمای زمانی':'نمای دسته‌بندی';$('v3Categories').classList.toggle('v3hidden',prefs.mode==='time');$('v3CategoryResults').classList.toggle('v3hidden',prefs.mode==='time');};
// Weekly recurrence: create explicit future occurrences, so single dates remain editable without affecting the series.
$('v3Recurring').onchange=()=>{$('v3RepeatOptions').classList.toggle('v3hidden',!$('v3Recurring').checked)};
const oldOpenForm=openForm;window.openForm=function(e=null){oldOpenForm(e);$('v3Priority').value=e?.priority||'normal';$('v3Recurring').checked=!!e?.seriesId;$('v3RepeatOptions').classList.toggle('v3hidden',!e?.seriesId);$('v3Weekdays').querySelectorAll('input').forEach(x=>x.checked=(e?.weekdays||[]).includes(+x.value));$('v3RepeatEnd').value='26';$('v3Note').value=e?.note||''};
$('saveBtn').onclick=()=>{let name=$('eventName').value.trim(),d=jdate($('eventDate').value);if(!name||!d){alert('عنوان و تاریخ معتبر را وارد کن.');return}let isNew=!editing,base=events.find(x=>x.id===editing),id=editing||String(Date.now()),type=$('eventType').value,weekdays=[...document.querySelectorAll('.v3weekday:checked')].map(x=>+x.value),rec=$('v3Recurring').checked;let item={id,name,type,date:key(d),time:$('eventTime').value||'09:00',reminders:[...document.querySelectorAll('.remind:checked')].map(x=>+x.value),repeat:$('repeat').value,done:base?.done||false,priority:$('v3Priority').value,note:$('v3Note').value.trim(),seriesId:base?.seriesId||null,weekdays:base?.weekdays||[]};if(rec&&isNew){if(!weekdays.length){alert('برای تکرار هفتگی دست‌کم یک روز انتخاب کن.');return}let sid='series-'+Date.now(),weeks=Number($('v3RepeatEnd').value)||104,count=0;for(let i=0;i<=weeks*7&&count<730;i++){let dt=new Date(d);dt.setDate(dt.getDate()+i);let wd=(dt.getDay()+1)%7;if(weekdays.includes(wd)){events.push({...item,id:`${sid}-${key(dt)}`,date:key(dt),seriesId:sid,weekdays,done:false});count++}}}else if(editing){events=events.map(x=>x.id===id?{...item,seriesId:base?.seriesId||null}:x)}else events.push(item);selected=d;save();show('home');scheduleReminders();renderAll();};
// Calendar export with VALARM; uses each occurrence as a separate event for import compatibility.
function icsEscape(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n')}
function toICSDate(date,time){let d=jdate(date);if(!d)return '';let [h,m]=(time||'09:00').split(':').map(Number);return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(h).padStart(2,'0')}${String(m).padStart(2,'0')}00`}
$('v3ExportIcs').onclick=()=>{let classes=events.filter(e=>e.type==='class');if(!classes.length){alert('هنوز کلاسی برای خروجی گرفتن ثبت نکردی.');return}let alarms=[];if($('v3Alarm30').checked)alarms.push(30);if($('v3Alarm60').checked)alarms.push(60);if(!alarms.length){alert('حداقل یک زمان هشدار انتخاب کن.');return}let lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//DayFlow//FA','CALSCALE:GREGORIAN','METHOD:PUBLISH'];classes.forEach(e=>{let start=toICSDate(e.date,e.time);if(!start)return;let d=jdate(e.date),[h,m]=(e.time||'09:00').split(':').map(Number);d.setHours(h,m+60,0,0);let end=`${d.getFullYear()}${String(d.getMonth()+1).padStart(2,'0')}${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}${String(d.getMinutes()).padStart(2,'0')}00`;lines.push('BEGIN:VEVENT',`UID:${icsEscape(e.id)}@dayflow`,`DTSTAMP:${new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}/,'')}`,`DTSTART:${start}`,`DTEND:${end}`,`SUMMARY:${icsEscape(e.name)}`,`DESCRIPTION:${icsEscape(e.note||'ساخته‌شده با DayFlow')}`);alarms.forEach(min=>lines.push('BEGIN:VALARM','ACTION:DISPLAY',`DESCRIPTION:${icsEscape(e.name)} - یادآوری کلاس`,`TRIGGER:-PT${min}M`,'END:VALARM'));lines.push('END:VEVENT')});lines.push('END:VCALENDAR');let blob=new Blob([lines.join('\r\n')],{type:'text/calendar;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='DayFlow-Classes.ics';a.click();setTimeout(()=>URL.revokeObjectURL(url),1500);alert('فایل تقویم ساخته شد. آن را با Samsung Calendar باز یا وارد کن؛ هشدارها را پس از واردکردن بررسی کن.')};
// Focus timer (active while this page remains open).
function fmtTimer(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}
function focusPaint(){$('v3Timer').textContent=fmtTimer(focus.left);$('v3FocusStart').textContent=focus.running?'توقف':'ادامه'}
function stopFocus(){clearInterval(focus.handle);focus.running=false;focus.handle=null;focusPaint()}
$('v3FocusStart').onclick=()=>{if(focus.running){stopFocus();return}focus.running=true;focus.handle=setInterval(()=>{focus.left--;if(focus.left<=0){let wasBreak=focus.break;stopFocus();if(!wasBreak){let day=todayKey();prefs.focusTotal=(prefs.focusDay===day?prefs.focusTotal:0)+1500;prefs.focusDay=day;let wk=key(weekStart(new Date()));prefs.focusWeekTotal=(prefs.focusWeekKey===wk?prefs.focusWeekTotal:0)+1500;prefs.focusWeekKey=wk;write('df-prefs',prefs);focus.break=true;focus.left=300;alert('آفرین! ۲۵ دقیقه تمرکز کامل شد. وقت ۵ دقیقه استراحته.');}else{focus.break=false;focus.left=1500;alert('استراحت تموم شد؛ آماده‌ی یک دور تمرکز دیگه‌ای؟')}focusPaint();renderAll()}else focusPaint()},1000);focusPaint()};$('v3FocusReset').onclick=()=>{stopFocus();focus.left=focus.break?300:1500;focusPaint()};$('v3FocusCustom').onclick=()=>{let v=prompt('مدت تمرکز به دقیقه (۱ تا ۱۲۰):','25');if(v!==null&&Number(v)>=1&&Number(v)<=120){stopFocus();focus.break=false;focus.left=Math.round(Number(v)*60);focusPaint()}};
// Stats modal.
$('v3StatsBtn').onclick=()=>{let completed=events.filter(e=>e.done).length,total=events.length,classes=events.filter(e=>e.type==='class').length,hw=events.filter(e=>e.type==='homework'&&e.done).length,days=new Set(events.filter(e=>e.done).map(e=>e.date)).size;modal('آمار DayFlow',`<div class="v3grid"><div class="v3tile"><small>تکالیف انجام‌شده</small><strong>${num(hw)}</strong></div><div class="v3tile"><small>کلاس‌های ثبت‌شده</small><strong>${num(classes)}</strong></div><div class="v3tile"><small>درصد تکمیل</small><strong>${num(total?Math.round(completed/total*100):0)}٪</strong></div><div class="v3tile"><small>روزهای فعال</small><strong>${num(days)}</strong></div><div class="v3tile"><small>زمان تمرکز امروز</small><strong>${num(Math.round((prefs.focusTotal||0)/60))} دقیقه</strong></div><div class="v3tile"><small>زمان تمرکز این هفته</small><strong>${num(Math.round((prefs.focusWeekTotal||0)/60))} دقیقه</strong></div></div><h3>پیشرفت ۷ روز اخیر</h3><div class="v3row" style="align-items:end;height:110px">${Array.from({length:7},(_,i)=>{let d=new Date();d.setDate(d.getDate()-(6-i));let k=key(d),all=events.filter(e=>e.date===k),done=all.filter(e=>e.done).length,p=all.length?Math.round(done/all.length*100):0;return `<div style="flex:1;text-align:center"><div style="height:${Math.max(4,p)}px;background:var(--accent);border-radius:7px 7px 2px 2px"></div><small class="v3muted">${weekNames[(d.getDay()+1)%7]}</small></div>`}).join('')}</div><p class="v3muted">این آمار بر اساس برنامه‌هایی است که در همین مرورگر ثبت شده‌اند.</p>`)};
// DayFlow V4: lightweight button-based Daya. No AI or free-form intent parsing.
function dayaPushMessage(role,text){
  dayaHistory.push({role,text});
  if(dayaHistory.length>80) dayaHistory=dayaHistory.slice(-80);
  write('df-daya-history',dayaHistory);
  const chat=$('v3DayaChat');
  if(chat){chat.insertAdjacentHTML('beforeend',`<div class="v3chat ${role}">${escapeHtml(text)}</div>`);chat.scrollTop=chat.scrollHeight;}
}
function dayaGetDate(offset){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+offset);return d;}
function dayaShowSchedule(offset,range=false){
  const base=dayaGetDate(offset),start=new Date(base);
  if(range){start.setDate(start.getDate()-((start.getDay()+1)%7));}
  const end=range?new Date(start):new Date(base);
  if(range)end.setDate(end.getDate()+6);
  const from=key(start),to=key(end);
  const list=events.filter(e=>e.date>=from&&e.date<=to).sort((a,b)=>a.date.localeCompare(b.date)||(a.time||'').localeCompare(b.time||''));
  const label=range?'این هفته':offset===0?'امروز':'فردا';
  const answer=list.length?list.map(e=>`${e.date} · ${e.time||'بدون ساعت'} — ${e.name} (${cats[e.type]?.[0]||'برنامه'})${e.done?' ✓':''}`).join('\n'):`برای ${label} برنامه‌ای ثبت نشده است.`;
  dayaPushMessage('bot',`برنامه ${label}:\n${answer}`);
}
function dayaOpenAddForm(){
  const form=$('v3DayaAddForm');if(!form)return;
  form.classList.toggle('v3hidden');
  if(!form.classList.contains('v3hidden'))$('v3DayaTitle').focus();
}
function dayaAddPlan(){
  const name=$('v3DayaTitle').value.trim();
  if(!name){alert('اول عنوان برنامه را بنویس.');$('v3DayaTitle').focus();return;}
  const offset=Number($('v3DayaDate').value)||0;
  const date=key(dayaGetDate(offset));
  const time=$('v3DayaTime').value||'';
  const type=$('v3DayaType').value;
  const item={id:'daya-'+Date.now(),name,type,date,time,done:false,priority:'normal',reminders:[],repeat:'off',note:'',source:'daya'};
  events.push(item);
  try{
    save();
    const stored=JSON.parse(localStorage.getItem('df-events')||'[]');
    if(!stored.some(e=>e.id===item.id)) throw new Error('save verification failed');
  }catch(err){
    events=events.filter(e=>e.id!==item.id);
    alert('ذخیره برنامه انجام نشد. فضای ذخیره‌سازی مرورگر را بررسی کن و دوباره تلاش کن.');
    return;
  }
  renderAll();
  if(typeof scheduleReminders==='function') scheduleReminders();
  dayaPushMessage('user',`افزودن برنامه: ${name}`);
  dayaPushMessage('bot',`«${name}» برای ${offset===0?'امروز':offset===1?'فردا':'پس‌فردا'} اضافه شد.`);
  $('v3DayaTitle').value='';$('v3DayaTime').value='';$('v3DayaAddForm').classList.add('v3hidden');
}
$('v3DayaOpen').onclick=()=>{
  modal('Daya · دستیار ساده',`
    <p class="v3muted">از گزینه‌ها استفاده کن؛ لازم نیست دستور پیچیده بنویسی.</p>
    <div class="v3grid" style="margin:10px 0">
      <button class="primary" id="v3DayaAddToggle">＋ افزودن برنامه</button>
      <button class="secondary" id="v3DayaTomorrow">برنامه فردا</button>
      <button class="secondary" id="v3DayaToday">برنامه امروز</button>
      <button class="secondary" id="v3DayaWeek">برنامه این هفته</button>
    </div>
    <div id="v3DayaAddForm" class="v3tile v3hidden">
      <strong>برنامه جدید</strong>
      <div class="v3field"><label for="v3DayaTitle">عنوان برنامه</label><input id="v3DayaTitle" maxlength="100" placeholder="مثلاً رفتن به آنالیز بدن"></div>
      <div class="v3field"><label for="v3DayaType">دسته‌بندی</label><select id="v3DayaType"><option value="personal">شخصی</option><option value="class">کلاس</option><option value="homework">تکلیف و مطالعه</option><option value="exam">امتحان و رویداد</option></select></div>
      <div class="v3field"><label for="v3DayaDate">روز</label><select id="v3DayaDate"><option value="1">فردا</option><option value="0">امروز</option><option value="2">پس‌فردا</option></select></div>
      <div class="v3field"><label for="v3DayaTime">ساعت (اختیاری)</label><input id="v3DayaTime" type="time"></div>
      <div class="v3row"><button class="primary" id="v3DayaSave">ذخیره برنامه</button><button class="secondary" id="v3DayaCancelAdd">انصراف</button></div>
    </div>
    <div id="v3DayaChat" style="max-height:30vh;overflow:auto;margin-top:12px">${dayaHistory.map(x=>`<div class="v3chat ${x.role}">${escapeHtml(x.text)}</div>`).join('')}</div>
    <p class="v3muted">دایا با داده‌های ذخیره‌شده در همین DayFlow کار می‌کند و از هوش مصنوعی آنلاین استفاده نمی‌کند.</p>`);
  $('v3DayaAddToggle').onclick=dayaOpenAddForm;
  $('v3DayaTomorrow').onclick=()=>dayaShowSchedule(1);
  $('v3DayaToday').onclick=()=>dayaShowSchedule(0);
  $('v3DayaWeek').onclick=()=>dayaShowSchedule(0,true);
  $('v3DayaSave').onclick=dayaAddPlan;
  $('v3DayaCancelAdd').onclick=()=> $('v3DayaAddForm').classList.add('v3hidden');
  $('v3DayaTitle').onkeydown=e=>{if(e.key==='Enter')dayaAddPlan()};
};
// User preferences and visibility.
$('v3Accent').value=prefs.accent||'#aa8cff';$('v3Accent').oninput=e=>setAccent(e.target.value);Object.keys(cats).forEach(k=>{let el=$('v3Color-'+k);if(el)el.oninput=()=>{prefs.categoryColors=prefs.categoryColors||{};prefs.categoryColors[k]=el.value;cats[k][1]=el.value;write('df-prefs',prefs);renderCategories()}});$('v3DashPrefs').onclick=()=>{modal('مدیریت کارت‌های خانه',`<p class="v3muted">بخش‌هایی که نمی‌خواهی نمایش داده شوند را انتخاب کن.</p>${['v3Greeting','v3DashSection','v3CategorySection','v3OverdueSection','v3WeekSection','v3FocusSection'].map((id,i)=>`<label><input type="checkbox" data-hide="${id}" ${prefs.hidden.includes(id)?'':'checked'}> ${['پیام خوشامد','کارت‌های داشبورد','دسته‌بندی‌ها','عقب‌افتاده‌ها','برنامه هفتگی','تمرکز'][i]}</label>`).join('')}<button class="primary" id="v3HideSave">ذخیره</button>`);$('v3HideSave').onclick=()=>{prefs.hidden=[...document.querySelectorAll('[data-hide]:not(:checked)')].map(x=>x.dataset.hide);write('df-prefs',prefs);prefs.hidden.forEach(id=>$(id)?.classList.add('v3hidden'));['v3Greeting','v3DashSection','v3CategorySection','v3OverdueSection','v3WeekSection','v3FocusSection'].filter(id=>!prefs.hidden.includes(id)).forEach(id=>$(id)?.classList.remove('v3hidden'));$('v3Modal').classList.add('v3hidden')}};
$('v3DashOrder').onclick=()=>{let labels={v3Greeting:'پیام خوشامد',v3DashSection:'نمای امروز',v3CategorySection:'دسته‌بندی‌ها',v3OverdueSection:'کارهای عقب‌افتاده',v3WeekSection:'برنامه هفتگی',v3FocusSection:'تمرکز',v3StatsSection:'آمار و دستاوردها',v3DayaSection:'Daya'};let order=prefs.dashboardOrder||Object.keys(labels);modal('ترتیب بخش‌های خانه',`<div id="v3OrderList" class="v3list">${order.map((id,i)=>`<div class="v3row"><strong>${labels[id]}</strong><span><button class="secondary smallbtn" data-order-up="${i}" ${i===0?'disabled':''}>↑</button> <button class="secondary smallbtn" data-order-down="${i}" ${i===order.length-1?'disabled':''}>↓</button></span></div>`).join('')}</div><button class="primary" id="v3OrderSave">ذخیره ترتیب</button>`);document.querySelectorAll('[data-order-up]').forEach(b=>b.onclick=()=>{let i=+b.dataset.orderUp;if(i>0){[order[i-1],order[i]]=[order[i],order[i-1]];$('v3DashOrder').click()}});document.querySelectorAll('[data-order-down]').forEach(b=>b.onclick=()=>{let i=+b.dataset.orderDown;if(i<order.length-1){[order[i+1],order[i]]=[order[i],order[i+1]];$('v3DashOrder').click()}});$('v3OrderSave').onclick=()=>{prefs.dashboardOrder=order;write('df-prefs',prefs);applyDashboardOrder();$('v3Modal').classList.add('v3hidden')}};
function applyDashboardOrder(){let home=$('homeView');(prefs.dashboardOrder||[]).forEach(id=>{let el=$(id);if(el)home.appendChild(el)})}
$('v3Backup').onclick=()=>{let data={events,profile,prefs,dayaHistory};let blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='DayFlow-backup.json';a.click();URL.revokeObjectURL(url)};$('v3Restore').onclick=()=>$('v3RestoreFile').click();$('v3RestoreFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;try{let data=JSON.parse(await f.text());if(!Array.isArray(data.events))throw Error();if(!confirm('اطلاعات فعلی با نسخه پشتیبان جایگزین شود؟'))return;events=data.events;profile=data.profile||profile;prefs=data.prefs||prefs;dayaHistory=data.dayaHistory||[];save();write('df-profile',profile);write('df-prefs',prefs);write('df-daya-history',dayaHistory);renderAll();alert('بازیابی انجام شد.')}catch{alert('فایل پشتیبان معتبر نیست.')}e.target.value=''};
// Keep original V2 dashboard, calendar and language logic, then layer V3.
const oldRenderHome=renderHome;window.renderHome=function(){oldRenderHome();renderAll()};
const oldToggle=toggle;window.toggle=function(id){oldToggle(id);renderAll()};

// Streak Freeze: consumes at most one freeze per missed day, without creating fake completed tasks.
window.updateStreak=function(){let active=new Set(events.filter(e=>e.done).map(e=>e.date)),ordered=[...active].sort(),earliest=ordered[0],used=prefs.freezeUsedDates||[],cursor=new Date();cursor.setDate(cursor.getDate()-(active.has(todayKey())?0:1));let streak=0,guard=0;while(earliest&&guard++<370){let k=key(cursor);if(k<earliest)break;if(active.has(k)){streak++;cursor.setDate(cursor.getDate()-1);continue}if(prefs.freeze>0&&!used.includes(k)){prefs.freeze=Math.max(0,prefs.freeze-1);used.push(k);prefs.freezeUsedDates=used;write('df-prefs',prefs);streak++;cursor.setDate(cursor.getDate()-1);continue}break}$('streak').textContent=num(streak);$('v3Freeze').textContent=num(prefs.freeze);$('v3FreezeSetting').textContent=num(prefs.freeze)};
function grantFreezeRewards(){let active=[...new Set(events.filter(e=>e.done).map(e=>e.date))].sort(),milestones=prefs.freezeMilestones||[];for(let n=1;n<=Math.floor(active.length/7);n++){if(!milestones.includes(n)){prefs.freeze=Math.min(3,(prefs.freeze||0)+1);milestones.push(n)}}prefs.freezeMilestones=milestones;write('df-prefs',prefs)}
// Priority sorting and visible priority markers in both V2 lists and V3 category lists.
window.taskMarkup=function(list){const rank={high:0,normal:1,low:2};list.sort((a,b)=>prefs.mode==='time'?(a.time||'').localeCompare(b.time||''):(rank[a.priority||'normal']-rank[b.priority||'normal'])||(a.time||'').localeCompare(b.time||''));return list.length?list.map(e=>`<div class="task ${e.done?'done':''} v3task" style="border-inline-start-color:${e.priority==='high'?'#ef929c':e.priority==='low'?'#7dd6b0':'#aa8cff'}"><button class="check ${e.done?'on':''}" data-check="${e.id}">${e.done?'✓':''}</button><div class="taskinfo"><div class="taskname">${escapeHtml(e.name)}</div><div class="taskmeta">${escapeHtml(e.time||'—')} · ${cats[e.type]?.[0]||'برنامه'} · ${e.date}</div></div><span class="tag">${e.priority==='high'?'ضروری':e.priority==='low'?'کم‌اهمیت':'معمولی'}</span><button class="smallbtn ghost" data-edit="${e.id}">•••</button></div>`).join(''):'<div class="empty">برای این روز هنوز برنامه‌ای ثبت نکردی.</div>'};
// For a recurring event, ask whether the edit applies to this date or all future dates.
let v3SeriesMode='one',v3SeriesAnchor=null;const originalOpenForm=window.openForm;window.openForm=function(e=null){v3SeriesMode='one';v3SeriesAnchor=e||null;if(e?.seriesId){v3SeriesMode=confirm('این مورد تکرارشونده است. فقط همین جلسه ویرایش شود؟\nتأیید = فقط همین جلسه\nلغو = این جلسه و تمام جلسات آینده');if(!v3SeriesMode)v3SeriesMode='future';}originalOpenForm(e)};
const originalSaveClick=$('saveBtn').onclick;$('saveBtn').onclick=()=>{if(v3SeriesAnchor?.seriesId&&v3SeriesMode==='future'){let name=$('eventName').value.trim(),d=jdate($('eventDate').value);if(!name||!d){alert('عنوان و تاریخ معتبر را وارد کن.');return}let anchor=v3SeriesAnchor,delta=Math.round((d-jdate(anchor.date))/86400000),future=events.filter(x=>x.seriesId===anchor.seriesId&&x.date>=anchor.date);future.forEach(old=>{let shifted=jdate(old.date);shifted.setDate(shifted.getDate()+delta);old.date=key(shifted);old.name=name;old.type=$('eventType').value;old.time=$('eventTime').value||'09:00';old.priority=$('v3Priority').value;old.note=$('v3Note').value.trim();old.reminders=[...document.querySelectorAll('.remind:checked')].map(x=>+x.value);old.repeat=$('repeat').value});save();selected=d;show('home');scheduleReminders();renderAll();v3SeriesAnchor=null;v3SeriesMode='one';return}originalSaveClick();v3SeriesAnchor=null;v3SeriesMode='one'};
$('v3SeriesManage').onclick=()=>{let series=[...new Set(events.filter(e=>e.seriesId).map(e=>e.seriesId))];modal('مدیریت کلاس‌های تکرارشونده',series.length?series.map(id=>{let a=events.find(e=>e.seriesId===id);return `<div class="v3tile" style="margin-bottom:8px"><strong>${escapeHtml(a?.name||'سری برنامه')}</strong><div class="v3muted">${events.filter(e=>e.seriesId===id).length} جلسه ثبت‌شده</div><button class="secondary smallbtn" data-stopseries="${id}">توقف و حذف جلسات آینده</button></div>`}).join(''):'<div class="empty">سری تکرارشونده‌ای ثبت نشده.</div>');document.querySelectorAll('[data-stopseries]').forEach(b=>b.onclick=()=>{let id=b.dataset.stopseries,first=events.find(e=>e.seriesId===id),from=first?.date||todayKey();if(confirm('تمام جلسات آینده این سری حذف شوند؟ جلسات گذشته حفظ می‌شوند.')){events=events.filter(e=>{if(e.seriesId!==id)return true;if(e.date>=todayKey())return false;e.seriesId=null;return true});save();renderAll();$('v3Modal').classList.add('v3hidden')}})};
// Optional profile picture upload stays local to this browser.
$('v3AvatarPick').onclick=()=>$('v3AvatarFile').click();$('v3AvatarFile').onchange=async e=>{let f=e.target.files[0];if(!f)return;if(f.size>1200000){alert('لطفاً تصویری کوچک‌تر از ۱٫۲ مگابایت انتخاب کن.');e.target.value='';return}let reader=new FileReader();reader.onload=()=>{profile=profile||{name:'کاربر',avatar:'🌟'};profile.avatarImage=reader.result;write('df-profile',profile);profileUI()};reader.readAsDataURL(f);e.target.value=''};


function applyV3Language(){let en=lang==='en';let ids={v3Mode:en?(prefs.mode==='category'?'Time view':'Category view'):(prefs.mode==='category'?'نمای زمانی':'نمای دسته‌بندی'),v3StatsBtn:en?'Details':'جزئیات',v3FocusStart:en?(focus.running?'Pause':'Start focus'):(focus.running?'توقف':'شروع تمرکز'),v3FocusReset:en?'Reset':'بازنشانی',v3FocusCustom:en?'Custom duration':'زمان دلخواه',v3DayaOpen:en?'Chat':'گفت‌وگو',v3ExportIcs:en?'Export classes for Samsung Calendar':'خروجی کلاس‌ها برای Samsung Calendar',v3Backup:en?'Download backup':'دریافت نسخه پشتیبان',v3Restore:en?'Restore backup':'بازیابی نسخه پشتیبان',v3EditProfile:en?'Edit profile':'ویرایش پروفایل',v3DashPrefs:en?'Manage cards':'مدیریت کارت‌ها',v3AvatarPick:en?'Choose image':'انتخاب تصویر',v3SeriesManage:en?'Manage series':'مدیریت سری‌ها'};Object.entries(ids).forEach(([id,t])=>{if($(id))$(id).textContent=t});let names=en?{class:'Classes',homework:'Homework & study',personal:'Personal',exam:'Exams & events'}:{class:'کلاس',homework:'تکلیف و مطالعه',personal:'شخصی',exam:'امتحان و رویداد'};Object.keys(cats).forEach(k=>cats[k][0]=names[k]);let labels=document.querySelectorAll('#v3Greeting .muted, #v3Dash .v3tile small');if(en){$('v3Greeting').querySelector('.muted').textContent='Welcome to DayFlow';$('v3Dash').querySelectorAll('.v3tile small')[0].textContent='Today progress';$('v3Dash').querySelectorAll('.v3tile small')[1].textContent='Next class';$('v3Dash').querySelectorAll('.v3tile small')[2].textContent='Homework left';$('v3Dash').querySelectorAll('.v3tile small')[3].textContent='Tomorrow';$('v3Dash').querySelectorAll('.v3tile small')[4].textContent='Streak freezes';$('v3Greeting').querySelector('strong').textContent=`Welcome${profile?.name?', '+profile.name:''}! 👋`;document.querySelector('#homeView .sectionhead h2').textContent='Today overview';document.querySelectorAll('#homeView .sectionhead h2')[1].textContent='Categories';$('v3Overdue').previousElementSibling.querySelector('h2').textContent='Overdue tasks';$('v3Week').previousElementSibling.querySelector('h2').textContent='Weekly schedule';$('v3DayaLine').textContent='Let’s organize your day.';}else{$('v3Greeting').querySelector('.muted').textContent='خوش اومدی به DayFlow';document.querySelector('#homeView .sectionhead h2').textContent='نمای امروز';document.querySelectorAll('#homeView .sectionhead h2')[1].textContent='دسته‌بندی‌ها';$('v3Overdue').previousElementSibling.querySelector('h2').textContent='کارهای عقب‌افتاده';$('v3Week').previousElementSibling.querySelector('h2').textContent='برنامه هفتگی'}renderCategories();}
const priorLanguageClick=$('langBtn').onclick;$('langBtn').onclick=()=>{priorLanguageClick();renderAll();applyV3Language()};

setAccent(prefs.accent||'#aa8cff');applyCategoryColors();applyDashboardOrder();updateStreak();if(prefs.mode==='time'){$('v3Mode').textContent='نمای دسته‌بندی';$('v3Categories').classList.add('v3hidden')};prefs.hidden.forEach(id=>$(id)?.classList.add('v3hidden'));if(profile)profileUI();renderAll();applyV3Language();

// ================= DayFlow V5 refinements =================
document.title='DayFlow V5';
document.querySelector('meta[name="description"]')?.setAttribute('content','DayFlow V5 — برنامه‌ریز شخصی');
const v5style=document.createElement('style');
v5style.textContent=`
#v3Greeting{order:-10;margin-top:4px!important}
#v3DashSection h2{font-size:17px}
#v3CategorySection{display:none!important}
#v3WeekSection{margin-top:12px}
.v5weekhead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:8px 0}
.v5weekhead button{background:#302c3d;border-radius:11px;padding:7px 12px}
.v5daydetail{border:1px solid var(--line);border-radius:14px;padding:11px;margin-top:8px;background:#25222f}
.v5chatinput{display:flex;gap:7px;margin-top:10px}.v5chatinput input{flex:1;min-width:0}
#v3DayaSection .muted{line-height:1.7}
.v3foot{display:block;width:100%;text-align:center;padding:22px 0 12px;margin-top:26px;border-top:1px solid var(--line)}
`;
document.head.appendChild(v5style);
// Greeting first, creator credit last.
const v5home=$('homeView'), v5greet=$('v3Greeting'), v5foot=document.querySelector('.v3foot');
if(v5home&&v5greet){const hdr=document.querySelector('header');if(hdr)hdr.after(v5greet);else v5home.prepend(v5greet);}
if(v5home&&v5foot)v5home.appendChild(v5foot);
// Compact today summary; keep the useful overview cards and remove the duplicate long upcoming list.
$('upcomingTitle')?.closest('section')?.classList.add('v5hide');
$('upcomingList')?.classList.add('v5hide');
document.querySelector('#homeView .sectionhead h2')?.replaceChildren(document.createTextNode('خلاصه امروز'));
// Only tasks and personal plans can be marked complete. Classes and exams are informational.
window.taskMarkup=function(list){
 const rank={high:0,normal:1,low:2};
 list.sort((a,b)=>(rank[a.priority||'normal']-rank[b.priority||'normal'])||(a.time||'').localeCompare(b.time||''));
 return list.length?list.map(e=>{
  const trackDone=['homework','personal'].includes(e.type);
  return `<div class="task ${trackDone&&e.done?'done':''} v3task" style="border-inline-start-color:${e.priority==='high'?'#ef929c':e.priority==='low'?'#7dd6b0':'#aa8cff'}">
  ${trackDone?`<button class="check ${e.done?'on':''}" data-check="${e.id}">${e.done?'✓':''}</button>`:''}
  <div class="taskinfo"><div class="taskname">${escapeHtml(e.name)}</div><div class="taskmeta">${escapeHtml(e.time||'—')} · ${cats[e.type]?.[0]||'برنامه'} · ${e.date}</div></div>
  <span class="tag">${e.priority==='high'?'ضروری':e.priority==='low'?'کم‌اهمیت':'معمولی'}</span><button class="smallbtn ghost" data-edit="${e.id}">ویرایش</button></div>`;
 }).join(''):'<div class="empty">برای این روز هنوز برنامه‌ای ثبت نکردی.</div>';
};
// Rebind task actions after replacing markup.
const v5oldRenderHome=renderHome;
renderHome=function(){v5oldRenderHome();};
function v5TypeForm(){
 const type=$('eventType')?.value;
 const timeLabel=$('timeLabel')?.parentElement, timeOpen=$('timeOpen')?.parentElement;
 const isExam=type==='exam';
 if(timeLabel)timeLabel.style.display=isExam?'none':'block';
 if($('reminderArea'))$('reminderArea').style.display=type==='class'?'none':'block';
 if($('repeat')?.parentElement)$('repeat').parentElement.style.display=type==='class'||type==='exam'?'none':'block';
 const rec=$('v3Recurring')?.closest('.v3field'); if(rec)rec.style.display=type==='class'?'block':'none';
}
$('eventType')?.addEventListener('change',v5TypeForm);
const v5openForm=window.openForm;
window.openForm=function(e){v5openForm(e);v5TypeForm();};
$('saveBtn')?.addEventListener('click',()=>{setTimeout(()=>{events.forEach(e=>{if(e.type==='class'||e.type==='exam')e.done=false; if(e.type==='exam')e.time='';});save();},0)});
// Put save button after all fields, including additional notes.
const v5formPanel=$('formView')?.querySelector('.panel');
const v5actions=v5formPanel?.querySelector('.formactions');
const v5note=$('v3Note')?.closest('.v3field');
if(v5formPanel&&v5actions&&v5note)v5formPanel.appendChild(v5actions);
// Weekly navigation: one week at a time, select a day for its entries.
let v5WeekOffset=0, v5SelectedDay='';
const v5weekHead=document.createElement('div');
v5weekHead.className='v5weekhead';
v5weekHead.innerHTML='<button id="v5WeekPrev" aria-label="هفته قبل">‹</button><strong id="v5WeekLabel">این هفته</strong><button id="v5WeekNext" aria-label="هفته بعد">›</button>';
$('v3Week')?.before(v5weekHead);
function v5RenderWeek(){
 const base=weekStart(new Date());base.setDate(base.getDate()+v5WeekOffset*7);
 const days=Array.from({length:7},(_,i)=>{let d=new Date(base);d.setDate(d.getDate()+i);return d});
 const fa=days.map(d=>`${faParts(d).d}`).join('، ');
 $('v5WeekLabel').textContent=`${faParts(days[0]).d} تا ${faParts(days[6]).d}`;
 $('v3Week').innerHTML=days.map((d,i)=>`<button class="v3day ${dayKey(d)===(v5SelectedDay||todayKey())?'active':''}" data-v5day="${dayKey(d)}"><b>${weekNames[i]}</b><br>${faParts(d).d}${events.some(e=>e.date===dayKey(d))?' •':''}</button>`).join('');
 $('v3Week').querySelectorAll('[data-v5day]').forEach(b=>b.onclick=()=>{
  v5SelectedDay=b.dataset.v5day;
  $('v3Week').querySelectorAll('[data-v5day]').forEach(x=>x.classList.toggle('active',x===b));
  const list=events.filter(e=>e.date===v5SelectedDay).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
  $('v3WeekItems').innerHTML=list.length?list.map(e=>`<div class="v5daydetail"><strong>${escapeHtml(e.name)}</strong><div class="taskmeta">${e.time||'بدون ساعت'} · ${cats[e.type]?.[0]||'برنامه'}</div><button class="secondary smallbtn" data-v5edit="${e.id}" style="margin-top:7px">جزئیات و ویرایش</button></div>`).join(''):'<div class="empty">برای این روز برنامه‌ای ثبت نشده.</div>';
  $('v3WeekItems').querySelectorAll('[data-v5edit]').forEach(x=>x.onclick=()=>edit(x.dataset.v5edit));
 });
 $('v3Week').querySelector(`[data-v5day="${v5SelectedDay||todayKey()}"]`)?.click();
}
$('v5WeekPrev').onclick=()=>{v5WeekOffset--;v5RenderWeek()};
$('v5WeekNext').onclick=()=>{v5WeekOffset++;v5RenderWeek()};
renderWeek=v5RenderWeek;
// Daya: local Persian command parser. It creates only explicit, simple entries.
$('v3DayaOpen').onclick=()=>{
 modal('Daya · دستیار برنامه‌ریز',`
 <p class="v3muted">دستور فارسی بنویس؛ مثلاً «فردا ساعت ۱۶ کلاس ریاضی اضافه کن» یا «برنامه امروز رو نشون بده».</p>
 <div class="v5chatinput"><input id="v5DayaText" placeholder="مثلاً فردا ساعت ۵ تکلیف علوم"><button class="primary" id="v5DayaSend">ارسال</button></div>
 <div id="v5DayaChat" style="max-height:38vh;overflow:auto;margin-top:12px"></div>
 <p class="v3muted">این دستیار آفلاین و مبتنی بر تشخیص دستورهای ساده است؛ اگر جمله مبهم باشد، از تو اطلاعات بیشتری می‌خواهد.</p>`);
 const input=$('v5DayaText'), chat=$('v5DayaChat');
 function say(t,who='bot'){let d=document.createElement('div');d.className='v3chat '+(who==='user'?'user':'bot');d.textContent=t;chat.appendChild(d);chat.scrollTop=chat.scrollHeight}
 function parseCommand(raw){
  const s=raw.replace(/[۰-۹]/g,c=>'۰۱۲۳۴۵۶۷۸۹'.indexOf(c)).toLowerCase();
  if(/برنامه.*(امروز|فردا|هفته)|چی.*دارم/.test(s)){
   let offset=s.includes('فردا')?1:0, d=new Date();d.setDate(d.getDate()+offset);
   let k=key(d), list=events.filter(e=>e.date===k).sort((a,b)=>(a.time||'').localeCompare(b.time||''));
   say(list.length?list.map(e=>`${e.time||'—'}  ${e.name}`).join('\n'):'برای این روز برنامه‌ای ثبت نشده.');
   return;
  }
  if(!/(اضافه|ثبت|برنامه|بذار|قرار)/.test(s)){say('متوجه نشدم. برای افزودن برنامه، عنوان و روز را بنویس؛ مثلاً «فردا ساعت ۱۶ کلاس ریاضی اضافه کن».');return}
  let offset=/پس.?فردا/.test(s)?2:/فردا/.test(s)?1:0, d=new Date();d.setDate(d.getDate()+offset);
  let timeMatch=s.match(/ساعت\s*(\d{1,2})(?:[:٫.](\d{1,2}))?/);
  let time='';
  if(timeMatch){let h=+timeMatch[1],m=+(timeMatch[2]||0);if(h>23||m>59){say('ساعت واردشده معتبر نیست.');return}time=String(h).padStart(2,'0')+':'+String(m).padStart(2,'0')}
  let type=/کلاس/.test(s)?'class':/(امتحان|آزمون)/.test(s)?'exam':/(تکلیف|درس|مطالعه)/.test(s)?'homework':'personal';
  let name=raw.replace(/(امروز|فردا|پس.?فردا|ساعت\s*[۰-۹0-9]{1,2}([:٫.][۰-۹0-9]{1,2})?)/g,'').replace(/(اضافه کن|ثبت کن|اضافه|ثبت|برنامه|بذار|قرار)/g,'').trim();
  if(!name){say('عنوان برنامه مشخص نیست. جمله را با نام برنامه بنویس.');return}
  if(type==='class'&&!time){say('برای کلاس ساعت را هم بنویس؛ مثلاً «فردا ساعت ۱۶ کلاس ریاضی اضافه کن».');return}
  const item={id:'df'+Date.now()+Math.random().toString(16).slice(2,6),name,type,date:key(d),time,priority:'normal',done:false,note:'افزوده‌شده با Daya'};
  events.push(item);save();renderAll();renderHome();say(`«${name}» برای ${offset===0?'امروز':offset===1?'فردا':'پس‌فردا'} ثبت شد${time?'، ساعت '+time:''}.`);
 }
 function send(){let v=input.value.trim();if(!v)return; say(v,'user');input.value='';parseCommand(v)}
 $('v5DayaSend').onclick=send;input.onkeydown=e=>{if(e.key==='Enter')send()};
};

const v5oldDashboard=renderDashboard;
renderDashboard=function(){
 v5oldDashboard();
 const overdue=events.filter(e=>['homework','personal'].includes(e.type)&&!e.done&&e.date<todayKey()).sort((a,b)=>a.date.localeCompare(b.date));
 $('v3OverdueCount').textContent=num(overdue.length);
 $('v3Overdue').innerHTML=overdue.length?overdue.map(e=>`<div><div class="v5row"><strong>${escapeHtml(e.name)}</strong><span class="v3badge v3danger">${num(daysBetween(jdate(e.date),new Date()))} روز تأخیر</span></div><div class="v5row" style="margin-top:7px"><button class="secondary smallbtn" data-overdone="${e.id}">انجام شد</button><button class="secondary smallbtn" data-move="${e.id}">انتقال به امروز</button></div></div>`).join(''):'<div class="empty">عالیه! کار عقب‌افتاده‌ای نداری.</div>';
 document.querySelectorAll('[data-overdone]').forEach(b=>b.onclick=()=>{let e=events.find(x=>x.id===b.dataset.overdone);if(e)e.done=true;persist()});
 document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>{let e=events.find(x=>x.id===b.dataset.move);if(e)e.date=todayKey();persist()});
};
if($('v3Hello'))$('v3Hello').textContent=`سلام ${profile?.name||'خوش آمدید'}!`;

// More reliable local persistence and versioned offline cache.
try{localStorage.setItem('df-v5-installed','1')}catch(e){}

})();
