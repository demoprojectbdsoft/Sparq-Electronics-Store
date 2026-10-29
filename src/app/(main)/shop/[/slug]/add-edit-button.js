const fs = require('fs');
let content = fs.readFileSync('src/app/(main)/shop/[slug]/ProductDetailsPage.tsx', 'utf8');

// Replace the review footer with edit capability
const footerOld = `                            {/* Review Footer / Helpful reaction */}
                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 text-[10px]">
                                Was this review helpful?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleToggleHelpful(rev.id)}
                                className={'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (
                                  isLiked
                                    ? 'bg-primary/10 text-primary border border-primary/30 font-bold'
                                    : 'text-slate-500 hover:text-primary hover:bg-[var(--surface-alt)]'
                                )}
                              >
                                <ThumbsUp className={'w-3 h-3 ' + (isLiked ? 'fill-primary text-primary' : '')} />
                                <span>Helpful {helpfulCount > 0 ? '(' + helpfulCount + ')' : ''}</span>
                              </button>
                            </div>`;

const footerNew = `                            {/* Review Footer / Helpful reaction + Edit */}
                            <div className="pt-2 border-t border-[var(--border-color)] flex items-center justify-between text-[11px] gap-2">
                              <span className="text-slate-400 text-[10px]">
                                Was this review helpful?
                              </span>
                              <div className="flex items-center gap-1.5">
                                {user?.id && String(user.id) === String(rev.userId) && (
                                  isEditingReview === rev.id ? (
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleSaveReviewEdit(rev.id)}
                                        disabled={isSubmitting}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer disabled:opacity-50"
                                      >
                                        {isSubmitting ? 'Saving...' : 'Save'}
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => setIsEditingReview(null)}
                                        disabled={isSubmitting}
                                        className="px-2.5 py-1 rounded-lg text-xs font-bold bg-[var(--surface-alt)] hover:bg-[var(--surface)] text-[var(--foreground)] transition-colors cursor-pointer disabled:opacity-50"
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => handleStartEditingReview(rev.id, rev.rating, rev.comment, rev.images || [])}
                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50 transition-colors cursor-pointer"
                                    >
                                      <Edit className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  )
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleToggleHelpful(rev.id)}
                                  className={'flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ' + (
                                    isLiked
                                      ? 'bg-primary/10 text-primary border border-primary/30 font-bold'
                                      : 'text-slate-500 hover:text-primary hover:bg-[var(--surface-alt)]'
                                  )}
                                >
                                  <ThumbsUp className={'w-3 h-3 ' + (isLiked ? 'fill-primary text-primary' : '')} />
                                  <span>Helpful {helpfulCount > 0 ? '(' + helpfulCount + ')' : ''}</span>
                                </button>
                              </div>
                            </div>`;

if (!content.includes(footerOld)) {
  console.error('Footer pattern not found!');
  process.exit(1);
}

content = content.replace(footerOld, footerNew);

fs.writeFileSync('src/app/(main)/shop/[slug]/ProductDetailsPage.tsx', content);
console.log('Footer edit UI added');
