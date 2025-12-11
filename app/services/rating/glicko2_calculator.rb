module Rating
  # Implements the Glicko-2 rating algorithm.
  # Accepts a player's current rating state and a list of results for a rating period,
  # returning updated rating, rating deviation, and volatility.
  class Glicko2Calculator
    SCALE = 173.7178
    DEFAULT_TAU = 0.5
    DEFAULT_EPSILON = 0.000001

    Result = Struct.new(:opponent_rating, :opponent_rd, :score, keyword_init: true)

    def initialize(tau: DEFAULT_TAU, epsilon: DEFAULT_EPSILON)
      @tau = tau
      @epsilon = epsilon
    end

    # Public: compute new rating tuple.
    # rating_state: { rating:, rating_deviation:, volatility: }
    # results: array of Result (can be empty; RD will then inflate).
    def update(rating_state, results)
      rating = rating_state[:rating].to_f
      rd = rating_state[:rating_deviation].to_f
      volatility = rating_state[:volatility].to_f

      mu = to_mu(rating)
      phi = to_phi(rd)

      if results.empty?
        # No games in the period: only increase uncertainty.
        inflated_phi = Math.sqrt(phi**2 + volatility**2)
        return build_result(mu, inflated_phi, volatility)
      end

      v = variance(mu, results)
      delta = delta(mu, results, v)

      new_sigma = update_volatility(mu, phi, delta, v, volatility)
      pre_phi = Math.sqrt(phi**2 + new_sigma**2)

      phi_star = 1.0 / Math.sqrt((1.0 / pre_phi**2) + (1.0 / v))
      mu_star = mu + (phi_star**2) * results.sum { |r| g(to_phi(r.opponent_rd)) * (r.score - e(mu, to_mu(r.opponent_rating), to_phi(r.opponent_rd))) }

      build_result(mu_star, phi_star, new_sigma)
    end

    private

    def build_result(mu, phi, sigma)
      {
        rating: to_rating(mu),
        rating_deviation: to_rd(phi),
        volatility: sigma
      }
    end

    def to_mu(rating)
      (rating - 1500.0) / SCALE
    end

    def to_rating(mu)
      (mu * SCALE + 1500.0).round(2)
    end

    def to_phi(rd)
      rd / SCALE
    end

    def to_rd(phi)
      (phi * SCALE).round(2)
    end

    def g(phi)
      1.0 / Math.sqrt(1 + (3 * phi**2) / Math::PI**2)
    end

    def e(mu, mu_j, phi_j)
      1.0 / (1.0 + Math.exp(-g(phi_j) * (mu - mu_j)))
    end

    def variance(mu, results)
      1.0 / results.sum do |r|
        phi_j = to_phi(r.opponent_rd)
        mu_j = to_mu(r.opponent_rating)
        g(phi_j)**2 * e(mu, mu_j, phi_j) * (1 - e(mu, mu_j, phi_j))
      end
    end

    def delta(mu, results, v)
      v * results.sum do |r|
        phi_j = to_phi(r.opponent_rd)
        mu_j = to_mu(r.opponent_rating)
        g(phi_j) * (r.score - e(mu, mu_j, phi_j))
      end
    end

    def update_volatility(mu, phi, delta, v, sigma)
      a = Math.log(sigma**2)
      delta_sq = delta**2

      f = lambda do |x|
        exp_x = Math.exp(x)
        num = exp_x * (delta_sq - phi**2 - v - exp_x)
        denom = 2 * (phi**2 + v + exp_x)**2
        (num / denom) - ((x - a) / @tau**2)
      end

      # Initial guess for B
      b = if delta_sq > phi**2 + v
            Math.log(delta_sq - phi**2 - v)
          else
            k = 1
            while f.call(a - k * @tau) < 0
              k += 1
            end
            a - k * @tau
          end

      fa = f.call(a)
      fb = f.call(b)

      while (b - a).abs > @epsilon
        c = a + (a - b) * fa / (fb - fa)
        fc = f.call(c)

        if fc * fb < 0
          a = b
          fa = fb
        else
          fa = fa / 2.0
        end

        b = c
        fb = fc
      end

      Math.exp(a / 2.0)
    end
  end
end



