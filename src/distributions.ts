// Statistical distribution definitions matching PreliZ's API
// Each distribution provides: PDF/PMF, parameter definitions, and default values

export interface ParamDef {
  name: string;
  label: string;
  min: number;
  max: number;
  step: number;
  default: number;
}

export interface Distribution {
  name: string;
  kind: "continuous" | "discrete";
  params: ParamDef[];
  support: (params: number[]) => [number, number];
  pdf: (x: number, params: number[]) => number;
  description: string;
}

// --- Math helpers ---

function logGamma(z: number): number {
  // Lanczos approximation
  const g = 7;
  const c = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028,
    771.32342877765313, -176.61502916214059, 12.507343278686905,
    -0.13857109526572012, 9.9843695780195716e-6, 1.5056327351493116e-7,
  ];
  if (z < 0.5) return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
  z -= 1;
  let x = c[0];
  for (let i = 1; i < g + 2; i++) x += c[i] / (z + i);
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}

function logBeta(a: number, b: number): number {
  return logGamma(a) + logGamma(b) - logGamma(a + b);
}

function binomCoeff(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  let result = 1;
  for (let i = 0; i < k; i++) {
    result *= (n - i) / (i + 1);
  }
  return result;
}

const SQRT2 = Math.sqrt(2);
const SQRT2PI = Math.sqrt(2 * Math.PI);

function normalPDF(x: number, mu: number, sigma: number): number {
  const z = (x - mu) / sigma;
  return Math.exp(-0.5 * z * z) / (sigma * SQRT2PI);
}

function normalCDF(x: number): number {
  // Standard normal CDF using error function approximation
  return 0.5 * (1 + erf(x / SQRT2));
}

function erf(x: number): number {
  // Abramowitz and Stegun approximation
  const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741;
  const a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x);
  const t = 1.0 / (1.0 + p * x);
  const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
  return sign * y;
}

// --- Continuous distributions ---

const Normal: Distribution = {
  name: "Normal",
  kind: "continuous",
  description: "μ is the mean, σ is the standard deviation.",
  params: [
    { name: "mu", label: "μ (mean)", min: -10, max: 10, step: 0.1, default: 0 },
    { name: "sigma", label: "σ (std dev)", min: 0.1, max: 10, step: 0.1, default: 1 },
  ],
  support: ([mu, sigma]) => [mu - 4 * sigma, mu + 4 * sigma],
  pdf: (x, [mu, sigma]) => normalPDF(x, mu, sigma),
};

const Beta: Distribution = {
  name: "Beta",
  kind: "continuous",
  description: "α and β shape the distribution on [0,1]. α=β=1 is Uniform.",
  params: [
    { name: "alpha", label: "α (alpha)", min: 0.1, max: 10, step: 0.1, default: 2 },
    { name: "beta", label: "β (beta)", min: 0.1, max: 10, step: 0.1, default: 5 },
  ],
  support: () => [0, 1],
  pdf: (x, [alpha, beta]) => {
    if (x <= 0 || x >= 1) return 0;
    return Math.exp(
      (alpha - 1) * Math.log(x) + (beta - 1) * Math.log(1 - x) - logBeta(alpha, beta)
    );
  },
};

