import * as tf from "@tensorflow/tfjs"
import { DataFrame } from "dataframe-js"
import * as aq from "arquero"
import { samplingFactor } from "./store"
const toFourDecimals = (input) => {
	if (Array.isArray(input)) {
		return input.map(toFourDecimals)
	} else if (typeof input === "number") {
		return parseFloat(input.toFixed(4))
	}
	return input // Return the value unchanged if it's not a number or array
}

// Custom TensorFlow.js Layer
class Lambda extends tf.layers.Layer {
	constructor(config) {
		super(config)
	}

	computeOutputShape(inputShape) {
		return [inputShape[1][0], inputShape[1][2]]
	}

	call(inputs) {
		const coef = inputs[0]
		const inp = inputs[1]
		const inp2 = inp.expandDims(1)
		const m1 = coef.mul(inp2)
		const m2 = m1.sum([2, 3])
		return m2.expandDims(-2)
	}

	static get className() {
		return "Lambda"
	}
}

tf.serialization.registerClass(Lambda)

// Min-Max Scaling Function
function minMaxScaling(array, minRange = -1, maxRange = 1) {
	const minVal = array.reduce(
		(acc, row) => row.map((v, i) => Math.min(v, acc[i])),
		Array(array[0].length).fill(Infinity)
	)
	const maxVal = array.reduce(
		(acc, row) => row.map((v, i) => Math.max(v, acc[i])),
		Array(array[0].length).fill(-Infinity)
	)

	const X_std = array.map((row) =>
		row.map(
			(value, index) =>
				(value - minVal[index]) / (maxVal[index] - minVal[index])
		)
	)
	const X_scaled = X_std.map((row) =>
		row.map((value) => value * (maxRange - minRange) + minRange)
	)

	return { scaled: X_scaled, minVal, maxVal }
}

// Reverse Min-Max Scaling Function
function reverseMinMaxScaling(
	scaledArray,
	minVal,
	maxVal,
	minRange = -1,
	maxRange = 1
) {
	const X_std = scaledArray.map((row) =>
		row.map((value) => (value - minRange) / (maxRange - minRange))
	)
	const X_original = X_std.map((row) =>
		row.map(
			(value, index) =>
				value * (maxVal[index] - minVal[index]) + minVal[index]
		)
	)

	return X_original
}

// Variables Initialization
const variables = [
	"Spine_Xrotation",
	"Spine_Yrotation",
	"Spine_Zrotation",
	"Spine1_Xrotation",
	"Spine1_Yrotation",
	"Spine1_Zrotation",
	"Spine2_Xrotation",
	"Spine2_Yrotation",
	"Spine2_Zrotation",
	"Spine3_Xrotation",
	"Spine3_Yrotation",
	"Spine3_Zrotation",
	"Hips_Xrotation",
	"Hips_Yrotation",
	"Hips_Zrotation",
	"Neck_Xrotation",
	"Neck_Yrotation",
	"Neck_Zrotation",
	"Head_Xrotation",
	"Head_Yrotation",
	"Head_Zrotation",
	"LeftArm_Xrotation",
	"LeftArm_Yrotation",
	"LeftArm_Zrotation",
	"LeftForeArm_Xrotation",
	"LeftForeArm_Yrotation",
	"LeftForeArm_Zrotation",
	"RightArm_Xrotation",
	"RightArm_Yrotation",
	"RightArm_Zrotation",
	"RightForeArm_Xrotation",
	"RightForeArm_Yrotation",
	"RightForeArm_Zrotation",
	"LeftShoulder_Xrotation",
	"LeftShoulder_Yrotation",
	"LeftShoulder_Zrotation",
	"LeftShoulder2_Xrotation",
	"LeftShoulder2_Yrotation",
	"LeftShoulder2_Zrotation",
	"RightShoulder_Xrotation",
	"RightShoulder_Yrotation",
	"RightShoulder_Zrotation",
	"RightShoulder2_Xrotation",
	"RightShoulder2_Yrotation",
	"RightShoulder2_Zrotation",
	"LeftUpLeg_Xrotation",
	"LeftUpLeg_Yrotation",
	"LeftUpLeg_Zrotation",
	"LeftLeg_Xrotation",
	"LeftLeg_Yrotation",
	"LeftLeg_Zrotation",
	"RightUpLeg_Xrotation",
	"RightUpLeg_Yrotation",
	"RightUpLeg_Zrotation",
	"RightLeg_Xrotation",
	"RightLeg_Yrotation",
	"RightLeg_Zrotation",
]

