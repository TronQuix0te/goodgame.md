import Anthropic from '@anthropic-ai/sdk';
import { seasonModel, buildModel } from '../db/models';
import { config } from '../config';

const client = new Anthropic({ apiKey: config.anthropic.apiKey });

// Cache the latest release to avoid redundant season checks
let cachedRelease: string | null = null;

/**
 * Polls the Anthropic API for the latest model release.
 * Returns the model ID of the newest non-haiku model, or falls back to config.
 */
async function fetchLatestRelease(): Promise<string> {
  try {
    const response = await client.models.list({ limit: 20 });
    // Filter to flagship models (opus, sonnet — skip haiku)
    const flagships = response.data.filter(m =>
      m.id.includes('opus') || m.id.includes('sonnet')
    );
    if (flagships.length === 0) return config.anthropic.currentRelease;

    // Find the highest generation number, then prefer opus > sonnet
    const tierRank = (id: string) => id.includes('opus') ? 2 : 1;
    const genVersion = (id: string) => {
      // "claude-opus-4-6" -> 4.6, "claude-sonnet-4-5-20250929" -> 4.5
      const match = id.match(/claude-\w+-(\d+)-?(\d+)?/);
      if (!match) return 0;
      const major = parseInt(match[1]);
      const minor = match[2] && match[2].length <= 2 ? parseInt(match[2]) : 0;
      return major + minor / 10;
    };

    flagships.sort((a, b) => {
      const genDiff = genVersion(b.id) - genVersion(a.id);
      if (genDiff !== 0) return genDiff;
      return tierRank(b.id) - tierRank(a.id);
    });

    return flagships[0].id;
  } catch (err) {
    console.error('Failed to fetch models from Anthropic API:', err);
  }
  return config.anthropic.currentRelease;
}

/**
 * Ensures the active season matches the latest Anthropic release.
 * Called on every build submission — fast path if nothing changed.
 */
export function ensureCurrentSeason(release?: string) {
  const currentRelease = release || cachedRelease || config.anthropic.currentRelease;
  const active = seasonModel.findActive();

  if (!active) {
    const name = modelToSeasonName(currentRelease);
    const id = seasonModel.create(name, currentRelease);
    return seasonModel.findById(id);
  }

  if (active.model_tag === currentRelease) {
    return active;
  }

  // New release — crown champions, end old season, start new one
  buildModel.crownChampions(active.id);
  const name = modelToSeasonName(currentRelease);
  const id = seasonModel.create(name, currentRelease);
  console.log(`New season auto-created: "${name}" (new release: ${currentRelease}, previous: ${active.model_tag})`);
  return seasonModel.findById(id);
}

/**
 * Check for new model releases and update season if needed.
 * Call on startup and periodically.
 */
export async function checkForNewRelease() {
  const latest = await fetchLatestRelease();
  cachedRelease = latest;

  const active = seasonModel.findActive();
  if (active && active.model_tag !== latest) {
    console.log(`New Anthropic release detected: ${latest} (current season: ${active.model_tag})`);
    ensureCurrentSeason(latest);
  } else if (!active) {
    ensureCurrentSeason(latest);
  }
}

/**
 * Start periodic check — runs daily.
 */
export function startReleaseWatcher() {
  // Check on startup
  checkForNewRelease().catch(err => console.error('Release check failed:', err));

  // Check every 24 hours
  setInterval(() => {
    checkForNewRelease().catch(err => console.error('Release check failed:', err));
  }, 24 * 60 * 60 * 1000);
}

function modelToSeasonName(modelId: string): string {
  // "claude-opus-4-6" -> "Opus 4.6 Era"
  // "claude-sonnet-4-5-20250929" -> "Sonnet 4.5 Era"
  const match = modelId.match(/claude-(\w+)-(\d+)-?(\d+)?/);
  if (match) {
    const family = match[1].charAt(0).toUpperCase() + match[1].slice(1);
    const major = match[2];
    const minor = match[3];
    // If minor is a short number (1-2 digits), it's a version. If 8+ digits, it's a date.
    if (minor && minor.length <= 2) {
      return `${family} ${major}.${minor} Era`;
    }
    return `${family} ${major} Era`;
  }
  return `${modelId} Era`;
}
