import * as tf from '@tensorflow/tfjs'
import { EnsemblePredictor } from './ensembleModels'
import { FeatureEngineering } from './featureEngineering'
import { DataCollector } from './dataCollector'

export class MLPredictor {
  constructor() {
    this.model = null
    this.isReady = false
    this.isTrained = false
    this.featureEngine = new FeatureEngineering()
    this.dataCollector = new DataCollector()
    this.scaler = { mean: null, std: null }
    this.multiTimeframe = true
    this.ensemble = new EnsemblePredictor()
  }

  // Создание Multi-Timeframe LSTM
  createMultiTimeframeLSTM(inputShapes) {
    const input15m = tf.input({ shape: inputShapes['15m'] })
    const input1h = tf.input({ shape: inputShapes['1h'] })
    const input4h = tf.input({ shape: inputShapes['4h'] })
    const input1d = tf.input({ shape: inputShapes['1d'] })
    const input1w = tf.input({ shape: inputShapes['1w'] })

    const lstm15m = tf.layers.lstm({ units: 64, returnSequences: false }).apply(input15m)
    const lstm1h = tf.layers.lstm({ units: 64, returnSequences: false }).apply(input1h)
    const lstm4h = tf.layers.lstm({ units: 64, returnSequences: false }).apply(input4h)
    const lstm1d = tf.layers.lstm({ units: 32, returnSequences: false }).apply(input1d)
    const lstm1w = tf.layers.lstm({ units: 32, returnSequences: false }).apply(input1w)

    const concatenated = tf.layers.concatenate().apply([
      lstm15m, lstm1h, lstm4h, lstm1d, lstm1w
    ])

    let dense = tf.layers.dense({ units: 128, activation: 'relu' }).apply(concatenated)
    dense = tf.layers.dropout({ rate: 0.3 }).apply(dense)
    dense = tf.layers.dense({ units: 64, activation: 'relu' }).apply(dense)
    dense = tf.layers.dropout({ rate: 0.2 }).apply(dense)

    const output = tf.layers.dense({ units: 3, activation: 'softmax' }).apply(dense)

    const model = tf.model({
      inputs: [input15m, input1h, input4h, input1d, input1w],
      outputs: output
    })

    model.compile({
      optimizer: tf.train.adam(0.0005),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })

    console.log('🧠 Multi-Timeframe LSTM создана')
    model.summary()

    return model
  }

  // Создание обычной LSTM модели
  createLSTMModel(inputShape) {
    const model = tf.sequential()
    
    model.add(tf.layers.lstm({
      units: 128,
      returnSequences: true,
      inputShape: inputShape
    }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: false
    }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })
    
    console.log('🧠 LSTM модель создана')
    model.summary()
    
