import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  documentId, 
  runTransaction 
} from 'firebase/firestore';
import { db } from './firebaseAuth';
import { PaperStats, PaperRatingDoc } from '../types';

const LOCAL_STATS_KEY = 'collabx_paper_stats_cache_v1';
const LOCAL_RATINGS_KEY = 'collabx_user_ratings_cache_v1';

/**
 * Helper to generate a deterministic, Firestore-safe document ID for papers.
 * Firestore document IDs cannot contain forward slashes ('/'), so slashes in DOIs
 * are sanitized to underscores.
 */
export function getPaperId(paper: { doi?: string; id?: string; source?: string }): string {
  if (paper.doi && paper.doi.trim()) {
    const cleanDoi = paper.doi
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\/doi\.org\//i, '')
      .replace(/^doi:\s*/i, '')
      .replace(/[\/\s#?\[\]]/g, '_');
    return `doi:${cleanDoi}`;
  }

  const rawSource = (paper.source || 'collabx')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gi, '_');
  const rawId = (paper.id || 'unknown')
    .replace(/[\/\s#?\[\]]/g, '_');

  return `${rawSource}:${rawId}`;
}

// Local cache helpers
function getLocalStats(): Record<string, PaperStats> {
  try {
    const saved = localStorage.getItem(LOCAL_STATS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveLocalStats(stats: Record<string, PaperStats>) {
  try {
    localStorage.setItem(LOCAL_STATS_KEY, JSON.stringify(stats));
  } catch {
    // Ignore storage quota errors
  }
}

function getLocalRatings(): Record<string, number> {
  try {
    const saved = localStorage.getItem(LOCAL_RATINGS_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function saveLocalRatings(ratings: Record<string, number>) {
  try {
    localStorage.setItem(LOCAL_RATINGS_KEY, JSON.stringify(ratings));
  } catch {
    // Ignore storage quota errors
  }
}

export const RatingService = {
  getPaperId,

  /**
   * Batched retrieval of paper statistics for multiple papers in groups of up to 30.
   * Prevents N+1 queries to Firestore and keeps search views fast.
   */
  async batchGetPaperStats(paperIds: string[]): Promise<Record<string, PaperStats>> {
    const validIds = Array.from(new Set(paperIds.filter(id => Boolean(id && id.trim()))));
    if (validIds.length === 0) {
      return {};
    }

    const resultMap: Record<string, PaperStats> = { ...getLocalStats() };

    // If Firestore is available, perform batched queries
    if (db) {
      try {
        const chunkSize = 30; // Firestore 'in' operator limit
        const chunks: string[][] = [];
        for (let i = 0; i < validIds.length; i += chunkSize) {
          chunks.push(validIds.slice(i, i + chunkSize));
        }

        const colRef = collection(db, 'paperStats');
        const queryPromises = chunks.map(chunk => 
          getDocs(query(colRef, where(documentId(), 'in', chunk)))
        );

        const snapshots = await Promise.all(queryPromises);
        snapshots.forEach(snapshot => {
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            const ratingCount = Number(data.ratingCount) || 0;
            const ratingSum = Number(data.ratingSum) || 0;
            const average = ratingCount > 0 ? (Math.round((ratingSum / ratingCount) * 10) / 10) : 0;

            resultMap[docSnap.id] = {
              paperId: docSnap.id,
              ratingSum,
              ratingCount,
              average,
              updatedAt: data.updatedAt
            };
          });
        });

        // Save fresh stats to local cache
        saveLocalStats(resultMap);
      } catch (err) {
        // Fall back gracefully to local cache on transient network/permission issue
      }
    }

    return resultMap;
  },

  /**
   * Retrieve the current user's rating for a specific paper (1-5 or null)
   */
  async getUserRating(paperId: string, userId: string): Promise<number | null> {
    if (!paperId || !userId) return null;

    const ratingKey = `${paperId}_${userId}`;
    const localRatings = getLocalRatings();

    if (db) {
      try {
        const ratingDocRef = doc(db, 'ratings', ratingKey);
        const snap = await getDoc(ratingDocRef);
        if (snap.exists()) {
          const val = Number(snap.data()?.rating);
          if (val >= 1 && val <= 5) {
            localRatings[ratingKey] = val;
            saveLocalRatings(localRatings);
            return val;
          }
        }
      } catch {
        // Fall back to local rating
      }
    }

    return localRatings[ratingKey] || null;
  },

  /**
   * Submit or update a user's rating in a Firestore transaction.
   * Atomically updates both the user's rating doc and the aggregate paperStats doc.
   */
  async submitRating(
    paperId: string, 
    userId: string, 
    rating: number
  ): Promise<PaperStats> {
    const cleanRating = Math.max(1, Math.min(5, Math.round(rating)));
    const ratingDocId = `${paperId}_${userId}`;
    const now = new Date().toISOString();

    let updatedStats: PaperStats = {
      paperId,
      ratingSum: cleanRating,
      ratingCount: 1,
      average: cleanRating,
      updatedAt: now
    };

    if (db) {
      try {
        const ratingRef = doc(db, 'ratings', ratingDocId);
        const statsRef = doc(db, 'paperStats', paperId);

        await runTransaction(db, async (transaction) => {
          const ratingSnap = await transaction.get(ratingRef);
          const statsSnap = await transaction.get(statsRef);

          let previousRating = 0;
          let ratingCreatedAt = now;

          if (ratingSnap.exists()) {
            previousRating = Number(ratingSnap.data().rating) || 0;
            ratingCreatedAt = ratingSnap.data().createdAt || now;
          }

          let currentSum = 0;
          let currentCount = 0;

          if (statsSnap.exists()) {
            const statsData = statsSnap.data();
            currentSum = Number(statsData.ratingSum) || 0;
            currentCount = Number(statsData.ratingCount) || 0;
          }

          let newSum: number;
          let newCount: number;

          if (previousRating > 0) {
            // User updating their existing rating
            newSum = currentSum - previousRating + cleanRating;
            newCount = Math.max(1, currentCount);
          } else {
            // New rating from this user
            newSum = currentSum + cleanRating;
            newCount = currentCount + 1;
          }

          const newAverage = newCount > 0 ? (Math.round((newSum / newCount) * 10) / 10) : 0;

          const newRatingDoc: PaperRatingDoc = {
            id: ratingDocId,
            paperId,
            userId,
            rating: cleanRating,
            createdAt: ratingCreatedAt,
            updatedAt: now
          };

          updatedStats = {
            paperId,
            ratingSum: newSum,
            ratingCount: newCount,
            average: newAverage,
            updatedAt: now
          };

          transaction.set(ratingRef, newRatingDoc);
          transaction.set(statsRef, {
            ratingSum: newSum,
            ratingCount: newCount,
            average: newAverage,
            paperId,
            updatedAt: now
          });
        });
      } catch (err) {
        // Local calculation fallback if Firestore fails
        const currentLocalStats = getLocalStats()[paperId] || { paperId, ratingSum: 0, ratingCount: 0, average: 0 };
        const localRatings = getLocalRatings();
        const prevRating = localRatings[ratingDocId] || 0;

        let newSum = currentLocalStats.ratingSum;
        let newCount = currentLocalStats.ratingCount;

        if (prevRating > 0) {
          newSum = newSum - prevRating + cleanRating;
        } else {
          newSum = newSum + cleanRating;
          newCount += 1;
        }

        const newAverage = newCount > 0 ? (Math.round((newSum / newCount) * 10) / 10) : 0;
        updatedStats = {
          paperId,
          ratingSum: newSum,
          ratingCount: newCount,
          average: newAverage,
          updatedAt: now
        };
      }
    } else {
      // Local calculation when db is unconfigured
      const currentLocalStats = getLocalStats()[paperId] || { paperId, ratingSum: 0, ratingCount: 0, average: 0 };
      const localRatings = getLocalRatings();
      const prevRating = localRatings[ratingDocId] || 0;

      let newSum = currentLocalStats.ratingSum;
      let newCount = currentLocalStats.ratingCount;

      if (prevRating > 0) {
        newSum = newSum - prevRating + cleanRating;
      } else {
        newSum = newSum + cleanRating;
        newCount += 1;
      }

      const newAverage = newCount > 0 ? (Math.round((newSum / newCount) * 10) / 10) : 0;
      updatedStats = {
        paperId,
        ratingSum: newSum,
        ratingCount: newCount,
        average: newAverage,
        updatedAt: now
      };
    }

    // Persist to local caches
    const allStats = getLocalStats();
    allStats[paperId] = updatedStats;
    saveLocalStats(allStats);

    const allRatings = getLocalRatings();
    allRatings[ratingDocId] = cleanRating;
    saveLocalRatings(allRatings);

    return updatedStats;
  }
};
