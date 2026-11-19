export const ROLES = {
  FRONTEND: 'frontend',
  BACKEND: 'backend',
  FULLSTACK: 'fullstack',
  SOFTWARE_ENGINEER: 'software-engineer',
  AI_ENGINEER: 'ai-engineer',
  ML_ENGINEER: 'ml-engineer',
  DATA_ENGINEER: 'data-engineer',
  CLOUD_ENGINEER: 'cloud-engineer',
  DEVOPS_ENGINEER: 'devops-engineer',
  PRODUCT_ENGINEER: 'product-engineer'
} as const;

export type RoleType = typeof ROLES[keyof typeof ROLES];

export interface JobProfile {
  title: string;
  requiredSkills: string[];
  resources: Record<string, string>;
}

export const JOB_PROFILES: Record<string, JobProfile> = {
  'frontend': {
    title: 'Frontend Engineer',
    requiredSkills: ['React', 'TypeScript', 'CSS/SCSS', 'Vite/Webpack', 'State Management (Redux/Zustand)', 'Jest/Cypress', 'Responsive Design', 'Next.js', 'CI/CD'],
    resources: {
      'React': 'https://react.dev/learn',
      'TypeScript': 'https://www.typescriptlang.org/docs/',
      'Next.js': 'https://nextjs.org/docs',
      'Jest/Cypress': 'https://testing-library.com/docs/react-testing-library/intro/'
    }
  },
  'backend': {
    title: 'Backend Engineer',
    requiredSkills: ['Node.js', 'Express', 'SQL (PostgreSQL/MySQL)', 'NoSQL (MongoDB)', 'Redis', 'Docker', 'API Design (REST/GraphQL)', 'Microservices', 'System Design'],
    resources: {
      'Node.js': 'https://nodejs.org/en/docs/',
      'SQL (PostgreSQL)': 'https://www.postgresql.org/docs/',
      'Docker': 'https://docs.docker.com/get-started/',
      'System Design': 'https://github.com/donnemartin/system-design-primer'
    }
  },
  'fullstack': {
    title: 'Full-Stack Developer',
    requiredSkills: ['React', 'Node.js', 'TypeScript', 'SQL/NoSQL Databases', 'Docker', 'REST/GraphQL APIs', 'AWS/GCP basics', 'Git & CI/CD', 'State Management'],
    resources: {
      'React & Node': 'https://fullstackopen.com/en/',
      'AWS': 'https://aws.amazon.com/developer/learning-paths/',
      'Git & CI/CD': 'https://git-scm.com/doc'
    }
  },
  'ml-engineer': {
    title: 'Machine Learning Engineer',
    requiredSkills: ['Python', 'PyTorch/TensorFlow', 'Scikit-Learn', 'Linear Algebra & Calculus', 'Pandas & NumPy', 'MLOps (MLflow/DVC)', 'SQL', 'Data Engineering (Spark)', 'Model Deployment'],
    resources: {
      'PyTorch': 'https://pytorch.org/tutorials/',
      'Scikit-Learn': 'https://scikit-learn.org/stable/user_guide.html',
      'MLOps': 'https://www.coursera.org/specializations/machine-learning-engineering-for-production-mlops'
    }
  }
};
