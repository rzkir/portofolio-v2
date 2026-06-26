import { DEFAULT_LOCALE, getMessages, type Locale } from "@/lib/i18n";
import { fetchGithubStats } from "@/utils/FetchGithubStats";

type CodingStatsMessages = ReturnType<typeof getMessages>["codingStats"];

function localeTag(locale: Locale): string {
  return locale === "id" ? "id-ID" : "en-US";
}

function fill(
  template: string,
  vars: Record<string, string | number>,
): string {
  return Object.entries(vars).reduce(
    (text, [name, replacement]) =>
      text.replaceAll(`{${name}}`, String(replacement)),
    template,
  );
}

function formatMonthYear(dateStr: string, locale: Locale): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat(localeTag(locale), {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDate(dateStr: string, locale: Locale): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat(localeTag(locale), {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatPushedAt(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat(localeTag(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFetchedAt(iso: string, locale: Locale, fallback: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return fallback;

  return new Intl.DateTimeFormat(localeTag(locale), {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function flattenContributionWeeks(weeks: ContributionDay[][]): HeatmapCell[] {
  const cells: HeatmapCell[] = [];

  for (let day = 0; day < 7; day++) {
    for (const week of weeks) {
      cells.push(
        week[day] ?? {
          date: "",
          count: 0,
          color: "#ebedf0",
        },
      );
    }
  }

  return cells;
}

function getHeatmapRangeLabels(
  weeks: ContributionDay[][],
  locale: Locale,
): {
  start: string;
  end: string;
} {
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];
  const firstDay = firstWeek?.find((day) => day.date)?.date ?? "";
  const lastDay = [...(lastWeek ?? [])].reverse().find((day) => day.date)?.date ?? "";

  return {
    start: firstDay ? formatMonthYear(firstDay, locale) : "—",
    end: lastDay ? formatMonthYear(lastDay, locale) : "—",
  };
}

function mapProfile(data: GithubStatsResponse): ProfileView {
  const { github, user } = data;

  return {
    name: github.name,
    username: github.username,
    avatarUrl: github.avatarUrl,
    profileUrl: github.profileUrl,
    followers: github.followers,
    following: github.following,
    wakatimePhoto: user.photo,
    wakatimeProfileUrl: user.profileUrl,
    lastProject: user.lastProject,
    lastBranch: user.lastBranch,
    lastLanguage: user.lastLanguage,
    lastEditor: user.lastEditor,
    timezone: user.timezone,
  };
}

function mapSummaryStats(
  data: GithubStatsResponse,
  cs: CodingStatsMessages,
): CodingStatItem[] {
  const { github, contributionGraph, last7Days, insights } = data;

  return [
    {
      label: cs.summaryRepos,
      value: String(github.publicRepos),
      sub: cs.summaryReposSub,
    },
    {
      label: cs.summaryContributions,
      value: String(contributionGraph.lastYear.totalContributions),
      sub: cs.summaryContributionsSub,
    },
    {
      label: cs.summaryCommits,
      value: String(github.totalCommits),
      sub: cs.summaryCommitsSub,
    },
    {
      label: cs.summaryCoding7d,
      value: last7Days.totalText,
      sub: fill(cs.summaryCoding7dSub, { days: insights.daysCoded }),
    },
  ];
}

function mapSecondaryStats(
  data: GithubStatsResponse,
  cs: CodingStatsMessages,
): CodingStatItem[] {
  const { github, insights, allTimeSinceToday } = data;

  return [
    {
      label: cs.secondaryFollowers,
      value: String(github.followers),
      sub: cs.secondaryFollowersSub,
    },
    {
      label: cs.secondaryFollowing,
      value: String(github.following),
      sub: cs.secondaryFollowingSub,
    },
    {
      label: cs.secondaryDailyAvg,
      value:
        typeof allTimeSinceToday.dailyAverage === "number"
          ? `${Math.round(allTimeSinceToday.dailyAverage / 3600)} ${cs.secondaryDailyAvgSuffix}`
          : String(allTimeSinceToday.dailyAverage ?? "—"),
      sub: cs.secondaryDailyAvgSub,
    },
    {
      label: cs.secondaryAiSessions,
      value: String(insights.aiSessions),
      sub: fill(cs.secondaryAiSessionsSub, {
        cost: `$${insights.aiAgentTotalCost.toFixed(2)}`,
      }),
    },
  ];
}

function mapLanguages(data: GithubStatsResponse): LanguageStat[] {
  return data.last7Days.languages
    .filter((lang) => lang.percent > 0)
    .map((lang) => ({
      name: lang.name,
      pct: Math.round(lang.percent * 10) / 10,
      text: lang.text,
    }));
}

function mapProjects(data: GithubStatsResponse): ProjectStat[] {
  return data.last7Days.projects
    .filter((project) => project.percent > 0)
    .map((project) => ({
      name: project.name,
      pct: Math.round(project.percent * 10) / 10,
      text: project.text,
    }));
}

function mapStreaks(
  data: GithubStatsResponse,
  cs: CodingStatsMessages,
  locale: Locale,
): StreakStat[] {
  const { insights } = data;

  return [
    {
      label: cs.streakDailyAvg,
      value: insights.dailyAverage,
      desc: cs.streakDailyAvgDesc,
    },
    {
      label: cs.streakBestDay,
      value: insights.bestDay.text,
      desc: formatShortDate(insights.bestDay.date, locale),
    },
  ];
}

function mapActivityStats(
  data: GithubStatsResponse,
  cs: CodingStatsMessages,
): ActivityStat[] {
  return [
    { label: cs.activityToday, value: data.today.text },
    { label: cs.activity7d, value: data.last7Days.totalText },
    { label: cs.activityAllTime, value: data.allTimeSinceToday.text },
  ];
}

function mapAiStats(data: GithubStatsResponse): AiStatItem[] {
  const { insights } = data;

  return [
    { label: "AI Additions", value: insights.aiAdditions.toLocaleString("en-US") },
    { label: "AI Deletions", value: insights.aiDeletions.toLocaleString("en-US") },
    {
      label: "Human Additions",
      value: insights.humanAdditions.toLocaleString("en-US"),
    },
    {
      label: "Human Deletions",
      value: insights.humanDeletions.toLocaleString("en-US"),
    },
    { label: "AI Sessions", value: String(insights.aiSessions) },
    {
      label: "AI Cost",
      value: `$${insights.aiAgentTotalCost.toFixed(3)}`,
    },
  ];
}

function mapDailyActivity(
  data: GithubStatsResponse,
  cs: CodingStatsMessages,
): DailyActivityView[] {
  return data.dailyActivity.map((day, index) => ({
    text: day.text,
    label: fill(cs.dayLabel, { n: index + 1 }),
  }));
}

function mapYearContributions(data: GithubStatsResponse): YearContributionStat[] {
  return data.contributionGraph.years
    .map((year) => ({
      year,
      total: data.contributionGraph.byYear[String(year)]?.totalContributions ?? 0,
    }))
    .sort((a, b) => b.year - a.year);
}

function mapRepo(
  repo: GithubStatsResponse["recentRepos"][number],
  locale: Locale,
): RepoView {
  return {
    name: repo.name,
    url: repo.url,
    language: repo.language,
    stars: repo.stars,
    forks: repo.forks,
    totalCommits: repo.totalCommits,
    pushedLabel: formatPushedAt(repo.pushedAt, locale),
    isPrivate: repo.isPrivate,
  };
}

function mapGoals(data: GithubStatsResponse): GoalView[] {
  return data.goals.map((goal) => ({
    title: goal.title,
    status: goal.status,
  }));
}

function mapTrophies(
  data: GithubStatsResponse,
  cs: CodingStatsMessages,
): string[] {
  const trophies = new Set<string>();

  for (const goal of data.goals) {
    if (goal.status === "success") trophies.add(goal.title);
  }

  if (data.insights.topLanguage.name) {
    trophies.add(
      fill(cs.trophyTopLanguage, { name: data.insights.topLanguage.name }),
    );
  }

  if (data.insights.topProject.name) {
    trophies.add(
      fill(cs.trophyTopProject, { name: data.insights.topProject.name }),
    );
  }

  for (const agent of data.insights.aiAgents) {
    trophies.add(
      fill(cs.trophyAiAgent, { name: agent.name, lines: agent.lines }),
    );
  }

  return [...trophies];
}

function mapGithubStats(
  data: GithubStatsResponse,
  locale: Locale,
): CodingStatsView {
  const cs = getMessages(locale).codingStats;
  const { weeks } = data.contributionGraph.lastYear;
  const range = getHeatmapRangeLabels(weeks, locale);

  return {
    updatedLabel: formatFetchedAt(data.fetchedAt, locale, cs.updatedFallback),
    profile: mapProfile(data),
    summaryStats: mapSummaryStats(data, cs),
    secondaryStats: mapSecondaryStats(data, cs),
    heatmapCells: flattenContributionWeeks(weeks),
    heatmapWeekCount: weeks.length,
    heatmapColors: data.contributionGraph.lastYear.colors,
    heatmapStartLabel: range.start,
    heatmapEndLabel: range.end,
    heatmapNote: data.contributionGraph.note,
    streaks: mapStreaks(data, cs, locale),
    languages: mapLanguages(data),
    projects: mapProjects(data),
    activityStats: mapActivityStats(data, cs),
    aiStats: mapAiStats(data),
    dailyActivity: mapDailyActivity(data, cs),
    yearContributions: mapYearContributions(data),
    commitsMetaMessage: data.commitsMeta.message,
    privateRepoCount: data.commitsMeta.privateRepoCount,
    recentRepos: data.recentRepos.map((repo) => mapRepo(repo, locale)),
    commitsByRepo: data.commitsByRepo.map((repo) => mapRepo(repo, locale)),
    goals: mapGoals(data),
    trophies: mapTrophies(data, cs),
  };
}

/** Metrik coding dari GitHub + WakaTime — di-fetch saat SSR/build. */
export async function getCodingStatsView(
  locale: Locale = DEFAULT_LOCALE,
): Promise<CodingStatsView> {
  const data = await fetchGithubStats();
  return mapGithubStats(data, locale);
}