const varSub = [
	"sp0x",
	"sp0y",
	"sp0z",
	"sp1x",
	"sp1y",
	"sp1z",
	"sp2x",
	"sp2y",
	"sp2z",
	"sp3x",
	"sp3y",
	"sp3z",
	"hipx",
	"hipy",
	"hipz",
	"nex",
	"ney",
	"nez",
	"hex",
	"hey",
	"hez",
	"lax",
	"lay",
	"laz",
	"lfax",
	"lfay",
	"lfaz",
	"rax",
	"ray",
	"raz",
	"rfax",
	"rfay",
	"rfaz",
	"lshx",
	"lshy",
	"lshz",
	"lsh2x",
	"lsh2y",
	"lsh2z",
	"rshx",
	"rshy",
	"rshz",
	"rsh2x",
	"rsh2y",
	"rsh2z",
	"lupx",
	"lupy",
	"lupz",
	"llx",
	"lly",
	"llz",
	"rupx",
	"rupy",
	"rupz",
	"rlx",
	"rly",
	"rlz",
]

// Generate Variables for Time Steps
const variables_2 = variables.map((sub) => sub + "(t-2)")
const variables_3 = variables.map((sub) => sub + "(t-3)")

// Concatenate Variables
const coef_labels = [...variables, ...variables_2, ...variables_3]

// Create varCoef Array
let varCoef = []
for (let j of varSub) {
	const v = coef_labels.map((sub) => j + "_" + sub)
	varCoef = varCoef.concat(v)
}

async function do_gom(val) {
	try {
		console.log("start_predicted!!")

		// Scale the values
		const { scaled: val_scaled, minVal, maxVal } = minMaxScaling(val)

		// Create sliding window indices
		const wx = Array.from({ length: val.length - 2 }, (_, w) => [
			w,
			w + 1,
			w + 2,
		])

		// Prepare dataX tensor
		const dX = wx.map((indices) =>
			indices.map((index) => val_scaled[index])
		)
		const dataX = tf.tensor(dX)

		// Load model and make predictions
		const modelPath = "saved_model/model.json"
		const model = await tf.loadLayersModel(modelPath)
		const outputs = model.predict(dataX)

		// Assuming outputs is an array of tensors
		const [output1, output2] = Array.isArray(outputs) ? outputs : [outputs]

		function downsampleTensorByRow(tensor, n) {
			const [originalSize, ...rest] = tensor.shape
			const downsampledIndices = Array.from(
				{ length: Math.ceil(originalSize / n) },
				(_, i) => i * n
			)
			return tf.gather(tensor, downsampledIndices)
		}

		// Κάνουμε downsampling παίρνοντας κάθε 18-στη γραμμή
		const rowsToSkip = samplingFactor()

		const downsampledTensor = downsampleTensorByRow(output2, rowsToSkip)

		console.log("tff!", output2.shape)
		console.log("tff! reshaped", downsampledTensor.shape)

		// Process predictions
		const reshapedOutput1 = output1.reshape([dataX.shape[0], 57])
		const pred_1_step_scaled = await reshapedOutput1.array()

		const pred_1_step = reverseMinMaxScaling(
			pred_1_step_scaled,
			minVal,
			maxVal
		)
		console.log("reformed!!!")

		const startTime = new Date()

		// df_pred.print()

		function rgbToBgr(tensor) {
			const transposed = tensor.transpose([0, 1, 3, 2])

			const [r, g, b] = tf.split(transposed, 3, -1)

			const bgrTransposed = tf.concat([b, g, r], -1)

			return bgrTransposed
				.transpose([0, 1, 3, 2])
				.reshape([downsampledTensor.shape[0], 9747])
		}

		function downsampleArrayByRow(originalArray, n) {
			let downsampledArray = []
			for (let i = 0; i < originalArray.length; i += n) {
				downsampledArray.push(originalArray[i])
			}
			return downsampledArray
		}

		// let coef_scaled_mat = await rgbToBgr(output2)
		let coef_scaled_mat = await rgbToBgr(downsampledTensor)

		coef_scaled_mat = await coef_scaled_mat.array()

		let downsampledArray = downsampleArrayByRow(
			pred_1_step,
			samplingFactor()
		)

		let df_pred = aq.from(pred_1_step)

		df_pred = df_pred.rename(aq.names(variables))

		let oversampled = interpolate2DArray(
			downsampledArray,
			pred_1_step.length
		)

		let df_pred_sampled = aq.from(oversampled)

		df_pred_sampled = df_pred_sampled.rename(aq.names(variables))

		let df_coef = aq.from(coef_scaled_mat)

		df_coef = df_coef.rename(aq.names(varCoef))

		const endTime = new Date()

		console.log("loading Time: ", endTime - startTime)
		return { df_coef, df_pred, df_pred_sampled }
	} catch (error) {
		console.error("Error loading JSON file:", error)
	}
}

export { do_gom }

// do_gom().then(({ df_coef, df_pred }) => {
// 	df_coef.print()
// 	df_pred.print()
// })

// async function pred_ang_coef(val, coef_modded) {
// 	const { scaled: ned, minVal, maxVal } = minMaxScaling(val)

