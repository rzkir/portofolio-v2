import { fetchGithubStats } from "@/utils/FetchGithubStats";

function formatMonthYear(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
  }).format(date);
}

function formatShortDate(dateStr: string): string {
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateStr;

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(date);
}

function formatPushedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatFetchedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Update · —";

  return new Intl.DateTimeFormat("en-US", {
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

function getHeatmapRangeLabels(weeks: ContributionDay[][]): {
  start: string;
  end: string;
} {
  const firstWeek = weeks[0];
  const lastWeek = weeks[weeks.length - 1];
  const firstDay = firstWeek?.find((day) => day.date)?.date ?? "";
  const lastDay = [...(lastWeek ?? [])].reverse().find((day) => day.date)?.date ?? "";

  return {
    start: firstDay ? formatMonthYear(firstDay) : "—",
    end: lastDay ? formatMonthYear(lastDay) : "—",
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

function mapSummaryStats(data: GithubStatsResponse): CodingStatItem[] {
  const { github, contributionGraph, last7Days, insights } = data;

  return [
    {
      label: "Repositori",
      value: String(github.publicRepos),
      sub: "publik",
    },
    {
      label: "Kontribusi",
      value: String(contributionGraph.lastYear.totalContributions),
      sub: "12 bulan",
    },
    {
      label: "Total Commits",
      value: String(github.totalCommits),
      sub: "all time",
    },
    {
      label: "Coding 7 Hari",
      value: last7Days.totalText,
      sub: `${insights.daysCoded} hari aktif`,
    },
  ];
}

function mapSecondaryStats(data: GithubStatsResponse): CodingStatItem[] {
  const { github, insights, allTimeSinceToday } = data;

  return [
    {
      label: "Followers",
      value: String(github.followers),
      sub: "GitHub",
    },
    {
      label: "Following",
      value: String(github.following),
      sub: "GitHub",
    },
    {
      label: "Rata-rata All Time",
      value:
        typeof allTimeSinceToday.dailyAverage === "number"
          ? `${Math.round(allTimeSinceToday.dailyAverage / 3600)} jam`
          : String(allTimeSinceToday.dailyAverage ?? "—"),
      sub: "WakaTime",
    },
    {
      label: "AI Sessions",
      value: String(insights.aiSessions),
      sub: `$${insights.aiAgentTotalCost.toFixed(2)} cost`,
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

function mapStreaks(data: GithubStatsResponse): StreakStat[] {
  const { insights } = data;

  return [
    {
      label: "Rata-rata harian",
      value: insights.dailyAverage,
      desc: "7 hari terakhir · WakaTime",
    },
    {
      label: "Hari terbaik",
      value: insights.bestDay.text,
      desc: formatShortDate(insights.bestDay.date),
    },
  ];
}

function mapActivityStats(data: GithubStatsResponse): ActivityStat[] {
  return [
    { label: "Hari ini", value: data.today.text },
    { label: "7 Hari", value: data.last7Days.totalText },
    { label: "All Time", value: data.allTimeSinceToday.text },
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

function mapDailyActivity(data: GithubStatsResponse): DailyActivityView[] {
  return data.dailyActivity.map((day, index) => ({
    text: day.text,
    label: `Hari ${index + 1}`,
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

function mapRepo(repo: GithubStatsResponse["recentRepos"][number]): RepoView {
  return {
    name: repo.name,
    url: repo.url,
    language: repo.language,
    stars: repo.stars,
    forks: repo.forks,
    totalCommits: repo.totalCommits,
    pushedLabel: formatPushedAt(repo.pushedAt),
    isPrivate: repo.isPrivate,
  };
}

function mapGoals(data: GithubStatsResponse): GoalView[] {
  return data.goals.map((goal) => ({
    title: goal.title,
    status: goal.status,
  }));
}

function mapTrophies(data: GithubStatsResponse): string[] {
  const trophies = new Set<string>();

  for (const goal of data.goals) {
    if (goal.status === "success") trophies.add(goal.title);
  }

  if (data.insights.topLanguage.name) {
    trophies.add(`Top · ${data.insights.topLanguage.name}`);
  }

  if (data.insights.topProject.name) {
    trophies.add(`Projek · ${data.insights.topProject.name}`);
  }

  for (const agent of data.insights.aiAgents) {
    trophies.add(`${agent.name} · ${agent.lines} lines`);
  }

  return [...trophies];
}

function mapGithubStats(data: GithubStatsResponse): CodingStatsView {
  const { weeks } = data.contributionGraph.lastYear;
  const range = getHeatmapRangeLabels(weeks);

  return {
    updatedLabel: formatFetchedAt(data.fetchedAt),
    profile: mapProfile(data),
    summaryStats: mapSummaryStats(data),
    secondaryStats: mapSecondaryStats(data),
    heatmapCells: flattenContributionWeeks(weeks),
    heatmapWeekCount: weeks.length,
    heatmapColors: data.contributionGraph.lastYear.colors,
    heatmapStartLabel: range.start,
    heatmapEndLabel: range.end,
    heatmapNote: data.contributionGraph.note,
    streaks: mapStreaks(data),
    languages: mapLanguages(data),
    projects: mapProjects(data),
    activityStats: mapActivityStats(data),
    aiStats: mapAiStats(data),
    dailyActivity: mapDailyActivity(data),
    yearContributions: mapYearContributions(data),
    commitsMetaMessage: data.commitsMeta.message,
    privateRepoCount: data.commitsMeta.privateRepoCount,
    recentRepos: data.recentRepos.map(mapRepo),
    commitsByRepo: data.commitsByRepo.map(mapRepo),
    goals: mapGoals(data),
    trophies: mapTrophies(data),
  };
}

/** Metrik coding dari GitHub + WakaTime — di-fetch saat SSR/build. */
export async function getCodingStatsView(): Promise<CodingStatsView> {
  const data = await fetchGithubStats();
  return mapGithubStats(data);
}
