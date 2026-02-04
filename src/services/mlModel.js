import * as tf from '@tensorflow/tfjs'

export class MLPredictor {
  constructor() {
    this.model = null
    this.isReady = false
    this.scaler = { mean: {}, std: {} }
  }

  // Подготовка признаков
  prepareFeatures(candles, indicators) {
    const features = []
    
    // Последние 20 свечей
    const recent = candles.slice(-20)
    
    // Price features (normalized)
    recent.forEach(c => {
      features.push(
        parseFloat(c[4]), // close
        parseFloat(c[2]), // high
        parseFloat(c[3]), // low
        parseFloat(c[5])  // volume
      )
    })
    
    // Indicators
    features.push(
      indicators.rsi.value,
      indicators.macd.value,
      indicators.macd.signal,
      indicators.macd.histogram,
      indicators.adx.value,
      indicators.atr,
      indicators.ema20,
      indicators.ema50,
      indicators.bb.upper,
      indicators.bb.middle,
      indicators.bb.lower
    )
    
    return features
  }

  // Нормализация данных (Z-score)
  normalize(features) {
    return features.map((val, i) => {
      const key = `f${i}`
      const mean = this.scaler.mean[key] || val
      const std = this.scaler.std[key] || 1
      return (val - mean) / (std + 1e-8)
    })
  }

  // Создание простой модели (пока без обучения)
  async createModel() {
    const model = tf.sequential({
      layers: [
        tf.layers.dense({ inputShape: [91], units: 128, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 64, activation: 'relu' }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 32, activation: 'relu' }),
        tf.layers.dense({ units: 3, activation: 'softmax' }) // [DOWN, FLAT, UP]
      ]
    })

    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    this.model = model
    this.isReady = true
    console.log('✅ ML модель создана')
  }

  // Предсказание (mock пока модель не обучена)
  async predict(candles, indicators) {
    if (!this.isReady) {
      await this.createModel()
    }

    try {
      const features = this.prepareFeatures(candles, indicators)
      const normalized = this.normalize(features)
      
      // Пока модель не обучена - используем эвристику
      // После обучения будет: const prediction = this.model.predict(...)
      
      // Простая эвристика на основе индикаторов
      let score = 50
      
      // RSI
      if (indicators.rsi.value < 30) score += 15
      else if (indicators.rsi.value > 70) score -= 15
      else if (indicators.rsi.value > 40 && indicators.rsi.value < 60) score += 5
      
      // MACD
      if (indicators.macd.histogram > 0) score += 10
      if (indicators.macd.value > indicators.macd.signal) score += 10
      
      // Trend
      if (indicators.ema20 > indicators.ema50) score += 15
      
      // ADX
      if (indicators.adx.value > 25) score += 10
      
      // Volume
      if (indicators.volume.signal === 'HIGH') score += 10
      
      score = Math.min(100, Math.max(0, score))
      
      return {
        direction: score > 60 ? 'UP' : score < 40 ? 'DOWN' : 'FLAT',
        confidence: score,
        probability: {
          up: score / 100,
          flat: (100 - Math.abs(50 - score)) / 100,
          down: (100 - score) / 100
        }
      }
    } catch (err) {
      console.error('ML prediction error:', err)
      return { direction: 'FLAT', confidence: 50 }
    }
  }

  // Обучение модели (будем делать позже на историческиx данных)
  async train(dataset) {
    // TODO: Implement training
    console.log('Training not implemented yet')
  }
}