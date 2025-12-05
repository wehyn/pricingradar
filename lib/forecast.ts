/**
 * Simple forecasting helpers for pricing suggestions.
 * - linearRegressionPredict: fits a line and predicts next point
 * - expSmoothPredict: simple exponential smoothing prediction
 * - makeForecastSuggestion: produces a suggested price and explanation
 */

function linearRegressionPredict(points: number[]): number | null {
  if (!points || points.length === 0) return null;
  const n = points.length;
  if (n === 1) return points[0];
  // x values 0..n-1
  const xs = Array.from({ length: n }, (_, i) => i);
  const meanX = (n - 1) / 2;
  const meanY = points.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - meanX) * (points[i] - meanY);
    den += (xs[i] - meanX) * (xs[i] - meanX);
  }
  const slope = den === 0 ? 0 : num / den;
  const intercept = meanY - slope * meanX;
  const nextX = n; // predict next day
  return intercept + slope * nextX;
}

function expSmoothPredict(points: number[], alpha = 0.3): number | null {
  if (!points || points.length === 0) return null;
  let s = points[0];
  for (let i = 1; i < points.length; i++) {
    s = alpha * points[i] + (1 - alpha) * s;
  }
  // predict next as last smoothed value
  return s;
}

export type Suggestion = {
  suggestedPrice: number | null;
  predictedCompetitorPrice: number | null;
  trendPercent: number | null; // predicted change vs last
  text: string;
};

/**
 * Make a forecast-based suggestion.
 * - ourPrice: current our price
 * - competitorHistory: array of competitor historical prices (oldest->newest)
 * - targetVariance: fraction (e.g., 0.05 for 5%) to remain above competitor
 */
export function makeForecastSuggestion(
  ourPrice: number,
  competitorHistory: number[] | null,
  targetVariance = 0.05
): Suggestion {
  if (!competitorHistory || competitorHistory.length === 0) {
    return {
      suggestedPrice: null,
      predictedCompetitorPrice: null,
      trendPercent: null,
      text: `No competitor history available to forecast a suggested price.`,
    };
  }

  const last = competitorHistory[competitorHistory.length - 1];
  const lin = linearRegressionPredict(competitorHistory);
  const exp = expSmoothPredict(competitorHistory, 0.25);
  const predicted = (() => {
    if (lin == null && exp == null) return last;
    if (lin == null) return exp as number;
    if (exp == null) return lin as number;
    // average both predictions
    return (lin + exp) / 2;
  })();

  const trendPercent = last ? Math.round(((predicted - last) / last) * 1000) / 10 : null;

  // If competitor predicted to go down, be more aggressive: target closer to predicted
  // Suggested = predicted * (1 + targetVariance)
  let suggested = Math.round(predicted * (1 + targetVariance) * 100) / 100;

  // If our current price is already below suggested, keep our current price
  if (ourPrice <= suggested) {
    suggested = ourPrice;
  }

  // Compose simple human-readable text
  const text = `Forecast: competitor expected ${predicted ? `$${predicted.toFixed(2)}` : 'N/A'} (trend ${trendPercent?.toFixed(1)}%). Suggest setting price to $${suggested?.toFixed(2)} to stay within ${Math.round(targetVariance * 100)}% of forecast.`;

  return {
    suggestedPrice: suggested,
    predictedCompetitorPrice: Math.round(predicted * 100) / 100,
    trendPercent,
    text,
  };
}