    return model
  }

  // Подготовка данных для обучения
  async prepareTrainingData(symbols = ['BTC', 'ETH', 'SOL', 'AVAX', 'LINK']) {
    console.log('📥 Собираем данные...')
    
    const dataset = await this.dataCollector.collectMultipleCoins(symbols, '1h', 1000)
    
    const allFeatures = []
    const allLabels = []
    
    for (const symbol in dataset) {
      const candles = dataset[symbol]
      
      for (let i = 20; i < candles.length - 4; i++) {
        const window = candles.slice(i - 20, i)
        
        const sequence = window.map(c => {
          const miniWindow = candles.slice(Math.max(0, i - 100), i)
          const features = this.featureEngine.extractFeatures(miniWindow)
          return features ? Object.values(features) : null
        }).filter(Boolean)
        
        if (sequence.length === 20) {
          const current = candles[i].close
          const future = candles[i + 4].close
          const change = (future - current) / current
          
          let label
          if (change > 0.015) label = [0, 0, 1]
          else if (change < -0.015) label = [1, 0, 0]
          else label = [0, 1, 0]
          
          allFeatures.push(sequence)
          allLabels.push(label)
        }
      }
    }
    
    console.log(`✅ Собрано ${allFeatures.length} примеров`)
    
    return { features: allFeatures, labels: allLabels }
  }

  // Нормализация данных
  normalizeData(data) {
    const flatData = data.flat(2)
    
    if (!this.scaler.mean) {
      this.scaler.mean = flatData.reduce((a, b) => a + b) / flatData.length
      
      const squaredDiffs = flatData.map(x => Math.pow(x - this.scaler.mean, 2))
      this.scaler.std = Math.sqrt(squaredDiffs.reduce((a, b) => a + b) / flatData.length)
    }
    
    return data.map(sequence => 
      sequence.map(features => 
        features.map(f => (f - this.scaler.mean) / (this.scaler.std + 1e-8))
      )
    )
  }

  // Обучение модели
  async train() {
    console.log('🎓 Начинаем обучение...')
    
    const { features, labels } = await this.prepareTrainingData()
    
    if (features.length < 100) {
      console.error('❌ Недостаточно данных для обучения')
      return false
    }
    
    const normalizedFeatures = this.normalizeData(features)
    
    const splitIndex = Math.floor(features.length * 0.8)
    const trainFeatures = normalizedFeatures.slice(0, splitIndex)
    const trainLabels = labels.slice(0, splitIndex)
    const testFeatures = normalizedFeatures.slice(splitIndex)
    const testLabels = labels.slice(splitIndex)
    
    const sequenceLength = trainFeatures[0].length
    const featureCount = trainFeatures[0][0].length
    this.model = this.createLSTMModel([sequenceLength, featureCount])
    
    const xTrain = tf.tensor3d(trainFeatures)
    const yTrain = tf.tensor2d(trainLabels)
    const xTest = tf.tensor3d(testFeatures)
    const yTest = tf.tensor2d(testLabels)
    
    await this.model.fit(xTrain, yTrain, {
      epochs: 50,
      batchSize: 32,
      validationData: [xTest, yTest],
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, acc = ${logs.acc.toFixed(4)}, val_acc = ${logs.val_acc.toFixed(4)}`)
        }
      }
    })
    
    xTrain.dispose()
    yTrain.dispose()
    xTest.dispose()
    yTest.dispose()
    
    this.isTrained = true
    this.isReady = true
    
    console.log('✅ Обучение завершено!')
    
    return true
  }

  // Предсказание
  async predict(candles, indicators) {
    if (!this.isReady || !this.isTrained) {
      console.log('⚠️ Модель не обучена, используем эвристику')
      return this.fallbackPrediction(indicators)
    }
    
    try {
      const sequence = []
      for (let i = Math.max(0, candles.length - 20); i < candles.length; i++) {
        const window = candles.slice(Math.max(0, i - 100), i + 1)
        const features = this.featureEngine.extractFeatures(window)
        if (features) sequence.push(Object.values(features))
      }
      
      if (sequence.length !== 20) {
        return this.fallbackPrediction(indicators)
      }
      
      const normalized = sequence.map(features => 
        features.map(f => (f - this.scaler.mean) / (this.scaler.std + 1e-8))
      )
      
      const input = tf.tensor3d([normalized])
      const prediction = this.model.predict(input)
      const probabilities = await prediction.data()
      
      prediction.dispose()
      
      const direction = probabilities[2] > probabilities[0] ? 'UP' : 
                       probabilities[0] > probabilities[2] ? 'DOWN' : 'FLAT'
      const confidence = Math.max(...probabilities) * 100
      
      const basePrediction = {
        direction,
        confidence: Math.round(confidence),
        probability: {
          down: probabilities[0],
          flat: probabilities[1],
          up: probabilities[2]
        }
      }
      
      // Если Ensemble обучен - используем его
      if (this.ensemble.isReady) {
        const ensemblePrediction = await this.ensemble.predict(input, basePrediction)
        input.dispose()
        return ensemblePrediction
      }
      
      input.dispose()
      return basePrediction
    } catch (err) {
      console.error('ML prediction error:', err)
      return this.fallbackPrediction(indicators)
    }
  }

  // Запасной вариант
  fallbackPrediction(indicators) {
    let score = 50
    
    if (indicators.rsi?.value < 30) score += 15
    else if (indicators.rsi?.value > 70) score -= 15
    else if (indicators.rsi?.value > 40 && indicators.rsi?.value < 60) score += 5
    
    if (indicators.macd?.histogram > 0) score += 10
    if (indicators.macd?.value > indicators.macd?.signal) score += 10
    
    if (indicators.ema20 > indicators.ema50) score += 15
    if (indicators.adx?.value > 25) score += 10
    if (indicators.volume?.signal === 'HIGH') score += 10
    
    score = Math.min(95, Math.max(0, score))
    
    return {
      direction: score > 60 ? 'UP' : score < 40 ? 'DOWN' : 'FLAT',
      confidence: score,
      probability: {
        up: score / 100,
        flat: 0.5,
        down: (100 - score) / 100
      }
    }
  }

  // Сохранить модель
  async saveModel(name = 'trading-lstm') {
    if (!this.model) return
    await this.model.save(`localstorage://${name}`)
    localStorage.setItem(`${name}-scaler`, JSON.stringify(this.scaler))
    console.log('💾 Модель сохранена')
  }

  // Загрузить модель
  async loadModel(name = 'trading-lstm') {
    try {
      this.model = await tf.loadLayersModel(`localstorage://${name}`)
      const scalerData = localStorage.getItem(`${name}-scaler`)
      if (scalerData) {
        this.scaler = JSON.parse(scalerData)
      }
      this.isTrained = true
      this.isReady = true
      console.log('✅ Модель загружена')
      return true
    } catch (err) {
      console.log('⚠️ Модель не найдена, нужно обучить')
      return false
    }
  }
}