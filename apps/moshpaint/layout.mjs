export function installLayout(){
 const bar=document.createElement('div');bar.className='panel-access';bar.innerHTML='<button id="showTools" aria-expanded="false">Tools</button><button id="showSettings" aria-expanded="false">Settings / fills</button><button id="closePanels">Back to canvas</button>';document.querySelector('main').before(bar);
 const narrow=()=>matchMedia('(max-width: 800px)').matches;
 function show(panel){document.body.dataset.panel=panel;document.querySelector('#showTools').setAttribute('aria-expanded',String(panel==='tools'));document.querySelector('#showSettings').setAttribute('aria-expanded',String(panel==='settings'));}
 document.querySelector('#showTools').onclick=()=>show(document.body.dataset.panel==='tools'?'':'tools');document.querySelector('#showSettings').onclick=()=>show(document.body.dataset.panel==='settings'?'':'settings');document.querySelector('#closePanels').onclick=()=>show('');
 document.addEventListener('click',e=>{if(!narrow())return;if(e.target.closest('#favoriteMoireFill,#formOptions'))show('settings');else if(e.target.closest('[data-tool],[data-favorite-tool]'))show('');},true);
 addEventListener('resize',()=>{if(!narrow())show('');});
 return {showSettings:()=>{if(narrow())show('settings');}};
}
