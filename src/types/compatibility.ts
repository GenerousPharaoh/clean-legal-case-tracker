// This file provides compatibility between Case and Project terminology
// The app sometimes uses "Case" and other times "Project" to refer to the same thing

import { Case } from '../store/projectStore';

// Re-export Project as an alias for Case
export type Project = Case;

// Converter functions for clarity
export function caseToProject(caseObj: Case): Project {
  return { ...caseObj };
}

export function projectToCase(project: Project): Case {
  return { ...project };
}

// Helper function to check if an object is a Case/Project
export function isCaseOrProject(obj: any): obj is Case | Project {
  return (
    obj &&
    typeof obj === 'object' &&
    'id' in obj &&
    'owner_id' in obj &&
    'name' in obj &&
    'created_at' in obj
  );
}

// Warning about terminology confusion
if (process.env.NODE_ENV === 'development') {
  console.warn(
    '[Types] The app uses both "Case" and "Project" terminology for the same concept. ' +
    'We should standardize on one term in future updates.'
  );
}

export default {
  caseToProject,
  projectToCase,
  isCaseOrProject
};
