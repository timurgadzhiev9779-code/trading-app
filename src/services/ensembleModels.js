import * as tf from '@tensorflow/tfjs'

export class EnsemblePredictor {
  constructor() {
    this.models = {
      lstm: null,      // Уже есть
      gru: null,       // Быстрее LSTM
      cnn: null,       // Для паттернов
      dense: null,     // Простая полносвязная
      hybrid: null     // CNN + LSTM
    }
    this.isReady = false
    this.weights = {
      lstm: 0.3,
      gru: 0.25,
      cnn: 0.2,
      dense: 0.1,
      hybrid: 0.15
    }
  }

  // 1. GRU модель (быстрая альтернатива LSTM)
  createGRUModel(inputShape) {
    const model = tf.sequential()
    
    model.add(tf.layers.gru({
      units: 128,
      returnSequences: true,
      inputShape: inputShape
    }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.gru({
      units: 64,
      returnSequences: false
    }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })
    
    console.log('✅ GRU модель создана')
    return model
  }

  // 2. CNN модель (для распознавания паттернов)
  createCNNModel(inputShape) {
    const model = tf.sequential()
    
    // 1D Convolutional слои
    model.add(tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      inputShape: inputShape
    }))
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }))
    
    model.add(tf.layers.conv1d({
      filters: 128,
      kernelSize: 3,
      activation: 'relu'
    }))
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }))
    
    model.add(tf.layers.flatten())
    model.add(tf.layers.dropout({ rate: 0.3 }))
    
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })
    
    console.log('✅ CNN модель создана')
    return model
  }

  // 3. Dense модель (простая полносвязная)
  createDenseModel(inputShape) {
    const model = tf.sequential()
    
    model.add(tf.layers.flatten({ inputShape: inputShape }))
    
    model.add(tf.layers.dense({ units: 256, activation: 'relu' }))
    model.add(tf.layers.dropout({ rate: 0.3 }))
    
    model.add(tf.layers.dense({ units: 128, activation: 'relu' }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.dense({ units: 64, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })
    
    console.log('✅ Dense модель создана')
    return model
  }

  // 4. Hybrid модель (CNN + LSTM)
  createHybridModel(inputShape) {
    const model = tf.sequential()
    
    // CNN часть
    model.add(tf.layers.conv1d({
      filters: 64,
      kernelSize: 3,
      activation: 'relu',
      inputShape: inputShape
    }))
    model.add(tf.layers.maxPooling1d({ poolSize: 2 }))
    
    // LSTM часть
    model.add(tf.layers.lstm({
      units: 64,
      returnSequences: false
    }))
    model.add(tf.layers.dropout({ rate: 0.2 }))
    
    model.add(tf.layers.dense({ units: 32, activation: 'relu' }))
    model.add(tf.layers.dense({ units: 3, activation: 'softmax' }))
    
    model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'categoricalCrossentropy',
      metrics: ['accuracy']
    })
    
    console.log('✅ Hybrid модель создана')
    return model
  }

  // Обучение всех моделей
  async trainAll(trainData, trainLabels, testData, testLabels) {
    console.log('🎓 Обучаем Ensemble (5 моделей)...')
    
    const inputShape = [trainData.shape[1], trainData.shape[2]]
    
    // Создаём модели
    this.models.gru = this.createGRUModel(inputShape)
    this.models.cnn = this.createCNNModel(inputShape)
    this.models.dense = this.createDenseModel(inputShape)
    this.models.hybrid = this.createHybridModel(inputShape)
    
    const epochs = 30
    const batchSize = 32
    
    // Обучаем параллельно
    const promises = []
    
    for (const [name, model] of Object.entries(this.models)) {
      if (name === 'lstm') continue // LSTM уже обучена
      
      console.log(`  Обучаем ${name.toUpperCase()}...`)
      
      promises.push(
        model.fit(trainData, trainLabels, {
          epochs,
          batchSize,
          validationData: [testData, testLabels],
          verbose: 0,
          callbacks: {
            onEpochEnd: (epoch, logs) => {
              if ((epoch + 1) % 10 === 0) {
                console.log(`    ${name}: epoch ${epoch + 1}/${epochs} - acc: ${logs.acc.toFixed(4)}, val_acc: ${logs.val_acc.toFixed(4)}`)
              }
            }
          }
        })
      )
    }
    
    await Promise.all(promises)
    
    this.isReady = true
    console.log('✅ Ensemble обучен!')
    
    return true
  }

  // Предсказание ансамблем (weighted voting)
  async predict(input, lstmPrediction) {
    if (!this.isReady) {
      console.log('⚠️ Ensemble не обучен')
      return lstmPrediction
    }
    
    try {
      const predictions = {}
      
      // Получаем предсказания от каждой модели
      for (const [name, model] of Object.entries(this.models)) {
        if (name === 'lstm') {
          // Используем уже полученное предсказание LSTM/Multi-TF
          predictions.lstm = [
            lstmPrediction.probability.down,
            lstmPrediction.probability.flat,
            lstmPrediction.probability.up
          ]
        } else if (model) {
          const pred = model.predict(input)
          const probs = await pred.data()
          predictions[name] = Array.from(probs)
          pred.dispose()
        }
      }
      
      // Weighted voting
      const finalProbs = [0, 0, 0] // [down, flat, up]
      
      for (const [name, probs] of Object.entries(predictions)) {
        const weight = this.weights[name]
        finalProbs[0] += probs[0] * weight
        finalProbs[1] += probs[1] * weight
        finalProbs[2] += probs[2] * weight
      }
      
      const maxProb = Math.max(...finalProbs)
      const direction = finalProbs[2] === maxProb ? 'UP' :
                       finalProbs[0] === maxProb ? 'DOWN' : 'FLAT'
      const confidence = Math.round(maxProb * 100)
      
      console.log(`🎯 Ensemble голосование:`, {
        lstm: (predictions.lstm[2] * 100).toFixed(0),
        gru: predictions.gru ? (predictions.gru[2] * 100).toFixed(0) : '-',
        cnn: predictions.cnn ? (predictions.cnn[2] * 100).toFixed(0) : '-',
        dense: predictions.dense ? (predictions.dense[2] * 100).toFixed(0) : '-',
        hybrid: predictions.hybrid ? (predictions.hybrid[2] * 100).toFixed(0) : '-',
        final: confidence
      })
      
      return {
        direction,
        confidence,
        probability: {
          down: finalProbs[0],
          flat: finalProbs[1],
          up: finalProbs[2]
        },
        ensemble: true,
        votes: predictions
      }
    } catch (err) {
      console.error('Ensemble prediction error:', err)
      return lstmPrediction
    }
  }

  // Сохранение всех моделей
  async saveAll() {
    for (const [name, model] of Object.entries(this.models)) {
      if (model && name !== 'lstm') {
        await model.save(`localstorage://ensemble-${name}`)
      }
    }
    localStorage.setItem('ensemble-weights', JSON.stringify(this.weights))
    console.log('💾 Ensemble сохранён')
  }

  // Загрузка всех моделей
  async loadAll() {
    try {
      for (const name of ['gru', 'cnn', 'dense', 'hybrid']) {
        this.models[name] = await tf.loadLayersModel(`localstorage://ensemble-${name}`)
      }
      
      const savedWeights = localStorage.getItem('ensemble-weights')
      if (savedWeights) {
        this.weights = JSON.parse(savedWeights)
      }
      
      this.isReady = true
      console.log('✅ Ensemble загружен')
      return true
    } catch (err) {
      console.log('⚠️ Ensemble не найден')
      return false
    }
  }

  // Адаптация весов на основе производительности
  adaptWeights(performanceHistory) {
    if (performanceHistory.length < 20) return
    
    // Считаем точность каждой модели
    const accuracy = {}
    
    for (const model of ['lstm', 'gru', 'cnn', 'dense', 'hybrid']) {
      const correct = performanceHistory.filter(h => 
        h.actual === h.predictions[model]
      ).length
      
      accuracy[model] = correct / performanceHistory.length
    }
    
    // Нормализуем в веса
    const totalAcc = Object.values(accuracy).reduce((a, b) => a + b, 0)
    
    for (const model in accuracy) {
      this.weights[model] = accuracy[model] / totalAcc
    }
    
    console.log('📊 Веса обновлены:', this.weights)
    localStorage.setItem('ensemble-weights', JSON.stringify(this.weights))
  }

  // Записываем результат для адаптации
  recordPrediction(predictions, actual) {
    const history = JSON.parse(localStorage.getItem('ensemble-history') || '[]')
    
    history.push({
      timestamp: Date.now(),
      predictions,
      actual
    })
    
    // Храним последние 100
    const trimmed = history.slice(-100)
    localStorage.setItem('ensemble-history', JSON.stringify(trimmed))
    
    // Адаптируем каждые 20 записей
    if (trimmed.length % 20 === 0) {
      this.adaptWeights(trimmed)
    }
  }
}