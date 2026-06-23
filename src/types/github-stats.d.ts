interface WakatimeUser {
  lastProject: string;
  lastBranch: string;
  lastLanguage: string;
  lastEditor: string;
  photo: string;
  profileUrl: string;
  timezone: string;
}

interface WakatimeDuration {
  totalSeconds: number;
  text: string;
  digital?: string;
  isUpToDate?: boolean;
  cachedAt?: string;
  dailyAverage?: number | string;
}

interface WakatimeBestDay {
  date: string;
  text: string;
  totalSeconds: number;
}

interface WakatimeLanguage {
  name: string;
  totalSeconds: number;
  percent: number;
  text: string;
}

interface WakatimeProject {
  name: string;
  totalSeconds: number;
  percent: number;
  text: string;
}

interface WakatimeLast7Days {
  totalText: string;
  totalSeconds: number;
  dailyAverage: string;
  bestDay: WakatimeBestDay;
  languages: WakatimeLanguage[];
  projects: WakatimeProject[];
}

interface WakatimeTopItem {
  name: string;
  text: string;
  percent: number;
}

interface WakatimeAiAgent {
  name: string;
  lines: number;
}

interface WakatimeInsights {
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

interface WakatimeGoal {
  id: string;
  title: string;
  status: string;
}

interface GithubProfile {
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

interface GithubRepo {
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

interface ContributionDay {
  date: string;
  count: number;
  color: string;
}

interface ContributionYearGraph {
  totalContributions: number;
  colors: string[];
  weeks: ContributionDay[][];
}

interface ContributionGraph {
  years: number[];
  defaultView: string;
  lastYear: ContributionYearGraph;
  byYear: Record<string, ContributionYearGraph>;
  restrictedContributionsCount?: number;
  note?: string;
}

interface CommitsMeta {
  total: number;
  totalAllTime: number;
  privateRepoCount: number;
  tokenHint?: string;
  message: string;
}

interface GithubStatsResponse {
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

type CodingStatItem = {
  label: string;
  value: string;
  sub: string;
};

type HeatmapCell = ContributionDay;

type LanguageStat = {
  name: string;
  pct: number;
  text: string;
};

type ProjectStat = {
  name: string;
  pct: number;
  text: string;
};

type StreakStat = {
  label: string;
  value: string;
  desc: string;
};

type ActivityStat = {
  label: string;
  value: string;
};

type ProfileView = {
  name: string;
  username: string;
  avatarUrl: string;
  profileUrl: string;
  followers: number;
  following: number;
  wakatimePhoto: string;
  wakatimeProfileUrl: string;
  lastProject: string;
  lastBranch: string;
  lastLanguage: string;
  lastEditor: string;
  timezone: string;
};

type AiStatItem = {
  label: string;
  value: string;
};

type RepoView = {
  name: string;
  url: string;
  language: string | null;
  stars: number;
  forks: number;
  totalCommits: number;
  pushedLabel: string;
  isPrivate: boolean;
};

type YearContributionStat = {
  year: number;
  total: number;
};

type GoalView = {
  title: string;
  status: string;
};

type DailyActivityView = {
  text: string;
  label: string;
};

type CodingStatsView = {
  updatedLabel: string;
  profile: ProfileView;
  summaryStats: CodingStatItem[];
  secondaryStats: CodingStatItem[];
  heatmapCells: HeatmapCell[];
  heatmapWeekCount: number;
  heatmapColors: string[];
  heatmapStartLabel: string;
  heatmapEndLabel: string;
  heatmapNote?: string;
  streaks: StreakStat[];
  languages: LanguageStat[];
  projects: ProjectStat[];
  activityStats: ActivityStat[];
  aiStats: AiStatItem[];
  dailyActivity: DailyActivityView[];
  yearContributions: YearContributionStat[];
  commitsMetaMessage: string;
  privateRepoCount: number;
  recentRepos: RepoView[];
  commitsByRepo: RepoView[];
  goals: GoalView[];
  trophies: string[];
};