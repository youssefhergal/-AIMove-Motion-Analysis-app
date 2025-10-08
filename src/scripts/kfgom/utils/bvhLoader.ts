import { BVHLoader } from "../../../../build/BVHLoader.js"      
import { skeletonsArray } from "../../stores/store"

// Independent BVH loader for KF-GOM analysis
class KFGOMBVHLoader {
    private loader: BVHLoader

    constructor() {
        this.loader = new BVHLoader()
    }

    // Load BVH file from selected files (skeletonsArray)
    async loadBVHFile(fileName: string): Promise<any> {
        return new Promise((resolve, reject) => {
            try {
                console.log(`🔄 KF-GOM Loading selected file: ${fileName}`)
                
                // Find the file in skeletonsArray (selected files)
                const skeletons = skeletonsArray()
                console.log(`🔍 KF-GOM Searching for file: ${fileName}`)
                console.log(`🔍 KF-GOM Available skeletons:`, skeletons.map(s => s.fileName))
                
                // Try to find the file with different formats
                let skeleton = skeletons.find(s => s.fileName === fileName)
                
                if (!skeleton) {
                    // Try with bvh2/ prefix
                    skeleton = skeletons.find(s => s.fileName === `bvh2/${fileName}`)
                }
                
                if (!skeleton) {
                    // Try without bvh2/ prefix (if fileName has it)
                    const cleanFileName = fileName.replace('bvh2/', '')
                    skeleton = skeletons.find(s => s.fileName === cleanFileName)
                }
                
                if (!skeleton) {
                    throw new Error(`File ${fileName} not found in selected files. Available: ${skeletons.map(s => s.fileName).join(', ')}`)
                }
                
                if (skeleton.fileContent) {
                    // File is uploaded and has content - use it directly
                    console.log(`✅ KF-GOM Found uploaded file with content: ${fileName}`)
                    const result = this.loader.parse(skeleton.fileContent)
                    console.log(`✅ KF-GOM BVH loaded from uploaded content: ${fileName} with ${result.bvhBones?.length || 0} bones`)
                    resolve(result)
                } else {
                    // File is from repository - load from bvh2/ path
                    console.log(`✅ KF-GOM Loading repository file: ${fileName}`)
                    const filePath = fileName.startsWith('bvh2/') ? fileName : `bvh2/${fileName}`
                    
                    this.loader.load(
                        filePath,
                        (result) => {
                            console.log(`✅ KF-GOM BVH loaded: ${fileName} with ${result.bvhBones?.length || 0} bones`)
                            resolve(result)
                        },
                        undefined,
                        (error) => {
                            console.error(`❌ KF-GOM BVH load failed: ${fileName}`, error)
                            reject(error)
                        }
                    )
                }
                
            } catch (error) {
                console.error(`❌ KF-GOM BVH load failed: ${fileName}`, error)
                reject(error)
            }
        })
    }

    // Extract only the bones data needed for KF-GOM analysis
    extractBonesData(bvhResult: any): any[] {
        if (!bvhResult || !bvhResult.bvhBones) {
            console.warn("No BVH bones data found in result")
            return []
        }

        // Return only the bones data without affecting the global scene
        return bvhResult.bvhBones
    }

    // Validate BVH file structure
    validateBVHStructure(bvhResult: any): boolean {
        if (!bvhResult) {
            console.error("BVH result is null or undefined")
            return false
        }

        if (!bvhResult.bvhBones || !Array.isArray(bvhResult.bvhBones)) {
            console.error("BVH bones data is missing or invalid")
            return false
        }

        if (bvhResult.bvhBones.length === 0) {
            console.error("BVH file contains no bones")
            return false
        }

        // Check if bones have the required structure
        const firstBone = bvhResult.bvhBones[0]
        if (!firstBone || !firstBone.name || !firstBone.frames) {
            console.error("BVH bones structure is invalid")
            return false
        }

        console.log(`✅ BVH structure validated: ${bvhResult.bvhBones.length} bones`)
        return true
    }
}

// Create and export a singleton instance
export const kfgomBVHLoader = new KFGOMBVHLoader() 