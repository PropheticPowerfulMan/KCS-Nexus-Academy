"use client";
import {useEffect,useRef} from "react";
import {translateInterface} from "@/lib/interface-language";
type Translation={source:string;rendered:string};
const ignored="script,style,textarea,svg,[data-no-translate]";
export function useInterfaceLanguage(language:"en"|"fr"){
  const texts=useRef(new WeakMap<Node,Translation>());
  const attributes=useRef(new WeakMap<Element,Map<string,Translation>>());
  useEffect(()=>{
    let frame=0;
    const pending=new Set<Node>();
    const translate=(value:string)=>language==="en"?translateInterface(value):value;
    const applyText=(node:Node)=>{
      if(!node.parentElement||node.parentElement.closest(ignored))return;
      const current=node.nodeValue??"",previous=texts.current.get(node);
      const source=previous&&current===previous.rendered?previous.source:current;
      const rendered=translate(source);texts.current.set(node,{source,rendered});
      if(current!==rendered)node.nodeValue=rendered;
    };
    const applyAttributes=(el:Element)=>{
      if(el.closest(ignored))return;
      const states=attributes.current.get(el)??new Map<string,Translation>();
      for(const name of ["placeholder","title","aria-label"]){
        const current=el.getAttribute(name);if(current===null)continue;
        const previous=states.get(name),source=previous&&current===previous.rendered?previous.source:current;
        const rendered=translate(source);states.set(name,{source,rendered});
        if(current!==rendered)el.setAttribute(name,rendered);
      }
      attributes.current.set(el,states);
    };
    const apply=(root:Node)=>{
      if(root.nodeType===Node.TEXT_NODE){applyText(root);return;}
      if(!(root instanceof Element)||root.closest(ignored))return;
      applyAttributes(root);
      root.querySelectorAll("[placeholder],[title],[aria-label]").forEach(applyAttributes);
      const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let node:Node|null;
      while((node=walker.nextNode()))applyText(node);
    };
    const observer=new MutationObserver(records=>{
      for(const record of records){
        if(record.type==="childList")record.addedNodes.forEach(node=>pending.add(node));
        else pending.add(record.target);
      }
      if(!frame)frame=requestAnimationFrame(()=>{
        frame=0;observer.disconnect();
        for(const node of pending)if(node.isConnected)apply(node);
        pending.clear();observe();
      });
    });
    const observe=()=>observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:["placeholder","title","aria-label"]});
    apply(document.body);observe();
    return()=>{observer.disconnect();if(frame)cancelAnimationFrame(frame);pending.clear();};
  },[language]);
}
