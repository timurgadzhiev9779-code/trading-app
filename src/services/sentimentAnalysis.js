export class SentimentAnalyzer {
    constructor() {
      this.cache = new Map()
      this.cacheDuration = 600000 // 10 минут
    }
  
    // Fear & Greed Index (уже есть в advancedAnalysis)
    async getFearGreed() {
      try {
        const res = await fetch('https://api.alternative.me/fng/')
        const data = await res.json()
        return {
          value: parseInt(data.data[0].value),
          classification: data.data[0].value_classification
        }
      } catch {
        return { value: 50, classification: 'Neutral' }
      }
    }
  
    // Новости (CryptoCompare API - бесплатный)
    async getNews(symbol) {
      const cacheKey = `news_${symbol}`
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheDuration) {
          return cached.data
        }
      }
  
      try {
        const res = await fetch(
          `https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=${symbol}`
        )
        const data = await res.json()
        
        if (!data.Data) return { sentiment: 'neutral', score: 50, articles: [] }
  
        const articles = data.Data.slice(0, 10)
        
        // Простой sentiment на основе keywords
        const sentiment = this.analyzeNewsSentiment(articles)
        
        const result = {
          sentiment: sentiment.label,
          score: sentiment.score,
          articles: articles.map(a => ({
            title: a.title,
            url: a.url,
            source: a.source,
            published: new Date(a.published_on * 1000).toLocaleString('ru-RU')
          }))
        }
  
        this.cache.set(cacheKey, { data: result, timestamp: Date.now() })
        return result
        
      } catch (err) {
        console.error('News API error:', err)
        return { sentiment: 'neutral', score: 50, articles: [] }
      }
    }
  
    analyzeNewsSentiment(articles) {
      const positiveWords = [
        'bullish', 'surge', 'rally', 'gain', 'profit', 'growth', 'partnership',
        'adoption', 'breakthrough', 'upgrade', 'positive', 'success', 'win',
        'rise', 'soar', 'jump', 'bull', 'moon', 'pump'
      ]
      
      const negativeWords = [
        'bearish', 'crash', 'drop', 'loss', 'scam', 'hack', 'exploit', 'decline',
        'fall', 'dump', 'fear', 'panic', 'ban', 'regulation', 'lawsuit', 'fraud',
        'collapse', 'plunge', 'bear', 'fud'
      ]
  
      let score = 50
      
      articles.forEach(article => {
        const text = (article.title + ' ' + (article.body || '')).toLowerCase()
        
        positiveWords.forEach(word => {
          if (text.includes(word)) score += 2
        })
        
        negativeWords.forEach(word => {
          if (text.includes(word)) score -= 2
        })
      })
  
      score = Math.max(0, Math.min(100, score))
      
      return {
        score,
        label: score > 65 ? 'positive' : score < 35 ? 'negative' : 'neutral'
      }
    }
  
    // Social volume (упрощённо через LunarCrush - требует API key)
    async getSocialVolume(symbol) {
      // Для демо возвращаем mock данные
      // В проде: используй LunarCrush API или собственный Twitter scraper
      
      const mockVolume = 50 + Math.random() * 50 // 50-100
      const mockSentiment = 40 + Math.random() * 40 // 40-80
      
      return {
        volume: mockVolume.toFixed(0),
        sentiment: mockSentiment.toFixed(0),
        trend: mockVolume > 70 ? 'RISING' : mockVolume < 40 ? 'FALLING' : 'STABLE'
      }
    }
  
    // Комплексный sentiment score
    async getComprehensiveSentiment(symbol) {
      const [fearGreed, news, social] = await Promise.all([
        this.getFearGreed(),
        this.getNews(symbol),
        this.getSocialVolume(symbol)
      ])
  
      // Weighted average
      const fearGreedWeight = 0.3
      const newsWeight = 0.4
      const socialWeight = 0.3
  
      const compositeScore = 
        fearGreed.value * fearGreedWeight +
        news.score * newsWeight +
        parseFloat(social.sentiment) * socialWeight
  
      return {
        composite: Math.round(compositeScore),
        breakdown: {
          fearGreed: { value: fearGreed.value, label: fearGreed.classification },
          news: { score: news.score, sentiment: news.sentiment, articles: news.articles.slice(0, 3) },
          social: { volume: social.volume, sentiment: social.sentiment, trend: social.trend }
        },
        signal: compositeScore > 65 ? 'BULLISH' : compositeScore < 35 ? 'BEARISH' : 'NEUTRAL'
      }
    }
  }