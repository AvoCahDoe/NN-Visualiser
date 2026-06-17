import { get, set } from 'idb-keyval';
import type { ProjectEntry } from '@/store/networkStore';

const BACKUP_KEY = 'nnviz-projects-backup';

export async function backupProjects(projects: ProjectEntry[]): Promise<void> {
  await set(BACKUP_KEY, projects);
}

export async function loadProjectsBackup(): Promise<ProjectEntry[] | null> {
  const data = await get<ProjectEntry[]>(BACKUP_KEY);
  return data ?? null;
}

export async function clearProjectsBackup(): Promise<void> {
  await set(BACKUP_KEY, []);
}
