import {NextRequest,NextResponse} from 'next/server';
/** Entering the sign-in page starts a fresh local Academy login, including an installed PWA. */
export function middleware(_request:NextRequest){const response=NextResponse.next();for(const name of ['kcs_academy_session','kcs_academy_nexus_return'])response.cookies.set(name,'',{httpOnly:name==='kcs_academy_session',secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/',maxAge:0});response.headers.set('Cache-Control','private, no-store');return response}
export const config={matcher:['/login']};