const Gamma: Distribution = {
  name: "Gamma",
  kind: "continuous",
  description: "α is the shape, β is the rate (1/scale). Mean = α/β.",
  params: [
    { name: "alpha", label: "α (shape)", min: 0.1, max: 10, step: 0.1, default: 2 },
    { name: "beta", label: "β (rate)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([_alpha, beta]) => [0, 20 / beta],
  pdf: (x, [alpha, beta]) => {
    if (x <= 0) return 0;
    return Math.exp(
      alpha * Math.log(beta) + (alpha - 1) * Math.log(x) - beta * x - logGamma(alpha)
    );
  },
};

const HalfNormal: Distribution = {
  name: "HalfNormal",
  kind: "continuous",
  description: "σ is the scale. Only the positive half of a Normal.",
  params: [
    { name: "sigma", label: "σ (scale)", min: 0.1, max: 10, step: 0.1, default: 1 },
  ],
  support: ([sigma]) => [0, 4 * sigma],
  pdf: (x, [sigma]) => {
    if (x < 0) return 0;
    return (2 / (sigma * SQRT2PI)) * Math.exp(-0.5 * (x / sigma) ** 2);
  },
};

const Exponential: Distribution = {
  name: "Exponential",
  kind: "continuous",
  description: "λ (lam) is the rate. Mean = 1/λ.",
  params: [
    { name: "lam", label: "λ (rate)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([lam]) => [0, 6 / lam],
  pdf: (x, [lam]) => {
    if (x < 0) return 0;
    return lam * Math.exp(-lam * x);
  },
};

const Uniform: Distribution = {
  name: "Uniform",
  kind: "continuous",
  description: "Constant density between lower and upper bounds.",
  params: [
    { name: "lower", label: "lower", min: -10, max: 9, step: 0.5, default: 0 },
    { name: "upper", label: "upper", min: -9, max: 10, step: 0.5, default: 1 },
  ],
  support: ([lower, upper]) => [lower - 0.5, upper + 0.5],
  pdf: (x, [lower, upper]) => {
    if (upper <= lower) return 0;
    return x >= lower && x <= upper ? 1 / (upper - lower) : 0;
  },
};

const StudentT: Distribution = {
  name: "StudentT",
  kind: "continuous",
  description: "ν is degrees of freedom, μ is location, σ is scale.",
  params: [
    { name: "nu", label: "ν (df)", min: 1, max: 30, step: 0.5, default: 5 },
    { name: "mu", label: "μ (mean)", min: -5, max: 5, step: 0.1, default: 0 },
    { name: "sigma", label: "σ (scale)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([, mu, sigma]) => [mu - 5 * sigma, mu + 5 * sigma],
  pdf: (x, [nu, mu, sigma]) => {
    const z = (x - mu) / sigma;
    return (
      Math.exp(logGamma((nu + 1) / 2) - logGamma(nu / 2)) /
      (Math.sqrt(nu * Math.PI) * sigma) *
      Math.pow(1 + z * z / nu, -(nu + 1) / 2)
    );
  },
};

const LogNormal: Distribution = {
  name: "LogNormal",
  kind: "continuous",
  description: "μ and σ are the mean and std dev of the log. Strictly positive.",
  params: [
    { name: "mu", label: "μ (log mean)", min: -2, max: 3, step: 0.1, default: 0 },
    { name: "sigma", label: "σ (log std)", min: 0.1, max: 2, step: 0.05, default: 0.5 },
  ],
  support: ([mu, sigma]) => [0, Math.exp(mu + 4 * sigma)],
  pdf: (x, [mu, sigma]) => {
    if (x <= 0) return 0;
    return (
      Math.exp(-0.5 * ((Math.log(x) - mu) / sigma) ** 2) /
      (x * sigma * SQRT2PI)
    );
  },
};

const Cauchy: Distribution = {
  name: "Cauchy",
  kind: "continuous",
  description: "α is location, β is scale. Heavy tails, no mean or variance.",
  params: [
    { name: "alpha", label: "α (location)", min: -5, max: 5, step: 0.1, default: 0 },
    { name: "beta", label: "β (scale)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([alpha, beta]) => [alpha - 8 * beta, alpha + 8 * beta],
  pdf: (x, [alpha, beta]) => {
    const z = (x - alpha) / beta;
    return 1 / (Math.PI * beta * (1 + z * z));
  },
};

const Laplace: Distribution = {
  name: "Laplace",
  kind: "continuous",
  description: "μ is the mean, b is the scale (diversity).",
  params: [
    { name: "mu", label: "μ (mean)", min: -5, max: 5, step: 0.1, default: 0 },
    { name: "b", label: "b (scale)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([mu, b]) => [mu - 6 * b, mu + 6 * b],
  pdf: (x, [mu, b]) => Math.exp(-Math.abs(x - mu) / b) / (2 * b),
};

const Weibull: Distribution = {
  name: "Weibull",
  kind: "continuous",
  description: "α is shape, β is scale.",
  params: [
    { name: "alpha", label: "α (shape)", min: 0.1, max: 10, step: 0.1, default: 1.5 },
    { name: "beta", label: "β (scale)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([, beta]) => [0, beta * 4],
  pdf: (x, [alpha, beta]) => {
    if (x <= 0) return 0;
    return (alpha / beta) * Math.pow(x / beta, alpha - 1) * Math.exp(-Math.pow(x / beta, alpha));
  },
};

const Triangular: Distribution = {
  name: "Triangular",
  kind: "continuous",
  description: "lower is min, c is mode, upper is max.",
  params: [
    { name: "lower", label: "lower", min: -10, max: 5, step: 0.5, default: 0 },
    { name: "c", label: "c (mode)", min: -9, max: 9, step: 0.5, default: 0.5 },
    { name: "upper", label: "upper", min: -5, max: 10, step: 0.5, default: 1 },
  ],
  support: ([lower, , upper]) => [lower - 0.2, upper + 0.2],
  pdf: (x, [lower, c, upper]) => {
    if (upper <= lower || c < lower || c > upper) return 0;
    if (x < lower || x > upper) return 0;
    if (x < c) return (2 * (x - lower)) / ((upper - lower) * (c - lower));
    if (x === c) return 2 / (upper - lower);
    return (2 * (upper - x)) / ((upper - lower) * (upper - c));
  },
};

const SkewNormal: Distribution = {
  name: "SkewNormal",
  kind: "continuous",
  description: "μ is location, σ is scale, α controls skewness.",
  params: [
    { name: "mu", label: "μ (location)", min: -5, max: 5, step: 0.1, default: 0 },
    { name: "sigma", label: "σ (scale)", min: 0.1, max: 5, step: 0.1, default: 1 },
    { name: "alpha", label: "α (skew)", min: -10, max: 10, step: 0.5, default: 3 },
  ],
  support: ([mu, sigma]) => [mu - 4 * sigma, mu + 4 * sigma],
  pdf: (x, [mu, sigma, alpha]) => {
    const z = (x - mu) / sigma;
    return (2 / sigma) * normalPDF(z, 0, 1) * normalCDF(alpha * z);
  },
};

const InverseGamma: Distribution = {
  name: "InverseGamma",
  kind: "continuous",
  description: "α is shape, β is scale. Support is (0, ∞).",
  params: [
    { name: "alpha", label: "α (shape)", min: 0.5, max: 10, step: 0.1, default: 2 },
    { name: "beta", label: "β (scale)", min: 0.1, max: 10, step: 0.1, default: 1 },
  ],
  support: ([alpha, beta]) => [0, beta / (alpha - 1) * 8],
  pdf: (x, [alpha, beta]) => {
    if (x <= 0) return 0;
    return Math.exp(
      alpha * Math.log(beta) - logGamma(alpha) - (alpha + 1) * Math.log(x) - beta / x
    );
  },
};

const Logistic: Distribution = {
  name: "Logistic",
  kind: "continuous",
  description: "μ is location, s is scale.",
  params: [
    { name: "mu", label: "μ (location)", min: -5, max: 5, step: 0.1, default: 0 },
    { name: "s", label: "s (scale)", min: 0.1, max: 5, step: 0.1, default: 1 },
  ],
  support: ([mu, s]) => [mu - 7 * s, mu + 7 * s],
  pdf: (x, [mu, s]) => {
    const z = Math.exp(-(x - mu) / s);
    return z / (s * (1 + z) ** 2);
  },
};

// --- Discrete distributions ---

const Binomial: Distribution = {
  name: "Binomial",
  kind: "discrete",
  description: "n is number of trials, p is success probability.",
  params: [
    { name: "n", label: "n (trials)", min: 1, max: 50, step: 1, default: 10 },
    { name: "p", label: "p (prob)", min: 0.01, max: 0.99, step: 0.01, default: 0.5 },
  ],
  support: ([n]) => [-0.5, n + 0.5],
  pdf: (x, [n, p]) => {
    const k = Math.round(x);
    if (k < 0 || k > n) return 0;
    return binomCoeff(n, k) * Math.pow(p, k) * Math.pow(1 - p, n - k);
  },
};

const Poisson: Distribution = {
  name: "Poisson",
  kind: "discrete",
  description: "μ is the expected number of events (mean = variance = μ).",
  params: [
    { name: "mu", label: "μ (rate)", min: 0.5, max: 30, step: 0.5, default: 5 },
  ],
  support: ([mu]) => [-0.5, Math.max(20, mu + 5 * Math.sqrt(mu)) + 0.5],
  pdf: (x, [mu]) => {
    const k = Math.round(x);
    if (k < 0) return 0;
    return Math.exp(k * Math.log(mu) - mu - logGamma(k + 1));
  },
};

const NegativeBinomial: Distribution = {
  name: "NegativeBinomial",
  kind: "discrete",
  description: "n is number of successes, p is success probability.",
  params: [
    { name: "n", label: "n (successes)", min: 1, max: 30, step: 1, default: 5 },
    { name: "p", label: "p (prob)", min: 0.01, max: 0.99, step: 0.01, default: 0.5 },
  ],
  support: ([n, p]) => [-0.5, Math.ceil(n * (1 - p) / p + 4 * Math.sqrt(n * (1 - p) / (p * p))) + 0.5],
  pdf: (x, [n, p]) => {
    const k = Math.round(x);
    if (k < 0) return 0;
    return Math.exp(
      logGamma(k + n) - logGamma(n) - logGamma(k + 1) +
      n * Math.log(p) + k * Math.log(1 - p)
    );
  },
};

const Geometric: Distribution = {
  name: "Geometric",
  kind: "discrete",
  description: "p is the success probability. Counts trials until first success.",
  params: [
    { name: "p", label: "p (prob)", min: 0.01, max: 0.99, step: 0.01, default: 0.3 },
  ],
  support: () => [0.5, 20.5],
  pdf: (x, [p]) => {
    const k = Math.round(x);
    if (k < 1) return 0;
    return p * Math.pow(1 - p, k - 1);
  },
};

const DiscreteUniform: Distribution = {
  name: "DiscreteUniform",
  kind: "discrete",
  description: "Equal probability for each integer from lower to upper.",
  params: [
    { name: "lower", label: "lower", min: -20, max: 0, step: 1, default: 1 },
    { name: "upper", label: "upper", min: 1, max: 20, step: 1, default: 6 },
  ],
  support: ([lower, upper]) => [lower - 0.5, upper + 0.5],
  pdf: (x, [lower, upper]) => {
    const k = Math.round(x);
    if (k < lower || k > upper || upper < lower) return 0;
    return 1 / (upper - lower + 1);
  },
};

const Bernoulli: Distribution = {
  name: "Bernoulli",
  kind: "discrete",
  description: "p is the probability of success (outcome = 1).",
  params: [
    { name: "p", label: "p (prob)", min: 0.01, max: 0.99, step: 0.01, default: 0.5 },
  ],
  support: () => [-0.5, 1.5],
  pdf: (x, [p]) => {
    const k = Math.round(x);
    if (k === 0) return 1 - p;
    if (k === 1) return p;
    return 0;
  },
};

export const DISTRIBUTIONS: Distribution[] = [
  // Continuous
  Normal, Beta, Gamma, HalfNormal, Exponential, Uniform,
  StudentT, LogNormal, Cauchy, Laplace, Weibull, Triangular,
  SkewNormal, InverseGamma, Logistic,
  // Discrete
  Binomial, Poisson, NegativeBinomial, Geometric, DiscreteUniform, Bernoulli,
];

export function computePoints(dist: Distribution, params: number[], numPoints = 300): { x: number; y: number }[] {
  const [lo, hi] = dist.support(params);
  const points: { x: number; y: number }[] = [];

  if (dist.kind === "discrete") {
    const lo_i = Math.ceil(lo + 0.5);
    const hi_i = Math.floor(hi - 0.5);
    for (let k = lo_i; k <= hi_i; k++) {
      points.push({ x: k, y: dist.pdf(k, params) });
    }
  } else {
    const step = (hi - lo) / numPoints;
    for (let i = 0; i <= numPoints; i++) {
      const x = lo + i * step;
      const y = dist.pdf(x, params);
      points.push({ x: parseFloat(x.toFixed(6)), y: isFinite(y) ? y : 0 });
    }
  }
  return points;
}
