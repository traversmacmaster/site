export function editableTarget(target){
  if(!target)return false;
  if(target.isContentEditable||target.closest?.('[contenteditable="true"],[role="textbox"]'))return true;
  const tag=target.tagName?.toUpperCase();
  return tag==='TEXTAREA'||tag==='SELECT'||(tag==='INPUT'&&!['range','checkbox','radio','button','submit','reset','color','file'].includes(target.type));
}
// Exact chords: modifiers never fall through to an unmodified action.
export function shortcutAction(e,{editable=false,dialog=false}={}){
  if(e.isComposing||e.keyCode===229)return null;
  const key=e.key?.toLowerCase(),command=e.ctrlKey||e.metaKey;
  if(key==='escape')return 'escape';
  if(editable||dialog||e.altKey)return null;
  if(command){
    if(key==='z')return e.shiftKey?'redo':'undo';
    if(e.shiftKey)return null;
    return {y:'redo',s:'save',e:'export',o:'open','0':'fit'}[key]||null;
  }
  if(e.shiftKey)return null;
  if(key===' '||e.code==='Space')return 'replay';
  return {'[':'smaller',']':'larger'}[key]||null;
}
export function previewDelay(ms,signal){
  return new Promise((resolve,reject)=>{
    const abort=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);reject(Error('Replay stopped.'));};
    const timer=setTimeout(()=>{signal?.removeEventListener('abort',abort);resolve();},ms);
    if(signal?.aborted)abort();else signal?.addEventListener('abort',abort,{once:true});
  });
}
