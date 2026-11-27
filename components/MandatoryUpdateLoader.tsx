"use client";
import{useEffect}from'react';
export default function MandatoryUpdateLoader(){useEffect(()=>{const scope='/',app='KCS_ACADEMY';const script=document.createElement('script');script.defer=true;script.src=scope+'kcs-update.js?v='+process.env.NEXT_PUBLIC_KCS_CLIENT_VERSION;script.dataset.kcsUpdateApp=app;script.dataset.kcsUpdateScope=scope;script.dataset.kcsUpdateVersion=process.env.NEXT_PUBLIC_KCS_CLIENT_VERSION;document.body.append(script);return()=>script.remove()},[]);return null}
