'use client';
import {AccessNotice} from '@/components/access-notice';
export default function ErrorPage({reset}:{reset:()=>void}){return <AccessNotice retry={reset}/>}