// 	let wx = []
// 	for (let w = 0; w <= val.length - 3; w++) {
// 		wx.push([0 + w, 1 + w, 2 + w])
// 	}

// 	const dX = wx.map((indices) => indices.map((index) => ned[index]))
// 	const dataX = tf.tensor(dX)

// 	// Reshape coef_mod to match the target shape
// 	let coef_modT = tf
// 		.tensor(coef_unscaled)
// 		.reshape([coef_unscaled.length, 57, 3, 57])
// 	coef_modT = coef_modT.reverse(2)

// 	// Initialize p_mod with the first slice of dataX_mod
// 	let p_mod = dataX
// 		.slice([0, 0, 0], [1, dataX.shape[1], dataX.shape[2]])
// 		.squeeze()

// 	for (let t = 1; t < dataX.shape[0] - 1; t++) {
// 		const coeff = coef_modT
// 			.slice(
// 				[t, 0, 0, 0],
// 				[1, coef_modT.shape[1], coef_modT.shape[2], coef_modT.shape[3]]
// 			)
// 			.squeeze()
// 		const inp = dataX
// 			.slice([t, 0, 0], [1, dataX.shape[1], dataX.shape[2]])
// 			.reshape([1, dataX.shape[1], dataX.shape[2]])

// 		// Perform the Hadamard product and sum along the correct axes
// 		const yS = tf.tidy(() => {
// 			const inpExpanded = inp.expandDims(1)
// 			const product = coeff.mul(inpExpanded)
// 			const summed = product.sum([2, 3])
// 			return summed.squeeze()
// 		})

// 		// Concatenate the result with p_mod
// 		p_mod = tf.concat([p_mod, yS], 0)
// 	}
// 	const predT = reverseMinMaxScaling(p_mod, minVal, maxVal)
// 	let df_p_mod = new dfd.DataFrame(predT, { columns: variables })
// 	const nedT = reverseMinMaxScaling(ned, minVal, maxVal)
// 	// Create DataFrames from val and nedT
// 	const df_y = new dfd.DataFrame(val.slice(3), {
// 		columns: variables,
// 	})
// 	const df_yT = new dfd.DataFrame(nedT.slice(3), {
// 		columns: variables,
// 	})

// 	// Calculate offset
// 	const offset = df_yT.loc({ rows: [0] }).sub(df_y.loc({ rows: [0] }))
// 	df_p_mod = df_p_mod.sub(offset)
// 	// Print the result
// 	// p_mod.print()
// 	return df_p_mod
// }

