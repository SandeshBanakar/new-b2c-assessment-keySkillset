// XP level thresholds and helpers — domain-rules.md § 7

const LEVEL_THRESHOLDS: { min: number; name: string }[] = [
  { min: 0,    name: 'Beginner'  },
  { min: 100,  name: 'Explorer'  },
  { min: 300,  name: 'Learner'   },
  { min: 600,  name: 'Scholar'   },
  { min: 1000, name: 'Achiever'  },
  { min: 2000, name: 'Expert'    },
  { min: 5000, name: 'Master'    },
];

export function getLevelName(xp: number): string {
  const level = [...LEVEL_THRESHOLDS].reverse().find((l) => xp >= l.min);
  return level?.name ?? 'Beginner';
}

export function getLevelNumber(xp: number): number {
  return LEVEL_THRESHOLDS.filter((l) => xp >= l.min).length;
}

export function getXPForNextLevel(xp: number): number {
  const next = LEVEL_THRESHOLDS.find((l) => l.min > xp);
  return next?.min ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1].min;
}

export function getXPAtCurrentLevel(xp: number): number {
  const current = [...LEVEL_THRESHOLDS].reverse().find((l) => xp >= l.min);
  return current?.min ?? 0;
}
