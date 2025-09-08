/**
 * Data Store
 * 
 * Manages all data-related state including:
 * - BVH file data and processing
 * - Train/test file selection
 * - Raw skeleton bones data
 */

import { createSignal } from "solid-js"

// BVH Data
const [rawSkeletenBones, setRawSkeletenBones] = createSignal([])

// File Selection
const [trainFile, setTrainFile] = createSignal(null)
const [testFile, setTestFile] = createSignal(null)
const [trainFileBones, setTrainFileBones] = createSignal([])
const [testFileBones, setTestFileBones] = createSignal([])

export {
    // BVH Data
    rawSkeletenBones, setRawSkeletenBones,
    
    // File Selection
    trainFile, setTrainFile,
    testFile, setTestFile,
    trainFileBones, setTrainFileBones,
    testFileBones, setTestFileBones
}
