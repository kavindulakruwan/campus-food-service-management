import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock3, Flame, ShoppingBag, Sparkles, Star, Trash2, UtensilsCrossed } from 'lucide-react'
import axios from 'axios'
import { Link, useLocation } from 'react-router-dom'
import {
  createMealReview,
  deleteMyMealReview,
  getMealReviews,
  updateMyMealReview,
  type MealItem,
  type MealReview,
  type MealReviewSummary,
} from '../../api/meals.api'
import useAuth from '../../hooks/useAuth'

const formatError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    return (error.response?.data as { message?: string } | undefined)?.message || fallback
  }

  if (error instanceof Error) return error.message
  return fallback
}

const renderStars = (rating: number, className = 'h-4 w-4') => (
  <div className="flex items-center gap-0.5">
    {Array.from({ length: 5 }, (_, index) => {
      const active = index < rating
      return <Star key={index} className={`${className} ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
    })}
  </div>
)

const MealDetailPage = () => {
  const location = useLocation()
  const { user } = useAuth()
  const meal = (location.state as { meal?: MealItem } | null)?.meal

  const [reviews, setReviews] = useState<MealReview[]>([])
  const [summary, setSummary] = useState<MealReviewSummary>({
    averageRating: meal?.averageRating ?? 0,
    reviewCount: meal?.reviewCount ?? 0,
  })
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')
  const [loadingReviews, setLoadingReviews] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const myReview = useMemo(() => {
    if (!user) return null
    return reviews.find((review) => review.user.id === user.id) || null
  }, [reviews, user])

  useEffect(() => {
    if (!meal?.id) return

    const loadReviews = async () => {
      setLoadingReviews(true)
      try {
        const response = await getMealReviews(meal.id)
        setReviews(response.data.data.reviews)
        setSummary(response.data.data.summary)
        setErrorMessage(null)
      } catch (error) {
        setErrorMessage(formatError(error, 'Could not load meal reviews.'))
      } finally {
        setLoadingReviews(false)
      }
    }

    void loadReviews()
  }, [meal?.id])

  useEffect(() => {
    if (!myReview) {
      setRating(5)
      setComment('')
      return
    }

    setRating(myReview.rating)
    setComment(myReview.comment)
  }, [myReview])

  const handleSubmitReview = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!meal?.id) return

    const trimmedComment = comment.trim()
    if (trimmedComment.length < 3 || trimmedComment.length > 300) {
      setErrorMessage('Review comment must be between 3 and 300 characters.')
      return
    }

    setSubmitting(true)
    setFeedback(null)
    setErrorMessage(null)

    try {
      if (myReview) {
        const response = await updateMyMealReview(meal.id, { rating, comment: trimmedComment })
        const updatedReview = response.data.data.review
        setReviews((prev) => prev.map((item) => (item.id === updatedReview.id ? updatedReview : item)))
        setSummary(response.data.data.summary)
        setFeedback('Your review has been updated.')
      } else {
        const response = await createMealReview(meal.id, { rating, comment: trimmedComment })
        setReviews((prev) => [response.data.data.review, ...prev])
        setSummary(response.data.data.summary)
        setFeedback('Thanks for your review.')
      }
    } catch (error) {
      setErrorMessage(formatError(error, 'Unable to save your review right now.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteReview = async () => {
    if (!meal?.id || !myReview) return

    setSubmitting(true)
    setFeedback(null)
    setErrorMessage(null)
    try {
      const response = await deleteMyMealReview(meal.id)
      setReviews((prev) => prev.filter((review) => review.id !== myReview.id))
      setSummary(response.data.data.summary)
      setRating(5)
      setComment('')
      setFeedback('Your review was removed.')
    } catch (error) {
      setErrorMessage(formatError(error, 'Unable to delete your review right now.'))
    } finally {
      setSubmitting(false)
    }
  }

  if (!meal) {
    return (
      <section className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">Meal details not available</h1>
          <p className="mt-2 text-sm text-slate-600">
            This page needs meal data from the Meals page. Please open a meal using the View Details button.
          </p>
          <Link
            to="/meals"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Meals
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-orange-600 p-8 text-white shadow-xl shadow-slate-300/20">
        <p className="text-xs uppercase tracking-[0.3em] text-orange-100/80">Meal Details</p>
        <h1 className="mt-3 text-3xl font-black tracking-tight sm:text-4xl">{meal.name}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-100/90 sm:text-base">
          Full meal information and quick actions for planning and ordering.
        </p>
      </header>

      <article className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-0 md:grid-cols-2">
          <div className="h-64 bg-slate-100 md:h-full">
            {meal.imageUrl ? (
              <img src={meal.imageUrl} alt={meal.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-orange-400">
                <UtensilsCrossed className="h-16 w-16" />
              </div>
            )}
          </div>

          <div className="space-y-5 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">{meal.name}</h2>
              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meal.isAvailable ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {meal.isAvailable ? 'Available' : 'Out of Stock'}
              </span>
            </div>

            <p className="text-sm leading-6 text-slate-600">{meal.description || 'No description provided.'}</p>

            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Clock3 className="h-3 w-3" /> {meal.category}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Flame className="h-3 w-3 text-orange-500" /> {meal.calories} kcal</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1">Stock: {meal.quantity}</span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1"><Sparkles className="h-3 w-3 text-emerald-500" /> Chef pick</span>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-3">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Community rating</p>
              <div className="mt-2 flex items-center gap-3">
                {renderStars(Math.round(summary.averageRating), 'h-5 w-5')}
                <p className="text-sm font-semibold text-slate-700">
                  {summary.averageRating.toFixed(1)} / 5 ({summary.reviewCount} review{summary.reviewCount === 1 ? '' : 's'})
                </p>
              </div>
            </div>

            <p className="text-4xl font-black text-orange-500">LKR {meal.price.toFixed(0)}</p>

            <div className="grid gap-2 sm:grid-cols-3">
              <Link to="/meal-plans" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Meal Plan
              </Link>
              <Link
                to="/meals"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-center text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Back to Meals
              </Link>
              {meal.isAvailable ? (
                <Link
                  to="/orders"
                  state={{ meal }}
                  className="inline-flex items-center justify-center gap-1 rounded-xl bg-orange-500 px-3 py-2 text-sm font-semibold text-white hover:bg-orange-600"
                >
                  <ShoppingBag className="h-4 w-4" />
                  Order
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-200 px-3 py-2 text-sm font-semibold text-slate-500">
                  Out of Stock
                </span>
              )}
            </div>
          </div>
        </div>
      </article>

      <section className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">Your feedback</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">Rate and review this meal</h2>
            </div>
            {myReview && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">You reviewed this meal</span>}
          </div>

          <form className="mt-5 space-y-4" onSubmit={handleSubmitReview}>
            <div>
              <p className="mb-2 text-sm font-semibold text-slate-700">Your rating</p>
              <div className="flex items-center gap-2">
                {Array.from({ length: 5 }, (_, index) => {
                  const value = index + 1
                  const active = value <= rating
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      className="rounded-full p-1.5 transition hover:bg-amber-100"
                      aria-label={`Rate ${value} star${value > 1 ? 's' : ''}`}
                    >
                      <Star className={`h-6 w-6 ${active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                    </button>
                  )
                })}
                <span className="text-sm font-semibold text-slate-600">{rating}/5</span>
              </div>
            </div>

            <div>
              <label htmlFor="review-comment" className="mb-2 block text-sm font-semibold text-slate-700">Your review</label>
              <textarea
                id="review-comment"
                value={comment}
                maxLength={300}
                onChange={(event) => setComment(event.target.value)}
                placeholder="How was the taste, quality, value, and portion size?"
                className="min-h-28 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm leading-6 text-slate-700 shadow-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-200"
              />
              <p className="mt-1 text-right text-xs font-medium text-slate-500">{comment.trim().length}/300</p>
            </div>

            {errorMessage && <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">{errorMessage}</p>}
            {feedback && <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">{feedback}</p>}

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Saving...' : myReview ? 'Update review' : 'Submit review'}
              </button>

              {myReview && (
                <button
                  type="button"
                  onClick={() => void handleDeleteReview()}
                  disabled={submitting}
                  className="inline-flex items-center gap-1 rounded-xl border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete review
                </button>
              )}
            </div>
          </form>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-black text-slate-900">Recent reviews</h2>
          <p className="mt-1 text-sm text-slate-600">Real feedback from students and admins.</p>

          <div className="mt-4 space-y-3">
            {loadingReviews ? (
              <p className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-600">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm text-slate-600">No reviews yet. Be the first to review this meal.</p>
            ) : (
              reviews.map((review) => (
                <article key={review.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{review.user.name}</p>
                      <p className="text-xs text-slate-500">{new Date(review.createdAt).toLocaleString()}</p>
                    </div>
                    {renderStars(review.rating)}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-700">{review.comment}</p>
                </article>
              ))
            )}
          </div>
        </article>
      </section>
    </section>
  )
}

export default MealDetailPage
