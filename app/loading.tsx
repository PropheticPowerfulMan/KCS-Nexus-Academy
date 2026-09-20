import { ShieldCheck } from 'lucide-react';

export default function Loading() {
  return <div className='auth-loading' role='status' aria-live='polite'><span><ShieldCheck /></span></div>;
}
