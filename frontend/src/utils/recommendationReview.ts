export type RecommendationDecisionStatus = 'pending' | 'approved' | 'rejected'

export interface RecommendationReview {
  mealId: string
  status: RecommendationDecisionStatus
  reason?: string
  reviewedAt: string
}

const RECOMMENDATION_REVIEW_STORAGE_KEY = 'campus-bites-recommendation-review'
export const RECOMMENDATION_REVIEW_UPDATED_EVENT = 'campus-bites-recommendation-review-updated'

type RecommendationReviewMap = Record<string, RecommendationReview>

const readRecommendationReviewMap = (): RecommendationReviewMap => {
  try {
    const raw = localStorage.getItem(RECOMMENDATION_REVIEW_STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw) as RecommendationReviewMap
    if (!parsed || typeof parsed !== 'object') return {}
    return parsed
  } catch {
    return {}
  }
}

const writeRecommendationReviewMap = (value: RecommendationReviewMap) => {
  localStorage.setItem(RECOMMENDATION_REVIEW_STORAGE_KEY, JSON.stringify(value))
  window.dispatchEvent(new Event(RECOMMENDATION_REVIEW_UPDATED_EVENT))
}

export const getRecommendationReviews = (): RecommendationReviewMap => {
  return readRecommendationReviewMap()
}

export const saveRecommendationDecision = (
  mealId: string,
  status: RecommendationDecisionStatus,
  reason = '',
) => {
  const map = readRecommendationReviewMap()
  map[mealId] = {
    mealId,
    status,
    reason: reason.trim(),
    reviewedAt: new Date().toISOString(),
  }
  writeRecommendationReviewMap(map)
}

export const saveRecommendationDecisionsBulk = (entries: RecommendationReview[]) => {
  const map = readRecommendationReviewMap()
  entries.forEach((entry) => {
    map[entry.mealId] = {
      ...entry,
      reason: entry.reason?.trim() || '',
      reviewedAt: entry.reviewedAt || new Date().toISOString(),
    }
  })
  writeRecommendationReviewMap(map)
}
