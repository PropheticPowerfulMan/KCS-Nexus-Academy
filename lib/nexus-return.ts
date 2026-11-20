const nexusOrigin='https://kinshasachristianschool.org'
export function safeNexusReturn(value:unknown):string|null{
 if(typeof value!=='string'||value.length>1000||!value.startsWith('/')||value.startsWith('//')||/[\\\r\n]/.test(value))return null
 try{const url=new URL(value,nexusOrigin);return url.origin===nexusOrigin&&/^\/(?:admin|portal\/(?:teacher|staff|senior|student|parent))(?:\/|$)/.test(url.pathname)&&!url.search&&!url.hash?url.pathname:null}catch{return null}
}
export function defaultNexusReturn(role:string){return ['admin','super_admin','administrator','principal'].includes(role.toLowerCase())?'/admin':['student','parent','staff'].includes(role.toLowerCase())?'/portal/'+role.toLowerCase():'/portal/teacher'}
export const nexusReturnUrl=(value:unknown,role:string)=>nexusOrigin+(safeNexusReturn(value)||defaultNexusReturn(role))
