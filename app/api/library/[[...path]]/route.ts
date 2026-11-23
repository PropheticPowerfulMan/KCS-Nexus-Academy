import {cookies} from 'next/headers';
import {NextRequest,NextResponse} from 'next/server';
import {ACADEMY_COOKIE,validateAcademySession} from '@/lib/academy-auth';
export const dynamic='force-dynamic';
const noStore={'Cache-Control':'private, no-store'};
async function proxy(request:NextRequest,context:{params:Promise<{path?:string[]}>}){
 try{
  const token=(await cookies()).get(ACADEMY_COOKIE)?.value;
  if(!token||!await validateAcademySession(token))return NextResponse.json({error:'session'},{status:401,headers:noStore});
  const {path=[]}=await context.params,method=request.method;
  if(path.length>2||path[0]&&!/^(pedagogy-book:[0-9a-f-]{36}|reference:[a-z0-9.-]+)$/.test(path[0])||path[1]&&path[1]!=='file')return NextResponse.json({error:'path'},{status:400,headers:noStore});
  if(method!=='GET'&&request.headers.get('origin')!==new URL(process.env.ACADEMY_PUBLIC_URL||request.url).origin)return NextResponse.json({error:'origin'},{status:403,headers:noStore});
  const base=process.env.NEXUS_API_URL,key=process.env.ACADEMY_INTEGRATION_KEY;if(!base||!key)throw new Error('configuration');
  if(method==='POST'&&Number(request.headers.get('content-length')||0)>16*1024*1024)return NextResponse.json({error:'size'},{status:413,headers:noStore});
  const body=method==='POST'?await request.formData():method==='PUT'?await request.text():undefined;
  const r=await fetch(base.replace(/\/$/,'')+'/api/pedagogy/academy/resources'+(path.length?'/'+path.map(encodeURIComponent).join('/'):'') ,{method,headers:{'x-api-key':key,'x-academy-session':token,...(method==='PUT'?{'content-type':'application/json'}:{})},body,cache:'no-store',signal:AbortSignal.timeout(30000)});
  if(path[1]==='file'&&r.ok)return new NextResponse(r.body,{headers:{...noStore,'Content-Type':r.headers.get('content-type')||'application/octet-stream','Content-Disposition':r.headers.get('content-disposition')||'attachment','X-Content-Type-Options':'nosniff'}});
  return NextResponse.json(await r.json(),{status:r.status,headers:noStore});
 }catch{return NextResponse.json({error:'unavailable'},{status:503,headers:noStore});}
}
export const GET=proxy;export const POST=proxy;export const PUT=proxy;
