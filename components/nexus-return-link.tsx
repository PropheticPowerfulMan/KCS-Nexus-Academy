'use client'
import {useEffect,useState} from 'react'
import {ArrowLeft} from 'lucide-react'
import {nexusReturnUrl} from '@/lib/nexus-return'
export function NexusReturnLink({language,role,returnPath}:{language:'fr'|'en';role:string;returnPath?:string}){
 const [path,setPath]=useState<string|null>(null)
 useEffect(()=>{const value=document.cookie.split('; ').find(v=>v.startsWith('kcs_academy_nexus_return='))?.split('=').slice(1).join('=');if(value)try{setPath(decodeURIComponent(value))}catch{}},[])
 return <a href={nexusReturnUrl(returnPath||path,role)} data-nexus-return target="_blank" rel="noopener noreferrer" style={{display:'inline-flex',alignItems:'center',justifyContent:'center',gap:7,border:'1px solid #77b4ca',borderRadius:10,padding:'9px 13px',fontSize:12,fontWeight:750,color:'#e9f7ff',background:'#14526d',textDecoration:'none',whiteSpace:'nowrap'}}><ArrowLeft size={15}/>{language==='fr'?'Retour à Nexus AI':'Back to Nexus AI'}</a>
}
