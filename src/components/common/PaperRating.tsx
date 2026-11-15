import React, { useState, useEffect, useRef } from 'react';
import { Star, X, Check, LogIn, Loader2, Sparkles } from 'lucide-react';
import { PaperStats, User } from '../../types';
import { RatingService, getPaperId } from '../../services/ratingService';

interface PaperRatingProps {
  paper: {
    doi?: string;
    id?: string;
    source?: string;
    title?: string;
  };
  stats?: PaperStats | null;
  currentUser?: User | null;
  onAuthRequired?: () => void;
  onRated?: (newStats: PaperStats) => void;
  size?: 'sm' | 'md';
  className?: string;
}

export const PaperRating: React.FC<PaperRatingProps> = ({
  paper,
  stats: initialStats,
  currentUser,
  onAuthRequired,
  onRated,
  size = 'sm',
  className = ''
}) => {
  const [stats, setStats] = useState<PaperStats | null>(initialStats || null);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [existingUserRating, setExistingUserRating] = useState<number | null>(null);
  const [loadingUserRating, setLoadingUserRating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const paperId = getPaperId(paper);

  // Sync external stats updates
  useEffect(() => {
    if (initialStats !== undefined) {
      setStats(initialStats);
    }
  }, [initialStats]);

  // Load existing rating when popover opens and user is logged in
  useEffect(() => {
    let isMounted = true;
    if (isOpen && currentUser && currentUser.id) {
      setLoadingUserRating(true);
      RatingService.getUserRating(paperId, currentUser.id).then((rating) => {
        if (isMounted) {
          if (rating && rating >= 1 && rating <= 5) {
            setExistingUserRating(rating);
            setSelectedRating(rating);
          } else {
            setExistingUserRating(null);
            setSelectedRating(0);
          }
          setLoadingUserRating(false);
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen, paperId, currentUser]);

  // Handle outside clicks to close popover
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleOpenClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setSubmittedSuccess(false);
    setIsOpen(!isOpen);
  };

  const handleSubmit = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!currentUser || !currentUser.id) {
      if (onAuthRequired) onAuthRequired();
      return;
    }

    if (selectedRating < 1 || selectedRating > 5) return;

    setSubmitting(true);
    try {
      const updated = await RatingService.submitRating(paperId, currentUser.id, selectedRating);
      setStats(updated);
      setExistingUserRating(selectedRating);
      setSubmittedSuccess(true);
      if (onRated) {
        onRated(updated);
      }
      setTimeout(() => {
        setIsOpen(false);
        setSubmittedSuccess(false);
      }, 1100);
    } catch (err) {
      // Handled gracefully in service
    } finally {
      setSubmitting(false);
    }
  };

  const hasRatings = Boolean(stats && stats.ratingCount > 0 && stats.average > 0);
  const displayAverage = hasRatings && stats ? stats.average.toFixed(1) : null;
  const displayCount = hasRatings && stats ? stats.ratingCount : 0;

  const starLabels = [
    'Select a score',
    '1 - Poor / Inconclusive',
    '2 - Below Average',
    '3 - Good Academic Quality',
    '4 - Very High Impact',
    '5 - Exceptional / Seminal Work'
  ];

  return (
    <div className={`relative inline-block ${className}`} onClick={(e) => e.stopPropagation()}>
      {/* Rating badge button displayed top-right of paper card */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleOpenClick}
        title="CollabX Community Rating (Click to rate)"
        className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-all cursor-pointer select-none text-left ${
          hasRatings
            ? 'bg-amber-50 hover:bg-amber-100/90 text-amber-900 border border-amber-200/80 shadow-2xs hover:shadow-xs'
            : 'bg-gray-50 hover:bg-gray-100 text-gray-500 hover:text-gray-700 border border-gray-200'
        } ${size === 'sm' ? 'text-xs' : 'text-sm'}`}
      >
        <Star
          className={`shrink-0 transition-transform group-hover:scale-110 ${
            hasRatings
              ? 'w-3.5 h-3.5 fill-amber-400 text-amber-500'
              : 'w-3.5 h-3.5 text-gray-400 group-hover:text-amber-500'
          }`}
        />
        
        {hasRatings ? (
          <div className="flex items-center gap-1 font-bold">
            <span className="text-amber-950 font-black tracking-tight">{displayAverage}</span>
            <span className="text-amber-700/80 text-[11px] font-semibold">({displayCount})</span>
          </div>
        ) : (
          <span className="text-gray-400 font-medium text-xs">No ratings yet</span>
        )}
      </button>

      {/* Rating Popover */}
      {isOpen && (
        <div
          ref={popoverRef}
          className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-[#D5DDEB] p-4 z-50 animate-fade-in text-left text-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-2 pb-2.5 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#0B2A55]">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>CollabX Community Rating</span>
              </div>
              <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5" title={paper.title || 'Academic Paper'}>
                {paper.title || 'Academic Paper'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current Aggregate Summary */}
          <div className="py-2.5 flex items-center justify-between text-xs bg-[#F8FAFC] rounded-xl px-3 my-2.5 border border-gray-100">
            <span className="text-gray-500 font-medium">Community Average</span>
            <div className="flex items-center gap-1.5 font-bold">
              {hasRatings ? (
                <>
                  <span className="text-amber-500">★</span>
                  <span className="text-[#0B2A55] font-black">{displayAverage}</span>
                  <span className="text-gray-400 text-[11px]">({displayCount} {displayCount === 1 ? 'rating' : 'ratings'})</span>
                </>
              ) : (
                <span className="text-gray-400 font-medium">No ratings yet</span>
              )}
            </div>
          </div>

          {/* User Rating Action */}
          {!currentUser ? (
            <div className="py-2 space-y-2 text-center">
              <p className="text-xs text-gray-600 font-medium">
                Log in to rate this publication and help your peers identify seminal literature.
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  if (onAuthRequired) onAuthRequired();
                }}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log in to rate</span>
              </button>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              {loadingUserRating ? (
                <div className="py-4 flex items-center justify-center text-xs text-gray-400 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-[#0B6BE6]" />
                  <span>Loading your rating…</span>
                </div>
              ) : (
                <>
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1">
                      {existingUserRating ? 'Update Your Rating (1 to 5 Stars)' : 'Pick Your Rating'}
                    </span>

                    {/* 5 Star Selection */}
                    <div className="flex items-center justify-center gap-2 py-1">
                      {[1, 2, 3, 4, 5].map((starValue) => {
                        const isFilled = (hoverRating || selectedRating) >= starValue;
                        return (
                          <button
                            key={starValue}
                            type="button"
                            onMouseEnter={() => setHoverRating(starValue)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => setSelectedRating(starValue)}
                            className="p-1 hover:scale-115 transition-transform cursor-pointer focus:outline-hidden"
                            title={`${starValue} Stars`}
                          >
                            <Star
                              className={`w-6 h-6 transition-colors ${
                                isFilled
                                  ? 'fill-amber-400 text-amber-500'
                                  : 'text-gray-300 hover:text-amber-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                    </div>

                    <div className="text-[11px] font-semibold text-gray-600 h-4 mt-0.5">
                      {starLabels[hoverRating || selectedRating] || 'Click a star to score'}
                    </div>
                  </div>

                  {existingUserRating && (
                    <div className="text-center text-[11px] text-gray-500 bg-amber-50/60 rounded-lg py-1 border border-amber-100">
                      You previously rated this <span className="font-bold text-amber-900">{existingUserRating} ★</span>
                    </div>
                  )}

                  {submittedSuccess ? (
                    <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold flex items-center justify-center gap-1.5 animate-fade-in">
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Rating saved to CollabX Community!</span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={selectedRating === 0 || submitting}
                      onClick={handleSubmit}
                      className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0B6BE6] hover:bg-[#0956b8] disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Saving…</span>
                        </>
                      ) : (
                        <span>{existingUserRating ? 'Update Rating' : 'Submit Rating'}</span>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
