import { DatabaseSync } from 'node:sqlite';
import { copyFileSync, constants, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

// Local operator CLI only. No HTTP route or tenant role grants access here.
export function backupDatabase(source:string,destination:string) {
  if (!existsSync(source) || existsSync(destination) || resolve(source)===resolve(destination)) throw new Error('Use an existing source and a new backup destination.');
  const db=new DatabaseSync(source);
  try { db.prepare('VACUUM INTO ?').run(resolve(destination)); } finally {db.close();}
  verifyDatabase(destination);
}
export function verifyDatabase(path:string) {
  const db=new DatabaseSync(path,{readOnly:true});
  try {
    const check=db.prepare('PRAGMA integrity_check').get() as {integrity_check:string};
    if(check.integrity_check!=='ok')throw new Error('Database integrity check failed.');
    if(db.prepare('PRAGMA foreign_key_check').all().length)throw new Error('Database relationship check failed.');
  }finally{db.close();}
}
export function restoreDatabase(backup:string,destination:string) {
  if (!existsSync(backup) || existsSync(destination))throw new Error('Restore requires a backup and a new isolated destination.');
  verifyDatabase(backup);copyFileSync(backup,destination,constants.COPYFILE_EXCL);
  const db=new DatabaseSync(destination);
  try {db.exec('DELETE FROM sessions');}finally{db.close();}
  verifyDatabase(destination);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [operation,source,destination]=process.argv.slice(2);
  if(!source||!destination||!['backup','restore'].includes(operation))throw new Error('Usage: node server/operations.ts backup|restore SOURCE NEW_DESTINATION');
  if(operation==='backup')backupDatabase(source,destination);else restoreDatabase(source,destination);
  process.stdout.write('Database operation verified. Restores invalidate all existing sessions.\n');
}
