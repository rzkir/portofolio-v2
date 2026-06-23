export interface WakatimeUser {
  lastProject: string;
  lastBranch: string;
  lastLanguage: string;
  lastEditor: string;
  photo: string;
  profileUrl: string;
  timezone: string;
}

export interface WakatimeDuration {
  totalSeconds: number;
  text: string;
  digital?: string;
  isUpToDate?: boolean;
  cachedAt?: string;
  dailyAverage?: number | string;
}

export interface WakatimeBestDay {
  date: string;
  text: string;
  totalSeconds: number;
}

export interface WakatimeLanguage {
  name: string;
  totalSeconds: number;
  percent: number;
  text: string;
}

export interface WakatimeProject {
  name: string;
  totalSeconds: number;
  percent: number;
  text: string;
}

export interface WakatimeLast7Days {
  totalText: string;
  totalSeconds: number;
  dailyAverage: string;
  bestDay: WakatimeBestDay;
  languages: WakatimeLanguage[];
  projects: WakatimeProject[];
}

export interface WakatimeTopItem {
  name: string;
  text: string;
  percent: number;
}

export interface WakatimeAiAgent {
  name: string;
  lines: number;
}

export interface WakatimeInsights {
  daysCoded: number;
  dailyAverage: string;
  bestDay: WakatimeBestDay;
  aiAdditions: number;
  aiDeletions: number;
  humanAdditions: number;
  humanDeletions: number;
  aiSessions: number;
  aiAgentTotalCost: number;
  aiAgents: WakatimeAiAgent[];
  topLanguage: WakatimeTopItem;
  topProject: WakatimeTopItem;
}

export interface WakatimeGoal {
  id: string;
  title: string;
  status: string;
}

export interface GithubProfile {
  username: string;
  name: string;
  avatarUrl: string;
  profileUrl: string;
  bio: string | null;
  publicRepos: number;
  followers: number;
  following: number;
  totalCommits: number;
}

export interface GithubRepo {
  name: string;
  fullName: string;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  totalCommits: number;
  pushedAt: string;
  isPrivate: boolean;
}

export interface ContributionDay {
  date: string;
  count: number;
  color: string;
}

export interface ContributionYearGraph {
  totalContributions: number;
  colors: string[];
  weeks: ContributionDay[][];
}

export interface ContributionGraph {
  years: number[];
  defaultView: string;
  lastYear: ContributionYearGraph;
  byYear: Record<string, ContributionYearGraph>;
  restrictedContributionsCount?: number;
  note?: string;
}

export interface CommitsMeta {
  total: number;
  totalAllTime: number;
  privateRepoCount: number;
  tokenHint?: string;
  message: string;
}

export interface GithubStatsResponse {
  user: WakatimeUser;
  today: WakatimeDuration;
  allTimeSinceToday: WakatimeDuration;
  last7Days: WakatimeLast7Days;
  insights: WakatimeInsights;
  dailyActivity: WakatimeDuration[];
  goals: WakatimeGoal[];
  fetchedAt: string;
  github: GithubProfile;
  recentCommits: unknown[];
  recentRepos: GithubRepo[];
  commitsByRepo: GithubRepo[];
  contributionGraph: ContributionGraph;
  commitsMeta: CommitsMeta;
}
