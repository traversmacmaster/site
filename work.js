import { products } from './data/products.js?v=recursive-symbol-2026-10-11';
import { examples } from './examples.js?v=reckd-2026-10-11';

const withoutToolLabels=p=>{
  const clean=label=>label.startsWith(p.name+' — ')?label.slice(p.name.length+3):label;
  return {...p, video:p.video?{...p.video,label:clean(p.video.label)}:undefined, videos:p.videos?.map(v=>({...v,label:clean(v.label)}))};
};
document.querySelector('#tunnelfield-work').innerHTML=products.filter(p=>p.video||p.videos?.length||p.examples?.length).map(p=>examples(withoutToolLabels(p),'../',{showAttribution:false})).join('');
