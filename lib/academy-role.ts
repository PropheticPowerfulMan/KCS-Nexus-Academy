export type AcademicWorkspace='superadmin'|'principal'|'senior'|'teacher'|'student'
const scopes={superadmin:{role:'SUPER_ADMIN',path:'/admin'},principal:{role:'ADMIN',path:'/admin'},senior:{role:'ADMIN',path:'/portal/senior'},teacher:{role:'TEACHER',path:'/portal/teacher'},student:{role:'STUDENT',path:'/portal/student'}} as const
export function applyAcademyAccess<T extends {role:string}>(identity:T,access:unknown){
 if(!access||typeof access!=='object')return null
 const value=access as {workspace?:unknown;role?:unknown};if(typeof value.workspace!=='string'||!Object.prototype.hasOwnProperty.call(scopes,value.workspace))return null
 const workspace=value.workspace as AcademicWorkspace,scope=scopes[workspace];if(scope.role!==value.role)return null
 return {...identity,role:scope.role,nexusWorkspace:workspace,nexusReturnPath:scope.path}
}