async function pred_ang_coef(val, coef_modded) {
	console.log("start_predicted_the_modifications!!")

	// Scale the values
	const { scaled: val_scaled, minVal, maxVal } = minMaxScaling(val)

	// Create sliding window indices
	const wx = Array.from({ length: val.length - 2 }, (_, w) => [
		w,
		w + 1,
		w + 2,
	])
	// Prepare dataX tensor
	const dX = wx.map((indices) => indices.map((index) => val_scaled[index]))
	const dataX = tf.tensor(dX)

	let dataArray = await coef_modded.objects()
	let arrayOfArrays = dataArray.map((obj) => Object.values(obj))
	console.log(arrayOfArrays, dataX.shape[0], val.length)

	let coef_modded_resampled = await interpolate2DArray(
		arrayOfArrays,
		dataX.shape[0]
	)

	// Flatten the array of arrays
	// const flatArray = coef_modded_resampled.flat()

	// Convert the flatArray to a Tensor
	const tensor = await tf.tensor(coef_modded_resampled)

	console.log(coef_modded_resampled, dataX.shape[0], val.length, tensor.shape)

	// let originalSize = coef_modded_resampled.shape

	// // Υπολογισμός του συνολικού προϊόντος των νέων διαστάσεων
	// let newShape = [tensor.shape[0], 57, 3, 57]
	// let newSize = newShape.reduce((a, b) => a * b)

	// console.log(newSize, originalSize)

	// Reshape the tensor to the desired shape
	let reshapedTensor = await tensor.reshape([tensor.shape[0], 57, 3, 57])
	console.log("tensor: ", tensor.shape[0])
	let coef_modT = await tf.reverse(reshapedTensor, [2])

	// // Define the Hadamard product function
	// function hadamardProduct(inputs) {
	// 	const coef = inputs[0]
	// 	const inp = inputs[1]
	// 	const inp2 = inp.expandDims(1)
	// 	const m1 = coef.mul(inp2)
	// 	const m2 = m1.sum([2, 3])
	// 	return m2.expandDims(-2)
	// }

	// // Initialize p_mod with the first slice of dataX_mod
	// let p_mod = await dataX
	// 	.slice([0, 0, 0], [1, dataX.shape[1], dataX.shape[2]])
	// 	.squeeze()

	// // Iterate through the rest of the time steps
	// for (let t = 1; t < dataX.shape[0] - 1; t++) {
	// 	// Extract the current coefficient and input slices
	// 	let coeff = await coef_modT
	// 		.slice(
	// 			[t, 0, 0, 0],
	// 			[1, coef_modT.shape[1], coef_modT.shape[2], coef_modT.shape[3]]
	// 		)
	// 		.squeeze([0])
	// 	let inp = await dataX.slice(
	// 		[t, 0, 0],
	// 		[1, dataX.shape[1], dataX.shape[2]]
	// 	)

	// 	// Perform the Hadamard product
	// 	let yS = await hadamardProduct([coeff, inp])

	// 	// Reshape yS
	// 	yS = await yS.reshape([yS.shape[1], yS.shape[2]])
	// 	console.log("p_mod: ", p_mod.shape)
	// 	// Stack the result to p_mod
	// 	p_mod = await tf.concat([p_mod, yS], 0)
	// }

	function findBatchSize(totalSize, minIntegerResult = 10) {
		for (let batchSize = totalSize; batchSize >= 1; batchSize--) {
			if (
				totalSize % batchSize === 0 &&
				totalSize / batchSize >= minIntegerResult
			) {
				return batchSize
			}
		}
		return null // No suitable batch size found
	}

	// Example usage
	// const dataXShape0 = 1000 // Replace with your actual dataX.shape[0]
	// const foundBatchSize = findBatchSize(dataXShape0)
	// console.log(`Found batch size: ${foundBatchSize}`)

	// Define the Hadamard product function
	function hadamardProduct(inputs) {
		const coef = inputs[0]
		const inp = inputs[1]
		const inp2 = tf.expandDims(inp, 1)
		const m1 = coef.mul(inp2)
		const m2 = tf.sum(m1, [2, 3])
		return tf.expandDims(m2, -2)
	}

	// Initialize p_mod with the first slice of dataX_mod
	let p_mod = dataX
		.slice([0, 0, 0], [1, dataX.shape[1], dataX.shape[2]])
		.squeeze()

	// Define batch size
	const batch_size = findBatchSize(dataX.shape[0] - 1)
	console.log("batch_size: ", batch_size)

	// Iterate through the rest of the time steps in batches
	for (let t = 1; t < dataX.shape[0] - 1; t += batch_size) {
		console.log(t)
		// Extract the current coefficients and input slices
		const coeff = coef_modT.slice(
			[t, 0, 0, 0],
			[
				batch_size,
				coef_modT.shape[1],
				coef_modT.shape[2],
				coef_modT.shape[3],
			]
		)
		const inp = dataX.slice(
			[t, 0, 0],
			[batch_size, dataX.shape[1], dataX.shape[2]]
		)

		// Perform the Hadamard product
		const yS = hadamardProduct([coeff, inp])

		// console.log("coeff: ", coeff.shape)
		// console.log("inp: ", inp.shape)
		// console.log("yS: ", yS.shape)
		// console.log("p_mod: ", p_mod.shape)

		// Reshape yS
		const reshaped_yS = tf.reshape(yS, [yS.shape[0], yS.shape[2]])

		// Stack the result to p_mod
		p_mod = tf.concat([p_mod, reshaped_yS], 0)
	}

	// Print the final shape of p_mod
	console.log("Final shape of p_mod:", p_mod.shape)

	// ##########################################
	// ##########################################

	// ##########################################
	// ##########################################

	console.log(p_mod.shape)
	let p_mod_array = await p_mod.array()
	p_mod_array = p_mod_array.slice(2)
	const predT = await reverseMinMaxScaling(p_mod_array, minVal, maxVal)
	let df_pred_mod = await aq.from(predT)

	df_pred_mod = await df_pred_mod.rename(aq.names(variables))
	df_pred_mod.print()

	return { df_pred_mod }
}

export { pred_ang_coef }

function interpolate2DArray(originalArray, newRowCount) {
	const originalRowCount = originalArray.length
	const columnCount = originalArray[0].length
	const newArray = []

	const step = (originalRowCount - 1) / (newRowCount - 1)

	for (let i = 0; i < newRowCount; i++) {
		const position = i * step
		const leftIndex = Math.floor(position)
		const rightIndex = Math.ceil(position)
		const weight = position - leftIndex

		const newRow = []

		for (let j = 0; j < columnCount; j++) {
			if (leftIndex === rightIndex) {
				newRow.push(originalArray[leftIndex][j])
			} else {
				const leftValue = originalArray[leftIndex][j]
				const rightValue = originalArray[rightIndex][j]
				const interpolatedValue =
					leftValue * (1 - weight) + rightValue * weight
				newRow.push(interpolatedValue)
			}
		}

		newArray.push(newRow)
	}

	return newArray
}
