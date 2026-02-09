import { useState, useEffect } from 'react'
import * as tf from '@tensorflow/tfjs'
import { ArrowLeft, Brain, Download, Upload } from 'lucide-react'
import { Link } from 'react-router-dom'
import { MLPredictor } from '../services/mlModel'

export default function MLTrainingPage() {
  const [mlModel] = useState(() => new MLPredictor())
  const [status, setStatus] = useState('idle') // idle, training, trained, error
  const [progress, setProgress] = useState('')
  const [modelInfo, setModelInfo] = useState(null)
  const [trainingMode, setTrainingMode] = useState('lstm') // lstm, ensemble

  useEffect(() => {
    checkExistingModel()
  }, [])

  const checkExistingModel = async () => {
    const loaded = await mlModel.loadModel()
    if (loaded) {
      setStatus('trained')
      setModelInfo({
        trained: true,
        date: localStorage.getItem('model-trained-date') || 'Unknown'
      })
    }
  }

  const startTraining = async () => {
    setStatus('training')
    
    try {
      if (trainingMode === 'ensemble') {
        setProgress('Обучаем 5 моделей Ensemble...')
        
        // Сначала обучаем базовую LSTM если не обучена
        if (!mlModel.isTrained) {
          setProgress('Сначала обучаем базовую LSTM...')
          await mlModel.train()
        }
        
        // Получаем данные для ensemble
        setProgress('Подготавливаем данные для Ensemble...')
        const { features, labels } = await mlModel.prepareTrainingData()
        const normalizedFeatures = mlModel.normalizeData(features)
        
        const splitIndex = Math.floor(features.length * 0.8)
        const xTrain = tf.tensor3d(normalizedFeatures.slice(0, splitIndex))
        const yTrain = tf.tensor2d(labels.slice(0, splitIndex))
        const xTest = tf.tensor3d(normalizedFeatures.slice(splitIndex))
        const yTest = tf.tensor2d(labels.slice(splitIndex))
        
        setProgress('Обучаем GRU, CNN, Dense, Hybrid...')
        await mlModel.ensemble.trainAll(xTrain, yTrain, xTest, yTest)
        
        xTrain.dispose()
        yTrain.dispose()
        xTest.dispose()
        yTest.dispose()
        
        setProgress('Сохраняем Ensemble...')
        await mlModel.ensemble.saveAll()
        
        localStorage.setItem('ensemble-trained-date', new Date().toLocaleString('ru-RU'))
        
        setStatus('trained')
        setModelInfo({
          trained: true,
          date: new Date().toLocaleString('ru-RU'),
          type: 'Ensemble (5 моделей)'
        })
      } else {
        setProgress('Собираем исторические данные...')
        const success = await mlModel.train()
        
        if (success) {
          setProgress('Сохраняем модель...')
          await mlModel.saveModel()
          localStorage.setItem('model-trained-date', new Date().toLocaleString('ru-RU'))
          
          setStatus('trained')
          setModelInfo({
            trained: true,
            date: new Date().toLocaleString('ru-RU'),
            type: 'LSTM'
          })
        } else {
          setStatus('error')
          setProgress('Ошибка: недостаточно данных')
        }
      }
    } catch (err) {
      setStatus('error')
      setProgress(`Ошибка: ${err.message}`)
    }
  }

  return (
    <div className="text-white p-4 pb-24 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/settings"><ArrowLeft size={24} /></Link>
        <div>
          <h1 className="text-xl font-bold">ML Обучение</h1>
          <p className="text-xs text-gray-400">Нейросеть для предсказаний</p>
        </div>
      </div>

      {/* Training Mode Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setTrainingMode('lstm')}
          className={`flex-1 py-2 rounded-lg font-medium transition ${
            trainingMode === 'lstm' 
              ? 'bg-[#00E5FF] text-black' 
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          🧠 LSTM
        </button>
        <button
          onClick={() => setTrainingMode('ensemble')}
          className={`flex-1 py-2 rounded-lg font-medium transition ${
            trainingMode === 'ensemble' 
              ? 'bg-purple-500 text-white' 
              : 'bg-gray-800 text-gray-400'
          }`}
        >
          🎯 Ensemble
        </button>
      </div>

      {/* Status Card */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <div className="flex items-center gap-3 mb-3">
          <Brain size={32} className="text-[#00E5FF]" />
          <div>
            <p className="font-bold">LSTM Neural Network</p>
            <p className="text-xs text-gray-400">
              {status === 'idle' && 'Не обучена'}
              {status === 'training' && '🔄 Обучается...'}
              {status === 'trained' && '✅ Готова к работе'}
              {status === 'error' && '❌ Ошибка'}
            </p>
          </div>
        </div>

        {modelInfo && (
          <div className="bg-[#0A0A0A] rounded-lg p-3 text-sm">
            <div className="flex justify-between mb-2">
              <span className="text-gray-400">Статус:</span>
              <span className="text-green-500 font-bold">Обучена</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Дата:</span>
              <span>{modelInfo.date}</span>
            </div>
          </div>
        )}

        {status === 'training' && (
          <div className="mt-3">
            <div className="bg-[#0A0A0A] rounded-lg p-3">
              <p className="text-sm text-gray-400 mb-2">{progress}</p>
              <div className="w-full bg-gray-800 rounded-full h-2">
                <div className="bg-[#00E5FF] h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Что делает модель?</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Анализирует 10,000+ исторических свечей</li>
          <li>• Извлекает 100+ признаков с каждой свечи</li>
          <li>• Обучается предсказывать движение через 4 часа</li>
          <li>• Точность: 65-70% (цель)</li>
          <li>• Архитектура: LSTM (Long Short-Term Memory)</li>
        </ul>
      </div>

      {/* Stats */}
      <div className="bg-[#1A1A1A] rounded-xl p-4 mb-4 border border-gray-800">
        <h3 className="font-bold mb-3">Параметры</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-gray-400 mb-1">Монеты</p>
            <p className="font-bold">5 пар</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-gray-400 mb-1">Данные</p>
            <p className="font-bold">1000 свечей</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-gray-400 mb-1">Эпохи</p>
            <p className="font-bold">50</p>
          </div>
          <div className="bg-[#0A0A0A] p-3 rounded">
            <p className="text-gray-400 mb-1">Batch Size</p>
            <p className="font-bold">32</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {status !== 'trained' && (
          <button
            onClick={startTraining}
            disabled={status === 'training'}
            className={`w-full py-4 rounded-xl font-bold text-lg transition ${
              status === 'training'
                ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                : 'bg-[#00E5FF] text-black hover:bg-[#00D5EF]'
            }`}
          >
            {status === 'training' ? 'Обучается...' : '🧠 Обучить модель'}
          </button>
        )}

        {status === 'trained' && (
          <>
            <button
              onClick={startTraining}
              className="w-full bg-orange-400 hover:bg-orange-500 text-black py-3 rounded-xl font-medium transition"
            >
              🔄 Переобучить
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('localstorage://trading-lstm')
                localStorage.removeItem('trading-lstm-scaler')
                setStatus('idle')
                setModelInfo(null)
              }}
              className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 py-3 rounded-xl font-medium transition border border-red-500/30"
            >
              🗑️ Удалить модель
            </button>
          </>
        )}
      </div>

      {/* Warning */}
      <div className="mt-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3">
        <p className="text-xs text-yellow-500">
          ⚠️ Обучение может занять 2-5 минут. Не закрывайте страницу.
        </p>
      </div>
    </div>
  )
}