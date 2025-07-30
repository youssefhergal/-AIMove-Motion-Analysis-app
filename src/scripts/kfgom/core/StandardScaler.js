// StandardScaler class for data normalization
export class StandardScaler {
    constructor() {
        this.mean = null
        this.std = null
        this.fitted = false
    }

    fit(data) {
        if (!data || data.length === 0) {
            throw new Error('Data is empty or invalid')
        }

        // Handle both 1D and 2D arrays
        const is2D = Array.isArray(data[0])
        const numFeatures = is2D ? data[0].length : 1

        this.mean = new Array(numFeatures).fill(0)
        this.std = new Array(numFeatures).fill(0)

        if (is2D) {
            // 2D array case
            const numSamples = data.length

            // Calculate mean
            for (let i = 0; i < numSamples; i++) {
                for (let j = 0; j < numFeatures; j++) {
                    this.mean[j] += data[i][j]
                }
            }
            for (let j = 0; j < numFeatures; j++) {
                this.mean[j] /= numSamples
            }

            // Calculate standard deviation
            for (let i = 0; i < numSamples; i++) {
                for (let j = 0; j < numFeatures; j++) {
                    this.std[j] += Math.pow(data[i][j] - this.mean[j], 2)
                }
            }
            for (let j = 0; j < numFeatures; j++) {
                this.std[j] = Math.sqrt(this.std[j] / numSamples)
                // Avoid division by zero
                if (this.std[j] === 0) {
                    this.std[j] = 1e-8
                }
            }
        } else {
            // 1D array case
            const numSamples = data.length

            // Calculate mean
            this.mean[0] = data.reduce((sum, val) => sum + val, 0) / numSamples

            // Calculate standard deviation
            this.std[0] = Math.sqrt(
                data.reduce((sum, val) => sum + Math.pow(val - this.mean[0], 2), 0) / numSamples
            )
            
            // Avoid division by zero
            if (this.std[0] === 0) {
                this.std[0] = 1e-8
            }
        }

        this.fitted = true
        console.log('✅ StandardScaler fitted:', {
            mean: this.mean,
            std: this.std,
            numFeatures
        })
    }

    transform(data) {
        if (!this.fitted) {
            throw new Error('StandardScaler must be fitted before transforming data')
        }

        if (!data || data.length === 0) {
            throw new Error('Data is empty or invalid')
        }

        // Handle both 1D and 2D arrays
        const is2D = Array.isArray(data[0])
        const numFeatures = is2D ? data[0].length : 1

        if (is2D) {
            // 2D array case
            return data.map(row => {
                const transformedRow = []
                for (let j = 0; j < numFeatures; j++) {
                    transformedRow.push((row[j] - this.mean[j]) / this.std[j])
                }
                return transformedRow
            })
        } else {
            // 1D array case
            return data.map(val => (val - this.mean[0]) / this.std[0])
        }
    }

    fitTransform(data) {
        this.fit(data)
        return this.transform(data)
    }

    inverseTransform(data) {
        if (!this.fitted) {
            throw new Error('StandardScaler must be fitted before inverse transforming data')
        }

        if (!data || data.length === 0) {
            throw new Error('Data is empty or invalid')
        }

        // Handle both 1D and 2D arrays
        const is2D = Array.isArray(data[0])
        const numFeatures = is2D ? data[0].length : 1

        if (is2D) {
            // 2D array case
            return data.map(row => {
                const inverseRow = []
                for (let j = 0; j < numFeatures; j++) {
                    inverseRow.push(row[j] * this.std[j] + this.mean[j])
                }
                return inverseRow
            })
        } else {
            // 1D array case
            return data.map(val => val * this.std[0] + this.mean[0])
        }
    }

    getParams() {
        return {
            mean: this.mean,
            std: this.std,
            fitted: this.fitted
        }
    }

    setParams(params) {
        this.mean = params.mean
        this.std = params.std
        this.fitted = params.fitted
    }
} 