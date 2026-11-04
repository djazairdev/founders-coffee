import { getProjectPage, type ProjectPage } from '@founders-coffee/server-fns';

export const projectsApi = {
  page: (slug: string) => getProjectPage({ data: { slug } }),
};

export type { ProjectPage };
